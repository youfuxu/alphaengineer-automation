import { readFile } from 'node:fs/promises';
import { postToInstagram } from './publishers/instagram.mjs';
import { postToThreads } from './publishers/threads.mjs';
import { postToTikTok } from './publishers/tiktok.mjs';
import { postToYouTube } from './publishers/youtube.mjs';

const REPO = process.env.GITHUB_REPOSITORY;
const BRANCH = process.env.GITHUB_REF_NAME || 'main';

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function rawUrl(path) {
  return `https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}/${path}`;
}

const { posts } = JSON.parse(
  await readFile(new URL('../posts/posts.json', import.meta.url), 'utf8'),
);
if (!posts.length) throw new Error('posts.json has no posts');

const weekNum = getISOWeek(new Date());
const post = posts[weekNum % posts.length];
console.log(`Week ${weekNum} -> post #${post.id}: ${post.caption.slice(0, 60)}...`);

const ALL_PUBLISHERS = [
  { name: 'Instagram', fn: postToInstagram },
  { name: 'Threads',   fn: postToThreads   },
  { name: 'TikTok',    fn: postToTikTok    },
  { name: 'YouTube',   fn: postToYouTube   },
];

// ONLY_PLATFORMS=Threads,IG 之類的逗號分隔清單，可只重試特定平台（例如某平台當週發布失敗，
// 其他平台已成功，不想重複發文）。留空則照舊全部平台都跑。
const onlyFilter = (process.env.ONLY_PLATFORMS || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const PUBLISHERS = onlyFilter.length
  ? ALL_PUBLISHERS.filter((p) => onlyFilter.includes(p.name.toLowerCase()))
  : ALL_PUBLISHERS;
if (onlyFilter.length) console.log(`ONLY_PLATFORMS filter active: ${PUBLISHERS.map((p) => p.name).join(', ')}`);

const ctx = { post, rawUrl };
const results = await Promise.allSettled(PUBLISHERS.map(({ fn }) => fn(ctx)));

let anyFailed = false;
for (const [i, result] of results.entries()) {
  if (result.status === 'rejected') {
    console.error(`[${PUBLISHERS[i].name}] ERROR:`, result.reason?.message ?? result.reason);
    anyFailed = true;
  }
}
if (anyFailed) process.exit(1);
