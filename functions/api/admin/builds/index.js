import { jsonResponse, normalizeAdminBuild, requireAdmin } from '../../../_utils/adminAuth.js';

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  if (!env.DB) return jsonResponse({ error: 'D1 binding DB is not configured.' }, 500);

  const url = new URL(request.url);
  const visibility = url.searchParams.get('visibility') || 'all';
  const allowed = new Set(['all', 'public', 'hidden']);
  const selectedVisibility = allowed.has(visibility) ? visibility : 'all';

  const whereClause = selectedVisibility === 'all' ? '' : 'WHERE visibility = ?';
  const statement = env.DB.prepare(
    `SELECT id, title, author_name, job, branch, level, mode, budget, priority,
            stats_json, skills_json, gear_json, maps_json, description, tags_json,
            visibility, views, likes, created_at
       FROM builds
       ${whereClause}
      ORDER BY datetime(created_at) DESC
      LIMIT 300`
  );

  const { results } = selectedVisibility === 'all'
    ? await statement.all()
    : await statement.bind(selectedVisibility).all();

  return jsonResponse({ builds: (results ?? []).map(normalizeAdminBuild) });
}
