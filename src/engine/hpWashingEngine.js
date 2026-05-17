const STORAGE_KEY = 'mscw-guidebook-state-v2';

export const HP_WASHING_ROUTES = {
  none: {
    id: 'none',
    name: '不洗血',
    targetInt: { warrior: 4, bowman: 4, thief: 4, pirate: 4, magician: 0 },
    maxResets: 0,
    risk: 'normal',
  },
  low: {
    id: 'low',
    name: '穷鬼路线',
    targetInt: { warrior: 4, bowman: 20, thief: 20, pirate: 20, magician: 0 },
    maxResets: 24,
    risk: 'cheap',
  },
  mid: {
    id: 'mid',
    name: '平衡路线',
    targetInt: { warrior: 20, bowman: 50, thief: 50, pirate: 45, magician: 0 },
    maxResets: 80,
    risk: 'balanced',
  },
  high: {
    id: 'high',
    name: '有钱路线',
    targetInt: { warrior: 40, bowman: 90, thief: 90, pirate: 80, magician: 0 },
    maxResets: 180,
    risk: 'expensive',
  },
};

const CLASS_WASHING_RULES = {
  warrior: {
    hpGainPerReset: 52,
    mpCostPerReset: 4,
    minMp: (level) => level * 4 + 56,
    note: '战士自然 HP 很高，洗血通常不是开荒刚需；穷鬼路线应优先伤害和命中。',
  },
  bowman: {
    hpGainPerReset: 18,
    mpCostPerReset: 12,
    minMp: (level) => level * 14 + 148,
    note: '弓箭手自然 HP 偏低，洗血会牺牲早期 DEX 与伤害，换取后期生存空间。',
  },
  thief: {
    hpGainPerReset: 18,
    mpCostPerReset: 12,
    minMp: (level) => level * 14 + 148,
    note: '飞侠自然 HP 偏低，洗血收益明显，但早期 INT 会压低 LUK 与练级效率。',
  },
  pirate: {
    hpGainPerReset: 22,
    mpCostPerReset: 16,
    minMp: (level) => level * 18 + 111,
    note: '海盗国服内测数据仍需核对；当前按保守路线估算。',
  },
  magician: {
    hpGainPerReset: 8,
    mpCostPerReset: 90,
    minMp: (level) => level * 22 + 488,
    note: '法师本身主加 INT，常规开荒不需要按物理职业洗血路线处理。',
  },
};

const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];
const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value, min, max) => Math.min(Math.max(number(value, min), min), max);

export function getCurrentEditionId() {
  if (typeof window === 'undefined') return 'global';
  const editionSelect = [...document.querySelectorAll('.mg-field')]
    .find((field) => field.textContent?.includes('版本'))
    ?.querySelector('select');
  if (editionSelect?.value) return editionSelect.value;

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return saved.editionId === 'china' ? 'china' : 'global';
  } catch {
    return 'global';
  }
}

export function normalizeHpWashingRoute(routeId, editionId = getCurrentEditionId()) {
  if (editionId !== 'china') return 'none';
  if (routeId === 'low' || routeId === 'mid' || routeId === 'high') return routeId;
  if (routeId === 'none') return 'none';
  return 'none';
}

export function getHpWashingRule(classId) {
  return CLASS_WASHING_RULES[classId] ?? CLASS_WASHING_RULES.warrior;
}

export function getHpWashingPlan({ classLine, level, routeId, baseStats = {}, baseMp = 0, allocation = null } = {}) {
  const classId = classLine?.id ?? 'warrior';
  const safeLevel = clamp(level, 1, 200);
  const normalizedRouteId = normalizeHpWashingRoute(routeId);
  const route = HP_WASHING_ROUTES[normalizedRouteId] ?? HP_WASHING_ROUTES.none;
  const rule = getHpWashingRule(classId);
  const baseInt = number(baseStats.INT, 4);
  const currentInt = number(allocation?.INT, baseInt);
  const rawTargetInt = number(route.targetInt?.[classId], baseInt);
  const targetInt = normalizedRouteId === 'none' || classId === 'magician'
    ? currentInt
    : Math.max(baseInt, rawTargetInt);
  const intForMp = Math.max(baseInt, currentInt, targetInt);
  const intBlocks = Math.max(0, Math.floor(intForMp / 10) - Math.floor(baseInt / 10));
  const washableLevels = Math.max(0, safeLevel - 10);
  const extraMpFromInt = intBlocks * washableLevels;
  const estimatedMpBeforeWash = number(baseMp, 0) + extraMpFromInt;
  const minimumMp = Math.max(0, Math.round(rule.minMp(safeLevel)));
  const mpBuffer = Math.max(0, estimatedMpBeforeWash - minimumMp);
  const maxByMp = Math.floor(mpBuffer / Math.max(1, rule.mpCostPerReset));
  const plannedResets = normalizedRouteId === 'none' ? 0 : Math.max(0, Math.min(route.maxResets, maxByMp));
  const hpGain = plannedResets * rule.hpGainPerReset;
  const mpSpent = plannedResets * rule.mpCostPerReset;
  const intApInvestment = Math.max(0, targetInt - baseInt);
  const resetTicketEstimate = plannedResets + intApInvestment;

  return {
    active: normalizedRouteId !== 'none' && plannedResets > 0,
    routeId: normalizedRouteId,
    routeName: route.name,
    classId,
    targetInt,
    intApInvestment,
    extraMpFromInt,
    minimumMp,
    mpBuffer,
    plannedResets,
    hpGain,
    mpSpent,
    estimatedMpAfterWash: Math.max(minimumMp, estimatedMpBeforeWash - mpSpent),
    resetTicketEstimate,
    rule,
    note: rule.note,
  };
}

export function applyHpWashingAllocation({ allocation, classLine, level, routeId, totalAp, minStats }) {
  const normalizedRouteId = normalizeHpWashingRoute(routeId);
  if (normalizedRouteId === 'none' || classLine?.id === 'magician') return allocation;

  const route = HP_WASHING_ROUTES[normalizedRouteId] ?? HP_WASHING_ROUTES.none;
  const primary = classLine.primaryStat;
  const baseInt = Math.max(number(minStats?.INT, 4), number(classLine?.baseStats?.INT, 4));
  const targetInt = Math.max(baseInt, number(route.targetInt?.[classLine.id], baseInt));
  const currentInt = number(allocation?.INT, baseInt);
  const addInt = Math.max(0, targetInt - currentInt);
  if (addInt <= 0) return allocation;

  const next = { ...allocation };
  const primaryFloor = number(minStats?.[primary], 4);
  const primaryAvailable = Math.max(0, number(next[primary], primaryFloor) - primaryFloor);
  const takeFromPrimary = Math.min(addInt, primaryAvailable);
  next[primary] = number(next[primary], primaryFloor) - takeFromPrimary;
  next.INT = currentInt + takeFromPrimary;

  let remaining = addInt - takeFromPrimary;
  for (const stat of STAT_KEYS) {
    if (remaining <= 0 || stat === 'INT' || stat === primary) continue;
    const floor = number(minStats?.[stat], 4);
    const available = Math.max(0, number(next[stat], floor) - floor);
    const take = Math.min(remaining, available);
    next[stat] -= take;
    next.INT += take;
    remaining -= take;
  }

  const sum = STAT_KEYS.reduce((total, stat) => total + number(next[stat], 0), 0);
  if (sum > totalAp) next.INT = Math.max(baseInt, number(next.INT, baseInt) - (sum - totalAp));
  return next;
}

export function applyHpWashingToStats({ classLine, level, routeId, stats, baseStats, baseMp }) {
  const plan = getHpWashingPlan({ classLine, level, routeId, baseStats, baseMp, allocation: stats });
  if (plan.routeId === 'none') return { stats, plan };

  const next = { ...stats };
  next.HP = Math.max(1, Math.round(number(next.HP, 0) + plan.hpGain));
  next.MP = Math.max(plan.minimumMp, Math.round(number(next.MP, 0) + plan.extraMpFromInt - plan.mpSpent));
  return { stats: next, plan };
}
