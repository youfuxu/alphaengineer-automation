// TikTok Content Posting API — Photo Mode
// Requires: Content Posting API 開啟 + 審核通過（申請後需等數天）
// Developer portal: https://developers.tiktok.com
// Scopes: video.publish

const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const API = 'https://open.tiktokapis.com/v2';

async function refreshAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: process.env.TIKTOK_REFRESH_TOKEN,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`TikTok token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function postToTikTok({ post, rawUrl }) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
  if (!clientKey || !clientSecret || !refreshToken) {
    console.log('[TikTok] secrets not set, skipping');
    return;
  }

  const accessToken = await refreshAccessToken();

  // TikTok title: 150 char limit; strip hashtags for title, keep in description
  const title = post.caption.split('\n')[0].slice(0, 150);

  const body = {
    media_type: 'PHOTO',
    post_mode: 'DIRECT_POST',
    post_info: {
      title,
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_comment: false,
      disable_duet: false,
      disable_stitch: false,
    },
    source_info: {
      source: 'PULL_FROM_URL',
      photo_images: post.images.map((p) => rawUrl(p)),
      photo_cover_index: 0,
    },
  };

  const res = await fetch(`${API}/post/publish/content/init/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error?.code && data.error.code !== 'ok') {
    throw new Error(`TikTok API: ${JSON.stringify(data.error)}`);
  }
  console.log('[TikTok] published:', data.data?.publish_id);
}
