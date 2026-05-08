import { validateBuildSubmission } from '../../_utils/buildModeration.js';

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

function cleanString(value, maxLength = 200) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function cleanTags(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  return raw
    .map((tag) => cleanString(tag, 24))
    .filter(Boolean)
    .slice(0, 8);
}

export async function onRequestGet({ env }) {
  if (!env.DB) return jsonResponse({ error: 'D1 binding DB is not configured.' }, 500);

  const { results } = await env.DB.prepare(
    `SELECT id, title, author_name, job, branch, level, mode, budget, priority,
            stats_json, skills_json, gear_json, maps_json, description, tags_json,
            visibility, views, likes, created_at
       FROM builds
      WHERE visibility = 'public'
      ORDER BY datetime(created_at) DESC
      LIMIT 100`
  ).all();

  return jsonResponse({ builds: (results ?? []).map(normalizeBuild) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: 'D1 binding DB is not configured.' }, 500);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const rawTitle = payload.title;
  const rawAuthorName = payload.authorName || payload.author_name || '匿名玩家';
  const rawDescription = payload.description;
  const rawTags = payload.tags;

  const moderation = validateBuildSubmission({
    title: rawTitle,
    authorName: rawAuthorName,
    description: rawDescription,
    tags: rawTags,
  });
  if (!moderation.ok) {
    return jsonResponse({ error: moderation.error, code: moderation.code }, 400);
  }

  const title = cleanString(rawTitle, 80);
  const authorName = cleanString(rawAuthorName || '匿名玩家', 40) || '匿名玩家';
  const job = cleanString(payload.job || payload.classId, 40);
  const branch = cleanString(payload.branch || payload.branchId, 40);
  const level = Math.max(1, Math.min(200, Number(payload.level) || 1));
  const mode = cleanString(payload.mode, 40);
  const budget = cleanString(payload.budget, 40);
  const priority = cleanString(payload.priority, 40);
  const description = cleanString(rawDescription, 1200);
  const tags = cleanTags(rawTags);

  if (!title) return jsonResponse({ error: 'Title is required.' }, 400);
  if (!job) return jsonResponse({ error: 'Job is required.' }, 400);

  const id = crypto.randomUUID();
  const visibility = 'public';
  const statsJson = JSON.stringify(safeJson(payload.stats, {}));
  const skillsJson = JSON.stringify(safeJson(payload.skills, {}));
  const gearJson = JSON.stringify(safeJson(payload.gear, {}));
  const mapsJson = JSON.stringify(safeJson(payload.maps, {}));
  const tagsJson = JSON.stringify(tags);

  await env.DB.prepare(
    `INSERT INTO builds (
       id, title, author_name, job, branch, level, mode, budget, priority,
       stats_json, skills_json, gear_json, maps_json, description, tags_json, visibility
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, title, authorName, job, branch, level, mode, budget, priority,
    statsJson, skillsJson, gearJson, mapsJson, description, tagsJson, visibility
  ).run();

  return jsonResponse({ build: normalizeBuild({
    id, title, author_name: authorName, job, branch, level, mode, budget, priority,
    stats_json: statsJson, skills_json: skillsJson, gear_json: gearJson, maps_json: mapsJson,
    description, tags_json: tagsJson, visibility, views: 0, likes: 0, created_at: new Date().toISOString(),
  }) }, 201);
}
