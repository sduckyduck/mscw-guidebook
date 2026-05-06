import { useEffect, useMemo, useState } from 'react';
import CraftingMaterialsPage from './CraftingMaterialsPage.jsx';
import '../styles/materials-advanced.css';

const ICON_BASE = `${import.meta.env.BASE_URL}icons/crafting/`;

const PROFESSIONS = [
  ['smithing', '锻造', 'Smithing', 'smithing_icon.png'],
  ['weaponcrafting', '武器制作', 'Weaponcrafting', 'weapon_crafting_icon.png'],
  ['tailoring', '裁缝', 'Tailoring', 'tailoring_icon.png'],
  ['woodcrafting', '木工', 'Woodcrafting', 'woodcrafting_icon.png'],
  ['leatherworking', '皮革', 'Leatherworking', 'leatherworking_icon.png'],
  ['arcforge', '融合机体', 'Arcforge', 'arcforge_icon.png'],
].map(([id, zh, en, icon]) => ({ id, zh, en, icon }));

const MODES = [
  ['cheapest', '最低成本', '优先低金币/低材料负担'],
  ['balanced', '均衡路线', '成本、经验和材料压力折中'],
  ['farm', '刷怪友好', '优先怪物掉落和自给材料'],
  ['fastest', '最快升级', '优先单位制作经验'],
].map(([id, zh, desc]) => ({ id, zh, desc }));

const MASTERY = [50, 115, 200, 308, 450, 635, 882, 1190, 1587];

const ITEMS = Object.fromEntries([
  ['iron_ore', '铁矿石', 'Iron Ore', 'drop', 1, 120, ''],
  ['bronze_ore', '青铜矿石', 'Bronze Ore', 'drop', 1, 90, ''],
  ['steel_ore', '钢铁矿石', 'Steel Ore', 'drop', 2, 210, ''],
  ['mithril_ore', '秘银矿石', 'Mithril Ore', 'drop', 3, 450, ''],
  ['adamantium_ore', '锂矿石', 'Adamantium Ore', 'drop', 4, 850, ''],
  ['coal', '煤炭', 'Coal', 'npc', 1, 80, ''],
  ['screw', '螺丝钉', 'Screw', 'crafted', 2, 250, ''],
  ['stiff_feather', '硬羽毛', 'Stiff Feather', 'drop', 1, 70, ''],
  ['animal_skin', '动物皮', 'Animal Skin', 'drop', 1, 100, 'animal_fur_bundle.png'],
  ['leather', '加工皮革', 'Processed Leather', 'crafted', 2, 300, 'processed_leather.png'],
  ['processed_wood', '加工木材', 'Processed Wood', 'crafted', 1, 180, 'processed_wood_04003001.png'],
  ['firewood', '木柴', 'Firewood', 'drop', 1, 60, 'processed_wood_04003001.png'],
  ['branch', '树枝', 'Branch', 'drop', 1, 45, 'processed_wood_04003001.png'],
  ['magic_powder', '魔法粉末', 'Magic Powder', 'drop', 3, 600, ''],
  ['crystal_shard', '水晶碎片', 'Crystal Shard', 'drop', 3, 700, ''],
  ['dark_crystal', '黑水晶', 'Dark Crystal', 'drop', 5, 1500, ''],
  ['silk_thread', '丝线', 'Silk Thread', 'drop', 2, 240, 'spool_of_thread.png'],
  ['linen_cloth', '亚麻布', 'Linen Cloth', 'drop', 1, 120, ''],
  ['enchanted_thread', '魔化丝线', 'Enchanted Thread', 'crafted', 3, 650, 'spool_of_thread.png'],
  ['parchment', '加工羊皮纸', 'Processed Parchment', 'crafted', 2, 320, 'processed_parchment.png'],
  ['catalyst', '催化剂', 'Catalyst', 'npc', 3, 900, ''],
  ['monster_crystal', '怪物结晶', 'Monster Crystal', 'drop', 4, 1200, ''],
].map(([id, zh, en, source, rarity, price, icon]) => [id, { id, zh, en, source, rarity, price, icon }]));

const RAW_RECIPES = [
  ['iron_plate', 'smithing', '铁板', 'Iron Plate', 'Material', 1, 20, 30, 80, [['iron_ore', 2], ['coal', 1]]],
  ['bronze_plate', 'smithing', '青铜板', 'Bronze Plate', 'Material', 2, 28, 35, 90, [['bronze_ore', 3], ['coal', 1]]],
  ['steel_plate', 'smithing', '钢板', 'Steel Plate', 'Material', 4, 50, 70, 160, [['steel_ore', 3], ['coal', 2], ['screw', 1]]],
  ['mithril_plate', 'smithing', '秘银板', 'Mithril Plate', 'Material', 6, 82, 120, 280, [['mithril_ore', 3], ['coal', 2], ['screw', 1]]],
  ['adamantium_frame', 'smithing', '锂矿框架', 'Adamantium Frame', 'Material', 8, 120, 220, 480, [['adamantium_ore', 3], ['dark_crystal', 1], ['screw', 2]]],
  ['training_sword', 'weaponcrafting', '练习剑', 'Training Sword', 'Equipment', 1, 22, 25, 95, [['iron_ore', 2], ['processed_wood', 1]]],
  ['bronze_spear', 'weaponcrafting', '青铜枪', 'Bronze Spear', 'Equipment', 2, 32, 45, 120, [['bronze_ore', 3], ['processed_wood', 2]]],
  ['steel_blade', 'weaponcrafting', '钢制刀刃', 'Steel Blade', 'Equipment', 4, 58, 80, 210, [['steel_ore', 4], ['screw', 1], ['leather', 1]]],
  ['mithril_halberd', 'weaponcrafting', '秘银戟', 'Mithril Halberd', 'Equipment', 6, 95, 140, 360, [['mithril_ore', 4], ['processed_wood', 3], ['monster_crystal', 1]]],
  ['dark_edge', 'weaponcrafting', '黑暗刃', 'Dark Edge', 'Equipment', 8, 145, 260, 650, [['adamantium_ore', 4], ['dark_crystal', 2], ['monster_crystal', 1]]],
  ['linen_patch', 'tailoring', '亚麻补片', 'Linen Patch', 'Material', 1, 18, 20, 70, [['linen_cloth', 3]]],
  ['silk_wrap', 'tailoring', '丝绸卷', 'Silk Wrap', 'Material', 3, 38, 50, 130, [['silk_thread', 3], ['linen_cloth', 2]]],
  ['enchanted_lining', 'tailoring', '魔化内衬', 'Enchanted Lining', 'Material', 5, 70, 95, 240, [['enchanted_thread', 2], ['magic_powder', 1]]],
  ['mystic_robe_base', 'tailoring', '秘法长袍底材', 'Mystic Robe Base', 'Equipment', 7, 110, 160, 420, [['silk_thread', 5], ['crystal_shard', 1], ['enchanted_thread', 2]]],
  ['darkweave_panel', 'tailoring', '暗纹布板', 'Darkweave Panel', 'Material', 8, 142, 260, 620, [['dark_crystal', 1], ['enchanted_thread', 4], ['monster_crystal', 1]]],
  ['wooden_handle', 'woodcrafting', '木柄', 'Wooden Handle', 'Material', 1, 19, 15, 65, [['branch', 4]]],
  ['processed_wood_recipe', 'woodcrafting', '加工木材', 'Processed Wood', 'Material', 2, 30, 30, 120, [['firewood', 4], ['branch', 2]]],
  ['bow_frame', 'woodcrafting', '弓身', 'Bow Frame', 'Equipment', 4, 55, 65, 190, [['processed_wood', 3], ['stiff_feather', 2], ['screw', 1]]],
  ['staff_core', 'woodcrafting', '法杖核心', 'Staff Core', 'Equipment', 6, 88, 130, 330, [['processed_wood', 4], ['magic_powder', 2], ['crystal_shard', 1]]],
  ['ancient_bow_limb', 'woodcrafting', '古木弓臂', 'Ancient Bow Limb', 'Equipment', 8, 132, 210, 560, [['processed_wood', 6], ['stiff_feather', 4], ['monster_crystal', 1]]],
  ['animal_fur_bundle', 'leatherworking', '动物皮毛包', 'Animal Fur Bundle', 'Material', 1, 18, 20, 70, [['animal_skin', 3]]],
  ['processed_leather', 'leatherworking', '加工皮革', 'Processed Leather', 'Material', 3, 36, 45, 130, [['animal_skin', 5], ['stiff_feather', 1]]],
  ['leather_guard', 'leatherworking', '皮革护具', 'Leather Guard', 'Equipment', 5, 72, 100, 245, [['leather', 3], ['screw', 1]]],
  ['shadow_glove_lining', 'leatherworking', '暗影手套衬里', 'Shadow Glove Lining', 'Equipment', 7, 108, 170, 410, [['leather', 4], ['dark_crystal', 1], ['magic_powder', 1]]],
  ['monster_hide_guard', 'leatherworking', '怪物皮护具', 'Monster Hide Guard', 'Equipment', 8, 138, 240, 590, [['leather', 5], ['monster_crystal', 1], ['stiff_feather', 3]]],
  ['minor_catalyst', 'arcforge', '小型催化剂', 'Minor Catalyst', 'Material', 1, 24, 90, 100, [['magic_powder', 1], ['coal', 1]]],
  ['parchment_refine', 'arcforge', '加工羊皮纸', 'Processed Parchment', 'Material', 2, 32, 80, 120, [['parchment', 1], ['magic_powder', 1]]],
  ['crystal_focus', 'arcforge', '水晶核心', 'Crystal Focus', 'Material', 3, 48, 130, 180, [['crystal_shard', 1], ['magic_powder', 1], ['catalyst', 1]]],
  ['monster_crystal_refine', 'arcforge', '怪物结晶精炼', 'Monster Crystal Refine', 'Material', 5, 76, 180, 300, [['monster_crystal', 1], ['catalyst', 1], ['magic_powder', 2]]],
  ['dark_crystal_focus', 'arcforge', '黑水晶焦点', 'Dark Crystal Focus', 'Material', 8, 150, 320, 700, [['dark_crystal', 2], ['monster_crystal', 1], ['catalyst', 2]]],
];

const RECIPES = RAW_RECIPES.map(([id, profession, zh, en, type, level, exp, meso, resale, ingredients]) => ({
  id,
  profession,
  zh,
  en,
  type,
  level,
  exp,
  meso,
  resale,
  ingredients: ingredients.map(([itemId, qty]) => ({ itemId, qty })),
}));

function item(id) {
  return ITEMS[id] || { id, zh: id, en: id, source: 'unknown', rarity: 1, price: 999, icon: '' };
}

function profession(id) {
  return PROFESSIONS.find((p) => p.id === id) || PROFESSIONS[0];
}

function sourceZh(source) {
  return { drop: '怪物掉落', crafted: '制作中间件', npc: 'NPC/消耗', unknown: '未知' }[source] || '未知';
}

function meso(value) {
  return `${Math.round(value || 0).toLocaleString()} meso`;
}

function costOfItem(itemId, mode) {
  const row = item(itemId);
  const factor = {
    cheapest: { drop: 1, crafted: 1.1, npc: 1, unknown: 1.4 },
    balanced: { drop: .9, crafted: 1, npc: 1.35, unknown: 1.8 },
    farm: { drop: .55, crafted: .75, npc: 4, unknown: 3 },
    fastest: { drop: 1.15, crafted: 1.05, npc: .95, unknown: 1.5 },
  }[mode]?.[row.source] || 1.4;
  return row.price * factor * (1 + row.rarity * .08);
}

function recipeCost(recipe, mode) {
  const materialCost = recipe.ingredients.reduce((sum, ing) => sum + costOfItem(ing.itemId, mode) * ing.qty, 0);
  const rarity = recipe.ingredients.reduce((sum, ing) => sum + item(ing.itemId).rarity * ing.qty * (mode === 'farm' ? 30 : 12), 0);
  const resaleCredit = (mode === 'cheapest' || mode === 'balanced') ? recipe.resale * .6 : recipe.resale * .25;
  return Math.max(1, recipe.meso + materialCost + rarity - resaleCredit);
}

function materialBurden(recipe) {
  return recipe.ingredients.reduce((sum, ing) => {
    const row = item(ing.itemId);
    const sourceWeight = row.source === 'npc' ? 7 : row.source === 'crafted' ? 4 : 1;
    return sum + ing.qty * (row.rarity + sourceWeight);
  }, 0);
}

function recipeScore(recipe, mode) {
  const cost = recipeCost(recipe, mode);
  if (mode === 'fastest') return recipe.exp * 1000 - cost * .15;
  if (mode === 'farm') return recipe.exp / cost - recipe.ingredients.filter((ing) => item(ing.itemId).source === 'npc').length * .02;
  return recipe.exp / cost;
}

function addMaterials(target, recipe, crafts) {
  recipe.ingredients.forEach((ing) => {
    const row = item(ing.itemId);
    target[ing.itemId] ||= { id: ing.itemId, zh: row.zh, en: row.en, qty: 0 };
    target[ing.itemId].qty += ing.qty * crafts;
  });
}

function simulate(professionId, mode, start = 1, target = 10, noBuy = false) {
  const steps = [];
  const materials = {};
  let totalCost = 0;
  let totalCrafts = 0;
  for (let level = start; level < target; level += 1) {
    const expNeed = MASTERY[level - 1] || 1000;
    const pool = RECIPES.filter((r) => r.profession === professionId && r.level <= level && (!noBuy || r.ingredients.every((ing) => item(ing.itemId).source !== 'npc')));
    if (!pool.length) break;
    const best = [...pool].sort((a, b) => noBuy ? (materialBurden(a) / a.exp) - (materialBurden(b) / b.exp) : recipeScore(b, mode) - recipeScore(a, mode))[0];
    const crafts = Math.ceil(expNeed / best.exp);
    addMaterials(materials, best, crafts);
    totalCrafts += crafts;
    totalCost += crafts * (noBuy ? best.meso : recipeCost(best, mode));
    steps.push({ level, to: level + 1, recipe: best, crafts, expNeed });
  }
  return { steps, materials, totalCost, totalCrafts };
}

function matrixRows() {
  const rows = {};
  RECIPES.forEach((recipe) => recipe.ingredients.forEach((ing) => {
    rows[ing.itemId] ||= { itemId: ing.itemId, by: Object.fromEntries(PROFESSIONS.map((p) => [p.id, 0])), recipes: new Set(), profs: new Set(), total: 0 };
    rows[ing.itemId].by[recipe.profession] += ing.qty;
    rows[ing.itemId].recipes.add(recipe.id);
    rows[ing.itemId].profs.add(recipe.profession);
    rows[ing.itemId].total += ing.qty;
  }));
  return Object.values(rows).map((row) => ({
    ...row,
    score: row.total * 3 + row.recipes.size * 12 + row.profs.size * 18 + item(row.itemId).rarity * 15,
  })).sort((a, b) => b.score - a.score || b.total - a.total);
}

function browserRows(scope, type, query) {
  const q = query.trim().toLowerCase();
  return RECIPES.filter((recipe) => {
    if (scope !== 'all' && recipe.profession !== scope) return false;
    if (type !== 'all' && recipe.type !== type) return false;
    if (!q) return true;
    const haystack = [recipe.zh, recipe.en, recipe.id, profession(recipe.profession).zh, profession(recipe.profession).en, ...recipe.ingredients.flatMap((ing) => [item(ing.itemId).zh, item(ing.itemId).en, ing.itemId])].join(' ').toLowerCase();
    return haystack.includes(q);
  }).sort((a, b) => a.level - b.level || a.profession.localeCompare(b.profession));
}

function MaterialIcon({ row, size = 24 }) {
  const [failed, setFailed] = useState(false);
  const src = row.icon && !failed ? `${ICON_BASE}${row.icon}` : '';
  return <span className="mg-craft-icon" style={{ width: size, height: size }}>{src ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>{row.zh.slice(0, 1)}</span>}</span>;
}

function ProfessionIcon({ row, size = 26 }) {
  const [failed, setFailed] = useState(false);
  const src = !failed ? `${ICON_BASE}${row.icon}` : '';
  return <span className="mg-craft-icon" style={{ width: size, height: size }}>{src ? <img src={src} alt="" onError={() => setFailed(true)} /> : <span>{row.zh.slice(0, 1)}</span>}</span>;
}

function AdvancedCraftingSections() {
  const [selectedProfession, setSelectedProfession] = useState('woodcrafting');
  const [mode, setMode] = useState('farm');
  const [scope, setScope] = useState('all');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');

  const strategy = useMemo(() => MODES.map((m) => ({ ...m, route: simulate(selectedProfession, m.id) })), [selectedProfession]);
  const matrix = useMemo(matrixRows, []);
  const bottlenecks = matrix.slice(0, 10);
  const woodPlan = useMemo(() => simulate('woodcrafting', 'farm', 1, 10, true), []);
  const recipes = useMemo(() => browserRows(scope, type, query), [scope, type, query]);
  const selected = profession(selectedProfession);
  const activeRoute = simulate(selectedProfession, mode);
  const activeMaterials = Object.values(activeRoute.materials).sort((a, b) => b.qty - a.qty).slice(0, 8);
  const woodMaterials = Object.values(woodPlan.materials).sort((a, b) => b.qty - a.qty);

  return <section className="mg-advanced-crafting">
    <div className="mg-material-controls mg-glass-panel mg-advanced-controls">
      <label>策略专业</label>
      <select className="mg-select" value={selectedProfession} onChange={(e) => setSelectedProfession(e.target.value)}>
        {PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{p.zh} · {p.en}</option>)}
      </select>
      <label>策略路线</label>
      <select className="mg-select" value={mode} onChange={(e) => setMode(e.target.value)}>
        {MODES.map((m) => <option key={m.id} value={m.id}>{m.zh}</option>)}
      </select>
      <label>参考</label>
      <span className="mg-advanced-pill"><ProfessionIcon row={selected} />Lv.1 → Lv.10</span>
    </div>

    <section className="mg-glass-panel mg-material-recipes-panel">
      <div className="mg-material-panel-head"><h2>专业升级策略</h2><span>{selected.zh} · 四种路线对比</span></div>
      <div className="mg-strategy-grid">
        {strategy.map((row) => {
          const largest = Object.values(row.route.materials).sort((a, b) => b.qty - a.qty)[0];
          return <article key={row.id} className={row.id === mode ? 'mg-strategy-card active' : 'mg-strategy-card'}>
            <strong>{row.zh}</strong>
            <p>{row.desc}</p>
            <div><span>{row.route.totalCrafts} 次制作</span><span>{meso(row.route.totalCost)}</span><span>最大材料：{largest?.zh || '-'}</span></div>
            {row.route.steps.slice(0, 4).map((step) => <em key={`${row.id}-${step.level}`}>Lv.{step.level} {step.recipe.zh} ×{step.crafts}</em>)}
          </article>;
        })}
      </div>
      <div className="mg-material-chip-list mg-advanced-chips">
        {activeMaterials.map((mat) => <span key={mat.id} className="mg-material-chip"><MaterialIcon row={item(mat.id)} size={20} />{mat.zh} x{mat.qty}</span>)}
      </div>
    </section>

    <section className="mg-glass-panel mg-material-recipes-panel">
      <div className="mg-material-panel-head"><h2>跨专业材料矩阵</h2><span>材料在六大专业的使用量</span></div>
      <div className="mg-matrix-wrap"><table className="mg-material-matrix"><thead><tr><th>材料</th>{PROFESSIONS.map((p) => <th key={p.id}>{p.zh}</th>)}<th>总量</th><th>覆盖</th></tr></thead><tbody>
        {matrix.slice(0, 12).map((row) => <tr key={row.itemId}><td><span className="mg-matrix-material"><MaterialIcon row={item(row.itemId)} size={22} />{item(row.itemId).zh}</span></td>{PROFESSIONS.map((p) => <td key={`${row.itemId}-${p.id}`}>{row.by[p.id] || '-'}</td>)}<td>{row.total}</td><td>{row.profs.size}系/{row.recipes.size}配方</td></tr>)}
      </tbody></table></div>
    </section>

    <div className="mg-two-column-panels">
      <section className="mg-glass-panel mg-material-recipes-panel">
        <div className="mg-material-panel-head"><h2>材料瓶颈排行</h2><span>需求 / 覆盖 / 稀有度综合分</span></div>
        <div className="mg-bottleneck-list">
          {bottlenecks.map((row, index) => <article className="mg-bottleneck-row" key={row.itemId}>
            <strong>#{index + 1}</strong><MaterialIcon row={item(row.itemId)} /><div><b>{item(row.itemId).zh}</b><span>{sourceZh(item(row.itemId).source)} · {row.profs.size}系 · {row.recipes.size}配方</span></div><em>{row.score}</em>
          </article>)}
        </div>
      </section>

      <section className="mg-glass-panel mg-material-recipes-panel">
        <div className="mg-material-panel-head"><h2>木工零金币升级规划</h2><span>外购金币 0 · 自刷材料路线</span></div>
        <div className="mg-zero-summary"><div><span>目标</span><strong>Lv.1→Lv.10</strong></div><div><span>制作次数</span><strong>{woodPlan.totalCrafts}</strong></div><div><span>外购金币</span><strong>{meso(0)}</strong></div><div><span>制作手续费</span><strong>{meso(woodPlan.totalCost)}</strong></div></div>
        <p className="mg-advanced-note">零金币按不购买材料计算，材料优先自刷或前置制作；制作手续费单独列出，避免把市场价混进材料规划。</p>
        <div className="mg-material-chip-list">{woodMaterials.map((mat) => <span key={mat.id} className="mg-material-chip"><MaterialIcon row={item(mat.id)} size={20} />{mat.zh} x{mat.qty}</span>)}</div>
        <div className="mg-zero-route">{woodPlan.steps.map((step) => <article key={step.level}>Lv.{step.level}→{step.to} · {step.recipe.zh} ×{step.crafts}</article>)}</div>
      </section>
    </div>

    <section className="mg-glass-panel mg-material-recipes-panel">
      <div className="mg-material-panel-head"><h2>配方浏览器</h2><span>{recipes.length} 条</span></div>
      <div className="mg-browser-toolbar">
        <select className="mg-select" value={scope} onChange={(e) => setScope(e.target.value)}><option value="all">全部专业</option>{PROFESSIONS.map((p) => <option key={p.id} value={p.id}>{p.zh} · {p.en}</option>)}</select>
        <select className="mg-select" value={type} onChange={(e) => setType(e.target.value)}><option value="all">全部类型</option><option value="Material">材料</option><option value="Equipment">装备</option></select>
        <input className="mg-recipe-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索中文名 / 英文名 / 材料名" />
      </div>
      <div className="mg-material-recipe-grid browser">
        {recipes.map((recipe) => <article className="mg-material-recipe-card" key={recipe.id}>
          <div className="mg-recipe-title-line"><MaterialIcon row={{ ...item(recipe.id), zh: recipe.zh, en: recipe.en }} size={24} /><strong>{recipe.zh}</strong></div>
          <span>{profession(recipe.profession).zh} · {recipe.type === 'Material' ? '材料' : '装备'} · Lv.{recipe.level} · EXP {recipe.exp} · {meso(recipe.meso)}</span>
          <p>{recipe.ingredients.map((ing) => `${item(ing.itemId).zh} x${ing.qty}`).join(' / ')}</p>
        </article>)}
      </div>
    </section>
  </section>;
}

export default function CraftingMaterialsPageEnhanced() {
  useEffect(() => {
    const woodSrc = `${ICON_BASE}processed_wood_04003001.png`;
    const timer = window.setTimeout(() => {
      document.querySelectorAll('.mg-material-chip, .mg-material-rank-row, .mg-material-recipe-card').forEach((node) => {
        if (node.textContent?.includes('加工木材')) {
          node.querySelectorAll('img[src$="processed_leather.png"]').forEach((img) => { img.onerror = () => { const box = img.closest('.mg-craft-icon'); if (box) box.innerHTML = '<span>木</span>'; }; img.src = woodSrc; });
        }
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <>
    <CraftingMaterialsPage />
    <AdvancedCraftingSections />
  </>;
}
