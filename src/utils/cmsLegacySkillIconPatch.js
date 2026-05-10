const FLAG = '__mscwCmsLegacySkillIconPatchInstalled';
const BASE_URL = import.meta.env?.BASE_URL || '/';

const SKILL_ID_BY_NAME = {
  powerstrike: '1001004',
  slashblast: '1001005',
  improvedhprecovery: '1000000',
  improvinghprecovery: '1000000',
  maxhpincrease: '1000001',
  improvingmaxhpincrease: '1000001',
  endure: '1000002',
  ironbody: '1001003',
  swordmastery: '1100000',
  axemastery: '1100001',
  finalattacksword: '1100002',
  finalattackaxe: '1100003',
  swordbooster: '1101004',
  axebooster: '1101005',
  rage: '1101006',
  powerguard: '1101007',
  threaten: '1201006',
  spearmastery: '1300000',
  polearmmastery: '1300001',
  finalattackspear: '1300002',
  finalattackpolearm: '1300003',
  spearbooster: '1301004',
  polearmbooster: '1301005',
  ironwill: '1301006',
  hyperbody: '1301007',

  energybolt: '2001004',
  magicclaw: '2001005',
  improvedmprecovery: '2000000',
  improvingmprecovery: '2000000',
  maxmpincrease: '2000001',
  improvingmaxmpincrease: '2000001',
  magicguard: '2001002',
  magicarmor: '2001003',
  mpeater: '2100000',
  meditation: '2101001',
  teleport: '2101002',
  slow: '2101003',
  firearrow: '2101004',
  poisonbreath: '2101005',
  coldbeam: '2201004',
  thunderbolt: '2201005',
  heal: '2301002',
  invincible: '2301003',
  bless: '2301004',
  holyarrow: '2301005',

  amazonsbless: '3000000',
  amazonsjudgement: '3000000',
  criticalshot: '3000001',
  theeyeofamazon: '3000002',
  eyeofamazon: '3000002',
  focus: '3001003',
  arrowblow: '3001004',
  doubleshot: '3001005',
  bowmastery: '3100000',
  finalattackbow: '3100001',
  bowbooster: '3101002',
  powerknockback: '3101003',
  soularrowbow: '3101004',
  arrowbombbow: '3101005',
  arrowbomb: '3101005',
  crossbowmastery: '3200000',
  finalattackcrossbow: '3200001',
  crossbowbooster: '3201002',
  soularrowcrossbow: '3201004',
  ironarrowcrossbow: '3201005',
  ironarrow: '3201005',

  nimblebody: '4000000',
  keeneyes: '4000001',
  disorder: '4001002',
  darksight: '4001003',
  doublestab: '4001334',
  luckyseven: '4001344',
  clawmastery: '4100000',
  criticalthrow: '4100001',
  clawbooster: '4101003',
  haste: '4101004',
  drain: '4101005',
  daggermastery: '4200000',
  daggerbooster: '4201002',
  steal: '4201004',
  savageblow: '4201005',
};

function asset(path) {
  return `${BASE_URL}${path.replace(/^\/+/, '')}`;
}

function key(value) {
  return String(value || '')
    .replace(/%20/g, ' ')
    .toLowerCase()
    .replace(/&apos;|&#39;/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function pathOf(src) {
  try { return new URL(src, window.location.href).pathname; }
  catch { return String(src || ''); }
}

function fileStem(src) {
  const match = pathOf(src).match(/\/([^/]+?)(?:_iconDisabled|_iconMouseOver|_raw)?\.png$/i);
  if (!match) return '';
  try { return decodeURIComponent(match[1]); }
  catch { return match[1]; }
}

function skillIdFromImg(img) {
  const src = img.currentSrc || img.src || '';
  const numeric = pathOf(src).match(/\/(\d{6,8})(?:_iconDisabled|_iconMouseOver|_raw)?\.png$/i)?.[1];
  if (numeric) return numeric;

  const fromFile = SKILL_ID_BY_NAME[key(fileStem(src))];
  if (fromFile) return fromFile;

  const label = img.closest('[aria-label]')?.getAttribute('aria-label')
    || img.closest('[title]')?.getAttribute('title')
    || img.alt
    || '';
  return SKILL_ID_BY_NAME[key(label)] || '';
}

function shouldPatch(img) {
  const path = pathOf(img.currentSrc || img.src || '');
  if (path.includes('/cms_icons/skills/')) return false;
  return path.includes('/icons/skill/')
    || path.includes('/icons/skills/')
    || path.includes('/images/skills/')
    || path.includes('/cms/images/skills/');
}

function patch(img) {
  if (!(img instanceof HTMLImageElement) || !shouldPatch(img)) return;
  const id = skillIdFromImg(img);
  if (!id) return;
  img.dataset.cmsSkillIconId = id;
  img.src = asset(`cms_icons/skills/${id}.png`);
}

function scan(root = document) {
  if (root instanceof HTMLImageElement) patch(root);
  root.querySelectorAll?.('img').forEach(patch);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window[FLAG]) {
  window[FLAG] = true;
  const run = () => scan(document.body || document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) scan(node);
      }
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLImageElement) patch(mutation.target);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
}
