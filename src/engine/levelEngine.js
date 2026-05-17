const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];
const MIN_STAT_AP = 4;
const LEVEL_10_TOTAL_AP = 70;
const FIRST_JOB_START_LEVEL = 10;
const SECOND_JOB_START_LEVEL = 30;

const JOB_AP_MINIMUMS = {
  warrior: { STR: 35 },
  magician: { INT: 20 },
  bowman: { DEX: 25 },
  thief: { DEX: 25 },
  pirate: { DEX: 20 },
};

const CLASS_HP_RULES = {
  warrior: { baseHp: 150, baseMp: 20, hpGrowth: 24, mpGrowth: 6, hpPerReset: 52, mpCost: 4, minMp: (level) => level * 4 + 56 },
  magician: { baseHp: 80, baseMp: 120, hpGrowth: 10, mpGrowth: 18, hpPerReset: 8, mpCost: 90, minMp: (level) => level * 22 + 488 },
  bowman: { baseHp: 110, baseMp: 60, hpGrowth: 16, mpGrowth: 6, hpPerReset: 18, mpCost: 12, minMp: (level) => level * 14 + 148 },
  thief: { baseHp: 100, baseMp: 70, hpGrowth: 16, mpGrowth: 6, hpPerReset: 18, mpCost: 12, minMp: (level) => level * 14 + 148 },
  pirate: { baseHp: 120, baseMp: 60, hpGrowth: 20, mpGrowth: 6, hpPerReset: 22, mpCost: 16, minMp: (level) => level * 18 + 111 },
};

const CLASS_TARGET_INT = {
  warrior: { low: 4, mid: 20, high: 40 },
  magician: { low: 35, mid: 35, high: 35 },
  bowman: { low: 20, mid: 50, high: 90 },
  thief: { low: 20, mid: 50, high: 90 },
  pirate: { low: 20, mid: 45, high: 80 },
};

const ROUTE_META = {
  none: { name: '常规路线', maxResets: 0 },
  low: { name: '穷鬼路线', maxResets: 24 },
  mid: { name: '平衡路线', maxResets: 80 },
  high: { name: '有钱路线', maxResets: 180 },
};

const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value, min, max) => Math.min(Math.max(number(value, min), min), max);

function currentEditionId() {
  if (typeof window === 'undefined') return 'global';
  const select = [...document.querySelectorAll('.mg-field')]
    .find((field) => field.textContent?.includes('版本'))
    ?.querySelector('select');
  if (select?.value) return select.value;
  try {
    const saved = JSON.parse(window.localStorage.getItem('mscw-guidebook-state-v2') || '{}');
    return saved.editionId === 'china' ? 'china' : 'global';
  } catch {
    return 'global';
  }
}

function hpRouteEnabled(custom = {}) {
  if (custom.hpWashingEnabled === false || custom.hpRouteEnabled === false) return false;
  if (typeof window === 'undefined') return true;
  try {
    const saved = JSON.parse(window.localStorage.getItem('mscw-guidebook-state-v2') || '{}');
    return saved.hpWashingEnabled !== false && saved.hpRouteEnabled !== false;
  } catch {
    return true;
  }
}

function routeIdFromCustom(custom = {}) {
  if (currentEditionId() !== 'china' || !hpRouteEnabled(custom)) return 'none';
  const value = custom.hpRoute ?? custom.hpWashingRoute ?? custom.budget;
  return ['low', 'mid', 'high'].includes(value) ? value : 'none';
}

function normalizeSkillBonuses(raw = {}) {
  return {
    stats: Object.fromEntries(STAT_KEYS.map((key) => [key, number(raw?.stats?.[key], 0)])),
    maxHpPercent: number(raw?.maxHpPercent, 0),
    maxMpPercent: number(raw?.maxMpPercent, 0),
    accuracy: number(raw?.accuracy, 0),
    magicAccuracy: number(raw?.magicAccuracy, 0),
    avoidability: number(raw?.avoidability, 0),
    weaponAttack: number(raw?.weaponAttack, 0),
    magicAttack: number(raw?.magicAttack, 0),
    speed: number(raw?.speed, 0),
    jump: number(raw?.jump, 0),
    criticalRate: number(raw?.criticalRate, 0),
    criticalDamage: number(raw?.criticalDamage, 0),
  };
}

function minimumStats(classId) {
  const floors = Object.fromEntries(STAT_KEYS.map((key) => [key, MIN_STAT_AP]));
  Object.entries(JOB_AP_MINIMUMS[classId] ?? {}).forEach(([key, value]) => { floors[key] = Math.max(floors[key], value); });
  return floors;
}

function statTotal(stats = {}) {
  return STAT_KEYS.reduce((sum, key) => sum + number(stats[key], 0), 0);
}

function normalizedBase(classLine) {
  const floors = minimumStats(classLine.id);
  const output = { ...classLine.baseStats };
  STAT_KEYS.forEach((key) => { output[key] = Math.max(floors[key], Math.floor(number(output[key], floors[key]))); });
  const deficit = Math.max(0, LEVEL_10_TOTAL_AP - statTotal(output));
  if (deficit > 0) output[classLine.primaryStat] = number(output[classLine.primaryStat], floors[classLine.primaryStat]) + deficit;
  return output;
}

export function getLevelGains(level) {
  const safeLevel = clamp(level, 1, 200);
  return {
    ap: safeLevel <= FIRST_JOB_START_LEVEL ? 0 : 5,
    sp: safeLevel < FIRST_JOB_START_LEVEL ? 0 : safeLevel === FIRST_JOB_START_LEVEL ? 1 : safeLevel === SECOND_JOB_START_LEVEL ? 4 : 3,
  };
}

export function getTotalApFromLevel(level) {
  return Math.max(0, clamp(level, 1, 200) - FIRST_JOB_START_LEVEL) * 5;
}

export function getTotalSpFromLevel(level, firstJobLevel = FIRST_JOB_START_LEVEL, secondJobLevel = SECOND_JOB_START_LEVEL) {
  const safeLevel = clamp(level, 1, 200);
  const firstJobSp = safeLevel < firstJobLevel ? 0 : 1 + Math.max(0, Math.min(safeLevel, secondJobLevel) - firstJobLevel) * 3;
  const secondJobSp = safeLevel < secondJobLevel ? 0 : 1 + Math.max(0, safeLevel - secondJobLevel) * 3;
  return firstJobSp + secondJobSp;
}

export function getTotalApPool(level) {
  return LEVEL_10_TOTAL_AP + getTotalApFromLevel(level);
}

function secondaryTarget(classLine, level, budget = 'mid') {
  const secondary = classLine.secondaryStat;
  const baseValue = normalizedBase(classLine)[secondary] ?? MIN_STAT_AP;
  if (classLine.id === 'magician') {
    if (budget === 'low') return Math.max(baseValue, Math.round(level * 0.72));
    if (budget === 'high') return Math.max(baseValue, Math.round(level * 0.95));
    return Math.max(baseValue, Math.round(level * 0.84));
  }
  if (classLine.id === 'bowman') return Math.min(90, Math.max(baseValue, level + 5));
  if (budget === 'high') return Math.max(baseValue, Math.round(level * 0.55));
  if (budget === 'low') return Math.max(baseValue, Math.round(level * 0.9));
  return Math.max(baseValue, Math.round(level * 0.75));
}

function allocateConventional(classLine, level, custom = {}) {
  const totalAp = getTotalApPool(level);
  const base = normalizedBase(classLine);
  const floors = minimumStats(classLine.id);
  const output = { ...base };
  let remaining = Math.max(0, totalAp - statTotal(output));
  const secondary = classLine.secondaryStat;
  const target = number(custom.secondaryTarget, secondaryTarget(classLine, level, custom.budget));
  const addSecondary = Math.min(remaining, Math.max(0, target - number(output[secondary], floors[secondary])));
  output[secondary] += addSecondary;
  remaining -= addSecondary;
  output[classLine.primaryStat] += remaining;
  return sanitizeAllocation(output, totalAp, floors);
}

function sanitizeAllocation(allocation, totalAp, floors) {
  const output = {};
  STAT_KEYS.forEach((key) => { output[key] = Math.max(floors[key] ?? MIN_STAT_AP, Math.floor(number(allocation[key], floors[key] ?? MIN_STAT_AP))); });
  let total = statTotal(output);
  if (total < totalAp) output.STR += totalAp - total;
  if (total > totalAp) {
    let excess = total - totalAp;
    for (const key of ['STR', 'DEX', 'LUK', 'INT']) {
      const floor = floors[key] ?? MIN_STAT_AP;
      const take = Math.min(excess, Math.max(0, output[key] - floor));
      output[key] -= take;
      excess -= take;
      if (excess <= 0) break;
    }
  }
  return output;
}

function applyHpRoute(classLine, level, allocation, custom = {}) {
  const routeId = routeIdFromCustom(custom);
  if (routeId === 'none' || classLine.id === 'magician') return allocation;
  const floors = minimumStats(classLine.id);
  const output = { ...allocation };
  const targetInt = Math.max(floors.INT, CLASS_TARGET_INT[classLine.id]?.[routeId] ?? floors.INT);
  let need = Math.max(0, targetInt - number(output.INT, floors.INT));
  const donors = [classLine.primaryStat, classLine.secondaryStat, 'STR', 'DEX', 'LUK'].filter((key, index, arr) => key !== 'INT' && arr.indexOf(key) === index);
  for (const donor of donors) {
    if (need <= 0) break;
    const floor = floors[donor] ?? MIN_STAT_AP;
    const take = Math.min(need, Math.max(0, number(output[donor], floor) - floor));
    output[donor] -= take;
    output.INT += take;
    need -= take;
  }
  return sanitizeAllocation(output, getTotalApPool(level), floors);
}

export function getRecommendedApAllocation(classLine, level, custom = {}) {
  const safeLevel = clamp(level, 1, 200);
  const conventional = allocateConventional(classLine, safeLevel, custom);
  return applyHpRoute(classLine, safeLevel, conventional, custom);
}

function resolveAllocation(classLine, level, custom = {}) {
  const floors = minimumStats(classLine.id);
  const recommended = getRecommendedApAllocation(classLine, level, custom);
  if (!custom.apAllocation || typeof custom.apAllocation !== 'object') return recommended;
  const requested = sanitizeAllocation(custom.apAllocation, getTotalApPool(level), floors);
  return applyHpRoute(classLine, level, requested, custom);
}

function hpPlan(classLine, level, allocation, baseMp, custom = {}) {
  const routeId = routeIdFromCustom(custom);
  const meta = ROUTE_META[routeId] ?? ROUTE_META.none;
  const rule = CLASS_HP_RULES[classLine.id] ?? CLASS_HP_RULES.warrior;
  const baseInt = number(normalizedBase(classLine).INT, 4);
  const currentInt = number(allocation.INT, baseInt);
  const extraMp = Math.max(0, Math.floor(currentInt / 10) - Math.floor(baseInt / 10)) * Math.max(0, level - 10);
  const minimumMp = Math.max(0, Math.round(rule.minMp(level)));
  const mpBuffer = Math.max(0, baseMp + extraMp - minimumMp);
  const plannedResets = routeId === 'none' || classLine.id === 'magician' ? 0 : Math.min(meta.maxResets, Math.floor(mpBuffer / Math.max(1, rule.mpCost)));
  return {
    routeId,
    routeName: meta.name,
    targetInt: currentInt,
    extraMp,
    minimumMp,
    mpBuffer,
    plannedResets,
    hpGain: plannedResets * rule.hpPerReset,
    mpSpent: plannedResets * rule.mpCost,
    resetTicketEstimate: plannedResets + Math.max(0, currentInt - baseInt),
  };
}

function applyPercent(value, percent) {
  return Math.round(number(value, 0) * (1 + number(percent, 0) / 100));
}

function estimateAccuracy(stats) {
  return Math.floor(number(stats.DEX, 0) / 3) + Math.floor(number(stats.LUK, 0) / 6) + 5;
}

function estimateMagicAccuracy(stats, level) {
  return Math.round(number(stats.INT, 0) * 0.8 + number(stats.LUK, 0) * 0.35 + number(level, 1) * 0.5);
}

export function buildStatPlan(classLine, level, custom = {}) {
  const safeLevel = clamp(level, 1, 200);
  const budget = custom.budget ?? 'mid';
  const skillBonuses = normalizeSkillBonuses(custom.skillBonuses);
  const floors = minimumStats(classLine.id);
  const base = normalizedBase(classLine);
  const allocation = resolveAllocation(classLine, safeLevel, custom);
  const stats = { ...allocation };
  STAT_KEYS.forEach((key) => { stats[key] += skillBonuses.stats[key] ?? 0; });

  const hpRule = CLASS_HP_RULES[classLine.id] ?? CLASS_HP_RULES.warrior;
  const baseHp = number(classLine.baseStats.HP, hpRule.baseHp) + safeLevel * hpRule.hpGrowth;
  const baseMp = number(classLine.baseStats.MP, hpRule.baseMp) + safeLevel * (hpRule.mpGrowth + number(stats.INT, 0) * (classLine.id === 'magician' ? 0.08 : 0.02));
  stats.HP = applyPercent(baseHp, skillBonuses.maxHpPercent);
  stats.MP = applyPercent(baseMp, skillBonuses.maxMpPercent);

  const plan = hpPlan(classLine, safeLevel, allocation, stats.MP, custom);
  stats.HP = Math.round(stats.HP + plan.hpGain);
  stats.MP = Math.max(plan.minimumMp, Math.round(stats.MP + plan.extraMp - plan.mpSpent));

  const totalAp = getTotalApPool(safeLevel);
  const allocatedAp = statTotal(allocation);
  const secondaryTargetValue = secondaryTarget(classLine, safeLevel, budget);
  const accuracyTarget = classLine.id === 'magician' ? 0 : Math.max(0, Math.round(safeLevel * (budget === 'high' ? 1.35 : budget === 'low' ? 1.75 : 1.55)));
  const accuracy = estimateAccuracy(stats) + skillBonuses.accuracy;
  const magicAccuracy = estimateMagicAccuracy(stats, safeLevel) + skillBonuses.magicAccuracy;

  return {
    level: safeLevel,
    totalAp,
    baseApTotal: LEVEL_10_TOTAL_AP,
    baseApDeficit: Math.max(0, LEVEL_10_TOTAL_AP - statTotal(classLine.baseStats)),
    levelUpAp: getTotalApFromLevel(safeLevel),
    minStats: floors,
    apMinStats: floors,
    totalSp: getTotalSpFromLevel(safeLevel, FIRST_JOB_START_LEVEL, SECOND_JOB_START_LEVEL),
    remainingAp: Math.max(0, totalAp - allocatedAp),
    primaryAdded: Math.max(0, number(allocation[classLine.primaryStat], floors[classLine.primaryStat]) - number(base[classLine.primaryStat], floors[classLine.primaryStat])),
    secondaryAdded: Math.max(0, number(allocation[classLine.secondaryStat], floors[classLine.secondaryStat]) - number(base[classLine.secondaryStat], floors[classLine.secondaryStat])),
    secondaryTarget: secondaryTargetValue,
    accuracyTarget,
    hpPlan: plan,
    hpWashingPlan: plan,
    apAllocation: allocation,
    stats,
    derived: {
      accuracy,
      magicAccuracy,
      hp: stats.HP,
      mp: stats.MP,
      hpPlan: plan,
      hpWashingPlan: plan,
      avoidability: skillBonuses.avoidability,
      weaponAttackBonus: skillBonuses.weaponAttack,
      magicAttackBonus: skillBonuses.magicAttack,
      speedBonus: skillBonuses.speed,
      jumpBonus: skillBonuses.jump,
      criticalRateBonus: skillBonuses.criticalRate,
      criticalDamageBonus: skillBonuses.criticalDamage,
    },
  };
}
