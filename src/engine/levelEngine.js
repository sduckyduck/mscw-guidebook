const clamp = (value, min, max) => Math.min(Math.max(Number(value) || min, min), max);

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

export function buildStatPlan(classLine, level, custom = {}) {
  const safeLevel = clamp(level, 1, 200);
  const baseStats = classLine.baseStats;
  const totalAp = getTotalApFromLevel(safeLevel);
  const primary = classLine.primaryStat;
  const secondary = classLine.secondaryStat;
  const secondaryTarget = custom.secondaryTarget ?? inferSecondaryTarget(classLine.id, safeLevel);
  const stats = { ...baseStats };

  const secondaryNeeded = Math.max(0, secondaryTarget - (stats[secondary] ?? 0));
  const secondaryAdded = Math.min(totalAp, secondaryNeeded);
  const primaryAdded = Math.max(0, totalAp - secondaryAdded);

  stats[secondary] = (stats[secondary] ?? 0) + secondaryAdded;
  stats[primary] = (stats[primary] ?? 0) + primaryAdded;
  stats.HP = Math.round((stats.HP ?? 0) + safeLevel * inferHpGrowth(classLine.id));
  stats.MP = Math.round((stats.MP ?? 0) + safeLevel * inferMpGrowth(classLine.id, stats.INT));

  const accuracy = estimateAccuracy(classLine.id, stats, safeLevel);
  const magicAccuracy = estimateMagicAccuracy(stats, safeLevel);

  return {
    level: safeLevel,
    totalAp,
    totalSp: getTotalSpFromLevel(safeLevel, classLine.id === 'magician' ? 8 : 10),
    remainingAp: 0,
    primaryAdded,
    secondaryAdded,
    secondaryTarget,
    stats,
    derived: {
      accuracy,
      magicAccuracy,
      hp: stats.HP,
      mp: stats.MP,
    },
  };
}

function inferSecondaryTarget(classId, level) {
  if (classId === 'magician') return Math.max(8, level + 3);
  if (classId === 'warrior') return Math.min(90, Math.max(20, Math.round(level * 1.25)));
  if (classId === 'bowman') return Math.min(80, Math.max(15, Math.round(level * 0.75)));
  if (classId === 'thief') return Math.min(100, Math.max(25, Math.round(level * 1.4)));
  if (classId === 'pirate') return Math.min(90, Math.max(20, Math.round(level * 1.0)));
  return Math.max(20, level);
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

function estimateAccuracy(classId, stats, level) {
  if (classId === 'magician') return Math.round(level * 0.35 + stats.LUK * 0.4 + stats.INT * 0.1);
  if (classId === 'warrior') return Math.round(stats.DEX * 0.8 + stats.LUK * 0.5 + level * 0.3);
  if (classId === 'bowman') return Math.round(stats.DEX * 0.9 + stats.LUK * 0.4 + level * 0.4);
  if (classId === 'thief') return Math.round(stats.DEX * 0.7 + stats.LUK * 0.6 + level * 0.4);
  if (classId === 'pirate') return Math.round(stats.DEX * 0.8 + stats.STR * 0.25 + level * 0.35);
  return Math.round(level + (stats.DEX ?? 0));
}

function estimateMagicAccuracy(stats, level) {
  return Math.round(stats.INT * 0.8 + stats.LUK * 0.35 + level * 0.5);
}
