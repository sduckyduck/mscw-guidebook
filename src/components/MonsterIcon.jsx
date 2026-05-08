import { baseUrl } from './IconFallback.jsx';

function fileName(name = '') {
  return String(name).trim().replaceAll(' ', '_');
}

export function getMonsterIconSources(monster) {
  const name = fileName(monster?.name || '');
  return name ? [`${baseUrl()}icons/monsters/${name}.png`] : [];
}

export default function MonsterIcon({ monster, size = 36 }) {
  const sources = getMonsterIconSources(monster);
  const src = sources[0];
  return (
    <div className="mg-monster-icon" style={{ width: size + 10, height: size + 10 }}>
      {src ? <img src={src} alt={monster?.name || ''} draggable="false" loading="eager" decoding="async" style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} /> : null}
    </div>
  );
}
