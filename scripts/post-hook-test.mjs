// Threads Hook 測試 — 純文字自動發文（與每週 IG/Threads 輪播完全分開）
//
// 用法：
//   node scripts/post-hook-test.mjs            -> 依日期/時段自動挑當前該發的那一支
//   DRY_RUN=1 node scripts/post-hook-test.mjs  -> 只印出會發什麼，不打 API
//   INDEX=3 node scripts/post-hook-test.mjs     -> 強制發第 3 支（手動測試/補發）
//
// slot 邏輯：start_date 起算，每天兩個時段。
//   AM slot = cron '30 12 * * *'（台灣 20:30）-> 當天第 0 支
//   PM slot = cron '0 14 * * *'（台灣 22:00）-> 當天第 1 支
//   排程觸發時用 CRON env（workflow 傳入 github.event.schedule）判斷時段——
//   不能看執行當下時鐘：GitHub Actions cron 固定延遲 2-4 小時，12:30 UTC 的場次
//   實際都在 13:00 後才跑，用時鐘判斷會把 AM 全誤判成 PM（2026-06-29~07-02 實際踩過）。
//   手動觸發（無 CRON）才 fallback 用 UTC 時鐘。
//   index = daysSinceStart * 2 + slotOffset；超出 0..19 範圍 -> 不發（測試已結束/未開始）

import { readFile } from 'node:fs/promises';

const API = 'https://graph.threads.net/v1.0';

async function apiCall(path, params, token) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`Threads API ${path}: ${JSON.stringify(data.error)}`);
  return data;
}

async function waitReady(containerId, token) {
  for (let i = 0; i < 20; i++) {
    const url = new URL(`${API}/${containerId}`);
    url.searchParams.set('fields', 'status,error_message');
    url.searchParams.set('access_token', token);
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'FINISHED') return;
    if (data.status === 'ERROR') throw new Error(`container error: ${data.error_message}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`container ${containerId} timed out`);
}

async function postTextToThreads(text, token, userId) {
  const safe = text.length > 500 ? text.slice(0, 497) + '...' : text;
  const { id } = await apiCall(`${userId}/threads`, { media_type: 'TEXT', text: safe }, token);
  await waitReady(id, token);
  const result = await apiCall(`${userId}/threads_publish`, { creation_id: id }, token);
  return result.id;
}

function pickIndex(cfg) {
  if (process.env.INDEX != null && process.env.INDEX !== '') {
    return Number(process.env.INDEX);
  }
  const now = new Date();
  const start = new Date(`${cfg.start_date}T00:00:00Z`);
  const daysSinceStart = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86400000);
  const cron = (process.env.CRON || '').trim();
  let slotOffset;
  if (cron === '30 12 * * *') slotOffset = 0;      // AM slot（台灣 20:30 場）
  else if (cron === '0 14 * * *') slotOffset = 1;  // PM slot（台灣 22:00 場）
  else slotOffset = now.getUTCHours() < 13 ? 0 : 1; // 手動觸發 fallback
  return daysSinceStart * 2 + slotOffset;
}

const cfg = JSON.parse(await readFile(new URL('../posts/hook-test.json', import.meta.url), 'utf8'));
const index = pickIndex(cfg);

if (index < 0 || index >= cfg.posts.length) {
  console.log(`[hook-test] index ${index} 不在 0..${cfg.posts.length - 1} 範圍內，今天此時段不發（測試未開始或已結束）。`);
  process.exit(0);
}

const post = cfg.posts[index];
console.log(`[hook-test] index ${index} | Day ${post.day} ${post.slot} | ${post.ref} (${post.hook})`);
console.log('--- text ---');
console.log(post.text);
console.log('------------');

if (process.env.DRY_RUN) {
  console.log('[hook-test] DRY_RUN：未實際發文。');
  process.exit(0);
}

const token = process.env.THREADS_ACCESS_TOKEN;
const userId = process.env.THREADS_USER_ID;
if (!token || !userId) {
  console.error('[hook-test] THREADS_ACCESS_TOKEN / THREADS_USER_ID 未設定，無法發文。');
  process.exit(1);
}

const publishedId = await postTextToThreads(post.text, token, userId);
console.log(`[hook-test] ✅ Threads published: ${publishedId} (${post.ref})`);
