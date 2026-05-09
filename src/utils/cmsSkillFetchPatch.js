const PATCH_FLAG = '__mscwCmsSkillFetchPatchInstalled';

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

function normalizeSkillForExistingAdapter(skill, group) {
  const copy = {
    ...skill,
    source_class_name: skill.class_name ?? group.class_name ?? group.className ?? '',
    source_job: skill.job ?? group.job ?? group.job_name ?? '',
    maxLevel: Number(skill.maxLevel ?? skill.max_level ?? skill.max ?? 0),
    allLevelStats: skill.allLevelStats ?? skill.all_level_stats ?? skill.levelStats ?? skill.level_data ?? [],
    all_level_stats: skill.all_level_stats ?? skill.allLevelStats ?? skill.levelStats ?? skill.level_data ?? [],
    levelStats: skill.levelStats ?? skill.all_level_stats ?? skill.allLevelStats ?? skill.level_data ?? [],
  };

  // The existing adapter groups CMS skills by job/class fields first.
  // For this CMS file, prefix-based grouping is more reliable:
  // 200 -> magician first job, 210 -> fire/poison wizard, etc.
  delete copy.job;
  delete copy.jobName;
  delete copy.job_name;
  delete copy.className;
  delete copy.class_name;

  return copy;
}

function flattenCmsSkills(raw) {
  const groups = collectSkillGroups(raw);
  const skills = groups.flatMap((group) => (group.skills ?? []).map((skill) => normalizeSkillForExistingAdapter(skill, group)));
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
