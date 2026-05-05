import { MATERIALS, RECIPES } from '../data/crafting.js';

const materialById = Object.fromEntries(MATERIALS.map((material) => [material.id, material]));

export function getProfessionRecipes(professionId) {
  return RECIPES.filter((recipe) => recipe.profession === professionId)
    .map((recipe) => ({
      ...recipe,
      materialNames: recipe.materials.map((item) => `${materialById[item.id]?.name ?? item.id} × ${item.qty}`),
      efficiency: getRecipeEfficiency(recipe),
    }))
    .sort((a, b) => b.efficiency - a.efficiency);
}

export function getRecipeEfficiency(recipe) {
  const materialLoad = recipe.materials.reduce((sum, item) => sum + item.qty, 0);
  const cost = recipe.mesoCost + materialLoad * 25;
  return Number((recipe.exp / Math.max(1, cost / 100)).toFixed(2));
}

export function getMaterialValueIndex() {
  const recipeCoverage = new Map();
  const professionCoverage = new Map();
  const totalDemand = new Map();

  for (const recipe of RECIPES) {
    for (const item of recipe.materials) {
      recipeCoverage.set(item.id, (recipeCoverage.get(item.id) ?? 0) + 1);
      totalDemand.set(item.id, (totalDemand.get(item.id) ?? 0) + item.qty);
      const key = `${item.id}:${recipe.profession}`;
      professionCoverage.set(key, true);
    }
  }

  return MATERIALS.map((material) => {
    const professions = new Set(
      [...professionCoverage.keys()]
        .filter((key) => key.startsWith(`${material.id}:`))
        .map((key) => key.split(':')[1]),
    );
    const score =
      (recipeCoverage.get(material.id) ?? 0) * 30 +
      (totalDemand.get(material.id) ?? 0) * 8 +
      professions.size * 20 +
      material.valueTags.length * 5;

    return {
      ...material,
      recipeCount: recipeCoverage.get(material.id) ?? 0,
      totalDemand: totalDemand.get(material.id) ?? 0,
      professionCount: professions.size,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildLowCostRoute(professionId, targetLevel = 10) {
  const safeTarget = Math.max(1, Number(targetLevel) || 10);
  const recipes = getProfessionRecipes(professionId);
  const route = [];
  let currentLevel = 1;
  let totalCost = 0;
  let totalExp = 0;

  while (currentLevel < safeTarget && recipes.length) {
    const available = recipes.filter((recipe) => recipe.level <= currentLevel);
    const best = available[0] ?? recipes[0];
    const neededExp = currentLevel * 100;
    const crafts = Math.max(1, Math.ceil(neededExp / best.exp));

    route.push({
      from: currentLevel,
      to: currentLevel + 1,
      recipe: best.output,
      crafts,
      exp: best.exp * crafts,
      cost: best.mesoCost * crafts,
      materials: best.materialNames,
    });

    totalCost += best.mesoCost * crafts;
    totalExp += best.exp * crafts;
    currentLevel += 1;
  }

  return { targetLevel: safeTarget, totalCost, totalExp, route };
}
