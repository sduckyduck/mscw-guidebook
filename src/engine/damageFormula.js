const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];
const BASE_CRIT_RATE = 5;
const BASE_CRIT_DAMAGE = 20;

const WEAPON_MULTIPLIERS = [
  { match: /\b(1h|one handed|one-handed)\s+sword\b/, kind: '1h-sword', swing: 1.8, stab: 1.8 },
  { match: /\b(2h|two handed|two-handed)\s+sword\b/, kind: '2h-sword', swing: 2.5, stab: 2.5 },
  { match: /\b(1h|one handed|one-handed)\s+axe\b/, kind: '1h-axe', swing: 2.4, stab: 1.2 },
  { match: /\b(2h|two handed|two-handed)\s+axe\b/, kind: '2h-axe', swing: 3.0, stab: 2.0 },
  { match: /\b(1h|one handed|one-handed)\s+(blunt|mace|bw)\b/, kind: '1h-blunt', swing: 2.4, stab: 1.2 },
  { match: /\b(2h|two handed|two-handed)\s+(blunt|mace|bw)\b/, kind: '2h-blunt', swing: 3.0, stab: 2.0 },
  { match: /\bspear\b/, kind: 'spear', swing: 1.5, stab: 3.5 },
  { match: /\bpole\s*arm\b|\bpolearm\b/, kind: 'polearm', swing: 3.5, stab: 1.5 },
  { match: /\bcrossbow\b/, kind: 'crossbow', swing: 2.5, stab: 2.5 },
  { match: /\bbow\b/, kind: 'bow', swing: 2.5, stab: 2.5 },
  { match: /\bclaw\b/, kind: 'claw', swing: 2.5, stab: 2.5 },
  { match: /\bdagger\b/, kind: 'dagger', swing: 1.0, stab: 2.0 },
];

const MULTI_HIT_SKILLS = new Map([
  ['magic claw', 2],
  ['double shot', 2],
  ['double stab', 2],
  ['lucky seven', 2],
]);

const MAGIC_DAMAGE_SKILLS = new Set([
  'energy bolt',
  'magic claw',
  'fire arrow',
  'poison breath',
  'cold beam',
  'thunder bolt',
  'holy arrow',
]);

const MIXED_ANIMATION_SKILLS = [
  /power strike/i,
  /slash blast/i,
  /final attack/i,
  /steal/i,
];

const STAB_SKILLS = [
  /double stab/i,
  /savage blow/i,
];

const DAMAGE_WORDS = /\b(damage\s+\d+(?:\.\d+)?%?|basic attack\s+\d+|attack\s+\d+x\s+with\s+\d+(?:\.\d+)?%\s+damage)\b/i;

function lower(value) {
  return String(value ?? '').toLowerCase();
}

function normalized(value) {
  return lower(value).replace(/[^a-z0-9]+/g, ' ').trim();
}

function readNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function readGearValue(item, aliases) {
  for (const key of aliases) {
    const value = item?.[key] ?? item?.stats?.[key];
    if (value !== undefined && value !== null && value !== '') return readNumber(value);
  }
  return 0;
}

export function getGearBonuses(gear = []) {
  return (gear ?? []).reduce((sum, item) => {
    sum.STR += readGearValue(item, ['incSTR', 'str']);
    sum.DEX += readGearValue(item, ['incDEX', 'dex']);
    sum.INT += readGearValue(item, ['incINT', 'int']);
    sum.LUK += readGearValue(item, ['incLUK', 'luk']);
    sum.HP += readGearValue(item, ['incMHP', 'incMaxHP', 'incHP', 'mhp', 'hp']);
    sum.MP += readGearValue(item, ['incMMP', 'incMaxMP', 'incMP', 'mmp', 'mp']);
    sum.ACC += readGearValue(item, ['incACC', 'accuracy', 'acc']);
    sum.AVOID += readGearValue(item, ['incEVA', 'incAVOID', 'incAvoid', 'avoidability', 'eva']);
    sum.PDD += readGearValue(item, ['incPDD', 'pdd', 'wdef', 'defense']);
    sum.MDD += readGearValue(item, ['incMDD', 'mdd', 'magicDefense']);
    sum.WATK += readGearValue(item, ['incPAD', 'pad', 'watk', 'attack']);
    sum.MATK += readGearValue(item, ['incMAD', 'mad', 'matk', 'magicAttack']);
    if (isWeapon(item)) {
      sum.weaponAttack += readGearValue(item, ['incPAD', 'pad', 'watk', 'attack']);
      sum.weaponMagic += readGearValue(item, ['incMAD', 'mad', 'matk', 'magicAttack']);
    } else {
      sum.flatAttackPower += readGearValue(item, ['incPAD', 'pad', 'watk', 'attack']);
      sum.flatMagicAttack += readGearValue(item, ['incMAD', 'mad', 'matk', 'magicAttack']);
    }
    return sum;
  }, {
    STR: 0, DEX: 0, INT: 0, LUK: 0, HP: 0, MP: 0, ACC: 0, AVOID: 0,
    PDD: 0, MDD: 0, WATK: 0, MATK: 0, weaponAttack: 0, weaponMagic: 0,
    flatAttackPower: 0, flatMagicAttack: 0,
  });
}

function isWeapon(item) {
  const slot = lower(item?.slot ?? item?.sub_category ?? item?.subCategory);
  return slot === 'weapon' || slot.includes('weapon') || Boolean(item?.weaponType ?? item?.weapon_type);
}

function getEquippedWeapon(gear = []) {
  return gear.find((item) => isWeapon(item)) ?? null;
}

function totalStats(statPlan, gearBonuses) {
  const stats = statPlan?.stats ?? {};
  return Object.fromEntries(STAT_KEYS.map((key) => [key, readNumber(stats[key]) + readNumber(gearBonuses[key])]));
}

function getSkillEffect(skill) {
  if (skill?.currentEffect) return String(skill.currentEffect);
  const level = Math.max(0, Math.floor(readNumber(skill?.level)));
  const rows = skill?.allLevelStats ?? skill?.all_level_stats ?? [];
  return String(rows[Math.max(0, level - 1)] ?? skill?.role ?? skill?.description ?? '');
}

function getMpCost(effect) {
  const match = String(effect).match(/\bMP\s*-?(\d+)/i);
  return match ? readNumber(match[1]) : 0;
}

function getWeaponProfile(weapon) {
  const text = lower(`${weapon?.weaponType ?? weapon?.weapon_type ?? ''} ${weapon?.title ?? weapon?.name ?? ''}`);
  return WEAPON_MULTIPLIERS.find((profile) => profile.match.test(text))
    ?? { kind: 'generic', swing: 2.0, stab: 2.0 };
}

function getSkillAnimation(skillName) {
  if (STAB_SKILLS.some((pattern) => pattern.test(skillName))) return 'stab';
  if (MIXED_ANIMATION_SKILLS.some((pattern) => pattern.test(skillName))) return 'mixed';
  return 'swing';
}

function getEffectiveMultiplier(weaponProfile, animation) {
  if (animation === 'mixed') return weaponProfile.swing * 0.6 + weaponProfile.stab * 0.4;
  if (animation === 'stab') return weaponProfile.stab;
  return weaponProfile.swing;
}

function getMasterySkillPattern(weaponKind) {
  if (weaponKind.includes('sword')) return /sword mastery/i;
  if (weaponKind.includes('axe')) return /axe mastery/i;
  if (weaponKind.includes('blunt')) return /blunt weapon mastery/i;
  if (weaponKind === 'spear') return /spear mastery/i;
  if (weaponKind === 'polearm') return /polearm mastery/i;
  if (weaponKind === 'bow') return /bow mastery/i;
  if (weaponKind === 'crossbow') return /crossbow mastery/i;
  if (weaponKind === 'claw') return /claw mastery/i;
  if (weaponKind === 'dagger') return /dagger mastery/i;
  return null;
}

function getPhysicalMasteryLevel(skills = [], weaponKind = '') {
  const pattern = getMasterySkillPattern(weaponKind);
  if (!pattern) return 0;
  const row = (skills ?? []).find((skill) => readNumber(skill?.level) > 0 && pattern.test(String(skill?.name ?? '')));
  if (!row) return 0;
  const effect = getSkillEffect(row);
  const explicit = effect.match(/mastery level\s+(\d+)/i)?.[1];
  if (explicit) return Math.min(10, readNumber(explicit));
  return Math.min(10, Math.max(1, Math.floor(readNumber(row.level) / 2)));
}

function getSkillAttackPower(skills = [], weaponKind = '') {
  const masteryPattern = getMasterySkillPattern(weaponKind);
  return (skills ?? []).reduce((sum, skill) => {
    if (readNumber(skill?.level) <= 0) return sum;
    const name = String(skill?.name ?? '');
    const isRelevantAttackBuff = /rage/i.test(name)
      || (/claw mastery/i.test(name) && weaponKind === 'claw')
      || (/blunt weapon mastery/i.test(name) && weaponKind.includes('blunt'))
      || (masteryPattern?.test(name) && /attack power/i.test(getSkillEffect(skill)));
    if (!isRelevantAttackBuff) return sum;
    const value = getSkillEffect(skill).match(/attack power\s*\+(\d+)/i)?.[1];
    return sum + readNumber(value);
  }, 0);
}

function getMagicAttackBuff(skills = []) {
  return (skills ?? []).reduce((sum, skill) => {
    if (readNumber(skill?.level) <= 0) return sum;
    const value = getSkillEffect(skill).match(/magic attack\s*\+(\d+)/i)?.[1];
    return sum + readNumber(value);
  }, 0);
}

function masteryFactor(level) {
  return (0.1 + readNumber(level) / 10) * 0.8;
}

function parseSkillProfile(skill) {
  const effect = getSkillEffect(skill);
  const name = String(skill?.name ?? '');
  const normalizedName = normalized(name);
  const multi = effect.match(/attack\s+(\d+)x\s+with\s+(\d+(?:\.\d+)?)%\s+damage/i);
  const percent = effect.match(/\bdamage\s+(\d+(?:\.\d+)?)%/i);
  const basicAttack = effect.match(/\bbasic attack\s+(\d+(?:\.\d+)?)/i)?.[1];
  const mastery = effect.match(/\bmastery level\s+(\d+)/i)?.[1];
  const hits = multi ? readNumber(multi[1]) : (MULTI_HIT_SKILLS.get(normalizedName) ?? 1);

  if (basicAttack !== undefined && (MAGIC_DAMAGE_SKILLS.has(normalizedName) || /basic attack/i.test(effect))) {
    return {
      kind: 'magic',
      basicAttack: readNumber(basicAttack),
      masteryLevel: readNumber(mastery),
      hits,
      effect,
      mpCost: getMpCost(effect),
    };
  }

  if (multi || percent) {
    return {
      kind: 'physical',
      skillPercent: readNumber(multi?.[2] ?? percent?.[1]) / 100,
      hits,
      effect,
      mpCost: getMpCost(effect),
    };
  }

  return null;
}

export function isDamageSkill(skill) {
  if (!skill || readNumber(skill.level) <= 0) return false;
  return DAMAGE_WORDS.test(getSkillEffect(skill));
}

export function getCombatDamageStat({ classLine, statPlan, gear = [], skills = [] }) {
  const gearBonuses = getGearBonuses(gear);
  const stats = totalStats(statPlan, gearBonuses);
  if (classLine?.id === 'magician') {
    return Math.max(1, Math.floor(readNumber(stats.INT) / 2) + gearBonuses.MATK + readNumber(statPlan?.derived?.magicAttackBonus) + getMagicAttackBuff(skills));
  }
  return Math.max(1, gearBonuses.weaponAttack || gearBonuses.WATK);
}

function calculateMagicDamage({ classLine, statPlan, gear, skills, skill, profile }) {
  const gearBonuses = getGearBonuses(gear);
  const stats = totalStats(statPlan, gearBonuses);
  const magic = getCombatDamageStat({ classLine, statPlan, gear, skills });
  const intValue = readNumber(stats.INT);
  const base = profile.basicAttack + magic / 7;
  const max = Math.round(base * (((magic * 2 + intValue) / 100) + 1));
  const min = Math.round(base * (((magic * 2 * masteryFactor(profile.masteryLevel) + intValue) / 100) + 1));
  return makeDamageResult({ min, max, hits: profile.hits, skill, profile, source: 'magic', masteryLevel: profile.masteryLevel });
}

function calculatePhysicalDamage({ classLine, statPlan, gear, skills, skill, profile }) {
  const gearBonuses = getGearBonuses(gear);
  const stats = totalStats(statPlan, gearBonuses);
  const weapon = getEquippedWeapon(gear);
  const weaponProfile = getWeaponProfile(weapon);
  const skillName = String(skill?.name ?? '');
  const isLuckySeven = /lucky seven/i.test(skillName);
  const animation = getSkillAnimation(skillName);
  const weaponMultiplier = isLuckySeven ? 3.0 : getEffectiveMultiplier(weaponProfile, animation);
  const masteryLevel = isLuckySeven ? 5 : getPhysicalMasteryLevel(skills, weaponProfile.kind);
  const minMastery = isLuckySeven ? 0.5 : masteryFactor(masteryLevel);
  const primary = readNumber(stats[classLine?.primaryStat]);
  const secondary = readNumber(stats[classLine?.secondaryStat]);
  const weaponAttack = Math.max(1, gearBonuses.weaponAttack || gearBonuses.WATK);
  const attackPower = gearBonuses.flatAttackPower + readNumber(statPlan?.derived?.weaponAttackBonus) + getSkillAttackPower(skills, weaponProfile.kind);
  const skillPercent = profile.skillPercent || 1;
  const max = Math.round((1.0 + ((primary * weaponMultiplier + secondary + attackPower) / 100)) * weaponAttack * skillPercent);
  const min = Math.round((0.8 + ((primary * weaponMultiplier * minMastery + secondary + attackPower) / 100)) * weaponAttack * skillPercent);
  return makeDamageResult({ min, max, hits: profile.hits, skill, profile, source: 'physical', masteryLevel, weaponMultiplier, attackPower });
}

function makeDamageResult({ min, max, hits, skill, profile, source, ...extra }) {
  const safeHits = Math.max(1, Math.floor(readNumber(hits) || 1));
  const perHitMin = Math.max(1, Math.round(min));
  const perHitMax = Math.max(perHitMin, Math.round(max));
  const totalMin = perHitMin * safeHits;
  const totalMax = perHitMax * safeHits;
  const displayRange = safeHits > 1 ? `${perHitMin}-${perHitMax}/hit` : `${perHitMin}-${perHitMax}`;
  const avg = (totalMin + totalMax) / 2;
  const critRate = BASE_CRIT_RATE + readNumber(extra.criticalRateBonus);
  const critDamage = BASE_CRIT_DAMAGE + readNumber(extra.criticalDamageBonus);

  return {
    name: skill?.name,
    role: profile.effect || skill?.description || skill?.tierLabel,
    level: readNumber(skill?.level),
    maxLevel: readNumber(skill?.max ?? skill?.maxLevel),
    iconKey: skill?.iconKey ?? skill?.thumbnail,
    source,
    min: totalMin,
    max: totalMax,
    perHitMin,
    perHitMax,
    avg,
    avgWithCrit: avg * (1 + (critRate * critDamage) / 10000),
    hits: safeHits,
    displayRange,
    totalDisplayRange: `${totalMin}-${totalMax}`,
    mpCost: profile.mpCost,
    ...extra,
  };
}

export function calculateSkillDamage(args = {}) {
  const profile = parseSkillProfile(args.skill);
  if (!profile) return null;
  if (profile.kind === 'magic' || args.classLine?.id === 'magician') {
    if (profile.kind !== 'magic') return null;
    return calculateMagicDamage({ ...args, profile });
  }
  return calculatePhysicalDamage({ ...args, profile });
}

export function calculateBaseAttackDamage({ classLine, statPlan, gear = [], skills = [] }) {
  if (classLine?.id === 'magician') return null;
  const baseSkill = { name: 'Base Attack', level: 1, max: 1 };
  const profile = { kind: 'physical', skillPercent: 1, hits: 1, effect: 'Basic attack', mpCost: 0 };
  return {
    ...calculatePhysicalDamage({ classLine, statPlan, gear, skills, skill: baseSkill, profile }),
    isBase: true,
  };
}

export function buildDamageCards({ classLine, statPlan, gear = [], skills = [], limit = 6, damageSkillNames = null }) {
  const allowedNames = damageSkillNames ? new Set(damageSkillNames) : null;
  const cards = (skills ?? [])
    .filter((skill) => (!allowedNames || allowedNames.has(skill.name)) && isDamageSkill(skill))
    .map((skill) => calculateSkillDamage({ classLine, statPlan, gear, skills, skill }))
    .filter(Boolean)
    .sort((a, b) => b.max - a.max)
    .slice(0, limit);
  const base = calculateBaseAttackDamage({ classLine, statPlan, gear, skills });
  return [base, ...cards].filter(Boolean);
}
