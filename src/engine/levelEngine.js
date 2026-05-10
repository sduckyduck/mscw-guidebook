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

const ROUTE_HIT_TARGETS = {
  low: { stable: 0.96, exp: 0.92, material: 0.94, meso: 0.95 },
  mid: { stable: 0.9, exp: 0.84, material: 0.88, meso: 0.89 },
  high: { stable: 0.82, exp: 0.78, material: 0.8, meso: 0.8 },
};

const FLOW_SECONDARY_RATIOS = {
  warrior: { high: 0.18, mid: 0.32 },
  thief: { high: 0.2, mid: 0.34 },
  pirate: { high: 0.18, mid: 0.3 },
};

const LOW_BUDGET_ACCURACY_SECONDARY_CLASSES = new Set(['warrior', 'thief']);
const clamp = (value, min, max) => Math.min(Math.max(Number(value) || min, min), max);
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

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

function getMinimumStatsForClass(classId) {
  const floors = Object.fromEntries(STAT_KEYS.map((key) => [key, MIN_STAT_AP]));
  const jobFloors = JOB_AP_MINIMUMS[classId] ?? {};
  for (const key of STAT_KEYS) floors[key] = Math.max(floors[key], number(jobFloors[key], 0));
  return floors;
}

function getStatTotal(stats = {}) {
  return STAT_KEYS.reduce((sum, key) => sum + number(stats?.[key], 0), 0);
}

function getLevel10BaseApDeficit(baseStats = {}) {
  return Math.max(0, LEVEL_10_TOTAL_AP - getStatTotal(baseStats));
}

function normalizeLevel10BaseStats(baseStats = {}, primaryStat = 'STR', classId = '') {
  const minStats = getMinimumStatsForClass(classId);
  const stats = { ...baseStats };
  const deficit = getLevel10BaseApDeficit(stats);
  if (deficit > 0 && STAT_KEYS.includes(primaryStat)) stats[primaryStat] = number(stats[primaryStat], 0) + deficit;
  for (const key of STAT_KEYS) stats[key] = Math.max(minStats[key], Math.floor(number(stats[key], minStats[key])));
  return stats;
}

function applyPercent(value, percent) {
  return Math.round(number(value, 0) * (1 + number(percent, 0) / 100));
}

export function getLevelGains(level) {
  const safeLevel = clamp(level, 1, 200);
  return {
    ap: safeLevel <= FIRST_JOB_START_LEVEL ? 0 : 5,
    sp: safeLevel < FIRST_JOB_START_LEVEL
      ? 0
      : safeLevel === FIRST_JOB_START_LEVEL
        ? 1
        : safeLevel === SECOND_JOB_START_LEVEL
          ? 4
          : 3,
  };
}

export function getTotalApFromLevel(level) {
  const safeLevel = clamp(level, 1, 200);
  return Math.max(0, safeLevel - FIRST_JOB_START_LEVEL) * 5;
}

export function getTotalSpFromLevel(level, firstJobLevel = FIRST_JOB_START_LEVEL, secondJobLevel = SECOND_JOB_START_LEVEL) {
  const safeLevel = clamp(level, 1, 200);
  const firstJobSp = safeLevel < firstJobLevel
    ? 0
    : 1 + Math.max(0, Math.min(safeLevel, secondJobLevel) - firstJobLevel) * 3;
  const secondJobSp = safeLevel < secondJobLevel
    ? 0
    : 1 + Math.max(0, safeLevel - secondJobLevel) * 3;
  return firstJobSp + secondJobSp;
}

export function getTotalApPool(level) {
  return LEVEL_10_TOTAL_AP + getTotalApFromLevel(level);
}

export function getRecommendedApAllocation(classLine, level, custom = {}) {
  const safeLevel = clamp(level, 1, 200);
  const totalAp = getTotalApPool(safeLevel);
  const primary = classLine.primaryStat;
  const secondary = classLine.secondaryStat;
  const budget = custom.budget ?? 'mid';
  const minStats = getMinimumStatsForClass(classLine.id);
  const baseStats = normalizeLevel10BaseStats(classLine.baseStats, primary, classLine.id);

  if (classLine.id === 'magician') {
    return allocatePrimaryAfterSecondary({
      baseStats,
      primary,
      secondary,
      secondaryTarget: custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel, budget, custom),
      totalAp,
      minStats,
    });
  }

  const conventionalSecondaryTarget = custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel, budget, custom);
  const skillBonuses = normalizeSkillBonuses(custom.skillBonuses);
  const routeSecondaryTarget = chooseSecondaryForAccuracy({
    classLine,
    baseStats,
    primary,
    secondary,
    conventionalSecondaryTarget,
    totalAp,
    minStats,
    accuracyTarget: custom.accuracyTarget ?? inferAccuracyTarget(classLine.id, safeLevel, budget, custom),
    bonusAccuracy: skillBonuses.accuracy + estimateBudgetGearAccuracy(classLine.id, safeLevel, budget),
    budget,
  });

  return allocatePrimaryAfterSecondary({ baseStats, primary, secondary, secondaryTarget: routeSecondaryTarget, totalAp, minStats });
}

export function buildStatPlan(classLine, level, custom = {}) {
  const safeLevel = clamp(level, 1, 200);
  const primary = classLine.primaryStat;
  const secondary = classLine.secondaryStat;
  const rawBaseStats = classLine.baseStats;
  const minStats = getMinimumStatsForClass(classLine.id);
  const baseStats = normalizeLevel10BaseStats(rawBaseStats, primary, classLine.id);
  const skillBonuses = normalizeSkillBonuses(custom.skillBonuses);
  const totalAp = getTotalApPool(safeLevel);
  const budget = custom.budget ?? 'mid';
  const secondaryTarget = custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel, budget, custom);
  const accuracyTarget = custom.accuracyTarget ?? inferAccuracyTarget(classLine.id, safeLevel, budget, custom);
  const recommendedAllocation = getRecommendedApAllocation(classLine, safeLevel, custom);
  const allocation = resolveFinalApAllocation(custom.apAllocation, baseStats, recommendedAllocation, totalAp, minStats, classLine, safeLevel, custom);
  const stats = { ...allocation };

  for (const key of STAT_KEYS) stats[key] += skillBonuses.stats[key] ?? 0;

  const baseHp = Math.round((stats.HP ?? rawBaseStats.HP ?? 0) + safeLevel * inferHpGrowth(classLine.id));
  const baseMp = Math.round((stats.MP ?? rawBaseStats.MP ?? 0) + safeLevel * inferMpGrowth(classLine.id, stats.INT));
  stats.HP = applyPercent(baseHp, skillBonuses.maxHpPercent);
  stats.MP = applyPercent(baseMp, skillBonuses.maxMpPercent);

  const allocatedAp = STAT_KEYS.reduce((sum, key) => sum + number(allocation[key], 0), 0);
  const accuracy = estimateAccuracy(classLine.id, stats, safeLevel) + skillBonuses.accuracy;
  const magicAccuracy = estimateMagicAccuracy(stats, safeLevel) + skillBonuses.magicAccuracy;

  return {
    level: safeLevel,
    totalAp,
    baseApTotal: LEVEL_10_TOTAL_AP,
    baseApDeficit: getLevel10BaseApDeficit(rawBaseStats),
    levelUpAp: getTotalApFromLevel(safeLevel),
    minStats,
    apMinStats: minStats,
    totalSp: getTotalSpFromLevel(safeLevel, FIRST_JOB_START_LEVEL, SECOND_JOB_START_LEVEL),
    remainingAp: Math.max(0, totalAp - allocatedAp),
    primaryAdded: Math.max(0, (allocation[primary] ?? minStats[primary]) - (baseStats[primary] ?? minStats[primary])),
    secondaryAdded: Math.max(0, (allocation[secondary] ?? minStats[secondary]) - (baseStats[secondary] ?? minStats[secondary])),
    secondaryTarget,
    accuracyTarget,
    apAllocation: allocation,
    stats,
    derived: {
      accuracy,
      magicAccuracy,
      hp: stats.HP,
      mp: stats.MP,
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

function allocatePrimaryAfterSecondary({ baseStats, primary, secondary, secondaryTarget, totalAp, minStats }) {
  const allocation = { ...baseStats };
  const baseSecondary = allocation[secondary] ?? minStats[secondary];
  const targetSecondary = Math.max(baseSecondary, Math.floor(number(secondaryTarget, baseSecondary)));
  const extraAp = Math.max(0, number(totalAp, 0) - getStatTotal(allocation));
  const addSecondary = Math.min(extraAp, Math.max(0, targetSecondary - baseSecondary));
  allocation[secondary] = baseSecondary + addSecondary;
  allocation[primary] = (allocation[primary] ?? minStats[primary]) + Math.max(0, extraAp - addSecondary);
  return sanitizeFinalApAllocation(allocation, totalAp, minStats);
}

function chooseSecondaryForAccuracy({ classLine, baseStats, primary, secondary, conventionalSecondaryTarget, totalAp, minStats, accuracyTarget, bonusAccuracy, budget }) {
  if (budget !== 'low') return conventionalSecondaryTarget;
  if (!LOW_BUDGET_ACCURACY_SECONDARY_CLASSES.has(classLine.id)) return conventionalSecondaryTarget;
  const extraAp = Math.max(0, number(totalAp, 0) - getStatTotal(baseStats));
  const baseSecondary = baseStats[secondary] ?? minStats[secondary];
  const maxSecondary = baseSecondary + extraAp;
  const floorTarget = Math.max(baseSecondary, Math.floor(number(conventionalSecondaryTarget, baseSecondary)));
  for (let candidate = floorTarget; candidate <= maxSecondary; candidate += 1) {
    const allocation = allocatePrimaryAfterSecondary({ baseStats, primary, secondary, secondaryTarget: candidate, totalAp, minStats });
    const acc = estimateAccuracy(classLine.id, allocation) + number(bonusAccuracy, 0);
    if (acc >= accuracyTarget) return candidate;
  }
  return maxSecondary;
}

function resolveFinalApAllocation(customAllocation, baseStats, recommendedAllocation, totalAp, minStats, classLine, level, custom = {}) {
  if (!customAllocation || typeof customAllocation !== 'object') return sanitizeFinalApAllocation(recommendedAllocation, totalAp, minStats);
  const values = STAT_KEYS.map((key) => number(customAllocation?.[key], 0));
  const looksLikeFinalStats = values.every((value, index) => value >= minStats[STAT_KEYS[index]]);
  const requested = looksLikeFinalStats ? customAllocation : migrateAddedApToFinalStats(customAllocation, baseStats, minStats);
  const sanitized = sanitizeFinalApAllocation(requested, totalAp, minStats);
  return shouldUseCurrentRecommendationInsteadOfSaved(sanitized, recommendedAllocation, classLine, level, custom)
    ? sanitizeFinalApAllocation(recommendedAllocation, totalAp, minStats)
    : sanitized;
}

function migrateAddedApToFinalStats(customAllocation, baseStats, minStats) {
  const migrated = { ...baseStats };
  for (const key of STAT_KEYS) migrated[key] = (migrated[key] ?? minStats[key]) + Math.max(0, Math.floor(number(customAllocation?.[key], 0)));
  return migrated;
}

function shouldUseCurrentRecommendationInsteadOfSaved(saved, recommended, classLine, level, custom = {}) {
  const budget = custom.budget ?? 'mid';
  const primary = classLine.primaryStat;
  const secondary = classLine.secondaryStat;
  if (sameApAllocation(saved, recommended)) return false;
  for (const otherBudget of ['low', 'mid', 'high']) {
    if (otherBudget === budget) continue;
    const otherRecommended = getRecommendedApAllocation(classLine, level, { ...custom, budget: otherBudget, apAllocation: undefined });
    if (sameApAllocation(saved, otherRecommended)) return true;
  }
  const savedSecondary = number(saved?.[secondary], 0);
  const recommendedSecondary = number(recommended?.[secondary], 0);
  const savedPrimary = number(saved?.[primary], 0);
  const recommendedPrimary = number(recommended?.[primary], 0);
  if (budget === 'high' && savedSecondary > recommendedSecondary + 8 && savedPrimary < recommendedPrimary) return true;
  if (budget === 'low' && savedSecondary + 8 < recommendedSecondary && savedPrimary > recommendedPrimary) return true;
  if (budget === 'low' && !LOW_BUDGET_ACCURACY_SECONDARY_CLASSES.has(classLine.id) && savedSecondary > recommendedSecondary + 8 && savedPrimary < recommendedPrimary) return true;
  return false;
}

function sameApAllocation(left = {}, right = {}) {
  return STAT_KEYS.every((key) => Math.floor(number(left?.[key], 0)) === Math.floor(number(right?.[key], 0)));
}

function sanitizeFinalApAllocation(allocation, totalAp, minStats = getMinimumStatsForClass('')) {
  let remaining = Math.max(0, number(totalAp, 0));
  const next = {};
  for (const key of STAT_KEYS) {
    const floor = minStats[key] ?? MIN_STAT_AP;
    const requested = Math.max(floor, Math.floor(number(allocation?.[key], floor)));
    next[key] = Math.min(requested, remaining);
    remaining -= next[key];
  }
  for (const key of [...STAT_KEYS].reverse()) {
    const floor = minStats[key] ?? MIN_STAT_AP;
    if (next[key] >= floor) continue;
    let needed = floor - next[key];
    next[key] = floor;
    for (const donor of STAT_KEYS) {
      if (donor === key) continue;
      const donorFloor = minStats[donor] ?? MIN_STAT_AP;
      const available = Math.max(0, (next[donor] ?? donorFloor) - donorFloor);
      const take = Math.min(available, needed);
      next[donor] -= take;
      needed -= take;
      if (needed <= 0) break;
    }
  }
  return next;
}

function inferSecondaryTarget(classId, level, budget = 'mid') {
  const safeLevel = number(level, 1);
  const levelUpAp = getTotalApFromLevel(safeLevel);
  const base = getNormalizedBaseSecondary(classId);
  if (classId === 'magician') {
    if (budget === 'low') return Math.max(8, Math.round(safeLevel * 0.72));
    if (budget === 'high') return Math.max(8, Math.round(safeLevel * 0.95));
    return Math.max(8, Math.round(safeLevel * 0.84));
  }
  if (classId === 'bowman') return Math.min(90, Math.max(base, safeLevel + 5));
  const ratio = FLOW_SECONDARY_RATIOS[classId]?.[budget];
  if (ratio !== undefined) return Math.max(base, Math.round(base + levelUpAp * ratio));
  if (budget === 'high') return Math.max(base, Math.round(safeLevel * 0.55));
  return Math.max(base, Math.round(safeLevel * 0.9));
}

function inferAccuracyTarget(classId, level, budget = 'mid', custom = {}) {
  if (classId === 'magician') return 0;
  const safeLevel = number(level, 1);
  const priority = custom.priority ?? 'stable';
  const target = inferRouteTargetMonster(classId, safeLevel, budget, priority);
  const desired = ROUTE_HIT_TARGETS[budget]?.[priority] ?? ROUTE_HIT_TARGETS[budget]?.stable ?? 0.9;
  const required = getAccuracyForHitRate({ characterLevel: safeLevel, monsterLevel: target.level, avoid: target.avoid, desiredHitRate: desired });
  const skillAcc = normalizeSkillBonuses(custom.skillBonuses).accuracy;
  const gearAcc = estimateBudgetGearAccuracy(classId, safeLevel, budget);
  return Math.max(0, Math.ceil(required - skillAcc - gearAcc));
}

function getNormalizedBaseSecondary(classId) {
  if (classId === 'warrior') return 15;
  if (classId === 'bowman') return 12;
  if (classId === 'thief') return 25;
  if (classId === 'pirate') return 20;
  return 4;
}

function inferRouteTargetMonster(classId, level, budget, priority) {
  const targetLevel = Math.max(1, Math.round(level + getTargetOverLevel(classId, level, budget, priority)));
  return { level: targetLevel, avoid: estimateMonsterAvoid(targetLevel) };
}

function getTargetOverLevel(classId, level, budget, priority) {
  if (budget === 'low') {
    if (priority === 'exp') return level >= 30 ? 3 : level >= 18 ? 2 : 1;
    if (classId === 'warrior') return level >= 25 ? 2 : 1;
    return level >= 25 ? 2 : 1;
  }
  if (budget === 'high') {
    if (priority === 'exp') return level >= 30 ? 6 : 4;
    return level >= 30 ? 4 : 3;
  }
  return level >= 30 ? 3 : 2;
}

function estimateMonsterAvoid(monsterLevel) {
  const level = Math.max(1, number(monsterLevel, 1));
  if (level <= 10) return Math.max(1, Math.round(level * 0.28));
  if (level <= 25) return Math.round(2 + level * 0.38);
  if (level <= 45) return Math.round(4 + level * 0.42);
  return Math.round(7 + level * 0.45);
}

function estimateBudgetGearAccuracy(classId, level, budget) {
  if (budget === 'low') {
    if (classId === 'warrior') return level >= 25 ? 3 : 0;
    if (classId === 'thief') return level >= 25 ? 2 : 0;
    return level >= 30 ? 2 : 0;
  }
  if (budget === 'high') {
    if (classId === 'warrior') return level >= 25 ? 8 : level >= 15 ? 4 : 1;
    if (classId === 'thief') return level >= 25 ? 5 : 2;
    return level >= 25 ? 4 : 2;
  }
  return level >= 25 ? 4 : level >= 15 ? 2 : 0;
}

function getAccuracyForHitRate({ characterLevel, monsterLevel, avoid, desiredHitRate }) {
  const desired = clamp01(desiredHitRate);
  if (desired <= 0 || number(avoid, 0) <= 0) return 0;
  let low = 0;
  let high = 260;
  while (getPhysicalHitRate({ accuracy: high, characterLevel, monsterLevel, avoid }) < desired && high < 2000) high *= 2;
  for (let i = 0; i < 32; i += 1) {
    const mid = (low + high) / 2;
    if (getPhysicalHitRate({ accuracy: mid, characterLevel, monsterLevel, avoid }) >= desired) high = mid;
    else low = mid;
  }
  return Math.ceil(high);
}

function getPhysicalHitRate({ accuracy, characterLevel, monsterLevel, avoid }) {
  const acc = number(accuracy, 0);
  const eva = Math.max(0, number(avoid, 0));
  if (eva <= 0) return 1;
  if (acc <= 0) return 0;
  const levelGap = Math.max(0, number(monsterLevel, 1) - number(characterLevel, 1));
  const a = acc * 100 / ((levelGap + 51) * 5);
  if (a <= 0) return 0;
  const f = 0.3 / (1 + Math.exp((a - eva) / 12));
  const minRoll = 0.95 - f;
  const maxRoll = 1.05 + f;
  const requiredRoll = eva / a;
  if (requiredRoll <= minRoll) return 1;
  if (requiredRoll >= maxRoll) return 0;
  return clamp01((maxRoll - requiredRoll) / (maxRoll - minRoll));
}

function inferHpGrowth(classId) {
  if (classId === 'warrior') return 24;
  if (classId === 'pirate') return 20;
  if (classId === 'bowman') return 16;
  if (classId === 'thief') return 16;
  if (classId === 'magician') return 10;
  return 14;
}

function inferMpGrowth(classId, intValue) {
  if (classId === 'magician') return 18 + intValue * 0.08;
  return 6 + intValue * 0.02;
}

function estimateAccuracy(_classId, stats) {
  return Math.floor(number(stats?.DEX, 0) / 3) + Math.floor(number(stats?.LUK, 0) / 6) + 5;
}

function estimateMagicAccuracy(stats, level) {
  return Math.round(number(stats.INT, 0) * 0.8 + number(stats.LUK, 0) * 0.35 + number(level, 1) * 0.5);
}
