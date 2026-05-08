const MULTI_HIT_SKILLS = new Map([
  ['Double Shot', 2],
  ['Magic Claw', 2],
  ['Lucky Seven', 2],
  ['Double Stab', 2],
  ['Savage Blow', 6],
]);

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function readNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function readStat(item, keys) {
  for (const key of keys) {
    const value = item?.[key] ?? item?.stats?.[key];
    if (value !== undefined && value !== null && value !== '') return readNumber(value);
  }
  return 0;
}

function parseRange(text = '') {
  const match = String(text).match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (!match) return null;
  return { min: Number(match[1]) || 0, max: Number(match[2]) || 0 };
}

function parseBreakdown(text = '') {
  const match = String(text).match(/\(\s*(\d+)\s*\+\s*(\d+)\s*\)/);
  if (!match) return null;
  return { base: Number(match[1]) || 0, bonus: Number(match[2]) || 0 };
}

function getSkillHits(name = '') {
  return MULTI_HIT_SKILLS.get(String(name).replace(/\s+/g, ' ').trim()) ?? 1;
}

function getEquippedWeaponName(root = document) {
  const weaponTile = [...(root.querySelectorAll?.('.mg-equip-tile') ?? [])]
    .find((tile) => tile.querySelector('span')?.textContent?.trim() === '武器');
  return weaponTile?.querySelector('strong')?.textContent?.trim() ?? '';
}

function findItemByName(name = '') {
  const key = normalizeText(name);
  if (!key) return null;
  const byName = window.__mscwGuideItemsByName;
  if (byName?.get?.(key)) return byName.get(key);

  const items = window.__mscwGuideItems ?? [];
  let best = null;
  let bestScore = 0;
  for (const item of items) {
    const itemName = normalizeText(item?.title ?? item?.name ?? '');
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

function getEquippedWeaponAttack(root = document) {
  const weaponName = getEquippedWeaponName(root);
  const item = findItemByName(weaponName);
  return readStat(item, ['incPAD', 'pad', 'watk', 'attack', 'weaponAttack']);
}

function formatPerHit(totalRange, hits) {
  const safeHits = Math.max(1, Number(hits) || 1);
  const min = Math.max(1, Math.round(totalRange.min / safeHits));
  const max = Math.max(min, Math.round(totalRange.max / safeHits));
  return `${min} - ${max}/hit`;
}

function formatMultiHitValue({ name, value, owner }) {
  if (!value) return;
  if (/\/\s*hit/i.test(value.textContent ?? '')) return;

  const hits = getSkillHits(name);
  if (hits <= 1) return;

  const range = parseRange(value.textContent);
  if (!range) return;

  value.textContent = formatPerHit(range, hits);
  value.dataset.displayDamageFormatted = '1';
  if (owner) owner.dataset.skillHits = String(hits);
}

function formatDamageRows(root = document) {
  root.querySelectorAll?.('.mg-overview-damage-row')?.forEach((row) => {
    formatMultiHitValue({
      name: row.querySelector('strong')?.textContent?.trim() ?? '',
      value: row.querySelector('em'),
      owner: row,
    });
  });

  root.querySelectorAll?.('.mg-detail-sheet')?.forEach((sheet) => {
    formatMultiHitValue({
      name: sheet.querySelector('.mg-detail-head h2')?.textContent?.trim() ?? '',
      value: sheet.querySelector('.mg-detail-damage strong'),
      owner: sheet.querySelector('.mg-detail-damage'),
    });
  });
}

function formatWeaponAttack(root = document) {
  const itemAttack = getEquippedWeaponAttack(document);

  root.querySelectorAll?.('.mg-stat-box')?.forEach((box) => {
    const label = box.querySelector('span')?.textContent?.trim();
    if (label !== 'WATK') return;

    const value = box.querySelector('strong');
    const breakdown = box.querySelector('.mg-stat-breakdown');
    if (!value || !breakdown) return;

    const parsed = parseBreakdown(breakdown.textContent);
    const weaponAttack = itemAttack || parsed?.bonus;
    if (!weaponAttack || weaponAttack <= 0) return;

    value.textContent = String(weaponAttack);
    breakdown.textContent = '(weapon)';
    box.dataset.displayWeaponAttack = String(weaponAttack);
  });
}

function formatDashboard(root = document) {
  formatWeaponAttack(root);
  formatDamageRows(root);
}

function installDashboardDisplayFormatter() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwDashboardDisplayFormatterInstalled) return;
  window.__mscwDashboardDisplayFormatterInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) formatDashboard(node);
        }
      }
      if (mutation.type === 'characterData') {
        const scope = mutation.target?.parentElement?.closest?.('.mg-dashboard, .mg-detail-sheet') ?? document;
        formatDashboard(scope);
      }
    }
  });

  formatDashboard();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installDashboardDisplayFormatter();
