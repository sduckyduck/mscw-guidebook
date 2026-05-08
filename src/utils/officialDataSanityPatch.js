const BANNED_ITEM_NAMES = ['zakum helmet'];
const DEMOTED_ROUTE_MONSTERS = ['zombie mushroom'];

const ITEM_STAT_OVERRIDES = [
  {
    names: ['ryden'],
    stats: {
      incPAD: 50,
      pad: 50,
      watk: 50,
      attack: 50,
      incSTR: 1,
      str: 1,
    },
  },
];

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

function getItemText(item) {
  return `${item?.name ?? ''} ${item?.title ?? ''}`;
}

function getItemStatOverride(item) {
  return ITEM_STAT_OVERRIDES.find((override) => nameIncludesAny(getItemText(item), override.names));
}

function applyItemStatOverride(item) {
  const override = getItemStatOverride(item);
  if (!override) return item;

  const next = {
    ...item,
    ...override.stats,
    stats: {
      ...(item.stats ?? {}),
      ...override.stats,
    },
    statCorrectedForGuide: true,
  };

  next.desc = buildCorrectedItemDescription(next, item.desc);
  return next;
}

function buildCorrectedItemDescription(item, fallback = '') {
  const pieces = [];
  const reqParts = [];
  const reqLevel = Number(item.reqLevel ?? item.stats?.reqLevel ?? 0) || 0;
  const weaponType = item.weaponType ?? item.weapon_type;
  const reqSTR = Number(item.reqSTR ?? item.stats?.reqSTR ?? 0) || 0;
  const reqDEX = Number(item.reqDEX ?? item.stats?.reqDEX ?? 0) || 0;

  if (reqLevel) pieces.push(`Lv ${reqLevel}`);
  if (weaponType) pieces.push(weaponType);
  if (reqSTR) reqParts.push(`STR ${reqSTR}`);
  if (reqDEX) reqParts.push(`DEX ${reqDEX}`);
  if (reqParts.length) pieces.push(reqParts.join(' · '));

  const statParts = [];
  const watk = Number(item.incPAD ?? item.stats?.incPAD ?? 0) || 0;
  const matk = Number(item.incMAD ?? item.stats?.incMAD ?? 0) || 0;
  const str = Number(item.incSTR ?? item.stats?.incSTR ?? 0) || 0;
  const dex = Number(item.incDEX ?? item.stats?.incDEX ?? 0) || 0;

  if (watk) statParts.push(`+${watk} WATK`);
  if (matk) statParts.push(`+${matk} MATK`);
  if (str) statParts.push(`+${str} STR`);
  if (dex) statParts.push(`+${dex} DEX`);

  const slots = Number(item.tuc ?? item.slots ?? item.stats?.tuc ?? item.stats?.slots ?? 0) || 0;
  if (slots) statParts.push(`${slots} slots`);
  if (statParts.length) pieces.push(statParts.join(' · '));

  return pieces.join(' · ') || fallback;
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
      .map((item) => normalizeEquipmentPriceForGuideScoring(applyItemStatOverride(item))),
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
