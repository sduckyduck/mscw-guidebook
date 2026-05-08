const MULTI_HIT_SKILLS = new Map([
  ['Double Shot', 2],
  ['Magic Claw', 2],
  ['Lucky Seven', 2],
  ['Double Stab', 2],
  ['Savage Blow', 6],
]);

const WEAPON_MULTIPLIERS = [
  { match: /\b1h\s*sword\b|\bone handed sword\b|\bone-handed sword\b/i, swing: 1.8, stab: 1.8 },
  { match: /\b2h\s*sword\b|\btwo handed sword\b|\btwo-handed sword\b/i, swing: 2.5, stab: 2.5 },
  { match: /\b1h\s*axe\b|\bone handed axe\b|\bone-handed axe\b/i, swing: 2.4, stab: 1.2 },
  { match: /\b2h\s*axe\b|\btwo handed axe\b|\btwo-handed axe\b/i, swing: 3.0, stab: 2.0 },
  { match: /\b1h\s*blunt\b|\bone handed blunt\b|\bone-handed blunt\b/i, swing: 2.4, stab: 1.2 },
  { match: /\b2h\s*blunt\b|\btwo handed blunt\b|\btwo-handed blunt\b/i, swing: 3.0, stab: 2.0 },
  { match: /\bspear\b/i, swing: 1.5, stab: 3.5 },
  { match: /\bpole\s*arm\b|\bpolearm\b/i, swing: 3.5, stab: 1.5 },
  { match: /\bbow\b/i, swing: 2.5, stab: 2.5 },
  { match: /\bcrossbow\b/i, swing: 2.5, stab: 2.5 },
  { match: /\bclaw\b/i, swing: 2.5, stab: 2.5 },
  { match: /\bdagger\b/i, swing: 1.0, stab: 2.0 },
];

const PHYSICAL_SKILL_PERCENT = {
  'Power Strike': (level) => 60 + level * 10,
  'Slash Blast': (level) => 10 + level * 6,
  'Arrow Blow': (level) => 100 + level * 30,
  'Double Shot': (level) => 20 + level * 5,
  'Double Stab': (level) => 80 + level * 5,
  'Lucky Seven': (level) => 100 + level * 5,
};

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

function parseLevel(text = '') {
  return readNumber(String(text).match(/Lv\.\s*(\d+)/i)?.[1]);
}

function parsePercent(text = '') {
  const match = String(text).match(/(?:Damage|伤害)\s*(\d+(?:\.\d+)?)%/i);
  return match ? readNumber(match[1]) : 0;
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

function getEquippedWeapon(root = document) {
  return findItemByName(getEquippedWeaponName(root));
}

function getEquippedWeaponAttack(root = document) {
  return readStat(getEquippedWeapon(root), ['incPAD', 'pad', 'watk', 'attack', 'weaponAttack']);
}

function getWeaponMultiplier(weapon, skillName = '') {
  const text = `${weapon?.weaponType ?? weapon?.weapon_type ?? ''} ${weapon?.title ?? weapon?.name ?? ''}`;
  const profile = WEAPON_MULTIPLIERS.find((item) => item.match.test(text)) ?? { swing: 2.0, stab: 2.0 };
  if (/double\s+stab|savage\s+blow/i.test(skillName)) return profile.stab;
  if (/power\s+strike|slash\s+blast|final\s+attack|steal/i.test(skillName)) return profile.swing * 0.6 + profile.stab * 0.4;
  return profile.swing;
}

function getDisplayedStats(root = document) {
  const stats = {};
  root.querySelectorAll?.('.mg-stat-box')?.forEach((box) => {
    const label = box.querySelector('span')?.textContent?.trim();
    const value = box.querySelector('strong')?.textContent?.trim();
    if (label) stats[label] = readNumber(value);
  });
  return stats;
}

function getClassId(root = document) {
  const title = root.querySelector?.('.mg-dashboard-title')?.textContent ?? '';
  if (/战士|Warrior/i.test(title)) return 'warrior';
  if (/弓箭手|Bowman/i.test(title)) return 'bowman';
  if (/飞侠|Thief/i.test(title)) return 'thief';
  if (/魔法师|Magician/i.test(title)) return 'magician';
  return '';
}

function getPrimarySecondary(classId, stats) {
  if (classId === 'bowman') return { primary: stats.DEX, secondary: stats.STR };
  if (classId === 'thief') return { primary: stats.LUK, secondary: stats.DEX };
  return { primary: stats.STR, secondary: stats.DEX };
}

function getSkillPercent(name = '', level = 0, fallbackPercent = 0) {
  if (fallbackPercent > 0) return fallbackPercent;
  const fn = PHYSICAL_SKILL_PERCENT[name];
  return fn && level > 0 ? fn(level) : 0;
}

function calculatePhysicalSkillRange({ name, level, percent }) {
  const classId = getClassId(document);
  if (classId === 'magician') return null;
  const weapon = getEquippedWeapon(document);
  const weaponAttack = getEquippedWeaponAttack(document);
  const stats = getDisplayedStats(document);
  if (!weapon || !weaponAttack) return null;

  const skillPercent = getSkillPercent(name, level, percent) / 100;
  if (!skillPercent) return null;

  const { primary, secondary } = getPrimarySecondary(classId, stats);
  const weaponMultiplier = getWeaponMultiplier(weapon, name);
  const minMastery = 0.08;
  const attackPower = 0;
  const min = Math.round((0.8 + ((primary * weaponMultiplier * minMastery + secondary + attackPower) / 100)) * weaponAttack * skillPercent);
  const max = Math.round((1.0 + ((primary * weaponMultiplier + secondary + attackPower) / 100)) * weaponAttack * skillPercent);
  return { min: Math.max(1, min), max: Math.max(1, max) };
}

function formatPerHit(range, hits) {
  const safeHits = Math.max(1, Number(hits) || 1);
  const min = Math.max(1, Math.round(range.min / safeHits));
  const max = Math.max(min, Math.round(range.max / safeHits));
  return `${min} - ${max}/hit`;
}

function formatFormulaRange({ name, level, value, owner, percent = 0 }) {
  if (!value) return false;
  if (value.dataset.formulaDamageFormatted === '1') return true;

  const range = calculatePhysicalSkillRange({ name, level, percent });
  if (!range) return false;

  const hits = getSkillHits(name);
  value.textContent = hits > 1 ? `${range.min} - ${range.max}/hit` : `${range.min} - ${range.max}`;
  value.dataset.formulaDamageFormatted = '1';
  if (owner) owner.dataset.skillHits = String(hits);
  return true;
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
    const name = row.querySelector('strong')?.textContent?.trim() ?? '';
    const value = row.querySelector('em');
    const level = parseLevel(row.textContent);
    if (formatFormulaRange({ name, level, value, owner: row })) return;
    formatMultiHitValue({ name, value, owner: row });
  });

  root.querySelectorAll?.('.mg-detail-sheet')?.forEach((sheet) => {
    const name = sheet.querySelector('.mg-detail-head h2')?.textContent?.trim() ?? '';
    const value = sheet.querySelector('.mg-detail-damage strong');
    const level = parseLevel(sheet.textContent);
    const percent = parsePercent(sheet.textContent);
    if (formatFormulaRange({ name, level, value, owner: sheet.querySelector('.mg-detail-damage'), percent })) return;
    formatMultiHitValue({ name, value, owner: sheet.querySelector('.mg-detail-damage') });
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
        scope.querySelectorAll?.('[data-formula-damage-formatted="1"]').forEach((item) => delete item.dataset.formulaDamageFormatted);
        formatDashboard(scope);
      }
    }
  });

  formatDashboard();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installDashboardDisplayFormatter();
