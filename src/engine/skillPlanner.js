const PLANS = {
  warrior: {
    default: {
      summary: '强力攻击 20 → 群体攻击 20 → 提高 HP 恢复 3 → 提高 HP 上限 15 → 剩余点数补精准打击',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['提高 HP 恢复', 3], ['提高 HP 上限', 15], ['精准打击', 20]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 38, baseMax: 90, scale: 3.4 }],
    },
    fighter: {
      summary: '强力攻击 20 → 群体攻击 20 → 精准剑/斧 20 → 快速武器 → 终极剑/斧',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['精准剑/斧', 20], ['快速武器', 20], ['终极剑/斧', 30]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 45, baseMax: 105, scale: 3.8 }, { name: '群体攻击', role: '范围清怪', baseMin: 32, baseMax: 78, scale: 2.9 }],
    },
    page: {
      summary: '强力攻击 20 → 群体攻击 20 → 精准钝器/剑 → 快速武器 → 属性强化',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['精准钝器/剑', 20], ['快速武器', 20], ['属性强化', 30]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 42, baseMax: 98, scale: 3.5 }],
    },
    spearman: {
      summary: '强力攻击 20 → 群体攻击 20 → 精准枪/矛 → 快速枪/矛 → 极限防御',
      sequence: [['强力攻击', 20], ['群体攻击', 20], ['精准枪/矛', 20], ['快速枪/矛', 20], ['极限防御', 20]],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 46, baseMax: 108, scale: 3.7 }, { name: '群体攻击', role: '范围清怪', baseMin: 35, baseMax: 86, scale: 3.1 }],
    },
  },
  magician: {
    default: {
      summary: '魔力弹 1 → 提高 MP 恢复 5 → 提高 MP 上限 10 → 魔法双击 20 → 魔法盾',
      sequence: [['魔力弹', 1], ['提高 MP 恢复', 5], ['提高 MP 上限', 10], ['魔法双击', 20], ['魔法盾', 20], ['魔法铠甲', 20]],
      damage: [{ name: '魔法双击', role: '单体主攻', baseMin: 50, baseMax: 110, scale: 3.2 }],
    },
    fp: {
      summary: '魔法双击 20 → MP 上限 → 魔法盾 → 火箭术 → 毒雾路线后续补齐',
      sequence: [['魔法双击', 20], ['提高 MP 上限', 10], ['魔法盾', 20], ['火箭术', 30], ['精神力', 20]],
      damage: [{ name: '火箭术', role: '单体主攻', baseMin: 70, baseMax: 150, scale: 4.0 }],
    },
    il: {
      summary: '魔法双击 20 → MP 上限 → 魔法盾 → 冰冻术/雷电术，优先控场刷怪',
      sequence: [['魔法双击', 20], ['提高 MP 上限', 10], ['魔法盾', 20], ['冰冻术', 30], ['雷电术', 30]],
      damage: [{ name: '冰冻术', role: '控场单体', baseMin: 65, baseMax: 138, scale: 3.8 }, { name: '雷电术', role: '范围清怪', baseMin: 45, baseMax: 112, scale: 3.2 }],
    },
    cleric: {
      summary: '魔法双击 20 → MP 上限 → 魔法盾 → 治愈术 30 → 群体治疗刷怪',
      sequence: [['魔法双击', 20], ['提高 MP 上限', 10], ['魔法盾', 20], ['治愈术', 30], ['祝福', 20]],
      damage: [{ name: '治愈术', role: '亡灵刷怪/续航', baseMin: 42, baseMax: 118, scale: 3.1 }],
    },
  },
  bowman: {
    default: {
      summary: '精准箭 3 → 强力箭 20 → 远程箭 8 → 集中术/断魂箭',
      sequence: [['精准箭', 3], ['强力箭', 20], ['远程箭', 8], ['集中术', 20], ['断魂箭', 20]],
      damage: [{ name: '强力箭', role: '单体主攻', baseMin: 40, baseMax: 102, scale: 3.4 }],
    },
    hunter: {
      summary: '强力箭 20 → 精准弓 20 → 快速弓 → 终极弓 → 爆炸箭',
      sequence: [['强力箭', 20], ['精准弓', 20], ['快速弓', 20], ['终极弓', 30], ['爆炸箭', 30]],
      damage: [{ name: '强力箭', role: '单体主攻', baseMin: 48, baseMax: 125, scale: 3.6 }, { name: '爆炸箭', role: '范围清怪', baseMin: 52, baseMax: 130, scale: 3.5 }],
    },
    crossbowman: {
      summary: '强力箭 20 → 精准弩 20 → 快速弩 → 终极弩 → 穿透箭',
      sequence: [['强力箭', 20], ['精准弩', 20], ['快速弩', 20], ['终极弩', 30], ['穿透箭', 30]],
      damage: [{ name: '强力箭', role: '单体主攻', baseMin: 52, baseMax: 135, scale: 3.8 }, { name: '穿透箭', role: '直线穿透', baseMin: 55, baseMax: 145, scale: 4.0 }],
    },
  },
  thief: {
    default: {
      summary: '双飞斩/劈空斩 → 远程暗器/集中术 → 诅咒术前置 → 隐身',
      sequence: [['双飞斩', 20], ['远程暗器', 8], ['集中术', 20], ['诅咒术', 3], ['隐身', 10]],
      damage: [{ name: '双飞斩', role: '标飞主攻', baseMin: 55, baseMax: 140, scale: 3.7 }],
    },
    assassin: {
      summary: '双飞斩 20 → 精准暗器 20 → 强力投掷 → 快速暗器 → 轻功',
      sequence: [['双飞斩', 20], ['精准暗器', 20], ['强力投掷', 30], ['快速暗器', 20], ['轻功', 20]],
      damage: [{ name: '双飞斩', role: '标飞主攻', baseMin: 65, baseMax: 160, scale: 4.0 }],
    },
    bandit: {
      summary: '劈空斩 20 → 精准短刀 20 → 快速短刀 → 回旋斩 → 轻功',
      sequence: [['劈空斩', 20], ['精准短刀', 20], ['快速短刀', 20], ['回旋斩', 30], ['轻功', 20]],
      damage: [{ name: '劈空斩', role: '短刀主攻', baseMin: 58, baseMax: 150, scale: 3.9 }],
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

function getBranchPlan(classId, branchId) {
  return PLANS[classId]?.[branchId] ?? PLANS[classId]?.default ?? PLANS.warrior.default;
}

function distributeSkillPoints(sequence, totalPoints) {
  let remaining = Math.max(0, totalPoints);
  return sequence.map(([name, max]) => {
    const level = Math.min(max, remaining);
    remaining -= level;
    return { name, level, max };
  }).filter((skill) => skill.level > 0 || skill.name === sequence[0]?.[0]);
}

function nextSteps(sequence, totalPoints, level, count = 4) {
  const steps = [];
  for (let i = 1; i <= count; i += 1) {
    let remaining = Math.max(0, totalPoints + i * 3);
    let target = sequence[sequence.length - 1];
    for (const pair of sequence) {
      if (remaining <= pair[1]) { target = pair; break; }
      remaining -= pair[1];
    }
    steps.push({ level: level + i, text: `${target[0]} x3` });
  }
  return steps;
}

export function getSkillPlan({ classId, branchId, level, mainAttack = 0 }) {
  const plan = getBranchPlan(classId, branchId);
  const totalPoints = Math.max(0, (Number(level) - 10) * 3 + 1);
  const current = distributeSkillPoints(plan.sequence, totalPoints);
  const next = nextSteps(plan.sequence, totalPoints, Number(level));
  const damageCards = plan.damage.map((card) => {
    const skill = current.find((item) => item.name === card.name);
    const skillLevel = skill?.level ?? Math.max(1, Math.min(20, Math.floor((Number(level) - 10) / 2)));
    const min = Math.max(1, Math.round(card.baseMin + mainAttack * card.scale * (skillLevel / 20) * 0.35));
    const max = Math.max(min + 1, Math.round(card.baseMax + mainAttack * card.scale * (skillLevel / 20) * 0.72));
    return { ...card, level: skillLevel, maxLevel: skill?.max ?? 20, min, max };
  });
  return { summary: plan.summary, current, next, damageCards };
}

export function getApNote({ classLine, statPlan }) {
  const primary = classLine?.primaryStat ?? 'STR';
  const secondary = classLine?.secondaryStat ?? 'DEX';
  const current = statPlan?.stats?.[secondary] ?? 0;
  const status = current >= 4 ? '足够' : '偏低';
  return `当前建议主 ${primary}，${secondary} 保持装备/命中需求。当前 ${secondary}：${status}。`;
}
