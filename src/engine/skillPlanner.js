import {
  getSkillPlan as getSkillPlanBase,
  getApNote,
} from './skillPlannerRealPlayer.js';

const DAMAGE_NAMES = new Set([
  'Power Strike', 'Slash Blast',
  'Energy Bolt', 'Magic Claw', 'Fire Arrow', 'Poison Breath', 'Cold Beam', 'Thunder Bolt', 'Heal', 'Holy Arrow',
  'Arrow Blow', 'Double Shot', 'Power Knockback', 'Arrow Bomb: Bow', 'Iron Arrow: Crossbow',
  'Double Stab', 'Lucky Seven', 'Drain', 'Savage Blow',
]);

const MULTI_HIT_SKILLS = new Map([
  ['magic claw', 2],
  ['double shot', 2],
  ['double stab', 2],
  ['lucky seven', 2],
  ['savage blow', 6],
]);

const MAGIC_DAMAGE_SKILLS = new Set([
  'energy bolt', 'magic claw', 'fire arrow', 'poison breath', 'cold beam', 'thunder bolt', 'heal', 'holy arrow',
]);

function number(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundSkillValue(value) {
  return Math.max(0, Math.round(number(value, 0)));
}

function normalizeName(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function clonePlan(plan) {
  return {
    ...plan,
    skills: (plan.skills ?? []).map((skill) => ({ ...skill })),
    current: (plan.current ?? []).map((skill) => ({ ...skill })),
    next: (plan.next ?? []).map((step) => ({ ...step })),
    totalSpByTier: { ...(plan.totalSpByTier ?? {}) },
    remainingByTier: { ...(plan.remainingByTier ?? {}) },
  };
}

function sameAllocation(left = {}, right = {}) {
  const keys = new Set([...Object.keys(left ?? {}), ...Object.keys(right ?? {})]);
  for (const key of keys) {
    if (roundSkillValue(left?.[key]) !== roundSkillValue(right?.[key])) return false;
  }
  return true;
}

function getSkillEffect(skill) {
  const level = Math.max(0, roundSkillValue(skill?.level));
  const table = skill?.allLevelStats ?? skill?.all_level_stats ?? [];
  return String(table[Math.max(0, level - 1)] ?? skill?.role ?? skill?.description ?? '');
}

function parseDamageProfile(skill) {
  const effect = getSkillEffect(skill);
  const name = normalizeName(skill?.name);
  const multi = effect.match(/attack\s+(\d+)x\s+with\s+(\d+(?:\.\d+)?)%\s+damage/i);
  const percent = effect.match(/\bdamage\s+(\d+(?:\.\d+)?)%/i);
  const basicAttack = effect.match(/\bbasic attack\s+(\d+(?:\.\d+)?)/i)?.[1];
  const hits = multi ? number(multi[1], 1) : (MULTI_HIT_SKILLS.get(name) ?? 1);

  if (basicAttack !== undefined && MAGIC_DAMAGE_SKILLS.has(name)) {
    return { kind: 'magic', effect, hits, basicAttack: number(basicAttack, 0), ratio: 1 };
  }

  if (multi || percent) {
    return {
      kind: MAGIC_DAMAGE_SKILLS.has(name) ? 'magic-percent' : 'physical',
      effect,
      hits,
      ratio: number(multi?.[2] ?? percent?.[1], 100) / 100,
    };
  }

  if (MULTI_HIT_SKILLS.has(name) || DAMAGE_NAMES.has(skill?.name)) {
    return {
      kind: MAGIC_DAMAGE_SKILLS.has(name) ? 'magic-percent' : 'physical',
      effect,
      hits,
      ratio: Math.max(0.5, roundSkillValue(skill?.level) / Math.max(1, roundSkillValue(skill?.max))),
    };
  }

  return null;
}

function isDamageSkill(skill) {
  return roundSkillValue(skill?.level) > 0 && !skill?.locked && DAMAGE_NAMES.has(skill?.name) && Boolean(parseDamageProfile(skill));
}

function getSkillLevel(skills = [], pattern) {
  return roundSkillValue((skills ?? []).find((skill) => pattern.test(String(skill.name ?? '')))?.level);
}

function getPhysicalMasteryRatio(skills = []) {
  const mastery = getSkillLevel(skills, /mastery/i);
  if (!mastery) return 0.3;
  return Math.min(0.6, Math.max(0.3, 0.15 + mastery * 0.02));
}

function getBasePhysicalRange(args = {}, skills = []) {
  // mainAttack is computed upstream from the actual selected gear in AppMediaEnhanced.
  // Do not treat it as weapon attack; it is the base attack estimate after the real
  // equipment stats from AppData/items.json have already been aggregated.
  const max = Math.max(1, Math.round(number(args.mainAttack, 1)));
  const masteryRatio = number(args.minAttackRatio, 0) || getPhysicalMasteryRatio(skills);
  const min = Math.max(1, Math.round(max * masteryRatio));
  return { min: Math.min(min, max), max };
}

function getMagicRange(args = {}, profile) {
  const max = Math.max(1, Math.round(number(args.mainAttack, 1) * number(profile.ratio, 1)));
  return { min: Math.max(1, Math.round(max * 0.65)), max };
}

function getPhysicalSkillRange(base, profile) {
  const ratio = Math.max(0.01, number(profile.ratio, 1));
  return {
    min: Math.max(1, Math.round(base.min * ratio)),
    max: Math.max(1, Math.round(base.max * ratio)),
  };
}

function makeDamageCard({ skill, profile, range, isBase = false }) {
  const hits = Math.max(1, Math.round(number(profile?.hits, 1)));
  const perHitMin = Math.max(1, Math.round(range.min));
  const perHitMax = Math.max(perHitMin, Math.round(range.max));
  const totalMin = perHitMin * hits;
  const totalMax = perHitMax * hits;

  return {
    name: skill?.name ?? 'Base Attack',
    role: profile?.effect || skill?.description || skill?.tierLabel || (isBase ? '普通攻击' : ''),
    level: isBase ? null : roundSkillValue(skill?.level),
    maxLevel: isBase ? null : roundSkillValue(skill?.max ?? skill?.maxLevel),
    iconKey: skill?.iconKey ?? skill?.thumbnail,
    min: totalMin,
    max: totalMax,
    perHitMin,
    perHitMax,
    totalMin,
    totalMax,
    hits,
    damageText: hits > 1 ? `${perHitMin} - ${perHitMax}/hit` : `${totalMin} - ${totalMax}`,
    isBase,
  };
}

function buildDamageCards(skills = [], args = {}) {
  const base = getBasePhysicalRange(args, skills);
  const cards = skills
    .filter(isDamageSkill)
    .map((skill) => {
      const profile = parseDamageProfile(skill);
      if (!profile) return null;
      const range = profile.kind === 'magic'
        ? getMagicRange(args, profile)
        : getPhysicalSkillRange(base, profile);
      return makeDamageCard({ skill, profile, range });
    })
    .filter(Boolean)
    .sort((a, b) => b.totalMax - a.totalMax)
    .slice(0, 6);

  const baseCard = args.classId === 'magician'
    ? null
    : makeDamageCard({
      skill: { name: 'Base Attack' },
      profile: { hits: 1, effect: '普通攻击' },
      range: base,
      isBase: true,
    });

  return [baseCard, ...cards].filter(Boolean);
}

function getEmptyStatBonuses() {
  return {
    stats: { STR: 0, DEX: 0, INT: 0, LUK: 0 },
    maxHpPercent: 0,
    maxMpPercent: 0,
    accuracy: 0,
    magicAccuracy: 0,
    avoidability: 0,
    weaponAttack: 0,
    magicAttack: 0,
    speed: 0,
    jump: 0,
    criticalRate: 0,
    criticalDamage: 0,
  };
}

function recalcPlan(plan, args = {}) {
  const skills = (plan.skills ?? []).map((skill) => ({ ...skill, level: roundSkillValue(skill.level) }));
  const usedByTier = skills.reduce((sum, skill) => {
    const tier = skill.tier === 'second' ? 'second' : 'first';
    sum[tier] = (sum[tier] ?? 0) + roundSkillValue(skill.level);
    return sum;
  }, { first: 0, second: 0 });
  const totals = {
    first: roundSkillValue(plan.totalSpByTier?.first),
    second: roundSkillValue(plan.totalSpByTier?.second),
  };
  const statBonuses = plan.statBonuses ?? getEmptyStatBonuses();

  return {
    ...plan,
    skills,
    current: skills.filter((skill) => roundSkillValue(skill.level) > 0),
    totalSpByTier: totals,
    totalSp: totals.first + totals.second,
    usedSp: usedByTier.first + usedByTier.second,
    remainingSp: Math.max(0, totals.first + totals.second - usedByTier.first - usedByTier.second),
    remainingByTier: {
      first: Math.max(0, totals.first - usedByTier.first),
      second: Math.max(0, totals.second - usedByTier.second),
    },
    statBonuses,
    damageCards: buildDamageCards(skills, args),
  };
}

function unlockLevel30SecondJob(plan, args = {}) {
  if (number(args.level, 1) < 30) return plan;
  for (const skill of plan.skills ?? []) {
    if (skill.tier === 'second') skill.locked = false;
  }

  if (roundSkillValue(plan.totalSpByTier?.second) === 0) {
    plan.totalSpByTier = { ...(plan.totalSpByTier ?? {}), second: 1 };
    const firstSecondSkill = (plan.skills ?? []).find((skill) => skill.tier === 'second' && !skill.locked);
    if (firstSecondSkill && roundSkillValue(firstSecondSkill.level) === 0) firstSecondSkill.level = 1;
  }

  return plan;
}

function applyManualAllocation(plan, customSkills = {}) {
  const totals = {
    first: roundSkillValue(plan.totalSpByTier?.first),
    second: roundSkillValue(plan.totalSpByTier?.second),
  };
  const used = { first: 0, second: 0 };

  for (const skill of plan.skills ?? []) {
    if (skill.locked) {
      skill.level = 0;
      continue;
    }
    const tier = skill.tier === 'second' ? 'second' : 'first';
    const available = Math.max(0, totals[tier] - used[tier]);
    const level = Math.min(roundSkillValue(customSkills?.[skill.name]), roundSkillValue(skill.max), available);
    skill.level = level;
    used[tier] += level;
  }

  return plan;
}

export function getRecommendedSkillAllocation(args = {}) {
  const plan = recalcPlan(unlockLevel30SecondJob(clonePlan(getSkillPlanBase({ ...args, customSkills: undefined })), args), args);
  return Object.fromEntries((plan.skills ?? []).map((skill) => [skill.name, roundSkillValue(skill.level)]));
}

export function getSkillPlan(args = {}) {
  const recommendedAllocation = getRecommendedSkillAllocation(args);
  const hasManualAllocation = args.customSkills && !sameAllocation(args.customSkills, recommendedAllocation);
  const plan = unlockLevel30SecondJob(clonePlan(getSkillPlanBase({ ...args, customSkills: undefined })), args);

  if (hasManualAllocation) applyManualAllocation(plan, args.customSkills);
  return recalcPlan(plan, args);
}

export { getApNote };
