const SLOT_CLASS_MAP = {
  weapon: ['Bowman'],
  cap: ['Common'],
  overall: ['Common'],
  top: ['Common'],
  bottom: ['Common'],
  shoes: ['Common'],
  glove: ['Common'],
  shield: ['Common'],
  cape: ['Common'],
  earring: ['Common'],
};

const KNOWN_ITEMS = [
  {
    key: 'ryden',
    name: 'Ryden',
    type: 'Bow',
    reqLevel: 30,
    reqSTR: 30,
    reqDEX: 65,
    classes: ['Bowman'],
    stats: [
      ['Weapon Attack', '+50'],
      ['STR', '+1'],
      ['Slots', '7'],
    ],
    description: 'A level 30 bow for bowmen. Current guide damage uses this weapon attack value, not route score.',
  },
  {
    key: 'green hawkeye',
    name: 'Green Hawkeye',
    type: 'Hat',
    reqLevel: 25,
    classes: ['Bowman'],
    stats: [],
  },
  {
    key: 'red sauna robe',
    name: 'Red Sauna Robe',
    type: 'Overall',
    reqLevel: 20,
    classes: ['Common'],
    stats: [],
  },
  {
    key: 'black hunter',
    name: 'Black Hunter Boots',
    type: 'Shoes',
    reqLevel: 25,
    classes: ['Bowman'],
    stats: [],
  },
  {
    key: 'green marker',
    name: 'Green Marker',
    type: 'Glove',
    reqLevel: 25,
    classes: ['Bowman'],
    stats: [],
  },
  {
    key: 'old raggedy cape',
    name: 'Old Raggedy Cape',
    type: 'Cape',
    classes: ['Common'],
    stats: [],
  },
  {
    key: 'lightning earrings',
    name: 'Lightning Earrings',
    type: 'Earrings',
    classes: ['Common'],
    stats: [],
  },
];

let clickTimer = null;
let bypassNextClick = false;
let currentItem = null;

function normalize(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getSlot(tile) {
  return normalize(tile?.querySelector('span')?.textContent ?? '');
}

function getItemName(tile) {
  return String(tile?.querySelector('strong')?.textContent ?? '').replace(/点击换.*/, '').trim();
}

function itemMatches(item, name) {
  const text = normalize(name);
  return text.includes(item.key) || normalize(item.name).includes(text) || text.includes(normalize(item.name));
}

function getKnownItem(name) {
  return KNOWN_ITEMS.find((item) => itemMatches(item, name));
}

function getFallbackItem(tile) {
  const slot = getSlot(tile);
  const name = getItemName(tile) || '未装备';
  return {
    name,
    type: slot || 'Equipment',
    reqLevel: null,
    classes: SLOT_CLASS_MAP[slot] ?? ['Common'],
    stats: [],
    description: 'No detailed stat record was found for this item yet. Double click this slot to open the equipment picker.',
  };
}

function getItemFromTile(tile) {
  const name = getItemName(tile);
  return getKnownItem(name) ?? getFallbackItem(tile);
}

function getItemIcon(tile) {
  const img = tile?.querySelector('img');
  return img?.src ?? '';
}

function removeSheet() {
  document.querySelector('.mg-item-inspect-backdrop')?.remove();
  currentItem = null;
}

function statRow([label, value]) {
  return `<div class="mg-item-inspect-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function reqRow(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderItemSheet(item, iconSrc = '') {
  removeSheet();
  currentItem = item;
  const stats = item.stats?.length
    ? item.stats.map(statRow).join('')
    : '<p class="mg-item-inspect-muted">No bonus stats recorded.</p>';
  const classes = item.classes?.length ? item.classes.join(', ') : 'Common';
  const backdrop = document.createElement('div');
  backdrop.className = 'mg-item-inspect-backdrop';
  backdrop.innerHTML = `
    <section class="mg-item-inspect-card" role="dialog" aria-modal="true">
      <button class="mg-item-inspect-close" type="button" aria-label="Close">×</button>
      <div class="mg-item-inspect-titlebar">EQUIPMENT INFO</div>
      <div class="mg-item-inspect-top">
        <div class="mg-item-inspect-icon">${iconSrc ? `<img src="${escapeHtml(iconSrc)}" alt="" />` : '<span>?</span>'}</div>
        <div>
          <h2>${escapeHtml(item.name)}</h2>
          <p>${escapeHtml(item.type ?? 'Equipment')}</p>
        </div>
      </div>
      <div class="mg-item-inspect-reqs">
        ${reqRow('Required Level', item.reqLevel)}
        ${reqRow('Required STR', item.reqSTR)}
        ${reqRow('Required DEX', item.reqDEX)}
        ${reqRow('Required INT', item.reqINT)}
        ${reqRow('Required LUK', item.reqLUK)}
        <div><span>Job</span><strong>${escapeHtml(classes)}</strong></div>
      </div>
      <div class="mg-item-inspect-section">
        <h3>Stats</h3>
        ${stats}
      </div>
      ${item.description ? `<p class="mg-item-inspect-desc">${escapeHtml(item.description)}</p>` : ''}
      <div class="mg-item-inspect-help">Single click = view stats · Double click = change equipment</div>
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

  clickTimer = window.setTimeout(() => {
    clickTimer = null;
    renderItemSheet(getItemFromTile(tile), getItemIcon(tile));
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
