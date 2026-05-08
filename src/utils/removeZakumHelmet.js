const BANNED_EQUIPMENT_NAMES = ['zakum helmet'];
const STATE_KEYS = ['mscw-guidebook-state-v2'];

function isBannedEquipmentName(text = '') {
  const normalized = String(text).toLowerCase().replace(/\s+/g, ' ').trim();
  return BANNED_EQUIPMENT_NAMES.some((name) => normalized.includes(name));
}

function isBannedEquipmentItem(item) {
  if (!item || typeof item !== 'object') return false;
  return isBannedEquipmentName(`${item.name ?? ''} ${item.title ?? ''} ${item.description ?? ''}`);
}

function removeBannedPickerItems(root = document) {
  root.querySelectorAll?.('.mg-picker-item')?.forEach((button) => {
    if (isBannedEquipmentName(button.textContent)) button.remove();
  });
}

function clearBannedSavedGear() {
  if (typeof window === 'undefined') return;
  let changedAny = false;

  for (const key of STATE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object') continue;

      let changed = false;
      if (state.gearOverrides && typeof state.gearOverrides === 'object') {
        const nextOverrides = { ...state.gearOverrides };
        for (const [slot, item] of Object.entries(nextOverrides)) {
          if (isBannedEquipmentItem(item)) {
            delete nextOverrides[slot];
            changed = true;
          }
        }
        state.gearOverrides = nextOverrides;
      }

      if (changed) {
        window.localStorage.setItem(key, JSON.stringify(state));
        changedAny = true;
      }
    } catch {
      // Ignore broken saved state.
    }
  }

  return changedAny;
}

function hideBannedVisibleTiles(root = document) {
  root.querySelectorAll?.('.mg-equip-tile, .mg-picker-item')?.forEach((node) => {
    if (!isBannedEquipmentName(node.textContent)) return;
    if (node.classList.contains('mg-picker-item')) node.remove();
  });
}

function installBannedEquipmentCleanup() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBannedEquipmentCleanupInstalled) return;
  window.__mscwBannedEquipmentCleanupInstalled = true;

  const hadSavedZakum = clearBannedSavedGear();
  removeBannedPickerItems();
  hideBannedVisibleTiles();

  if (hadSavedZakum && !window.__mscwBannedEquipmentReloaded) {
    window.__mscwBannedEquipmentReloaded = true;
    window.setTimeout(() => window.location.reload(), 80);
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.mg-picker-item') && isBannedEquipmentName(node.textContent)) {
          node.remove();
          continue;
        }
        removeBannedPickerItems(node);
        hideBannedVisibleTiles(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

installBannedEquipmentCleanup();
