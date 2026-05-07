const API_BASE = '/api/builds';

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }
  return body;
}

export async function fetchCommunityBuilds() {
  const response = await fetch(API_BASE, { headers: { accept: 'application/json' } });
  const body = await readJson(response);
  return body.builds ?? [];
}

export async function fetchCommunityBuild(id) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
  const body = await readJson(response);
  return body.build;
}

export async function submitCommunityBuild(payload) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson(response);
  return body.build;
}
