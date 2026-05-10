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

const WEAPON_MULTIPLIERS = {
  warrior: { min: 4.0, max: 4.6 },
  bowman: { min: 3.4, max: 3.4 },
  thief: { min: 3.6, max: 3.6 },
  pirate: { min: 3.6, max: 3.6 },
};

const SKILL_WEAPON_MULTIPLIERS = {
  'lucky seven': { min: 2.6, max: 2.6 },
};

const LEGACY_MAIN_ATTACK_SCALE = {
  warrior: 0.55,
  bowman: 0.54,
  thief: 0.49,
  pirate: 0.52,
};

const DEFAULT_WEAPON_MULTIPLIER = { min: 4.0, max: 4.0 };
const DEFAULT_LEGACY_SCALE = 0.54;

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
  const healRecovery = effect.match(/\brecovery\s+(\d+(?:\.\d+)?)%/i)?.[1]
    ?? effect.match(/\bheal\s+(\d+(?:\.\d+)?)%/i)?.[1];
  const hits = multi ? number(multi[1], 1) : (MULTI_HIT_SKILLS.get(name) ?? 1);

  if (healRecovery !== undefined && name === 'heal') {
    return { kind: 'heal', effect, hits, recoveryRate: number(healRecovery, 100), ratio: 1 };
  }

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

function getMasteryRatio(skills = []) {
  const masteryLevel = getSkillLevel(skills, /mastery/i);
  if (!masteryLevel) return 0.1 * 0.8;
  return (0.1 + masteryLevel / 10) * 0.8;
}

function getStats(args = {}) {
  const stats = args.statPlan?.stats ?? args.stats ?? {};
  return {
    STR: number(stats.STR),
    DEX: number(stats.DEX),
    INT: number(stats.INT),
    LUK: number(stats.LUK),
  };
}

function getPrimaryStat(classId, stats) {
  if (classId === 'magician') return stats.INT;
  if (classId === 'bowman') return stats.DEX;
  if (classId === 'thief') return stats.LUK;
  if (classId === 'pirate') return Math.max(stats.STR, stats.DEX);
  return stats.STR;
}

function getSecondaryStat(classId, stats) {
  if (classId === 'thief') return stats.STR + stats.DEX;
  if (classId === 'bowman') return stats.STR;
  if (classId === 'pirate') return Math.min(stats.STR, stats.DEX);
  if (classId === 'magician') return stats.LUK;
  return stats.DEX;
}

function getPhysicalMultipliers(classId, skillName) {
  return SKILL_WEAPON_MULTIPLIERS[normalizeName(skillName)]
    ?? WEAPON_MULTIPLIERS[classId]
    ?? DEFAULT_WEAPON_MULTIPLIER;
}

function getExplicitWeaponAttack(args = {}) {
  const direct = number(args.weaponAttack, 0) || number(args.watk, 0) || number(args.attackPower, 0);
  if (direct > 0) return direct;

  const weapon = args.weapon ?? args.gear?.find?.((item) => item?.slot === 'weapon');
  const fromWeapon = number(weapon?.incPAD, 0) || number(weapon?.stats?.incPAD, 0);
  const fromGear = (args.gear ?? []).reduce((sum, item) => (
    sum + number(item?.incPAD, 0) + number(item?.stats?.incPAD, 0)
  ), 0);
  return fromWeapon || fromGear;
}

function deriveWeaponAttackFromLegacyMax({ args, stats, multiplier, skillMult = 1 }) {
  const legacyMax = Math.max(1, number(args.mainAttack, 1));
  const classScale = LEGACY_MAIN_ATTACK_SCALE[args.classId] ?? DEFAULT_LEGACY_SCALE;
  const normalizedMax = Math.max(1, legacyMax * classScale);
  const primary = getPrimaryStat(args.classId, stats);
  const secondary = getSecondaryStat(args.classId, stats);
  const attackPower = number(args.attackPower, 0);
  const denominator = skillMult * ((100 + primary * multiplier.max + secondary + attackPower) / 100);
  if (denominator <= 0) return Math.max(1, normalizedMax);
  return Math.max(1, normalizedMax / denominator);
}

function getWeaponAttack(args, stats, multiplier, skillMult = 1) {
  return getExplicitWeaponAttack(args) || deriveWeaponAttackFromLegacyMax({ args, stats, multiplier, skillMult });
}

function getBasePhysicalRange(args = {}, skills = [], skillName = 'Base Attack', skillMult = 1) {
  const stats = getStats(args);
  if (!stats.STR && !stats.DEX && !stats.INT && !stats.LUK) {
    const max = Math.max(1, Math.round(number(args.mainAttack, 1) * (LEGACY_MAIN_ATTACK_SCALE[args.classId] ?? DEFAULT_LEGACY_SCALE)));
    const min = Math.max(1, Math.round(max * getMasteryRatio(skills)));
    return { min: Math.min(min, max), max };
  }

  const multiplier = getPhysicalMultipliers(args.classId, skillName);
  const primary = getPrimaryStat(args.classId, stats);
  const secondary = getSecondaryStat(args.classId, stats);
  const attackPower = number(args.attackPower, 0);
  const mastery = getMasteryRatio(skills);
  const weaponAttack = getWeaponAttack(args, stats, multiplier, skillMult);

  const min = skillMult * ((80 + primary * multiplier.min * mastery + secondary + attackPower) / 100) * weaponAttack;
  const max = skillMult * ((100 + primary * multiplier.max + secondary + attackPower) / 100) * weaponAttack;

  return {
    min: Math.max(1, Math.round(Math.min(min, max))),
    max: Math.max(1, Math.round(Math.max(min, max))),
  };
}

function getMagicAttack(args = {}) {
  return number(args.magicAttack, 0)
    || number(args.matk, 0)
    || number(args.mainAttack, 1);
}

function getMagicRange(args = {}, profile, skills = []) {
  const magicAttack = Math.max(1, getMagicAttack(args));
  const mastery = getMasteryRatio(skills);
  const basicAttack = Math.max(0, number(profile.basicAttack, 0));
  const min = (basicAttack + magicAttack / 7.0) * ((magicAttack * 2 * mastery + magicAttack) / 100.0 + 1.0);
  const max = (basicAttack + magicAttack / 7.0) * ((magicAttack * 2 + magicAttack) / 100.0 + 1.0);
  return {
    min: Math.max(1, Math.round(Math.min(min, max))),
    max: Math.max(1, Math.round(Math.max(min, max))),
  };
}

function getMagicPercentRange(args = {}, profile, skills = []) {
  const range = getMagicRange(args, { ...profile, basicAttack: 0 }, skills);
  const ratio = Math.max(0.01, number(profile.ratio, 1));
  return {
    min: Math.max(1, Math.round(range.min * ratio)),
    max: Math.max(1, Math.round(range.max * ratio)),
  };
}

function getHealRange(args = {}, profile) {
  const stats = getStats(args);
  const magicAttack = Math.max(1, getMagicAttack(args));
  const targetsHit = Math.max(1, number(args.targetsHit, 1));
  const recoveryRate = Math.max(1, number(profile.recoveryRate, 100));
  const min = ((stats.INT * 0.5 + stats.LUK) / 200.0 + 3.0) * magicAttack * (recoveryRate / 100.0) * (targetsHit * 0.1 + 1.0) / targetsHit * 0.5;
  const max = ((stats.INT * 0.8 + stats.LUK) / 200.0 + 3.0) * magicAttack * (recoveryRate / 100.0) * (targetsHit * 0.1 + 1.0) / targetsHit * 0.5;
  return {
    min: Math.max(1, Math.round(Math.min(min, max))),
    max: Math.max(1, Math.round(Math.max(min, max))),
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
    damageText: hits > 1 ? `${totalMin} - ${totalMax}/cast (${perHitMin} - ${perHitMax}/hit)` : `${totalMin} - ${totalMax}`,
    isBase,
  };
}

function buildDamageCards(skills = [], args = {}) {
  const base = getBasePhysicalRange(args, skills, 'Base Attack', 1);
  const cards = skills
    .filter(isDamageSkill)
    .map((skill) => {
      const profile = parseDamageProfile(skill);
      if (!profile) return null;
      const range = profile.kind === 'magic'
        ? getMagicRange(args, profile, skills)
        : profile.kind === 'magic-percent'
          ? getMagicPercentRange(args, profile, skills)
          : profile.kind === 'heal'
            ? getHealRange(args, profile)
            : getBasePhysicalRange(args, skills, skill.name, profile.ratio);
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
  const level = number(args.level, 1);
  if (level < 30) return plan;
  for (const skill of plan.skills ?? []) {
    if (skill.tier === 'second') skill.locked = false;
  }

  const currentSecondSp = roundSkillValue(plan.totalSpByTier?.second);
  const expectedSecondSp = 1 + Math.max(0, level - 30) * 3;

  if (currentSecondSp < expectedSecondSp) {
    const missingSecondSp = expectedSecondSp - currentSecondSp;
    plan.totalSpByTier = { ...(plan.totalSpByTier ?? {}), second: expectedSecondSp };
    const firstSecondSkill = (plan.skills ?? []).find((skill) => skill.tier === 'second' && !skill.locked);
    if (firstSecondSkill) {
      firstSecondSkill.level = Math.min(
        roundSkillValue(firstSecondSkill.max),
        roundSkillValue(firstSecondSkill.level) + missingSecondSp,
      );
    }
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
