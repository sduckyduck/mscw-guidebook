const PLANS = {
  warrior: {
    default: {
      summary: '一转：强力攻击 20 → 群体攻击 20 → 提高 HP 恢复 3 → 提高 HP 上限 15 → 剩余点数补精准打击',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['提高 HP 恢复', 3], ['提高 HP 上限', 15], ['精准打击', 20]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 38, baseMax: 90, scale: 3.4 }, { name: '群体攻击', role: '范围清怪', baseMin: 28, baseMax: 70, scale: 2.7 }],
    },
    fighter: {
      summary: '二转：精准剑/斧 20 → 快速武器 → 终极剑/斧 → 后续补进阶输出',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['精准剑/斧', 20], ['快速武器', 20], ['终极剑/斧', 30]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 45, baseMax: 105, scale: 3.8 }, { name: '群体攻击', role: '范围清怪', baseMin: 32, baseMax: 78, scale: 2.9 }],
    },
    page: {
      summary: '二转：精准钝器/剑 → 快速武器 → 属性强化',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['精准钝器/剑', 20], ['快速武器', 20], ['属性强化', 30]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 42, baseMax: 98, scale: 3.5 }, { name: '群体攻击', role: '范围清怪', baseMin: 30, baseMax: 74, scale: 2.8 }],
    },
    spearman: {
      summary: '二转：精准枪/矛 → 快速枪/矛 → 极限防御',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['精准枪/矛', 20], ['快速枪/矛', 20], ['极限防御', 20]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 46, baseMax: 108, scale: 3.7 }, { name: '群体攻击', role: '范围清怪', baseMin: 35, baseMax: 86, scale: 3.1 }],
    },
  },
  magician: {
    default: {
      summary: '一转：魔力弹 1 → 提高 MP 恢复 5 → 提高 MP 上限 10 → 魔法双击 20 → 魔法盾',
      sequence: [['魔力弹', 1], ['提高 MP 恢复', 5], ['提高 MP 上限', 10], ['魔法双击', 20], ['魔法盾', 20], ['魔法铠甲', 20]],
      damage: [{ name: '魔力弹', role: '前置攻击', baseMin: 22, baseMax: 56, scale: 1.8 }, { name: '魔法双击', role: '单体主攻', baseMin: 50, baseMax: 110, scale: 3.2 }],
    },
    fp: {
      summary: '二转：火箭术 → 精神力 → 毒雾路线后续补齐',
      sequence: [['魔法双击', 20], ['提高 MP 上限', 10], ['魔法盾', 20], ['火箭术', 30], ['精神力', 20], ['毒雾', 30]],
      damage: [{ name: '火箭术', role: '单体主攻', baseMin: 70, baseMax: 150, scale: 4.0 }, { name: '毒雾', role: '持续输出', baseMin: 32, baseMax: 88, scale: 2.2 }],
    },
    il: {
      summary: '二转：冰冻术/雷电术，优先控场刷怪',
      sequence: [['魔法双击', 20], ['提高 MP 上限', 10], ['魔法盾', 20], ['冰冻术', 30], ['雷电术', 30], ['精神力', 20]],
      damage: [{ name: '冰冻术', role: '控场单体', baseMin: 65, baseMax: 138, scale: 3.8 }, { name: '雷电术', role: '范围清怪', baseMin: 45, baseMax: 112, scale: 3.2 }],
    },
    cleric: {
      summary: '二转：治愈术 30 → 祝福 → 群体治疗刷怪',
      sequence: [['魔法双击', 20], ['提高 MP 上限', 10], ['魔法盾', 20], ['治愈术', 30], ['祝福', 20]],
      damage: [{ name: '治愈术', role: '亡灵刷怪/续航', baseMin: 42, baseMax: 118, scale: 3.1 }],
    },
  },
  bowman: {
    default: {
      summary: '一转：精准箭 3 → 强力箭 20 → 远程箭 8 → 集中术/断魂箭',
      sequence: [['精准箭', 3], ['强力箭', 20], ['远程箭', 8], ['集中术', 20], ['断魂箭', 20]],
      damage: [{ name: '强力箭', role: '单体主攻', baseMin: 40, baseMax: 102, scale: 3.4 }, { name: '断魂箭', role: '单体攻击', baseMin: 32, baseMax: 86, scale: 2.8 }],
    },
    hunter: {
      summary: '二转：精准弓 20 → 快速弓 → 终极弓 → 爆炸箭',
      sequence: [['强力箭', 20], ['精准弓', 20], ['快速弓', 20], ['终极弓', 30], ['爆炸箭', 30]],
      damage: [{ name: '强力箭', role: '单体主攻', baseMin: 48, baseMax: 125, scale: 3.6 }, { name: '爆炸箭', role: '范围清怪', baseMin: 52, baseMax: 130, scale: 3.5 }],
    },
    crossbowman: {
      summary: '二转：精准弩 20 → 快速弩 → 终极弩 → 穿透箭',
      sequence: [['强力箭', 20], ['精准弩', 20], ['快速弩', 20], ['终极弩', 30], ['穿透箭', 30]],
      damage: [{ name: '强力箭', role: '单体主攻', baseMin: 52, baseMax: 135, scale: 3.8 }, { name: '穿透箭', role: '直线穿透', baseMin: 55, baseMax: 145, scale: 4.0 }],
    },
  },
  thief: {
    default: {
      summary: '一转：双飞斩/劈空斩 → 远程暗器/集中术 → 诅咒术前置 → 隐身',
      sequence: [['双飞斩', 20], ['远程暗器', 8], ['劈空斩', 20], ['集中术', 20], ['诅咒术', 3], ['隐身', 10]],
      damage: [{ name: '双飞斩', role: '标飞主攻', baseMin: 55, baseMax: 140, scale: 3.7 }, { name: '劈空斩', role: '短刀攻击', baseMin: 46, baseMax: 118, scale: 3.2 }],
    },
    assassin: {
      summary: '二转：精准暗器 20 → 强力投掷 → 快速暗器 → 轻功',
      sequence: [['双飞斩', 20], ['精准暗器', 20], ['强力投掷', 30], ['快速暗器', 20], ['轻功', 20]],
      damage: [{ name: '双飞斩', role: '标飞主攻', baseMin: 65, baseMax: 160, scale: 4.0 }],
    },
    bandit: {
      summary: '二转：精准短刀 20 → 快速短刀 → 回旋斩 → 轻功',
      sequence: [['劈空斩', 20], ['精准短刀', 20], ['快速短刀', 20], ['回旋斩', 30], ['轻功', 20]],
      damage: [{ name: '劈空斩', role: '短刀主攻', baseMin: 58, baseMax: 150, scale: 3.9 }, { name: '回旋斩', role: '爆发连击', baseMin: 62, baseMax: 168, scale: 4.1 }],
    },
  },
  pirate: {
    default: {
      summary: '国服海盗技能路线预留，等国服公式和数据接入后启用。',
      sequence: [['基础攻击', 1]],
      damage: [{ name: '基础攻击', role: '占位', baseMin: 10, baseMax: 20, scale: 1 }],
    },
  },
};

const FIRST_JOB_CAP_LEVEL = 30;
const FIRST_JOB_START_LEVEL = 10;

function getFirstJobPlan(classId) {
  return PLANS[classId]?.default ?? PLANS.warrior.default;
}

function getBranchPlan(classId, branchId) {
  return PLANS[classId]?.[branchId] ?? PLANS[classId]?.default ?? PLANS.warrior.default;
}

function getFirstJobSkillPoints(level) {
  const cappedLevel = Math.min(Number(level) || 0, FIRST_JOB_CAP_LEVEL);
  if (cappedLevel < FIRST_JOB_START_LEVEL) return 0;
  return Math.max(0, (cappedLevel - FIRST_JOB_START_LEVEL) * 3 + 1);
}

function getSecondJobSkillPoints(level) {
  const numericLevel = Number(level) || 0;
  return numericLevel > FIRST_JOB_CAP_LEVEL ? (numericLevel - FIRST_JOB_CAP_LEVEL) * 3 : 0;
}

function getTotalSkillPoints(level) {
  return getFirstJobSkillPoints(level) + getSecondJobSkillPoints(level);
}

function uniqueByName(entries) {
  const seen = new Set();
  return entries.filter(([name]) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function getSecondJobSequence(classId, branchId) {
  const firstNames = new Set(getFirstJobPlan(classId).sequence.map(([name]) => name));
  const branchPlan = getBranchPlan(classId, branchId);
  if (branchPlan === getFirstJobPlan(classId)) return [];
  return uniqueByName(branchPlan.sequence.filter(([name]) => !firstNames.has(name)));
}

function buildSkillRows(classId, branchId, level) {
  const secondUnlocked = Number(level) > FIRST_JOB_CAP_LEVEL;
  const firstRows = getFirstJobPlan(classId).sequence.map(([name, max]) => ({
    name,
    max,
    tier: 'first',
    tierLabel: '一转',
    locked: false,
  }));
  const secondRows = getSecondJobSequence(classId, branchId).map(([name, max]) => ({
    name,
    max,
    tier: 'second',
    tierLabel: '二转',
    locked: !secondUnlocked,
  }));
  return [...firstRows, ...secondRows];
}

function getPlanSummary(classId, branchId, level) {
  const first = getFirstJobPlan(classId);
  const second = getBranchPlan(classId, branchId);
  if (Number(level) <= FIRST_JOB_CAP_LEVEL || second === first) {
    return `${first.summary}。Lv.30 及以下只开放一转技能，二转技能会显示但锁定。`;
  }
  return `${first.summary}。${second.summary}。一转 SP 和二转 SP 分开计算。`;
}

export function getRecommendedSkillAllocation({ classId, branchId, level }) {
  const rows = buildSkillRows(classId, branchId, level);
  const totals = {
    first: getFirstJobSkillPoints(level),
    second: getSecondJobSkillPoints(level),
  };
  const distributed = distributeSkillPoints(rows, totals);
  return Object.fromEntries(distributed.map((skill) => [skill.name, skill.level]));
}

function distributeSkillPoints(rows, totalPointsByTier, customSkills = null) {
  if (customSkills) return sanitizeSkillAllocation(rows, totalPointsByTier, customSkills);

  const remaining = {
    first: Math.max(0, Number(totalPointsByTier.first) || 0),
    second: Math.max(0, Number(totalPointsByTier.second) || 0),
  };

  return rows.map((row) => {
    if (row.locked) return { ...row, level: 0 };
    const available = remaining[row.tier] ?? 0;
    const level = Math.min(row.max, available);
    remaining[row.tier] = available - level;
    return { ...row, level };
  });
}

function sanitizeSkillAllocation(rows, totalPointsByTier, customSkills) {
  const remaining = {
    first: Math.max(0, Number(totalPointsByTier.first) || 0),
    second: Math.max(0, Number(totalPointsByTier.second) || 0),
  };

  return rows.map((row) => {
    if (row.locked) return { ...row, level: 0 };
    const requested = Math.max(0, Math.floor(Number(customSkills?.[row.name] ?? 0)));
    const available = remaining[row.tier] ?? 0;
    const level = Math.min(row.max, requested, available);
    remaining[row.tier] = available - level;
    return { ...row, level };
  });
}

function getRemainingByTier(skills, totalPointsByTier) {
  const used = skills.reduce((acc, skill) => {
    acc[skill.tier] = (acc[skill.tier] ?? 0) + skill.level;
    return acc;
  }, { first: 0, second: 0 });

  return {
    first: Math.max(0, (totalPointsByTier.first ?? 0) - (used.first ?? 0)),
    second: Math.max(0, (totalPointsByTier.second ?? 0) - (used.second ?? 0)),
  };
}

function nextSteps(skills, totalPointsByTier, level, count = 4) {
  const activeTier = Number(level) > FIRST_JOB_CAP_LEVEL ? 'second' : 'first';
  const sequence = skills.filter((skill) => skill.tier === activeTier && !skill.locked);
  if (!sequence.length) return [];

  const usedInTier = sequence.reduce((sum, skill) => sum + skill.level, 0);
  const maxInTier = sequence.reduce((sum, skill) => sum + skill.max, 0);
  const steps = [];

  for (let i = 1; i <= count; i += 1) {
    let remaining = Math.min(maxInTier, usedInTier + i * 3);
    let target = sequence[sequence.length - 1];
    for (const skill of sequence) {
      if (remaining <= skill.max) { target = skill; break; }
      remaining -= skill.max;
    }
    steps.push({ level: Number(level) + i, text: `${target.name} x3` });
  }
  return steps;
}

function getDamageDefinitions(classId, branchId, level) {
  const first = getFirstJobPlan(classId);
  const second = getBranchPlan(classId, branchId);
  const definitions = Number(level) > FIRST_JOB_CAP_LEVEL && second !== first
    ? [...first.damage, ...second.damage]
    : [...first.damage];

  const byName = new Map();
  for (const card of definitions) byName.set(card.name, card);
  return [...byName.values()];
}

export function getSkillPlan({ classId, branchId, level, mainAttack = 0, customSkills = null }) {
  const rows = buildSkillRows(classId, branchId, level);
  const totalPointsByTier = {
    first: getFirstJobSkillPoints(level),
    second: getSecondJobSkillPoints(level),
  };
  const skills = distributeSkillPoints(rows, totalPointsByTier, customSkills);
  const usedSp = skills.reduce((sum, skill) => sum + skill.level, 0);
  const remainingByTier = getRemainingByTier(skills, totalPointsByTier);
  const current = skills.filter((skill) => skill.level > 0);
  const next = nextSteps(skills, totalPointsByTier, Number(level));
  const skillByName = new Map(skills.map((skill) => [skill.name, skill]));
  const baseMin = Math.max(1, Math.round(mainAttack * 0.62));
  const baseMax = Math.max(baseMin + 1, Math.round(mainAttack * 1.18));

  const activeDamageCards = getDamageDefinitions(classId, branchId, level)
    .map((card) => ({ card, skill: skillByName.get(card.name) }))
    .filter(({ skill }) => skill && skill.level > 0)
    .map(({ card, skill }) => {
      const skillLevel = skill.level;
      const min = Math.max(1, Math.round(card.baseMin + mainAttack * card.scale * (skillLevel / 20) * 0.35));
      const max = Math.max(min + 1, Math.round(card.baseMax + mainAttack * card.scale * (skillLevel / 20) * 0.72));
      return { ...card, level: skillLevel, maxLevel: skill.max, min, max };
    });

  const damageCards = [{
    name: 'Base Attack',
    role: '普通攻击',
    level: null,
    maxLevel: null,
    min: baseMin,
    max: baseMax,
    isBase: true,
  }, ...activeDamageCards];

  return {
    summary: getPlanSummary(classId, branchId, level),
    skills,
    current,
    next,
    damageCards,
    totalSp: getTotalSkillPoints(level),
    totalSpByTier: totalPointsByTier,
    usedSp,
    remainingSp: Math.max(0, getTotalSkillPoints(level) - usedSp),
    remainingByTier,
  };
}

export function getApNote({ classLine, statPlan }) {
  const primary = classLine?.primaryStat ?? 'STR';
  const secondary = classLine?.secondaryStat ?? 'DEX';
  const current = statPlan?.stats?.[secondary] ?? 0;
  const status = current >= 4 ? '足够' : '偏低';
  return `当前建议主 ${primary}，${secondary} 保持装备/命中需求。当前 ${secondary}：${status}。`;
}
