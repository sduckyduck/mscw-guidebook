const KNOWN_WEAPON_ATTACK = {
  ryden: 50,
};

function parseBreakdown(text = '') {
  const match = String(text).match(/\(\s*(\d+)\s*\+\s*(\d+)\s*\)/);
  if (!match) return null;
  return {
    base: Number(match[1]) || 0,
    bonus: Number(match[2]) || 0,
  };
}

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getEquippedWeaponName(root = document) {
  const weaponTile = [...(root.querySelectorAll?.('.mg-equip-tile') ?? [])]
    .find((tile) => tile.querySelector('span')?.textContent?.trim() === '武器');
  return weaponTile?.querySelector('strong')?.textContent?.trim() ?? '';
}

function getKnownWeaponAttack(root = document) {
  const weaponName = normalizeText(getEquippedWeaponName(root));
  for (const [name, value] of Object.entries(KNOWN_WEAPON_ATTACK)) {
    if (weaponName.includes(name)) return value;
  }
  return null;
}

function patchWeaponAttackStat(root = document) {
  const actualWeaponAttack = getKnownWeaponAttack(document);

  root.querySelectorAll?.('.mg-stat-box')?.forEach((box) => {
    const label = box.querySelector('span')?.textContent?.trim();
    if (label !== 'WATK') return;

    const value = box.querySelector('strong');
    const breakdown = box.querySelector('.mg-stat-breakdown');
    if (!value || !breakdown) return;

    const parsed = parseBreakdown(breakdown.textContent);
    const nextAttack = actualWeaponAttack ?? parsed?.bonus;
    if (!nextAttack || nextAttack <= 0) return;

    value.textContent = String(nextAttack);
    breakdown.textContent = '(weapon)';
    box.dataset.weaponAttackDisplayPatched = '1';
    box.title = parsed
      ? `Displayed WATK is the equipped weapon attack. Previous route estimate was ${parsed.base}.`
      : 'Displayed WATK is the equipped weapon attack.';
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
        const tile = mutation.target?.parentElement?.closest?.('.mg-equip-tile');
        if (box || tile) patchWeaponAttackStat(document);
      }
    }
  });

  patchWeaponAttackStat();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installWeaponAttackStatDisplayPatch();
