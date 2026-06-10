import { readFile } from 'node:fs/promises';

const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const REPO = process.env.GITHUB_REPOSITORY;
const BRANCH = process.env.GITHUB_REF_NAME || 'main';
const API = 'https://graph.instagram.com/v21.0';

if (!ACCESS_TOKEN || !IG_USER_ID) {
  throw new Error('Missing IG_ACCESS_TOKEN or IG_USER_ID secrets');
}

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

async function api(path, params) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`IG API error on ${path}: ${JSON.stringify(data.error)}`);
  return data;
}

async function waitUntilReady(containerId) {
  for (let i = 0; i < 20; i++) {
    const url = new URL(`${API}/${containerId}`);
    url.searchParams.set('fields', 'status_code');
    url.searchParams.set('access_token', ACCESS_TOKEN);
    const res = await fetch(url);
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error(`Container ${containerId} failed processing`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`Container ${containerId} timed out waiting for FINISHED`);
}

const { posts } = JSON.parse(await readFile(new URL('../posts/posts.json', import.meta.url), 'utf8'));
if (!posts.length) throw new Error('posts.json has no posts');

const weekNum = getISOWeek(new Date());
const post = posts[weekNum % posts.length];
console.log(`Week ${weekNum} -> posting #${post.id}: ${post.caption.slice(0, 60)}...`);

let creationId;
if (post.images.length === 1) {
  const { id } = await api(`${IG_USER_ID}/media`, {
    image_url: rawUrl(post.images[0]),
    caption: post.caption,
  });
  await waitUntilReady(id);
  creationId = id;
} else {
  const childIds = [];
  for (const img of post.images) {
    const { id } = await api(`${IG_USER_ID}/media`, {
      image_url: rawUrl(img),
      is_carousel_item: 'true',
    });
    await waitUntilReady(id);
    childIds.push(id);
  }
  const { id } = await api(`${IG_USER_ID}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption: post.caption,
  });
  await waitUntilReady(id);
  creationId = id;
}

const result = await api(`${IG_USER_ID}/media_publish`, { creation_id: creationId });
console.log('Published:', result);
