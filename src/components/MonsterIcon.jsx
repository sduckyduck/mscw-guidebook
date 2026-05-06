import OsmsDataImage, { getImageSources } from './OsmsDataImage.jsx';

const API_REGION = 'GMS';
const API_VERSION = '83';

const MOB_ID_BY_NAME = {
  'snail': 100100,
  'blue snail': 100101,
  'red snail': 100120,
  'shroom': 1110100,
  'orange mushroom': 1110100,
  'slime': 210100,
  'stump': 1130100,
  'dark stump': 1140100,
  'green mushroom': 1110101,
  'horny mushroom': 1120100,
  'blue mushroom': 1120101,
  'zombie mushroom': 2230102,
  'evil eye': 3230100,
  'curse eye': 3230101,
  'jr. necki': 210100,
  'pig': 1210100,
  'ribbon pig': 1210101,
  'octopus': 2230100,
  'blue mushmom': 8220007,
  'mushmom': 6130101,
  'mano': 2220000,
  'stirge': 2300100,
  'wild boar': 2230101,
  'fire boar': 3210100,
  'wooden mask': 3210200,
  'stone mask': 4230100,
  'iron hog': 4230101,
  'zombie lupin': 4230106,
  'lupin': 3210101,
  'blue lupin': 4230102,
  'cold eye': 4230103,
  'drake': 5130100,
  'copper drake': 5130101,
  'wild cargo': 6230100
};

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function getMonsterId(monster) {
  const explicit = Number(monster?.mapleMobId ?? monster?.mobId ?? monster?.monsterId ?? monster?.msioId);
  if (Number.isFinite(explicit) && explicit > 10000) return explicit;
  const byName = MOB_ID_BY_NAME[normalizeName(monster?.name)];
  return byName || null;
}

export function getMonsterIconSources(monster, resize = 3) {
  const id = getMonsterId(monster);
  const local = getImageSources(monster?.gifs?.stand || monster?.gifs?.move || monster?.gif || monster?.thumbnail, [
    monster?.gifs?.move,
    monster?.gif,
    monster?.thumbnail,
  ]);
  const remote = id ? `https://maplestory.io/api/${API_REGION}/${API_VERSION}/mob/${id}/icon?resize=${resize}` : '';
  return [...local, remote].filter(Boolean);
}

export default function MonsterIcon({ monster, size = 36, resize = 3 }) {
  const sources = getMonsterIconSources(monster, resize);
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
