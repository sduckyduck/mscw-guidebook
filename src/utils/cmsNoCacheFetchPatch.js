const PATCH_FLAG = '__mscwCmsNoCacheFetchPatchInstalled';
const CMS_DATA_VERSION = 'cms-equipment-stats-20260509-v3';
const STORAGE_KEY = 'mscw-guidebook-state-v2';

const BANNED_CMS_ITEM_NAME = /(gm|admin|administrator|test|tester|event|cash|nx|vip|donor|wizet|developer|manager|维泽特|管理员|测试|活动|现金|点装|圣诞|周年|纪念|情人节|生日|蛋糕|气球|玫瑰|巧克力|棒棒糖|泳装|游泳|透明|玩具)/i;
const HIGH_STAT_KEYS = ['incSTR', 'incDEX', 'incINT', 'incLUK'];
const HIGH_COMBAT_KEYS = ['incPAD', 'incMAD'];
const HIGH_DEFENSE_KEYS = ['incPDD', 'incMDD', 'incACC', 'incEVA'];

function isCmsJsonRequest(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  if (!raw) return false;
  try {
    const url = new URL(String(raw), window.location.origin);
    return /\/cms\/(items|lookups|maps|monsters|skills|npcs|quests)\.json$/.test(url.pathname);
  } catch {
    return /(^|\/)cms\/(items|lookups|maps|monsters|skills|npcs|quests)\.json(?:$|[?#])/.test(String(raw));
  }
}

function isCmsItemsRequest(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  if (!raw) return false;
  try {
    const url = new URL(String(raw), window.location.origin);
    return /\/cms\/items\.json$/.test(url.pathname);
  } catch {
    return /(^|\/)cms\/items\.json(?:$|[?#])/.test(String(raw));
  }
}

function versionedCmsUrl(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  const url = new URL(String(raw), window.location.origin);
  url.searchParams.set('v', CMS_DATA_VERSION);
  return url.pathname + url.search + url.hash;
}

function n(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stat(item, key) {
  return n(item?.[key] ?? item?.stats?.[key] ?? item?.info?.[key]);
}

function hasAbsStatAtLeast(item, keys, threshold) {
  return keys.some((key) => Math.abs(stat(item, key)) >= threshold);
}

function isSuspiciousCmsEquipment(item) {
  if (!item || String(item.category ?? '').toLowerCase() !== 'equipment') return false;
  const nameText = `${item.name ?? ''} ${item.title ?? ''} ${item.description ?? ''}`;
  if (BANNED_CMS_ITEM_NAME.test(nameText)) return true;
  if (n(item.cash ?? item.stats?.cash) === 1) return true;

  // These CMS WZ files include GM/test/event equipment. They are valid WZ rows,
  // but not valid leveling recommendations. Keep normal high-level equipment; only
  // remove clearly impossible outliers for a 1st/2nd job guidebook.
  if (hasAbsStatAtLeast(item, HIGH_STAT_KEYS, 100)) return true;
  if (hasAbsStatAtLeast(item, HIGH_COMBAT_KEYS, 140)) return true;
  if (hasAbsStatAtLeast(item, HIGH_DEFENSE_KEYS, 180)) return true;
  if (Math.abs(stat(item, 'incSpeed')) > 25) return true;
  if (Math.abs(stat(item, 'incJump')) > 35) return true;

  const reqLevel = n(item.reqLevel ?? item.stats?.reqLevel);
  const totalMainStats = HIGH_STAT_KEYS.reduce((sum, key) => sum + Math.max(0, stat(item, key)), 0);
  if (reqLevel <= 10 && totalMainStats >= 30) return true;
  return false;
}

function sanitizeCmsItemsPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if (!Array.isArray(payload.items)) return payload;
  const before = payload.items.length;
  const items = payload.items.filter((item) => !isSuspiciousCmsEquipment(item));
  const removed = before - items.length;
  return {
    ...payload,
    items,
    item_total: items.length,
    beta_filter: {
      ...(payload.beta_filter || {}),
      version: CMS_DATA_VERSION,
      removed_suspicious_equipment: removed,
    },
  };
}

function resetSavedGearOverridesForNewCmsVersion() {
  if (typeof window === 'undefined') return;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.cmsDataVersion === CMS_DATA_VERSION) return;
    delete saved.gearOverrides;
    saved.cmsDataVersion = CMS_DATA_VERSION;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Ignore storage failures.
  }
}

function jsonResponse(payload, response) {
  return new Response(JSON.stringify(payload), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installCmsNoCacheFetchPatch() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  if (window[PATCH_FLAG]) return;
  window[PATCH_FLAG] = true;
  window.__mscwCmsDataVersion = CMS_DATA_VERSION;
  resetSavedGearOverridesForNewCmsVersion();

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    if (!isCmsJsonRequest(input)) return nativeFetch(input, init);

    const nextInput = versionedCmsUrl(input);
    const nextInit = {
      ...init,
      cache: 'no-store',
      headers: {
        ...(init?.headers || {}),
        'Cache-Control': 'no-cache',
      },
    };

    const response = await nativeFetch(nextInput, nextInit);
    if (!isCmsItemsRequest(input)) return response;

    try {
      const payload = await response.clone().json();
      return jsonResponse(sanitizeCmsItemsPayload(payload), response);
    } catch {
      return response;
    }
  };
}

installCmsNoCacheFetchPatch();
