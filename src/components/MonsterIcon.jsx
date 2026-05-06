import { useEffect, useMemo, useState } from 'react';

const API_REGION = 'GMS';
const API_VERSION = '83';

function isRemotePath(value) {
  const text = String(value || '');
  return text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:') || text.startsWith('blob:');
}

function cleanLocalPath(value) {
  return String(value || '').replace(/^\.\//, '').replace(/^\//, '');
}

function baseUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function assetUrl(path) {
  if (!path) return '';
  const text = String(path);
  if (isRemotePath(text)) return text;
  return `${baseUrl()}${cleanLocalPath(text)}`;
}

function getMonsterId(monster) {
  const value = Number(monster?.mapleMobId ?? monster?.mobId ?? monster?.monsterId ?? monster?.msioId);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getMonsterIconSources(monster, resize = 3) {
  const id = getMonsterId(monster);
  const local = [
    monster?.gifs?.stand,
    monster?.gifs?.move,
    monster?.gif,
    monster?.thumbnail,
  ].map(assetUrl).filter(Boolean);

  const remote = id ? `https://maplestory.io/api/${API_REGION}/${API_VERSION}/mob/${id}/icon?resize=${resize}` : '';
  return [...local, remote].filter(Boolean);
}

export default function MonsterIcon({ monster, size = 36, resize = 3 }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = useMemo(() => getMonsterIconSources(monster, resize), [monster, resize]);

  useEffect(() => setSourceIndex(0), [monster?.id, monster?.name, monster?.thumbnail, monster?.gif, monster?.gifs?.stand, monster?.gifs?.move]);

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
