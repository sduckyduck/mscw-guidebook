import { useEffect, useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';
const SKIN = 2000;
const MAP_URL = 'https://raw.githubusercontent.com/sduckyduck/osms-classic-guidebook/main/public/data/character_item_id_map.csv?v=mscw-preview-v2';

const HAIR = {
  male: [30000, 30060, 30100, 30120, 30140, 30200, 30210, 30260, 30300],
  female: [31000, 31030, 31040, 31070, 31100, 31150, 31260, 31280, 31310],
};
const FACE = {
  male: [20000, 20001, 20002, 20003, 20005, 20011, 20014],
  female: [21000, 21001, 21002, 21003, 21004, 21010, 21014],
};
const BACKUP = {
  warrior: [1002001, 1060016, 1302000],
  magician: [1002019, 1050003, 1372000],
  bowman: [1002165, 1452000],
  thief: [1002170, 1472000],
  pirate: [1002610, 1492000],
};
const EMOTE = { warrior: 'angry', magician: 'bewildered', bowman: 'default', thief: 'wink', pirate: 'wink' };

let cachedMap = null;
let loadingMap = null;

function idNum(value) {
  const n = Number(String(value ?? '').replace(/^0+/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function norm(value) {
  return String(value ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function csvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"' && quoted && n === '"') { cell += '"'; i += 1; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === ',' && !quoted) { row.push(cell); cell = ''; continue; }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      continue;
    }
    cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

function namesFromNote(note) {
  const m = String(note ?? '').match(/^\s*([^>-]+?)\s*->\s*([^()]+?)(?:\s*\(|$)/);
  return m ? [m[1].trim(), m[2].trim()] : [];
}

function buildMap(text) {
  const rows = csvRows(text);
  const heads = rows.shift()?.map((h) => h.replace(/^\uFEFF/, '').trim()) ?? [];
  const byId = new Map();
  const byName = new Map();
  for (const cells of rows) {
    const r = Object.fromEntries(heads.map((h, i) => [h, cells[i] ?? '']));
    const target = idNum(r.msio_item_id ?? r.mapped_item_id ?? r.target_item_id ?? r.msio_id);
    if (!target) continue;
    const source = idNum(r.osms_item_id ?? r.source_item_id ?? r.item_id ?? r.id);
    if (source) byId.set(String(source), target);
    [r.osms_item_name, r.source_item_name, r.item_name, r.name, ...namesFromNote(r.note)].filter(Boolean).forEach((name) => byName.set(norm(name), target));
  }
  return { byId, byName };
}

async function loadIdMap() {
  if (cachedMap) return cachedMap;
  if (!loadingMap) {
    loadingMap = fetch(MAP_URL, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error(`map csv ${r.status}`);
      return r.text();
    }).then((text) => {
      cachedMap = buildMap(text);
      return cachedMap;
    });
  }
  return loadingMap;
}

function mapOne(item, idMap) {
  const local = idNum(item?.id);
  const mapped = local ? idMap?.byId?.get(String(local)) : null;
  if (mapped) return mapped;
  for (const name of [item?.name, item?.title].filter(Boolean).map(norm)) {
    const hit = idMap?.byName?.get(name);
    if (hit) return hit;
  }
  return local;
}

function mappedGear(gear, idMap) {
  const slots = {};
  for (const item of gear ?? []) {
    const id = mapOne(item, idMap);
    if (!id) continue;
    const slot = item.slot || 'other';
    if (slot === 'overall') {
      slots.overall = id;
      delete slots.top;
      delete slots.bottom;
    } else if (['cap', 'top', 'bottom', 'shoes', 'glove', 'cape', 'shield', 'weapon'].includes(slot)) {
      slots[slot] = id;
    }
  }
  return [slots.cap, slots.overall, slots.top, slots.bottom, slots.shoes, slots.glove, slots.cape, slots.shield, slots.weapon].filter(Boolean);
}

function actionFor(gear) {
  const w = (gear ?? []).find((item) => item.slot === 'weapon');
  const txt = `${w?.weaponType ?? w?.weapon_type ?? ''} ${w?.title ?? w?.name ?? ''}`.toLowerCase();
  return txt.includes('crossbow') || txt.includes('pole arm') || txt.includes('polearm') || txt.includes('spear') ? 'stand2' : 'stand1';
}

function unique(ids) {
  const seen = new Set();
  return (ids ?? []).map(idNum).filter(Boolean).filter((id) => {
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function url({ hair, face, emote, ids, action }) {
  const entries = [hair, `${face}:${emote}`, ...unique(ids)];
  const path = encodeURIComponent(entries.join(','));
  return `https://maplestory.io/api/${API_REGION}/${API_VERSION}/Character/${SKIN}/${path}/${encodeURIComponent(action)}/0?resize=3&renderMode=Full&bgColor=0,0,0,0&faceEmote=${encodeURIComponent(emote)}`;
}

function urlsFor({ classLine, gender, gear, idMap }) {
  const g = gender === 'male' ? 'male' : 'female';
  const classId = classLine?.id ?? 'warrior';
  const seed = classId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) + (g === 'female' ? 11 : 0);
  const hair = HAIR[g][Math.abs(seed) % HAIR[g].length];
  const face = FACE[g][Math.abs(seed) % FACE[g].length];
  const emote = EMOTE[classId] ?? 'default';
  const action = actionFor(gear);
  const recommended = mappedGear(gear, idMap);
  const backup = BACKUP[classId] ?? BACKUP.warrior;
  return [recommended.length ? recommended : null, backup].filter(Boolean).map((ids) => url({ hair, face, emote, ids, action }));
}

export function buildCharacterImageUrl({ classLine, gender, gear, itemMap }) {
  return urlsFor({ classLine, gender, gear, idMap: itemMap })[0];
}

export default function CharacterPreview({ classLine, gender = 'female', gear = [] }) {
  const [attempt, setAttempt] = useState(0);
  const [idMap, setIdMap] = useState(cachedMap);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let stopped = false;
    loadIdMap().then((m) => {
      if (!stopped) { setIdMap(m); setMapError(''); setAttempt(0); }
    }).catch((e) => { if (!stopped) setMapError(e?.message || '装备映射读取失败'); });
    return () => { stopped = true; };
  }, []);

  useEffect(() => { setAttempt(0); }, [classLine, gender, gear, idMap]);

  const urls = useMemo(() => urlsFor({ classLine, gender, gear, idMap }), [classLine, gender, gear, idMap]);
  const src = urls[Math.min(attempt, urls.length - 1)];

  if (!src || attempt >= urls.length) {
    return <div className={`pixel-avatar ${classLine?.id ?? ''}`} style={{ transform: 'scale(1.05)' }} title={mapError || '角色预览 fallback'}><div className="avatar-hat" /><div className="avatar-face" /><div className="avatar-body" /><div className="avatar-weapon" /></div>;
  }

  return <img key={src} className="real-character-preview" src={src} alt={`${classLine?.name ?? '角色'} preview`} title={mapError || src} onError={() => setAttempt((i) => i + 1)} draggable="false" />;
}
