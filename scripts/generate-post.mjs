/**
 * Carousel Auto-Generator
 * 輸入主題和支柱類型，用 Claude API 自動生成 7 張 carousel HTML + caption
 * 接著用 Playwright 渲染 PNG，完成後更新 posts.json
 *
 * 使用方式：
 *   node scripts/generate-post.mjs \
 *     --topic "How I use AI to generate passive income as an engineer" \
 *     --pillar passive-income \
 *     --id 51
 *
 * 前置需求：
 *   - ANTHROPIC_API_KEY 在 .env 或環境變數
 *   - Node.js 18+
 *   - Playwright（@playwright/test）已安裝
 *
 * 輸出：
 *   - assets/post-[id]/01.png ~ 07.png
 *   - posts.json 更新（新條目加到末尾）
 */

import { generateWithFallback, textFromResponse } from '../../scripts/lib/claude-client.js';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// === Parse CLI args ===
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const TOPIC = get('--topic');
const PILLAR = get('--pillar') || 'ai-tools';
const POST_ID = parseInt(get('--id') || '0');

if (!TOPIC || !POST_ID) {
  console.error('Usage: node scripts/generate-post.mjs --topic "..." --pillar ai-tools --id 51');
  process.exit(1);
}

const PILLAR_LABELS = {
  'ai-tools': 'AI Tools',
  'passive-income': 'Passive Income',
  'wealth-mindset': 'Wealth Mindset',
  'bts': 'Behind the Scenes',
};

// === Design System ===
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

// === Claude Prompt ===
// 這段規則每次呼叫都相同（不管主題/pillar），適合做 prompt caching
function buildSystem() {
  return `You are creating a 7-slide Instagram carousel for @alphaengineer.ai — an account for engineers building AI-powered passive income.

Create:
1. The complete HTML for all 7 slides (one HTML file, all slides with id="p1" through id="p7")
2. An Instagram/Threads caption (max 490 characters, include 8-10 hashtags)

SLIDE STRUCTURE:
- Slide 1 (p1): Cover — Tag, Bold headline (h1 with <span> for key phrase in cyan), subtitle in .muted
- Slides 2-6 (p2-p6): Content slides — Each with a .panel containing h2 and either ul or p content
- Slide 7 (p7): CTA — Bold closing statement (h1), 1 sentence, .cta-line with follow CTA

DESIGN RULES:
- Use the CSS classes exactly as given (tag, panel, h1, h2, ul, li with .icon, .muted, .cta-line, .handle, .slide-num)
- Each slide has: <div class="handle">@alphaengineer.ai</div> and <div class="slide-num">X / 7</div>
- Keep content tight — 4-5 bullet points max per content slide
- Use real numbers, specific tools, actionable advice
- Icons in li: use emoji as .icon content (→ ✓ ✗ 1. 2. etc.)

CSS to include in <style> tag:
${CSS}

FONT IMPORT (in <head>):
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">

CAPTION RULES:
- First line is the hook (same as slide 1 headline, slightly shortened)
- Body: 3-4 value bullet points using →
- End: "Follow for more [relevant topic] every week."
- Then hashtags on new line

Return your response using these exact XML markers (no JSON, the HTML content makes JSON unreliable):

<HTML>
<!DOCTYPE html>
...full HTML here...
</HTML>

<CAPTION>
Hook line

→ Point 1
→ Point 2
→ Point 3

Follow for more...

#hashtag1 #hashtag2...
</CAPTION>`;
}

function buildUserPrompt(topic, pillar) {
  return `TOPIC: "${topic}"
PILLAR: ${PILLAR_LABELS[pillar] || pillar}`;
}

// === Generate with Claude ===
async function generateContent(topic, pillar) {
  console.log('🤖 Calling Claude API...');

  const { response } = await generateWithFallback({
    system: buildSystem(),
    messages: [{ role: 'user', content: buildUserPrompt(topic, pillar) }],
    maxTokens: 12000, // Fable 5 的 thinking 會吃掉一部分預算，留足夠頸間
  });

  const raw = textFromResponse(response);

  const htmlMatch = raw.match(/<HTML>([\s\S]*?)<\/HTML>/);
  const captionMatch = raw.match(/<CAPTION>([\s\S]*?)<\/CAPTION>/);

  if (!htmlMatch || !captionMatch) {
    throw new Error('Response missing <HTML> or <CAPTION> markers. Got: ' + raw.slice(0, 200));
  }

  return {
    html: htmlMatch[1].trim(),
    caption: captionMatch[1].trim(),
  };
}

// === Render with Playwright ===
async function renderSlides(html, postId) {
  const outDir = join(ROOT, 'assets', `post-${postId}`);
  mkdirSync(outDir, { recursive: true });

  const tmpHtml = join(outDir, '_carousel.html');
  writeFileSync(tmpHtml, html, 'utf8');

  console.log('🎨 Rendering slides with Playwright...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

  await page.goto('file://' + tmpHtml.replace(/\\/g, '/'));
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(800);

  const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  for (let i = 0; i < ids.length; i++) {
    const el = await page.$('#' + ids[i]);
    if (!el) { console.warn(`  ⚠️  Slide #${ids[i]} not found — skipping`); continue; }
    const num = String(i + 1).padStart(2, '0');
    await el.screenshot({ path: join(outDir, `${num}.png`) });
    console.log(`  ✅ Saved ${num}.png`);
  }

  await browser.close();

  // Clean up temp HTML
  import('fs').then(fs => fs.unlinkSync(tmpHtml)).catch(() => {});

  return ids.map((_, i) => `assets/post-${postId}/${String(i + 1).padStart(2, '0')}.png`);
}

// === Update posts.json ===
function updatePostsJson(postId, pillar, caption, images) {
  const jsonPath = join(ROOT, 'posts', 'posts.json');
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));

  // Check for duplicate id
  if (data.posts.find(p => p.id === postId)) {
    throw new Error(`Post #${postId} already exists in posts.json`);
  }

  data.posts.push({ id: postId, pillar, caption, images });
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`📝 Updated posts.json — now ${data.posts.length} posts`);
}

// === Main ===
async function main() {
  console.log(`\n🚀 Generating post #${POST_ID}`);
  console.log(`   Topic: ${TOPIC}`);
  console.log(`   Pillar: ${PILLAR}\n`);

  const { html, caption } = await generateContent(TOPIC, PILLAR);
  const images = await renderSlides(html, POST_ID);
  updatePostsJson(POST_ID, PILLAR, caption, images);

  console.log(`\n✅ Post #${POST_ID} complete!`);
  console.log(`   Images: assets/post-${POST_ID}/01-07.png`);
  console.log(`   Next: git add assets/post-${POST_ID} posts/posts.json && git commit && git push`);
  console.log(`   Then: node scripts/cdn-warmup.mjs --post ${POST_ID}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
