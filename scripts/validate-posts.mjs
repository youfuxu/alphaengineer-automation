import { readFileSync } from 'fs';
import { resolve } from 'path';

const file = resolve('posts/posts.json');
const { posts } = JSON.parse(readFileSync(file, 'utf8'));

let ok = true;
const ids = new Set();

for (const p of posts) {
  if (typeof p.id !== 'number') { console.error(`❌ post missing numeric id:`, p); ok = false; }
  if (ids.has(p.id)) { console.error(`❌ duplicate id: ${p.id}`); ok = false; }
  ids.add(p.id);
  if (!p.caption || typeof p.caption !== 'string') { console.error(`❌ post ${p.id}: missing caption`); ok = false; }
  if (!Array.isArray(p.images) || p.images.length === 0) { console.error(`❌ post ${p.id}: no images`); ok = false; }
}

if (ok) console.log(`✅ posts.json valid — ${posts.length} posts, ids ${Math.min(...ids)}–${Math.max(...ids)}`);
else process.exit(1);
