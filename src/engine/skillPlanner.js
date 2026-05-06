const skill = (name, max, iconKey = '', planCap = max) => ({ name, max, iconKey, planCap });

const FIRST_JOB_ICON = {
  '强力攻击': 'icons/skill/1st_Job/Warrior/1001001_Power_Strike.png',
  '群体攻击': 'icons/skill/1st_Job/Warrior/1001002_Slash_Blast.png',
  '提高 HP 恢复': 'icons/skill/1st_Job/Warrior/1000000_Improved_HP_Recovery.png',
  '提高 HP 上限': 'icons/skill/1st_Job/Warrior/1000001_Max_HP_Increase.png',
  '精准打击': 'icons/skill/1st_Job/Warrior/1000002_Precise_Strikes.png',
  '铁甲术': 'icons/skill/1st_Job/Warrior/1001000_Iron_Body.png',
  '魔力弹': 'icons/skill/1st_Job/Magician/2001002_Energy_Bolt.png',
  '提高 MP 恢复': 'icons/skill/1st_Job/Magician/2000000_Improved_MP_Recovery.png',
  '提高 MP 上限': 'icons/skill/1st_Job/Magician/2000001_Max_MP_Increase.png',
  '魔法双击': 'icons/skill/1st_Job/Magician/2001003_Magic_Claw.png',
  '魔法盾': 'icons/skill/1st_Job/Magician/2001000_Magic_Guard.png',
  '魔法铠甲': 'icons/skill/1st_Job/Magician/2001001_Magic_Armor.png',
  '强力箭': 'icons/skill/1st_Job/Archer/3000000_Critical_Shot.png',
  '亚马逊审判': "icons/skill/1st_Job/Archer/3000001_Amazon's_Judgement.png",
  '远程箭': 'icons/skill/1st_Job/Archer/3000002_The_Eye_of_Amazon.png',
  '集中术': 'icons/skill/1st_Job/Archer/3001000_Focus.png',
  '断魂箭': 'icons/skill/1st_Job/Archer/3001001_Arrow_Blow.png',
  '二连射': 'icons/skill/1st_Job/Archer/3001002_Double_Shot.png',
  '灵巧身手': 'icons/skill/1st_Job/Theif/4000000_Nimble_Body.png',
  '远程暗器': 'icons/skill/1st_Job/Theif/4000001_Keen_Eyes.png',
  '诅咒术': 'icons/skill/1st_Job/Theif/4001000_Disorder.png',
  '隐身': 'icons/skill/1st_Job/Theif/4001001_Dark_Sight.png',
  '劈空斩': 'icons/skill/1st_Job/Theif/4001002_Double_Stab.png',
  '双飞斩': 'icons/skill/1st_Job/Theif/4001003_Lucky_Seven.png',
};

const PLANS = {
  warrior: {
    default: {
      summary: '一转：强力攻击 20 → 群体攻击 20 → 提高 HP 恢复 3 → 提高 HP 上限 15 → 剩余点数补精准打击 / 铁甲术',
      sequence: [
        skill('强力攻击', 20, FIRST_JOB_ICON['强力攻击']),
        skill('群体攻击', 20, FIRST_JOB_ICON['群体攻击']),
        skill('提高 HP 恢复', 15, FIRST_JOB_ICON['提高 HP 恢复'], 3),
        skill('提高 HP 上限', 15, FIRST_JOB_ICON['提高 HP 上限']),
        skill('精准打击', 15, FIRST_JOB_ICON['精准打击']),
        skill('铁甲术', 20, FIRST_JOB_ICON['铁甲术']),
      ],
      damage: [{ name: '强力攻击', role: '单体主攻', baseMin: 38, baseMax: 90, scale: 3.4 }, { name: '群体攻击', role: '范围清怪', baseMin: 28, baseMax: 70, scale: 2.7 }],
    },
    fighter: { summary: '二转：剑/斧精通、终极攻击、加速、愤怒、伤害反击。', sequence: [], damage: [] },
    page: { summary: '二转：剑/钝器精通、终极攻击、加速、压制术、伤害反击。', sequence: [], damage: [] },
    spearman: { summary: '二转：枪/矛精通、终极攻击、加速、钢铁意志、神圣之火。', sequence: [], damage: [] },
  },
  magician: {
    default: {
      summary: '一转：魔力弹 1 → 提高 MP 恢复 5 → 提高 MP 上限 10 → 魔法双击 20 → 魔法盾 / 魔法铠甲',
      sequence: [
        skill('魔力弹', 20, FIRST_JOB_ICON['魔力弹'], 1),
        skill('提高 MP 恢复', 15, FIRST_JOB_ICON['提高 MP 恢复'], 5),
        skill('提高 MP 上限', 10, FIRST_JOB_ICON['提高 MP 上限']),
        skill('魔法双击', 20, FIRST_JOB_ICON['魔法双击']),
        skill('魔法盾', 20, FIRST_JOB_ICON['魔法盾']),
        skill('魔法铠甲', 20, FIRST_JOB_ICON['魔法铠甲']),
      ],
      damage: [{ name: '魔力弹', role: '前置攻击', baseMin: 22, baseMax: 56, scale: 1.8 }, { name: '魔法双击', role: '单体主攻', baseMin: 50, baseMax: 110, scale: 3.2 }],
    },
    fp: { summary: '二转：MP 吸收、精神力、瞬间移动、缓速术、火箭术、毒雾。', sequence: [], damage: [{ name: '火箭术', role: '单体主攻', baseMin: 70, baseMax: 150, scale: 4.0 }, { name: '毒雾', role: '持续输出', baseMin: 32, baseMax: 88, scale: 2.2 }] },
    il: { summary: '二转：MP 吸收、精神力、瞬间移动、缓速术、冰冻术、雷电术。', sequence: [], damage: [{ name: '冰冻术', role: '控场单体', baseMin: 65, baseMax: 138, scale: 3.8 }, { name: '雷电术', role: '范围清怪', baseMin: 45, baseMax: 112, scale: 3.2 }] },
    cleric: { summary: '二转：MP 吸收、瞬间移动、治愈术、神之保护、祝福、圣箭术。', sequence: [], damage: [{ name: '治愈术', role: '亡灵刷怪/续航', baseMin: 42, baseMax: 118, scale: 3.1 }, { name: '圣箭术', role: '圣属性单体', baseMin: 48, baseMax: 125, scale: 3.4 }] },
  },
  bowman: {
    default: {
      summary: '一转：强力箭 20 → 远程箭 8 → 集中术 / 断魂箭 / 二连射，亚马逊审判按路线补点',
      sequence: [
        skill('强力箭', 20, FIRST_JOB_ICON['强力箭']),
        skill('远程箭', 8, FIRST_JOB_ICON['远程箭']),
        skill('集中术', 20, FIRST_JOB_ICON['集中术']),
        skill('断魂箭', 20, FIRST_JOB_ICON['断魂箭']),
        skill('二连射', 20, FIRST_JOB_ICON['二连射']),
        skill('亚马逊审判', 20, FIRST_JOB_ICON['亚马逊审判']),
      ],
      damage: [{ name: '断魂箭', role: '单体攻击', baseMin: 32, baseMax: 86, scale: 2.8 }, { name: '二连射', role: '双段主攻', baseMin: 40, baseMax: 102, scale: 3.4 }],
    },
    hunter: { summary: '二转：弓精通、终极弓、弓加速、强弓、无形箭、爆炸箭。', sequence: [], damage: [{ name: '爆炸箭', role: '范围清怪', baseMin: 52, baseMax: 130, scale: 3.5 }] },
    crossbowman: { summary: '二转：弩精通、终极弩、弩加速、强弩、无形弩、穿透箭。', sequence: [], damage: [{ name: '穿透箭', role: '直线穿透', baseMin: 55, baseMax: 145, scale: 4.0 }] },
  },
  thief: {
    default: {
      summary: '一转：双飞斩 / 劈空斩 → 远程暗器 → 灵巧身手 → 诅咒术 / 隐身',
      sequence: [
        skill('双飞斩', 20, FIRST_JOB_ICON['双飞斩']),
        skill('远程暗器', 8, FIRST_JOB_ICON['远程暗器']),
        skill('劈空斩', 20, FIRST_JOB_ICON['劈空斩']),
        skill('灵巧身手', 20, FIRST_JOB_ICON['灵巧身手']),
        skill('诅咒术', 20, FIRST_JOB_ICON['诅咒术']),
        skill('隐身', 20, FIRST_JOB_ICON['隐身']),
      ],
      damage: [{ name: '双飞斩', role: '标飞主攻', baseMin: 55, baseMax: 140, scale: 3.7 }, { name: '劈空斩', role: '短刀攻击', baseMin: 46, baseMax: 118, scale: 3.2 }],
    },
    assassin: { summary: '二转：精准暗器、强力投掷、恢复术、快速暗器、轻功、吸血。', sequence: [], damage: [{ name: '吸血', role: '续航攻击', baseMin: 42, baseMax: 110, scale: 2.9 }] },
    bandit: { summary: '二转：精准短刀、恢复术、快速短刀、轻功、偷窃、回旋斩。', sequence: [], damage: [{ name: '回旋斩', role: '爆发连击', baseMin: 62, baseMax: 168, scale: 4.1 }] },
  },
  pirate: {
    default: { summary: '国服海盗技能路线预留，等国服公式和数据接入后启用。', sequence: [skill('基础攻击', 1)], damage: [{ name: '基础攻击', role: '占位', baseMin: 10, baseMax: 20, scale: 1 }] },
  },
};

const SECOND_JOB_SKILLS = {
  fighter: [skill('剑精通', 20, 'icons/skill/2nd_Job/Fighter/1100000_Sword_Mastery.png'), skill('斧精通', 20, 'icons/skill/2nd_Job/Fighter/1100001_Axe_Mastery.png'), skill('终极剑', 30, 'icons/skill/2nd_Job/Fighter/1101000_Final_Attack_Sword.png'), skill('终极斧', 30, 'icons/skill/2nd_Job/Fighter/1101001_Final_Attack_Axe.png'), skill('剑加速', 20, 'icons/skill/2nd_Job/Fighter/1101002_Sword_Booster.png'), skill('斧加速', 20, 'icons/skill/2nd_Job/Fighter/1101003_Axe_Booster.png'), skill('愤怒', 30, 'icons/skill/2nd_Job/Fighter/1101004_Rage.png'), skill('伤害反击', 30, 'icons/skill/2nd_Job/Fighter/1101005_Power_Guard.png')],
  page: [skill('剑精通', 20, 'icons/skill/2nd_Job/Page/1200000_Sword_Mastery.png'), skill('钝器精通', 20, 'icons/skill/2nd_Job/Page/1200001_Blunt_Weapon_Mastery.png'), skill('终极剑', 30, 'icons/skill/2nd_Job/Page/1201000_Final_Attack_Sword.png'), skill('终极钝器', 30, 'icons/skill/2nd_Job/Page/1201001_Final_Attack_Blunt_Weapon.png'), skill('剑加速', 20, 'icons/skill/2nd_Job/Page/1201002_Sword_Booster.png'), skill('钝器加速', 20, 'icons/skill/2nd_Job/Page/1201003_Blunt_Weapon_Booster.png'), skill('压制术', 20, 'icons/skill/2nd_Job/Page/1201004_Threaten.png'), skill('伤害反击', 30, 'icons/skill/2nd_Job/Page/1201005_Power_Guard.png')],
  spearman: [skill('枪精通', 20, 'icons/skill/2nd_Job/Spearman/1300000_Spear_Mastery.png'), skill('矛精通', 20, 'icons/skill/2nd_Job/Spearman/1300001_Polearm_Mastery.png'), skill('终极枪', 30, 'icons/skill/2nd_Job/Spearman/1301000_Final_Attack_Spear.png'), skill('终极矛', 30, 'icons/skill/2nd_Job/Spearman/1301001_Final_Attack_Polearm.png'), skill('枪加速', 20, 'icons/skill/2nd_Job/Spearman/1301002_Spear_Booster.png'), skill('矛加速', 20, 'icons/skill/2nd_Job/Spearman/1301003_Polearm_Booster.png'), skill('钢铁意志', 20, 'icons/skill/2nd_Job/Spearman/1301004_Iron_Will.png'), skill('神圣之火', 30, 'icons/skill/2nd_Job/Spearman/1301005_Hyper_Body.png')],
  fp: [skill('MP 吸收', 20, 'icons/skill/2nd_Job/FP_Wizard/2100000_MP_Eater.png'), skill('精神力', 20, 'icons/skill/2nd_Job/FP_Wizard/2101000_Meditation.png'), skill('瞬间移动', 20, 'icons/skill/2nd_Job/FP_Wizard/2101001_Teleport.png'), skill('缓速术', 20, 'icons/skill/2nd_Job/FP_Wizard/2101002_Slow.png'), skill('火箭术', 30, 'icons/skill/2nd_Job/FP_Wizard/2101003_Fire_Arrow.png'), skill('毒雾', 30, 'icons/skill/2nd_Job/FP_Wizard/2101004_Poison_Breath.png')],
  il: [skill('MP 吸收', 20, 'icons/skill/2nd_Job/IL_Wizard/2200000_MP_Eater.png'), skill('精神力', 20, 'icons/skill/2nd_Job/IL_Wizard/2201000_Meditation.png'), skill('瞬间移动', 20, 'icons/skill/2nd_Job/IL_Wizard/2201001_Teleport.png'), skill('缓速术', 20, 'icons/skill/2nd_Job/IL_Wizard/2201002_Slow.png'), skill('冰冻术', 30, 'icons/skill/2nd_Job/IL_Wizard/2201003_Cold_Beam.png'), skill('雷电术', 30, 'icons/skill/2nd_Job/IL_Wizard/2201004_Thunder_Bolt.png')],
  cleric: [skill('MP 吸收', 20, 'icons/skill/2nd_Job/Cleric/2300000_MP_Eater.png'), skill('瞬间移动', 20, 'icons/skill/2nd_Job/Cleric/2301000_Teleport.png'), skill('治愈术', 30, 'icons/skill/2nd_Job/Cleric/2301001_Heal.png'), skill('神之保护', 20, 'icons/skill/2nd_Job/Cleric/2301002_Invincible.png'), skill('祝福', 20, 'icons/skill/2nd_Job/Cleric/2301003_Bless.png'), skill('圣箭术', 30, 'icons/skill/2nd_Job/Cleric/2301004_Holy_Arrow.png')],
  hunter: [skill('弓精通', 20, 'icons/skill/2nd_Job/Hunter/3100000_Bow_Mastery.png'), skill('终极弓', 30, 'icons/skill/2nd_Job/Hunter/3101000_Final_Attack_Bow.png'), skill('弓加速', 20, 'icons/skill/2nd_Job/Hunter/3101001_Bow_Booster.png'), skill('强弓', 20, 'icons/skill/2nd_Job/Hunter/3101002_Power_Knockback.png'), skill('无形箭', 20, 'icons/skill/2nd_Job/Hunter/3101003_Soul_Arrow_Bow.png'), skill('爆炸箭', 30, 'icons/skill/2nd_Job/Hunter/3101004_Arrow_Bomb_Bow.png')],
  crossbowman: [skill('弩精通', 20, 'icons/skill/2nd_Job/Crossbowman/3200000_Crossbow_Mastery.png'), skill('终极弩', 30, 'icons/skill/2nd_Job/Crossbowman/3201000_Final_Attack_Crossbow.png'), skill('弩加速', 20, 'icons/skill/2nd_Job/Crossbowman/3201001_Crossbow_Booster.png'), skill('强弩', 20, 'icons/skill/2nd_Job/Crossbowman/3201002_Power_Knockback.png'), skill('无形弩', 20, 'icons/skill/2nd_Job/Crossbowman/3201003_Soul_Arrow_Crossbow.png'), skill('穿透箭', 30, 'icons/skill/2nd_Job/Crossbowman/3201004_Iron_Arrow_Crossbow.png')],
  assassin: [skill('精准暗器', 20, 'icons/skill/2nd_Job/Assassin/4100000_Claw_Mastery.png'), skill('强力投掷', 30, 'icons/skill/2nd_Job/Assassin/4100001_Critical_Throw.png'), skill('恢复术', 20, 'icons/skill/2nd_Job/Assassin/4100002_Critical_Recovery.png'), skill('快速暗器', 20, 'icons/skill/2nd_Job/Assassin/4101000_Claw_Booster.png'), skill('轻功', 20, 'icons/skill/2nd_Job/Assassin/4101001_Haste.png'), skill('吸血', 30, 'icons/skill/2nd_Job/Assassin/4101002_Drain.png')],
  bandit: [skill('精准短刀', 20, 'icons/skill/2nd_Job/Bandit/4200000_Dagger_Mastery.png'), skill('恢复术', 20, 'icons/skill/2nd_Job/Bandit/4200001_Nimble_Recovery.png'), skill('快速短刀', 20, 'icons/skill/2nd_Job/Bandit/4201000_Dagger_Booster.png'), skill('轻功', 20, 'icons/skill/2nd_Job/Bandit/4201001_Haste.png'), skill('偷窃', 30, 'icons/skill/2nd_Job/Bandit/4201002_Steal.png'), skill('回旋斩', 30, 'icons/skill/2nd_Job/Bandit/4201003_Savage_Blow.png')],
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
  return entries.filter((entry) => {
    const name = Array.isArray(entry) ? entry[0] : entry.name;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function normalizeSkillEntry(entry) {
  if (Array.isArray(entry)) return skill(entry[0], entry[1], entry[2] || FIRST_JOB_ICON[entry[0]] || '', entry[3] ?? entry[1]);
  return skill(entry.name, entry.max, entry.iconKey || FIRST_JOB_ICON[entry.name] || '', entry.planCap ?? entry.max);
}

function getSecondJobSequence(classId, branchId) {
  if (SECOND_JOB_SKILLS[branchId]) return SECOND_JOB_SKILLS[branchId];
  const firstNames = new Set(getFirstJobPlan(classId).sequence.map((entry) => normalizeSkillEntry(entry).name));
  const branchPlan = getBranchPlan(classId, branchId);
  if (branchPlan === getFirstJobPlan(classId)) return [];
  return uniqueByName(branchPlan.sequence.filter((entry) => !firstNames.has(normalizeSkillEntry(entry).name))).map(normalizeSkillEntry);
}

function buildSkillRows(classId, branchId, level) {
  const secondUnlocked = Number(level) > FIRST_JOB_CAP_LEVEL;
  const firstRows = getFirstJobPlan(classId).sequence.map((entry) => ({ ...normalizeSkillEntry(entry), tier: 'first', tierLabel: '一转', locked: false }));
  const secondRows = getSecondJobSequence(classId, branchId).map((entry) => ({ ...normalizeSkillEntry(entry), tier: 'second', tierLabel: '二转', locked: !secondUnlocked }));
  return [...firstRows, ...secondRows];
}

function getPlanSummary(classId, branchId, level) {
  const first = getFirstJobPlan(classId);
  const second = getBranchPlan(classId, branchId);
  if (Number(level) <= FIRST_JOB_CAP_LEVEL || second === first) return `${first.summary}。Lv.30 及以下只开放一转技能，二转技能会显示但锁定。`;
  return `${first.summary}。${second.summary}。一转 SP 和二转 SP 分开计算。`;
}

export function getRecommendedSkillAllocation({ classId, branchId, level }) {
  const rows = buildSkillRows(classId, branchId, level);
  const totals = { first: getFirstJobSkillPoints(level), second: getSecondJobSkillPoints(level) };
  return Object.fromEntries(distributeSkillPoints(rows, totals).map((row) => [row.name, row.level]));
}

function distributeSkillPoints(rows, totalPointsByTier, customSkills = null) {
  if (customSkills) return sanitizeSkillAllocation(rows, totalPointsByTier, customSkills);
  const remaining = { first: Math.max(0, Number(totalPointsByTier.first) || 0), second: Math.max(0, Number(totalPointsByTier.second) || 0) };
  return rows.map((row) => {
    if (row.locked) return { ...row, level: 0 };
    const available = remaining[row.tier] ?? 0;
    const cap = Math.min(row.max, row.planCap ?? row.max);
    const level = Math.min(cap, available);
    remaining[row.tier] = available - level;
    return { ...row, level };
  });
}

function sanitizeSkillAllocation(rows, totalPointsByTier, customSkills) {
  const remaining = { first: Math.max(0, Number(totalPointsByTier.first) || 0), second: Math.max(0, Number(totalPointsByTier.second) || 0) };
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
  const used = skills.reduce((acc, row) => {
    acc[row.tier] = (acc[row.tier] ?? 0) + row.level;
    return acc;
  }, { first: 0, second: 0 });
  return { first: Math.max(0, (totalPointsByTier.first ?? 0) - (used.first ?? 0)), second: Math.max(0, (totalPointsByTier.second ?? 0) - (used.second ?? 0)) };
}

function nextSteps(skills, totalPointsByTier, level, count = 4) {
  const activeTier = Number(level) > FIRST_JOB_CAP_LEVEL ? 'second' : 'first';
  const sequence = skills.filter((row) => row.tier === activeTier && !row.locked);
  if (!sequence.length) return [];
  const usedInTier = sequence.reduce((sum, row) => sum + row.level, 0);
  const maxInTier = sequence.reduce((sum, row) => sum + row.max, 0);
  const steps = [];
  for (let i = 1; i <= count; i += 1) {
    let remaining = Math.min(maxInTier, usedInTier + i * 3);
    let target = sequence[sequence.length - 1];
    for (const row of sequence) {
      if (remaining <= row.max) { target = row; break; }
      remaining -= row.max;
    }
    steps.push({ level: Number(level) + i, text: `${target.name} x3` });
  }
  return steps;
}

function getDamageDefinitions(classId, branchId, level) {
  const first = getFirstJobPlan(classId);
  const second = getBranchPlan(classId, branchId);
  const definitions = Number(level) > FIRST_JOB_CAP_LEVEL && second !== first ? [...first.damage, ...second.damage] : [...first.damage];
  const byName = new Map();
  for (const card of definitions) byName.set(card.name, card);
  return [...byName.values()];
}

export function getSkillPlan({ classId, branchId, level, mainAttack = 0, customSkills = null }) {
  const rows = buildSkillRows(classId, branchId, level);
  const totalPointsByTier = { first: getFirstJobSkillPoints(level), second: getSecondJobSkillPoints(level) };
  const skills = distributeSkillPoints(rows, totalPointsByTier, customSkills);
  const usedSp = skills.reduce((sum, row) => sum + row.level, 0);
  const remainingByTier = getRemainingByTier(skills, totalPointsByTier);
  const current = skills.filter((row) => row.level > 0);
  const next = nextSteps(skills, totalPointsByTier, Number(level));
  const skillByName = new Map(skills.map((row) => [row.name, row]));
  const baseMin = Math.max(1, Math.round(mainAttack * 0.62));
  const baseMax = Math.max(baseMin + 1, Math.round(mainAttack * 1.18));
  const activeDamageCards = getDamageDefinitions(classId, branchId, level)
    .map((card) => ({ card, row: skillByName.get(card.name) }))
    .filter(({ row }) => row && row.level > 0)
    .map(({ card, row }) => {
      const min = Math.max(1, Math.round(card.baseMin + mainAttack * card.scale * (row.level / Math.max(1, Math.min(20, row.max))) * 0.35));
      const max = Math.max(min + 1, Math.round(card.baseMax + mainAttack * card.scale * (row.level / Math.max(1, Math.min(20, row.max))) * 0.72));
      return { ...card, level: row.level, maxLevel: row.max, iconKey: row.iconKey, min, max };
    });
  return {
    summary: getPlanSummary(classId, branchId, level),
    skills,
    current,
    next,
    damageCards: [{ name: 'Base Attack', role: '普通攻击', level: null, maxLevel: null, min: baseMin, max: baseMax, isBase: true }, ...activeDamageCards],
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
