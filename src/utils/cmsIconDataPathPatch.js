const PATCH_FLAG = '__mscwCmsIconDataPathPatchInstalled';

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

const EQUIPMENT_FOLDER_BY_WORD = [
  [/weapon|sword|axe|blunt|spear|pole|wand|staff|bow|crossbow|claw|dagger|gun|knuckle/i, 'Weapon'],
  [/cap|hat|helmet|帽|盔/i, 'Cap'],
  [/coat|top|shirt|上衣/i, 'Coat'],
  [/longcoat|overall|robe|套服|长袍/i, 'Longcoat'],
  [/pants|bottom|裤/i, 'Pants'],
  [/shoes|shoe|boot|鞋/i, 'Shoes'],
  [/glove|手套/i, 'Glove'],
  [/shield|盾/i, 'Shield'],
  [/cape|披风/i, 'Cape'],
  [/accessory|earring|face|eye|ring|pendant|belt|medal|饰|耳环|戒指|项链|腰带|勋章/i, 'Accessory'],
];

function isCmsItemsRequest(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  if (!raw) return false;
  try {
    return /\/cms\/items\.json$/.test(new URL(String(raw), window.location.origin).pathname);
  } catch {
    return /(^|\/)cms\/items\.json(?:$|[?#])/.test(String(raw));
  }
}

function isCmsSkillsRequest(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  if (!raw) return false;
  try {
    return /\/cms\/skills\.json$/.test(new URL(String(raw), window.location.origin).pathname);
  } catch {
    return /(^|\/)cms\/skills\.json(?:$|[?#])/.test(String(raw));
  }
}

function read(obj, keys, fallback = '') {
  for (const key of keys) {
    const value = String(key).split('.').reduce((node, part) => node?.[part], obj);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function normalizeItemId(value) {
  return String(value ?? '').replace(/\.0$/, '').replace(/\D+/g, '').padStart(8, '0');
}

function normalizeSkillId(value) {
  return String(value ?? '').replace(/\.0$/, '').replace(/\D+/g, '');
}

function inferEquipmentFolder(item, itemId) {
  const text = [
    item?.type,
    item?.itemType,
    item?.subCategory,
    item?.sub_category,
    item?.categoryName,
    item?.category,
    item?.slot,
    item?.equipSlot,
    item?.name,
    item?.title,
  ].filter(Boolean).join(' ');

  for (const [pattern, folder] of EQUIPMENT_FOLDER_BY_WORD) {
    if (pattern.test(text)) return folder;
  }

  return EQUIPMENT_FOLDER_BY_PREFIX[itemId.slice(0, 4)] || 'Accessory';
}

function equipmentIconPath(item) {
  const itemId = normalizeItemId(read(item, ['id', 'itemId', 'item_id', 'code']));
  if (!itemId || itemId === '00000000') return '';
  const folder = inferEquipmentFolder(item, itemId);
  return `cms_icons/equipment/${folder}/${itemId}.png`;
}

function skillIconPath(skill) {
  const skillId = normalizeSkillId(read(skill, ['id', 'skillId', 'skill_id', 'code']));
  if (!skillId) return '';
  return `cms_icons/skills/${skillId}.png`;
}

function withCmsEquipmentIcon(item) {
  if (!item || typeof item !== 'object') return item;
  const path = equipmentIconPath(item);
  if (!path) return item;
  return {
    ...item,
    thumbnail: path,
    icon: path,
    image: path,
    cms_icon_path: path,
  };
}

function withCmsSkillIcon(skill) {
  if (!skill || typeof skill !== 'object') return skill;
  const path = skillIconPath(skill);
  if (!path) return skill;
  return {
    ...skill,
    thumbnail: path,
    icon: path,
    image: path,
    cms_icon_path: path,
  };
}

function patchItemsPayload(payload) {
  if (Array.isArray(payload)) return payload.map(withCmsEquipmentIcon);
  if (!payload || typeof payload !== 'object') return payload;

  if (Array.isArray(payload.items)) {
    return { ...payload, items: payload.items.map(withCmsEquipmentIcon) };
  }

  if (payload.items && typeof payload.items === 'object') {
    return {
      ...payload,
      items: Object.fromEntries(Object.entries(payload.items).map(([key, item]) => [key, withCmsEquipmentIcon(item)])),
    };
  }

  return payload;
}

function patchSkillNode(node) {
  if (Array.isArray(node)) return node.map(patchSkillNode);
  if (!node || typeof node !== 'object') return node;

  const patched = { ...node };
  if (Array.isArray(patched.skills)) patched.skills = patched.skills.map(withCmsSkillIcon);

  for (const [key, value] of Object.entries(patched)) {
    if (key === 'skills') continue;
    if (Array.isArray(value) || (value && typeof value === 'object')) patched[key] = patchSkillNode(value);
  }

  if (read(patched, ['id', 'skillId', 'skill_id', 'code'])) return withCmsSkillIcon(patched);
  return patched;
}

function jsonResponse(payload, response) {
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installCmsIconDataPathPatch() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  if (window[PATCH_FLAG]) return;
  window[PATCH_FLAG] = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init);
    const isItems = isCmsItemsRequest(input);
    const isSkills = isCmsSkillsRequest(input);
    if (!isItems && !isSkills) return response;

    try {
      const payload = await response.clone().json();
      const patched = isItems ? patchItemsPayload(payload) : patchSkillNode(payload);
      return jsonResponse(patched, response);
    } catch (error) {
      console.warn('[MSCW] Failed to map CMS icon paths', error);
      return response;
    }
  };
}

installCmsIconDataPathPatch();
