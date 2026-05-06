const JOB_BITS = { warrior: 1, magician: 2, bowman: 4, thief: 8, pirate: 16 };
const JOB_LABEL = { warrior: 'Warrior', magician: 'Mage', bowman: 'Bowman', thief: 'Thief', pirate: 'Pirate' };

const BRANCH_WEAPON_WORDS = {
  fighter: ['1h sword', '2h sword', '1h axe', '2h axe'],
  page: ['1h sword', '2h sword', '1h blunt', '2h blunt'],
  spearman: ['spear', 'pole arm'],
  magician: ['wand', 'staff'],
  fp: ['wand', 'staff'],
  il: ['wand', 'staff'],
  cleric: ['wand', 'staff'],
  hunter: ['bow'],
  crossbowman: ['crossbow'],
  assassin: ['claw'],
  bandit: ['dagger'],
  warrior: ['sword', 'axe', 'blunt', 'spear', 'pole arm'],
  bowman: ['bow', 'crossbow'],
  thief: ['claw', 'dagger'],
};

const CLASS_WEAPON_WORDS = {
  warrior: ['sword', 'axe', 'blunt', 'spear', 'pole arm'],
  magician: ['wand', 'staff'],
  bowman: ['bow', 'crossbow'],
  thief: ['claw', 'dagger'],
  pirate: ['gun', 'knuckle'],
};

const SLOT_LABEL = {
  cap: '帽子', overall: '套服', top: '上衣', bottom: '裤子', shoes: '鞋子',
  glove: '手套', shield: '盾牌', cape: '披风', weapon: '武器',
};

const BANNED_NAME_PATTERN = /\b(gm|admin|administrator|test|tester|beginner gm|maple admin|event|cash|nx|donor|vip|wedding|birthday|anniversary)\b/i;
const BANNED_SLOT_NAMES = /\b(paper box|rice cake|snowboard|surfboard|flag|balloon|rose|bouquet|valentine|chocolate|lollipop|fan|umbrella|tube|swim|marine|sailor|pilot|chef|school|student|uniform|party|festival|costume)\b/i;

export function selectGear({ classLine, branch, level, budget, gender, statPlan, items }) {
  if (!items?.length) {
    return [{ label: '武器', title: classLine.weaponTypes?.[0] ?? '职业武器', desc: `Lv.${level} 过渡`, slot: 'weapon' }];
  }

  const candidates = items
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => item.slot)
    .filter((item) => !isBannedOrSpecial(item))
    .filter((item) => Number(item.reqLevel ?? 0) <= level + 2)
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));

  const weapon = pickBestStrict(
    candidates.filter((item) => item.slot === 'weapon' && weaponMatches(item, classLine, branch)),
    classLine,
    budget,
    level,
    { allowFallbackAllJob: true },
  );

  const cap = pickClassGear(candidates, 'cap', classLine, budget, level);
  const overall = pickClassGear(candidates, 'overall', classLine, budget, level);
  const top = pickClassGear(candidates, 'top', classLine, budget, level);
  const bottom = pickClassGear(candidates, 'bottom', classLine, budget, level);
  const shoes = pickClassGear(candidates, 'shoes', classLine, budget, level);
  const glove = pickClassGear(candidates, 'glove', classLine, budget, level);
  const shield = pickClassGear(candidates, 'shield', classLine, budget, level);
  const cape = pickClassGear(candidates, 'cape', classLine, budget, level);

  const ordered = [
    cap,
    overall || top,
    overall ? null : bottom,
    shoes,
    glove,
    cape,
    shouldUseShield(classLine, branch, weapon) ? shield : null,
    weapon,
  ].filter(Boolean);

  return ordered.map((item) => toGear(item, classLine));
}

function pickClassGear(candidates, slot, classLine, budget, level) {
  const slotItems = candidates.filter((item) => item.slot === slot);
  return pickBestStrict(slotItems, classLine, budget, level, { allowFallbackAllJob: false });
}

function pickBestStrict(list, classLine, budget, level, { allowFallbackAllJob = false } = {}) {
  const classOnly = list.filter((item) => isClassSpecific(item, classLine));
  if (classOnly.length) return pickBest(classOnly, classLine, budget, level);
  if (allowFallbackAllJob) return pickBest(list.filter((item) => isAllJob(item)), classLine, budget, level);
  return undefined;
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
  if (item.slot !== 'weapon' && BANNED_SLOT_NAMES.test(text)) return true;
  if (Number(item.reqLevel ?? 0) >= 200) return true;
  if (Number(item.price ?? 0) === 1 && !hasAnyStatOrAttack(item)) return true;
  return false;
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

function weaponMatches(item, classLine, branch) {
  const type = String(item.weapon_type ?? '').toLowerCase();
  const exact = BRANCH_WEAPON_WORDS[branch?.id] ?? CLASS_WEAPON_WORDS[classLine.id] ?? [];
  return exact.some((word) => type.includes(word));
}

function shouldUseShield(classLine, branch, weapon) {
  if (!weapon) return false;
  const type = String(weapon.weapon_type ?? '').toLowerCase();
  if (type.includes('2h') || type.includes('spear') || type.includes('pole') || type.includes('bow') || type.includes('claw') || type.includes('gun') || type.includes('knuckle')) return false;
  return classLine.id === 'warrior' || classLine.id === 'magician' || branch?.id === 'bandit';
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
  const reqs = [item.reqSTR ? `STR ${item.reqSTR}` : '', item.reqDEX ? `DEX ${item.reqDEX}` : '', item.reqINT ? `INT ${item.reqINT}` : '', item.reqLUK ? `LUK ${item.reqLUK}` : ''].filter(Boolean);
  return reqs.length ? reqs.join(' / ') : '无属性需求';
}
