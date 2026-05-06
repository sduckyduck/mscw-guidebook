import OsmsDataImage, { getImageSources } from './OsmsDataImage.jsx';

const API_REGION = 'GMS';
const API_VERSION = '83';

function getMonsterId(monster) {
  const value = Number(monster?.mapleMobId ?? monster?.mobId ?? monster?.monsterId ?? monster?.msioId);
  return Number.isFinite(value) && value > 0 ? value : null;
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
