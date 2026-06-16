// YouTube Shorts — carousel 圖片 → ffmpeg slideshow → YouTube Data API v3 上傳
// ffmpeg 在 ubuntu-latest runner 上預裝，無需額外安裝
// OAuth setup: console.cloud.google.com → YouTube Data API v3 → OAuth 2.0 credentials
// 取得 refresh token: developers.google.com/oauthplayground（scope: youtube.upload）

import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, statSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OAUTH_URL = 'https://oauth2.googleapis.com/token';
const YT_UPLOAD = 'https://www.googleapis.com/upload/youtube/v3/videos';

async function getAccessToken() {
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`YouTube OAuth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

export async function postToYouTube({ post, rawUrl }) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    console.log('[YouTube] secrets not set, skipping');
    return;
  }

  const tmpDir = join(tmpdir(), `yt-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    // 1. Download carousel images
    const imgPaths = [];
    for (let i = 0; i < post.images.length; i++) {
      const dest = join(tmpDir, `${String(i).padStart(2, '0')}.png`);
      await downloadImage(rawUrl(post.images[i]), dest);
      imgPaths.push(dest);
    }

    // 2. Build ffmpeg concat file (each slide shown for 3 seconds)
    const concatFile = join(tmpDir, 'concat.txt');
    writeFileSync(concatFile, imgPaths.map((p) => `file '${p}'\nduration 3`).join('\n') + '\n');

    // 3. Render vertical 1080x1920 video for Shorts (black-bar letterbox)
    const videoPath = join(tmpDir, 'output.mp4');
    execSync(
      `ffmpeg -f concat -safe 0 -i "${concatFile}" ` +
      `-vf "scale=1080:1080,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,setsar=1" ` +
      `-c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -movflags +faststart "${videoPath}"`,
      { stdio: 'inherit' },
    );

    // 4. OAuth token
    const accessToken = await getAccessToken();

    // 5. Initiate resumable upload
    const title = post.caption.split('\n')[0].slice(0, 97) + ' #Shorts';
    const metadata = {
      snippet: {
        title,
        description: post.caption,
        tags: ['Shorts', 'AI', 'SideHustle', 'PassiveIncome'],
        defaultLanguage: 'en',
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    };
    const fileSize = statSync(videoPath).size;

    const initRes = await fetch(`${YT_UPLOAD}?uploadType=resumable&part=snippet,status`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': String(fileSize),
        'X-Upload-Content-Type': 'video/mp4',
      },
      body: JSON.stringify(metadata),
    });
    if (!initRes.ok) throw new Error(`YouTube upload init failed: ${initRes.status} ${await initRes.text()}`);
    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) throw new Error('YouTube did not return upload URL');

    // 6. Upload video bytes
    const videoBytes = readFileSync(videoPath);
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(fileSize),
      },
      body: videoBytes,
    });
    if (!uploadRes.ok) throw new Error(`YouTube upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
    const result = await uploadRes.json();
    console.log('[YouTube] published:', `https://youtube.com/shorts/${result.id}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
