const ITEMS_PATH_PATTERN = /AppData\/items\.json(?:\?|$)/;
const STORAGE_KEY = 'mscw-guidebook-state-v2';
const NON_WARRIOR_JOB_MASK = 2 + 4 + 8 + 16;

const STARTER_NAMES_TO_HIDE_FROM_WARRIOR = new Set([
  "Beginner's Sword",
  'Red Headband',
  'Black Headband',
  'Orange Sporty T-Shirt',
  'Yellow T-Shirt',
  'Blue One-Lined T-Shirt',
  'Red Miniskirt',
  'Red Mini Skirt',
  'Blue Jean Shorts',
  'Brown Cotton Shorts',
  'Red Rubber Boots',
  'Yellow Basic Boots',
  'Brown Hard Leather Boots',
]);

function normalizeName(value = '') {
  return String(value).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

const STARTER_KEYS = new Set([...STARTER_NAMES_TO_HIDE_FROM_WARRIOR].map(normalizeName));

function isStarterItemToHideFromWarrior(item) {
  const name = normalizeName(`${item?.name ?? ''} ${item?.title ?? ''}`);
  return [...STARTER_KEYS].some((key) => name === key || name.includes(key));
}

function makeStarterNonWarrior(item) {
  if (!isStarterItemToHideFromWarrior(item)) return item;
  return {
    ...item,
    reqJob: NON_WARRIOR_JOB_MASK,
    req_job: NON_WARRIOR_JOB_MASK,
    reqJobLabel: 'Beginner / Non-Warrior',
    req_job_label: 'Beginner / Non-Warrior',
    stats: {
      ...(item.stats ?? {}),
      reqJob: NON_WARRIOR_JOB_MASK,
    },
  };
}

function earlyWarriorWeaponPriority(item) {
  const name = normalizeName(item?.name ?? item?.title ?? '');
  const reqLevel = Number(item?.reqLevel ?? item?.stats?.reqLevel ?? 0) || 0;
  const reqJob = Number(item?.reqJob ?? item?.req_job ?? item?.stats?.reqJob ?? 0) || 0;
  const isWarriorOrAll = reqJob === 0 || (reqJob & 1) === 1;
  if (!isWarriorOrAll || reqLevel > 10) return 50;

  // Lv.10-Lv.15 low-budget Fighter/Page should default to Long Sword.
  // The starter selector searches for names containing "Sword", so Long Sword
  // must appear before the plain beginner Sword in the AppData item order.
  if (name === 'long sword') return -100;
  if (name === 'beginners long sword') return -90;
  if (name === 'wooden sword') return -40;
  if (name === 'sword') return 100;
  return 0;
}

function reorderEarlyWarriorWeapons(items) {
  return [...items]
    .map((item, index) => ({ item, index, rank: earlyWarriorWeaponPriority(item) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

function patchItemsPayload(payload) {
  if (!payload || !Array.isArray(payload.items)) return payload;
  return {
    ...payload,
    items: reorderEarlyWarriorWeapons(payload.items.map(makeStarterNonWarrior)),
  };
}

function clearSavedPlainSwordOverride() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object') return;

    const isLowEarlyWarrior = state.classId === 'warrior'
      && state.budget === 'low'
      && Number(state.level ?? 0) >= 10
      && Number(state.level ?? 0) <= 15
      && state.branchId !== 'spearman';
    const weaponName = normalizeName(`${state.gearOverrides?.weapon?.name ?? ''} ${state.gearOverrides?.weapon?.title ?? ''}`);

    if (isLowEarlyWarrior && (weaponName === 'sword' || weaponName.includes(' sword sword'))) {
      const next = {
        ...state,
        gearOverrides: {
          ...(state.gearOverrides ?? {}),
        },
      };
      delete next.gearOverrides.weapon;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // Ignore broken saved state.
  }
}

async function patchedJsonResponse(response) {
  const data = await response.clone().json();
  const patched = patchItemsPayload(data);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(patched), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function installWarriorStarterGearPatch() {
  if (typeof window === 'undefined') return;
  if (window.__mscwWarriorStarterGearPatchInstalled) return;
  window.__mscwWarriorStarterGearPatchInstalled = true;

  clearSavedPlainSwordOverride();

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = String(args[0]?.url ?? args[0] ?? '');
    if (!ITEMS_PATH_PATTERN.test(url)) return response;
    try {
      return patchedJsonResponse(response);
    } catch {
      return response;
    }
  };
}

installWarriorStarterGearPatch();
