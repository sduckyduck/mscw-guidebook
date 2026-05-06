import { useEffect, useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';
const MAP_URL = 'https://raw.githubusercontent.com/sduckyduck/osms-classic-guidebook/main/public/data/character_item_id_map.csv?v=mscw-icon-map-v1';

let cachedMap = null;
let loadingMap = null;

function idNum(value) {
  const n = Number(String(value ?? '').replace(/^0+/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function norm(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function csvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (c === '"' && quoted && n === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (c === '"') {
      quoted = !quoted;
      continue;
    }
    if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
      continue;
    }
    if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && n === '\n') i += 1;
      row.push(cell);
      cell = '';
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
    const row = Object.fromEntries(heads.map((h, i) => [h, cells[i] ?? '']));
    const target = idNum(row.msio_item_id ?? row.mapped_item_id ?? row.target_item_id ?? row.msio_id);
    if (!target) continue;

    const source = idNum(row.osms_item_id ?? row.source_item_id ?? row.item_id ?? row.id);
    if (source) byId.set(String(source), target);

    [row.osms_item_name, row.source_item_name, row.item_name, row.name, ...namesFromNote(row.note)]
      .filter(Boolean)
      .forEach((name) => byName.set(norm(name), target));
  }

  return { byId, byName };
}

async function loadMap() {
  if (cachedMap) return cachedMap;
  if (!loadingMap) {
    loadingMap = fetch(MAP_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`item map ${response.status}`);
        return response.text();
      })
      .then((text) => {
        cachedMap = buildMap(text);
        return cachedMap;
      });
  }
  return loadingMap;
}

export function getMappedMsioItemId(item, itemMap) {
  const names = [item?.title, item?.name]
    .filter(Boolean)
    .map(norm)
    .filter(Boolean);

  for (const name of names) {
    const hit = itemMap?.byName?.get(name);
    if (hit) return hit;
  }

  const local = idNum(item?.id);
  const mappedById = local ? itemMap?.byId?.get(String(local)) : null;
  return mappedById || local;
}

export function getMsioIconUrl(item, itemMap) {
  const id = getMappedMsioItemId(item, itemMap);
  return id ? `https://maplestory.io/api/${API_REGION}/${API_VERSION}/item/${id}/icon` : '';
}

export default function MsioItemIcon({ item, size = 32 }) {
  const [itemMap, setItemMap] = useState(cachedMap);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    let stopped = false;
    loadMap().then((map) => {
      if (!stopped) setItemMap(map);
    }).catch(() => {});
    return () => { stopped = true; };
  }, []);

  useEffect(() => setSourceIndex(0), [item?.id, item?.title, item?.name, itemMap]);

  const sources = useMemo(() => {
    const mappedIcon = getMsioIconUrl(item, itemMap);
    return [mappedIcon, item?.thumbnail].filter(Boolean);
  }, [item, itemMap]);

  return (
    <div style={{ width: size + 8, height: size + 8, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 10, background: '#fff', marginBottom: 5 }}>
      {sources[sourceIndex] ? (
        <img
          src={sources[sourceIndex]}
          alt=""
          onError={() => setSourceIndex((value) => value + 1)}
          style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
        />
      ) : (
        <span style={{ color: '#b8c2cc', fontWeight: 1000 }}>—</span>
      )}
    </div>
  );
}
