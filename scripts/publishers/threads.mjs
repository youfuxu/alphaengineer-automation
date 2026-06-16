// Threads API: https://developers.facebook.com/docs/threads
// Scopes needed: threads_basic, threads_content_publish
// Token endpoint: graph.threads.net/oauth/authorize (separate from Instagram)

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
    if (data.status === 'ERROR') throw new Error(`Threads container error: ${data.error_message}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Threads container ${containerId} timed out`);
}

export async function postToThreads({ post, rawUrl }) {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) { console.log('[Threads] secrets not set, skipping'); return; }

  const text = post.caption.length > 500 ? post.caption.slice(0, 497) + '...' : post.caption;
  let creationId;

  if (post.images.length === 1) {
    // Single image post
    const { id } = await apiCall(`${userId}/threads`, {
      media_type: 'IMAGE',
      image_url: rawUrl(post.images[0]),
      text,
    }, token);
    creationId = id;
  } else {
    // Carousel: up to 20 images
    const images = post.images.slice(0, 20);
    const childIds = [];
    for (const img of images) {
      const { id } = await apiCall(`${userId}/threads`, {
        media_type: 'IMAGE',
        image_url: rawUrl(img),
        is_carousel_item: 'true',
      }, token);
      await waitReady(id, token);
      childIds.push(id);
    }
    const { id } = await apiCall(`${userId}/threads`, {
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      text,
    }, token);
    await waitReady(id, token);
    creationId = id;
  }

  const result = await apiCall(`${userId}/threads_publish`, { creation_id: creationId }, token);
  console.log('[Threads] published:', result.id);
}
