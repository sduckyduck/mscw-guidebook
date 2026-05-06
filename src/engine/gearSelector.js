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

export function selectGear({ classLine, branch, level, budget, gender, statPlan, items }) {
  if (!items?.length) {
    return [{ label: '武器', title: classLine.weaponTypes?.[0] ?? '职业武器', desc: `Lv.${level} 过渡`, slot: 'weapon' }];
  }

  const candidates = items
    .filter((item) => item.category === 'Equipment')
    .map((item) => ({ ...item, slot: detectSlot(item), visualGender: detectVisualGender(item) }))
    .filter((item) => item.slot)
    .filter((item) => Number(item.reqLevel ?? 0) <= level + 2)
    .filter((item) => jobMatches(item, classLine))
    .filter((item) => statRequirementsMet(item, statPlan))
    .filter((item) => genderMatches(item, gender));

  const weapon = pickBest(candidates.filter((item) => item.slot === 'weapon' && weaponMatches(item, classLine, branch)), classLine, budget, level);
  const cap = pickBest(candidates.filter((item) => item.slot === 'cap'), classLine, budget, level);
  const overall = pickBest(candidates.filter((item) => item.slot === 'overall'), classLine, budget, level);
  const top = pickBest(candidates.filter((item) => item.slot === 'top'), classLine, budget, level);
  const bottom = pickBest(candidates.filter((item) => item.slot === 'bottom'), classLine, budget, level);
  const shoes = pickBest(candidates.filter((item) => item.slot === 'shoes'), classLine, budget, level);
  const glove = pickBest(candidates.filter((item) => item.slot === 'glove'), classLine, budget, level);
  const shield = pickBest(candidates.filter((item) => item.slot === 'shield'), classLine, budget, level);
  const cape = pickBest(candidates.filter((item) => item.slot === 'cape'), classLine, budget, level);

  const ordered = [cap, overall || top, overall ? null : bottom, shoes, glove, cape, shouldUseShield(classLine, branch, weapon) ? shield : null, weapon].filter(Boolean);
  return ordered.map((item) => toGear(item, classLine));
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

function jobMatches(item, classLine) {
  const reqJob = Number(item.reqJob ?? item.stats?.reqJob ?? 0);
  if (!reqJob) return true;
  const bit = JOB_BITS[classLine.id] ?? 0;
  if (bit && (reqJob & bit)) return true;
  const label = String(item.req_job_label ?? '');
  return !label || label === 'All' || label.toLowerCase().includes(String(JOB_LABEL[classLine.id] ?? '').toLowerCase());
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
  const pricePenalty = budget === 'low' ? Math.log10(Math.max(1, Number(item.price ?? 1))) * 1.5 : 0;
  return attack + primary + secondary + acc + levelFit - pricePenalty;
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
