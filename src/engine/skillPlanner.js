import {
  getRecommendedSkillAllocation as getRecommendedSkillAllocationBase,
  getSkillPlan as getSkillPlanBase,
  getApNote,
} from './skillPlannerRealPlayer.js';

function numericLevel(level) {
  const value = Number(level);
  return Number.isFinite(value) ? value : 0;
}

function secondJobBonusSp(level) {
  return numericLevel(level) >= 30 ? 1 : 0;
}

function roundSkillValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

function normalizeAllocation(allocation = {}) {
  return Object.fromEntries(
    Object.entries(allocation ?? {}).map(([name, value]) => [name, roundSkillValue(value)]),
  );
}

function sameAllocation(left = {}, right = {}) {
  const a = normalizeAllocation(left);
  const b = normalizeAllocation(right);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (roundSkillValue(a[key]) !== roundSkillValue(b[key])) return false;
  }
  return true;
}

function clonePlan(plan) {
  return {
    ...plan,
    skills: (plan.skills ?? []).map((skill) => ({ ...skill })),
    current: (plan.current ?? []).map((skill) => ({ ...skill })),
    next: (plan.next ?? []).map((step) => ({ ...step })),
    totalSpByTier: { ...(plan.totalSpByTier ?? {}) },
    remainingByTier: { ...(plan.remainingByTier ?? {}) },
    statBonuses: plan.statBonuses,
    damageCards: plan.damageCards,
  };
}

function unlockSecondJobAtLevel30(plan, level) {
  if (numericLevel(level) < 30) return plan;
  for (const skill of plan.skills ?? []) {
    if (skill.tier === 'second') skill.locked = false;
  }
  return plan;
}

function addSecondJobBonusToPlan(plan, level) {
  const bonus = secondJobBonusSp(level);
  if (!bonus) return plan;

  const secondTotal = roundSkillValue(plan.totalSpByTier?.second) + bonus;
  plan.totalSpByTier = { ...(plan.totalSpByTier ?? {}), second: secondTotal };
  plan.totalSp = roundSkillValue(plan.totalSpByTier.first) + secondTotal;

  let left = bonus;
  for (const skill of plan.skills ?? []) {
    if (!left) break;
    if (skill.tier !== 'second' || skill.locked) continue;
    const current = roundSkillValue(skill.level);
    const max = roundSkillValue(skill.max);
    const add = Math.min(left, Math.max(0, max - current));
    skill.level = current + add;
    left -= add;
  }
  return recalcPlan(plan);
}

function getSkill(plan, name) {
  return (plan.skills ?? []).find((skill) => skill.name === name);
}

function addToSkill(plan, name, amount, maxOverride = null) {
  const skill = getSkill(plan, name);
  if (!skill || skill.locked || amount <= 0) return 0;
  const cap = maxOverride === null ? roundSkillValue(skill.max) : Math.min(roundSkillValue(skill.max), roundSkillValue(maxOverride));
  const add = Math.min(amount, Math.max(0, cap - roundSkillValue(skill.level)));
  skill.level = roundSkillValue(skill.level) + add;
  return add;
}

function resetFirstJob(plan) {
  for (const skill of plan.skills ?? []) {
    if (skill.tier !== 'second') skill.level = 0;
  }
}

function fillFirstJob(plan, total, order, caps = {}) {
  let left = Math.max(0, roundSkillValue(total));
  for (const name of order) {
    if (!left) break;
    const cap = Object.prototype.hasOwnProperty.call(caps, name) ? caps[name] : null;
    left -= addToSkill(plan, name, left, cap);
  }
  for (const name of order) {
    if (!left) break;
    if (Object.prototype.hasOwnProperty.call(caps, name)) continue;
    left -= addToSkill(plan, name, left);
  }
}

function applyWarriorFirstJobRoute(plan, args = {}) {
  if (args.classId !== 'warrior') return false;
  if (!getSkill(plan, 'Power Strike') || !getSkill(plan, 'Slash Blast')) return false;

  const total = roundSkillValue(plan.totalSpByTier?.first);
  resetFirstJob(plan);

  if (args.budget === 'low') {
    fillFirstJob(plan, total, [
      'Precise Strikes',
      'Improved HP Recovery',
      'Max HP Increase',
      'Power Strike',
      'Slash Blast',
      'Iron Body',
    ], {});
    return true;
  }

  if (args.budget === 'high') {
    fillFirstJob(plan, total, [
      'Power Strike',
      'Slash Blast',
      'Precise Strikes',
      'Max HP Increase',
      'Iron Body',
      'Improved HP Recovery',
    ], { 'Improved HP Recovery': 0, 'Max HP Increase': 0 });
    return true;
  }

  fillFirstJob(plan, total, [
    'Precise Strikes',
    'Power Strike',
    'Slash Blast',
    'Max HP Increase',
    'Improved HP Recovery',
    'Iron Body',
  ], { 'Improved HP Recovery': 3 });
  return true;
}

function applyMagicianFirstJobRoute(plan, args = {}) {
  if (args.classId !== 'magician') return false;
  if (!getSkill(plan, 'Energy Bolt') || !getSkill(plan, 'Magic Claw')) return false;

  const total = roundSkillValue(plan.totalSpByTier?.first);
  resetFirstJob(plan);

  if (args.budget === 'low') {
    fillFirstJob(plan, total, [
      'Energy Bolt',
      'Improved MP Recovery',
      'Max MP Increase',
      'Magic Guard',
      'Magic Armor',
      'Magic Claw',
    ], { 'Magic Claw': 0 });
    return true;
  }

  fillFirstJob(plan, total, [
    'Energy Bolt',
    'Improved MP Recovery',
    'Max MP Increase',
    'Magic Claw',
    'Magic Guard',
    'Magic Armor',
  ], { 'Energy Bolt': 1, 'Improved MP Recovery': args.budget === 'high' ? 5 : 10 });
  return true;
}

function applyBowmanFirstJobRoute(plan, args = {}) {
  if (args.classId !== 'bowman') return false;
  if (!getSkill(plan, 'Arrow Blow') || !getSkill(plan, 'Double Shot')) return false;

  const total = roundSkillValue(plan.totalSpByTier?.first);
  resetFirstJob(plan);

  if (args.budget === 'low') {
    fillFirstJob(plan, total, [
      'Critical Shot',
      'The Eye of Amazon',
      'Arrow Blow',
      'Focus',
      "Amazon's Judgement",
      'Double Shot',
    ], { 'Double Shot': 0 });
    return true;
  }

  fillFirstJob(plan, total, [
    'Critical Shot',
    'The Eye of Amazon',
    'Arrow Blow',
    'Double Shot',
    'Focus',
    "Amazon's Judgement",
  ], { 'Arrow Blow': 1 });
  return true;
}

function applyThiefFirstJobRoute(plan, args = {}) {
  if (args.classId !== 'thief') return false;
  if (!getSkill(plan, 'Lucky Seven') || !getSkill(plan, 'Keen Eyes')) return false;

  const total = roundSkillValue(plan.totalSpByTier?.first);
  resetFirstJob(plan);

  if (args.budget === 'low') {
    fillFirstJob(plan, total, [
      'Lucky Seven',
      'Keen Eyes',
      'Nimble Body',
      'Dark Sight',
      'Disorder',
      'Double Stab',
    ], { 'Double Stab': 0 });
    return true;
  }

  fillFirstJob(plan, total, [
    'Lucky Seven',
    'Keen Eyes',
    'Nimble Body',
    'Dark Sight',
    'Disorder',
    'Double Stab',
  ], { 'Double Stab': 0 });
  return true;
}

function applyFirstJobRoute(plan, args = {}) {
  const changed = applyWarriorFirstJobRoute(plan, args)
    || applyMagicianFirstJobRoute(plan, args)
    || applyBowmanFirstJobRoute(plan, args)
    || applyThiefFirstJobRoute(plan, args);
  return changed ? recalcPlan(plan) : recalcPlan(plan);
}

function applyManualAllocation(plan, customSkills = {}) {
  const allocation = normalizeAllocation(customSkills);
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
    const nextLevel = Math.min(roundSkillValue(allocation[skill.name]), roundSkillValue(skill.max), available);
    skill.level = nextLevel;
    used[tier] += nextLevel;
  }

  return recalcPlan(plan);
}

function getLevel(plan, name) {
  return roundSkillValue(getSkill(plan, name)?.level);
}

function getCalculatedStatBonuses(plan) {
  const precise = getLevel(plan, 'Precise Strikes');
  const nimble = getLevel(plan, 'Nimble Body');
  const focus = getLevel(plan, 'Focus');
  const bowMastery = getLevel(plan, 'Bow Mastery');
  const crossbowMastery = getLevel(plan, 'Crossbow Mastery');

  return {
    stats: { STR: 0, DEX: 0, INT: 0, LUK: 0 },
    maxHpPercent: 0,
    maxMpPercent: 0,
    accuracy: precise + nimble + focus + Math.floor((bowMastery + crossbowMastery) / 2),
    magicAccuracy: 0,
    avoidability: nimble + focus,
    weaponAttack: 0,
    magicAttack: 0,
    speed: 0,
    jump: 0,
    criticalRate: 0,
    criticalDamage: 0,
  };
}

function recalcPlan(plan) {
  const usedByTier = (plan.skills ?? []).reduce((sum, skill) => {
    const tier = skill.tier === 'second' ? 'second' : 'first';
    sum[tier] = (sum[tier] ?? 0) + roundSkillValue(skill.level);
    return sum;
  }, { first: 0, second: 0 });

  const totals = {
    first: roundSkillValue(plan.totalSpByTier?.first),
    second: roundSkillValue(plan.totalSpByTier?.second),
  };

  const usedSp = usedByTier.first + usedByTier.second;
  const totalSp = totals.first + totals.second;
  const normalizedSkills = (plan.skills ?? []).map((skill) => ({
    ...skill,
    level: roundSkillValue(skill.level),
  }));
  const normalizedPlan = { ...plan, skills: normalizedSkills };

  return {
    ...normalizedPlan,
    current: normalizedSkills.filter((skill) => roundSkillValue(skill.level) > 0),
    totalSpByTier: totals,
    totalSp,
    usedSp,
    remainingSp: Math.max(0, totalSp - usedSp),
    remainingByTier: {
      first: Math.max(0, totals.first - usedByTier.first),
      second: Math.max(0, totals.second - usedByTier.second),
    },
    statBonuses: getCalculatedStatBonuses(normalizedPlan),
  };
}

export function getRecommendedSkillAllocation(args = {}) {
  const base = getRecommendedSkillAllocationBase(args);
  const plan = applyFirstJobRoute(addSecondJobBonusToPlan(
    unlockSecondJobAtLevel30(clonePlan(getSkillPlanBase({ ...args, customSkills: undefined })), args.level),
    args.level,
  ), args);

  return Object.fromEntries((plan.skills ?? []).map((skill) => [skill.name, roundSkillValue(skill.level ?? base[skill.name]) ]));
}

export function getSkillPlan(args = {}) {
  const recommendedAllocation = getRecommendedSkillAllocation(args);
  const hasManualAllocation = args.customSkills && !sameAllocation(args.customSkills, recommendedAllocation);

  const basePlan = clonePlan(getSkillPlanBase({ ...args, customSkills: undefined }));
  unlockSecondJobAtLevel30(basePlan, args.level);
  addSecondJobBonusToPlan(basePlan, args.level);
  applyFirstJobRoute(basePlan, args);

  if (!hasManualAllocation) return recalcPlan(basePlan);
  return applyManualAllocation(basePlan, args.customSkills);
}

export { getApNote };
