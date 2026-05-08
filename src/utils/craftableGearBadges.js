const CRAFTING_DATA_PATH = 'AppData/crafting.json';
const BADGE_CLASS = 'mg-craftable-badge';
const BADGED_ATTR = 'data-mscw-craftable-badged';

let recipeMapPromise = null;
let recipeMap = null;

function getBaseUrl() {
  const base = import.meta.env?.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
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
  badge.textContent = variant === 'tile' ? '锻' : '可锻造';
  badge.setAttribute('role', 'button');
  badge.setAttribute('tabindex', '0');
  badge.setAttribute('aria-label', `查看 ${recipe.output} 的锻造材料`);
  badge.dataset.recipeId = recipe.id;

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
  return `${number.toLocaleString()} meso`;
}

function showCraftingModal(recipe) {
  document.querySelector('.mg-craft-modal-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'mg-craft-modal-backdrop';
  backdrop.innerHTML = `
    <div class="mg-craft-modal" role="dialog" aria-modal="true">
      <div class="mg-craft-modal-head">
        <div>
          <span>可锻造装备</span>
          <h2>${escapeHtml(recipe.output)}</h2>
        </div>
        <button type="button" class="mg-craft-modal-close">关闭</button>
      </div>
      <div class="mg-craft-modal-meta">
        <span>${escapeHtml(recipe.profession)}</span>
        <span>Lv.${recipe.level || '-'}</span>
        ${formatMeso(recipe.mesoCost) ? `<span>${formatMeso(recipe.mesoCost)}</span>` : ''}
        ${recipe.exp ? `<span>EXP ${recipe.exp}</span>` : ''}
      </div>
      <h3>需要材料</h3>
      <div class="mg-craft-material-list">
        ${recipe.materials.length ? recipe.materials.map((material) => `
          <div class="mg-craft-material-row">
            <strong>${escapeHtml(material.name)}</strong>
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
