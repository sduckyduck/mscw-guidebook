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
    const rankedMonsters = rankMonstersForPlayer(playerLevel, accuracy, mapMonsters);
    const levelScore = scoreLevelFit(playerLevel, map.levelRange);
    const hitScore = scoreHitFit(rankedMonsters);
    const classScore = scoreClassFit(classLine.id, rankedMonsters, map);
    const densityScore = scoreDensity(map);
    const riskPenalty = scoreRiskPenalty(rankedMonsters);
    const overLevelPenalty = scoreOverLevelPenalty(playerLevel, map.levelRange, rankedMonsters);
    const score = Math.round(levelScore + hitScore + classScore + densityScore - riskPenalty - overLevelPenalty);

    return {
      ...map,
      monsters: rankedMonsters,
      score: Math.max(0, Math.min(100, score)),
      accuracy,
      canHitAll: rankedMonsters.every((monster) => monster.hitRate >= 0.99),
      warning: buildWarning(rankedMonsters, classLine.id),
    };
  }).sort((a, b) => b.score - a.score || b.spawnTotal - a.spawnTotal);
}

function scoreLevelFit(level, [min, max]) {
  if (level >= min && level <= max) return 44;
  const distance = level < min ? min - level : level - max;
  if (level > max) return Math.max(-34, 36 - distance * 9);
  return Math.max(-18, 38 - distance * 7);
}

function scoreHitFit(monsters) {
  if (!monsters.length) return 0;
  const averageHit = monsters.reduce((sum, monster) => sum + monster.hitRate, 0) / monsters.length;
  if (averageHit >= 0.99) return 24;
  if (averageHit >= 0.85) return 18;
  if (averageHit >= 0.65) return 10;
  if (averageHit >= 0.45) return 4;
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

function scoreRiskPenalty(monsters) {
  const primaryHit = monsters[0]?.hitRate ?? 1;
  if (primaryHit < 0.5) return 52;
  if (primaryHit < 0.75) return 30;
  if (primaryHit < 0.9) return 10;
  return 0;
}

function scoreOverLevelPenalty(level, levelRange, monsters) {
  const maxMapLevel = Number(levelRange?.[1] ?? Math.max(...monsters.map((monster) => monster.level)));
  const bestMonsterLevel = Number(monsters[0]?.level ?? maxMapLevel);
  const mapGap = Math.max(0, level - maxMapLevel - 8);
  const targetGap = Math.max(0, level - bestMonsterLevel - 10);
  return mapGap * 7 + targetGap * 5;
}

function rankMonstersForPlayer(level, accuracy, monsters) {
  return monsters
    .map((monster) => {
      const requiredAccuracy = getRequiredAccuracy(level, monster);
      const hitRate = getHitRate(accuracy, requiredAccuracy);
      const monsterLevel = Number(monster.level ?? 1);
      const levelGap = Math.abs(level - monsterLevel);
      const underLevelPenalty = Math.max(0, level - monsterLevel - 10) * 4;
      const overLevelPenalty = Math.max(0, monsterLevel - level - 8) * 3;
      const spawnScore = Math.min(18, Number(monster.spawnCount ?? 0) * 1.4);
      const expScore = Math.min(18, Math.log10(Math.max(1, Number(monster.exp ?? 1))) * 6);
      const score = hitRate * 34 + spawnScore + expScore - levelGap * 1.8 - underLevelPenalty - overLevelPenalty;

      return {
        ...monster,
        requiredAccuracy,
        hitRate,
        hitPercent: Math.round(hitRate * 100),
        targetScore: score,
      };
    })
    .sort((a, b) => b.targetScore - a.targetScore || b.level - a.level);
}

function getRequiredAccuracy(characterLevel, monster) {
  const monsterLevel = Number(monster.level ?? 1);
  const avoid = Math.max(0, Number(monster.avoid ?? monster.eva ?? 0));
  const levelDiff = Math.max(0, monsterLevel - Number(characterLevel ?? 1));
  return Math.max(1, Math.ceil(((55 + levelDiff * 2) * avoid) / 15));
}

function getHitRate(accuracy, requiredAccuracy) {
  if (!requiredAccuracy) return 1;
  return Math.max(0, Math.min(1, Number(accuracy ?? 0) / requiredAccuracy));
}

function buildWarning(monsters, classId) {
  const hardTargets = monsters.filter((monster) => monster.hitRate < 0.85);
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
    hitPercent: monster.hitPercent,
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
