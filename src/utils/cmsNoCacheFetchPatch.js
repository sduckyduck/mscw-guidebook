const PATCH_FLAG = '__mscwCmsNoCacheFetchPatchInstalled';
const CMS_DATA_VERSION = 'cms-equipment-stats-20260509-v2';

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

function versionedCmsUrl(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  const url = new URL(String(raw), window.location.origin);
  url.searchParams.set('v', CMS_DATA_VERSION);
  return url.pathname + url.search + url.hash;
}

function installCmsNoCacheFetchPatch() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  if (window[PATCH_FLAG]) return;
  window[PATCH_FLAG] = true;
  window.__mscwCmsDataVersion = CMS_DATA_VERSION;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
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
    return nativeFetch(nextInput, nextInit);
  };
}

installCmsNoCacheFetchPatch();
