const WEAPON_LABELS = {
  sword: '剑',
  axe: '斧',
  'blunt weapon': '钝器',
  spear: '枪',
  polearm: '矛',
  bow: '弓',
  crossbow: '弩',
  claw: '拳套',
  dagger: '短刀',
};

const PHRASE_REPLACEMENTS = [
  ['Sword Mastery', '剑类武器熟练度'],
  ['Axe Mastery', '斧类武器熟练度'],
  ['Blunt Weapon Mastery', '钝器熟练度'],
  ['Spear Mastery', '枪熟练度'],
  ['Polearm Mastery', '矛熟练度'],
  ['Bow Mastery', '弓熟练度'],
  ['Crossbow Mastery', '弩熟练度'],
  ['Claw Mastery', '拳套熟练度'],
  ['Dagger Mastery', '短刀熟练度'],
  ['Sword Attack Speed', '剑攻击速度'],
  ['Axe Attack Speed', '斧攻击速度'],
  ['Blunt Weapon Attack Speed', '钝器攻击速度'],
  ['Spear Attack Speed', '枪攻击速度'],
  ['Polearm Attack Speed', '矛攻击速度'],
  ['Bow Attack Speed', '弓攻击速度'],
  ['Crossbow Attack Speed', '弩攻击速度'],
  ['Claw Attack Speed', '拳套攻击速度'],
  ['Dagger Attack Speed', '短刀攻击速度'],
  ['Final Attack with sword damage', '剑终极攻击伤害'],
  ['Final Attack with axe damage', '斧终极攻击伤害'],
  ['Final Attack with blunt weapon damage', '钝器终极攻击伤害'],
  ['Final Attack with spear damage', '枪终极攻击伤害'],
  ['Final Attack with polearm damage', '矛终极攻击伤害'],
  ['Final Attack with bow damage', '弓终极攻击伤害'],
  ['Final Attack with crossbow damage', '弩终极攻击伤害'],
  ['Final Attack', '终极攻击'],
  ['Attack Power', '攻击力'],
  ['Attack Speed', '攻击速度'],
  ['Weapon Defense', '物理防御力'],
  ['Weapon Def.', '物理防御力'],
  ['Magic Defense', '魔法防御力'],
  ['Magic Def.', '魔法防御力'],
  ['Magic Attack', '魔法攻击力'],
  ['Accuracy', '命中率'],
  ['Avoidability', '回避率'],
  ['Critical Rate', '暴击率'],
  ['Critical Damage', '暴击伤害'],
  ['Max HP', '最大 HP'],
  ['Max MP', '最大 MP'],
  ['Damage', '伤害'],
  ['Recover HP', '恢复 HP'],
  ['Cooldown', '冷却时间'],
  ['Snail Shell', '蜗牛壳'],
  ['Blue Snail Shell', '蓝蜗牛壳'],
  ['Red Snail Shell', '红蜗牛壳'],
  ['speed', '移动速度'],
  ['Speed', '移动速度'],
  ['Jump', '跳跃力'],
  ['MP Cost', 'MP 消耗'],
];

const DESCRIPTION_TRANSLATIONS = [
  [/Hurls snail shells to attack monsters from long distance\.?/i, '投掷蜗牛壳，从远距离攻击怪物。'],
  [/Enables the user to recover HP constantly for 30 sec\.?/i, '让角色在 30 秒内持续恢复 HP。'],
  [/Enables the character to move around quickly for a short amount of time\.?/i, '让角色在短时间内提高移动速度。'],
  [/HP naturally regenerates over time, not just when standing still\. Also, HP recovery from items and skills is boosted\.?/i, 'HP 会随时间自然恢复，不再只限于站立不动时恢复；同时提升道具和技能带来的 HP 恢复量。'],
  [/Max HP increases\.?/i, '提高最大 HP。'],
  [/Max MP increases\.?/i, '提高最大 MP。'],
  [/Repeated practice with your weapon has increased your Accuracy and Critical Rate\.?/i, '长期练习武器技巧后，提高命中率和暴击率。'],
  [/Temporarily increases your Weapon Defense\.?/i, '暂时提高自身物理防御力。'],
  [/Use MP to deliver a killer blow to a single monster with your weapon\.?/i, '消耗 MP，对单个怪物发动强力一击。'],
  [/Use HP and MP to attack up to (\d+) enemies around you with your weapon\.?/i, '消耗 HP 和 MP，攻击周围最多 $1 个敌人。'],
  [/Temporarily increases the Attack Power of everyone in the party around the area, but also decreases Weapon Def\.?/i, '暂时提高附近队友的攻击力，但会降低物理防御力。'],
];

function normalizeText(value = '') {
  return String(value ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\[Master Level/i.test(line))
    .join(' ')
    .trim();
}

function applyRegexTranslations(text) {
  let next = text;

  for (const [regex, replacement] of DESCRIPTION_TRANSLATIONS) {
    next = next.replace(regex, replacement);
  }

  next = next.replace(/Required Skill\s*:\s*At least Level\s*(\d+)\s*on\s*([^.;]+)/gi, (_, level, skillName) => {
    return `前置技能：${translateSkillText(skillName)} 至少 ${level}级`;
  });

  next = next.replace(/Increases ([A-Za-z ]+?) Mastery and Accuracy\. It only applies when (?:a |an )?(.+?) is equipped\./gi, (_, weaponText, equipText) => {
    return `提高${weaponTextToChinese(weaponText)}熟练度和命中率。只有装备${equipmentTextToChinese(equipText)}时生效。`;
  });

  next = next.replace(/Increases ([A-Za-z ]+?) Mastery, and attacks have a chance to inflict a bleeding effect on the target when attacking\. It only applies when (?:a |an )?(.+?) is equipped\./gi, (_, weaponText, equipText) => {
    return `提高${weaponTextToChinese(weaponText)}熟练度，攻击时有概率让目标进入流血状态。只有装备${equipmentTextToChinese(equipText)}时生效。`;
  });

  next = next.replace(/While the effect is active, using attack skills has a chance to activate Final Attack, dealing heavy damage to up to three enemies\. This skill only activates when (?:a |an )?(.+?) is equipped\. Using the skill activates the effect, and using it again deactivates it\./gi, (_, equipText) => {
    return `效果开启期间，使用攻击技能时有概率触发终极攻击，对最多 3 个敌人造成额外伤害。只有装备${equipmentTextToChinese(equipText)}时生效。再次使用技能可以关闭效果。`;
  });

  next = next.replace(/Uses HP and MP to temporarily increase the Attack Speed of the equipped ([A-Za-z ]+)\. It only applies when (?:a |an )?(.+?) is equipped\./gi, (_, weaponText, equipText) => {
    return `消耗 HP 和 MP，暂时提高已装备${weaponTextToChinese(weaponText)}的攻击速度。只有装备${equipmentTextToChinese(equipText)}时生效。`;
  });

  next = next.replace(/(\d+)% chance to inflict bleed, dealing (\d+)% total damage over (\d+) sec/gi, '$1% 概率造成流血，$3 秒内造成 $2% 总伤害');
  next = next.replace(/(\d+)% success rate, ([^,]+?) (\d+)% to up to (\d+) enemies\.?/gi, '$1% 触发率，$2 $3%，最多攻击 $4 个敌人');
  next = next.replace(/Increases ([^,;]+?) by (\d+) stages for (\d+) sec/gi, '$1 +$2 档，持续 $3 秒');
  next = next.replace(/HP regenerates every (\d+) seconds, and HP recovery from items\/skills is increased by (\d+)%/gi, '每 $1 秒恢复 HP，道具/技能的 HP 恢复量提高 $2%');
  next = next.replace(/Recover HP (\d+) in (\d+) sec\.\s*Cooldown\s*:?\s*(\d+) min\.?/gi, '$2 秒内恢复 HP $1。冷却时间：$3 分钟');
  next = next.replace(/([A-Za-z ]+ Mastery) level (\d+)/gi, (_, mastery, level) => `${replacePhrases(mastery)} ${level}级`);
  next = next.replace(/to up to (\d+) enemies/gi, '最多攻击 $1 个敌人');
  next = next.replace(/for (\d+) sec/gi, '持续 $1 秒');
  next = next.replace(/over (\d+) sec/gi, '持续 $1 秒');
  next = next.replace(/(\d+) sec/gi, '$1 秒');
  next = next.replace(/(\d+) min/gi, '$1 分钟');
  next = next.replace(/;\s*/g, '；');
  next = next.replace(/,\s*/g, '，');
  next = next.replace(/\.\s*/g, '。');

  return replacePhrases(next)
    .replace(/level (\d+)/gi, '$1级')
    .replace(/Level (\d+)/g, '$1级')
    .replace(/stages/g, '档')
    .replace(/stage/g, '档')
    .replace(/success rate/gi, '触发率')
    .replace(/chance/gi, '概率')
    .replace(/total damage/gi, '总伤害')
    .replace(/enemies/gi, '敌人')
    .replace(/enemy/gi, '敌人')
    .replace(/\s+/g, ' ')
    .trim();
}

function replacePhrases(text) {
  let next = String(text ?? '');
  for (const [english, chinese] of PHRASE_REPLACEMENTS) {
    next = next.replace(new RegExp(escapeRegExp(english), 'gi'), chinese);
  }
  return next;
}

function weaponTextToChinese(value = '') {
  const normalized = String(value).toLowerCase().trim();
  return WEAPON_LABELS[normalized] ?? replacePhrases(value).trim();
}

function equipmentTextToChinese(value = '') {
  let text = String(value).toLowerCase().trim();
  text = text.replace(/^a\s+|^an\s+/, '');
  text = text.replace(/one-handed or a two-handed/g, 'one-handed or two-handed');
  text = text.replace(/one-handed or two-handed sword/g, '单手剑或双手剑');
  text = text.replace(/one-handed or two-handed axe/g, '单手斧或双手斧');
  text = text.replace(/one-handed or two-handed blunt weapon/g, '单手钝器或双手钝器');
  text = text.replace(/spear/g, '枪');
  text = text.replace(/polearm/g, '矛');
  text = text.replace(/bow/g, '弓');
  text = text.replace(/crossbow/g, '弩');
  text = text.replace(/claw/g, '拳套');
  text = text.replace(/dagger/g, '短刀');
  return text;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function translateSkillText(value = '') {
  const text = normalizeText(value);
  if (!text) return '';
  return applyRegexTranslations(text);
}

export function translateSkillEffectType(value = '') {
  const text = String(value || '').toLowerCase();
  if (text.includes('attack')) return '主动攻击技能';
  if (text.includes('buff')) return '主动增益技能';
  if (text.includes('passive')) return '被动属性技能';
  return '技能效果';
}
