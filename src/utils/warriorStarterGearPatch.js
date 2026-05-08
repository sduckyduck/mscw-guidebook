const ITEMS_PATH_PATTERN = /AppData\/items\.json(?:\?|$)/;
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
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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

function patchItemsPayload(payload) {
  if (!payload || !Array.isArray(payload.items)) return payload;
  return {
    ...payload,
    items: payload.items.map(makeStarterNonWarrior),
  };
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
