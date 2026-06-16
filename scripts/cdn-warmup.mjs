/**
 * CDN Warmup Script
 * 呼叫 jsdelivr CDN 預熱所有新增 post 的圖片，
 * 確保 GitHub Actions 發文時圖片已緩存（避免首次載入 404 或延遲）
 *
 * 使用方式：
 *   node scripts/cdn-warmup.mjs              # 預熱最新 10 篇
 *   node scripts/cdn-warmup.mjs --all        # 預熱所有篇
 *   node scripts/cdn-warmup.mjs --post 41    # 預熱指定 post id
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/youfuxu/alphaengineer-automation@main';

const args = process.argv.slice(2);
const warmAll = args.includes('--all');
const postArg = args.indexOf('--post');
const specificPost = postArg !== -1 ? parseInt(args[postArg + 1]) : null;

async function warmUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    const status = res.status;
    const icon = status === 200 ? '✅' : (status === 206 ? '✅' : '⚠️');
    console.log(`  ${icon} ${status} ${url.split('/').slice(-2).join('/')}`);
    return status;
  } catch (err) {
    console.log(`  ❌ ${url.split('/').slice(-2).join('/')} — ${err.message}`);
    return 0;
  }
}

async function warmPost(post) {
  console.log(`\n🔥 Warming post #${post.id}...`);
  const urls = (post.images || []).map(img => `${CDN_BASE}/${img}`);
  const results = await Promise.all(urls.map(warmUrl));
  const ok = results.filter(s => s === 200 || s === 206).length;
  console.log(`   ${ok}/${urls.length} OK`);
  return ok;
}

async function main() {
  const postsData = JSON.parse(readFileSync(join(ROOT, 'posts/posts.json'), 'utf8'));
  const posts = postsData.posts;

  let toWarm;
  if (specificPost) {
    toWarm = posts.filter(p => p.id === specificPost);
    if (toWarm.length === 0) {
      console.error(`Post #${specificPost} not found`);
      process.exit(1);
    }
  } else if (warmAll) {
    toWarm = posts;
  } else {
    // Default: warm latest 10 posts
    toWarm = posts.slice(-10);
  }

  console.log(`📡 CDN Warmup — ${toWarm.length} post(s), ${toWarm.length * 7} URLs`);

  let totalOk = 0;
  for (const post of toWarm) {
    totalOk += await warmPost(post);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  const total = toWarm.length * 7;
  console.log(`\n✅ Done: ${totalOk}/${total} URLs warmed successfully`);
  if (totalOk < total) {
    console.log('⚠️  Some URLs returned non-200. Wait 2-3 minutes and retry, or push to GitHub first.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
