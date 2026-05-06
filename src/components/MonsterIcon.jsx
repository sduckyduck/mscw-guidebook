import { useEffect, useMemo, useState } from 'react';

const OSMS_MONSTERS_URLS = [
  'https://sduckyduck.github.io/osms-classic-guidebook/data/monsters.json',
  'https://raw.githubusercontent.com/sduckyduck/osms-classic-guidebook/main/public/data/monsters.json',
];
const OSMS_DATA_BASE = 'https://sduckyduck.github.io/osms-classic-guidebook/data/';
const API_REGION = 'GMS';
const API_VERSION = '83';

// These names are known to be easy to mismatch when using local sequential OSMS image IDs.
// Put them first so the displayed icon follows the real MapleStory.io mob ID instead of a stale local thumbnail.
const VERIFIED_MSIO_ID_BY_NAME = {
  'horny mushroom': 2110200,
};

const LAST_RESORT_MSIO_ID_BY_NAME = {
  'horny mushroom': 2110200,
  'zombie mushroom': 2230102,
  'evil eye': 3230100,
  'slime': 210100,
  'dark stump': 1140100,
  'stump': 1130100,
  'green mushroom': 1110101,
  'blue mushroom': 1120101,
  'shroom': 1110100,
  'orange mushroom': 1110100,
  'snail': 100100,
  'blue snail': 100101,
  'red snail': 100120,
  'pig': 1210100,
  'ribbon pig': 1210101,
  'octopus': 2230100,
  'lupin': 3210101,
  'zombie lupin': 4230106,
  'fire boar': 3210100,
  'wild boar': 2230101,
};

let osmsMonsterIndex = null;
let osmsMonsterPromise = null;

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\bjr\.?\b/g, 'jr')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function baseUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function isRemote(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function cleanPath(value) {
  return String(value || '')
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .replace(/^data\//, '')
    .replace(/^AppData\//, '');
}

function osmsAsset(path) {
  if (!path) return '';
  if (isRemote(path)) return path;
  return `${OSMS_DATA_BASE}${cleanPath(path)}`;
}

function localAsset(path) {
  if (!path) return '';
  if (isRemote(path) || String(path).startsWith('/')) return String(path);
  return `${baseUrl()}AppData/${cleanPath(path)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildIndex(payload) {
  const list = Array.isArray(payload?.monsters) ? payload.monsters : Array.isArray(payload) ? payload : [];
  const index = new Map();
  for (const monster of list) {
    const key = normalizeName(monster.name);
    if (key && !index.has(key)) index.set(key, monster);
  }
  return index;
}

async function fetchFirstJson(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(`${url}?v=png-monster-icons-3`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${url} ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error('Unable to load monster index');
}

async function loadOsmsMonsterIndex() {
  if (osmsMonsterIndex) return osmsMonsterIndex;
  if (!osmsMonsterPromise) {
    osmsMonsterPromise = fetchFirstJson(OSMS_MONSTERS_URLS).then((payload) => {
      osmsMonsterIndex = buildIndex(payload);
      return osmsMonsterIndex;
    });
  }
  return osmsMonsterPromise;
}

function getMapleStoryIoSource(monster, preferredOnly = false) {
  const key = normalizeName(monster?.name);
  const explicit = Number(monster?.mapleMobId ?? monster?.mobId ?? monster?.monsterId ?? monster?.msioId);
  const id = Number.isFinite(explicit) && explicit > 10000
    ? explicit
    : preferredOnly
      ? VERIFIED_MSIO_ID_BY_NAME[key]
      : LAST_RESORT_MSIO_ID_BY_NAME[key];
  return id ? `https://maplestory.io/api/${API_REGION}/${API_VERSION}/mob/${id}/icon?resize=3` : '';
}

export function getMonsterIconSources(monster, index) {
  const matched = index?.get(normalizeName(monster?.name));

  return unique([
    // 1) Verified MapleStory.io IDs first for names where local data has mismatched thumbnails.
    getMapleStoryIoSource(monster, true),

    // 2) PNG first from OSMS Guide by monster name.
    osmsAsset(matched?.thumbnail),

    // 3) PNG first from current MSCW AppData if present.
    localAsset(monster?.thumbnail),

    // 4) OSMS gif/webp only after PNG fails.
    osmsAsset(matched?.gifs?.stand),
    osmsAsset(matched?.gifs?.move),
    osmsAsset(matched?.gif),

    // 5) Current local gif/webp only after PNG fails.
    localAsset(monster?.gifs?.stand),
    localAsset(monster?.gifs?.move),
    localAsset(monster?.gif),

    // 6) Last-resort MapleStory.io icon by name, so the cell is not blank.
    getMapleStoryIoSource(monster),
  ]);
}

export default function MonsterIcon({ monster, size = 36 }) {
  const [index, setIndex] = useState(osmsMonsterIndex);
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getMonsterIconSources(monster, index), [monster, index]);

  useEffect(() => {
    let stopped = false;
    loadOsmsMonsterIndex().then((loaded) => {
      if (!stopped) setIndex(loaded);
    }).catch(() => {});
    return () => { stopped = true; };
  }, []);

  useEffect(() => setSourceIndex(0), [monster?.name, monster?.id, sources.join('|')]);

  return (
    <div style={{ width: size + 10, height: size + 10, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 10, background: '#fff', flex: '0 0 auto' }}>
      {sources[sourceIndex] ? (
        <img
          src={sources[sourceIndex]}
          alt={monster?.name ?? ''}
          onError={() => setSourceIndex((value) => value + 1)}
          style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
        />
      ) : (
        <span style={{ color: '#b8c2cc', fontWeight: 1000 }}>—</span>
      )}
    </div>
  );
}
