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
  // Job advancement at Lv.30 gives 1 second-job SP immediately.
  // After that, every new level gives 3 more SP:
  // Lv.30 = 1, Lv.31 = 4, Lv.32 = 7, ...
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

function addToSkill(plan, name, amount) {
  const skill = getSkill(plan, name);
  if (!skill || skill.locked || amount <= 0) return 0;
  const add = Math.min(amount, Math.max(0, roundSkillValue(skill.max) - roundSkillValue(skill.level)));
  skill.level = roundSkillValue(skill.level) + add;
  return add;
}

function applyBowmanFirstJobPrereqRoute(plan, args = {}) {
  if (args.classId !== 'bowman') return plan;

  const firstSkills = (plan.skills ?? []).filter((skill) => skill.tier !== 'second');
  if (!firstSkills.some((skill) => skill.name === 'Arrow Blow') || !firstSkills.some((skill) => skill.name === 'Double Shot')) return plan;

  const total = roundSkillValue(plan.totalSpByTier?.first);
  let left = total;
  for (const skill of firstSkills) skill.level = 0;

  const lowRoute = args.budget === 'low' && args.priority !== 'exp';
  const order = lowRoute
    ? ['Critical Shot', 'The Eye of Amazon', 'Arrow Blow', 'Focus', "Amazon's Judgement", 'Double Shot']
    : ['Critical Shot', 'The Eye of Amazon', 'Arrow Blow', 'Double Shot', 'Focus', "Amazon's Judgement"];
  const caps = lowRoute ? { 'Double Shot': 0 } : { 'Arrow Blow': 1 };

  for (const name of order) {
    if (!left) break;
    const skill = getSkill(plan, name);
    if (!skill) continue;
    const cap = Object.prototype.hasOwnProperty.call(caps, name) ? caps[name] : roundSkillValue(skill.max);
    const add = Math.min(left, Math.max(0, cap - roundSkillValue(skill.level)));
    left -= addToSkill(plan, name, add);
  }

  for (const name of order) {
    if (!left) break;
    if (Object.prototype.hasOwnProperty.call(caps, name)) continue;
    left -= addToSkill(plan, name, left);
  }

  return recalcPlan(plan);
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

  return {
    ...plan,
    skills: (plan.skills ?? []).map((skill) => ({
      ...skill,
      level: roundSkillValue(skill.level),
    })),
    current: (plan.skills ?? []).filter((skill) => roundSkillValue(skill.level) > 0).map((skill) => ({
      ...skill,
      level: roundSkillValue(skill.level),
    })),
    totalSpByTier: totals,
    totalSp,
    usedSp,
    remainingSp: Math.max(0, totalSp - usedSp),
    remainingByTier: {
      first: Math.max(0, totals.first - usedByTier.first),
      second: Math.max(0, totals.second - usedByTier.second),
    },
  };
}

export function getRecommendedSkillAllocation(args = {}) {
  const base = getRecommendedSkillAllocationBase(args);
  const plan = applyBowmanFirstJobPrereqRoute(addSecondJobBonusToPlan(
    unlockSecondJobAtLevel30(clonePlan(getSkillPlanBase({ ...args, customSkills: undefined })), args.level),
    args.level,
  ), args);

  // Use the recalculated plan as the source of truth so the Lv.30 bonus SP is
  // included as an integer and never saved as 3.999999999-style floating values.
  return Object.fromEntries((plan.skills ?? []).map((skill) => [skill.name, roundSkillValue(skill.level ?? base[skill.name]) ]));
}

export function getSkillPlan(args = {}) {
  const recommendedAllocation = getRecommendedSkillAllocation(args);
  const hasManualAllocation = args.customSkills && !sameAllocation(args.customSkills, recommendedAllocation);

  const basePlan = clonePlan(getSkillPlanBase({ ...args, customSkills: undefined }));
  unlockSecondJobAtLevel30(basePlan, args.level);
  addSecondJobBonusToPlan(basePlan, args.level);
  applyBowmanFirstJobPrereqRoute(basePlan, args);

  if (!hasManualAllocation) return recalcPlan(basePlan);
  return applyManualAllocation(basePlan, args.customSkills);
}

export { getApNote };
