const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];
const MIN_STAT_AP = 4;
const LEVEL_10_TOTAL_AP = 70;
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

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || min, min), max);
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

function normalizeSkillBonuses(raw = {}) {
  return {
    stats: Object.fromEntries(STAT_KEYS.map((key) => [key, Number(raw?.stats?.[key] ?? 0) || 0])),
    maxHpPercent: Number(raw?.maxHpPercent ?? 0) || 0,
    maxMpPercent: Number(raw?.maxMpPercent ?? 0) || 0,
    accuracy: Number(raw?.accuracy ?? 0) || 0,
    magicAccuracy: Number(raw?.magicAccuracy ?? 0) || 0,
    avoidability: Number(raw?.avoidability ?? 0) || 0,
    weaponAttack: Number(raw?.weaponAttack ?? 0) || 0,
    magicAttack: Number(raw?.magicAttack ?? 0) || 0,
    speed: Number(raw?.speed ?? 0) || 0,
    jump: Number(raw?.jump ?? 0) || 0,
    criticalRate: Number(raw?.criticalRate ?? 0) || 0,
    criticalDamage: Number(raw?.criticalDamage ?? 0) || 0,
  };
}

function getMinimumStatsForClass(classId) {
  const floors = Object.fromEntries(STAT_KEYS.map((key) => [key, MIN_STAT_AP]));
  const jobFloors = JOB_AP_MINIMUMS[classId] ?? {};
  for (const key of STAT_KEYS) {
    floors[key] = Math.max(floors[key], Number(jobFloors[key] ?? 0) || 0);
  }
  return floors;
}

function getStatTotal(stats = {}) {
  return STAT_KEYS.reduce((sum, key) => sum + (Number(stats?.[key] ?? 0) || 0), 0);
}

function getLevel10BaseApDeficit(baseStats = {}) {
  return Math.max(0, LEVEL_10_TOTAL_AP - getStatTotal(baseStats));
}

function normalizeLevel10BaseStats(baseStats = {}, primaryStat = 'STR', classId = '') {
  const stats = { ...baseStats };
  const deficit = getLevel10BaseApDeficit(stats);
  const minStats = getMinimumStatsForClass(classId);

  if (deficit > 0 && STAT_KEYS.includes(primaryStat)) {
    stats[primaryStat] = (Number(stats[primaryStat] ?? 0) || 0) + deficit;
  }

  for (const key of STAT_KEYS) {
    stats[key] = Math.max(minStats[key], Math.floor(Number(stats[key] ?? minStats[key]) || minStats[key]));
  }

  return stats;
}

function applyPercent(value, percent) {
  return Math.round((Number(value) || 0) * (1 + (Number(percent) || 0) / 100));
}

export function getLevelGains(level) {
  const safeLevel = clamp(level, 1, 200);

  return {
    ap: safeLevel <= 10 ? 0 : 5,
    sp: safeLevel < 10 ? 0 : safeLevel < 30 ? 3 : 3,
  };
}

export function getTotalApFromLevel(level) {
  const safeLevel = clamp(level, 1, 200);
  return Math.max(0, safeLevel - 10) * 5;
}

export function getTotalSpFromLevel(level, firstJobLevel = 10, secondJobLevel = 30) {
  const safeLevel = clamp(level, 1, 200);
  const firstJobSp = Math.max(0, Math.min(safeLevel, secondJobLevel - 1) - firstJobLevel + 1) * 3;
  const secondJobSp = Math.max(0, safeLevel - secondJobLevel + 1) * 3;
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
    const targetLuk = custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel, budget, custom);
    return allocatePrimaryAfterSecondary({ baseStats, primary, secondary, secondaryTarget: targetLuk, totalAp, minStats });
  }

  const conventionalSecondaryTarget = custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel, budget, custom);
  const accuracyTarget = custom.accuracyTarget ?? inferAccuracyTarget(classLine.id, safeLevel, budget, custom);
  const skillBonuses = normalizeSkillBonuses(custom.skillBonuses);
  const estimatedGearAcc = estimateBudgetGearAccuracy(classLine.id, safeLevel, budget);
  const routeSecondaryTarget = chooseSecondaryForAccuracy({
    classLine,
    baseStats,
    primary,
    secondary,
    conventionalSecondaryTarget,
    totalAp,
    minStats,
    accuracyTarget,
    bonusAccuracy: skillBonuses.accuracy + estimatedGearAcc,
    budget,
  });

  return allocatePrimaryAfterSecondary({
    baseStats,
    primary,
    secondary,
    secondaryTarget: routeSecondaryTarget,
    totalAp,
    minStats,
  });
}

export function buildStatPlan(classLine, level, custom = {}) {
  const safeLevel = clamp(level, 1, 200);
  const primary = classLine.primaryStat;
  const secondary = classLine.secondaryStat;
  const rawBaseStats = classLine.baseStats;
  const baseApDeficit = getLevel10BaseApDeficit(rawBaseStats);
  const minStats = getMinimumStatsForClass(classLine.id);
  const baseStats = normalizeLevel10BaseStats(rawBaseStats, primary, classLine.id);
  const skillBonuses = normalizeSkillBonuses(custom.skillBonuses);
  const levelUpAp = getTotalApFromLevel(safeLevel);
  const totalAp = getTotalApPool(safeLevel);
  const budget = custom.budget ?? 'mid';
  const secondaryTarget = custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel, budget, custom);
  const accuracyTarget = custom.accuracyTarget ?? inferAccuracyTarget(classLine.id, safeLevel, budget, custom);
  const recommendedAllocation = getRecommendedApAllocation(classLine, safeLevel, custom);
  const allocation = resolveFinalApAllocation(custom.apAllocation, baseStats, recommendedAllocation, totalAp, minStats, classLine, safeLevel, custom);
  const stats = { ...allocation };

  for (const key of STAT_KEYS) {
    stats[key] += skillBonuses.stats[key] ?? 0;
  }

  const baseHp = Math.round((stats.HP ?? rawBaseStats.HP ?? 0) + safeLevel * inferHpGrowth(classLine.id));
  const baseMp = Math.round((stats.MP ?? rawBaseStats.MP ?? 0) + safeLevel * inferMpGrowth(classLine.id, stats.INT));
  stats.HP = applyPercent(baseHp, skillBonuses.maxHpPercent);
  stats.MP = applyPercent(baseMp, skillBonuses.maxMpPercent);

  const allocatedAp = STAT_KEYS.reduce((sum, key) => sum + (allocation[key] ?? 0), 0);
  const accuracy = estimateAccuracy(classLine.id, stats, safeLevel) + skillBonuses.accuracy;
  const magicAccuracy = estimateMagicAccuracy(stats, safeLevel) + skillBonuses.magicAccuracy;

  return {
    level: safeLevel,
    totalAp,
    baseApTotal: LEVEL_10_TOTAL_AP,
    baseApDeficit,
    levelUpAp,
    minStats,
    apMinStats: minStats,
    totalSp: getTotalSpFromLevel(safeLevel, classLine.id === 'magician' ? 8 : 10),
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
  const targetSecondary = Math.max(baseSecondary, Math.floor(Number(secondaryTarget ?? baseSecondary)));
  const extraAp = Math.max(0, Number(totalAp) - getStatTotal(allocation));
  const addSecondary = Math.min(extraAp, Math.max(0, targetSecondary - baseSecondary));

  allocation[secondary] = baseSecondary + addSecondary;
  allocation[primary] = (allocation[primary] ?? minStats[primary]) + Math.max(0, extraAp - addSecondary);
  return sanitizeFinalApAllocation(allocation, totalAp, minStats);
}

function chooseSecondaryForAccuracy({ classLine, baseStats, primary, secondary, conventionalSecondaryTarget, totalAp, minStats, accuracyTarget, bonusAccuracy, budget }) {
  if (budget !== 'low') return conventionalSecondaryTarget;

  const extraAp = Math.max(0, Number(totalAp) - getStatTotal(baseStats));
  const baseSecondary = baseStats[secondary] ?? minStats[secondary];
  const maxSecondary = baseSecondary + extraAp;
  const floorTarget = Math.max(baseSecondary, Math.floor(Number(conventionalSecondaryTarget ?? baseSecondary)));

  for (let candidate = floorTarget; candidate <= maxSecondary; candidate += 1) {
    const allocation = allocatePrimaryAfterSecondary({ baseStats, primary, secondary, secondaryTarget: candidate, totalAp, minStats });
    const acc = estimateAccuracy(classLine.id, allocation) + Number(bonusAccuracy ?? 0);
    if (acc >= accuracyTarget) return candidate;
  }

  return maxSecondary;
}

function resolveFinalApAllocation(customAllocation, baseStats, recommendedAllocation, totalAp, minStats, classLine, level, custom = {}) {
  if (!customAllocation || typeof customAllocation !== 'object') {
    return sanitizeFinalApAllocation(recommendedAllocation, totalAp, minStats);
  }

  const values = STAT_KEYS.map((key) => Number(customAllocation?.[key] ?? 0) || 0);
  const looksLikeFinalStats = values.every((value, index) => value >= minStats[STAT_KEYS[index]]);
  const requested = looksLikeFinalStats ? customAllocation : migrateAddedApToFinalStats(customAllocation, baseStats, minStats);
  const sanitized = sanitizeFinalApAllocation(requested, totalAp, minStats);

  if (shouldUseCurrentRecommendationInsteadOfSaved(sanitized, recommendedAllocation, classLine, level, custom)) {
    return sanitizeFinalApAllocation(recommendedAllocation, totalAp, minStats);
  }

  return sanitized;
}

function migrateAddedApToFinalStats(customAllocation, baseStats, minStats) {
  const migrated = { ...baseStats };
  for (const key of STAT_KEYS) {
    migrated[key] = (migrated[key] ?? minStats[key]) + Math.max(0, Math.floor(Number(customAllocation?.[key] ?? 0)));
  }
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

  const savedSecondary = Number(saved?.[secondary] ?? 0);
  const recommendedSecondary = Number(recommended?.[secondary] ?? 0);
  const savedPrimary = Number(saved?.[primary] ?? 0);
  const recommendedPrimary = Number(recommended?.[primary] ?? 0);

  // Saved AP from earlier versions can make 有钱流 and 穷鬼流 look identical.
  // If the saved distribution clearly fights the current budget profile, treat it
  // as stale system output and let the route-specific recommendation win.
  if (budget === 'high' && savedSecondary > recommendedSecondary + 8 && savedPrimary < recommendedPrimary) return true;
  if (budget === 'low' && savedSecondary + 8 < recommendedSecondary && savedPrimary > recommendedPrimary) return true;

  return false;
}

function sameApAllocation(left = {}, right = {}) {
  return STAT_KEYS.every((key) => Math.floor(Number(left?.[key] ?? 0)) === Math.floor(Number(right?.[key] ?? 0)));
}

function sanitizeFinalApAllocation(allocation, totalAp, minStats = getMinimumStatsForClass('')) {
  let remaining = Math.max(0, Number(totalAp) || 0);
  const next = {};

  for (const key of STAT_KEYS) {
    const floor = minStats[key] ?? MIN_STAT_AP;
    const requested = Math.max(floor, Math.floor(Number(allocation?.[key] ?? floor)));
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

function inferSecondaryTarget(classId, level, budget = 'mid', custom = {}) {
  const safeLevel = Number(level) || 1;
  const levelUpAp = getTotalApFromLevel(safeLevel);
  const base = getNormalizedBaseSecondary(classId);

  if (classId === 'magician') {
    if (budget === 'low') return Math.max(8, Math.round(safeLevel * 0.72));
    if (budget === 'high') return Math.max(8, Math.round(safeLevel * 0.95));
    return Math.max(8, Math.round(safeLevel * 0.84));
  }

  if (classId === 'bowman') {
    if (budget === 'low') return Math.min(70, Math.max(15, Math.round(safeLevel * 0.86) + 2));
    if (budget === 'high') return Math.min(90, Math.max(20, safeLevel + 5));
    return Math.min(85, Math.max(18, safeLevel + 3));
  }

  const ratio = FLOW_SECONDARY_RATIOS[classId]?.[budget];
  if (ratio !== undefined) return Math.max(base, Math.round(base + levelUpAp * ratio));

  if (budget === 'high') return Math.max(base, Math.round(safeLevel * 0.55));
  return Math.max(base, Math.round(safeLevel * 0.9));
}

function inferAccuracyTarget(classId, level, budget = 'mid', custom = {}) {
  if (classId === 'magician') return 0;
  const safeLevel = Number(level) || 1;
  const priority = custom.priority ?? 'stable';
  const routeTarget = inferRouteTargetMonster(classId, safeLevel, budget, priority);
  const desiredHit = ROUTE_HIT_TARGETS[budget]?.[priority] ?? ROUTE_HIT_TARGETS[budget]?.stable ?? 0.9;
  const requiredTotalAcc = getAccuracyForHitRate({
    characterLevel: safeLevel,
    monsterLevel: routeTarget.level,
    avoid: routeTarget.avoid,
    desiredHitRate: desiredHit,
  });
  const skillAcc = normalizeSkillBonuses(custom.skillBonuses).accuracy;
  const gearAcc = estimateBudgetGearAccuracy(classId, safeLevel, budget);
  return Math.max(0, Math.ceil(requiredTotalAcc - skillAcc - gearAcc));
}

function getNormalizedBaseSecondary(classId) {
  if (classId === 'warrior') return 15;
  if (classId === 'thief') return 25;
  if (classId === 'pirate') return 20;
  return 4;
}

function inferRouteTargetMonster(classId, level, budget, priority) {
  const overLevel = getTargetOverLevel(classId, level, budget, priority);
  const targetLevel = Math.max(1, Math.round(level + overLevel));
  return {
    level: targetLevel,
    avoid: estimateMonsterAvoid(targetLevel),
  };
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
  const level = Math.max(1, Number(monsterLevel) || 1);
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
  if (desired <= 0) return 0;
  if (Number(avoid) <= 0) return 0;

  let low = 0;
  let high = 260;
  while (getPhysicalHitRate({ accuracy: high, characterLevel, monsterLevel, avoid }) < desired && high < 2000) {
    high *= 2;
  }

  for (let i = 0; i < 32; i += 1) {
    const mid = (low + high) / 2;
    if (getPhysicalHitRate({ accuracy: mid, characterLevel, monsterLevel, avoid }) >= desired) high = mid;
    else low = mid;
  }

  return Math.ceil(high);
}

function getPhysicalHitRate({ accuracy, characterLevel, monsterLevel, avoid }) {
  const acc = Number(accuracy) || 0;
  const eva = Math.max(0, Number(avoid) || 0);
  if (eva <= 0) return 1;
  if (acc <= 0) return 0;

  const levelGap = Math.max(0, Number(monsterLevel ?? 1) - Number(characterLevel ?? 1));
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
  return Math.floor((Number(stats?.DEX) || 0) / 3)
    + Math.floor((Number(stats?.LUK) || 0) / 6)
    + 5;
}

function estimateMagicAccuracy(stats, level) {
  return Math.round(stats.INT * 0.8 + stats.LUK * 0.35 + level * 0.5);
}
