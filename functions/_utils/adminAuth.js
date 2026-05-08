export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function requireAdmin(request, env) {
  const configuredToken = String(env.ADMIN_TOKEN ?? '').trim();
  if (!configuredToken) {
    return {
      ok: false,
      response: jsonResponse({ error: 'ADMIN_TOKEN is not configured on Cloudflare Pages.' }, 500),
    };
  }

  const authHeader = request.headers.get('authorization') || '';
  const headerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const directToken = request.headers.get('x-admin-token')?.trim() || '';
  const token = headerToken || directToken;

  if (!token || token !== configuredToken) {
    return {
      ok: false,
      response: jsonResponse({ error: 'Unauthorized admin request.' }, 401),
    };
  }

  return { ok: true };
}

export function parseJsonSafe(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

export function normalizeAdminBuild(row) {
  return {
    id: row.id,
    title: row.title,
    authorName: row.author_name,
    job: row.job,
    branch: row.branch,
    level: row.level,
    mode: row.mode,
    budget: row.budget,
    priority: row.priority,
    stats: parseJsonSafe(row.stats_json, {}),
    skills: parseJsonSafe(row.skills_json, {}),
    gear: parseJsonSafe(row.gear_json, {}),
    maps: parseJsonSafe(row.maps_json, {}),
    description: row.description,
    tags: parseJsonSafe(row.tags_json, []),
    visibility: row.visibility,
    views: row.views,
    likes: row.likes,
    createdAt: row.created_at,
  };
}

export function cleanAdminString(value, maxLength = 200) {
  return String(value ?? '').trim().slice(0, maxLength);
}
