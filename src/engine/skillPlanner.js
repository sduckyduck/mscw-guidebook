import {
  getSkillPlan as getSkillPlanBase,
  getRecommendedSkillAllocation as getRecommendedSkillAllocationBase,
  getApNote,
} from './skillPlannerRealPlayer.js';

function number(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundSkillValue(value) {
  return Math.max(0, Math.round(number(value, 0)));
}

function copyPlan(plan) {
  return {
    ...plan,
    skills: (plan.skills ?? []).map((skill) => ({ ...skill })),
    current: (plan.current ?? []).map((skill) => ({ ...skill })),
    next: (plan.next ?? []).map((step) => ({ ...step })),
    totalSpByTier: { ...(plan.totalSpByTier ?? {}) },
    remainingByTier: { ...(plan.remainingByTier ?? {}) },
  };
}

function applyLevel30SecondJobSp(plan, level, autoFillMissing = true) {
  const next = copyPlan(plan);
  const currentLevel = number(level, 1);
  if (currentLevel < 30) return recalcPlan(next);

  for (const skill of next.skills ?? []) {
    if (skill.tier === 'second') skill.locked = false;
  }

  const currentSecondSp = roundSkillValue(next.totalSpByTier?.second);
  const expectedSecondSp = 1 + Math.max(0, currentLevel - 30) * 3;
  next.totalSpByTier = { ...(next.totalSpByTier ?? {}), second: Math.max(currentSecondSp, expectedSecondSp) };

  if (!autoFillMissing) return recalcPlan(next);

  const usedSecondSp = (next.skills ?? [])
    .filter((skill) => skill.tier === 'second')
    .reduce((sum, skill) => sum + roundSkillValue(skill.level), 0);
  let missingSecondSp = Math.max(0, expectedSecondSp - usedSecondSp);

  for (const skill of next.skills ?? []) {
    if (!missingSecondSp || skill.tier !== 'second' || skill.locked) continue;
    const available = Math.max(0, roundSkillValue(skill.max) - roundSkillValue(skill.level));
    const add = Math.min(available, missingSecondSp);
    skill.level = roundSkillValue(skill.level) + add;
    missingSecondSp -= add;
  }

  return recalcPlan(next);
}

function applyExactSkillAllocation(plan, customSkills = {}) {
  const next = copyPlan(plan);
  const totals = {
    first: roundSkillValue(next.totalSpByTier?.first),
    second: roundSkillValue(next.totalSpByTier?.second),
  };
  const used = { first: 0, second: 0 };

  for (const skill of next.skills ?? []) {
    if (skill.locked) {
      skill.level = 0;
      continue;
    }
    const tier = skill.tier === 'second' ? 'second' : 'first';
    const available = Math.max(0, totals[tier] - used[tier]);
    const requested = roundSkillValue(customSkills?.[skill.name]);
    const level = Math.min(requested, roundSkillValue(skill.max), available);
    skill.level = level;
    used[tier] += level;
  }

  return recalcPlan(next);
}

function recalcPlan(plan) {
  const skills = (plan.skills ?? []).map((skill) => ({ ...skill, level: roundSkillValue(skill.level) }));
  const totals = {
    first: roundSkillValue(plan.totalSpByTier?.first),
    second: roundSkillValue(plan.totalSpByTier?.second),
  };
  const used = skills.reduce((sum, skill) => {
    const tier = skill.tier === 'second' ? 'second' : 'first';
    sum[tier] = (sum[tier] ?? 0) + roundSkillValue(skill.level);
    return sum;
  }, { first: 0, second: 0 });

  return {
    ...plan,
    skills,
    current: skills.filter((skill) => roundSkillValue(skill.level) > 0),
    totalSpByTier: totals,
    totalSp: totals.first + totals.second,
    usedSp: used.first + used.second,
    remainingSp: Math.max(0, totals.first + totals.second - used.first - used.second),
    remainingByTier: {
      first: Math.max(0, totals.first - used.first),
      second: Math.max(0, totals.second - used.second),
    },
  };
}

export function getRecommendedSkillAllocation(args = {}) {
  const plan = applyLevel30SecondJobSp(getSkillPlanBase({ ...args, customSkills: undefined }), args.level, true);
  return Object.fromEntries((plan.skills ?? []).map((skill) => [skill.name, roundSkillValue(skill.level)]));
}

export function getSkillPlan(args = {}) {
  const hasCustomSkills = args.customSkills && typeof args.customSkills === 'object';
  const basePlan = getSkillPlanBase({ ...args, customSkills: undefined });
  const planWithSp = applyLevel30SecondJobSp(basePlan, args.level, !hasCustomSkills);
  return hasCustomSkills ? applyExactSkillAllocation(planWithSp, args.customSkills) : planWithSp;
}

export { getApNote, getRecommendedSkillAllocationBase };
