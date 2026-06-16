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

const PUBLISHERS = [
  { name: 'Instagram', fn: postToInstagram },
  { name: 'Threads',   fn: postToThreads   },
  { name: 'TikTok',    fn: postToTikTok    },
  { name: 'YouTube',   fn: postToYouTube   },
];

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
