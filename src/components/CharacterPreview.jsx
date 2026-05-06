import { useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';

const BASE_AVATARS = {
  male: {
    skin: 2000,
    face: 20000,
    hair: 30000,
    top: 1040002,
    bottom: 1060002,
    shoes: 1072001,
  },
  female: {
    skin: 2000,
    face: 21000,
    hair: 31000,
    top: 1041002,
    bottom: 1061002,
    shoes: 1072005,
  },
};

const DEFAULT_WEAPONS = {
  warrior: 1302000,
  magician: 1372005,
  bowman: 1452002,
  thief: 1472000,
  pirate: 1492000,
};

function normalizeItemId(id) {
  const value = Number(String(id ?? '').replace(/^0+/, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function itemTypeFromId(id) {
  const raw = String(id ?? '').padStart(8, '0');
  if (raw.startsWith('0104')) return 'top';
  if (raw.startsWith('0105')) return 'overall';
  if (raw.startsWith('0106')) return 'bottom';
  if (raw.startsWith('0107')) return 'shoes';
  if (raw.startsWith('0108')) return 'glove';
  if (raw.startsWith('0109')) return 'shield';
  if (raw.startsWith('0110')) return 'cape';
  if (raw.startsWith('0100')) return 'cap';
  if (raw.startsWith('013') || raw.startsWith('014')) return 'weapon';
  return 'other';
}

function mergeGear(base, gear, classLine) {
  const byType = { ...base };
  for (const item of gear ?? []) {
    const id = normalizeItemId(item.id);
    if (!id) continue;
    const type = item.slot === 'weapon' ? 'weapon' : itemTypeFromId(item.id);
    if (type === 'overall') {
      byType.top = id;
      delete byType.bottom;
      continue;
    }
    if (['top', 'bottom', 'shoes', 'glove', 'shield', 'cape', 'cap', 'weapon'].includes(type)) {
      byType[type] = id;
    }
  }
  if (!byType.weapon) byType.weapon = DEFAULT_WEAPONS[classLine?.id] ?? DEFAULT_WEAPONS.warrior;
  return byType;
}

function buildItems(classLine, gender, gear) {
  const base = BASE_AVATARS[gender] ?? BASE_AVATARS.female;
  const merged = mergeGear(base, gear, classLine);
  return [
    merged.skin,
    merged.face,
    merged.hair,
    merged.cap,
    merged.top,
    merged.bottom,
    merged.shoes,
    merged.glove,
    merged.cape,
    merged.shield,
    merged.weapon,
  ].filter(Boolean);
}

export function buildCharacterImageUrl({ classLine, gender, gear, action = 'stand1', emotion = '0', resize = 3 }) {
  const items = buildItems(classLine, gender, gear).join(',');
  return `https://maplestory.io/api/${API_REGION}/${API_VERSION}/character/${items}/${action}/${emotion}?resize=${resize}&showears=false&showLefEars=false`;
}

export default function CharacterPreview({ classLine, gender = 'female', gear = [] }) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => buildCharacterImageUrl({ classLine, gender, gear }), [classLine, gender, gear]);

  if (failed) {
    return (
      <div className={`pixel-avatar ${classLine?.id ?? ''}`} style={{ transform: 'scale(1.05)' }}>
        <div className="avatar-hat" />
        <div className="avatar-face" />
        <div className="avatar-body" />
        <div className="avatar-weapon" />
      </div>
    );
  }

  return (
    <img
      className="real-character-preview"
      src={src}
      alt={`${classLine?.name ?? '角色'} preview`}
      onError={() => setFailed(true)}
      draggable="false"
    />
  );
}
