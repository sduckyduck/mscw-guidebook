const PATCH_FLAG = '__mscwCmsSkillFetchPatchInstalled';

const PLAYABLE_CLASS_NAMES = new Set(['warrior', 'magician', 'bowman', 'thief', 'pirate']);
const EXCLUDED_SOURCE_JOBS = new Set(['beginner', 'misc', 'event']);

const JOB_NAME_BY_PREFIX = {
  '100': 'warrior',
  '110': 'fighter',
  '120': 'page',
  '130': 'spearman',
  '200': 'magician',
  '210': 'F/P Wizard',
  '220': 'Ice Lightning Wizard',
  '230': 'cleric',
  '300': 'bowman',
  '310': 'hunter',
  '320': 'crossbowman',
  '400': 'thief',
  '410': 'assassin',
  '420': 'bandit',
  '500': 'pirate',
  '510': 'brawler',
  '520': 'gunslinger',
};

function isCmsSkillsRequest(input) {
  const url = typeof input === 'string' ? input : input?.url;
  if (!url) return false;
  return /(^|\/)cms\/skills\.json(?:$|[?#])/.test(String(url));
}

function collectSkillGroups(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(collectSkillGroups);
  if (typeof node !== 'object') return [];
  if (Array.isArray(node.skills)) return [node];
  return Object.values(node).flatMap(collectSkillGroups);
}

function normalizeId(value) {
  return String(value ?? '').replace(/\.0$/, '');
}

function normalizeText(value = '') {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sourceClassName(skill, group) {
  return skill?.class_name ?? skill?.className ?? group?.class_name ?? group?.className ?? '';
}

function sourceJobName(skill, group) {
  return skill?.job ?? skill?.jobName ?? skill?.job_name ?? group?.job ?? group?.jobName ?? group?.job_name ?? '';
}

function isPlayableClassSkill(skill, group) {
  const className = normalizeText(sourceClassName(skill, group));
  const jobName = normalizeText(sourceJobName(skill, group));
  if (!PLAYABLE_CLASS_NAMES.has(className)) return false;
  if (EXCLUDED_SOURCE_JOBS.has(jobName)) return false;
  if (/^job \d+/.test(jobName)) return false;
  return true;
}

function jobNameFromSkill(skill, group) {
  const id = normalizeId(skill?.id ?? skill?.skillId ?? skill?.skill_id ?? skill?.code);
  const prefix = id.slice(0, 3);
  return JOB_NAME_BY_PREFIX[prefix]
    ?? sourceJobName(skill, group)
    ?? sourceClassName(skill, group)
    ?? 'unknown';
}

function cmsAssetPath(path, fallback) {
  const raw = String(path || fallback || '').replace(/^\/+/, '');
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('cms/')) return raw;
  return `cms/${raw}`;
}

function normalizeSkillForExistingAdapter(skill, group) {
  if (!isPlayableClassSkill(skill, group)) return null;

  const id = normalizeId(skill?.id ?? skill?.skillId ?? skill?.skill_id ?? skill?.code);
  const job = jobNameFromSkill(skill, group);
  const levelStats = skill.all_level_stats
    ?? skill.allLevelStats
    ?? skill.levelStats
    ?? skill.level_data
    ?? [];

  return {
    ...skill,
    id,
    job,
    jobName: job,
    className: job,
    class_name: job,
    source_class_name: sourceClassName(skill, group),
    source_job: sourceJobName(skill, group),
    maxLevel: Number(skill.maxLevel ?? skill.max_level ?? skill.max ?? 0),
    max_level: Number(skill.max_level ?? skill.maxLevel ?? skill.max ?? 0),
    allLevelStats: levelStats,
    all_level_stats: levelStats,
    levelStats,
    thumbnail: cmsAssetPath(skill.thumbnail, `images/skills/${id}.png`),
  };
}

function flattenCmsSkills(raw) {
  const groups = collectSkillGroups(raw);
  const skills = groups.flatMap((group) => (group.skills ?? [])
    .map((skill) => normalizeSkillForExistingAdapter(skill, group))
    .filter(Boolean));
  return { skills };
}

function installCmsSkillFetchPatch() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  if (window[PATCH_FLAG]) return;
  window[PATCH_FLAG] = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    if (!isCmsSkillsRequest(input)) return response;

    try {
      const raw = await response.clone().json();
      const flattened = flattenCmsSkills(raw);
      return new Response(JSON.stringify(flattened), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.warn('[MSCW] Failed to normalize CMS skills.json', error);
      return response;
    }
  };
}

installCmsSkillFetchPatch();
