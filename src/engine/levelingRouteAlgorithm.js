const PRIORITY_PROFILES = {
  stable: { preferredHits: [1, 2], maxComfortHits: 3, expWeight: 0.95, safetyWeight: 1.35, mesoWeight: 0.75, mpWeight: 1.15 },
  exp: { preferredHits: [1, 2, 3], maxComfortHits: 4, expWeight: 1.35, safetyWeight: 0.85, mesoWeight: 0.65, mpWeight: 0.8 },
  material: { preferredHits: [1, 2, 3], maxComfortHits: 4, expWeight: 0.9, safetyWeight: 0.9, mesoWeight: 0.95, mpWeight: 0.9 },
  meso: { preferredHits: [1, 2], maxComfortHits: 3, expWeight: 0.8, safetyWeight: 1.05, mesoWeight: 1.25, mpWeight: 1.25 },
};

const BUDGET_PROFILES = {
  low: { maxComfortHits: 2, mpCostWeight: 1.35, potionCostWeight: 1.35, overLevelTolerance: 4, underLevelTolerance: 8, gearUpgradeAggression: 0.45 },
  mid: { maxComfortHits: 3, mpCostWeight: 1, potionCostWeight: 1, overLevelTolerance: 6, underLevelTolerance: 10, gearUpgradeAggression: 0.7 },
  high: { maxComfortHits: 4, mpCostWeight: 0.65, potionCostWeight: 0.7, overLevelTolerance: 8, underLevelTolerance: 12, gearUpgradeAggression: 1 },
};

const SKILL_COST_HINTS = {
  '魔力弹': { mp: 7, lines: 1, role: 'single' },
  '魔法双击': { mp: 14, lines: 2, role: 'single' },
  '火箭术': { mp: 20, lines: 1, role: 'single' },
  '冰冻术': { mp: 24, lines: 1, role: 'single-control' },
  '雷电术': { mp: 40, lines: 6, role: 'aoe' },
  '治愈术': { mp: 24, lines: 6, role: 'undead-aoe' },
  '圣箭术': { mp: 24, lines: 1, role: 'single' },
  '强力攻击': { mp: 12, lines: 1, role: 'single' },
  '群体攻击': { mp: 16, lines: 6, role: 'aoe' },
  '断魂箭': { mp: 14, lines: 1, role: 'single' },
  '二连射': { mp: 16, lines: 2, role: 'single' },
  '双飞斩': { mp: 16, lines: 2, role: 'single' },
  '劈空斩': { mp: 14, lines: 1, role: 'single' },
};

export function scoreLevelingTarget({
  monster,
  map,
  level,
  budget = 'mid',
  priority = 'stable',
  skillPlan,
  mainAttack = 0,
  hitPercent = 100,
} = {}) {
  const budgetProfile = BUDGET_PROFILES[budget] ?? BUDGET_PROFILES.mid;
  const priorityProfile = PRIORITY_PROFILES[priority] ?? PRIORITY_PROFILES.stable;
  const usableSkills = getUsableDamageSkills(skillPlan, mainAttack);
  const bestSkill = pickBestSkillForMonster({ monster, skills: usableSkills, budgetProfile, priorityProfile });
  const levelDelta = Number(monster?.level ?? 1) - Number(level ?? 1);
  const density = normalizeSpawnDensity(map, monster);
  const safety = estimateSafetyScore({ monster, level, budgetProfile, priorityProfile, bestSkill });
  const levelFit = scoreLevelFitByBreakpoint({ levelDelta, hitsToKill: bestSkill.hitsToKill, budgetProfile });
  const overkillPenalty = scoreOverkillWaste({ monster, level, bestSkill });
  const underLevelPenalty = scoreUnderleveledFarming({ monster, level, bestSkill, budgetProfile });
  const hitPenalty = Math.max(0, 95 - Number(hitPercent ?? 100)) * 1.2;
  const expScore = normalizeExpScore(monster, bestSkill, density);
  const mpScore = normalizeMpEfficiency(monster, bestSkill, priorityProfile, budgetProfile);
  const total = clamp(
    expScore * priorityProfile.expWeight
      + safety * priorityProfile.safetyWeight * 0.32
      + levelFit * 0.34
      + density * 0.18
      + mpScore * 0.18
      - overkillPenalty
      - underLevelPenalty
      - hitPenalty,
    0,
    100,
  );

  return {
    monster,
    map,
    score: Math.round(total),
    bestSkill,
    hitsToKill: bestSkill.hitsToKill,
    castsPerKill: bestSkill.hitsToKill,
    estimatedExpPerCast: Math.round(Number(monster?.exp ?? 0) / Math.max(1, bestSkill.hitsToKill)),
    estimatedExpPerMp: round(Number(monster?.exp ?? 0) / Math.max(1, bestSkill.totalMpCost), 2),
    scoreParts: {
      exp: Math.round(expScore),
      safety: Math.round(safety),
      levelFit: Math.round(levelFit),
      density: Math.round(density),
      mp: Math.round(mpScore),
      overkillPenalty: Math.round(overkillPenalty),
      underLevelPenalty: Math.round(underLevelPenalty),
      hitPenalty: Math.round(hitPenalty),
    },
    reason: buildTargetReason({ monster, bestSkill, levelDelta, expScore, mpScore, safety }),
  };
}

export function rankLevelingMapsByBreakpoints({ maps = [], level, budget, priority, skillPlan, mainAttack, getHitPercent } = {}) {
  return maps
    .map((map) => {
      const targets = (map.monsters ?? []).map((monster) => scoreLevelingTarget({
        monster,
        map,
        level,
        budget,
        priority,
        skillPlan,
        mainAttack,
        hitPercent: typeof getHitPercent === 'function' ? getHitPercent(monster, map) : monster.hitPercent,
      })).sort((a, b) => b.score - a.score);
      const best = targets[0];
      const mapScore = best ? Math.round(best.score * 0.72 + normalizeSpawnDensity(map, best.monster) * 0.28) : 0;
      return {
        ...map,
        monsters: targets.map((target) => ({
          ...target.monster,
          targetScore: target.score,
          hitsToKill: target.hitsToKill,
          bestSkillName: target.bestSkill.name,
          estimatedExpPerMp: target.estimatedExpPerMp,
          breakpointReason: target.reason,
        })),
        score: mapScore,
        breakpointMeta: best,
      };
    })
    .sort((a, b) => b.score - a.score || Number(b.spawnTotal ?? 0) - Number(a.spawnTotal ?? 0));
}

export function evaluateGearUpgradeForRoute({ currentRoute, upgradedRoute, budget = 'mid', mesoCost = 0 } = {}) {
  const budgetProfile = BUDGET_PROFILES[budget] ?? BUDGET_PROFILES.mid;
  const scoreGain = Number(upgradedRoute?.score ?? 0) - Number(currentRoute?.score ?? 0);
  const hitGain = Number(currentRoute?.hitsToKill ?? 99) - Number(upgradedRoute?.hitsToKill ?? 99);
  const newMobLevelGain = Number(upgradedRoute?.monster?.level ?? 0) - Number(currentRoute?.monster?.level ?? 0);
  const costPenalty = Math.log10(Math.max(1, Number(mesoCost) || 1)) * (1.2 - budgetProfile.gearUpgradeAggression);
  const value = scoreGain + hitGain * 18 + newMobLevelGain * 1.6 - costPenalty;
  return {
    worthIt: value >= (budget === 'low' ? 18 : budget === 'mid' ? 10 : 4),
    value: Math.round(value),
    reasons: [
      hitGain > 0 ? `少 ${hitGain} 次技能击杀` : '',
      newMobLevelGain > 0 ? `可上探 Lv.${newMobLevelGain} 更高怪物` : '',
      scoreGain > 0 ? `路线分 +${Math.round(scoreGain)}` : '',
      costPenalty > 5 ? '价格会降低性价比' : '',
    ].filter(Boolean),
  };
}

function getUsableDamageSkills(skillPlan, mainAttack) {
  const cards = (skillPlan?.damageCards ?? [])
    .filter((card) => !card.isBase && Number(card.level ?? 0) > 0)
    .map((card) => {
      const hint = SKILL_COST_HINTS[card.name] ?? { mp: Math.max(4, Math.round(Number(card.level ?? 1) * 0.8 + 5)), lines: 1, role: 'single' };
      const avgDamage = (Number(card.min ?? 0) + Number(card.max ?? 0)) / 2;
      return {
        name: card.name,
        level: Number(card.level ?? 0),
        min: Number(card.min ?? 0),
        max: Number(card.max ?? 0),
        avgDamage: Math.max(1, avgDamage),
        mpCost: hint.mp,
        lines: hint.lines,
        role: hint.role,
      };
    });

  if (cards.length) return cards;

  const base = Math.max(1, Number(mainAttack ?? 0));
  return [{ name: '普通攻击', level: 1, min: Math.round(base * 0.55), max: Math.round(base * 1.1), avgDamage: Math.max(1, base * 0.82), mpCost: 0, lines: 1, role: 'basic' }];
}

function pickBestSkillForMonster({ monster, skills, budgetProfile, priorityProfile }) {
  return skills
    .map((skill) => {
      const effectiveDamage = skill.avgDamage * skillEfficiencyAgainstMonster(skill, monster);
      const hitsToKill = Math.max(1, Math.ceil(Number(monster?.hp ?? 1) / Math.max(1, effectiveDamage)));
      const totalMpCost = hitsToKill * skill.mpCost;
      const comfortPenalty = Math.max(0, hitsToKill - Math.min(budgetProfile.maxComfortHits, priorityProfile.maxComfortHits)) * 14;
      const mpPenalty = totalMpCost * budgetProfile.mpCostWeight * priorityProfile.mpWeight * 0.08;
      const score = Number(monster?.exp ?? 0) / Math.max(1, hitsToKill) - comfortPenalty - mpPenalty;
      return { ...skill, effectiveDamage: Math.round(effectiveDamage), hitsToKill, totalMpCost, score };
    })
    .sort((a, b) => b.score - a.score || a.hitsToKill - b.hitsToKill)[0];
}

function skillEfficiencyAgainstMonster(skill, monster) {
  if (skill.role === 'undead-aoe' && monster?.undead) return 1.35;
  if (skill.name === '火箭术' && safeArray(monster?.elementWeakness).map(lower).includes('fire')) return 1.25;
  if (skill.name === '冰冻术' && safeArray(monster?.elementWeakness).map(lower).includes('ice')) return 1.22;
  if (skill.name === '雷电术' && safeArray(monster?.elementWeakness).map(lower).includes('lightning')) return 1.18;
  if (safeArray(monster?.elementResist).some((x) => lower(x) === 'fire' && skill.name === '火箭术')) return 0.75;
  return 1;
}

function normalizeExpScore(monster, skill, density) {
  const expPerCast = Number(monster?.exp ?? 0) / Math.max(1, skill.hitsToKill);
  const densityMultiplier = 0.7 + density / 220;
  return clamp(Math.log2(expPerCast + 1) * 18 * densityMultiplier, 0, 100);
}

function normalizeMpEfficiency(monster, skill, priorityProfile, budgetProfile) {
  if (!skill.totalMpCost) return 88;
  const expPerMp = Number(monster?.exp ?? 0) / Math.max(1, skill.totalMpCost);
  return clamp(expPerMp * 18 / (priorityProfile.mpWeight * budgetProfile.mpCostWeight), 0, 100);
}

function normalizeSpawnDensity(map, monster) {
  const spawnTotal = Number(map?.spawnTotal ?? 0);
  const monsterCount = Number(monster?.spawnCount ?? 0);
  const count = monsterCount || spawnTotal || 1;
  return clamp(Math.log2(count + 1) * 14 + Math.log2(spawnTotal + 1) * 4, 0, 100);
}

function estimateSafetyScore({ monster, level, budgetProfile, priorityProfile, bestSkill }) {
  const levelDelta = Number(monster?.level ?? 1) - Number(level ?? 1);
  const hitExposure = Math.max(0.4, bestSkill.hitsToKill * 0.45);
  const incoming = Math.max(Number(monster?.physicalAttack ?? 0), Number(monster?.magicAttack ?? 0), Number(monster?.level ?? 1) * 2.2);
  const risk = incoming * hitExposure * budgetProfile.potionCostWeight * priorityProfile.safetyWeight / Math.max(50, Number(level ?? 1) * 8);
  const levelRisk = Math.max(0, levelDelta - budgetProfile.overLevelTolerance) * 5;
  return clamp(100 - risk * 40 - levelRisk, 0, 100);
}

function scoreLevelFitByBreakpoint({ levelDelta, hitsToKill, budgetProfile }) {
  let score = 72;
  if (levelDelta >= -3 && levelDelta <= budgetProfile.overLevelTolerance) score += 20;
  if (levelDelta > budgetProfile.overLevelTolerance) score -= (levelDelta - budgetProfile.overLevelTolerance) * 7;
  if (levelDelta < -budgetProfile.underLevelTolerance) score -= Math.abs(levelDelta + budgetProfile.underLevelTolerance) * 5;
  if (hitsToKill === 1) score += 4;
  if (hitsToKill === 2) score += 8;
  if (hitsToKill === 3) score += 2;
  if (hitsToKill > budgetProfile.maxComfortHits) score -= (hitsToKill - budgetProfile.maxComfortHits) * 10;
  return clamp(score, 0, 100);
}

function scoreOverkillWaste({ monster, level, bestSkill }) {
  const levelGap = Number(level ?? 1) - Number(monster?.level ?? 1);
  if (bestSkill.hitsToKill > 1 || levelGap <= 8) return 0;
  return Math.min(28, (levelGap - 8) * 4);
}

function scoreUnderleveledFarming({ monster, level, bestSkill, budgetProfile }) {
  const levelGap = Number(level ?? 1) - Number(monster?.level ?? 1);
  const tolerance = budgetProfile.underLevelTolerance;
  if (levelGap <= tolerance) return 0;
  const penalty = (levelGap - tolerance) * (bestSkill.hitsToKill === 1 ? 6 : 4);
  return Math.min(42, penalty);
}

function buildTargetReason({ monster, bestSkill, levelDelta, expScore, mpScore, safety }) {
  const direction = levelDelta > 0 ? `高你 ${levelDelta} 级` : levelDelta < 0 ? `低你 ${Math.abs(levelDelta)} 级` : '同级';
  return `${bestSkill.name} 约 ${bestSkill.hitsToKill} 次击杀，${direction}，经验评分 ${Math.round(expScore)}，蓝耗效率 ${Math.round(mpScore)}，安全 ${Math.round(safety)}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function lower(value) {
  return String(value ?? '').toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round((Number(value) || 0) * scale) / scale;
}
