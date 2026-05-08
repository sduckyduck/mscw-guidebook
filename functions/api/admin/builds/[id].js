import { cleanAdminString, jsonResponse, normalizeAdminBuild, requireAdmin } from '../../../_utils/adminAuth.js';
import { validateBuildSubmission } from '../../../_utils/buildModeration.js';

async function readBuild(env, id) {
  return env.DB.prepare(
    `SELECT id, title, author_name, job, branch, level, mode, budget, priority,
            stats_json, skills_json, gear_json, maps_json, description, tags_json,
            visibility, views, likes, created_at
       FROM builds
      WHERE id = ?
      LIMIT 1`
  ).bind(id).first();
}

export async function onRequestPatch({ request, env, params }) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.DB) return jsonResponse({ error: 'D1 binding DB is not configured.' }, 500);

  const id = String(params.id ?? '').trim();
  if (!id) return jsonResponse({ error: 'Build id is required.' }, 400);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const existing = await readBuild(env, id);
  if (!existing) return jsonResponse({ error: 'Build not found.' }, 404);

  const nextTitle = payload.title !== undefined ? cleanAdminString(payload.title, 80) : existing.title;
  const nextAuthorName = payload.authorName !== undefined ? cleanAdminString(payload.authorName, 40) : existing.author_name;
  const nextDescription = payload.description !== undefined ? cleanAdminString(payload.description, 1200) : existing.description;
  const nextVisibility = payload.visibility !== undefined ? cleanAdminString(payload.visibility, 20) : existing.visibility;

  if (!['public', 'hidden'].includes(nextVisibility)) {
    return jsonResponse({ error: 'Visibility must be public or hidden.' }, 400);
  }

  const moderation = validateBuildSubmission({
    title: nextTitle,
    authorName: nextAuthorName,
    description: nextDescription,
    tags: existing.tags_json,
  });
  if (!moderation.ok && nextVisibility === 'public') {
    return jsonResponse({ error: moderation.error, code: moderation.code }, 400);
  }

  await env.DB.prepare(
    `UPDATE builds
        SET title = ?, author_name = ?, description = ?, visibility = ?
      WHERE id = ?`
  ).bind(nextTitle, nextAuthorName, nextDescription, nextVisibility, id).run();

  const updated = await readBuild(env, id);
  return jsonResponse({ build: normalizeAdminBuild(updated) });
}

export async function onRequestDelete({ request, env, params }) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.DB) return jsonResponse({ error: 'D1 binding DB is not configured.' }, 500);

  const id = String(params.id ?? '').trim();
  if (!id) return jsonResponse({ error: 'Build id is required.' }, 400);

  const existing = await readBuild(env, id);
  if (!existing) return jsonResponse({ error: 'Build not found.' }, 404);

  await env.DB.prepare('DELETE FROM builds WHERE id = ?').bind(id).run();
  return jsonResponse({ ok: true, deletedId: id });
}
