import { useEffect, useMemo, useState } from 'react';
import OsmsDataImage, { getImageSources } from './OsmsDataImage.jsx';

const OSMS_MONSTERS_URL = 'https://sduckyduck.github.io/osms-classic-guidebook/data/monsters.json';
const OSMS_DATA_BASE = 'https://sduckyduck.github.io/osms-classic-guidebook/data/';

let osmsMonsterIndex = null;
let osmsMonsterPromise = null;

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function osmsAsset(path) {
  if (!path) return '';
  const text = String(path);
  if (/^https?:\/\//i.test(text)) return text;
  const clean = text
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .replace(/^data\//, '')
    .replace(/^AppData\//, '');
  return `${OSMS_DATA_BASE}${clean}`;
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

async function loadOsmsMonsterIndex() {
  if (osmsMonsterIndex) return osmsMonsterIndex;
  if (!osmsMonsterPromise) {
    osmsMonsterPromise = fetch(OSMS_MONSTERS_URL, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`OSMS monsters ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        osmsMonsterIndex = buildIndex(payload);
        return osmsMonsterIndex;
      });
  }
  return osmsMonsterPromise;
}

function osmsSourcesFor(monster, index) {
  const matched = index?.get(normalizeName(monster?.name));
  if (!matched) return [];
  return [
    matched.gifs?.stand,
    matched.gifs?.move,
    matched.gif,
    matched.thumbnail,
  ].map(osmsAsset).filter(Boolean);
}

export function getMonsterIconSources(monster, index) {
  const osms = osmsSourcesFor(monster, index);
  const local = getImageSources(monster?.gifs?.stand || monster?.gifs?.move || monster?.gif || monster?.thumbnail, [
    monster?.gifs?.move,
    monster?.gif,
    monster?.thumbnail,
  ]);
  return [...osms, ...local].filter(Boolean);
}

export default function MonsterIcon({ monster, size = 36 }) {
  const [index, setIndex] = useState(osmsMonsterIndex);
  const sources = useMemo(() => getMonsterIconSources(monster, index), [monster, index]);

  useEffect(() => {
    let stopped = false;
    loadOsmsMonsterIndex().then((loaded) => {
      if (!stopped) setIndex(loaded);
    }).catch(() => {});
    return () => { stopped = true; };
  }, []);

  return (
    <div style={{ width: size + 10, height: size + 10, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 10, background: '#fff', flex: '0 0 auto' }}>
      <OsmsDataImage
        src={sources[0]}
        sources={sources.slice(1)}
        alt={monster?.name ?? ''}
        placeholder="—"
        style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
