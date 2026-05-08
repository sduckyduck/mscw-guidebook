const BANNED_EQUIPMENT_NAMES = ['zakum helmet'];

function isBannedEquipmentName(text = '') {
  const normalized = String(text).toLowerCase().replace(/\s+/g, ' ').trim();
  return BANNED_EQUIPMENT_NAMES.some((name) => normalized.includes(name));
}

function removeBannedPickerItems(root = document) {
  root.querySelectorAll?.('.mg-picker-item')?.forEach((button) => {
    if (isBannedEquipmentName(button.textContent)) button.remove();
  });
}

function installBannedEquipmentCleanup() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBannedEquipmentCleanupInstalled) return;
  window.__mscwBannedEquipmentCleanupInstalled = true;

  removeBannedPickerItems();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.('.mg-picker-item') && isBannedEquipmentName(node.textContent)) {
          node.remove();
          continue;
        }
        removeBannedPickerItems(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

installBannedEquipmentCleanup();
