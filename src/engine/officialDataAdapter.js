const BASE_URL = import.meta.env?.BASE_URL || '/';
const appDataPath = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;
const cmsPath = (name) => appDataPath(`cms/${name}.json`);
const padItemId = (id) => String(id ?? '').replace(/\.0$/, '').padStart(8, '0');
const padSkillId = (id) => String(id ?? '').replace(/\.0$/, '').padStart(7, '0');
const itemIconPath = (id) => appDataPath(`cms/images/items/${padItemId(id)}.png`);
const skillIconPath = (id) => appDataPath(`cms/images/skills/${padSkillId(id)}.png`);

const JOB_BITS = { warrior: 1, magician: 2, bowman: 4, thief: 8, pirate: 16 };
const JOB_LABELS = { 1: 'Warrior', 2: 'Mage', 4: 'Bowman', 8: 'Thief', 16: 'Pirate' };
const JOB_BY_SKILL_PREFIX = {
  '100': 'warrior', '110': 'fighter', '120': 'page', '130': 'spearman',
  '200': 'magician', '210': 'fp', '220': 'il', '230': 'cleric',
  '300': 'bowman', '310': 'hunter', '320': 'crossbowman',
  '400': 'thief', '410': 'assassin', '420': 'bandit',
  '500': 'pirate', '510': 'brawler', '520': 'gunslinger',
};

export async function loadOfficialGuideData() {
  const [itemsRaw, lookupsRaw, mapsRaw, monstersRaw, skillsRaw] = await Promise.all([
    fetchJson(cmsPath('items')),
    fetchJson(cmsPath('lookups')).catch(() => ({})),
    fetchJson(cmsPath('maps')),
    fetchJson(cmsPath('monsters')),
    fetchJson(cmsPath('skills')),
  ]);

  const lookups = normalizeLookups(lookupsRaw);
  const monsters = normalizeMonsters(records(monstersRaw, ['monsters', 'mob', 'mobs', 'data']), lookups);
  const maps = normalizeMaps(records(mapsRaw, ['maps', 'regions', 'data']), monsters, lookups);
  const items = normalizeItems(records(itemsRaw, ['items', 'equipment', 'equips', 'data']), lookups);
  const skillGroups = normalizeSkillGroups(records(skillsRaw, ['skills', 'data']), lookups);

  return {
    source: 'cms-china',
    overview: null,
    monsters,
    maps,
    recipes: [],
    materials: [],
    professions: [],
    items,
    skillGroups,
  };
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
}

function normalizeLookups(raw) {
  const out = { items: {}, monsters: {}, maps: {}, skills: {} };
  const source = raw && typeof raw === 'object' ? raw : {};
  for (const key of Object.keys(out)) {
    out[key] = source[key] ?? source[`${key}ById`] ?? source[key.slice(0, -1)] ?? {};
  }
  return out;
}

function records(raw, preferredKeys = []) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  for (const key of preferredKeys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
  }
  const values = Object.values(raw);
  if (values.every((value) => value && typeof value === 'object' && !Array.isArray(value))) return values;
  return [];
}

function read(obj, keys, fallback = undefined) {
  for (const key of keys) {
    const value = key.split('.').reduce((node, part) => node?.[part], obj);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function text(obj, keys, fallback = '') {
  const value = read(obj, keys, fallback);
  return String(value ?? fallback ?? '');
}

function num(obj, keys, fallback = 0) {
  const value = Number(read(obj, keys, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function bool(obj, keys) {
  const value = read(obj, keys, false);
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

function lookupName(lookups, bucket, id, fallback) {
  const table = lookups?.[bucket] ?? {};
  const item = table[id] ?? table[String(id)] ?? table[Number(id)];
  if (typeof item === 'string') return item;
  return read(item, ['name', 'zh', 'cn', 'displayName'], fallback) ?? fallback;
}

function normalizeItems(items, lookups) {
  return items.map((item) => {
    const id = String(read(item, ['id', 'itemId', 'item_id', 'code'], '')).replace(/\.0$/, '');
    const padded = padItemId(id);
    const name = text(item, ['name', 'displayName', 'label', 'title'], lookupName(lookups, 'items', id, `Item ${id}`));
    const type = text(item, ['type', 'itemType', 'subCategory', 'sub_category', 'categoryName'], '').toLowerCase();
    const stats = item.stats ?? item.info ?? item;
    const slot = detectSlot({ id: padded, type });
    const isWeapon = slot === 'weapon';
    const reqJob = num(stats, ['reqJob', 'req_job', 'job'], num(item, ['reqJob', 'req_job', 'job'], 0));
    const reqJobLabel = text(item, ['reqJobLabel', 'req_job_label'], jobLabel(reqJob));
    const weaponType = normalizeWeaponType(text(item, ['weaponType', 'weapon_type', 'type', 'subCategory', 'sub_category'], ''));
    const thumbnail = text(item, ['thumbnail', 'icon', 'image'], '');

    return {
      ...item,
      id,
      name,
      title: name,
      category: 'Equipment',
      sub_category: isWeapon ? 'Weapon' : 'Armor',
      weaponType,
      weapon_type: weaponType,
      reqJob,
      reqJobLabel,
      reqLevel: num(stats, ['reqLevel', 'req_level', 'level'], num(item, ['reqLevel', 'req_level', 'level'], 0)),
      reqSTR: num(stats, ['reqSTR', 'req_str', 'str'], 0),
      reqDEX: num(stats, ['reqDEX', 'req_dex', 'dex'], 0),
      reqINT: num(stats, ['reqINT', 'req_int', 'int'], 0),
      reqLUK: num(stats, ['reqLUK', 'req_luk', 'luk'], 0),
      incSTR: num(stats, ['incSTR', 'str'], 0),
      incDEX: num(stats, ['incDEX', 'dex'], 0),
      incINT: num(stats, ['incINT', 'int'], 0),
      incLUK: num(stats, ['incLUK', 'luk'], 0),
      incPAD: num(stats, ['incPAD', 'pad', 'watk', 'attack', 'weaponAttack'], 0),
      incMAD: num(stats, ['incMAD', 'mad', 'matk', 'magicAttack'], 0),
      incACC: num(stats, ['incACC', 'acc', 'accuracy'], 0),
      incEVA: num(stats, ['incEVA', 'eva', 'avoid', 'avoidability'], 0),
      incPDD: num(stats, ['incPDD', 'pdd', 'wdef', 'defense'], 0),
      incMDD: num(stats, ['incMDD', 'mdd', 'magicDefense'], 0),
      incMHP: num(stats, ['incMHP', 'mhp', 'hp', 'incHP'], 0),
      incMMP: num(stats, ['incMMP', 'mmp', 'mp', 'incMP'], 0),
      incSpeed: num(stats, ['incSpeed', 'speed'], 0),
      incJump: num(stats, ['incJump', 'jump'], 0),
      tuc: num(stats, ['tuc', 'slots', 'upgradeSlots'], 0),
      price: num(item, ['price', 'meso', 'cost'], 0),
      thumbnail: thumbnail ? appDataPath(thumbnail) : itemIconPath(id),
      stats,
    };
  }).filter((item) => item.id && detectSlot({ id: padItemId(item.id), type: item.weaponType }));
}

function detectSlot({ id, type }) {
  const value = String(id ?? '').padStart(8, '0');
  if (/weapon|sword|axe|blunt|spear|pole|wand|staff|bow|crossbow|claw|dagger|gun|knuckle/i.test(type)) return 'weapon';
  if (value.startsWith('0100')) return 'cap';
  if (value.startsWith('0103')) return 'earring';
  if (value.startsWith('0104')) return 'top';
  if (value.startsWith('0105')) return 'overall';
  if (value.startsWith('0106')) return 'bottom';
  if (value.startsWith('0107')) return 'shoes';
  if (value.startsWith('0108')) return 'glove';
  if (value.startsWith('0109')) return 'shield';
  if (value.startsWith('0110')) return 'cape';
  if (/^01(3|4|5|6|7)/.test(value)) return 'weapon';
  return null;
}

function normalizeWeaponType(value) {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('two') && raw.includes('sword')) return '2h sword';
  if (raw.includes('sword')) return '1h sword';
  if (raw.includes('pole')) return 'pole arm';
  if (raw.includes('spear')) return 'spear';
  if (raw.includes('wand')) return 'wand';
  if (raw.includes('staff')) return 'staff';
  if (raw.includes('crossbow')) return 'crossbow';
  if (raw.includes('bow')) return 'bow';
  if (raw.includes('claw')) return 'claw';
  if (raw.includes('dagger')) return 'dagger';
  if (raw.includes('gun')) return 'gun';
  if (raw.includes('knuckle')) return 'knuckle';
  if (raw.includes('axe')) return raw.includes('two') ? '2h axe' : '1h axe';
  if (raw.includes('blunt')) return raw.includes('two') ? '2h blunt weapon' : '1h blunt weapon';
  return raw;
}

function jobLabel(reqJob) {
  if (!reqJob) return 'All';
  const labels = Object.entries(JOB_BITS).filter(([, bit]) => reqJob & bit).map(([, bit]) => JOB_LABELS[bit]);
  return labels.length ? labels.join('/') : 'All';
}

function normalizeMonsters(monsters, lookups) {
  return monsters.map((monster) => {
    const id = String(read(monster, ['id', 'mobId', 'monsterId', 'code'], '')).replace(/\.0$/, '');
    const level = num(monster, ['level', 'lv'], 1);
    const avoid = num(monster, ['eva', 'avoid', 'avoidability'], 0);
    const thumbnail = text(monster, ['thumbnail', 'icon', 'image'], '');
    const mapRefs = read(monster, ['maps', 'mapIds', 'spawns'], []);

    return {
      ...monster,
      id,
      rawId: id,
      name: text(monster, ['name', 'displayName', 'label'], lookupName(lookups, 'monsters', id, `Monster ${id}`)),
      level,
      hp: num(monster, ['hp', 'maxHP'], 1),
      mp: num(monster, ['mp', 'maxMP'], 0),
      exp: num(monster, ['exp'], 0),
      avoid,
      requiredAccuracy: Math.max(1, Math.ceil((55 * avoid) / 15)),
      defense: num(monster, ['PDDamage', 'pdd', 'defense'], 0),
      magicDefense: num(monster, ['MDDamage', 'mdd', 'magicDefense'], 0),
      physicalAttack: num(monster, ['PADamage', 'pad', 'physicalAttack'], 0),
      magicAttack: num(monster, ['MADamage', 'mad', 'magicAttack'], 0),
      undead: bool(monster, ['undead', 'isUndead']),
      isBoss: bool(monster, ['boss', 'isBoss', 'is_boss']),
      thumbnail: thumbnail ? appDataPath(thumbnail) : null,
      gif: null,
      maps: normalizeMapRefs(mapRefs),
    };
  }).filter((monster) => monster.id);
}

function normalizeMapRefs(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => typeof entry === 'object'
      ? { id: Number(read(entry, ['id', 'mapId'], 0)), name: text(entry, ['name'], ''), count: num(entry, ['count', 'spawnCount'], 1), mobTime: num(entry, ['mobTime', 'mob_time'], 0) }
      : { id: Number(entry), name: '', count: 1, mobTime: 0 }).filter((entry) => entry.id);
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([id, entry]) => ({ id: Number(id), name: text(entry, ['name'], ''), count: num(entry, ['count', 'spawnCount'], Number(entry) || 1), mobTime: num(entry, ['mobTime', 'mob_time'], 0) }));
  }
  return [];
}

function normalizeMaps(mapsRaw, monsters, lookups) {
  const monsterById = new Map(monsters.map((monster) => [String(monster.id), monster]));
  const maps = recordsFromRegions(mapsRaw).map((map) => normalizeMap(map, monsterById, lookups)).filter(Boolean);
  const mapById = new Map(maps.map((map) => [Number(map.rawId), map]));

  for (const monster of monsters) {
    for (const ref of monster.maps ?? []) {
      if (!mapById.has(Number(ref.id))) {
        mapById.set(Number(ref.id), normalizeMap({ id: ref.id, name: ref.name, monsters: [] }, monsterById, lookups));
      }
      const map = mapById.get(Number(ref.id));
      if (!map.monsterDetails.some((item) => String(item.id) === String(monster.id))) {
        map.monsterDetails.push({ ...monster, spawnCount: ref.count, mobTime: ref.mobTime });
      }
    }
  }

  return [...mapById.values()].map(finalizeMap).filter((map) => map.monsterDetails.length && !map.isTown)
    .sort((a, b) => a.levelRange[0] - b.levelRange[0] || b.spawnTotal - a.spawnTotal);
}

function recordsFromRegions(raw) {
  return raw.flatMap((entry) => Array.isArray(entry?.maps) ? entry.maps.map((map) => ({ ...map, region: map.region ?? entry.region ?? entry.name })) : [entry]);
}

function normalizeMap(map, monsterById, lookups) {
  const id = String(read(map, ['id', 'mapId', 'code'], '')).replace(/\.0$/, '');
  if (!id) return null;
  const thumbnail = text(map, ['thumbnail', 'minimap', 'image'], '');
  const refs = normalizeMapMonsterRefs(read(map, ['monsters', 'mobs', 'spawns'], []));
  return {
    ...map,
    id,
    rawId: Number(id),
    name: text(map, ['name', 'displayName', 'street_name'], lookupName(lookups, 'maps', id, `Map ${id}`)),
    streetName: text(map, ['streetName', 'street_name'], ''),
    region: text(map, ['region', 'continent'], '国服'),
    isTown: bool(map, ['isTown', 'is_town', 'town']),
    mobRate: num(map, ['mobRate', 'mob_rate'], 1),
    thumbnail: thumbnail ? appDataPath(thumbnail) : null,
    minimap: thumbnail ? appDataPath(thumbnail) : null,
    monsterDetails: refs.map((ref) => {
      const monster = monsterById.get(String(ref.id));
      return monster ? { ...monster, spawnCount: ref.count, mobTime: ref.mobTime } : null;
    }).filter(Boolean),
  };
}

function normalizeMapMonsterRefs(value) {
  if (Array.isArray(value)) return value.map((entry) => typeof entry === 'object'
    ? { id: read(entry, ['id', 'mobId', 'monsterId'], ''), count: num(entry, ['count', 'spawnCount'], 1), mobTime: num(entry, ['mobTime', 'mob_time'], 0) }
    : { id: entry, count: 1, mobTime: 0 }).filter((entry) => entry.id !== '');
  if (value && typeof value === 'object') return Object.entries(value).map(([id, entry]) => ({ id, count: num(entry, ['count', 'spawnCount'], Number(entry) || 1), mobTime: num(entry, ['mobTime', 'mob_time'], 0) }));
  return [];
}

function finalizeMap(map) {
  const monsters = map.monsterDetails ?? [];
  const levels = monsters.map((monster) => monster.level).filter(Number.isFinite);
  const spawnTotal = monsters.reduce((sum, monster) => sum + Number(monster.spawnCount ?? 1), 0);
  const levelRange = levels.length ? [Math.min(...levels), Math.max(...levels)] : [1, 1];
  return {
    ...map,
    levelRange,
    monsters: monsters.map((monster) => monster.id),
    spawnTotal,
    tags: [spawnTotal >= 35 ? '高密度' : spawnTotal >= 18 ? '稳定刷怪' : '普通密度', map.region].filter(Boolean),
    routeNote: `怪物等级 Lv.${levelRange[0]}-${levelRange[1]}，刷怪数 ${spawnTotal}。`,
  };
}

function normalizeSkillGroups(skills, lookups) {
  const rows = skills.map((skill) => {
    const id = String(read(skill, ['id', 'skillId', 'code'], '')).replace(/\.0$/, '');
    const jobKey = text(skill, ['job', 'jobName', 'className'], '') || JOB_BY_SKILL_PREFIX[id.slice(0, 3)] || 'unknown';
    const thumbnail = text(skill, ['thumbnail', 'icon', 'image'], '');
    return {
      ...skill,
      id,
      name: text(skill, ['name', 'displayName', 'label'], lookupName(lookups, 'skills', id, `Skill ${id}`)),
      maxLevel: num(skill, ['maxLevel', 'max_level', 'max'], 0),
      thumbnail: thumbnail ? appDataPath(thumbnail) : skillIconPath(id),
      allLevelStats: read(skill, ['allLevelStats', 'all_level_stats', 'levelStats'], []),
      description: text(skill, ['description', 'desc'], ''),
      jobKey,
    };
  }).filter((skill) => skill.id && skill.maxLevel > 0);

  const grouped = new Map();
  for (const skill of rows) {
    if (!grouped.has(skill.jobKey)) grouped.set(skill.jobKey, []);
    grouped.get(skill.jobKey).push(skill);
  }
  return [...grouped.entries()].map(([jobKey, groupSkills]) => ({
    baseClass: jobKey,
    className: jobKey,
    job: inferJobTier(jobKey),
    mainClass: jobKey,
    baseClassLabel: jobKey,
    subclasses: [],
    skills: groupSkills,
  }));
}

function inferJobTier(jobKey) {
  return ['warrior', 'magician', 'bowman', 'thief', 'pirate'].includes(jobKey) ? '1st Job' : '2nd Job';
}
