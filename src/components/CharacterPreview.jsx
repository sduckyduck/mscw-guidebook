import { useEffect, useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';
const FIXED_SKIN_ID = 2000;
const DEFAULT_ACTION = 'stand1';
const MAP_CACHE_BUSTER = 'mscw-msio-map-20260505';
const MSIO_MAP_URL = `https://raw.githubusercontent.com/sduckyduck/osms-classic-guidebook/main/public/data/character_item_id_map.csv?v=${MAP_CACHE_BUSTER}`;

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

const BASE_CLOTHES = {
  male: [1040002, 1060002, 1072001],
  female: [1041002, 1061002, 1072005],
};

const EMOTE_BY_CLASS = {
  warrior: 'angry',
  magician: 'bewildered',
  bowman: 'default',
  thief: 'wink',
  pirate: 'wink',
};

let mapPromise = null;
let mapCache = null;

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

function normalizeName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((cell) => String(cell).trim() !== '')) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map((header) => String(header ?? '').replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map((cells) => {
    const out = {};
    headers.forEach((header, index) => {
      out[header] = cells[index] ?? '';
    });
    return out;
  });
}

function extractSourceAndTargetName(note) {
  const match = String(note ?? '').match(/^\s*([^>-]+?)\s*->\s*([^()]+?)(?:\s*\(|$)/);
  if (!match) return { sourceName: '', targetName: '' };
  return {
    sourceName: match[1].trim(),
    targetName: match[2].trim(),
  };
}

function buildMap(rows) {
  const bySourceId = new Map();
  const bySourceName = new Map();
  const debugBySourceName = new Map();

  for (const row of rows) {
    const msioId = normalizeItemId(row.msio_item_id ?? row.mapped_item_id ?? row.target_item_id ?? row.msio_id);
    if (!msioId || msioId <= 0) continue;

    const sourceId = normalizeItemId(row.osms_item_id ?? row.source_item_id ?? row.item_id ?? row.id);
    const { sourceName, targetName } = extractSourceAndTargetName(row.note);
    const sourceNames = [sourceName, row.osms_item_name, row.source_item_name, row.item_name, row.name]
      .filter(Boolean)
      .map(normalizeName)
      .filter(Boolean);

    if (sourceId) bySourceId.set(String(sourceId), msioId);
    for (const name of sourceNames) {
      bySourceName.set(name, msioId);
      debugBySourceName.set(name, targetName || String(msioId));
    }
  }

  return { bySourceId, bySourceName, debugBySourceName };
}

async function loadMap() {
  if (mapCache) return mapCache;
  if (!mapPromise) {
    mapPromise = fetch(MSIO_MAP_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`character_item_id_map.csv HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        mapCache = buildMap(parseCsv(text));
        return mapCache;
      });
  }
  return mapPromise;
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

function mapItemToMsioId(item, itemMap) {
  const rawId = normalizeItemId(item?.id);
  const byId = rawId ? itemMap?.bySourceId?.get(String(rawId)) : null;
  if (byId) return byId;

  const names = [item?.name, item?.title]
    .filter(Boolean)
    .map(normalizeName)
    .filter(Boolean);

  for (const name of names) {
    const byName = itemMap?.bySourceName?.get(name);
    if (byName) return byName;
  }

  return rawId;
}

function gearIdsFromRecommendations(gear, itemMap) {
  const byType = {};
  for (const item of gear ?? []) {
    const id = mapItemToMsioId(item, itemMap);
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

function buildAttemptUrls({ classLine, gender, gear, itemMap }) {
  const safeGender = normalizeGender(gender);
  const classId = classLine?.id ?? 'warrior';
  const seed = String(classId).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + (safeGender === 'female' ? 11 : 0);
  const hair = stablePick(HAIRS[safeGender], seed) ?? 31000;
  const face = stablePick(FACES[safeGender], seed) ?? 21000;
  const emote = EMOTE_BY_CLASS[classId] ?? 'default';
  const mappedRecommended = gearIdsFromRecommendations(gear, itemMap);
  const fallback = FALLBACK_EQUIPMENT[classId] ?? FALLBACK_EQUIPMENT.warrior;
  const baseClothes = BASE_CLOTHES[safeGender] ?? BASE_CLOTHES.female;

  const attempts = [
    mappedRecommended.length ? [...baseClothes, ...mappedRecommended] : null,
    mappedRecommended.length ? mappedRecommended : null,
    [...baseClothes, ...fallback],
    fallback,
    [baseClothes[0], baseClothes[1], fallback[fallback.length - 1]],
  ].filter(Boolean);

  return attempts.map((equipment) => buildMsciUrl({ hair, face, emote, equipment }));
}

export function buildCharacterImageUrl({ classLine, gender, gear, itemMap }) {
  return buildAttemptUrls({ classLine, gender, gear, itemMap })[0];
}

export default function CharacterPreview({ classLine, gender = 'female', gear = [] }) {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [itemMap, setItemMap] = useState(mapCache);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadMap()
      .then((loadedMap) => {
        if (!cancelled) {
          setItemMap(loadedMap);
          setMapError('');
          setAttemptIndex(0);
        }
      })
      .catch((error) => {
        if (!cancelled) setMapError(error?.message || '装备映射读取失败');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAttemptIndex(0);
  }, [classLine, gender, gear, itemMap]);

  const urls = useMemo(() => buildAttemptUrls({ classLine, gender, gear, itemMap }), [classLine, gender, gear, itemMap]);
  const src = urls[Math.min(attemptIndex, urls.length - 1)];

  if (!src || attemptIndex >= urls.length) {
    return (
      <div className={`pixel-avatar ${classLine?.id ?? ''}`} style={{ transform: 'scale(1.05)' }} title={mapError || '角色预览 fallback'}>
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
      title={mapError || src}
      onError={() => setAttemptIndex((index) => index + 1)}
      draggable="false"
    />
  );
}
