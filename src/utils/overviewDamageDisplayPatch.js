const MULTI_HIT_SKILLS = {
  'Double Shot': 2,
  'Magic Claw': 2,
  'Lucky Seven': 2,
  'Double Stab': 2,
  'Savage Blow': 6,
};

// Some official AppData rows store multi-hit skill damage as total skill damage.
// Example: Double Shot can appear as "Attack 2x with 260% damage", meaning 130% per hit.
const TOTAL_DAMAGE_MULTI_HIT_SKILLS = new Set([
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
  const safeHits = Math.max(1, Number(hits) || 1);
  return TOTAL_DAMAGE_MULTI_HIT_SKILLS.has(normalized) ? safeHits * safeHits : safeHits;
}

function patchDamageRows(root = document) {
  root.querySelectorAll?.('.mg-overview-damage-row')?.forEach((row) => {
    const name = normalizeSkillName(row.querySelector('strong')?.textContent ?? '');
    const value = row.querySelector('em');
    if (!name || !value || value.dataset.perHitPatched === '1') return;

    if (/\/\s*hit/i.test(value.textContent ?? '')) {
      value.dataset.perHitPatched = '1';
      return;
    }

    const hits = getSkillHitCount(name);
    if (hits <= 1) return;

    const range = parseRange(value.textContent);
    if (!range) return;

    const denominator = getDamageDenominator(name, hits);
    const perHitMin = Math.max(1, Math.round(range.min / denominator));
    const perHitMax = Math.max(perHitMin, Math.round(range.max / denominator));
    value.textContent = `${perHitMin} - ${perHitMax}/hit`;
    value.dataset.perHitPatched = '1';
    row.dataset.skillHits = String(hits);
    row.dataset.damageDenominator = String(denominator);
  });
}

function installOverviewDamageDisplayPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwOverviewDamageDisplayPatchInstalled) return;
  window.__mscwOverviewDamageDisplayPatchInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) patchDamageRows(node);
        }
      }
      if (mutation.type === 'characterData') {
        const row = mutation.target?.parentElement?.closest?.('.mg-overview-damage-row');
        if (row) {
          const value = row.querySelector('em');
          if (value) delete value.dataset.perHitPatched;
          patchDamageRows(row.parentElement ?? document);
        }
      }
    }
  });

  patchDamageRows();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installOverviewDamageDisplayPatch();
