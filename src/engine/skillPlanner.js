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

const OFFICIAL_CLASS_NAMES = {
  warrior: ['warrior'],
  fighter: ['fighter'],
  page: ['page'],
  spearman: ['spearman'],
  magician: ['magician', 'mage'],
  fp: ['f/p wizard', 'fire poison wizard', 'fire/poison wizard'],
  il: ['i/l wizard', 'ice lightning wizard', 'ice/lightning wizard'],
  cleric: ['cleric'],
  bowman: ['archer', 'bowman'],
  hunter: ['hunter'],
  crossbowman: ['crossbowman', 'crossbow man'],
  thief: ['rogue', 'thief'],
  assassin: ['assassin'],
  bandit: ['bandit'],
};

const OFFICIAL_PLAN_ORDER = {
  warrior: ['Power Strike', 'Slash Blast', 'Improved HP Recovery', 'Max HP Increase', 'Precise Strikes', 'Iron Body'],
  magician: ['Energy Bolt', 'Improved MP Recovery', 'Max MP Increase', 'Magic Claw', 'Magic Guard', 'Magic Armor'],
  bowman: ['Critical Shot', 'The Eye of Amazon', 'Arrow Blow', 'Double Shot', 'Focus', "Amazon's Judgement"],
  thief: ['Lucky Seven', 'Keen Eyes', 'Double Stab', 'Nimble Body', 'Dark Sight', 'Disorder'],
  fighter: ['Sword Mastery', 'Axe Mastery', 'Sword Booster', 'Axe Booster', 'Rage', 'Final Attack: Sword', 'Final Attack: Axe', 'Power Guard'],
  page: ['Sword Mastery', 'Blunt Weapon Mastery', 'Sword Booster', 'Blunt Weapon Booster', 'Threaten', 'Power Guard', 'Final Attack: Sword', 'Final Attack: Blunt Weapon'],
  spearman: ['Spear Mastery', 'Polearm Mastery', 'Spear Booster', 'Polearm Booster', 'Hyper Body', 'Iron Will', 'Final Attack: Spear', 'Final Attack: Polearm'],
  fp: ['Fire Arrow', 'Meditation', 'Teleport', 'MP Eater', 'Slow', 'Poison Breath'],
  il: ['Thunder Bolt', 'Cold Beam', 'Meditation', 'Teleport', 'MP Eater', 'Slow'],
  cleric: ['Heal', 'Bless', 'Teleport', 'MP Eater', 'Invincible', 'Holy Arrow'],
  hunter: ['Bow Mastery', 'Bow Booster', 'Arrow Bomb: Bow', 'Power Knockback', 'Soul Arrow: Bow', 'Final Attack: Bow'],
  crossbowman: ['Crossbow Mastery', 'Crossbow Booster', 'Iron Arrow: Crossbow', 'Power Knockback', 'Soul Arrow: Crossbow', 'Final Attack: Crossbow'],
  assassin: ['Claw Mastery', 'Critical Throw', 'Claw Booster', 'Haste', 'Drain', 'Critical Recovery'],
  bandit: ['Dagger Mastery', 'Dagger Booster', 'Savage Blow', 'Haste', 'Steal', 'Nimble Recovery'],
};

const OFFICIAL_PLAN_CAPS = {
  'Improved HP Recovery': 3,
  'Improved MP Recovery': 5,
  'Energy Bolt': 1,
};

const ESSENTIAL_SKILL_MIN = {
  magician: { 'Energy Bolt': 1 },
};

const FIRST_JOB_BRANCH_PLAN_ORDER = {
  assassin: ['Lucky Seven', 'Keen Eyes', 'Nimble Body', 'Dark Sight', 'Disorder', 'Double Stab'],
  bandit: ['Double Stab', 'Nimble Body', 'Dark Sight', 'Disorder', 'Lucky Seven', 'Keen Eyes'],
};

const FIRST_JOB_BRANCH_EXCLUSIONS = {
  assassin: new Set(['Double Stab']),
  bandit: new Set(['Lucky Seven', 'Keen Eyes']),
};

const CORE_DAMAGE_SKILLS = {
  warrior: ['Power Strike', 'Slash Blast'],
  magician: ['Magic Claw', 'Energy Bolt'],
  bowman: ['Double Shot', 'Arrow Blow'],
  thief: ['Lucky Seven', 'Double Stab'],
  thief_assassin: ['Lucky Seven'],
  thief_bandit: ['Double Stab'],
  fighter: ['Rage'],
  page: ['Threaten'],
  spearman: ['Hyper Body'],
  fp: ['Fire Arrow', 'Poison Breath'],
  il: ['Thunder Bolt', 'Cold Beam'],
  cleric: ['Heal', 'Holy Arrow'],
  hunter: ['Arrow Bomb: Bow', 'Power Knockback'],
  crossbowman: ['Iron Arrow: Crossbow', 'Power Knockback'],
  assassin: ['Critical Throw', 'Drain'],
  bandit: ['Savage Blow', 'Steal'],
};

const DIRECT_DAMAGE_SKILLS = new Set([
  'Power Strike',
  'Slash Blast',
  'Energy Bolt',
  'Magic Claw',
  'Fire Arrow',
  'Poison Breath',
  'Cold Beam',
  'Thunder Bolt',
  'Heal',
  'Holy Arrow',
  'Arrow Blow',
  'Double Shot',
  'Power Knockback',
  'Arrow Bomb: Bow',
  'Iron Arrow: Crossbow',
  'Double Stab',
  'Lucky Seven',
  'Drain',
  'Savage Blow',
]);

const STRATEGY_BUDGET_WEIGHTS = {
  low: { damage: 1.08, accuracy: 1.28, sustain: 1.18, survival: 1.1, utility: 0.82, speed: 0.82 },
  mid: { damage: 1, accuracy: 1, sustain: 1, survival: 1, utility: 1, speed: 1 },
  high: { damage: 1.18, accuracy: 0.82, sustain: 0.72, survival: 0.82, utility: 1.08, speed: 1.2 },
};

function getFirstJobPlan(classId) {
  return PLANS[classId]?.default ?? PLANS.warrior.default;
}

function getBranchPlan(classId, branchId) {
  return PLANS[classId]?.[branchId] ?? PLANS[classId]?.default ?? PLANS.warrior.default;
}

function normalizeOfficialName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFirstJobStartLevel(classId) {
  return classId === 'magician' ? 8 : FIRST_JOB_START_LEVEL;
}

function getFirstJobSkillPoints(level, classId = 'warrior') {
  const cappedLevel = Math.min(Number(level) || 0, FIRST_JOB_CAP_LEVEL);
  const startLevel = getFirstJobStartLevel(classId);
  if (cappedLevel < startLevel) return 0;
  return Math.max(0, (cappedLevel - startLevel) * 3 + 1);
}

function getSecondJobSkillPoints(level) {
  const numericLevel = Number(level) || 0;
  return numericLevel > FIRST_JOB_CAP_LEVEL ? (numericLevel - FIRST_JOB_CAP_LEVEL) * 3 : 0;
}

function getTotalSkillPoints(level, classId = 'warrior') {
  return getFirstJobSkillPoints(level, classId) + getSecondJobSkillPoints(level);
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

function sortOfficialSkills(skills, planId) {
  const order = OFFICIAL_PLAN_ORDER[planId] ?? [];
  const rank = new Map(order.map((name, index) => [name, index]));
  return [...skills].sort((a, b) => {
    const ar = rank.has(a.name) ? rank.get(a.name) : 1000;
    const br = rank.has(b.name) ? rank.get(b.name) : 1000;
    return ar - br || String(a.id).localeCompare(String(b.id));
  });
}

function matchesOfficialClass(group, classId) {
  const wanted = new Set((OFFICIAL_CLASS_NAMES[classId] ?? [classId]).map(normalizeOfficialName));
  const names = [group?.className, group?.class_name, group?.baseClass, group?.baseClassLabel, group?.mainClass]
    .map(normalizeOfficialName)
    .filter(Boolean);
  return names.some((name) => wanted.has(name));
}

function isFirstJobGroup(group) {
  return /1st|first/i.test(String(group?.job ?? group?.job_name ?? ''));
}

function isSecondJobGroup(group) {
  return /2nd|second/i.test(String(group?.job ?? group?.job_name ?? ''));
}

function officialLevelStats(skillEntry) {
  return skillEntry?.allLevelStats ?? skillEntry?.all_level_stats ?? skillEntry?.levelStats ?? [];
}

function toOfficialSkillRow(skillEntry, group, tier, locked = false) {
  const max = Number(skillEntry?.maxLevel ?? skillEntry?.max_level ?? skillEntry?.max ?? 0);
  const description = skillEntry?.description ?? '';
  return {
    name: skillEntry?.name ?? `Skill ${skillEntry?.id ?? ''}`.trim(),
    id: String(skillEntry?.id ?? ''),
    max,
    maxLevel: max,
    iconKey: skillEntry?.thumbnail ?? '',
    thumbnail: skillEntry?.thumbnail ?? '',
    planCap: Math.min(max, OFFICIAL_PLAN_CAPS[skillEntry?.name] ?? max),
    tier,
    tierLabel: tier === 'first' ? '1st Job' : '2nd Job',
    locked,
    source: 'official',
    groupName: group?.className ?? group?.class_name ?? '',
    job: group?.job ?? group?.job_name ?? '',
    description,
    allLevelStats: officialLevelStats(skillEntry),
    all_level_stats: officialLevelStats(skillEntry),
    requiredSkill: skillEntry?.requiredSkill ?? skillEntry?.required_skill ?? '',
    requiredDependency: parseRequiredDependency(description),
  };
}

function parseRequiredDependency(description = '') {
  const match = String(description).match(/Required Skill:\s*At least Level\s*(\d+)\s*on\s*([^\n]+)/i);
  if (!match) return null;
  return {
    level: Number(match[1]) || 0,
    name: String(match[2]).trim(),
  };
}

function buildOfficialSkillRows(classId, branchId, level, skillGroups = []) {
  if (!Array.isArray(skillGroups) || !skillGroups.length) return [];
  const secondUnlocked = Number(level) > FIRST_JOB_CAP_LEVEL;
  const firstGroups = skillGroups.filter((group) => isFirstJobGroup(group) && matchesOfficialClass(group, classId));
  const secondGroups = skillGroups.filter((group) => isSecondJobGroup(group) && matchesOfficialClass(group, branchId));
  const firstRows = firstGroups.flatMap((group) => sortOfficialSkills(group.skills ?? [], classId).map((entry) => toOfficialSkillRow(entry, group, 'first', false)));
  const secondRows = secondGroups.flatMap((group) => sortOfficialSkills(group.skills ?? [], branchId).map((entry) => toOfficialSkillRow(entry, group, 'second', !secondUnlocked)));
  return [...firstRows, ...secondRows].filter((row) => row.max > 0);
}

function buildSkillRows(classId, branchId, level, skillGroups = []) {
  const officialRows = buildOfficialSkillRows(classId, branchId, level, skillGroups);
  if (officialRows.length) return officialRows;

  const secondUnlocked = Number(level) > FIRST_JOB_CAP_LEVEL;
  const firstRows = getFirstJobPlan(classId).sequence.map((entry) => ({ ...normalizeSkillEntry(entry), tier: 'first', tierLabel: '一转', locked: false }));
  const secondRows = getSecondJobSequence(classId, branchId).map((entry) => ({ ...normalizeSkillEntry(entry), tier: 'second', tierLabel: '二转', locked: !secondUnlocked }));
  return [...firstRows, ...secondRows];
}

function getPlanSummary(classId, branchId, level, usingOfficial = false) {
  if (usingOfficial) {
    return 'Using current International server AppData skill tables: max levels, descriptions, current effects, and next-level changes are read from skills.json.';
  }
  const first = getFirstJobPlan(classId);
  const second = getBranchPlan(classId, branchId);
  if (Number(level) <= FIRST_JOB_CAP_LEVEL || second === first) return `${first.summary}。Lv.30 及以下只开放一转技能，二转技能会显示但锁定。`;
  return `${first.summary}。${second.summary}。一转 SP 和二转 SP 分开计算。`;
}

export function getRecommendedSkillAllocation({ classId, branchId, level, budget = 'mid', skillGroups = [] }) {
  const rows = buildSkillRows(classId, branchId, level, skillGroups);
  const totals = { first: getFirstJobSkillPoints(level, classId), second: getSecondJobSkillPoints(level) };
  return Object.fromEntries(distributeSkillPoints(rows, totals, null, { classId, branchId, level, budget }).map((row) => [row.name, row.level]));
}

function distributeSkillPoints(rows, totalPointsByTier, customSkills = null, context = {}) {
  if (customSkills) return sanitizeSkillAllocation(rows, totalPointsByTier, customSkills);
  if (rows.some((row) => row.source === 'official')) return distributeStrategicSkillPoints(rows, totalPointsByTier, context);

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

function distributeStrategicSkillPoints(rows, totalPointsByTier, context = {}) {
  const byName = new Map(rows.map((row) => [row.name, { ...row, level: 0 }]));
  const result = rows.map((row) => byName.get(row.name));

  for (const tier of ['first', 'second']) {
    const tierRows = result.filter((row) => row.tier === tier && !row.locked);
    let remaining = Math.max(0, Number(totalPointsByTier[tier]) || 0);

    while (remaining > 0) {
      const candidates = tierRows
        .filter((row) => row.level < row.max)
        .filter((row) => dependencyMet(row, byName));

      if (!candidates.length) break;

      const best = candidates
        .map((row) => ({ row, score: scoreStrategicSkillPoint(row, byName, context) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || getPlanRank(a.row, context) - getPlanRank(b.row, context))[0];

      if (!best) break;
      best.row.level += 1;
      remaining -= 1;
    }
  }

  return result;
}

function dependencyMet(row, byName) {
  const dep = row.requiredDependency;
  if (!dep?.name || !dep.level) return true;
  return Number(byName.get(dep.name)?.level ?? 0) >= dep.level;
}

function getPlanRank(row, context = {}) {
  const order = getStrategicPlanOrder(row, context);
  const rank = order.indexOf(row.name);
  return rank >= 0 ? rank : 999;
}

function getStrategicPlanOrder(row, context = {}) {
  if (row.tier === 'first' && context.classId === 'thief') {
    return FIRST_JOB_BRANCH_PLAN_ORDER[context.branchId] ?? OFFICIAL_PLAN_ORDER.thief ?? [];
  }
  return OFFICIAL_PLAN_ORDER[row.tier === 'second' ? context.branchId : context.classId] ?? [];
}

function getStrategicSkillPlanId(row, context = {}) {
  if (row.tier === 'first' && context.classId === 'thief') {
    if (context.branchId === 'assassin') return 'thief_assassin';
    if (context.branchId === 'bandit') return 'thief_bandit';
  }
  return row.tier === 'second' ? context.branchId : context.classId;
}

function isBranchExcludedFirstJobSkill(row, context = {}) {
  if (row.tier !== 'first' || context.classId !== 'thief') return false;
  return FIRST_JOB_BRANCH_EXCLUSIONS[context.branchId]?.has(row.name) ?? false;
}

function scoreStrategicSkillPoint(row, byName, context = {}) {
  const budget = context.budget ?? 'mid';
  const weights = STRATEGY_BUDGET_WEIGHTS[budget] ?? STRATEGY_BUDGET_WEIGHTS.mid;
  const classId = getStrategicSkillPlanId(row, context);
  const minLevel = ESSENTIAL_SKILL_MIN[classId]?.[row.name] ?? 0;
  if (row.level < minLevel) return 1000 - row.level;
  if (isBranchExcludedFirstJobSkill(row, context)) return 0;

  const current = effectTextAtLevel(row);
  const next = effectTextAtLevel({ ...row, level: row.level + 1 });
  const coreRank = (CORE_DAMAGE_SKILLS[classId] ?? []).indexOf(row.name);
  const coreDamage = coreRank >= 0;
  const hasCoreDamageOnline = hasCoreDamageAtLevel(byName, classId, row.tier, context.level);
  const prereqScore = scorePrerequisiteNeed(row, byName, context, hasCoreDamageOnline);
  const traits = getSkillPointTraits(current, next);

  if (traits.damage || coreDamage) {
    const target = getCoreDamageTarget(context.level, budget, row.max);
    const urgency = row.level < target ? 1 : 0.34;
    const rankBonus = coreDamage ? Math.max(0, 18 - coreRank * 5) : 0;
    return prereqScore + (72 + rankBonus + traits.damageGain * 55) * weights.damage * urgency;
  }

  if (traits.accuracyGain) {
    const lowHitUrgency = budget === 'low' ? 1.25 : budget === 'high' ? 0.7 : 1;
    return prereqScore + (35 + traits.accuracyGain * 1.7) * weights.accuracy * lowHitUrgency;
  }

  if (traits.attackGain || traits.magicAttackGain) {
    return prereqScore + (42 + Math.max(traits.attackGain, traits.magicAttackGain) * 1.4) * weights.damage;
  }

  if (traits.maxHpGain || traits.maxMpGain) {
    const poolWeight = traits.maxMpGain ? weights.sustain : weights.survival;
    const timing = hasCoreDamageOnline ? 1 : 0.25;
    return prereqScore + (18 + Math.max(traits.maxHpGain, traits.maxMpGain) * 2.4) * poolWeight * timing;
  }

  if (traits.recoveryGain || /recover|regenerates|absorb/i.test(next)) {
    const timing = hasCoreDamageOnline ? 1 : 0.28;
    return prereqScore + (16 + traits.recoveryGain * 1.4) * weights.sustain * timing;
  }

  if (traits.speedGain || traits.jumpGain) {
    return prereqScore + (18 + traits.speedGain + traits.jumpGain * 2) * weights.speed;
  }

  if (/def\.|damage -|guard|invincible|body|shield/i.test(next)) {
    return prereqScore + 20 * weights.survival * (hasCoreDamageOnline ? 1 : 0.35);
  }

  return prereqScore + 10 * weights.utility * (hasCoreDamageOnline ? 1 : 0.3);
}

function hasCoreDamageAtLevel(byName, classId, tier, level) {
  const names = CORE_DAMAGE_SKILLS[classId] ?? [];
  const target = Math.min(12, getCoreDamageTarget(level, 'mid', 20));
  return names.some((name) => {
    const row = byName.get(name);
    return row && row.tier === tier && Number(row.level ?? 0) >= target;
  });
}

function getCoreDamageTarget(level, budget, max) {
  const numericLevel = Number(level) || 1;
  if (numericLevel <= 14) return Math.min(max, budget === 'low' ? 10 : 12);
  if (numericLevel <= 22) return Math.min(max, budget === 'high' ? 20 : 18);
  return Math.min(max, 20);
}

function scorePrerequisiteNeed(row, byName, context, hasCoreDamageOnline) {
  const dependents = [...byName.values()].filter((candidate) => candidate.requiredDependency?.name === row.name);
  if (!dependents.length) return 0;
  const needed = dependents.some((candidate) => {
    const desired = candidate.name.includes('Max HP') || candidate.name.includes('Max MP') || /Body|Guard|Armor/i.test(candidate.name);
    return desired && Number(row.level ?? 0) < Number(candidate.requiredDependency?.level ?? 0);
  });
  if (!needed) return 0;
  return hasCoreDamageOnline ? 58 : 14;
}

function getSkillPointTraits(current, next) {
  return {
    damage: Boolean(parseDamageEffect(next)) || /Damage|Basic Attack|Attack \d+x/i.test(next),
    damageGain: Math.max(0, (parseDamageEffect(next)?.ratio ?? 0) - (parseDamageEffect(current)?.ratio ?? 0)),
    maxHpGain: positiveDelta(current, next, /Max\s+HP\s*\+(\d+(?:\.\d+)?)%/i),
    maxMpGain: positiveDelta(current, next, /Max\s+MP\s*\+(\d+(?:\.\d+)?)%/i),
    accuracyGain: positiveDelta(current, next, /Accuracy\s*\+(\d+(?:\.\d+)?)/i),
    recoveryGain: positiveDelta(current, next, /recovery from items\/skills is increased by\s+(\d+(?:\.\d+)?)%/i),
    attackGain: positiveDelta(current, next, /(?:^|[;,]\s*)Attack Power\s*\+(\d+(?:\.\d+)?)/i),
    magicAttackGain: positiveDelta(current, next, /Magic Attack\s*\+(\d+(?:\.\d+)?)/i),
    speedGain: positiveDelta(current, next, /\bSpeed\s*\+(\d+(?:\.\d+)?)/i),
    jumpGain: positiveDelta(current, next, /\bJump\s*\+(\d+(?:\.\d+)?)/i),
  };
}

function positiveDelta(current, next, regex) {
  const cur = Number(String(current || '').match(regex)?.[1] ?? 0) || 0;
  const nx = Number(String(next || '').match(regex)?.[1] ?? 0) || 0;
  return Math.max(0, nx - cur);
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

function effectTextAtLevel(skill, levelOffset = 0) {
  const level = Math.max(0, Math.min(Number(skill?.max ?? 0), Number(skill?.level ?? 0) + levelOffset));
  if (!level) return '';
  const stats = skill?.allLevelStats ?? skill?.all_level_stats ?? [];
  return String(stats[level - 1] ?? '');
}

function emptySkillBonuses() {
  return {
    stats: { STR: 0, DEX: 0, INT: 0, LUK: 0 },
    maxHpPercent: 0,
    maxMpPercent: 0,
    accuracy: 0,
    avoidability: 0,
    weaponAttack: 0,
    magicAttack: 0,
    speed: 0,
    jump: 0,
    criticalRate: 0,
    criticalDamage: 0,
  };
}

function addRegexBonus(target, key, text, regex) {
  const match = text.match(regex);
  if (!match) return;
  target[key] += Number(match[1]) || 0;
}

function addSkillStatBonusesFromText(bonuses, text) {
  if (!text) return;
  addRegexBonus(bonuses, 'maxHpPercent', text, /Max\s+HP\s*\+(\d+(?:\.\d+)?)%/i);
  addRegexBonus(bonuses, 'maxMpPercent', text, /Max\s+MP\s*\+(\d+(?:\.\d+)?)%/i);
  addRegexBonus(bonuses, 'accuracy', text, /Accuracy\s*\+(\d+(?:\.\d+)?)/i);
  addRegexBonus(bonuses, 'avoidability', text, /Avoidability\s*\+(\d+(?:\.\d+)?)/i);
  addRegexBonus(bonuses, 'weaponAttack', text, /(?:^|[;,]\s*|level\s+\d+,\s*|success\s+)\b(?:Weapon\s+)?(?:Attack Power|Weapon Attack)\s*\+(\d+(?:\.\d+)?)/i);
  addRegexBonus(bonuses, 'magicAttack', text, /Magic Attack\s*\+(\d+(?:\.\d+)?)/i);
  addRegexBonus(bonuses, 'speed', text, /\bSpeed\s*\+(\d+(?:\.\d+)?)/i);
  addRegexBonus(bonuses, 'jump', text, /\bJump\s*\+(\d+(?:\.\d+)?)/i);
  addRegexBonus(bonuses, 'criticalRate', text, /Critical Rate\s*\+(\d+(?:\.\d+)?)%/i);
  addRegexBonus(bonuses, 'criticalDamage', text, /Critical Damage\s*\+(\d+(?:\.\d+)?)%/i);

  for (const stat of Object.keys(bonuses.stats)) {
    const match = text.match(new RegExp(`\\b${stat}\\s*\\+(\\d+(?:\\.\\d+)?)`, 'i'));
    if (match) bonuses.stats[stat] += Number(match[1]) || 0;
  }
}

function getSkillStatBonuses(skills) {
  const bonuses = emptySkillBonuses();
  for (const skillRow of skills) {
    if (!skillRow?.level || skillRow.locked) continue;
    addSkillStatBonusesFromText(bonuses, effectTextAtLevel(skillRow));
  }
  return bonuses;
}

function parseDamageEffect(text) {
  if (!text) return null;
  const multi = text.match(/Attack\s+(\d+)x\s+with\s+(\d+(?:\.\d+)?)%\s+damage/i);
  if (multi) return { ratio: Number(multi[2]) / 100, hits: Number(multi[1]) };

  const percent = text.match(/damage\s+(\d+(?:\.\d+)?)%/i);
  if (percent) return { ratio: Number(percent[1]) / 100, hits: 1 };

  const basic = text.match(/Basic Attack\s+(\d+(?:\.\d+)?)/i);
  if (basic) return { ratio: Number(basic[1]) / 100, hits: 1 };

  return null;
}

function parseOfficialDamageEffect(row, effect) {
  if (row.name === 'Heal') {
    const heal = String(effect || '').match(/Recovery rate\s+(\d+(?:\.\d+)?)%/i);
    if (heal) return { ratio: Number(heal[1]) / 100, hits: 1 };
  }
  return parseDamageEffect(effect);
}

function parseMpCost(text) {
  const match = String(text || '').match(/\bMP\s*-?\s*(\d+)/i);
  return match ? Number(match[1]) || 0 : 0;
}

function getSkillHitCount(row, effect) {
  if (row.name === 'Magic Claw' || row.name === 'Double Shot' || row.name === 'Lucky Seven') return 2;
  const explicit = parseDamageEffect(effect)?.hits;
  if (explicit) return explicit;
  return 1;
}

function getOfficialDamageCards(skills, mainAttack) {
  return skills
    .filter((row) => row.source === 'official' && row.level > 0 && !row.locked)
    .map((row) => {
      const effect = effectTextAtLevel(row);
      if (!DIRECT_DAMAGE_SKILLS.has(row.name)) return null;
      const damage = parseOfficialDamageEffect(row, effect);
      if (!damage) return null;
      const hits = getSkillHitCount(row, effect);
      const ratio = damage.ratio * Math.max(1, hits);
      const min = Math.max(1, Math.round(mainAttack * ratio * 0.82));
      const max = Math.max(min + 1, Math.round(mainAttack * ratio * 1.18));
      return {
        name: row.name,
        role: effect,
        level: row.level,
        maxLevel: row.max,
        iconKey: row.iconKey,
        min,
        max,
        hits,
        mpCost: parseMpCost(effect),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.max - a.max)
    .slice(0, 6);
}

export function getSkillPlan({ classId, branchId, level, mainAttack = 0, customSkills = null, skillGroups = [], budget = 'mid' }) {
  const rows = buildSkillRows(classId, branchId, level, skillGroups);
  const usingOfficial = rows.some((row) => row.source === 'official');
  const totalPointsByTier = { first: getFirstJobSkillPoints(level, classId), second: getSecondJobSkillPoints(level) };
  const skills = distributeSkillPoints(rows, totalPointsByTier, customSkills, { classId, branchId, level, budget, mainAttack });
  const usedSp = skills.reduce((sum, row) => sum + row.level, 0);
  const remainingByTier = getRemainingByTier(skills, totalPointsByTier);
  const current = skills.filter((row) => row.level > 0);
  const next = nextSteps(skills, totalPointsByTier, Number(level));
  const skillByName = new Map(skills.map((row) => [row.name, row]));
  const baseMin = Math.max(1, Math.round(mainAttack * 0.62));
  const baseMax = Math.max(baseMin + 1, Math.round(mainAttack * 1.18));
  const activeDamageCards = usingOfficial
    ? getOfficialDamageCards(skills, mainAttack)
    : getDamageDefinitions(classId, branchId, level)
      .map((card) => ({ card, row: skillByName.get(card.name) }))
      .filter(({ row }) => row && row.level > 0)
      .map(({ card, row }) => {
        const min = Math.max(1, Math.round(card.baseMin + mainAttack * card.scale * (row.level / Math.max(1, Math.min(20, row.max))) * 0.35));
        const max = Math.max(min + 1, Math.round(card.baseMax + mainAttack * card.scale * (row.level / Math.max(1, Math.min(20, row.max))) * 0.72));
        return { ...card, level: row.level, maxLevel: row.max, iconKey: row.iconKey, min, max };
      });
  const totalSp = getTotalSkillPoints(level, classId);
  const statBonuses = getSkillStatBonuses(skills);
  return {
    summary: getPlanSummary(classId, branchId, level, usingOfficial),
    skills,
    current,
    next,
    damageCards: [{ name: 'Base Attack', role: '普通攻击', level: null, maxLevel: null, min: baseMin, max: baseMax, isBase: true }, ...activeDamageCards],
    totalSp,
    totalSpByTier: totalPointsByTier,
    usedSp,
    remainingSp: Math.max(0, totalSp - usedSp),
    remainingByTier,
    statBonuses,
  };
}

export function getApNote({ classLine, statPlan }) {
  const primary = classLine?.primaryStat ?? 'STR';
  const secondary = classLine?.secondaryStat ?? 'DEX';
  const current = statPlan?.stats?.[secondary] ?? 0;
  const status = current >= 4 ? '足够' : '偏低';
  return `当前建议主 ${primary}，${secondary} 保持装备/命中需求。当前 ${secondary}：${status}。`;
}
