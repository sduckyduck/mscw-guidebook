const BANNED_ITEM_NAMES = ['zakum helmet'];
const DEMOTED_ROUTE_MONSTERS = ['zombie mushroom'];

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function nameIncludesAny(value, names) {
  const text = normalizeText(value);
  return names.some((name) => text.includes(name));
}

function isBannedItem(item) {
  return nameIncludesAny(`${item?.name ?? ''} ${item?.title ?? ''}`, BANNED_ITEM_NAMES);
}

function shouldDemoteRouteMonster(monster) {
  return nameIncludesAny(monster?.name ?? '', DEMOTED_ROUTE_MONSTERS);
}

function patchItemsPayload(payload) {
  if (!payload || !Array.isArray(payload.items)) return payload;
  return {
    ...payload,
    items: payload.items.filter((item) => !isBannedItem(item)),
  };
}

function patchMonstersPayload(payload) {
  if (!payload || !Array.isArray(payload.monsters)) return payload;

  return {
    ...payload,
    monsters: payload.monsters.map((monster) => {
      if (!shouldDemoteRouteMonster(monster)) return monster;

      // Zombie Mushroom's very high-density Ant Tunnel entries were dominating
      // recommendations far beyond their practical leveling window. Keep the
      // monster in the dataset, but remove its map references so it no longer
      // becomes the route target from Lv.20 all the way to Lv.50.
      return {
        ...monster,
        maps: [],
        __routeDisabledReason: 'Too-low-level monster was over-dominating route recommendations.',
      };
    }),
  };
}

async function patchedJsonResponse(response, patcher) {
  const data = await response.clone().json();
  const patched = patcher(data);
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(patched), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function installOfficialDataSanityPatch() {
  if (typeof window === 'undefined') return;
  if (window.__mscwOfficialDataSanityPatchInstalled) return;
  window.__mscwOfficialDataSanityPatchInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = String(args[0]?.url ?? args[0] ?? '');

    try {
      if (/AppData\/items\.json(?:\?|$)/.test(url)) {
        return patchedJsonResponse(response, patchItemsPayload);
      }
      if (/AppData\/monsters\.json(?:\?|$)/.test(url)) {
        return patchedJsonResponse(response, patchMonstersPayload);
      }
    } catch {
      return response;
    }

    return response;
  };
}

installOfficialDataSanityPatch();
