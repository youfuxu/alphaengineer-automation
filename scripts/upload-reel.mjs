// Upload reel_01 to Instagram Reels via Graph API
// Usage: node scripts/upload-reel.mjs

const API = 'https://graph.instagram.com/v21.0';
const token = process.env.IG_ACCESS_TOKEN;
const userId = process.env.IG_USER_ID;

if (!token || !userId) {
  console.error('Missing IG_ACCESS_TOKEN or IG_USER_ID env vars');
  process.exit(1);
}

const VIDEO_URL =
  'https://cdn.jsdelivr.net/gh/youfuxu/alphaengineer-automation@main/reels/reel_01_final.mp4';

const CAPTION = `Stop trading hours for dollars.

This engineer uses AI to build income streams that never sleep. 🤖💰

How it works:
✅ AI video tools (Higgsfield) → cinematic content with no crew
✅ AI voiceover (ElevenLabs) → no mic, no studio needed
✅ GitHub automation → posts while you sleep

The workflow that runs this channel costs less than a coffee per day.

Which tool would you start with? Drop it below 👇

🔗 Free AI voice → https://try.elevenlabs.io/alphaengineer-ig

#AlphaEngineer #AITools #PassiveIncome #SideHustle #EngineerLife #AIVideo #FacelessContent #BuildInPublic #FinancialFreedom`;

async function apiPost(path, params) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`IG API ${path}: ${JSON.stringify(data.error)}`);
  return data;
}

async function waitReady(containerId) {
  console.log(`Waiting for container ${containerId} to finish processing...`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const url = new URL(`${API}/${containerId}`);
    url.searchParams.set('fields', 'status_code,status');
    url.searchParams.set('access_token', token);
    const res = await fetch(url);
    const { status_code, status } = await res.json();
    console.log(`  [${i + 1}/30] status_code=${status_code} status=${status}`);
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR') throw new Error(`Container ${containerId} failed: ${status}`);
  }
  throw new Error('Timed out waiting for container');
}

async function main() {
  console.log('Creating Reel media container...');
  console.log('Video URL:', VIDEO_URL);

  const { id: containerId } = await apiPost(`${userId}/media`, {
    media_type: 'REELS',
    video_url: VIDEO_URL,
    caption: CAPTION,
    share_to_feed: 'true',
  });
  console.log('Container ID:', containerId);

  await waitReady(containerId);

  console.log('Publishing Reel...');
  const { id: postId } = await apiPost(`${userId}/media_publish`, {
    creation_id: containerId,
  });
  console.log('✅ Reel published! Post ID:', postId);
  console.log(`View at: https://www.instagram.com/p/${postId}/`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
