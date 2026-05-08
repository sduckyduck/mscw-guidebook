const STAT_LABELS = [
  ['incSTR', 'STR'], ['incDEX', 'DEX'], ['incINT', 'INT'], ['incLUK', 'LUK'],
  ['incMHP', 'Max HP'], ['incMMP', 'Max MP'], ['incPAD', 'Weapon Attack'], ['incMAD', 'Magic Attack'],
  ['incPDD', 'Weapon Defense'], ['incMDD', 'Magic Defense'], ['incACC', 'Accuracy'], ['incEVA', 'Avoidability'],
  ['incSpeed', 'Speed'], ['incJump', 'Jump'], ['attackSpeedLabel', 'Attack Speed'], ['tuc', 'Slots'],
];

const REQUIREMENT_LABELS = [
  ['reqLevel', 'Level'], ['reqSTR', 'STR'], ['reqDEX', 'DEX'], ['reqINT', 'INT'], ['reqLUK', 'LUK'],
];

const JOB_LABELS = [
  [1, 'Warrior'], [2, 'Magician'], [4, 'Bowman'], [8, 'Thief'], [16, 'Pirate'],
];

let clickTimer = null;
let bypassNextClick = false;
let itemIndexPromise = null;

function normalize(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function readNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function readField(item, key) {
  return item?.[key] ?? item?.stats?.[key];
}

function getDisplayName(item) {
  return item?.title ?? item?.name ?? item?.itemName ?? item?.id ?? 'Unknown Item';
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

function detectType(item, fallbackSlot = '') {
  return item?.weaponType
    ?? item?.weapon_type
    ?? item?.sub_category
    ?? item?.subCategory
    ?? item?.slot
    ?? fallbackSlot
    ?? 'Equipment';
}

function getJobClasses(item) {
  const label = item?.reqJobLabel ?? item?.req_job_label;
  if (label && String(label).toLowerCase() !== 'all') return [String(label)];

  const reqJob = readNumber(item?.reqJob ?? item?.req_job ?? item?.stats?.reqJob);
  if (!reqJob) return ['Common'];

  const jobs = JOB_LABELS.filter(([bit]) => (reqJob & bit) === bit).map(([, name]) => name);
  return jobs.length ? jobs : ['Common'];
}

function getRequirementRows(item) {
  const rows = REQUIREMENT_LABELS
    .map(([key, label]) => [label, readField(item, key)])
    .filter(([, value]) => value !== undefined && value !== null && value !== '' && readNumber(value) !== 0);

  rows.unshift(['Job', getJobClasses(item).join(', ')]);
  return rows;
}

function getStatRows(item) {
  const rows = [];
  for (const [key, label] of STAT_LABELS) {
    const value = readField(item, key);
    if (value === undefined || value === null || value === '') continue;

    if (key === 'attackSpeedLabel') {
      rows.push([label, String(value)]);
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

function normalizeItemForDisplay(item, fallbackSlot = '') {
  if (!item) return null;
  return {
    id: item.id,
    name: getDisplayName(item),
    type: detectType(item, fallbackSlot),
    reqRows: getRequirementRows(item),
    statRows: getStatRows(item),
    description: buildDescription(item),
  };
}

function getFallbackItem(tile) {
  const slot = getSlot(tile);
  const name = getItemName(tile) || 'Empty Slot';
  return {
    name,
    type: slot || 'Equipment',
    reqRows: [['Job', 'Unknown']],
    statRows: [],
    description: 'No item details available.',
  };
}

async function fetchItemsPayload() {
  const candidates = ['./AppData/items.json', '/AppData/items.json', 'AppData/items.json'];

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload)) return payload;
    } catch {
      // Try the next path.
    }
  }
  return [];
}

function buildItemIndex(items = []) {
  const byName = new Map();
  for (const item of items) {
    if (String(item?.category ?? '').toLowerCase() !== 'equipment') continue;
    const names = [item.name, item.title, item.itemName].filter(Boolean);
    for (const name of names) {
      const key = normalize(name);
      if (key && !byName.has(key)) byName.set(key, item);
    }
  }
  return { items, byName };
}

function getItemIndex() {
  if (!itemIndexPromise) itemIndexPromise = fetchItemsPayload().then(buildItemIndex);
  return itemIndexPromise;
}

function findBestItem(index, name) {
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
  const index = await getItemIndex();
  const matched = findBestItem(index, name);
  return normalizeItemForDisplay(matched, getSlot(tile)) ?? getFallbackItem(tile);
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
    name: 'Loading...',
    type: 'Equipment',
    reqRows: [],
    statRows: [],
    description: '',
  }, iconSrc);
}

function renderItemSheet(item, iconSrc = '') {
  removeSheet();
  const requirements = item.reqRows?.length
    ? item.reqRows.map(infoRow).join('')
    : '<p class="mg-item-inspect-muted">No requirements.</p>';
  const stats = item.statRows?.length
    ? item.statRows.map(infoRow).join('')
    : '<p class="mg-item-inspect-muted">No bonus stats.</p>';
  const backdrop = document.createElement('div');
  backdrop.className = 'mg-item-inspect-backdrop';
  backdrop.innerHTML = `
    <section class="mg-item-inspect-card" role="dialog" aria-modal="true">
      <button class="mg-item-inspect-close" type="button" aria-label="Close">关闭</button>
      <div class="mg-item-inspect-titlebar">Equipment</div>
      <div class="mg-item-inspect-top">
        <div class="mg-item-inspect-icon">${iconSrc ? `<img src="${escapeHtml(iconSrc)}" alt="" />` : '<span>?</span>'}</div>
        <div>
          <h2>${escapeHtml(item.name)}</h2>
          <p>${escapeHtml(item.type ?? 'Equipment')}</p>
        </div>
      </div>
      <div class="mg-item-inspect-section compact">
        <h3>Requirements</h3>
        <div class="mg-item-inspect-rows">${requirements}</div>
      </div>
      <div class="mg-item-inspect-section compact">
        <h3>Stats</h3>
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
