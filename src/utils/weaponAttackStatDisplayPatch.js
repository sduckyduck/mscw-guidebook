function parseBreakdown(text = '') {
  const match = String(text).match(/\(\s*(\d+)\s*\+\s*(\d+)\s*\)/);
  if (!match) return null;
  return {
    base: Number(match[1]) || 0,
    bonus: Number(match[2]) || 0,
  };
}

function patchWeaponAttackStat(root = document) {
  root.querySelectorAll?.('.mg-stat-box')?.forEach((box) => {
    const label = box.querySelector('span')?.textContent?.trim();
    if (label !== 'WATK') return;

    const value = box.querySelector('strong');
    const breakdown = box.querySelector('.mg-stat-breakdown');
    if (!value || !breakdown) return;

    const parsed = parseBreakdown(breakdown.textContent);
    if (!parsed || parsed.bonus <= 0) return;

    // compactStats currently renders the route damage estimate as the base part
    // and the real gear weapon attack as the +bonus part. The dashboard label is
    // WATK, so only the actual weapon attack should be displayed here.
    value.textContent = String(parsed.bonus);
    breakdown.textContent = '(weapon)';
    box.dataset.weaponAttackDisplayPatched = '1';
    box.title = `Displayed WATK is the equipped weapon attack. Previous base estimate was ${parsed.base}.`;
  });
}

function installWeaponAttackStatDisplayPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwWeaponAttackStatDisplayPatchInstalled) return;
  window.__mscwWeaponAttackStatDisplayPatchInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) patchWeaponAttackStat(node);
        }
      }
      if (mutation.type === 'characterData') {
        const box = mutation.target?.parentElement?.closest?.('.mg-stat-box');
        if (box) patchWeaponAttackStat(box.parentElement ?? document);
      }
    }
  });

  patchWeaponAttackStat();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installWeaponAttackStatDisplayPatch();
