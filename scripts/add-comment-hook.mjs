import { readFile, writeFile } from 'node:fs/promises';

// 2026-07-10 冷啟動改版：所有 caption 在 hashtags 前插入留言鉤子，
// 導向免費贈品 Faceless YouTube Starter Checklist（Gumroad $0 收 email）
const HOOK = '💬 Comment "CHECK" and I\'ll send you my free Faceless YouTube Starter Checklist — the exact 4-phase system, zero fluff.';

const file = new URL('../posts/posts.json', import.meta.url);
const data = JSON.parse(await readFile(file, 'utf8'));

let changed = 0;
for (const post of data.posts) {
  if (post.caption.includes('Comment "CHECK"')) continue;
  const lines = post.caption.split('\n');
  // 找最後一段 hashtag 行（以 # 開頭）
  let hashIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t.startsWith('#')) hashIdx = i;
    else if (t !== '' && hashIdx !== -1) break;
  }
  if (hashIdx === -1) {
    post.caption = post.caption.trimEnd() + '\n\n' + HOOK;
  } else {
    lines.splice(hashIdx, 0, HOOK, '');
    post.caption = lines.join('\n');
  }
  changed++;
}

await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`done: ${changed}/${data.posts.length} captions updated`);
