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

function getItemReqLevel(item) {
  return Number(item?.stats?.reqLevel ?? item?.reqLevel ?? 0) || 0;
}

function normalizeEquipmentPriceForGuideScoring(item) {
  if (!item || item.category !== 'Equipment') return item;

  const reqLevel = getItemReqLevel(item);
  const price = Number(item.price ?? 0);
  if (!Number.isFinite(price) || price <= 0 || reqLevel <= 20) return item;

  const scoringPriceCap = Math.round(900 + reqLevel * 140);
  if (price <= scoringPriceCap) return item;

  return {
    ...item,
    originalPrice: item.originalPrice ?? price,
    price: scoringPriceCap,
    priceAdjustedForGuideScoring: true,
  };
}

function patchItemsPayload(payload) {
  if (!payload || !Array.isArray(payload.items)) return payload;
  return {
    ...payload,
    items: payload.items
      .filter((item) => !isBannedItem(item))
      .map((item) => normalizeEquipmentPriceForGuideScoring(item)),
  };
}

function patchMonstersPayload(payload) {
  if (!payload || !Array.isArray(payload.monsters)) return payload;

  return {
    ...payload,
    monsters: payload.monsters.map((monster) => {
      if (!shouldDemoteRouteMonster(monster)) return monster;

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
