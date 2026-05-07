function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function safeJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

function normalizeBuild(row) {
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
    stats: safeJson(row.stats_json, {}),
    skills: safeJson(row.skills_json, {}),
    gear: safeJson(row.gear_json, {}),
    maps: safeJson(row.maps_json, {}),
    description: row.description,
    tags: safeJson(row.tags_json, []),
    visibility: row.visibility,
    views: row.views,
    likes: row.likes,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ env, params }) {
  if (!env.DB) return jsonResponse({ error: 'D1 binding DB is not configured.' }, 500);

  const id = String(params.id ?? '').trim();
  if (!id) return jsonResponse({ error: 'Build id is required.' }, 400);

  const row = await env.DB.prepare(
    `SELECT id, title, author_name, job, branch, level, mode, budget, priority,
            stats_json, skills_json, gear_json, maps_json, description, tags_json,
            visibility, views, likes, created_at
       FROM builds
      WHERE id = ? AND visibility = 'public'
      LIMIT 1`
  ).bind(id).first();

  if (!row) return jsonResponse({ error: 'Build not found.' }, 404);

  await env.DB.prepare('UPDATE builds SET views = COALESCE(views, 0) + 1 WHERE id = ?').bind(id).run();
  return jsonResponse({ build: normalizeBuild({ ...row, views: Number(row.views ?? 0) + 1 }) });
}
