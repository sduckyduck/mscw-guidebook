const ADMIN_TOKEN_KEY = 'mscw-admin-token';

export function getStoredAdminToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function storeAdminToken(token) {
  if (typeof window === 'undefined') return;
  const clean = String(token || '').trim();
  if (clean) window.localStorage.setItem(ADMIN_TOKEN_KEY, clean);
  else window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed: ${response.status}`);
  return body;
}

function authHeaders(token) {
  return {
    accept: 'application/json',
    authorization: `Bearer ${token}`,
  };
}

export async function fetchAdminBuilds(token, visibility = 'all') {
  const response = await fetch(`/api/admin/builds?visibility=${encodeURIComponent(visibility)}`, {
    headers: authHeaders(token),
  });
  const body = await readJson(response);
  return body.builds ?? [];
}

export async function updateAdminBuild(token, id, payload) {
  const response = await fetch(`/api/admin/builds/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson(response);
  return body.build;
}

export async function deleteAdminBuild(token, id) {
  const response = await fetch(`/api/admin/builds/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return readJson(response);
}
