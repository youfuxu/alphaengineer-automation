// Auto-reply to "CHECK" keyword comments with the free checklist link.
// Threads: needs threads_read_replies + threads_manage_replies scopes.
// Instagram: needs instagram_manage_comments scope.
// State: data/replied.json keeps IDs we already replied to (committed by workflow).
// DRY_RUN=true prints matches without replying or writing state.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const KEYWORD = /\bcheck\b/i;
const REPLY_TEXT = 'Sent! Grab it free here → https://alphatech4.gumroad.com/l/faceless-checklist 🔥';
const STATE_FILE = new URL('../data/replied.json', import.meta.url);
const DRY = process.env.DRY_RUN === 'true';

const THREADS_API = 'https://graph.threads.net/v1.0';
const IG_API = 'https://graph.facebook.com/v21.0';

async function getJSON(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

async function postJSON(base, path, params, token) {
  const url = new URL(`${base}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

async function loadState() {
  try { return new Set(JSON.parse(await readFile(STATE_FILE, 'utf8'))); }
  catch { return new Set(); }
}

async function saveState(state) {
  await mkdir(new URL('../data/', import.meta.url), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify([...state], null, 2) + '\n');
}

async function runThreads(state) {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) { console.log('[Threads] secrets not set, skipping'); return 0; }

  let me = null;
  try {
    me = (await getJSON(`${THREADS_API}/me?fields=username&access_token=${token}`)).username;
  } catch (e) { console.log('[Threads] me lookup failed (non-fatal):', e.message); }

  const posts = await getJSON(
    `${THREADS_API}/${userId}/threads?fields=id,text,timestamp&limit=25&access_token=${token}`
  );

  let count = 0;
  for (const post of posts.data ?? []) {
    let replies;
    try {
      replies = await getJSON(
        `${THREADS_API}/${post.id}/replies?fields=id,text,username&limit=50&access_token=${token}`
      );
    } catch (e) {
      throw new Error(`[Threads] cannot read replies (check threads_read_replies scope): ${e.message}`);
    }

    for (const r of replies.data ?? []) {
      if (state.has(r.id)) continue;
      if (me && r.username === me) continue;
      if (!KEYWORD.test(r.text ?? '')) continue;

      console.log(`[Threads] match on post ${post.id}: @${r.username}: "${(r.text ?? '').slice(0, 60)}"`);
      if (DRY) { console.log('[Threads] DRY RUN — would reply'); continue; }

      const { id: creationId } = await postJSON(THREADS_API, `${userId}/threads`, {
        media_type: 'TEXT',
        text: REPLY_TEXT,
        reply_to_id: r.id,
      }, token);
      const pub = await postJSON(THREADS_API, `${userId}/threads_publish`, { creation_id: creationId }, token);
      console.log(`[Threads] replied: ${pub.id}`);
      state.add(r.id);
      count++;
    }
  }
  return count;
}

async function runInstagram(state) {
  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!token || !igUserId) { console.log('[IG] secrets not set, skipping'); return 0; }

  const media = await getJSON(
    `${IG_API}/${igUserId}/media?fields=id,caption&limit=10&access_token=${token}`
  );

  let count = 0;
  for (const m of media.data ?? []) {
    let comments;
    try {
      comments = await getJSON(
        `${IG_API}/${m.id}/comments?fields=id,text,username&limit=50&access_token=${token}`
      );
    } catch (e) {
      throw new Error(`[IG] cannot read comments (check instagram_manage_comments scope): ${e.message}`);
    }

    for (const c of comments.data ?? []) {
      if (state.has(c.id)) continue;
      if (!KEYWORD.test(c.text ?? '')) continue;

      console.log(`[IG] match on media ${m.id}: @${c.username}: "${(c.text ?? '').slice(0, 60)}"`);
      if (DRY) { console.log('[IG] DRY RUN — would reply'); continue; }

      const data = await postJSON(IG_API, `${c.id}/replies`, { message: REPLY_TEXT }, token);
      console.log(`[IG] replied: ${data.id}`);
      state.add(c.id);
      count++;
    }
  }
  return count;
}

const state = await loadState();
const before = state.size;

let threadsCount = 0, igCount = 0;
const errors = [];

try { threadsCount = await runThreads(state); } catch (e) { errors.push(e.message); }
try { igCount = await runInstagram(state); } catch (e) { errors.push(e.message); }

if (!DRY && state.size !== before) await saveState(state);
console.log(`done. threads=${threadsCount} ig=${igCount} newState=${state.size - before}`);

if (errors.length) {
  for (const e of errors) console.error('ERROR:', e);
  process.exit(1);
}
