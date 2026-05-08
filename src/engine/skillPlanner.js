import {
  getSkillPlan as getSkillPlanBase,
  getApNote,
} from './skillPlannerRealPlayer.js';
import { CLASS_LINES } from '../data/classes.js';
import { buildStatPlan } from './levelEngine.js';

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

const GUIDE_WEAPON_ATTACK_BY_ROUTE = [
  { classId: 'bowman', branchIds: ['bowman', 'hunter'], minLevel: 30, maxLevel: 34, weaponName: 'Ryden', weaponType: 'bow', attack: 50, stats: { STR: 1 } },
  { classId: 'bowman', branchIds: ['crossbowman'], minLevel: 25, maxLevel: 34, weaponName: 'Mountain Crossbow', weaponType: 'crossbow', attack: 47, stats: {} },
  { classId: 'bowman', branchIds: ['bowman', 'hunter'], minLevel: 25, maxLevel: 29, weaponName: 'Battle Bow', weaponType: 'bow', attack: 44, stats: {} },
];

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
    return { kind: MAGIC_DAMAGE_SKILLS.has(name) ? 'magic-percent' : 'physical', effect, hits, ratio: number(multi?.[2] ?? percent?.[1], 100) / 100 };
  }

  if (MULTI_HIT_SKILLS.has(name) || DAMAGE_NAMES.has(skill?.name)) {
    return { kind: MAGIC_DAMAGE_SKILLS.has(name) ? 'magic-percent' : 'physical', effect, hits, ratio: Math.max(0.5, roundSkillValue(skill?.level) / Math.max(1, roundSkillValue(skill?.max))) };
  }

  return null;
}

function isDamageSkill(skill) {
  return roundSkillValue(skill?.level) > 0 && !skill?.locked && DAMAGE_NAMES.has(skill?.name) && Boolean(parseDamageProfile(skill));
}

function getClassLine(classId) {
  return CLASS_LINES.find((line) => line.id === classId) ?? CLASS_LINES.find((line) => line.id === 'warrior') ?? CLASS_LINES[0];
}

function getRouteWeapon(args = {}) {
  const classId = args.classId;
  const branchId = args.branchId ?? classId;
  const level = number(args.level, 1);
  const known = GUIDE_WEAPON_ATTACK_BY_ROUTE.find((item) => item.classId === classId
    && item.branchIds.includes(branchId)
    && level >= item.minLevel
    && level <= item.maxLevel);

  if (known) return known;

  const fallbackAttack = number(args.weaponAttack ?? args.watk, 0);
  if (fallbackAttack > 0) return { weaponName: 'Equipped Weapon', weaponType: '', attack: fallbackAttack, stats: {} };

  const maybeWeaponAttack = number(args.mainAttack, 0);
  if (maybeWeaponAttack > 0 && maybeWeaponAttack <= 120) {
    return { weaponName: 'Estimated Weapon', weaponType: '', attack: maybeWeaponAttack, stats: {} };
  }

  return { weaponName: 'Estimated Weapon', weaponType: '', attack: Math.max(1, Math.round(maybeWeaponAttack / 5) || 1), stats: {} };
}

function addStats(stats = {}, bonus = {}) {
  return {
    STR: number(stats.STR) + number(bonus.STR),
    DEX: number(stats.DEX) + number(bonus.DEX),
    INT: number(stats.INT) + number(bonus.INT),
    LUK: number(stats.LUK) + number(bonus.LUK),
  };
}

function getGuideStats(args = {}, statBonuses = null) {
  const classLine = getClassLine(args.classId);
  const weapon = getRouteWeapon(args);
  const statPlan = buildStatPlan(classLine, args.level, {
    budget: args.budget,
    apAllocation: args.apAllocation,
    skillBonuses: statBonuses ?? undefined,
  });

  return {
    classLine,
    weapon,
    statPlan,
    stats: addStats(statPlan.stats, weapon.stats),
  };
}

function getSkillLevel(skills = [], pattern) {
  return roundSkillValue((skills ?? []).find((skill) => pattern.test(String(skill.name ?? '')))?.level);
}

function getPhysicalMastery({ classId, weaponType, skills = [] }) {
  if (classId === 'bowman') {
    const mastery = /crossbow/i.test(weaponType)
      ? getSkillLevel(skills, /crossbow mastery/i)
      : getSkillLevel(skills, /bow mastery/i);
    return mastery > 0 ? Math.min(0.6, 0.15 + mastery * 0.02) : 0.3;
  }

  const anyMastery = getSkillLevel(skills, /mastery/i);
  return anyMastery > 0 ? Math.min(0.6, 0.15 + anyMastery * 0.02) : 0.3;
}

function getBasePhysicalRange(args = {}, skills = []) {
  const { classLine, weapon, stats } = getGuideStats(args);
  const attack = Math.max(1, number(weapon.attack, 1));
  const primary = number(stats[classLine.primaryStat]);
  const secondary = number(stats[classLine.secondaryStat]);
  const mastery = getPhysicalMastery({ classId: classLine.id, weaponType: weapon.weaponType, skills });

  if (classLine.id === 'bowman') {
    const multiplier = /crossbow/i.test(weapon.weaponType) ? 3.6 : 3.4;
    const max = Math.max(1, Math.round(((primary * multiplier) + secondary) * attack / 100));
    const min = Math.max(1, Math.round(((primary * multiplier * mastery) + secondary) * attack / 100));
    return { min: Math.min(min, max), max, weapon };
  }

  const genericMax = Math.max(1, Math.round(number(args.mainAttack, attack)));
  return { min: Math.max(1, Math.round(genericMax * mastery)), max: genericMax, weapon };
}

function getMagicRange(args = {}, skill, profile, statBonuses = null) {
  const { stats } = getGuideStats(args, statBonuses);
  const intValue = number(stats.INT);
  const magicAttack = Math.max(1, Math.floor(intValue / 2));
  const mastery = 0.6;
  const base = number(profile.basicAttack, 1) + magicAttack / 7;
  const max = Math.round(base * (((magicAttack * 2 + intValue) / 100) + 1));
  const min = Math.round(base * (((magicAttack * 2 * mastery + intValue) / 100) + 1));
  return { min: Math.max(1, min), max: Math.max(min + 1, max) };
}

function getPhysicalSkillRange(base, profile) {
  const ratio = Math.max(0.01, number(profile.ratio, 1));
  return {
    min: Math.max(1, Math.round(base.min * ratio)),
    max: Math.max(1, Math.round(base.max * ratio)),
  };
}

function makeDamageCard({ skill, profile, range, isBase = false, weapon = null }) {
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
    weaponAttack: weapon?.attack,
    weaponName: weapon?.weaponName,
    isBase,
  };
}

function buildDamageCards(skills = [], args = {}, statBonuses = null) {
  const base = getBasePhysicalRange(args, skills);
  const cards = skills
    .filter(isDamageSkill)
    .map((skill) => {
      const profile = parseDamageProfile(skill);
      if (!profile) return null;
      const range = profile.kind === 'magic'
        ? getMagicRange(args, skill, profile, statBonuses)
        : getPhysicalSkillRange(base, profile);
      return makeDamageCard({ skill, profile, range, weapon: base.weapon });
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
      weapon: base.weapon,
    });

  return [baseCard, ...cards].filter(Boolean);
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
    damageCards: buildDamageCards(skills, args, statBonuses),
  };
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
