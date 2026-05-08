const MULTI_HIT_SKILLS = {
  'Double Shot': 2,
  'Magic Claw': 2,
  'Lucky Seven': 2,
  'Double Stab': 2,
  'Savage Blow': 6,
};

const ALREADY_PER_HIT_DAMAGE_SKILLS = new Set([
  'Double Shot',
]);

const BOWMAN_DAMAGE_SKILLS = new Set([
  'Arrow Blow',
  'Double Shot',
]);

// Bow/crossbow damage range should not use the very low melee no-mastery floor.
// For the current guide estimator, the max value is already the selected skill's
// max estimate, so we tighten the displayed min toward the classic ranged floor.
const RANGED_MIN_RATIO = 0.9;

function parseRange(text = '') {
  const match = String(text).match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function normalizeSkillName(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function getSkillHitCount(name = '') {
  const normalized = normalizeSkillName(name);
  return MULTI_HIT_SKILLS[normalized] ?? 1;
}

function getDamageDenominator(name = '', hits = 1) {
  const normalized = normalizeSkillName(name);
  if (ALREADY_PER_HIT_DAMAGE_SKILLS.has(normalized)) return 1;
  return Math.max(1, Number(hits) || 1);
}

function getTightenedRangedRange(range) {
  if (!range) return null;
  const max = Math.max(1, Math.round(Number(range.max) || 0));
  return {
    min: Math.max(1, Math.min(max, Math.round(max * RANGED_MIN_RATIO))),
    max,
  };
}

function formatRange(range) {
  return `${range.min} - ${range.max}`;
}

function formatPerHitRange(range, denominator = 1) {
  const safeDenominator = Math.max(1, Number(denominator) || 1);
  const perHitMin = Math.max(1, Math.round(range.min / safeDenominator));
  const perHitMax = Math.max(perHitMin, Math.round(range.max / safeDenominator));
  return `${perHitMin} - ${perHitMax}/hit`;
}

function shouldTightenRangedRange(name = '', context = {}) {
  const normalizedName = normalizeSkillName(name);
  if (BOWMAN_DAMAGE_SKILLS.has(normalizedName)) return true;
  return normalizedName === 'Base Attack' && Boolean(context.hasBowmanDamageSkill);
}

function patchDamageValue({ name, value, owner, context = {} }) {
  const normalizedName = normalizeSkillName(name);
  if (!normalizedName || !value || value.dataset.damageDisplayPatched === '1') return;

  const range = parseRange(value.textContent);
  if (!range) return;

  const hits = getSkillHitCount(normalizedName);
  const useRangedFloor = shouldTightenRangedRange(normalizedName, context);
  const adjustedRange = useRangedFloor ? getTightenedRangedRange(range) : range;

  if (hits > 1) {
    const denominator = getDamageDenominator(normalizedName, hits);
    value.textContent = formatPerHitRange(adjustedRange, denominator);
    if (owner) {
      owner.dataset.skillHits = String(hits);
      owner.dataset.damageDenominator = String(denominator);
    }
  } else if (useRangedFloor) {
    value.textContent = formatRange(adjustedRange);
  } else if (/\/\s*hit/i.test(value.textContent ?? '')) {
    value.textContent = formatPerHitRange(adjustedRange, 1);
  }

  value.dataset.damageDisplayPatched = '1';
}

function getOverviewContext(container) {
  const rows = [...(container?.querySelectorAll?.('.mg-overview-damage-row') ?? [])];
  return {
    hasBowmanDamageSkill: rows.some((row) => BOWMAN_DAMAGE_SKILLS.has(normalizeSkillName(row.querySelector('strong')?.textContent ?? ''))),
  };
}

function patchOverviewDamageRows(root = document) {
  const lists = root.matches?.('.mg-overview-damage-list')
    ? [root]
    : [...(root.querySelectorAll?.('.mg-overview-damage-list') ?? [])];

  for (const list of lists) {
    const context = getOverviewContext(list);
    list.querySelectorAll?.('.mg-overview-damage-row')?.forEach((row) => {
      patchDamageValue({
        name: row.querySelector('strong')?.textContent ?? '',
        value: row.querySelector('em'),
        owner: row,
        context,
      });
    });
  }
}

function patchSkillDetailSheets(root = document) {
  root.querySelectorAll?.('.mg-detail-sheet')?.forEach((sheet) => {
    patchDamageValue({
      name: sheet.querySelector('.mg-detail-head h2')?.textContent ?? '',
      value: sheet.querySelector('.mg-detail-damage strong'),
      owner: sheet.querySelector('.mg-detail-damage'),
    });
  });
}

function patchDamageDisplays(root = document) {
  patchOverviewDamageRows(root);
  patchSkillDetailSheets(root);
}

function resetPatchedFlagFromCharacterData(target) {
  const row = target?.parentElement?.closest?.('.mg-overview-damage-row');
  const detailDamage = target?.parentElement?.closest?.('.mg-detail-damage');
  const value = row?.querySelector?.('em') ?? detailDamage?.querySelector?.('strong');
  if (value) delete value.dataset.damageDisplayPatched;
  return row?.closest?.('.mg-overview-damage-list') ?? detailDamage?.parentElement ?? document;
}

function installOverviewDamageDisplayPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwOverviewDamageDisplayPatchInstalled) return;
  window.__mscwOverviewDamageDisplayPatchInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) patchDamageDisplays(node);
        }
      }
      if (mutation.type === 'characterData') {
        patchDamageDisplays(resetPatchedFlagFromCharacterData(mutation.target));
      }
    }
  });

  patchDamageDisplays();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installOverviewDamageDisplayPatch();
