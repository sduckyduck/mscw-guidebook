import { MAPS, MONSTERS } from '../data/maps.js';

const monsterById = Object.fromEntries(MONSTERS.map((monster) => [monster.id, monster]));

export function getMapRecommendations({ classLine, level, statPlan }) {
  const playerLevel = Number(level) || 1;
  const accuracy = classLine.id === 'magician' ? statPlan.derived.magicAccuracy : statPlan.derived.accuracy;

  return MAPS.map((map) => {
    const monsters = map.monsters.map((id) => monsterById[id]).filter(Boolean);
    const levelScore = scoreLevelFit(playerLevel, map.levelRange);
    const hitScore = scoreHitFit(accuracy, monsters);
    const classScore = scoreClassFit(classLine.id, monsters, map);
    const densityScore = map.tags.includes('密集') || map.tags.includes('热门') ? 12 : 6;
    const riskPenalty = monsters.some((monster) => monster.requiredAccuracy > accuracy + 18) ? 16 : 0;
    const score = Math.round(levelScore + hitScore + classScore + densityScore - riskPenalty);

    return {
      ...map,
      monsters,
      score: Math.max(0, Math.min(100, score)),
      accuracy,
      canHitAll: monsters.every((monster) => accuracy >= monster.requiredAccuracy),
      warning: buildWarning(accuracy, monsters, classLine.id),
    };
  }).sort((a, b) => b.score - a.score);
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
    if (monsters.some((monster) => monster.elementWeakness.includes('holy'))) return 20;
  }
  if (classId === 'warrior' && map.tags.includes('战士友好')) return 16;
  if (classId === 'bowman' && !map.tags.includes('高血量')) return 10;
  if (classId === 'thief' && map.tags.includes('热门')) return 10;
  if (classId === 'pirate' && map.tags.includes('密集')) return 8;
  return 6;
}

function buildWarning(accuracy, monsters, classId) {
  const hardTargets = monsters.filter((monster) => accuracy < monster.requiredAccuracy);
  if (!hardTargets.length) return '命中压力可控，可以尝试。';
  const names = hardTargets.map((monster) => monster.name).join('、');
  if (classId === 'magician') return `${names} 的魔法命中可能不稳，建议降低等级差或补 INT/LUK。`;
  return `${names} 的命中要求偏高，建议补 DEX/命中装备后再来。`;
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
