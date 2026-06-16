const API = 'https://graph.instagram.com/v21.0';

async function apiCall(path, params, token) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`IG API ${path}: ${JSON.stringify(data.error)}`);
  return data;
}

async function waitReady(containerId, token) {
  for (let i = 0; i < 20; i++) {
    const url = new URL(`${API}/${containerId}`);
    url.searchParams.set('fields', 'status_code');
    url.searchParams.set('access_token', token);
    const res = await fetch(url);
    const { status_code } = await res.json();
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR') throw new Error(`IG container ${containerId} failed`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`IG container ${containerId} timed out`);
}

export async function postToInstagram({ post, rawUrl }) {
  const token = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;
  if (!token || !userId) { console.log('[IG] secrets not set, skipping'); return; }

  let creationId;
  if (post.images.length === 1) {
    const { id } = await apiCall(`${userId}/media`, {
      image_url: rawUrl(post.images[0]),
      caption: post.caption,
    }, token);
    await waitReady(id, token);
    creationId = id;
  } else {
    const childIds = [];
    for (const img of post.images) {
      const { id } = await apiCall(`${userId}/media`, {
        image_url: rawUrl(img),
        is_carousel_item: 'true',
      }, token);
      await waitReady(id, token);
      childIds.push(id);
      await new Promise((r) => setTimeout(r, 2000));
    }
    const { id } = await apiCall(`${userId}/media`, {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption: post.caption,
    }, token);
    await waitReady(id, token);
    creationId = id;
  }

  const result = await apiCall(`${userId}/media_publish`, { creation_id: creationId }, token);
  console.log('[IG] published:', result.id);
}
