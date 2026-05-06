import { useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';
const FIXED_SKIN_ID = 2000;
const DEFAULT_ACTION = 'stand1';

const HAIRS = {
  male: [30000, 30060, 30100, 30120, 30140, 30200, 30210, 30260, 30300],
  female: [31000, 31030, 31040, 31070, 31100, 31150, 31260, 31280, 31310],
};

const FACES = {
  male: [20000, 20001, 20002, 20003, 20005, 20011, 20014],
  female: [21000, 21001, 21002, 21003, 21004, 21010, 21014],
};

const FALLBACK_EQUIPMENT = {
  warrior: [1002001, 1060016, 1302000],
  magician: [1002019, 1050003, 1372000],
  bowman: [1002165, 1060056, 1452000],
  thief: [1002170, 1060043, 1472000],
  pirate: [1002610, 1052095, 1072288, 1492000],
};

const EMOTE_BY_CLASS = {
  warrior: 'angry',
  magician: 'bewildered',
  bowman: 'default',
  thief: 'wink',
  pirate: 'wink',
};

function normalizeGender(value) {
  return value === 'male' || value === 'female' ? value : 'female';
}

function stablePick(values, seed = 0) {
  if (!values?.length) return null;
  return values[Math.abs(seed) % values.length];
}

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

function gearIdsFromRecommendations(gear) {
  const byType = {};
  for (const item of gear ?? []) {
    const id = normalizeItemId(item.id);
    if (!id) continue;
    const type = item.slot === 'weapon' ? 'weapon' : itemTypeFromId(item.id);
    if (type === 'overall') {
      byType.overall = id;
      delete byType.top;
      delete byType.bottom;
      continue;
    }
    if (['cap', 'top', 'bottom', 'shoes', 'glove', 'cape', 'shield', 'weapon'].includes(type)) {
      byType[type] = id;
    }
  }
  return [byType.cap, byType.overall, byType.top, byType.bottom, byType.shoes, byType.glove, byType.cape, byType.shield, byType.weapon].filter(Boolean);
}

function sanitizeEquipment(ids) {
  const seen = new Set();
  return (ids ?? [])
    .map(normalizeItemId)
    .filter(Boolean)
    .filter((id) => {
      const key = String(id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildMsciUrl({ skin = FIXED_SKIN_ID, hair, face, emote, equipment, action = DEFAULT_ACTION }) {
  const entries = [hair, `${face}:${emote}`, ...sanitizeEquipment(equipment)].filter(Boolean);
  const itemPath = encodeURIComponent(entries.join(','));
  return `https://maplestory.io/api/${API_REGION}/${API_VERSION}/Character/${skin}/${itemPath}/${encodeURIComponent(action)}/0?resize=3&renderMode=Full&bgColor=0,0,0,0&faceEmote=${encodeURIComponent(emote)}`;
}

function buildAttemptUrls({ classLine, gender, gear }) {
  const safeGender = normalizeGender(gender);
  const classId = classLine?.id ?? 'warrior';
  const seed = String(classId).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + (safeGender === 'female' ? 11 : 0);
  const hair = stablePick(HAIRS[safeGender], seed) ?? 31000;
  const face = stablePick(FACES[safeGender], seed) ?? 21000;
  const emote = EMOTE_BY_CLASS[classId] ?? 'default';
  const recommended = gearIdsFromRecommendations(gear);
  const fallback = FALLBACK_EQUIPMENT[classId] ?? FALLBACK_EQUIPMENT.warrior;
  const baseClothes = safeGender === 'female' ? [1041002, 1061002, 1072005] : [1040002, 1060002, 1072001];

  const attempts = [
    recommended.length ? recommended : null,
    [...baseClothes, ...fallback],
    fallback,
    [safeGender === 'female' ? 1041002 : 1040002, safeGender === 'female' ? 1061002 : 1060002, fallback[fallback.length - 1]],
  ].filter(Boolean);

  return attempts.map((equipment) => buildMsciUrl({ hair, face, emote, equipment }));
}

export function buildCharacterImageUrl({ classLine, gender, gear }) {
  return buildAttemptUrls({ classLine, gender, gear })[0];
}

export default function CharacterPreview({ classLine, gender = 'female', gear = [] }) {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const urls = useMemo(() => buildAttemptUrls({ classLine, gender, gear }), [classLine, gender, gear]);
  const src = urls[Math.min(attemptIndex, urls.length - 1)];

  if (!src || attemptIndex >= urls.length) {
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
      key={src}
      className="real-character-preview"
      src={src}
      alt={`${classLine?.name ?? '角色'} preview`}
      onError={() => setAttemptIndex((index) => index + 1)}
      draggable="false"
    />
  );
}
