const PROFESSION_ID_BY_NAME = {
  Smithing: 'smithing',
  Weaponcrafting: 'weaponcrafting',
  Tailoring: 'tailoring',
  Woodcrafting: 'woodcrafting',
  Leatherworking: 'leatherworking',
  Arcforge: 'arcforge',
};

const BASE_URL = import.meta.env?.BASE_URL || '/';
const appDataPath = (path) => `${BASE_URL}${path.replace(/^\/+/, '')}`;
const cmsPath = (name) => appDataPath(`cms/${name}.json`);
const padItemId = (id) => String(id ?? '').replace(/\.0$/, '').padStart(8, '0');
const padSkillId = (id) => String(id ?? '').replace(/\.0$/, '').padStart(7, '0');
const appItemIconPath = (id) => appDataPath(`AppData/images/items/${padItemId(id)}.png`);
const appSkillIconPath = (id) => appDataPath(`AppData/images/skills/${padSkillId(id)}.png`);
const cmsItemIconPath = (id) => appDataPath(`cms/images/items/${padItemId(id)}.png`);
const cmsSkillIconPath = (id) => appDataPath(`cms/images/skills/${padSkillId(id)}.png`);

const JOB_BITS = { warrior: 1, magician: 2, bowman: 4, thief: 8, pirate: 16 };
const JOB_LABELS = { 1: 'Warrior', 2: 'Mage', 4: 'Bowman', 8: 'Thief', 16: 'Pirate' };
const JOB_BY_SKILL_PREFIX = {
  '100': 'warrior', '110': 'fighter', '120': 'page', '130': 'spearman',
  '200': 'magician', '210': 'fp', '220': 'il', '230': 'cleric',
  '300': 'bowman', '310': 'hunter', '320': 'crossbowman',
  '400': 'thief', '410': 'assassin', '420': 'bandit',
  '500': 'pirate', '510': 'brawler', '520': 'gunslinger',
};

const CHINA_BETA_MAX_LEVEL = 100;
const CHINA_BETA_MAP_ID_RANGES = [
  [100000000, 109999999],
  [110000000, 110099999],
  [120040000, 120049999],
];
const CHINA_BETA_AREA_PATTERNS = [
  /金银岛|维多利亚|林中之城|蚂蚁洞|黄金海滩|黄金海岸/i,
  /victoria|sleepywood|ant\s*tunnel|gold\s*beach|florina/i,
];

const EMPTY_DATA = { source: 'empty', overview: null, monsters: [], maps: [], quests: [], recipes: [], materials: [], professions: [], items: [], skillGroups: [] };

export async function loadOfficialGuideData(options = {}) {
  const source = typeof options === 'string' ? options : options.source ?? options.dataMode ?? 'catalog';
  if (source === 'official-appdata' || source === 'global' || source === 'appdata') return loadAppDataGuideData();
  if (source === 'cms-china' || source === 'china' || source === 'cms') return loadCmsGuideData();

  const [globalData, chinaData] = await Promise.all([
    loadAppDataGuideData(),
    loadCmsGuideData().catch((error) => ({ ...EMPTY_DATA, source: 'cms-china-error', error })),
  ]);

  return createEditionAwareData({ globalData, chinaData });
}

function createEditionAwareData({ globalData, chinaData }) {
  const choose = () => getCurrentEditionId() === 'china' ? chinaData : globalData;
  return {
    get source() { return choose().source; },
    get overview() { return choose().overview; },
    get monsters() { return choose().monsters; },
    get maps() { return choose().maps; },
    get quests() { return choose().quests; },
    get recipes() { return choose().recipes; },
    get materials() { return choose().materials; },
    get professions() { return choose().professions; },
    get items() { return choose().items; },
    get skillGroups() { return choose().skillGroups; },
    byEdition: { global: globalData, china: chinaData },
  };
}

function getCurrentEditionId() {
  if (typeof window === 'undefined') return 'global';
  const editionSelect = [...document.querySelectorAll('.mg-field')]
    .find((field) => field.textContent?.includes('版本'))
    ?.querySelector('select');
  if (editionSelect?.value) return editionSelect.value;

  try {
    const saved = JSON.parse(window.localStorage.getItem('mscw-guidebook-state-v2') || '{}');
    return saved.editionId === 'china' ? 'china' : 'global';
  } catch {
    return 'global';
  }
}

async function loadAppDataGuideData() {
  const [overview, monstersRaw, mapsRaw, craftingRaw, itemsRaw, skillsRaw] = await Promise.all([
    fetchJson(appDataPath('AppData/overview.json')),
    fetchJson(appDataPath('AppData/monsters.json')),
    fetchJson(appDataPath('AppData/maps.json')),
    fetchJson(appDataPath('AppData/crafting.json')),
    fetchJson(appDataPath('AppData/items.json')),
    fetchJson(appDataPath('AppData/skills.json')),
  ]);

  const monsters = normalizeAppMonsters(monstersRaw?.monsters ?? []);
  const maps = normalizeAppMaps(mapsRaw?.regions ?? [], monsters);
  const { recipes, materials, professions } = normalizeAppCrafting(craftingRaw?.disciplines ?? []);
  const items = normalizeAppItems(itemsRaw?.items ?? []);
  const skillGroups = normalizeAppSkillGroups(skillsRaw ?? {});

  return {
    source: 'official-appdata',
    overview: overview?.stats ?? null,
    monsters,
    maps,
    quests: [],
    recipes,
    materials,
    professions,
    items,
    skillGroups,
  };
}

async function loadCmsGuideData() {
  const [itemsRaw, lookupsRaw, mapsRaw, monstersRaw, skillsRaw, questsRaw] = await Promise.all([
    fetchJson(cmsPath('items')),
    fetchJson(cmsPath('lookups')).catch(() => ({})),
    fetchJson(cmsPath('maps')),
    fetchJson(cmsPath('monsters')),
    fetchJson(cmsPath('skills')),
    fetchJson(cmsPath('quests')).catch(() => []),
  ]);

  const lookups = normalizeLookups(lookupsRaw);
  const allMonsters = normalizeCmsMonsters(records(monstersRaw, ['monsters', 'mob', 'mobs', 'data']), lookups);
  const { monsters, maps } = scopeCmsChinaBetaWorld(records(mapsRaw, ['maps', 'regions', 'data']), allMonsters, lookups);
  const items = normalizeCmsItems(records(itemsRaw, ['items', 'equipment', 'equips', 'data']), lookups);
  const skillGroups = normalizeCmsSkillGroups(records(skillsRaw, ['skills', 'data']), lookups);
  const quests = normalizeCmsQuests(records(questsRaw, ['quests', 'data']), lookups);

  return {
    source: 'cms-china',
    overview: null,
    monsters,
    maps,
    quests,
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

function normalizeAppMonsters(monsters) {
  return safeArray(monsters).map((monster) => {
    const level = Number(monster.level ?? 1);
    const eva = Number(monster.eva ?? monster.avoid ?? 0);
    const requiredAccuracy = Math.max(1, Math.ceil((55 * eva) / 15));
    const elements = parseElements(monster.elements);

    return {
      id: String(monster.id),
      rawId: monster.id,
      name: monster.name ?? `Monster ${monster.id}`,
      level,
      hp: Number(monster.hp ?? 0),
      mp: Number(monster.mp ?? 0),
      exp: Number(monster.exp ?? 0),
      avoid: eva,
      requiredAccuracy,
      monsterAccuracy: Number(monster.acc ?? 0),
      defense: Number(monster.PDDamage ?? monster.defense ?? 0),
      magicDefense: Number(monster.MDDamage ?? 0),
      physicalAttack: Number(monster.PADamage ?? 0),
      magicAttack: Number(monster.MADamage ?? 0),
      elementWeakness: elements.weak,
      elementResist: elements.resist,
      attackType: Number(monster.MADamage ?? 0) > 0 ? 'magic' : 'contact',
      isBoss: Boolean(monster.is_boss),
      isNew: Boolean(monster.is_new),
      undead: Boolean(monster.undead),
      thumbnail: monster.thumbnail ? appDataPath(`AppData/${monster.thumbnail}`) : null,
      gif: monster.gif ? appDataPath(`AppData/${monster.gif}`) : null,
      maps: safeArray(monster.maps).map((map) => ({
        id: Number(map.id),
        name: map.name,
        count: Number(map.count ?? 0),
        mobTime: Number(map.mob_time ?? 0),
      })),
    };
  });
}

function normalizeAppMaps(regions, monsters) {
  const metadataById = new Map();

  for (const region of safeArray(regions)) {
    for (const map of safeArray(region.maps)) {
      metadataById.set(Number(map.id), {
        id: String(map.id),
        rawId: Number(map.id),
        name: map.name ?? `Map ${map.id}`,
        streetName: map.street_name ?? '',
        region: map.region ?? region.region ?? 'Unknown',
        isTown: Boolean(map.is_town),
        mobRate: Number(map.mob_rate ?? 1),
        minimap: map.minimap ? appDataPath(`AppData/${map.minimap}`) : null,
        thumbnail: map.thumbnail ? appDataPath(`AppData/${map.thumbnail}`) : null,
        bgm: map.bgm ?? '',
      });
    }
  }

  const monstersByMap = new Map();
  for (const monster of monsters) {
    for (const mapRef of safeArray(monster.maps)) {
      const key = Number(mapRef.id);
      if (!monstersByMap.has(key)) monstersByMap.set(key, []);
      monstersByMap.get(key).push({ ...monster, spawnCount: mapRef.count, mobTime: mapRef.mobTime });
    }
  }

  return [...monstersByMap.entries()].map(([mapId, mapMonsters]) => {
    const metadata = metadataById.get(Number(mapId)) ?? {
      id: String(mapId),
      rawId: Number(mapId),
      name: mapMonsters[0]?.maps?.find((item) => Number(item.id) === Number(mapId))?.name ?? `Map ${mapId}`,
      streetName: '',
      region: 'Unknown',
      isTown: false,
      mobRate: 1,
      minimap: null,
      thumbnail: null,
      bgm: '',
    };

    const levels = mapMonsters.map((monster) => monster.level).filter(Number.isFinite);
    const spawnTotal = mapMonsters.reduce((sum, monster) => sum + Number(monster.spawnCount ?? 0), 0);
    const tags = buildMapTags(metadata, mapMonsters, spawnTotal);

    return {
      ...metadata,
      levelRange: [Math.min(...levels), Math.max(...levels)],
      tags,
      monsters: mapMonsters.map((monster) => monster.id),
      monsterDetails: mapMonsters,
      spawnTotal,
      routeNote: buildRouteNote(metadata, mapMonsters, spawnTotal),
    };
  })
    .filter((map) => !map.isTown && map.monsterDetails.length > 0)
    .sort((a, b) => a.levelRange[0] - b.levelRange[0] || b.spawnTotal - a.spawnTotal);
}

function buildMapTags(map, monsters, spawnTotal) {
  const tags = [];
  if (spawnTotal >= 35) tags.push('高密度');
  if (spawnTotal >= 18 && spawnTotal < 35) tags.push('稳定刷怪');
  if (monsters.some((monster) => monster.isBoss)) tags.push('Boss');
  if (monsters.some((monster) => monster.undead)) tags.push('不死系');
  if (map.region) tags.push(map.region);
  return tags.slice(0, 5);
}

function buildRouteNote(map, monsters, spawnTotal) {
  const minLevel = Math.min(...monsters.map((monster) => monster.level));
  const maxLevel = Math.max(...monsters.map((monster) => monster.level));
  const density = spawnTotal >= 35 ? '怪物密度高' : spawnTotal >= 18 ? '怪物数量稳定' : '怪物数量偏少';
  return `${density}，主要等级 Lv.${minLevel}-${maxLevel}，适合按命中和等级差筛选。`;
}

function normalizeAppCrafting(disciplines) {
  const recipes = [];
  const materialMap = new Map();
  const professions = [];

  for (const discipline of safeArray(disciplines)) {
    const professionId = PROFESSION_ID_BY_NAME[discipline.discipline] ?? slugify(discipline.discipline);
    professions.push({ id: professionId, name: discipline.discipline, skillId: discipline.skill_id });

    for (const outputType of safeArray(discipline.output_types)) {
      for (const levelGroup of safeArray(outputType.levels)) {
        for (const recipe of safeArray(levelGroup.recipes)) {
          const materials = safeArray(recipe.ingredients).map((ingredient) => {
            const id = slugify(ingredient.item_name);
            if (!materialMap.has(id)) {
              materialMap.set(id, { id, name: ingredient.item_name, source: '官方配方材料', valueTags: [] });
            }
            return { id, qty: Number(ingredient.count ?? 1) };
          });

          recipes.push({
            id: String(recipe.id ?? `${professionId}-${recipe.output_id}`),
            profession: professionId,
            outputType: outputType.output_type,
            level: Number(recipe.req_level ?? levelGroup.level ?? 1),
            output: recipe.result_item_name ?? `Item ${recipe.output_id}`,
            outputId: recipe.output_id,
            resultCount: Number(recipe.result_count ?? 1),
            exp: Number(recipe.craft_exp ?? 0),
            mesoCost: Number(recipe.meso_cost ?? 0),
            materials,
          });
        }
      }
    }
  }

  return { recipes, materials: [...materialMap.values()], professions };
}

function normalizeAppItems(items) {
  return safeArray(items).map((item) => ({
    ...item,
    id: String(item.id),
    reqLevel: Number(item.stats?.reqLevel ?? 0),
    reqJob: Number(item.stats?.reqJob ?? 0),
    reqSTR: Number(item.stats?.reqSTR ?? 0),
    reqDEX: Number(item.stats?.reqDEX ?? 0),
    reqINT: Number(item.stats?.reqINT ?? 0),
    reqLUK: Number(item.stats?.reqLUK ?? 0),
    incPAD: Number(item.stats?.incPAD ?? 0),
    incMAD: Number(item.stats?.incMAD ?? 0),
    incACC: Number(item.stats?.incACC ?? item.stats?.incACCr ?? 0),
    incSpeed: Number(item.stats?.incSpeed ?? 0),
    thumbnail: item.thumbnail ? appDataPath(`AppData/${item.thumbnail}`) : appItemIconPath(item.id),
  }));
}

function normalizeAppSkillGroups(rawSkillData) {
  const normalizedGroups = [];

  for (const [baseClass, node] of Object.entries(rawSkillData ?? {})) {
    for (const group of collectSkillGroups(node)) {
      const skills = safeArray(group.skills).map((skill) => ({
        ...skill,
        id: String(skill.id),
        maxLevel: Number(skill.max_level ?? skill.maxLevel ?? 0),
        thumbnail: skill.thumbnail ? appDataPath(`AppData/${skill.thumbnail}`) : appSkillIconPath(skill.id),
      }));

      if (!skills.length) continue;
      normalizedGroups.push({
        baseClass,
        className: group.class_name ?? group.className ?? group.name ?? baseClass,
        job: group.job ?? group.job_name ?? '',
        mainClass: group.main_class ?? group.mainClass ?? '',
        baseClassLabel: group.base_class ?? group.baseClass ?? baseClass,
        subclasses: safeArray(group.subclasses),
        skills,
      });
    }
  }

  return normalizedGroups;
}

function collectSkillGroups(node) {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(collectSkillGroups);
  if (typeof node !== 'object') return [];
  if (Array.isArray(node.skills)) return [node];

  const candidateKeys = ['groups', 'jobs', 'classes', 'data', 'children'];
  for (const key of candidateKeys) {
    if (node[key]) {
      const nested = collectSkillGroups(node[key]);
      if (nested.length) return nested;
    }
  }

  return Object.values(node).flatMap((value) => collectSkillGroups(value));
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'object') return Object.values(value);
  return [];
}

function parseElements(elements) {
  if (!elements) return { weak: [], resist: [] };
  if (Array.isArray(elements)) return { weak: elements, resist: [] };
  if (typeof elements === 'string') {
    return { weak: elements.split(/[;,/|]/).map((item) => item.trim()).filter(Boolean), resist: [] };
  }
  return { weak: elements.weak ?? elements.weakness ?? [], resist: elements.resist ?? elements.resistance ?? [] };
}

function slugify(value) {
  return String(value ?? 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function normalizeLookups(raw) {
  const out = { items: {}, monsters: {}, maps: {}, skills: {}, quests: {} };
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

function normalizeCmsLookupId(value) {
  const raw = String(value ?? '').trim().replace(/\.0$/, '').replace(/\.img$/i, '');
  const digits = raw.match(/\d+/g)?.join('') ?? raw;
  return digits.replace(/^0+(?=\d)/, '') || digits || raw;
}

function lookupCandidates(id, bucket = '') {
  const raw = String(id ?? '').trim().replace(/\.0$/, '').replace(/\.img$/i, '');
  const normalized = normalizeCmsLookupId(raw);
  const widths = { items: 8, monsters: 7, maps: 9, skills: 7, quests: 5 };
  const candidates = [id, raw, normalized, Number(raw), Number(normalized)];
  if (/^\d+$/.test(normalized) && widths[bucket]) candidates.push(normalized.padStart(widths[bucket], '0'));
  return [...new Set(candidates.filter((value) => value !== undefined && value !== null && value !== '' && !Number.isNaN(value)))];
}

function lookupName(lookups, bucket, id, fallback) {
  const table = lookups?.[bucket] ?? {};
  for (const key of lookupCandidates(id, bucket)) {
    const item = table[key];
    if (item === undefined || item === null) continue;
    if (typeof item === 'string') return item;
    const name = read(item, ['name', 'zh', 'cn', 'displayName', 'label', 'title'], '');
    if (name) return name;
  }
  return fallback;
}

function cleanCmsDisplayName(value, prefix, id) {
  const raw = String(value ?? '').trim();
  const normalizedId = normalizeCmsLookupId(id);
  const bad = !raw
    || raw === '0'
    || raw === String(id)
    || raw === normalizedId
    || /^0?\d+(\.img)?$/i.test(raw)
    || /(^|\/)0?\d+\.img$/i.test(raw);
  return bad ? `${prefix} ${normalizedId || id}` : raw;
}

function normalizeCmsItems(items, lookups) {
  return items.map((item) => {
    const id = String(read(item, ['id', 'itemId', 'item_id', 'code'], '')).replace(/\.0$/, '');
    const padded = padItemId(id);
    const name = cleanCmsDisplayName(text(item, ['name', 'displayName', 'label', 'title'], lookupName(lookups, 'items', id, `Item ${id}`)), '物品', id);
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
      thumbnail: thumbnail ? appDataPath(thumbnail) : cmsItemIconPath(id),
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

function normalizeCmsMonsters(monsters, lookups) {
  return monsters.map((monster) => {
    const id = String(read(monster, ['id', 'mobId', 'monsterId', 'code'], '')).replace(/\.0$/, '').replace(/\.img$/i, '');
    const level = num(monster, ['level', 'lv'], 1);
    const avoid = num(monster, ['eva', 'avoid', 'avoidability'], 0);
    const thumbnail = text(monster, ['thumbnail', 'icon', 'image'], '');
    const mapRefs = read(monster, ['maps', 'mapIds', 'spawns'], []);
    const name = cleanCmsDisplayName(text(monster, ['name', 'displayName', 'label', 'title', 'zh', 'cn'], lookupName(lookups, 'monsters', id, `Monster ${id}`)), '怪物', id);

    return {
      ...monster,
      id,
      rawId: id,
      name,
      title: name,
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

function isChinaBetaMapId(value) {
  const id = Number(normalizeCmsLookupId(value));
  return Number.isFinite(id) && CHINA_BETA_MAP_ID_RANGES.some(([min, max]) => id >= min && id <= max);
}

function searchableText(value, depth = 0) {
  if (value === null || value === undefined || depth > 4) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map((item) => searchableText(item, depth + 1)).join(' ');
  return Object.entries(value)
    .filter(([key]) => !/thumbnail|icon|image|canvas|frame|png|audio|sound/i.test(key))
    .map(([, item]) => searchableText(item, depth + 1))
    .join(' ');
}

function isChinaBetaMapCandidate(map, lookups) {
  const id = read(map, ['id', 'mapId', 'code', 'rawId'], '');
  if (isChinaBetaMapId(id)) return true;
  const haystack = [
    text(map, ['name', 'displayName', 'streetName', 'street_name', 'region', 'continent'], ''),
    lookupName(lookups, 'maps', id, ''),
    searchableText(map),
  ].join(' ');
  return CHINA_BETA_AREA_PATTERNS.some((pattern) => pattern.test(haystack));
}

function addIdVariants(set, id) {
  if (id === undefined || id === null || id === '') return;
  set.add(String(id).replace(/\.0$/, '').replace(/\.img$/i, ''));
  set.add(normalizeCmsLookupId(id));
}

function hasIdVariant(set, id) {
  return set.has(String(id).replace(/\.0$/, '').replace(/\.img$/i, '')) || set.has(normalizeCmsLookupId(id));
}

function getRawMapMonsterRefs(map) {
  return normalizeMapMonsterRefs(read(map, ['monsters', 'mobs', 'spawns', 'life'], []));
}

function collectRawMapMonsterIds(map, out) {
  for (const ref of getRawMapMonsterRefs(map)) addIdVariants(out, ref.id);
}

function filterRawMapMonsterRefs(map, allowedMonsterIds) {
  const next = { ...map };
  for (const key of ['monsters', 'mobs', 'spawns', 'life']) {
    const value = next[key];
    if (Array.isArray(value)) {
      next[key] = value.filter((entry) => {
        const id = typeof entry === 'object' ? read(entry, ['id', 'mobId', 'monsterId'], '') : entry;
        return hasIdVariant(allowedMonsterIds, id);
      });
    } else if (value && typeof value === 'object') {
      next[key] = Object.fromEntries(Object.entries(value).filter(([id, entry]) => hasIdVariant(allowedMonsterIds, read(entry, ['id', 'mobId', 'monsterId'], id))));
    }
  }
  return next;
}

function filterMonsterMapRefs(monster, allowedMapIds) {
  const maps = safeArray(monster.maps).filter((ref) => allowedMapIds.has(Number(ref.id)) || isChinaBetaMapId(ref.id));
  return { ...monster, maps };
}

function scopeCmsChinaBetaWorld(mapsRaw, monsters, lookups) {
  const mapRecords = recordsFromRegions(mapsRaw).filter(Boolean);
  const allowedMaps = mapRecords.filter((map) => isChinaBetaMapCandidate(map, lookups));
  const allowedMapIds = new Set(allowedMaps.map((map) => Number(read(map, ['id', 'mapId', 'code', 'rawId'], 0))).filter(Number.isFinite));

  const monsterIdsFromAllowedMaps = new Set();
  for (const map of allowedMaps) collectRawMapMonsterIds(map, monsterIdsFromAllowedMaps);

  const scopedMonsters = monsters.map((monster) => filterMonsterMapRefs(monster, allowedMapIds)).filter((monster) => {
    if (monster.level > CHINA_BETA_MAX_LEVEL) return false;
    return monster.maps.length > 0 || hasIdVariant(monsterIdsFromAllowedMaps, monster.id);
  });

  const allowedMonsterIds = new Set();
  for (const monster of scopedMonsters) addIdVariants(allowedMonsterIds, monster.id);

  const scopedRawMaps = allowedMaps.map((map) => filterRawMapMonsterRefs(map, allowedMonsterIds));

  const scopedMaps = normalizeCmsMaps(scopedRawMaps, scopedMonsters, lookups)
    .filter((map) => isChinaBetaMapCandidate(map, lookups) && map.levelRange[0] <= CHINA_BETA_MAX_LEVEL);

  const monsterIdsInMaps = new Set();
  for (const map of scopedMaps) {
    for (const monster of map.monsterDetails) addIdVariants(monsterIdsInMaps, monster.id);
  }

  const usedMapIds = new Set(scopedMaps.map((map) => Number(map.rawId)));
  const monstersInScope = scopedMonsters.filter((monster) => {
    if (hasIdVariant(monsterIdsInMaps, monster.id)) return true;
    return safeArray(monster.maps).some((ref) => usedMapIds.has(Number(ref.id)));
  });

  return { monsters: monstersInScope, maps: scopedMaps };
}

function normalizeCmsMaps(mapsRaw, monsters, lookups) {
  const monsterById = new Map(monsters.flatMap((monster) => lookupCandidates(monster.id, 'monsters').map((id) => [String(id), monster])));
  const maps = recordsFromRegions(mapsRaw).map((map) => normalizeMap(map, monsterById, lookups)).filter(Boolean);
  const mapById = new Map(maps.map((map) => [Number(map.rawId), map]));

  for (const monster of monsters) {
    for (const ref of monster.maps ?? []) {
      if (!mapById.has(Number(ref.id))) {
        const normalizedMap = normalizeMap({ id: ref.id, name: ref.name, monsters: [] }, monsterById, lookups);
        if (normalizedMap) mapById.set(Number(ref.id), normalizedMap);
      }
      const map = mapById.get(Number(ref.id));
      if (!map) continue;
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
  const refs = normalizeMapMonsterRefs(read(map, ['monsters', 'mobs', 'spawns', 'life'], []));
  const mapName = cleanCmsDisplayName(text(map, ['name', 'displayName', 'street_name'], lookupName(lookups, 'maps', id, `Map ${id}`)), '地图', id);
  return {
    ...map,
    id,
    rawId: Number(id),
    name: mapName,
    streetName: text(map, ['streetName', 'street_name'], ''),
    region: text(map, ['region', 'continent'], '国服'),
    isTown: bool(map, ['isTown', 'is_town', 'town']),
    mobRate: num(map, ['mobRate', 'mob_rate'], 1),
    thumbnail: thumbnail ? appDataPath(thumbnail) : null,
    minimap: thumbnail ? appDataPath(thumbnail) : null,
    monsterDetails: refs.map((ref) => {
      const monster = monsterById.get(String(ref.id)) ?? monsterById.get(String(normalizeCmsLookupId(ref.id)));
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

function normalizeCmsQuests(quests, lookups) {
  return quests.map((quest) => {
    const id = String(read(quest, ['id', 'questId', 'quest_id', 'code'], '')).replace(/\.0$/, '');
    const minLevel = num(quest, ['minLevel', 'reqLevel', 'startLevel', 'level', 'info.level'], 1);
    const rawMaxLevel = num(quest, ['maxLevel', 'levelMax', 'endLevel', 'requiredMaxLevel'], CHINA_BETA_MAX_LEVEL);
    const maxLevel = Math.min(rawMaxLevel || CHINA_BETA_MAX_LEVEL, CHINA_BETA_MAX_LEVEL);
    const name = cleanCmsDisplayName(text(quest, ['name', 'displayName', 'label', 'title'], lookupName(lookups, 'quests', id, `Quest ${id}`)), '任务', id);

    return {
      ...quest,
      id,
      name,
      title: name,
      level: minLevel,
      minLevel,
      maxLevel,
    };
  }).filter((quest) => quest.id && quest.minLevel <= CHINA_BETA_MAX_LEVEL);
}

function normalizeCmsSkillGroups(skills, lookups) {
  const rows = skills.map((skill) => {
    const id = String(read(skill, ['id', 'skillId', 'code'], '')).replace(/\.0$/, '');
    const jobKey = text(skill, ['job', 'jobName', 'className'], '') || JOB_BY_SKILL_PREFIX[id.slice(0, 3)] || 'unknown';
    const thumbnail = text(skill, ['thumbnail', 'icon', 'image'], '');
    return {
      ...skill,
      id,
      name: cleanCmsDisplayName(text(skill, ['name', 'displayName', 'label'], lookupName(lookups, 'skills', id, `Skill ${id}`)), '技能', id),
      maxLevel: num(skill, ['maxLevel', 'max_level', 'max'], 0),
      thumbnail: thumbnail ? appDataPath(thumbnail) : cmsSkillIconPath(id),
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
