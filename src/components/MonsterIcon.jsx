import { useEffect, useMemo, useState } from 'react';
import IconFallback, { iconSourcesFromNames } from './IconFallback.jsx';

const OSMS_MONSTERS_URLS = [
  'https://sduckyduck.github.io/osms-classic-guidebook/data/monsters.json',
  'https://raw.githubusercontent.com/sduckyduck/osms-classic-guidebook/main/public/data/monsters.json',
];
const OSMS_DATA_BASE = 'https://sduckyduck.github.io/osms-classic-guidebook/data/';
const API_REGION = 'GMS';
const API_VERSION = '83';

const VERIFIED_MSIO_ID_BY_NAME = {
  'horny mushroom': 2110200,
  'zombie mushroom': 2230102,
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
  'jr necki': 2230103,
  'stirge': 2300100,
  'pig': 1210100,
  'ribbon pig': 1210101,
  'octopus': 2230100,
  'lupin': 3210101,
  'zombie lupin': 4230106,
  'fire boar': 3210100,
  'wild boar': 2230101,
};

const MONSTER_LOCAL_ALIASES = {
  'horny mushroom': ['horny mushroom', 'horny-mushroom', 'horny_mushroom', 'mushroom-horny', '2110200'],
  'zombie mushroom': ['zombie mushroom', 'zombie-mushroom', 'zombie_mushroom', '2230102'],
  'evil eye': ['evil eye', 'evil-eye', 'evil_eye', '3230100'],
  'slime': ['slime', '210100'],
  'dark stump': ['dark stump', 'dark-stump', 'dark_stump', '1140100'],
  'stump': ['stump', '1130100'],
  'green mushroom': ['green mushroom', 'green-mushroom', 'green_mushroom', '1110101'],
  'blue mushroom': ['blue mushroom', 'blue-mushroom', 'blue_mushroom', '1120101'],
  'orange mushroom': ['orange mushroom', 'orange-mushroom', 'orange_mushroom', '1110100'],
  'shroom': ['shroom', '1110100'],
  'pig': ['pig', '1210100'],
  'ribbon pig': ['ribbon pig', 'ribbon-pig', 'ribbon_pig', '1210101'],
  'octopus': ['octopus', '2230100'],
  'lupin': ['lupin', '3210101'],
  'zombie lupin': ['zombie lupin', 'zombie-lupin', 'zombie_lupin', '4230106'],
  'fire boar': ['fire boar', 'fire-boar', 'fire_boar', '3210100'],
  'wild boar': ['wild boar', 'wild-boar', 'wild_boar', '2230101'],
};

const MONSTER_ICON_FOLDERS = ['icons/monsters', 'icons/monster', 'icons'];

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
      const response = await fetch(`${url}?v=png-monster-icons-5`, { cache: 'no-store' });
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

function getMonsterNames(monster) {
  const key = normalizeName(monster?.name);
  const aliases = MONSTER_LOCAL_ALIASES[key] ?? [];
  const id = monster?.id ?? monster?.mobId ?? monster?.monsterId ?? monster?.mapleMobId ?? monster?.msioId ?? LAST_RESORT_MSIO_ID_BY_NAME[key];
  return unique([monster?.name, key, id, ...aliases]);
}

function getLocalMonsterSources(monster) {
  return iconSourcesFromNames(getMonsterNames(monster), MONSTER_ICON_FOLDERS);
}

export function getMonsterIconSources(monster, index) {
  const matched = index?.get(normalizeName(monster?.name));

  return unique([
    // 1) Direct path guesses for user-uploaded icons in public/icons.
    ...getLocalMonsterSources(monster),

    // 2) Known-good MapleStory.io mob IDs where local/OSMS data can be stale.
    getMapleStoryIoSource(monster, true),

    // 3) OSMS Guide fallback by monster name.
    osmsAsset(matched?.thumbnail),
    osmsAsset(matched?.gifs?.stand),
    osmsAsset(matched?.gifs?.move),
    osmsAsset(matched?.gif),

    // 4) Last-resort MapleStory.io icon by name, so the cell is not blank.
    getMapleStoryIoSource(monster),

    // 5) Current local AppData assets if the deployed bundle includes them.
    localAsset(monster?.thumbnail),
    localAsset(monster?.gifs?.stand),
    localAsset(monster?.gifs?.move),
    localAsset(monster?.gif),
  ]);
}

export default function MonsterIcon({ monster, size = 36 }) {
  const [index, setIndex] = useState(osmsMonsterIndex);
  const sources = useMemo(() => getMonsterIconSources(monster, index), [monster, index]);
  const names = useMemo(() => getMonsterNames(monster), [monster]);

  useEffect(() => {
    let stopped = false;
    loadOsmsMonsterIndex().then((loaded) => {
      if (!stopped) setIndex(loaded);
    }).catch(() => {});
    return () => { stopped = true; };
  }, []);

  return (
    <div style={{ width: size + 10, height: size + 10, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 10, background: '#fff', flex: '0 0 auto' }}>
      <IconFallback
        names={names}
        folders={MONSTER_ICON_FOLDERS}
        sources={sources}
        alt={monster?.name ?? ''}
        debugLabel={`monster:${monster?.name ?? ''}`}
        fallback={<span style={{ color: '#b8c2cc', fontWeight: 1000 }}>—</span>}
        style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
