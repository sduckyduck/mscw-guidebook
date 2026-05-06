const JOB_BITS = { warrior: 1, magician: 2, bowman: 4, thief: 8, pirate: 16 };
const JOB_LABEL = { warrior: 'Warrior', magician: 'Mage', bowman: 'Bowman', thief: 'Thief', pirate: 'Pirate' };

const BRANCH_POLICIES = {
  fighter: { weapons: ['2h sword', '2h axe', '1h sword'], shield: 'never' },
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
  warrior: { weapons: ['1h sword', '2h sword', '2h axe', 'spear', 'pole arm'], shield: 'never' },
  bowman: { weapons: ['bow'], shield: 'never' },
  thief: { weapons: ['dagger', 'claw'], shield: 'auto' },
  pirate: { weapons: ['gun', 'knuckle'], shield: 'never' },
};

const CLASS_POLICIES = {
  warrior: { weapons: ['1h sword', '2h sword', '2h axe', 'spear', 'pole arm'], shield: 'never' },
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
    autoSlots: new Set(['weapon', 'cap', 'top', 'bottom', 'shoes']),
    note: '低资金：Lv.15 前保持新手装和一转赠送武器；之后装备明显滞后，只推荐核心部位。',
  },
  mid: {
    pricePenalty: 1.45,
    classBonus: 58,
    slotLevelLag: { weapon: 5, cap: 6, overall: 7, top: 7, bottom: 7, shoes: 7, glove: 10, shield: 8, cape: 16, earring: 16 },
    minMaxReqLevel: { weapon: 10, cap: 8, overall: 8, top: 8, bottom: 8, shoes: 8, glove: 10, shield: 10, cape: 20, earring: 20 },
    autoSlots: new Set(['weapon', 'cap', 'overall', 'top', 'bottom', 'shoes', 'shield']),
    conditionalSlots: { glove: 30, cape: 40, earring: 40 },
    note: '普通：装备会滞后半档，优先核心部位。',
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

const ALL_SLOTS = ['weapon', 'cap', 'overall', 'top', 'bottom', 'shoes', 'glove', 'shield', 'cape', 'earring'];
const LOW_BUDGET_STARTER_ORDER = ['cap', 'top', 'bottom', 'shoes', 'weapon'];
const CORE_EARLY_SLOTS = new Set(['weapon', 'cap', 'top', 'bottom', 'shoes']);
const EARLY_GEAR_LEVEL_CUTOFF = 20;
const LOW_BUDGET_STARTER_CUTOFF = 15;
const STARTER_REQ_LEVEL_MAX = 10;
const BANNED_NAME_PATTERN = /\b(gm|admin|administrator|test|tester|beginner gm|maple admin|event|cash|nx|donor|vip|wedding|birthday|anniversary|invincible|wizet|nemi|inkwell|dr\. lim|lim hat|staff|developer|manager)\b/i;
const BANNED_SLOT_NAMES = /\b(paper box|rice cake|snowboard|surfboard|flag|balloon|rose|bouquet|valentine|chocolate|lollipop|fan|umbrella|tube|swim|marine|sailor|pilot|chef|school|student|uniform|party|festival|costume|transparent|invisible)\b/i;
const BANNED_WEAPON_NAMES = /\b(umbrella|snowboard|surfboard|flag|balloon|rose|bouquet|lollipop|fan|tube|briefcase|purse|shovel|plunger|sake bottle|red whip)\b/i;

const STARTER_NAME_PRIORITY = {
  female: {
    cap: ['Red Headband', 'Black Headband'],
    top: ['White Tubetop', 'Orange Sporty T-Shirt', 'White Undershirt'],
    bottom: ['Red Miniskirt', 'Red Mini Skirt'],
    shoes: ['Red Rubber Boots', 'Yellow Basic Boots', 'Brown Hard Leather Boots'],
  },
  male: {
    cap: ['Black Headband', 'Red Headband'],
    top: ['White Undershirt', 'White Tubetop'],
    bottom: ['Blue Jean Shorts', 'Red Miniskirt', 'Red Mini Skirt'],
    shoes: ['Yellow Basic Boots', 'Brown Hard Leather Boots', 'Red Rubber Boots'],
  },
};

const STARTER_FALLBACKS = {
  female: {
    cap: { id: '1002067', name: 'Red Headband', slot: 'cap', reqLevel: 0 },
    top: { id: '1041013', name: 'White Tubetop', slot: 'top', reqLevel: 0 },
    bottom: { id: '1061013', name: 'Red Miniskirt', slot: 'bottom', reqLevel: 0 },
    shoes: { id: '1072005', name: 'Red Rubber Boots', slot: 'shoes', reqLevel: 0 },
  },
  male: {
    cap: { id: '1002019', name: 'Black Headband', slot: 'cap', reqLevel: 0 },
    top: { id: '1040002', name: 'White Undershirt', slot: 'top', reqLevel: 0 },
    bottom: { id: '1060002', name: 'Blue Jean Shorts', slot: 'bottom', reqLevel: 0 },
    shoes: { id: '1072007', name: 'Yellow Basic Boots', slot: 'shoes', reqLevel: 0 },
  },
};

const STARTER_WEAPON_FALLBACKS = {
  warrior: { id: '1302000', name: "Beginner's Sword", slot: 'weapon', weaponType: '1h sword', weapon_type: '1h Sword', incPAD: 17, reqLevel: 0 },
  magician: { id: '1372005', name: "Beginner's Wooden Wand", slot: 'weapon', weaponType: 'wand', weapon_type: 'Wand', incMAD: 15, reqLevel: 0 },
  bowman: { id: '1452002', name: 'War Bow', slot: 'weapon', weaponType: 'bow', weapon_type: 'Bow', incPAD: 20, reqLevel: 10 },
  thief: { id: '1472000', name: 'Garnier', slot: 'weapon', weaponType: 'claw', weapon_type: 'Claw', incPAD: 12, reqLevel: 10 },
  pirate: { id: '1492000', name: 'Pistol', slot: 'weapon', weaponType: 'gun', weapon_type: 'Gun', incPAD: 12, reqLevel: 10 },
};

const STARTER_WEAPON_NAMES = {
  warrior: ["Beginner's Sword", 'Sword'],
  magician: ["Beginner's Wooden Wand", 'Wooden Wand'],
  bowman: ["Beginner's Bow", 'War Bow'],
  thief: ["Beginner's Claw", 'Garnier'],
  pirate: ["Beginner's Gun", 'Pistol'],
};

export function selectGear(args) {
  if (isLowBudgetStarter(args)) {
    const bySlot = getLowBudgetStarterBySlot(args);
    return LOW_BUDGET_STARTER_ORDER.flatMap((slot) => bySlot[slot]?.[0] ? [bySlot[slot][0]] : []);
  }

  const bySlot = getGearCandidatesBySlot({ ...args, manualMode: false });
  const weapon = bySlot.weapon?.[0];
  const policy = getPolicy(args.classLine, args.branch);
  const useOverall = Boolean(bySlot.overall?.[0]) && !(bySlot.top?.[0] && bySlot.bottom?.[0] && Number(args.level) <= EARLY_GEAR_LEVEL_CUTOFF);
  const ordered = [
    bySlot.cap?.[0],
    useOverall ? bySlot.overall?.[0] : bySlot.top?.[0],
    useOverall ? null : bySlot.bottom?.[0],
    bySlot.shoes?.[0],
    bySlot.glove?.[0],
    bySlot.cape?.[0],
    bySlot.earring?.[0],
    shouldUseShield(policy, args.branch, weapon) ? bySlot.shield?.[0] : null,
    weapon,
  ].filter(Boolean);
  return ordered.map((item) => toGear(item, args.classLine));
}

export function getGearCandidatesBySlot(args) {
  if (isLowBudgetStarter(args)) return getLowBudgetStarterBySlot(args);
  if (!args.items?.length) return getStarterFallbackBySlot(args);

  const { classLine, branch, level, budget, gender, statPlan, items, manualMode = false } = args;
  const policy = getPolicy(classLine, branch);
  const profile = getBudgetGearProfile(budget);
  const candidates = getBaseCandidates({ classLine, branch, level, budget, gender, statPlan, items, manualMode });
  const starterCandidates = getStarterCandidates({ classLine, branch, level, gender, statPlan, items });
  const scoreBudget = manualMode ? 'high' : budget;
  const sort = (list) => list.map((item) => toGear(item, classLine)).sort((a, b) => gearScore(b, classLine, scoreBudget, level) - gearScore(a, classLine, scoreBudget, level));

  const weaponCandidates = candidates.filter((item) => item.slot === 'weapon' && weaponMatchesPolicy(item, policy));
  const classWeapon = weaponCandidates.filter((item) => isClassSpecific(item, classLine));
  const allJobWeapon = weaponCandidates.filter((item) => isAllJob(item) && !isBannedWeaponName(item));
  const weapon = classWeapon.length ? classWeapon : allJobWeapon;

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

  if (Number(level) <= EARLY_GEAR_LEVEL_CUTOFF) {
    const starterFallback = getStarterFallbackBySlot(args);
    for (const slot of CORE_EARLY_SLOTS) {
      if (!output[slot]?.length) {
        const starterPool = starterCandidates.filter((item) => item.slot === slot && (slot !== 'weapon' || weaponMatchesPolicy(item, policy)));
        output[slot] = sort(starterPool.length ? starterPool : (starterFallback[slot] ?? []));
      }
    }
  }

  if (!shouldUseShield(policy, branch, output.weapon?.[0])) output.shield = [];
  if (!budgetAllowsSlot('glove', profile, level, policy)) output.glove = [];
  if (!budgetAllowsSlot('cape', profile, level, policy)) output.cape = [];
  if (!budgetAllowsSlot('earring', profile, level, policy)) output.earring = [];
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

  return ['cap', 'overall', 'top', 'bottom', 'shoes', 'glove', 'cape', 'earring', 'shield', 'weapon'].map((slot) => bySlot[slot]).filter(Boolean);
}

function isLowBudgetStarter({ budget, level }) {
  return budget === 'low' && Number(level || 1) <= LOW_BUDGET_STARTER_CUTOFF;
}

function getLowBudgetStarterBySlot({ classLine, branch, level, gender, statPlan, items = [] }) {
  const output = Object.fromEntries(ALL_SLOTS.map((slot) => [slot, []]));
  const normalizedItems = (items || [])
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => item.slot)
    .filter((item) => Number(item.reqLevel ?? 0) <= STARTER_REQ_LEVEL_MAX)
    .filter((item) => !isHardBanned(item))
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));

  const preferredGender = gender === 'male' ? 'male' : 'female';
  for (const slot of ['cap', 'top', 'bottom', 'shoes']) {
    const pool = normalizedItems.filter((item) => item.slot === slot);
    output[slot] = pickStarter(pool, STARTER_NAME_PRIORITY[preferredGender][slot], STARTER_FALLBACKS[preferredGender][slot], slot, classLine);
  }

  const policy = getPolicy(classLine, branch);
  const weaponPool = normalizedItems.filter((item) => item.slot === 'weapon' && weaponMatchesPolicy(item, policy));
  const classId = classLine?.id ?? 'warrior';
  output.weapon = pickStarter(weaponPool, STARTER_WEAPON_NAMES[classId] ?? STARTER_WEAPON_NAMES.warrior, STARTER_WEAPON_FALLBACKS[classId] ?? STARTER_WEAPON_FALLBACKS.warrior, 'weapon', classLine);
  return output;
}

function pickStarter(pool, names, fallback, slot, classLine) {
  const ranked = [];
  for (const name of names || []) {
    const matched = (pool || []).find((item) => nameMatches(item, name));
    if (matched) ranked.push(matched);
  }
  const levelZero = (pool || []).filter((item) => Number(item.reqLevel ?? 999) <= 0);
  const lowLevel = (pool || []).filter((item) => Number(item.reqLevel ?? 999) <= STARTER_REQ_LEVEL_MAX);
  const unique = dedupeGear([...ranked, ...levelZero, ...lowLevel, fallback].filter(Boolean));
  return unique.slice(0, 8).map((item) => toGear({ ...item, slot }, classLine));
}

function dedupeGear(list) {
  const seen = new Set();
  return list.filter((item) => {
    const key = String(item.id ?? item.name ?? item.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nameMatches(item, target) {
  const text = normalizeText(`${item?.name ?? ''} ${item?.title ?? ''}`);
  const key = normalizeText(target);
  return text === key || text.includes(key);
}

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getBaseCandidates({ classLine, branch, level, budget, gender, statPlan, items, manualMode = false }) {
  const policy = getPolicy(classLine, branch);
  const profile = getBudgetGearProfile(budget);
  const maxReqLevel = manualMode ? Number(level || 1) : null;
  return items
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => item.slot)
    .filter((item) => manualMode || budgetAllowsSlot(item.slot, profile, level, policy))
    .filter((item) => Number(item.reqLevel ?? 0) <= (manualMode ? maxReqLevel : maxReqLevelForBudget(item.slot, level, profile)))
    .filter((item) => !isBannedOrSpecial(item))
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));
}

function getStarterCandidates({ classLine, level, gender, statPlan, items }) {
  if (Number(level) > EARLY_GEAR_LEVEL_CUTOFF) return [];
  return items
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => CORE_EARLY_SLOTS.has(item.slot))
    .filter((item) => Number(item.reqLevel ?? 0) <= STARTER_REQ_LEVEL_MAX)
    .filter((item) => !isHardBanned(item))
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));
}

function getStarterFallbackBySlot({ classLine, gender }) {
  const outfit = STARTER_FALLBACKS[gender === 'male' ? 'male' : 'female'];
  const weapon = STARTER_WEAPON_FALLBACKS[classLine?.id] ?? STARTER_WEAPON_FALLBACKS.warrior;
  const result = Object.fromEntries(ALL_SLOTS.map((slot) => [slot, []]));
  [...Object.values(outfit), weapon].forEach((item) => { result[item.slot] = [toGear(item, classLine)]; });
  return result;
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
  if (Number(item.reqLevel ?? 0) <= STARTER_REQ_LEVEL_MAX && CORE_EARLY_SLOTS.has(item.slot)) return isHardBanned(item);
  if (isHardBanned(item)) return true;
  if (Number(item.reqLevel ?? 0) >= 200) return true;
  if (Number(item.reqLevel ?? 0) <= 0) return true;
  if (Number(item.price ?? 0) === 1 && !hasAnyStatOrAttack(item)) return true;
  return false;
}

function isHardBanned(item) {
  const text = `${String(item.name ?? item.title ?? '')} ${String(item.description ?? '')}`;
  if (BANNED_NAME_PATTERN.test(text)) return true;
  if (item.slot === 'weapon' && isBannedWeaponName(item)) return true;
  if (item.slot !== 'weapon' && BANNED_SLOT_NAMES.test(text)) return true;
  return false;
}

function isBannedWeaponName(item) {
  return BANNED_WEAPON_NAMES.test(String(item.name ?? item.title ?? ''));
}

function hasAnyStatOrAttack(item) {
  return ['incSTR', 'incDEX', 'incINT', 'incLUK', 'incPAD', 'incMAD', 'incACC', 'incSpeed', 'incJump'].some((key) => Number(item[key] ?? item.stats?.[key] ?? 0) !== 0);
}

function genderMatches(item, gender) {
  return item.visualGender === 'unisex' || item.visualGender === gender;
}

function statRequirementsMet(item, statPlan) {
  const stats = statPlan?.stats ?? {};
  return Number(item.reqSTR ?? 0) <= Number(stats.STR ?? 0)
    && Number(item.reqDEX ?? 0) <= Number(stats.DEX ?? 0)
    && Number(item.reqINT ?? 0) <= Number(stats.INT ?? 0)
    && Number(item.reqLUK ?? 0) <= Number(stats.LUK ?? 0);
}

function getReqJob(item) {
  return Number(item.reqJob ?? item.req_job ?? item.stats?.reqJob ?? 0);
}

function isAllJob(item) {
  const reqJob = getReqJob(item);
  const label = String(item.reqJobLabel ?? item.req_job_label ?? '');
  return !reqJob || !label || label === 'All';
}

function isClassSpecific(item, classLine) {
  const reqJob = getReqJob(item);
  const bit = JOB_BITS[classLine?.id] ?? 0;
  if (bit && (reqJob & bit)) return true;
  const label = String(item.reqJobLabel ?? item.req_job_label ?? '').toLowerCase();
  return Boolean(label && label !== 'all' && label.includes(String(JOB_LABEL[classLine?.id] ?? '').toLowerCase()));
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
  const attack = classLine?.id === 'magician'
    ? Number(item.incMAD ?? item.stats?.incMAD ?? 0) * 3 + Number(item.incPAD ?? item.stats?.incPAD ?? 0) * 0.25
    : Number(item.incPAD ?? item.stats?.incPAD ?? 0) * 3 + Number(item.incMAD ?? item.stats?.incMAD ?? 0) * 0.25;
  const primary = Number(item.stats?.[`inc${classLine?.primaryStat}`] ?? item[`inc${classLine?.primaryStat}`] ?? 0) * 5;
  const secondary = Number(item.stats?.[`inc${classLine?.secondaryStat}`] ?? item[`inc${classLine?.secondaryStat}`] ?? 0) * 2;
  const acc = Number(item.incACC ?? item.stats?.incACC ?? 0) * 2;
  const levelFit = 100 - Math.abs(desiredReqLevel - reqLevel) * 3.8;
  const classBonus = isClassSpecific(item, classLine) ? profile.classBonus : 0;
  const pricePenalty = Math.log10(Math.max(1, Number(item.price ?? 1))) * profile.pricePenalty;
  return attack + primary + secondary + acc + levelFit + classBonus - pricePenalty;
}

function toGear(item, classLine) {
  const slot = item.slot ?? detectSlot(item);
  const attack = classLine?.id === 'magician'
    ? `魔攻 ${item.incMAD || item.stats?.incMAD || 0}${item.incPAD ? ` / 攻击 ${item.incPAD}` : ''}`
    : `攻击 ${item.incPAD || item.stats?.incPAD || 0}${item.incMAD ? ` / 魔攻 ${item.incMAD}` : ''}`;
  return {
    category: 'Equipment',
    reqJobLabel: item.req_job_label ?? item.reqJobLabel ?? 'All',
    reqJob: item.req_job ?? item.reqJob ?? 0,
    price: item.price ?? 0,
    stats: item.stats ?? {},
    visualGender: item.visualGender ?? 'unisex',
    ...item,
    slot,
    label: SLOT_LABELS[slot] ?? '装备',
    title: item.name ?? item.title,
    desc: item.desc ?? `${attack} · 需求 ${formatReq(item)}`,
    reqLevel: Number(item.reqLevel ?? item.req_level ?? 0),
    thumbnail: item.thumbnail,
    weaponType: item.weapon_type ?? item.weaponType,
    attackSpeed: item.attack_speed_label ?? item.attackSpeed,
    scoreLabel: item.scoreLabel ?? (item.price ? `${Number(item.price).toLocaleString()} meso` : '新手/基础装备'),
  };
}

function formatReq(item) {
  const reqs = [item.reqSTR ? `STR ${item.reqSTR}` : '', item.reqDEX ? `DEX ${item.reqDEX}` : '', item.reqINT ? `INT ${item.reqINT}` : '', item.reqLUK ? `LUK ${item.reqLUK}` : ''].filter(Boolean);
  return reqs.length ? reqs.join(' / ') : '无属性需求';
}
