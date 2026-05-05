import { MAPS, MONSTERS } from '../data/maps.js';

const seedMonsterById = Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster]));

export function getMapRecommendations({ classLine, level, statPlan, maps = MAPS, monsters = MONSTERS }) {
  const playerLevel = Number(level) || 1;
  const accuracy = classLine.id === 'magician' ? statPlan.derived.magicAccuracy : statPlan.derived.accuracy;
  const monsterById = Object.fromEntries(monsters.map((monster) => [monster.id, monster]));

  return maps.map((map) => {
    const mapMonsters = Array.isArray(map.monsterDetails)
      ? map.monsterDetails
      : map.monsters.map((id) => monsterById[id] ?? seedMonsterById[id]).filter(Boolean);
    const levelScore = scoreLevelFit(playerLevel, map.levelRange);
    const hitScore = scoreHitFit(accuracy, mapMonsters);
    const classScore = scoreClassFit(classLine.id, mapMonsters, map);
    const densityScore = scoreDensity(map);
    const riskPenalty = mapMonsters.some((monster) => monster.requiredAccuracy > accuracy + 18) ? 16 : 0;
    const score = Math.round(levelScore + hitScore + classScore + densityScore - riskPenalty);

    return {
      ...map,
      monsters: mapMonsters,
      score: Math.max(0, Math.min(100, score)),
      accuracy,
      canHitAll: mapMonsters.every((monster) => accuracy >= monster.requiredAccuracy),
      warning: buildWarning(accuracy, mapMonsters, classLine.id),
    };
  }).sort((a, b) => b.score - a.score || b.spawnTotal - a.spawnTotal);
}

function scoreLevelFit(level, [min, max]) {
  if (level >= min && level <= max) return 42;
  const distance = level < min ? min - level : level - max;
  return Math.max(0, 42 - distance * 6);
}

function scoreHitFit(accuracy, monsters) {
  if (!monsters.length) return 0;
  const averageGap = monsters.reduce((sum, monster) => sum + (accuracy - monster.requiredAccuracy), 0) / monsters.length;
  if (averageGap >= 15) return 24;
  if (averageGap >= 0) return 18;
  if (averageGap >= -10) return 8;
  return 0;
}

function scoreClassFit(classId, monsters, map) {
  if (classId === 'cleric' || classId === 'magician') {
    if (monsters.some((monster) => monster.elementWeakness.includes('holy') || monster.undead)) return 20;
  }
  if (classId === 'warrior' && map.tags.includes('战士友好')) return 16;
  if (classId === 'bowman' && !map.tags.includes('高血量')) return 10;
  if (classId === 'thief' && (map.tags.includes('热门') || map.tags.includes('高密度'))) return 10;
  if (classId === 'pirate' && (map.tags.includes('密集') || map.tags.includes('高密度'))) return 8;
  return 6;
}

function scoreDensity(map) {
  if (Number(map.spawnTotal) >= 35) return 16;
  if (Number(map.spawnTotal) >= 18) return 11;
  if (map.tags.includes('密集') || map.tags.includes('热门')) return 12;
  return 6;
}

function buildWarning(accuracy, monsters, classId) {
  const hardTargets = monsters.filter((monster) => accuracy < monster.requiredAccuracy);
  if (!hardTargets.length) return '命中压力可控，可以尝试。';
  const names = hardTargets.slice(0, 3).map((monster) => monster.name).join('、');
  const suffix = hardTargets.length > 3 ? ` 等 ${hardTargets.length} 种怪` : '';
  if (classId === 'magician') return `${names}${suffix} 的魔法命中可能不稳，建议降低等级差或补 INT/LUK。`;
  return `${names}${suffix} 的命中要求偏高，建议补 DEX/命中装备后再来。`;
}

export function getMonsterRows(map) {
  return map.monsters.map((monster) => ({
    name: monster.name,
    level: monster.level,
    hp: monster.hp,
    exp: monster.exp,
    requiredAccuracy: monster.requiredAccuracy,
    defense: monster.defense,
    attackType: monster.attackType,
    element: formatElement(monster),
  }));
}

function formatElement(monster) {
  const weak = monster.elementWeakness.length ? `弱: ${monster.elementWeakness.join('/')}` : '无明显弱点';
  const resist = monster.elementResist.length ? `抗: ${monster.elementResist.join('/')}` : '无明显抗性';
  return `${weak}; ${resist}`;
}
