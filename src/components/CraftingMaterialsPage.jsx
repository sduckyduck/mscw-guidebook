import { useEffect, useMemo, useState } from 'react';

const CRAFTING_DATA_URL = 'https://ohmi69.github.io/osms_datamine_dashboard/data/current/crafting.json';
const OVERVIEW_DATA_URL = 'https://ohmi69.github.io/osms_datamine_dashboard/data/current/overview.json';
const EXPECTED_RECIPES = 342;

const sampleProfessions = [
  { id: 'smithing', name: 'Smithing' },
  { id: 'weaponcrafting', name: 'Weaponcrafting' },
  { id: 'tailoring', name: 'Tailoring' },
  { id: 'woodcrafting', name: 'Woodcrafting' },
  { id: 'leatherworking', name: 'Leatherworking' },
  { id: 'arcforge', name: 'Arcforge' },
];

const sampleRecipes = [
  { id: 'iron_plate', profession: 'smithing', professionName: 'Smithing', name: 'Iron Plate', level: 1, exp: 20, meso: 30, ingredients: [{ id: 'iron_ore', name: 'Iron Ore', qty: 2 }, { id: 'coal', name: 'Coal', qty: 1 }] },
  { id: 'bronze_plate', profession: 'smithing', professionName: 'Smithing', name: 'Bronze Plate', level: 2, exp: 28, meso: 35, ingredients: [{ id: 'bronze_ore', name: 'Bronze Ore', qty: 3 }, { id: 'coal', name: 'Coal', qty: 1 }] },
  { id: 'steel_blade', profession: 'weaponcrafting', professionName: 'Weaponcrafting', name: 'Steel Blade', level: 4, exp: 58, meso: 80, ingredients: [{ id: 'steel_ore', name: 'Steel Ore', qty: 4 }, { id: 'screw', name: 'Screw', qty: 1 }] },
  { id: 'silk_wrap', profession: 'tailoring', professionName: 'Tailoring', name: 'Silk Wrap', level: 3, exp: 38, meso: 50, ingredients: [{ id: 'silk_thread', name: 'Silk Thread', qty: 3 }, { id: 'linen_cloth', name: 'Linen Cloth', qty: 2 }] },
  { id: 'processed_wood', profession: 'woodcrafting', professionName: 'Woodcrafting', name: 'Processed Wood', level: 2, exp: 30, meso: 30, ingredients: [{ id: 'firewood', name: 'Firewood', qty: 4 }, { id: 'branch', name: 'Branch', qty: 2 }] },
  { id: 'basic_leather', profession: 'leatherworking', professionName: 'Leatherworking', name: 'Basic Leather', level: 1, exp: 18, meso: 20, ingredients: [{ id: 'animal_skin', name: 'Animal Skin', qty: 3 }] },
  { id: 'minor_catalyst', profession: 'arcforge', professionName: 'Arcforge', name: 'Minor Catalyst', level: 1, exp: 24, meso: 90, ingredients: [{ id: 'magic_powder', name: 'Magic Powder', qty: 1 }, { id: 'coal', name: 'Coal', qty: 1 }] },
];

function slugify(value) {
  return String(value || 'unknown').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
}

function inferRarity(name) {
  const lower = String(name).toLowerCase();
  if (lower.includes('dark') || lower.includes('crystal')) return 5;
  if (lower.includes('adamantium') || lower.includes('orihalcon')) return 4;
  if (lower.includes('mithril') || lower.includes('gold')) return 3;
  if (lower.includes('steel') || lower.includes('silver')) return 2;
  return 1;
}

function inferSource(name) {
  const lower = String(name).toLowerCase();
  if (lower.includes('screw') || lower.includes('ingot') || lower.includes('plate') || lower.includes('processed')) return 'crafted';
  if (lower.includes('catalyst')) return 'npc';
  return 'drop';
}

function estimateBasePrice(name) {
  const rarity = inferRarity(name);
  let base = 80 + rarity * 120;
  const lower = String(name).toLowerCase();
  if (lower.includes('crystal')) base += 450;
  if (lower.includes('screw')) base += 220;
  if (lower.includes('ingot')) base += 180;
  return base;
}

function createItemRecord(name) {
  const id = slugify(name);
  return { id, name, rarity: inferRarity(name), source: inferSource(name), basePrice: estimateBasePrice(name) };
}

function createSampleData() {
  const items = {};
  sampleRecipes.forEach((recipe) => recipe.ingredients.forEach((ing) => {
    if (!items[ing.id]) items[ing.id] = createItemRecord(ing.name);
  }));
  return { source: 'sample fallback', expectedRecipes: EXPECTED_RECIPES, loadedRecipes: sampleRecipes.length, professions: sampleProfessions, recipes: sampleRecipes, items };
}

function flattenCraftingData(rawCrafting, overview) {
  const items = {};
  const recipes = [];
  const professions = [];
  (rawCrafting?.disciplines || []).forEach((discipline) => {
    const professionId = slugify(discipline.discipline);
    professions.push({ id: professionId, name: discipline.discipline });
    (discipline.output_types || []).forEach((outputType) => {
      (outputType.levels || []).forEach((levelGroup) => {
        (levelGroup.recipes || []).forEach((recipe) => {
          const ingredients = (recipe.ingredients || []).map((ingredient) => {
            const item = createItemRecord(ingredient.item_name);
            if (!items[item.id]) items[item.id] = item;
            return { id: item.id, name: ingredient.item_name, qty: Number(ingredient.count || 0) };
          });
          recipes.push({
            id: `${professionId}_${recipe.id}_${recipe.output_id ?? slugify(recipe.result_item_name)}`,
            profession: professionId,
            professionName: discipline.discipline,
            outputType: outputType.output_type,
            name: recipe.result_item_name,
            level: Number(recipe.req_level ?? levelGroup.level ?? 1),
            exp: Number(recipe.craft_exp ?? 0),
            meso: Number(recipe.meso_cost ?? 0),
            resultCount: Number(recipe.result_count ?? 1),
            ingredients,
          });
        });
      });
    });
  });
  return {
    source: 'OSMS dashboard current',
    expectedRecipes: Number(overview?.stats?.recipes ?? EXPECTED_RECIPES),
    loadedRecipes: recipes.length,
    professions,
    recipes,
    items,
  };
}

async function loadCraftingDataset() {
  const [craftingResponse, overviewResponse] = await Promise.all([fetch(CRAFTING_DATA_URL), fetch(OVERVIEW_DATA_URL)]);
  if (!craftingResponse.ok) throw new Error(`Crafting data failed: ${craftingResponse.status}`);
  const rawCrafting = await craftingResponse.json();
  const overview = overviewResponse.ok ? await overviewResponse.json() : null;
  return flattenCraftingData(rawCrafting, overview);
}

function itemCost(itemId, mode, items) {
  const item = items[itemId];
  if (!item) return 999999;
  const sourcePenalty = {
    cheapest: { drop: 1.0, crafted: 1.15, npc: 1.0, unknown: 1.5 },
    fastest: { drop: 1.2, crafted: 1.05, npc: 0.95, unknown: 1.5 },
    farm: { drop: 0.5, crafted: 0.75, npc: 3.5, unknown: 2.2 },
    balanced: { drop: 0.85, crafted: 1.0, npc: 1.2, unknown: 1.6 },
  }[mode] ?? {};
  return item.basePrice * (sourcePenalty[item.source] || 1.2) * (1 + item.rarity * 0.08);
}

function recipeCost(recipe, mode, items) {
  const materialCost = recipe.ingredients.reduce((sum, ing) => sum + itemCost(ing.id, mode, items) * ing.qty, 0);
  const rarityPenalty = recipe.ingredients.reduce((sum, ing) => sum + (items[ing.id]?.rarity || 1) * ing.qty * (mode === 'farm' ? 28 : 10), 0);
  return Math.max(1, recipe.meso + materialCost + rarityPenalty);
}

function rankRecipe(recipe, mode, items) {
  const cost = recipeCost(recipe, mode, items);
  if (mode === 'fastest') return recipe.exp * 1000 - cost * 0.1;
  if (mode === 'farm') return recipe.exp / cost - recipe.ingredients.filter((ing) => items[ing.id]?.source === 'npc').length * 0.03;
  return recipe.exp / cost;
}

function simulateLeveling(recipes, items, professionId, mode) {
  const expNeed = [80, 120, 180, 260, 360, 500, 680, 880, 1100];
  const steps = [];
  const totalMaterials = {};
  let totalCost = 0;
  let totalCrafts = 0;
  for (let level = 1; level < 10; level += 1) {
    const unlocked = recipes.filter((r) => r.profession === professionId && r.level <= level && r.exp > 0);
    if (!unlocked.length) continue;
    const best = [...unlocked].sort((a, b) => rankRecipe(b, mode, items) - rankRecipe(a, mode, items))[0];
    const crafts = Math.ceil((expNeed[level - 1] || 1000) / best.exp);
    const costEach = recipeCost(best, mode, items);
    best.ingredients.forEach((ing) => {
      if (!totalMaterials[ing.id]) totalMaterials[ing.id] = { name: ing.name, qty: 0 };
      totalMaterials[ing.id].qty += ing.qty * crafts;
    });
    totalCost += costEach * crafts;
    totalCrafts += crafts;
    steps.push({ level, nextLevel: level + 1, recipe: best, crafts, costEach: Math.round(costEach) });
  }
  return { steps, totalMaterials, totalCost: Math.round(totalCost), totalCrafts };
}

function materialRanking(recipes, items) {
  const stats = {};
  recipes.forEach((recipe) => recipe.ingredients.forEach((ing) => {
    if (!stats[ing.id]) stats[ing.id] = { itemId: ing.id, name: ing.name, totalQty: 0, recipes: new Set(), professions: new Set(), highLevelUse: 0 };
    stats[ing.id].totalQty += ing.qty;
    stats[ing.id].recipes.add(recipe.id);
    stats[ing.id].professions.add(recipe.profession);
    stats[ing.id].highLevelUse += ing.qty * recipe.level;
  }));
  return Object.values(stats).map((row) => {
    const item = items[row.itemId] || createItemRecord(row.name);
    const score = row.totalQty * 2 + row.recipes.size * 8 + row.professions.size * 14 + row.highLevelUse + item.rarity * 10;
    return { ...row, item, score: Math.round(score), recipeCount: row.recipes.size, professionCount: row.professions.size };
  }).sort((a, b) => b.score - a.score);
}

function formatMeso(value) {
  return `${Math.round(value || 0).toLocaleString()} meso`;
}

export default function CraftingMaterialsPage() {
  const [dataset, setDataset] = useState(createSampleData);
  const [loading, setLoading] = useState(true);
  const [profession, setProfession] = useState('smithing');
  const [mode, setMode] = useState('cheapest');

  useEffect(() => {
    let active = true;
    loadCraftingDataset()
      .then((loaded) => {
        if (!active) return;
        setDataset(loaded);
        setProfession(loaded.professions[0]?.id || 'smithing');
      })
      .catch(() => active && setDataset(createSampleData()))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const selectedProfession = dataset.professions.find((p) => p.id === profession) || dataset.professions[0];
  const professionRecipes = dataset.recipes.filter((r) => r.profession === selectedProfession?.id);
  const route = useMemo(() => simulateLeveling(dataset.recipes, dataset.items, selectedProfession?.id, mode), [dataset, selectedProfession, mode]);
  const rankedMaterials = useMemo(() => materialRanking(dataset.recipes, dataset.items), [dataset]);
  const professionCount = dataset.professions.length;
  const loadedOk = dataset.loadedRecipes === dataset.expectedRecipes;

  return <section className="mg-dashboard mg-materials-dashboard">
    <h1 className="mg-dashboard-title">MapleGuide: 材料与锻造路线</h1>
    <p className="mg-dashboard-subtitle">根据 MCW Crafting 逻辑，查看职业升级路线、材料价值和配方关系</p>

    <div className="mg-material-controls mg-glass-panel">
      <label>专业</label>
      <select className="mg-select" value={selectedProfession?.id ?? ''} onChange={(e) => setProfession(e.target.value)}>
        {dataset.professions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <label>路线</label>
      <select className="mg-select" value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="cheapest">最低成本</option>
        <option value="balanced">均衡路线</option>
        <option value="farm">刷怪友好</option>
        <option value="fastest">最快升级</option>
      </select>
    </div>

    <div className="mg-material-grid">
      <Panel title="数据概览" meta={loading ? '读取中' : dataset.source}>
        <div className="mg-material-stat-row"><strong>{professionCount}</strong><span>专业数量</span></div>
        <div className="mg-material-stat-row"><strong>{dataset.loadedRecipes}</strong><span>已读取配方</span></div>
        <div className="mg-material-stat-row"><strong>{Object.keys(dataset.items).length}</strong><span>材料/物品节点</span></div>
        <p className={loadedOk ? 'mg-material-ok' : 'mg-material-warn'}>{loadedOk ? '配方数量匹配' : `目标 ${dataset.expectedRecipes} 条，当前 ${dataset.loadedRecipes} 条`}</p>
      </Panel>

      <Panel title="1-10 推荐路线" meta={selectedProfession?.name}>
        <div className="mg-material-route-list">
          {route.steps.slice(0, 6).map((step) => <article key={`${step.level}-${step.recipe.id}`} className="mg-material-route-row">
            <strong>Lv.{step.level}→{step.nextLevel}</strong>
            <span>{step.recipe.name}</span>
            <em>x{step.crafts}</em>
          </article>)}
        </div>
        <p className="mg-material-summary">总制作 {route.totalCrafts} 次 · 估算 {formatMeso(route.totalCost)}</p>
      </Panel>

      <Panel title="高价值材料" meta="综合价值分">
        <div className="mg-material-rank-list">
          {rankedMaterials.slice(0, 8).map((row, index) => <article key={row.itemId} className="mg-material-rank-row">
            <strong>#{index + 1}</strong>
            <span>{row.name}</span>
            <em>{row.score}</em>
          </article>)}
        </div>
      </Panel>

      <Panel title="材料需求汇总" meta="当前路线">
        <div className="mg-material-chip-list">
          {Object.values(route.totalMaterials).sort((a, b) => b.qty - a.qty).slice(0, 12).map((item) => <span key={item.name} className="mg-material-chip">{item.name} x{item.qty}</span>)}
        </div>
      </Panel>
    </div>

    <section className="mg-glass-panel mg-material-recipes-panel">
      <div className="mg-material-panel-head"><h2>当前专业配方</h2><span>{professionRecipes.length} 条</span></div>
      <div className="mg-material-recipe-grid">
        {professionRecipes.slice(0, 16).map((recipe) => <article key={recipe.id} className="mg-material-recipe-card">
          <strong>{recipe.name}</strong>
          <span>Lv.{recipe.level} · EXP {recipe.exp} · {formatMeso(recipe.meso)}</span>
          <p>{recipe.ingredients.map((ing) => `${ing.name} x${ing.qty}`).join(' / ')}</p>
        </article>)}
      </div>
    </section>

    <p className="mg-footer">© 2026 MapleGuide | Crafting data logic from MCW Crafting</p>
  </section>;
}

function Panel({ title, meta, children }) {
  return <section className="mg-material-panel">
    <div className="mg-material-panel-head"><h2>{title}</h2>{meta && <span>{meta}</span>}</div>
    {children}
  </section>;
}
