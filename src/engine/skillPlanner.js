import {
  getRecommendedSkillAllocation as getRecommendedSkillAllocationBase,
  getSkillPlan as getSkillPlanBase,
  getApNote,
} from './skillPlannerRealPlayer.js';

function withSecondJobAdvancementBonus(args = {}) {
  const level = Number(args.level);
  if (!Number.isFinite(level) || level < 30) return args;

  // In MapleStory, the level-30 job advancement grants 1 second-job SP immediately.
  // The base planner gives second-job SP only after Lv.30, so add 1/3 level:
  // Lv.30 => 1 SP, Lv.31 => 4 SP, Lv.50 => 61 SP.
  return { ...args, level: level + 1 / 3 };
}

function normalizeDisplayedLevels(plan, realLevel) {
  const level = Number(realLevel);
  if (!Number.isFinite(level)) return plan;
  return {
    ...plan,
    next: (plan.next ?? []).map((step) => ({
      ...step,
      level: Math.max(level, Math.round(Number(step.level) || level)),
    })),
  };
}

export function getRecommendedSkillAllocation(args = {}) {
  return getRecommendedSkillAllocationBase(withSecondJobAdvancementBonus(args));
}

export function getSkillPlan(args = {}) {
  const plan = getSkillPlanBase(withSecondJobAdvancementBonus(args));
  return normalizeDisplayedLevels(plan, args.level);
}

export { getApNote };
