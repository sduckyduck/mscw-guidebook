const STAT_LABELS = [
  ['incSTR', '力量'], ['incDEX', '敏捷'], ['incINT', '智力'], ['incLUK', '运气'],
  ['incMHP', '最大 HP'], ['incMMP', '最大 MP'], ['incPAD', '武器攻击力'], ['incMAD', '魔法攻击力'],
  ['incPDD', '物理防御力'], ['incMDD', '魔法防御力'], ['incACC', '命中率'], ['incEVA', '回避率'],
  ['incSpeed', '移动速度'], ['incJump', '跳跃力'], ['attackSpeedLabel', '攻击速度'], ['tuc', '可升级次数'],
];

const REQUIREMENT_LABELS = [
  ['reqLevel', '等级'], ['reqSTR', '力量'], ['reqDEX', '敏捷'], ['reqINT', '智力'], ['reqLUK', '运气'],
];

const JOB_LABELS = [
  [1, '战士'], [2, '魔法师'], [4, '弓箭手'], [8, '飞侠'], [16, '海盗'],
];

const JOB_NAME_MAP = {
  all: '全职业',
  common: '新手',
  beginner: '新手',
  warrior: '战士',
  magician: '魔法师',
  mage: '魔法师',
  bowman: '弓箭手',
  thief: '飞侠',
  pirate: '海盗',
};

const TYPE_LABEL_MAP = {
  Equipment: '装备',
  Weapon: '武器',
  Armor: '防具',
  Claw: '拳套',
  Dagger: '短刀',
  Bow: '弓',
  Crossbow: '弩',
  Wand: '短杖',
  Staff: '长杖',
  '1H Sword': '单手剑',
  '2H Sword': '双手剑',
  Sword: '剑',
  Axe: '斧',
  Blunt: '钝器',
  Spear: '枪',
  Polearm: '长枪',
  Gun: '枪械',
  Knuckle: '指节',
  Hat: '帽子',
  Top: '上衣',
  Bottom: '裤裙',
  Overall: '套服',
  Shoes: '鞋子',
  Glove: '手套',
  Shield: '盾牌',
  Cape: '披风',
  Accessory: '饰品',
};

const SPEED_LABEL_MAP = {
  Fast: '快',
  Faster: '更快',
  Normal: '普通',
  Slow: '慢',
  Slower: '较慢',
  'Very Fast': '非常快',
  'Very Slow': '非常慢',
};

let clickTimer = null;
let bypassNextClick = false;
let itemIndexPromiseByEdition = new Map();

function normalize(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
}

function readNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function readPath(obj, path, fallback = undefined) {
  const parts = String(path).split('.');
  let node = obj;
  for (const part of parts) node = node?.[part];
  return node === undefined || node === null || node === '' ? fallback : node;
}

function readAny(obj, keys, fallback = undefined) {
  for (const key of keys) {
    const value = readPath(obj, key);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function readField(item, key) {
  return item?.[key] ?? item?.stats?.[key] ?? item?.info?.[key];
}

function getActiveEditionId() {
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

function getDataSourceLabel(editionId = getActiveEditionId()) {
  return editionId === 'china' ? '国服 CMS' : '国际服 AppData';
}

function translateJobName(value = '') {
  const normalized = normalize(value);
  return JOB_NAME_MAP[normalized] ?? String(value || '全职业');
}

function translateType(value = '') {
  const raw = String(value || 'Equipment');
  return TYPE_LABEL_MAP[raw]
    ?? TYPE_LABEL_MAP[Object.keys(TYPE_LABEL_MAP).find((key) => normalize(key) === normalize(raw))]
    ?? raw;
}

function translateSpeed(value = '') {
  const raw = String(value || '');
  return SPEED_LABEL_MAP[raw] ?? raw;
}

function padItemId(id) {
  return String(id ?? '').replace(/\.0$/, '').padStart(8, '0');
}

function unpadItemId(id) {
  return String(id ?? '').replace(/\.0$/, '').replace(/^0+/, '') || String(id ?? '');
}

function getDisplayName(item) {
  return item?.title ?? item?.name ?? item?.itemName ?? item?.displayName ?? item?.id ?? '未知装备';
}

function getSlot(tile) {
  return normalize(tile?.querySelector('span')?.textContent ?? '');
}

function getItemName(tile) {
  return String(tile?.querySelector('strong')?.textContent ?? '')
    .replace(/点击换.*/, '')
    .replace(/未装备.*/, '')
    .trim();
}

function getItemIcon(tile) {
  const img = tile?.querySelector('img');
  return img?.src ?? '';
}

function getItemIdFromTile(tile) {
  const explicit = tile?.dataset?.itemId ?? tile?.getAttribute?.('data-item-id');
  if (explicit) return unpadItemId(explicit);
  const icon = getItemIcon(tile);
  const match = icon.match(/(\d{7,8})(?:\.png|\.gif|\.webp|$)/i);
  return match ? unpadItemId(match[1]) : '';
}

function detectType(item, fallbackSlot = '') {
  return item?.weaponType
    ?? item?.weapon_type
    ?? item?.sub_category
    ?? item?.subCategory
    ?? item?.type
    ?? item?.categoryName
    ?? item?.slot
    ?? fallbackSlot
    ?? 'Equipment';
}

function getJobClasses(item) {
  const label = item?.reqJobLabel ?? item?.req_job_label;
  if (label && String(label).toLowerCase() !== 'all') return [translateJobName(label)];

  const reqJob = readNumber(item?.reqJob ?? item?.req_job ?? item?.stats?.reqJob ?? item?.info?.reqJob ?? item?.job);
  if (!reqJob) return ['新手'];

  const jobs = JOB_LABELS.filter(([bit]) => (reqJob & bit) === bit).map(([, name]) => name);
  return jobs.length ? jobs : ['新手'];
}

function getRequirementRows(item) {
  const rows = REQUIREMENT_LABELS
    .map(([key, label]) => [label, readField(item, key)])
    .filter(([, value]) => value !== undefined && value !== null && value !== '' && readNumber(value) !== 0);

  rows.unshift(['职业', getJobClasses(item).join(', ')]);
  return rows;
}

function getStatRows(item) {
  const rows = [];
  for (const [key, label] of STAT_LABELS) {
    const value = readField(item, key);
    if (value === undefined || value === null || value === '') continue;

    if (key === 'attackSpeedLabel') {
      rows.push([label, translateSpeed(value)]);
      continue;
    }

    const numeric = readNumber(value);
    if (!numeric) continue;
    const display = key === 'tuc' ? String(numeric) : `${numeric > 0 ? '+' : ''}${numeric}`;
    rows.push([label, display]);
  }
  return rows;
}

function buildDescription(item) {
  return item?.description ?? item?.desc ?? item?.flavorText ?? '';
}

function normalizeItemForDisplay(item, fallbackSlot = '', sourceLabel = getDataSourceLabel()) {
  if (!item) return null;
  return {
    id: unpadItemId(item.id ?? item.itemId ?? item.item_id ?? item.code ?? ''),
    name: getDisplayName(item),
    sourceLabel,
    type: translateType(detectType(item, fallbackSlot)),
    reqRows: getRequirementRows(item),
    statRows: getStatRows(item),
    description: buildDescription(item),
  };
}

function getFallbackItem(tile) {
  const slot = getSlot(tile);
  const name = getItemName(tile) || '空装备栏';
  const id = getItemIdFromTile(tile);
  return {
    id,
    name,
    sourceLabel: getDataSourceLabel(),
    type: translateType(slot || 'Equipment'),
    reqRows: [['职业', '未知']],
    statRows: [],
    description: id ? `没有在当前版本数据源中找到 ID ${id} 的详细资料。` : '暂无该装备的详细资料。',
  };
}

function objectRecords(raw, keys = []) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
  }
  const values = Object.values(raw);
  if (values.every((value) => value && typeof value === 'object' && !Array.isArray(value))) return values;
  return [];
}

function lookupName(lookups, id, fallback) {
  const tables = [lookups?.items, lookups?.item, lookups?.itemsById, lookups?.itemById].filter(Boolean);
  for (const table of tables) {
    const row = table[id] ?? table[padItemId(id)] ?? table[unpadItemId(id)];
    if (!row) continue;
    if (typeof row === 'string') return row;
    return readAny(row, ['zh', 'cn', 'name', 'displayName', 'label'], fallback) ?? fallback;
  }
  return fallback;
}

function detectSlotFromId(id) {
  const value = padItemId(id);
  if (value.startsWith('0100')) return 'Hat';
  if (value.startsWith('0103')) return 'Accessory';
  if (value.startsWith('0104')) return 'Top';
  if (value.startsWith('0105')) return 'Overall';
  if (value.startsWith('0106')) return 'Bottom';
  if (value.startsWith('0107')) return 'Shoes';
  if (value.startsWith('0108')) return 'Glove';
  if (value.startsWith('0109')) return 'Shield';
  if (value.startsWith('0110')) return 'Cape';
  if (/^01(3|4|5|6|7)/.test(value)) return 'Weapon';
  return 'Equipment';
}

function normalizeCmsItem(item, lookups = {}) {
  const id = unpadItemId(readAny(item, ['id', 'itemId', 'item_id', 'code'], ''));
  const stats = item.stats ?? item.info ?? item;
  const name = readAny(item, ['name', 'displayName', 'label', 'title'], lookupName(lookups, id, `Item ${id}`));
  const reqJob = readNumber(readAny(stats, ['reqJob', 'req_job', 'job'], readAny(item, ['reqJob', 'req_job', 'job'], 0)));
  const type = readAny(item, ['weaponType', 'weapon_type', 'type', 'subCategory', 'sub_category', 'categoryName'], detectSlotFromId(id));

  return {
    ...item,
    id,
    title: name,
    name,
    category: 'Equipment',
    sub_category: detectSlotFromId(id) === 'Weapon' ? 'Weapon' : 'Armor',
    weaponType: type,
    weapon_type: type,
    reqJob,
    reqJobLabel: readAny(item, ['reqJobLabel', 'req_job_label'], reqJob ? '' : 'All'),
    reqLevel: readNumber(readAny(stats, ['reqLevel', 'req_level', 'level'], readAny(item, ['reqLevel', 'req_level', 'level'], 0))),
    reqSTR: readNumber(readAny(stats, ['reqSTR', 'req_str', 'str'], 0)),
    reqDEX: readNumber(readAny(stats, ['reqDEX', 'req_dex', 'dex'], 0)),
    reqINT: readNumber(readAny(stats, ['reqINT', 'req_int', 'int'], 0)),
    reqLUK: readNumber(readAny(stats, ['reqLUK', 'req_luk', 'luk'], 0)),
    incSTR: readNumber(readAny(stats, ['incSTR', 'str'], 0)),
    incDEX: readNumber(readAny(stats, ['incDEX', 'dex'], 0)),
    incINT: readNumber(readAny(stats, ['incINT', 'int'], 0)),
    incLUK: readNumber(readAny(stats, ['incLUK', 'luk'], 0)),
    incMHP: readNumber(readAny(stats, ['incMHP', 'mhp', 'hp', 'incHP'], 0)),
    incMMP: readNumber(readAny(stats, ['incMMP', 'mmp', 'mp', 'incMP'], 0)),
    incPAD: readNumber(readAny(stats, ['incPAD', 'pad', 'watk', 'attack', 'weaponAttack'], 0)),
    incMAD: readNumber(readAny(stats, ['incMAD', 'mad', 'matk', 'magicAttack'], 0)),
    incPDD: readNumber(readAny(stats, ['incPDD', 'pdd', 'wdef', 'defense'], 0)),
    incMDD: readNumber(readAny(stats, ['incMDD', 'mdd', 'magicDefense'], 0)),
    incACC: readNumber(readAny(stats, ['incACC', 'acc', 'accuracy'], 0)),
    incEVA: readNumber(readAny(stats, ['incEVA', 'eva', 'avoid', 'avoidability'], 0)),
    incSpeed: readNumber(readAny(stats, ['incSpeed', 'speed'], 0)),
    incJump: readNumber(readAny(stats, ['incJump', 'jump'], 0)),
    tuc: readNumber(readAny(stats, ['tuc', 'slots', 'upgradeSlots'], 0)),
    stats,
  };
}

async function fetchJsonSafe(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchItemsPayload(editionId = getActiveEditionId()) {
  if (editionId === 'china') {
    const [itemsPayload, lookupsPayload] = await Promise.all([
      fetchJsonSafe('/cms/items.json'),
      fetchJsonSafe('/cms/lookups.json'),
    ]);
    const items = objectRecords(itemsPayload, ['items', 'equipment', 'equips', 'data']).map((item) => normalizeCmsItem(item, lookupsPayload ?? {}));
    return { items, sourceLabel: '国服 CMS' };
  }

  const candidates = ['./AppData/items.json', '/AppData/items.json', 'AppData/items.json'];
  for (const url of candidates) {
    const payload = await fetchJsonSafe(url);
    if (!payload) continue;
    const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    if (items.length) return { items, sourceLabel: '国际服 AppData' };
  }
  return { items: [], sourceLabel: getDataSourceLabel(editionId) };
}

function buildItemIndex({ items = [], sourceLabel = getDataSourceLabel() }) {
  const byName = new Map();
  const byId = new Map();
  for (const item of items) {
    if (String(item?.category ?? '').toLowerCase() !== 'equipment') continue;
    const id = unpadItemId(item.id ?? item.itemId ?? item.item_id ?? item.code ?? '');
    if (id) {
      byId.set(id, item);
      byId.set(padItemId(id), item);
    }
    const names = [item.name, item.title, item.itemName, item.displayName].filter(Boolean);
    for (const name of names) {
      const key = normalize(name);
      if (key && !byName.has(key)) byName.set(key, item);
    }
  }
  return { items, byName, byId, sourceLabel };
}

function getItemIndex() {
  const editionId = getActiveEditionId();
  if (!itemIndexPromiseByEdition.has(editionId)) {
    itemIndexPromiseByEdition.set(editionId, fetchItemsPayload(editionId).then(buildItemIndex));
  }
  return itemIndexPromiseByEdition.get(editionId);
}

function findBestItem(index, name, id = '') {
  const cleanId = unpadItemId(id);
  if (cleanId && index.byId.has(cleanId)) return index.byId.get(cleanId);
  if (cleanId && index.byId.has(padItemId(cleanId))) return index.byId.get(padItemId(cleanId));

  const key = normalize(name);
  if (!key) return null;
  if (index.byName.has(key)) return index.byName.get(key);

  let best = null;
  let bestScore = 0;
  for (const item of index.items) {
    const itemName = normalize(getDisplayName(item));
    if (!itemName) continue;
    const score = itemName === key ? 100
      : itemName.includes(key) ? key.length / itemName.length * 80
        : key.includes(itemName) ? itemName.length / key.length * 70
          : 0;
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore >= 35 ? best : null;
}

async function getItemFromTile(tile) {
  const name = getItemName(tile);
  const id = getItemIdFromTile(tile);
  const index = await getItemIndex();
  const matched = findBestItem(index, name, id);
  return normalizeItemForDisplay(matched, getSlot(tile), index.sourceLabel) ?? getFallbackItem(tile);
}

function removeSheet() {
  document.querySelector('.mg-item-inspect-backdrop')?.remove();
}

function infoRow([label, value]) {
  return `<div class="mg-item-inspect-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderLoadingSheet(iconSrc = '') {
  renderItemSheet({
    name: '读取中...',
    sourceLabel: getDataSourceLabel(),
    type: '装备',
    reqRows: [],
    statRows: [],
    description: '',
  }, iconSrc);
}

function renderItemSheet(item, iconSrc = '') {
  removeSheet();
  const requirements = item.reqRows?.length
    ? item.reqRows.map(infoRow).join('')
    : '<p class="mg-item-inspect-muted">无装备需求。</p>';
  const stats = item.statRows?.length
    ? item.statRows.map(infoRow).join('')
    : '<p class="mg-item-inspect-muted">无额外属性。</p>';
  const idText = item.id ? `ID ${item.id}` : 'ID 未识别';
  const backdrop = document.createElement('div');
  backdrop.className = 'mg-item-inspect-backdrop';
  backdrop.innerHTML = `
    <section class="mg-item-inspect-card" role="dialog" aria-modal="true">
      <button class="mg-item-inspect-close" type="button" aria-label="关闭">关闭</button>
      <div class="mg-item-inspect-titlebar">装备</div>
      <div class="mg-item-inspect-top">
        <div class="mg-item-inspect-icon">${iconSrc ? `<img src="${escapeHtml(iconSrc)}" alt="" />` : '<span>?</span>'}</div>
        <div>
          <h2>${escapeHtml(item.name)}</h2>
          <p>${escapeHtml(item.type ?? '装备')} · ${escapeHtml(idText)} · ${escapeHtml(item.sourceLabel ?? getDataSourceLabel())}</p>
        </div>
      </div>
      <div class="mg-item-inspect-section compact">
        <h3>装备需求</h3>
        <div class="mg-item-inspect-rows">${requirements}</div>
      </div>
      <div class="mg-item-inspect-section compact">
        <h3>装备属性</h3>
        <div class="mg-item-inspect-rows">${stats}</div>
      </div>
      ${item.description ? `<p class="mg-item-inspect-desc">${escapeHtml(item.description)}</p>` : ''}
      <div class="mg-item-inspect-help">点击一次查看属性 · 双击更换装备</div>
    </section>
  `;
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop || event.target.closest('.mg-item-inspect-close')) removeSheet();
  });
  document.body.appendChild(backdrop);
}

function openPicker(tile) {
  bypassNextClick = true;
  removeSheet();
  tile.click();
  window.setTimeout(() => { bypassNextClick = false; }, 0);
}

function handleTileClick(event) {
  const tile = event.target?.closest?.('.mg-equip-tile');
  if (!tile) return;
  if (bypassNextClick) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();

  if (clickTimer) {
    window.clearTimeout(clickTimer);
    clickTimer = null;
    openPicker(tile);
    return;
  }

  clickTimer = window.setTimeout(async () => {
    clickTimer = null;
    const iconSrc = getItemIcon(tile);
    renderLoadingSheet(iconSrc);
    const item = await getItemFromTile(tile);
    renderItemSheet(item, iconSrc);
  }, 240);
}

function handleKey(event) {
  if (event.key === 'Escape') removeSheet();
}

function installEquipmentSlotInspect() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwEquipmentSlotInspectInstalled) return;
  window.__mscwEquipmentSlotInspectInstalled = true;
  document.addEventListener('click', handleTileClick, true);
  document.addEventListener('keydown', handleKey);
}

installEquipmentSlotInspect();
