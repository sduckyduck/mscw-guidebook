import { useEffect, useMemo, useState } from 'react';
import { baseUrl } from './IconFallback.jsx';

const LOCAL_MONSTER_ICON_BY_NAME = {
  'tutorial jr sentinel': '0000001_Tutorial_Jr._Sentinel.png',
  snail: '0000002_Snail.png',
  'blue snail': '0000003_Blue_Snail.png',
  shroom: '0000004_Shroom.png',
  'red snail': '0000005_Red_Snail.png',
  stump: '0000006_Stump.png',
  slime: '0000007_Slime.png',
  pig: '0000008_Pig.png',
  'orange mushroom': '0000009_Orange_Mushroom.png',
  'ribbon pig': '0000010_Ribbon_Pig.png',
  'dark stump': '0000011_Dark_Stump.png',
  octopus: '0000012_Octopus.png',
  'green mushroom': '0000013_Green_Mushroom.png',
  bubbling: '0000014_Bubbling.png',
  'axe stump': '0000015_Axe_Stump.png',
  'blue mushroom': '0000016_Blue_Mushroom.png',
  stirge: '0000017_Stirge.png',
  'jr necki': '0000018_Jr._Necki.png',
  'horny mushroom': '0000019_Horny_Mushroom.png',
  'dark axe stump': '0000020_Dark_Axe_Stump.png',
  'zombie mushroom': '0000021_Zombie_Mushroom.png',
  'wild boar': '0000022_Wild_Boar.png',
  'evil eye': '0000023_Evil_Eye.png',
  'iron hog': '0000024_Iron_Hog.png',
  ligator: '0000029_Ligator.png',
  'fire boar': '0000030_Fire_Boar.png',
  'curse eye': '0000031_Curse_Eye.png',
  'jr wraith': '0000032_Jr._Wraith.png',
  lupin: '0000035_Lupin.png',
  lorang: '0000036_Lorang.png',
  'cold eye': '0000037_Cold_Eye.png',
  'zombie lupin': '0000038_Zombie_Lupin.png',
  'copper drake': '0000040_Copper_Drake.png',
  tortie: '0000041_Tortie.png',
  wraith: '0000043_Wraith.png',
  clang: '0000044_Clang.png',
  drake: '0000045_Drake.png',
  croco: '0000046_Croco.png',
  malady: '0000047_Malady.png',
  'stone golem': '0000048_Stone_Golem.png',
  'dark stone golem': '0000049_Dark_Stone_Golem.png',
  'red drake': '0000050_Red_Drake.png',
  'wild kargo': '0000051_Wild_Kargo.png',
  tauromacis: '0000052_Tauromacis.png',
  taurospear: '0000053_Taurospear.png',
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeMonsterName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\bjr\.?\b/g, 'jr')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleMonsterName(value = '') {
  return String(value)
    .trim()
    .replace(/[’']/g, '')
    .replace(/\bjr\.?\b/gi, 'Jr.')
    .replace(/[^a-z0-9.]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => (/^jr\.?$/i.test(part) ? 'Jr.' : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join('_');
}

function iconPath(fileName) {
  return fileName ? `${baseUrl()}icons/monsters/${fileName}` : '';
}

export function getMonsterIconSources(monster) {
  const rawName = String(monster?.name ?? '').trim();
  const key = normalizeMonsterName(rawName);
  const title = titleMonsterName(rawName);

  return unique([
    iconPath(LOCAL_MONSTER_ICON_BY_NAME[key]),
    title ? iconPath(`${title}.png`) : '',
    title ? iconPath(`${title.replace(/\./g, '')}.png`) : '',
  ]);
}

export default function MonsterIcon({ monster, size = 36 }) {
  const sources = useMemo(() => getMonsterIconSources(monster), [monster?.name]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [sources.join('|')]);

  const src = sources[index];
  return (
    <div className="mg-monster-icon" style={{ width: size + 10, height: size + 10 }}>
      {src ? (
        <img
          src={src}
          alt={monster?.name ?? ''}
          draggable="false"
          loading="eager"
          decoding="async"
          onError={() => setIndex((value) => value + 1)}
          style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
        />
      ) : null}
    </div>
  );
}
