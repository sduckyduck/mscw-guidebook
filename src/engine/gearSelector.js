const JOB_BITS = { warrior: 1, magician: 2, bowman: 4, thief: 8, pirate: 16 };
const JOB_LABEL = { warrior: 'Warrior', magician: 'Mage', bowman: 'Bowman', thief: 'Thief', pirate: 'Pirate' };

const BRANCH_POLICIES = {
  fighter: { weapons: ['2h sword', '2h axe'], shield: 'never' },
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
  warrior: { weapons: ['2h sword', '2h axe', 'spear', 'pole arm'], shield: 'never' },
  bowman: { weapons: ['bow'], shield: 'never' },
  thief: { weapons: ['dagger', 'claw'], shield: 'auto' },
  pirate: { weapons: ['gun', 'knuckle'], shield: 'never' },
};

const CLASS_POLICIES = {
  warrior: { weapons: ['2h sword', '2h axe', 'spear', 'pole arm'], shield: 'never' },
  magician: { weapons: ['wand', 'staff'], shield: 'oneHandOnly' },
  bowman: { weapons: ['bow', 'crossbow'], shield: 'never' },
  thief: { weapons: ['dagger', 'claw'], shield: 'auto' },
  pirate: { weapons: ['gun', 'knuckle'], shield: 'never' },
};

const BUDGET_GEAR_PROFILES = {
  low: {
    pricePenalty: 3.2,
    classBonus: 30,
    slotLevelLag: { weapon: 12, cap: 13, overall: 14, top: 14, bottom: 14, shoes: 12, shield: 18, glove: 99, cape: 99, earring: 99 },
    minMaxReqLevel: { weapon: 8, cap: 5, overall: 5, top: 5, bottom: 5, shoes: 5, shield: 5 },
    autoSlots: new Set(['weapon', 'cap', 'overall', 'top', 'bottom', 'shoes']),
    note: '低资金：装备明显滞后，优先保留武器、基础防具和鞋子，不主动推荐手套/披风/耳环。',
  },
  mid: {
    pricePenalty: 1.45,
    classBonus: 58,
    slotLevelLag: { weapon: 5, cap: 6, overall: 7, top: 7, bottom: 7, shoes: 7, glove: 10, shield: 8, cape: 16, earring: 16 },
    minMaxReqLevel: { weapon: 10, cap: 8, overall: 8, top: 8, bottom: 8, shoes: 8, glove: 10, shield: 10, cape: 20, earring: 20 },
    autoSlots: new Set(['weapon', 'cap', 'overall', 'top', 'bottom', 'shoes', 'shield']),
    conditionalSlots: { glove: 30, cape: 40, earring: 40 },
    note: '普通：装备会滞后半档，优先核心部位，等级较高后才考虑手套/披风/耳环。',
  },
  high: {
    pricePenalty: 0.25,
    classBonus: 90,
    slotLevelLag: { weapon: -2, cap: -2, overall: -2, top: -2, bottom: -2, shoes: -2, glove: -2, shield: -2, cape: -2, earring: -2 },
    minMaxReqLevel: {},
    autoSlots: new Set(['weapon', 'cap', 'overall', 'top', 'bottom', 'shoes', 'glove', 'shield', 'cape', 'earring']),
    note: '有钱：装备跟等级走，尽量推荐当前等级能穿的最佳部位。',
  },
};

export const SLOT_LABELS = {
  weapon: '武器', cap: '头盔', top: '上衣', overall: '套服', bottom: '裤子',
  shoes: '鞋子', glove: '手套', shield: '盾牌', cape: '披风', earring: '耳环',
};

const BANNED_NAME_PATTERN = /\b(gm|admin|administrator|test|tester|beginner gm|maple admin|event|cash|nx|donor|vip|wedding|birthday|anniversary|invincible|wizet|nemi|inkwell|dr\. lim|lim hat|staff|developer|manager)\b/i;
const BANNED_SLOT_NAMES = /\b(paper box|rice cake|snowboard|surfboard|flag|balloon|rose|bouquet|valentine|chocolate|lollipop|fan|umbrella|tube|swim|marine|sailor|pilot|chef|school|student|uniform|party|festival|costume|transparent|invisible)\b/i;
const BANNED_WEAPON_NAMES = /\b(umbrella|snowboard|surfboard|flag|balloon|rose|bouquet|lollipop|fan|tube|briefcase|purse|shovel|plunger|sake bottle|red whip)\b/i;

export function selectGear({ classLine, branch, level, budget, gender, statPlan, items }) {
  const bySlot = getGearCandidatesBySlot({ classLine, branch, level, budget, gender, statPlan, items });
  const weapon = bySlot.weapon?.[0];
  const policy = getPolicy(classLine, branch);
  const ordered = [
    bySlot.cap?.[0],
    bySlot.overall?.[0] || bySlot.top?.[0],
    bySlot.overall?.[0] ? null : bySlot.bottom?.[0],
    bySlot.shoes?.[0],
    bySlot.glove?.[0],
    bySlot.cape?.[0],
    bySlot.earring?.[0],
    shouldUseShield(policy, branch, weapon) ? bySlot.shield?.[0] : null,
    weapon,
  ].filter(Boolean);
  return ordered.map((item) => toGear(item, classLine));
}

export function getGearCandidatesBySlot({ classLine, branch, level, budget, gender, statPlan, items }) {
  if (!items?.length) return {};
  const policy = getPolicy(classLine, branch);
  const profile = getBudgetGearProfile(budget);
  const candidates = getBaseCandidates({ classLine, branch, level, budget, gender, statPlan, items });
  const sort = (list) => list
    .map((item) => toGear(item, classLine))
    .sort((a, b) => gearScore(b, classLine, budget, level) - gearScore(a, classLine, budget, level));

  const weaponCandidates = candidates.filter((item) => item.slot === 'weapon' && weaponMatchesPolicy(item, policy));
  const classWeapon = weaponCandidates.filter((item) => isClassSpecific(item, classLine));
  const earlyAllJobWeapon = weaponCandidates.filter((item) => isAllJob(item) && Number(item.reqLevel ?? 0) <= maxReqLevelForBudget('weapon', level, profile) && !isBannedWeaponName(item));
  const weapon = classWeapon.length ? classWeapon : earlyAllJobWeapon;

  const output = {
    weapon: sort(weapon),
    cap: sort(slotClassItems(candidates, 'cap', classLine)),
    overall: sort(slotClassItems(candidates, 'overall', classLine)),
    top: sort(slotClassItems(candidates, 'top', classLine)),
    bottom: sort(slotClassItems(candidates, 'bottom', classLine)),
    shoes: sort(slotClassItems(candidates, 'shoes', classLine)),
    glove: sort(slotClassItems(candidates, 'glove', classLine)),
    cape: sort(slotClassItems(candidates, 'cape', classLine)),
    earring: sort(slotClassItems(candidates, 'earring', classLine)),
    shield: sort(candidates.filter((item) => item.slot === 'shield' && (isClassSpecific(item, classLine) || isAllJob(item)))),
  };

  if (!shouldUseShield(policy, branch, output.weapon?.[0])) output.shield = [];
  return output;
}

export function applyGearOverrides(baseGear, overrides = {}) {
  const bySlot = Object.fromEntries((baseGear ?? []).map((item) => [item.slot, item]));
  const explicitSlots = new Set();

  Object.entries(overrides ?? {}).forEach(([slot, item]) => {
    if (item) {
      bySlot[slot] = item;
      explicitSlots.add(slot);
    }
  });

  // Explicit user selections must win over the auto-recommended base outfit.
  // Previously, a recommended overall in baseGear deleted a user-selected top/bottom
  // before the top/bottom override had a chance to remove the overall.
  if (explicitSlots.has('overall')) {
    delete bySlot.top;
    delete bySlot.bottom;
  } else if (explicitSlots.has('top') || explicitSlots.has('bottom')) {
    delete bySlot.overall;
  } else if (bySlot.overall) {
    delete bySlot.top;
    delete bySlot.bottom;
  } else if (bySlot.top || bySlot.bottom) {
    delete bySlot.overall;
  }

  return ['cap', 'overall', 'top', 'bottom', 'shoes', 'glove', 'cape', 'earring', 'shield', 'weapon']
    .map((slot) => bySlot[slot])
    .filter(Boolean);
}

function getBaseCandidates({ classLine, branch, level, budget, gender, statPlan, items }) {
  const policy = getPolicy(classLine, branch);
  const profile = getBudgetGearProfile(budget);
  return items
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => item.slot)
    .filter((item) => budgetAllowsSlot(item.slot, profile, level, policy))
    .filter((item) => Number(item.reqLevel ?? 0) <= maxReqLevelForBudget(item.slot, level, profile))
    .filter((item) => !isBannedOrSpecial(item))
    .filter((item) => Number(item.reqLevel ?? 0) > 0)
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));
}

function slotClassItems(candidates, slot, classLine) {
  return candidates.filter((item) => item.slot === slot && (isClassSpecific(item, classLine) || isAllJob(item)));
}

function getBudgetGearProfile(budget) {
  return BUDGET_GEAR_PROFILES[budget] ?? BUDGET_GEAR_PROFILES.mid;
}

function budgetAllowsSlot(slot, profile, level, policy) {
  if (profile.autoSlots.has(slot)) return true;
  if (profile.conditionalSlots?.[slot] && Number(level) >= profile.conditionalSlots[slot]) return true;
  if (slot === 'shield' && policy.shield === 'required') return true;
  return false;
}

function maxReqLevelForBudget(slot, level, profile) {
  const numericLevel = Number(level) || 1;
  const lag = Number(profile.slotLevelLag?.[slot] ?? 0);
  const minAllowed = Number(profile.minMaxReqLevel?.[slot] ?? 1);
  return Math.max(1, Math.min(numericLevel + 2, Math.max(minAllowed, numericLevel - lag)));
}

function getPolicy(classLine, branch) {
  return BRANCH_POLICIES[branch?.id] ?? BRANCH_POLICIES[classLine?.id] ?? CLASS_POLICIES[classLine?.id] ?? CLASS_POLICIES.warrior;
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
  if (id.startsWith('0103')) return 'earring';
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
  if (Number(item.reqLevel ?? 0) <= 0) return true;
  if (Number(item.price ?? 0) === 1 && !hasAnyStatOrAttack(item)) return true;
  return false;
}

function isBannedWeaponName(item) {
  return BANNED_WEAPON_NAMES.test(String(item.name ?? item.title ?? ''));
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
  const label = String(item.reqJobLabel ?? item.req_job_label ?? '');
  return !reqJob || !label || label === 'All';
}

function isClassSpecific(item, classLine) {
  const reqJob = getReqJob(item);
  const bit = JOB_BITS[classLine.id] ?? 0;
  if (bit && (reqJob & bit)) return true;
  const label = String(item.reqJobLabel ?? item.req_job_label ?? '').toLowerCase();
  return Boolean(label && label !== 'all' && label.includes(String(JOB_LABEL[classLine.id] ?? '').toLowerCase()));
}

function jobMatches(item, classLine) {
  return isAllJob(item) || isClassSpecific(item, classLine);
}

function weaponMatchesPolicy(item, policy) {
  const type = String(item.weaponType ?? item.weapon_type ?? '').toLowerCase();
  return (policy.weapons ?? []).some((word) => type.includes(word));
}

function shouldUseShield(policy, branch, weapon) {
  if (!weapon) return false;
  if (policy.shield === 'never') return false;
  if (policy.shield === 'required') return true;
  const type = String(weapon.weaponType ?? weapon.weapon_type ?? '').toLowerCase();
  if (policy.shield === 'oneHandOnly') return type.includes('wand') || type.includes('1h') || type.includes('dagger');
  if (branch?.id === 'bandit') return type.includes('dagger');
  return false;
}

function gearScore(item, classLine, budget, level) {
  const profile = getBudgetGearProfile(budget);
  const reqLevel = Number(item.reqLevel ?? 0);
  const desiredReqLevel = maxReqLevelForBudget(item.slot, level, profile);
  const attack = classLine.id === 'magician'
    ? Number(item.incMAD ?? 0) * 3 + Number(item.incPAD ?? 0) * 0.25
    : Number(item.incPAD ?? 0) * 3 + Number(item.incMAD ?? 0) * 0.25;
  const primary = Number(item.stats?.[`inc${classLine.primaryStat}`] ?? 0) * 5;
  const secondary = Number(item.stats?.[`inc${classLine.secondaryStat}`] ?? 0) * 2;
  const acc = Number(item.incACC ?? 0) * 2;
  const levelFit = 100 - Math.abs(desiredReqLevel - reqLevel) * 3.8;
  const classBonus = isClassSpecific(item, classLine) ? profile.classBonus : 0;
  const pricePenalty = Math.log10(Math.max(1, Number(item.price ?? 1))) * profile.pricePenalty;
  const overFreshPenalty = Math.max(0, reqLevel - desiredReqLevel) * 8;
  return attack + primary + secondary + acc + levelFit + classBonus - pricePenalty - overFreshPenalty;
}

function toGear(item, classLine) {
  const attack = classLine.id === 'magician'
    ? `魔攻 ${item.incMAD || 0}${item.incPAD ? ` / 攻击 ${item.incPAD}` : ''}`
    : `攻击 ${item.incPAD || 0}${item.incMAD ? ` / 魔攻 ${item.incMAD}` : ''}`;
  return {
    ...item,
    label: SLOT_LABELS[item.slot] ?? '装备',
    title: item.name ?? item.title,
    desc: `${attack} · 需求 ${formatReq(item)}`,
    reqLevel: item.reqLevel,
    thumbnail: item.thumbnail,
    weaponType: item.weapon_type ?? item.weaponType,
    attackSpeed: item.attack_speed_label ?? item.attackSpeed,
    reqJobLabel: item.req_job_label ?? item.reqJobLabel,
    scoreLabel: item.price ? `${Number(item.price).toLocaleString()} meso` : '无价格数据',
  };
}

function formatReq(item) {
  const reqs = [item.reqSTR ? `STR ${item.reqSTR}` : '', item.reqDEX ? `DEX ${item.reqDEX}` : '', item.reqINT ? `INT ${item.reqINT}` : '', item.reqLUK ? `LUK ${item.reqLUK}` : ''].filter(Boolean);
  return reqs.length ? reqs.join(' / ') : '无属性需求';
}
