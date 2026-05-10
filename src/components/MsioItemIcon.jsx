const BASE_URL = import.meta.env?.BASE_URL || '/';

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

const EQUIPMENT_FOLDER_BY_SLOT = {
  weapon: 'Weapon',
  cap: 'Cap',
  hat: 'Cap',
  top: 'Coat',
  coat: 'Coat',
  overall: 'Longcoat',
  longcoat: 'Longcoat',
  bottom: 'Pants',
  pants: 'Pants',
  shoes: 'Shoes',
  shoe: 'Shoes',
  glove: 'Glove',
  shield: 'Shield',
  cape: 'Cape',
  earring: 'Accessory',
  accessory: 'Accessory',
};

function assetUrl(path) {
  return `${BASE_URL}${String(path || '').replace(/^\/+/, '')}`;
}

function padItemId(value) {
  const raw = String(value ?? '').replace(/\.0$/, '').replace(/\D+/g, '');
  return raw ? raw.padStart(8, '0') : '';
}

function inferCmsEquipmentFolder(item, itemId) {
  const slot = String(item?.slot ?? item?.equipSlot ?? '').toLowerCase();
  if (EQUIPMENT_FOLDER_BY_SLOT[slot]) return EQUIPMENT_FOLDER_BY_SLOT[slot];
  return EQUIPMENT_FOLDER_BY_PREFIX[itemId.slice(0, 4)] || 'Accessory';
}

export function getMappedMsioItemId(item) {
  const raw = String(item?.id ?? '').replace(/^0+/, '');
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getMsioIconUrl() {
  return '';
}

export function getCmsItemIconUrl(item) {
  const id = padItemId(item?.id ?? item?.itemId ?? item?.item_id ?? item?.code);
  if (!id) return '';
  const folder = inferCmsEquipmentFolder(item, id);
  return assetUrl(`cms_icons/equipment/${folder}/${id}.png`);
}

export default function MsioItemIcon({ item, size = 32 }) {
  const src = getCmsItemIconUrl(item);

  return (
    <div style={{ width: size + 8, height: size + 8, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 10, background: '#fff', marginBottom: 5 }}>
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
        />
      ) : (
        <span style={{ color: '#b8c2cc', fontWeight: 1000 }}>-</span>
      )}
    </div>
  );
}
