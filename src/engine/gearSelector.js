const JOB_BITS = { warrior: 1, magician: 2, bowman: 4, thief: 8, pirate: 16 };
const JOB_LABEL = { warrior: 'Warrior', magician: 'Mage', bowman: 'Bowman', thief: 'Thief', pirate: 'Pirate' };

const BRANCH_POLICIES = {
  fighter: { weapons: ['1h sword', '1h axe'], shield: 'required' },
  page: { weapons: ['1h sword', '1h blunt weapon'], shield: 'required' },
  spearman: { weapons: ['spear', 'pole arm'], shield: 'never' },
  magician: { weapons: ['wand', 'staff'], shield: 'oneHandOnly' },
  fp: { weapons: ['wand', 'staff'], shield: 'oneHandOnly' },
  il: { weapons: ['wand', 'staff'], shield: 'oneHandOnly' },
  cleric: { weapons: ['wand', 'staff'], shield: 'oneHandOnly' },
  hunter: { weapons: ['bow'], shield: 'never' },
  crossbowman: { weapons: ['crossbow'], shield: 'never' },
  assassin: { weapons: ['claw'], shield: 'never' },
  bandit: { weapons: ['dagger'], shield: 'required' },
  brawler: { weapons: ['knuckle'], shield: 'never' },
  gunslinger: { weapons: ['gun'], shield: 'never' },
  warrior: { weapons: ['1h sword', '1h axe', '1h blunt weapon'], shield: 'required' },
  bowman: { weapons: ['bow'], shield: 'never' },
  thief: { weapons: ['dagger', 'claw'], shield: 'auto' },
  pirate: { weapons: ['gun', 'knuckle'], shield: 'never' },
};

const CLASS_POLICIES = {
  warrior: { weapons: ['1h sword', '1h axe', '1h blunt weapon'], shield: 'required' },
  magician: { weapons: ['wand', 'staff'], shield: 'oneHandOnly' },
  bowman: { weapons: ['bow', 'crossbow'], shield: 'never' },
  thief: { weapons: ['dagger', 'claw'], shield: 'auto' },
  pirate: { weapons: ['gun', 'knuckle'], shield: 'never' },
};

const SLOT_LABEL = {
  cap: '帽子',
  overall: '套服',
  top: '上衣',
  bottom: '裤子',
  shoes: '鞋子',
  glove: '手套',
  shield: '盾牌',
  cape: '披风',
  weapon: '武器',
};

const BANNED_NAME_PATTERN = /\b(gm|admin|administrator|test|tester|beginner gm|maple admin|event|cash|nx|donor|vip|wedding|birthday|anniversary)\b/i;
const BANNED_SLOT_NAMES = /\b(paper box|rice cake|snowboard|surfboard|flag|balloon|rose|bouquet|valentine|chocolate|lollipop|fan|umbrella|tube|swim|marine|sailor|pilot|chef|school|student|uniform|party|festival|costume)\b/i;
const BANNED_WEAPON_NAMES = /\b(umbrella|snowboard|surfboard|flag|balloon|rose|bouquet|lollipop|fan|tube|briefcase|purse|shovel|plunger|sake bottle|red whip)\b/i;

export function selectGear({ classLine, branch, level, budget, gender, statPlan, items }) {
  if (!items?.length) {
    return [{ label: '武器', title: classLine.weaponTypes?.[0] ?? '职业武器', desc: `Lv.${level} 过渡`, slot: 'weapon' }];
  }

  const policy = getPolicy(classLine, branch);
  const candidates = items
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => item.slot)
    .filter((item) => !isBannedOrSpecial(item))
    .filter((item) => Number(item.reqLevel ?? 0) <= level + 2)
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));

  const weapon = pickWeapon(candidates, classLine, branch, policy, budget, level);
  const cap = pickClassGear(candidates, 'cap', classLine, budget, level);
  const overall = pickClassGear(candidates, 'overall', classLine, budget, level);
  const top = pickClassGear(candidates, 'top', classLine, budget, level);
  const bottom = pickClassGear(candidates, 'bottom', classLine, budget, level);
  const shoes = pickClassGear(candidates, 'shoes', classLine, budget, level);
  const glove = pickClassGear(candidates, 'glove', classLine, budget, level);
  const cape = pickClassGear(candidates, 'cape', classLine, budget, level);
  const shield = shouldUseShield(policy, branch, weapon)
    ? pickShield(candidates, classLine, budget, level)
    : undefined;

  const ordered = [cap, overall || top, overall ? null : bottom, shoes, glove, cape, shield, weapon].filter(Boolean);
  return ordered.map((item) => toGear(item, classLine));
}

function getPolicy(classLine, branch) {
  return BRANCH_POLICIES[branch?.id] ?? BRANCH_POLICIES[classLine?.id] ?? CLASS_POLICIES[classLine?.id] ?? CLASS_POLICIES.warrior;
}

function pickWeapon(candidates, classLine, branch, policy, budget, level) {
  const weaponCandidates = candidates.filter((item) => item.slot === 'weapon' && weaponMatchesPolicy(item, policy));
  const classSpecific = weaponCandidates.filter((item) => isClassSpecific(item, classLine));
  if (classSpecific.length) return pickBest(classSpecific, classLine, budget, level);

  const earlyLevelAllJob = weaponCandidates.filter((item) => isAllJob(item) && Number(item.reqLevel ?? 0) <= 12 && !isBannedWeaponName(item));
  if (earlyLevelAllJob.length) return pickBest(earlyLevelAllJob, classLine, budget, level);

  const classPolicy = CLASS_POLICIES[classLine?.id] ?? policy;
  const fallbackClassSpecific = candidates.filter((item) => item.slot === 'weapon' && weaponMatchesPolicy(item, classPolicy) && isClassSpecific(item, classLine));
  return pickBest(fallbackClassSpecific, classLine, budget, level);
}

function pickClassGear(candidates, slot, classLine, budget, level) {
  const slotItems = candidates.filter((item) => item.slot === slot && isClassSpecific(item, classLine));
  return pickBest(slotItems, classLine, budget, level);
}

function pickShield(candidates, classLine, budget, level) {
  const shields = candidates.filter((item) => item.slot === 'shield');
  const classSpecific = shields.filter((item) => isClassSpecific(item, classLine));
  if (classSpecific.length) return pickBest(classSpecific, classLine, budget, level);

  const allJobNormal = shields.filter((item) => isAllJob(item) && !isBannedOrSpecial(item));
  return pickBest(allJobNormal, classLine, budget, level);
}

function pickBest(list, classLine, budget, level) {
  return [...list].sort((a, b) => gearScore(b, classLine, budget, level) - gearScore(a, classLine, budget, level))[0];
}

function detectSlot(item) {
  const id = String(item.id ?? '').padStart(8, '0');
  if (item.sub_category === 'Weapon') return 'weapon';
  if (id.startsWith('0100')) return 'cap';
  if (id.startsWith('0104')) return 'top';
  if (id.startsWith('0105')) return 'overall';
  if (id.startsWith('0106')) return 'bottom';
  if (id.startsWith('0107')) return 'shoes';
  if (id.startsWith('0108')) return 'glove';
  if (id.startsWith('0109')) return 'shield';
  if (id.startsWith('0110')) return 'cape';
  return null;
}

function detectVisualGender(item) {
  const id = String(item.id ?? '').padStart(8, '0');
  if (/^010[456][01]/.test(id)) return id[4] === '1' ? 'female' : 'male';
  return 'unisex';
}

function isBannedOrSpecial(item) {
  const name = String(item.name ?? item.title ?? '');
  const description = String(item.description ?? '');
  const text = `${name} ${description}`;
  if (BANNED_NAME_PATTERN.test(text)) return true;
  if (item.slot === 'weapon' && isBannedWeaponName(item)) return true;
  if (item.slot !== 'weapon' && BANNED_SLOT_NAMES.test(text)) return true;
  if (Number(item.reqLevel ?? 0) >= 200) return true;
  if (Number(item.price ?? 0) === 1 && !hasAnyStatOrAttack(item)) return true;
  return false;
}

function isBannedWeaponName(item) {
  const name = String(item.name ?? item.title ?? '');
  return BANNED_WEAPON_NAMES.test(name);
}

function hasAnyStatOrAttack(item) {
  return ['incSTR', 'incDEX', 'incINT', 'incLUK', 'incPAD', 'incMAD', 'incACC', 'incSpeed', 'incJump']
    .some((key) => Number(item[key] ?? item.stats?.[key] ?? 0) !== 0);
}

function genderMatches(item, gender) {
  return item.visualGender === 'unisex' || item.visualGender === gender;
}

function statRequirementsMet(item, statPlan) {
  const stats = statPlan.stats ?? {};
  return Number(item.reqSTR ?? 0) <= Number(stats.STR ?? 0)
    && Number(item.reqDEX ?? 0) <= Number(stats.DEX ?? 0)
    && Number(item.reqINT ?? 0) <= Number(stats.INT ?? 0)
    && Number(item.reqLUK ?? 0) <= Number(stats.LUK ?? 0);
}

function getReqJob(item) {
  return Number(item.reqJob ?? item.stats?.reqJob ?? 0);
}

function isAllJob(item) {
  const reqJob = getReqJob(item);
  const label = String(item.req_job_label ?? '');
  return !reqJob || !label || label === 'All';
}

function isClassSpecific(item, classLine) {
  const reqJob = getReqJob(item);
  const bit = JOB_BITS[classLine.id] ?? 0;
  if (bit && (reqJob & bit)) return true;
  const label = String(item.req_job_label ?? '').toLowerCase();
  return Boolean(label && label !== 'all' && label.includes(String(JOB_LABEL[classLine.id] ?? '').toLowerCase()));
}

function jobMatches(item, classLine) {
  return isAllJob(item) || isClassSpecific(item, classLine);
}

function weaponMatchesPolicy(item, policy) {
  const type = String(item.weapon_type ?? '').toLowerCase();
  return (policy.weapons ?? []).some((word) => type.includes(word));
}

function shouldUseShield(policy, branch, weapon) {
  if (!weapon) return false;
  if (policy.shield === 'never') return false;
  if (policy.shield === 'required') return true;
  const type = String(weapon.weapon_type ?? '').toLowerCase();
  if (policy.shield === 'oneHandOnly') return type.includes('wand') || type.includes('1h') || type.includes('dagger');
  if (branch?.id === 'bandit') return type.includes('dagger');
  return false;
}

function gearScore(item, classLine, budget, level) {
  const attack = classLine.id === 'magician'
    ? Number(item.incMAD ?? 0) * 3 + Number(item.incPAD ?? 0) * 0.25
    : Number(item.incPAD ?? 0) * 3 + Number(item.incMAD ?? 0) * 0.25;
  const primary = Number(item.stats?.[`inc${classLine.primaryStat}`] ?? 0) * 5;
  const secondary = Number(item.stats?.[`inc${classLine.secondaryStat}`] ?? 0) * 2;
  const acc = Number(item.incACC ?? 0) * 2;
  const levelFit = 100 - Math.abs(level - Number(item.reqLevel ?? 0)) * 3;
  const classBonus = isClassSpecific(item, classLine) ? 80 : 0;
  const pricePenalty = budget === 'low' ? Math.log10(Math.max(1, Number(item.price ?? 1))) * 1.5 : 0;
  return attack + primary + secondary + acc + levelFit + classBonus - pricePenalty;
}

function toGear(item, classLine) {
  const attack = classLine.id === 'magician'
    ? `魔攻 ${item.incMAD || 0}${item.incPAD ? ` / 攻击 ${item.incPAD}` : ''}`
    : `攻击 ${item.incPAD || 0}${item.incMAD ? ` / 魔攻 ${item.incMAD}` : ''}`;
  return {
    ...item,
    label: SLOT_LABEL[item.slot] ?? '装备',
    title: item.name,
    desc: `${attack} · 需求 ${formatReq(item)}`,
    reqLevel: item.reqLevel,
    thumbnail: item.thumbnail,
    weaponType: item.weapon_type,
    attackSpeed: item.attack_speed_label,
    reqJobLabel: item.req_job_label,
    scoreLabel: item.price ? `${Number(item.price).toLocaleString()} meso` : '无价格数据',
  };
}

function formatReq(item) {
  const reqs = [
    item.reqSTR ? `STR ${item.reqSTR}` : '',
    item.reqDEX ? `DEX ${item.reqDEX}` : '',
    item.reqINT ? `INT ${item.reqINT}` : '',
    item.reqLUK ? `LUK ${item.reqLUK}` : '',
  ].filter(Boolean);
  return reqs.length ? reqs.join(' / ') : '无属性需求';
}
