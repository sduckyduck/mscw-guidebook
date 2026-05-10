(() => {
  const SCRIPT_NAME = 'cms-icon-fallback.js';
  const script = document.currentScript || [...document.scripts].find((node) => node.src.includes(SCRIPT_NAME));
  const baseUrl = script?.src ? script.src.replace(new RegExp(`${SCRIPT_NAME}(?:\\?.*)?$`), '') : `${window.location.origin}/`;

  const EQUIPMENT_FOLDERS = [
    'Weapon',
    'Cap',
    'Accessory',
    'Coat',
    'Longcoat',
    'Pants',
    'Shoes',
    'Glove',
    'Shield',
    'Cape',
    'Face',
    'EyeDecoration',
    'Earrings',
    'Top',
    'Overall',
    'Bottom',
    'Ring',
    'Pendant',
    'Belt',
    'Medal',
    'Shoulder',
    'Android',
    'PetEquip',
  ];

  const EQUIPMENT_FOLDER_BY_PREFIX = {
    '0100': 'Cap',
    '0101': 'Accessory',
    '0102': 'Accessory',
    '0103': 'Accessory',
    '0104': 'Coat',
    '0105': 'Longcoat',
    '0106': 'Pants',
    '0107': 'Shoes',
    '0108': 'Glove',
    '0109': 'Shield',
    '0110': 'Cape',
    '0111': 'Accessory',
    '0112': 'Accessory',
    '0113': 'Accessory',
    '0114': 'Accessory',
    '0115': 'Accessory',
    '0116': 'Accessory',
    '0117': 'Accessory',
    '0118': 'Accessory',
    '0119': 'Accessory',
    '0120': 'Accessory',
    '0121': 'Accessory',
    '0122': 'Accessory',
    '0123': 'Accessory',
    '0124': 'Accessory',
    '0130': 'Weapon',
    '0131': 'Weapon',
    '0132': 'Weapon',
    '0133': 'Weapon',
    '0134': 'Weapon',
    '0135': 'Weapon',
    '0136': 'Weapon',
    '0137': 'Weapon',
    '0138': 'Weapon',
    '0140': 'Weapon',
    '0141': 'Weapon',
    '0142': 'Weapon',
    '0143': 'Weapon',
    '0144': 'Weapon',
    '0145': 'Weapon',
    '0146': 'Weapon',
    '0147': 'Weapon',
    '0148': 'Weapon',
    '0149': 'Weapon',
    '0152': 'Weapon',
    '0153': 'Weapon',
    '0154': 'Weapon',
    '0155': 'Weapon',
    '0156': 'Weapon',
    '0157': 'Weapon',
    '0158': 'Weapon',
    '0159': 'Weapon',
    '0160': 'Weapon',
    '0161': 'Weapon',
    '0162': 'Weapon',
    '0163': 'Weapon',
    '0164': 'Weapon',
    '0165': 'Weapon',
    '0166': 'Weapon',
    '0167': 'Weapon',
    '0168': 'Weapon',
    '0169': 'Weapon',
    '0170': 'Weapon',
  };

  function assetUrl(path) {
    return new URL(path.replace(/^\/+/, ''), baseUrl).href;
  }

  function normalizeItemId(id) {
    return String(id || '').replace(/\.0$/, '').padStart(8, '0');
  }

  function normalizeSkillId(id) {
    return String(id || '').replace(/\.0$/, '').replace(/^0+(?=\d{7,8}$)/, '');
  }

  function srcPath(src) {
    try {
      return new URL(src, window.location.href).pathname;
    } catch {
      return String(src || '');
    }
  }

  function extractPngId(src) {
    const path = srcPath(src);
    const match = path.match(/\/(\d{6,9})(?:_raw)?\.png$/i);
    return match?.[1] || '';
  }

  function shouldRemapEquipment(src) {
    const path = srcPath(src);
    if (path.includes('/cms_icons/equipment/')) return false;
    if (path.includes('/AppData/')) return false;
    return path.includes('/cms/images/items/') || path.includes('/images/items/') || path.includes('/images/equipment/');
  }

  function shouldRemapSkill(src) {
    const path = srcPath(src);
    if (path.includes('/cms_icons/skills/')) return false;
    if (path.includes('/AppData/')) return false;
    return path.includes('/cms/images/skills/') || path.includes('/images/skills/');
  }

  function equipmentCandidates(rawId) {
    const id = normalizeItemId(rawId);
    const preferred = EQUIPMENT_FOLDER_BY_PREFIX[id.slice(0, 4)];
    const folders = preferred
      ? [preferred, ...EQUIPMENT_FOLDERS.filter((folder) => folder !== preferred)]
      : EQUIPMENT_FOLDERS;

    return folders.flatMap((folder) => [
      assetUrl(`cms_icons/equipment/${folder}/${id}.png`),
      assetUrl(`cms_icons/equipment/${folder}/${id}_raw.png`),
    ]);
  }

  function skillCandidates(rawId) {
    const id = normalizeSkillId(rawId);
    return [
      assetUrl(`cms_icons/skills/${id}.png`),
      assetUrl(`cms_icons/skills/${id}_raw.png`),
    ];
  }

  function setCandidate(img, type, id, candidates, startIndex = 0) {
    if (!id || !candidates.length) return false;
    img.dataset.cmsIconType = type;
    img.dataset.cmsIconId = id;
    img.dataset.cmsIconCandidates = JSON.stringify(candidates);
    img.dataset.cmsIconIndex = String(startIndex);
    img.src = candidates[startIndex];
    return true;
  }

  function remap(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const current = img.currentSrc || img.src || '';
    if (!current) return false;

    const id = extractPngId(current);
    if (!id) return false;

    if (shouldRemapEquipment(current)) return setCandidate(img, 'equipment', normalizeItemId(id), equipmentCandidates(id));
    if (shouldRemapSkill(current)) return setCandidate(img, 'skill', normalizeSkillId(id), skillCandidates(id));
    return false;
  }

  function tryNext(img) {
    if (!(img instanceof HTMLImageElement)) return;
    const encoded = img.dataset.cmsIconCandidates;
    if (!encoded) {
      remap(img);
      return;
    }

    let candidates = [];
    try {
      candidates = JSON.parse(encoded);
    } catch {
      return;
    }

    const nextIndex = Number(img.dataset.cmsIconIndex || 0) + 1;
    if (nextIndex >= candidates.length) return;
    img.dataset.cmsIconIndex = String(nextIndex);
    img.src = candidates[nextIndex];
  }

  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement) tryNext(event.target);
  }, true);

  const scan = (root = document) => {
    if (root instanceof HTMLImageElement) remap(root);
    root.querySelectorAll?.('img').forEach(remap);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node);
      }
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) remap(mutation.target);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan());
  } else {
    scan();
  }
})();
