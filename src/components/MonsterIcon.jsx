import { useEffect, useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';

function getMonsterId(monster) {
  const value = Number(monster?.mapleMobId ?? monster?.mobId ?? monster?.monsterId ?? monster?.id);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getMonsterIconSources(monster, resize = 3) {
  const id = getMonsterId(monster);
  return [
    id ? `https://maplestory.io/api/${API_REGION}/${API_VERSION}/mob/${id}/icon?resize=${resize}` : null,
    monster?.gif,
    monster?.thumbnail,
  ].filter(Boolean);
}

export default function MonsterIcon({ monster, size = 36, resize = 3 }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getMonsterIconSources(monster, resize), [monster, resize]);

  useEffect(() => setSourceIndex(0), [monster?.id, monster?.name, monster?.thumbnail, monster?.gif]);

  return (
    <div style={{ width: size + 10, height: size + 10, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 10, background: '#fff', flex: '0 0 auto' }}>
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
