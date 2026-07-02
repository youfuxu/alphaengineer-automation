/**
 * Image-only generator: generate carousel PNGs for existing posts.json entries
 * Reads caption from posts.json, generates HTML via Claude, renders with Playwright
 * Does NOT modify posts.json
 *
 * Usage:
 *   node scripts/generate-images-only.mjs --start 81 --end 90
 *   node scripts/generate-images-only.mjs --id 81
 */

import { generateWithFallback, textFromResponse } from '../../scripts/lib/claude-client.js';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const START_ID = get('--start') ? parseInt(get('--start')) : null;
const END_ID   = get('--end')   ? parseInt(get('--end'))   : null;
const SINGLE   = get('--id')    ? parseInt(get('--id'))    : null;

const PILLAR_LABELS = {
  'ai-tools':      'AI Tools',
  'passive-income':'Passive Income',
  'wealth-mindset':'Wealth Mindset',
  'bts':           'Behind the Scenes',
};

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1080px; background: #060810; }
.slide { width: 1080px; height: 1080px; background: #0D1117; position: relative; display: flex; flex-direction: column; justify-content: center; padding: 80px 90px 80px 104px; overflow: hidden; font-family: 'Inter', sans-serif; }
.slide::before { content: ''; position: absolute; left: 0; top: 0; width: 6px; height: 100%; background: #00D4FF; }
.slide::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px); background-size: 60px 60px; opacity: 0.30; pointer-events: none; }
.panel { background: #161B22; border: 1px solid #1E2A30; border-radius: 12px; padding: 36px 40px; position: relative; z-index: 1; }
.tag { display: inline-block; background: rgba(0,212,255,0.12); color: #00D4FF; font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 18px; border-radius: 6px; margin-bottom: 28px; }
h1 { font-family: 'Space Grotesk', sans-serif; font-size: 60px; font-weight: 700; color: #E6EDF3; line-height: 1.08; letter-spacing: -0.02em; margin-bottom: 32px; }
h1 span { color: #00D4FF; }
h2 { font-family: 'Space Grotesk', sans-serif; font-size: 44px; font-weight: 700; color: #E6EDF3; line-height: 1.15; margin-bottom: 28px; }
h2 span { color: #00D4FF; }
p { font-size: 28px; color: #C9D1D9; line-height: 1.6; }
.muted { font-size: 24px; color: #768F92; margin-top: 20px; }
.slide-num { position: absolute; bottom: 52px; right: 72px; font-family: 'Space Grotesk', sans-serif; font-size: 22px; color: #768F92; z-index: 2; }
.handle { position: absolute; bottom: 52px; left: 104px; font-family: 'Space Grotesk', sans-serif; font-size: 22px; color: #768F92; z-index: 2; }
ul { list-style: none; margin-top: 8px; }
ul li { font-size: 27px; color: #C9D1D9; line-height: 1.55; padding: 10px 0; border-bottom: 1px solid #1E2A30; display: flex; align-items: flex-start; gap: 18px; }
ul li:last-child { border-bottom: none; }
ul li .icon { color: #00D4FF; font-size: 26px; flex-shrink: 0; margin-top: 2px; }
.cta-line { font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 700; color: #00D4FF; margin-top: 28px; border-top: 1px solid #1E2A30; padding-top: 24px; }
`.trim();

// 這段規則每次呼叫都相同（不管 caption/pillar），適合做 prompt caching
function buildSystem() {
  return `You are creating a 7-slide Instagram carousel for @alphaengineer.ai — an account for engineers building AI-powered passive income.

Create the complete HTML for all 7 slides (one HTML file, slides with id="p1" through id="p7"), matching the caption the user provides (extract the key points from it).

SLIDE STRUCTURE:
- Slide 1 (p1): Cover — Tag (pillar label), Bold headline (h1 with <span> for key phrase in cyan), subtitle in .muted
- Slides 2-6 (p2-p6): Content slides — Each with a .panel containing h2 and either ul or p content
- Slide 7 (p7): CTA — Bold closing statement (h1), .cta-line with follow CTA

DESIGN RULES:
- Use the CSS classes exactly as given (tag, panel, h1, h2, ul, li with .icon, .muted, .cta-line, .handle, .slide-num)
- Each slide has: <div class="handle">@alphaengineer.ai</div> and <div class="slide-num">X / 7</div>
- Keep content tight — 4-5 bullet points max per content slide
- Icons in li: use emoji as .icon content (→ ✓ ✗ 💡 ✅ etc.)

CSS to include in <style> tag:
${CSS}

FONT IMPORT (in <head>):
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">

Return ONLY the HTML, wrapped in <HTML>...</HTML> tags. No other text.

<HTML>
...your HTML here...
</HTML>`;
}

function buildUserPrompt(caption, pillar) {
  return `PILLAR: ${PILLAR_LABELS[pillar] || pillar}

CAPTION:
---
${caption}
---`;
}

async function generateHtml(caption, pillar) {
  const { response } = await generateWithFallback({
    system: buildSystem(),
    messages: [{ role: 'user', content: buildUserPrompt(caption, pillar) }],
    maxTokens: 9000, // Fable 5 的 thinking 會吃掉一部分預算，留足夠頸間
  });
  const raw = textFromResponse(response);
  // Try <HTML>...</HTML> first, then fall back to ```html...``` code block
  const xmlMatch = raw.match(/<HTML>([\s\S]*?)<\/HTML>/i);
  if (xmlMatch) return xmlMatch[1].trim();
  const mdMatch = raw.match(/```html\s*([\s\S]*?)```/i);
  if (mdMatch) return mdMatch[1].trim();
  // Last resort: if it looks like raw HTML
  if (raw.trim().startsWith('<!DOCTYPE') || raw.trim().startsWith('<html')) return raw.trim();
  throw new Error('No HTML found in response. Got: ' + raw.slice(0, 200));
}

async function renderSlides(html, postId) {
  const outDir = join(ROOT, 'assets', `post-${postId}`);
  mkdirSync(outDir, { recursive: true });

  const tmpHtml = join(outDir, '_carousel.html');
  writeFileSync(tmpHtml, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto('file://' + tmpHtml.replace(/\\/g, '/'));
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);

  for (let i = 1; i <= 7; i++) {
    const el = await page.$(`#p${i}`);
    if (!el) { console.warn(`  ⚠️  Slide #p${i} not found`); continue; }
    const num = String(i).padStart(2, '0');
    await el.screenshot({ path: join(outDir, `${num}.png`) });
    console.log(`  ✅ ${num}.png`);
  }
  await browser.close();
  try { import('fs').then(fs => fs.unlinkSync(tmpHtml)); } catch {}
}

async function processPost(post) {
  console.log(`\n🚀 Post #${post.id} [${post.pillar}]`);
  console.log(`   "${post.caption.split('\n')[0].substring(0, 60)}"`);
  const html = await generateHtml(post.caption, post.pillar);
  await renderSlides(html, post.id);
  console.log(`   ✅ Done — assets/post-${post.id}/01-07.png`);
}

async function main() {
  const data = JSON.parse(readFileSync(join(ROOT, 'posts', 'posts.json'), 'utf8'));

  let targets;
  if (SINGLE) {
    targets = data.posts.filter(p => p.id === SINGLE);
  } else if (START_ID && END_ID) {
    targets = data.posts.filter(p => p.id >= START_ID && p.id <= END_ID);
  } else {
    console.error('Usage: --id N  or  --start N --end M');
    process.exit(1);
  }

  if (targets.length === 0) {
    console.error('No matching posts found.');
    process.exit(1);
  }

  console.log(`Generating images for ${targets.length} posts...`);
  for (const post of targets) {
    await processPost(post);
  }

  console.log('\n✅ All done!');
  console.log('Next: git add assets/ posts/posts.json && git commit -m "add posts #81-90" && git push');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
