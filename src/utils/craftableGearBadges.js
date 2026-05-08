const CRAFTING_DATA_PATH = 'AppData/crafting.json';
const BADGE_CLASS = 'mg-craftable-badge';
const BADGED_ATTR = 'data-mscw-craftable-badged';

const PROFESSION_ZH = {
  Smithing: '防具锻造',
  Weaponcrafting: '武器制作',
  Tailoring: '裁缝制作',
  Woodcrafting: '木工制作',
  Leatherworking: '皮革制作',
  Arcforge: '奥术锻造',
  Crafting: '制作',
};

const PROFESSION_ICON_FILES = {
  Smithing: ['smithing.png', 'Smithing.png'],
  Weaponcrafting: ['weaponcrafting.png', 'weapon.png', 'Weaponcrafting.png', 'Weapon.png'],
  Tailoring: ['tailoring.png', 'Tailoring.png'],
  Woodcrafting: ['woodcrafting.png', 'wood.png', 'Woodcrafting.png', 'Wood.png'],
  Leatherworking: ['leatherwork.png', 'leatherworking.png', 'Leatherwork.png', 'Leatherworking.png'],
  Arcforge: ['arcane_forge.png', 'arcane-forge.png', 'arcforge.png', 'Arcane_Forge.png', 'Arcforge.png'],
  Crafting: ['smithing.png', 'Smithing.png'],
};

const MATERIAL_ZH = {
  'Bronze Ingot': '青铜锭',
  'Steel Ingot': '钢铁锭',
  'Mithril Ingot': '秘银锭',
  'Adamantium Ingot': '锂矿锭',
  'Silver Ingot': '银锭',
  'Orihalcon Ingot': '奥利哈钢锭',
  'Gold Ingot': '黄金锭',
  'Dark Crystal': '黑水晶',
  Diamond: '钻石',
  Sapphire: '蓝宝石',
  Garnet: '石榴石',
  Amethyst: '紫水晶',
  Aquamarine: '海蓝宝石',
  Emerald: '祖母绿',
  Opal: '蛋白石',
  Topaz: '黄晶',
  'Black Crystal': '黑水晶',
  'Power Crystal': '力量水晶',
  'Dexterity Crystal': '敏捷水晶',
  'Wisdom Crystal': '智慧水晶',
  'LUK Crystal': '幸运水晶',
  'Screw': '螺丝钉',
  Screw: '螺丝钉',
  'Processed Wood': '加工木材',
  'Stiff Feather': '硬羽毛',
  'Soft Feather': '柔软羽毛',
  'Animal Skin': '动物皮',
  Leather: '皮革',
  'Dragon Skin': '龙皮',
  'Piece of Ice': '冰块',
  'Firewood': '柴火',
  'Tree Branch': '树枝',
  'Wooden Board': '木板',
  'Log': '原木',
  'Pig Ribbon': '猪的蝴蝶结',
  'Orange Mushroom Cap': '橙蘑菇盖',
  'Blue Mushroom Cap': '蓝蘑菇盖',
  'Green Mushroom Cap': '绿蘑菇盖',
  'Zombie Mushroom Cap': '僵尸蘑菇盖',
  'Horny Mushroom Cap': '刺蘑菇盖',
  'Wild Boar Tooth': '野猪尖牙',
  'Fire Boar Tooth': '火野猪尖牙',
  'Jr. Necki Skin': '小青蛇皮',
  'Evil Eye Tail': '风独眼兽尾巴',
  'Curse Eye Tail': '冰独眼兽尾巴',
  'Lupin Banana': '猴子香蕉',
  'Zombie Lupin Doll': '僵尸猴玩偶',
  'Solid Horn': '坚硬的角',
  'Drake Skull': '龙头骨',
  'Dragon Scale': '龙鳞',
  'Ligator Skin': '鳄鱼皮',
  'Octopus Leg': '章鱼脚',
  'Slime Bubble': '绿水灵珠',
  'Bubble Fish Thoughts': '泡泡鱼的心事',
  'Star Rock': '星石',
  'Moon Rock': '月石',
};

let recipeMapPromise = null;
let recipeMap = null;

function getBaseUrl() {
  const base = import.meta.env?.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function publicAsset(path) {
  return `${getBaseUrl()}${String(path).replace(/^\/+/, '')}`;
}

function normalizeName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'object') return Object.values(value);
  return [];
}

function translateProfession(value = '') {
  return PROFESSION_ZH[value] ?? PROFESSION_ZH[String(value).trim()] ?? value ?? '制作';
}

function translateMaterial(value = '') {
  return MATERIAL_ZH[value] ?? MATERIAL_ZH[String(value).trim()] ?? value ?? '未知材料';
}

function getProfessionIconCandidates(profession = '') {
  const files = PROFESSION_ICON_FILES[profession] ?? PROFESSION_ICON_FILES[String(profession).trim()] ?? PROFESSION_ICON_FILES.Crafting;
  return [...new Set(files.flatMap((file) => [
    publicAsset(`icons/crafting/${file}`),
    publicAsset(`icon/crafting/${file}`),
  ]))];
}

function wireIconFallback(img, candidates) {
  if (!img || !candidates?.length) return;
  img.dataset.iconIndex = '0';
  img.src = candidates[0];
  img.addEventListener('error', () => {
    const nextIndex = Number(img.dataset.iconIndex ?? 0) + 1;
    if (nextIndex >= candidates.length) {
      img.style.display = 'none';
      return;
    }
    img.dataset.iconIndex = String(nextIndex);
    img.src = candidates[nextIndex];
  });
}

function createProfessionIcon(recipe, className = 'mg-craft-profession-icon') {
  const icon = document.createElement('img');
  icon.className = className;
  icon.alt = translateProfession(recipe.profession);
  icon.draggable = false;
  icon.loading = 'eager';
  icon.decoding = 'async';
  wireIconFallback(icon, getProfessionIconCandidates(recipe.profession));
  return icon;
}

function buildRecipeMap(raw) {
  const map = new Map();

  for (const discipline of safeArray(raw?.disciplines)) {
    for (const outputType of safeArray(discipline.output_types)) {
      for (const levelGroup of safeArray(outputType.levels)) {
        for (const recipe of safeArray(levelGroup.recipes)) {
          const output = recipe.result_item_name ?? recipe.output_name ?? '';
          const key = normalizeName(output);
          if (!key) continue;

          const normalizedRecipe = {
            id: String(recipe.id ?? recipe.output_id ?? key),
            profession: discipline.discipline ?? 'Crafting',
            output,
            outputId: recipe.output_id,
            outputType: outputType.output_type ?? '',
            level: Number(recipe.req_level ?? levelGroup.level ?? 1),
            exp: Number(recipe.craft_exp ?? 0),
            mesoCost: Number(recipe.meso_cost ?? 0),
            resultCount: Number(recipe.result_count ?? 1),
            materials: safeArray(recipe.ingredients).map((ingredient) => ({
              name: ingredient.item_name ?? ingredient.name ?? 'Unknown material',
              qty: Number(ingredient.count ?? ingredient.qty ?? 1),
            })),
          };

          if (!map.has(key)) map.set(key, normalizedRecipe);
        }
      }
    }
  }

  return map;
}

async function loadRecipeMap() {
  if (recipeMap) return recipeMap;
  if (!recipeMapPromise) {
    recipeMapPromise = fetch(`${getBaseUrl()}${CRAFTING_DATA_PATH}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`crafting ${response.status}`);
        return response.json();
      })
      .then((raw) => {
        recipeMap = buildRecipeMap(raw);
        return recipeMap;
      })
      .catch(() => {
        recipeMap = new Map();
        return recipeMap;
      });
  }
  return recipeMapPromise;
}

function getPickerItemName(row) {
  return row?.querySelector?.('strong')?.textContent?.trim() ?? '';
}

function getEquippedTileName(tile) {
  const strong = tile?.querySelector?.('strong')?.textContent?.trim() ?? '';
  if (!strong || ['未装备', '点击换上衣', '点击换下衣', '点击换套服', '套服占用', '上下衣占用'].includes(strong)) return '';
  return strong;
}

function getRecipeForName(name) {
  if (!recipeMap || !name) return null;
  return recipeMap.get(normalizeName(name)) ?? null;
}

function removeStaleBadge(node) {
  node?.querySelector?.(`.${BADGE_CLASS}`)?.remove();
  node?.removeAttribute?.(BADGED_ATTR);
}

function createBadge(recipe, variant) {
  const badge = document.createElement('span');
  badge.className = `${BADGE_CLASS} ${variant === 'tile' ? 'tile' : 'picker'}`;
  badge.setAttribute('role', 'button');
  badge.setAttribute('tabindex', '0');
  badge.setAttribute('aria-label', `查看 ${recipe.output} 的制作材料`);
  badge.setAttribute('title', translateProfession(recipe.profession));
  badge.dataset.recipeId = recipe.id;

  badge.appendChild(createProfessionIcon(recipe, 'mg-craft-badge-icon'));
  if (variant !== 'tile') {
    const label = document.createElement('span');
    label.textContent = '可锻造';
    badge.appendChild(label);
  }

  const open = (event) => {
    event.preventDefault();
    event.stopPropagation();
    showCraftingModal(recipe);
  };
  badge.addEventListener('pointerdown', (event) => event.stopPropagation());
  badge.addEventListener('click', open);
  badge.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') open(event);
  });

  return badge;
}

function badgePickerRow(row) {
  if (!row || row.getAttribute(BADGED_ATTR) === '1') return;
  const recipe = getRecipeForName(getPickerItemName(row));
  if (!recipe) return removeStaleBadge(row);

  const tail = row.querySelector('em') ?? row;
  tail.insertAdjacentElement('beforebegin', createBadge(recipe, 'picker'));
  row.setAttribute(BADGED_ATTR, '1');
}

function badgeEquippedTile(tile) {
  if (!tile || tile.getAttribute(BADGED_ATTR) === '1') return;
  const recipe = getRecipeForName(getEquippedTileName(tile));
  if (!recipe) return removeStaleBadge(tile);

  tile.appendChild(createBadge(recipe, 'tile'));
  tile.setAttribute(BADGED_ATTR, '1');
}

function applyBadges(root = document) {
  root.querySelectorAll?.('.mg-picker-item')?.forEach(badgePickerRow);
  root.querySelectorAll?.('.mg-equip-tile')?.forEach(badgeEquippedTile);
}

function formatMeso(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '';
  return `${number.toLocaleString()} 金币`;
}

function showCraftingModal(recipe) {
  document.querySelector('.mg-craft-modal-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'mg-craft-modal-backdrop';
  backdrop.innerHTML = `
    <div class="mg-craft-modal" role="dialog" aria-modal="true">
      <div class="mg-craft-modal-head">
        <div class="mg-craft-title-row">
          <div class="mg-craft-title-icon-slot"></div>
          <div>
            <span>可锻造装备</span>
            <h2>${escapeHtml(recipe.output)}</h2>
          </div>
        </div>
        <button type="button" class="mg-craft-modal-close">关闭</button>
      </div>
      <div class="mg-craft-modal-meta">
        <span>${escapeHtml(translateProfession(recipe.profession))}</span>
        <span>制作等级 ${recipe.level || '-'}</span>
        ${formatMeso(recipe.mesoCost) ? `<span>${formatMeso(recipe.mesoCost)}</span>` : ''}
        ${recipe.exp ? `<span>制作经验 ${recipe.exp}</span>` : ''}
      </div>
      <h3>需要材料</h3>
      <div class="mg-craft-material-list">
        ${recipe.materials.length ? recipe.materials.map((material) => `
          <div class="mg-craft-material-row">
            <strong>${escapeHtml(translateMaterial(material.name))}</strong>
            <em>x${material.qty}</em>
          </div>
        `).join('') : '<p>当前配方没有材料明细。</p>'}
      </div>
    </div>
  `;

  const close = () => backdrop.remove();
  backdrop.addEventListener('click', close);
  backdrop.querySelector('.mg-craft-modal')?.addEventListener('click', (event) => event.stopPropagation());
  backdrop.querySelector('.mg-craft-modal-close')?.addEventListener('click', close);
  backdrop.querySelector('.mg-craft-title-icon-slot')?.appendChild(createProfessionIcon(recipe, 'mg-craft-modal-profession-icon'));
  document.body.appendChild(backdrop);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function installCraftableGearBadges() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwCraftableGearBadgesInstalled) return;
  window.__mscwCraftableGearBadgesInstalled = true;

  loadRecipeMap().then(() => applyBadges());

  const observer = new MutationObserver((mutations) => {
    if (!recipeMap) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) applyBadges(node);
      }
      if (mutation.type === 'characterData') {
        const parent = mutation.target?.parentElement;
        if (parent?.closest?.('.mg-picker-item, .mg-equip-tile')) {
          const target = parent.closest('.mg-picker-item, .mg-equip-tile');
          removeStaleBadge(target);
          applyBadges(target.parentElement ?? document);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installCraftableGearBadges();
