const MULTI_HIT_SKILLS = {
  'Double Shot': 2,
  'Magic Claw': 2,
  'Lucky Seven': 2,
  'Double Stab': 2,
  'Savage Blow': 6,
};

// Current official data for Double Shot exposes the level effect as "Damage 120%".
// The calculator already turns that into the per-arrow range, so display should only
// append /hit rather than dividing again.
const ALREADY_PER_HIT_DAMAGE_SKILLS = new Set([
  'Double Shot',
]);

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

function formatPerHitRange(range, denominator = 1) {
  const safeDenominator = Math.max(1, Number(denominator) || 1);
  const perHitMin = Math.max(1, Math.round(range.min / safeDenominator));
  const perHitMax = Math.max(perHitMin, Math.round(range.max / safeDenominator));
  return `${perHitMin} - ${perHitMax}/hit`;
}

function patchDamageValue({ name, value, owner }) {
  const normalizedName = normalizeSkillName(name);
  if (!normalizedName || !value || value.dataset.perHitPatched === '1') return;

  if (/\/\s*hit/i.test(value.textContent ?? '')) {
    value.dataset.perHitPatched = '1';
    return;
  }

  const hits = getSkillHitCount(normalizedName);
  if (hits <= 1) return;

  const range = parseRange(value.textContent);
  if (!range) return;

  const denominator = getDamageDenominator(normalizedName, hits);
  value.textContent = formatPerHitRange(range, denominator);
  value.dataset.perHitPatched = '1';
  if (owner) {
    owner.dataset.skillHits = String(hits);
    owner.dataset.damageDenominator = String(denominator);
  }
}

function patchOverviewDamageRows(root = document) {
  root.querySelectorAll?.('.mg-overview-damage-row')?.forEach((row) => {
    patchDamageValue({
      name: row.querySelector('strong')?.textContent ?? '',
      value: row.querySelector('em'),
      owner: row,
    });
  });
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
  if (value) delete value.dataset.perHitPatched;
  return row?.parentElement ?? detailDamage?.parentElement ?? document;
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
