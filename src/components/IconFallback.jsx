import { useEffect, useMemo, useState } from 'react';

const IMAGE_EXTENSIONS = ['png', 'webp', 'gif', 'jpg', 'jpeg'];
const REPO_ICON_API = 'https://api.github.com/repos/sduckyduck/mscw-guidebook/contents/public/icons?ref=main';
const IMAGE_RE = /\.(png|webp|gif|jpe?g)$/i;

const SKILL_ICON_PATHS = {
  'three snails': ['icons/skill/Beginner/Beginner/0001000_Three_Snails.png'],
  recovery: ['icons/skill/Beginner/Beginner/0001001_Recovery.png'],
  'nimble feet': ['icons/skill/Beginner/Beginner/0001002_Nimble_Feet.png'],

  'improved hp recovery': ['icons/skill/1st_Job/Warrior/1000000_Improved_HP_Recovery.png'],
  'max hp increase': ['icons/skill/1st_Job/Warrior/1000001_Max_HP_Increase.png'],
  'improved max hp increase': ['icons/skill/1st_Job/Warrior/1000001_Max_HP_Increase.png'],
  'precise strikes': ['icons/skill/1st_Job/Warrior/1000002_Precise_Strikes.png'],
  'iron body': ['icons/skill/1st_Job/Warrior/1001000_Iron_Body.png'],
  'power strike': ['icons/skill/1st_Job/Warrior/1001001_Power_Strike.png'],
  'slash blast': ['icons/skill/1st_Job/Warrior/1001002_Slash_Blast.png'],

  'improved mp recovery': ['icons/skill/1st_Job/Magician/2000000_Improved_MP_Recovery.png'],
  'max mp increase': ['icons/skill/1st_Job/Magician/2000001_Max_MP_Increase.png'],
  'magic guard': ['icons/skill/1st_Job/Magician/2001000_Magic_Guard.png'],
  'magic armor': ['icons/skill/1st_Job/Magician/2001001_Magic_Armor.png'],
  'energy bolt': ['icons/skill/1st_Job/Magician/2001002_Energy_Bolt.png'],
  'magic claw': ['icons/skill/1st_Job/Magician/2001003_Magic_Claw.png'],

  'critical shot': ['icons/skill/1st_Job/Archer/3000000_Critical_Shot.png'],
  'amazons judgement': ['icons/skill/1st_Job/Archer/3000001_Amazon\'s_Judgement.png'],
  "amazon's judgement": ['icons/skill/1st_Job/Archer/3000001_Amazon\'s_Judgement.png'],
  'the eye of amazon': ['icons/skill/1st_Job/Archer/3000002_The_Eye_of_Amazon.png'],
  focus: ['icons/skill/1st_Job/Archer/3001000_Focus.png'],
  'arrow blow': ['icons/skill/1st_Job/Archer/3001001_Arrow_Blow.png'],
  'double shot': ['icons/skill/1st_Job/Archer/3001002_Double_Shot.png'],

  'nimble body': ['icons/skill/1st_Job/Theif/4000000_Nimble_Body.png'],
  'keen eyes': ['icons/skill/1st_Job/Theif/4000001_Keen_Eyes.png'],
  disorder: ['icons/skill/1st_Job/Theif/4001000_Disorder.png'],
  'dark sight': ['icons/skill/1st_Job/Theif/4001001_Dark_Sight.png'],
  'double stab': ['icons/skill/1st_Job/Theif/4001002_Double_Stab.png'],
  'lucky seven': ['icons/skill/1st_Job/Theif/4001003_Lucky_Seven.png'],

  'sword mastery': ['icons/skill/2nd_Job/Fighter/1100000_Sword_Mastery.png', 'icons/skill/2nd_Job/Page/1200000_Sword_Mastery.png'],
  'axe mastery': ['icons/skill/2nd_Job/Fighter/1100001_Axe_Mastery.png'],
  'final attack sword': ['icons/skill/2nd_Job/Fighter/1101000_Final_Attack_Sword.png', 'icons/skill/2nd_Job/Page/1201000_Final_Attack_Sword.png'],
  'final attack axe': ['icons/skill/2nd_Job/Fighter/1101001_Final_Attack_Axe.png'],
  'sword booster': ['icons/skill/2nd_Job/Fighter/1101002_Sword_Booster.png', 'icons/skill/2nd_Job/Page/1201002_Sword_Booster.png'],
  'axe booster': ['icons/skill/2nd_Job/Fighter/1101003_Axe_Booster.png'],
  rage: ['icons/skill/2nd_Job/Fighter/1101004_Rage.png'],
  'power guard': ['icons/skill/2nd_Job/Fighter/1101005_Power_Guard.png', 'icons/skill/2nd_Job/Page/1201005_Power_Guard.png'],
  'blunt weapon mastery': ['icons/skill/2nd_Job/Page/1200001_Blunt_Weapon_Mastery.png'],
  'final attack blunt weapon': ['icons/skill/2nd_Job/Page/1201001_Final_Attack_Blunt_Weapon.png'],
  'blunt weapon booster': ['icons/skill/2nd_Job/Page/1201003_Blunt_Weapon_Booster.png'],
  threaten: ['icons/skill/2nd_Job/Page/1201004_Threaten.png'],
  'spear mastery': ['icons/skill/2nd_Job/Spearman/1300000_Spear_Mastery.png'],
  'polearm mastery': ['icons/skill/2nd_Job/Spearman/1300001_Polearm_Mastery.png'],
  'pole arm mastery': ['icons/skill/2nd_Job/Spearman/1300001_Polearm_Mastery.png'],
  'final attack spear': ['icons/skill/2nd_Job/Spearman/1301000_Final_Attack_Spear.png'],
  'final attack polearm': ['icons/skill/2nd_Job/Spearman/1301001_Final_Attack_Polearm.png'],
  'final attack pole arm': ['icons/skill/2nd_Job/Spearman/1301001_Final_Attack_Polearm.png'],
  'spear booster': ['icons/skill/2nd_Job/Spearman/1301002_Spear_Booster.png'],
  'polearm booster': ['icons/skill/2nd_Job/Spearman/1301003_Polearm_Booster.png'],
  'pole arm booster': ['icons/skill/2nd_Job/Spearman/1301003_Polearm_Booster.png'],
  'iron will': ['icons/skill/2nd_Job/Spearman/1301004_Iron_Will.png'],
  'hyper body': ['icons/skill/2nd_Job/Spearman/1301005_Hyper_Body.png'],

  'mp eater': ['icons/skill/2nd_Job/FP_Wizard/2100000_MP_Eater.png', 'icons/skill/2nd_Job/IL_Wizard/2200000_MP_Eater.png', 'icons/skill/2nd_Job/Cleric/2300000_MP_Eater.png'],
  meditation: ['icons/skill/2nd_Job/FP_Wizard/2101000_Meditation.png', 'icons/skill/2nd_Job/IL_Wizard/2201000_Meditation.png'],
  teleport: ['icons/skill/2nd_Job/FP_Wizard/2101001_Teleport.png', 'icons/skill/2nd_Job/IL_Wizard/2201001_Teleport.png', 'icons/skill/2nd_Job/Cleric/2301000_Teleport.png'],
  slow: ['icons/skill/2nd_Job/FP_Wizard/2101002_Slow.png', 'icons/skill/2nd_Job/IL_Wizard/2201002_Slow.png'],
  'fire arrow': ['icons/skill/2nd_Job/FP_Wizard/2101003_Fire_Arrow.png'],
  'poison breath': ['icons/skill/2nd_Job/FP_Wizard/2101004_Poison_Breath.png'],
  'cold beam': ['icons/skill/2nd_Job/IL_Wizard/2201003_Cold_Beam.png'],
  'thunder bolt': ['icons/skill/2nd_Job/IL_Wizard/2201004_Thunder_Bolt.png'],
  heal: ['icons/skill/2nd_Job/Cleric/2301001_Heal.png'],
  invincible: ['icons/skill/2nd_Job/Cleric/2301002_Invincible.png'],
  bless: ['icons/skill/2nd_Job/Cleric/2301003_Bless.png'],
  'holy arrow': ['icons/skill/2nd_Job/Cleric/2301004_Holy_Arrow.png'],

  'bow mastery': ['icons/skill/2nd_Job/Hunter/3100000_Bow_Mastery.png'],
  'final attack bow': ['icons/skill/2nd_Job/Hunter/3101000_Final_Attack_Bow.png'],
  'bow booster': ['icons/skill/2nd_Job/Hunter/3101001_Bow_Booster.png'],
  'power knockback': ['icons/skill/2nd_Job/Hunter/3101002_Power_Knockback.png', 'icons/skill/2nd_Job/Crossbowman/3201002_Power_Knockback.png'],
  'soul arrow bow': ['icons/skill/2nd_Job/Hunter/3101003_Soul_Arrow_Bow.png'],
  'arrow bomb bow': ['icons/skill/2nd_Job/Hunter/3101004_Arrow_Bomb_Bow.png'],
  'crossbow mastery': ['icons/skill/2nd_Job/Crossbowman/3200000_Crossbow_Mastery.png'],
  'final attack crossbow': ['icons/skill/2nd_Job/Crossbowman/3201000_Final_Attack_Crossbow.png'],
  'crossbow booster': ['icons/skill/2nd_Job/Crossbowman/3201001_Crossbow_Booster.png'],
  'soul arrow crossbow': ['icons/skill/2nd_Job/Crossbowman/3201003_Soul_Arrow_Crossbow.png'],
  'iron arrow crossbow': ['icons/skill/2nd_Job/Crossbowman/3201004_Iron_Arrow_Crossbow.png'],

  'claw mastery': ['icons/skill/2nd_Job/Assassin/4100000_Claw_Mastery.png'],
  'critical throw': ['icons/skill/2nd_Job/Assassin/4100001_Critical_Throw.png'],
  'critical recovery': ['icons/skill/2nd_Job/Assassin/4100002_Critical_Recovery.png'],
  'claw booster': ['icons/skill/2nd_Job/Assassin/4101000_Claw_Booster.png'],
  haste: ['icons/skill/2nd_Job/Assassin/4101001_Haste.png', 'icons/skill/2nd_Job/Bandit/4201001_Haste.png'],
  drain: ['icons/skill/2nd_Job/Assassin/4101002_Drain.png'],
  'dagger mastery': ['icons/skill/2nd_Job/Bandit/4200000_Dagger_Mastery.png'],
  'nimble recovery': ['icons/skill/2nd_Job/Bandit/4200001_Nimble_Recovery.png'],
  'dagger booster': ['icons/skill/2nd_Job/Bandit/4201000_Dagger_Booster.png'],
  steal: ['icons/skill/2nd_Job/Bandit/4201002_Steal.png'],
  'savage blow': ['icons/skill/2nd_Job/Bandit/4201003_Savage_Blow.png'],
};

let iconFilesPromise = null;
let iconFilesCache = null;
let debugInstalled = false;

export function baseUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function slugifyIconName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\bjr\.?\b/g, 'jr')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeSkillName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[:()]/g, ' ')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripExt(value) {
  return String(value || '').replace(/\.(png|webp|gif|jpe?g)$/i, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function localSkillIconSources(name) {
  const clean = normalizeSkillName(name);
  const withoutSuffix = clean
    .replace(/ bow$/i, '')
    .replace(/ crossbow$/i, '')
    .replace(/ sword$/i, '')
    .replace(/ axe$/i, '')
    .replace(/ spear$/i, '')
    .replace(/ pole arm$/i, '')
    .replace(/ polearm$/i, '');
  const paths = [
    ...(SKILL_ICON_PATHS[clean] ?? []),
    ...(SKILL_ICON_PATHS[withoutSuffix] ?? []),
  ];
  return unique(paths.map((path) => `${baseUrl()}${path.replace(/^\/+/, '')}`));
}

function normalizeKey(value) {
  return slugifyIconName(value).replace(/-/g, '');
}

export function iconSourcesFromNames(names, folders = ['icons'], extensions = IMAGE_EXTENSIONS) {
  const root = `${baseUrl()}icons`;
  const output = [];
  for (const rawName of names.filter(Boolean)) {
    output.push(...localSkillIconSources(rawName));
    const clean = stripExt(String(rawName).replace(/^\/+/, ''));
    const slug = slugifyIconName(clean);
    const variants = unique([clean, slug, slug.replace(/-/g, '_'), slug.replace(/-/g, '')]);
    for (const folder of folders) {
      const folderPath = folder.replace(/^\/+|\/+$/g, '');
      for (const variant of variants) {
        for (const ext of extensions) output.push(`${baseUrl()}${folderPath}/${variant}.${ext}`);
      }
    }
    for (const variant of variants) {
      for (const ext of extensions) output.push(`${root}/${variant}.${ext}`);
    }
  }
  return unique(output);
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function sameOriginPublicIconUrl(entry) {
  const path = String(entry?.path || '').replace(/^public\//, '');
  return path ? `${baseUrl()}${path}` : entry?.download_url;
}

async function walkGithubContents(url, depth = 0) {
  if (depth > 5) return [];
  const entries = await fetchJson(url);
  if (!Array.isArray(entries)) return [];
  const files = [];
  for (const entry of entries) {
    if (entry.type === 'file' && IMAGE_RE.test(entry.name)) {
      files.push({ name: entry.name, path: entry.path, url: sameOriginPublicIconUrl(entry), folder: entry.path.split('/').slice(0, -1).join('/') });
    }
    if (entry.type === 'dir' && entry.url) {
      const nested = await walkGithubContents(entry.url, depth + 1).catch(() => []);
      files.push(...nested);
    }
  }
  return files;
}

export async function getIconFiles({ force = false } = {}) {
  if (iconFilesCache && !force) return iconFilesCache;
  if (!iconFilesPromise || force) {
    iconFilesPromise = walkGithubContents(REPO_ICON_API).then((files) => {
      iconFilesCache = files;
      return files;
    });
  }
  return iconFilesPromise;
}

function cleanFolder(value) {
  return String(value || '').toLowerCase().replace(/^public\//, '').replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
}

function folderMatches(file, folders) {
  if (!folders?.length) return true;
  const normalizedFileFolder = cleanFolder(file.folder);
  return folders.some((folder) => {
    const clean = cleanFolder(folder);
    if (!clean) return false;
    return clean === 'icons'
      || normalizedFileFolder === clean
      || normalizedFileFolder.startsWith(`${clean}/`)
      || normalizedFileFolder.endsWith(`/${clean}`)
      || normalizedFileFolder.includes(`/${clean}/`);
  });
}

function scoreFile(file, names, folders) {
  if (!folderMatches(file, folders)) return -1;
  const fileBase = normalizeKey(stripExt(file.name));
  const filePath = normalizeKey(stripExt(file.path));
  const queryKeys = unique(names.map((name) => normalizeKey(name)).filter(Boolean));
  if (!queryKeys.length) return -1;
  let score = -1;
  for (const key of queryKeys) {
    if (!key) continue;
    if (fileBase === key) score = Math.max(score, 100);
    else if (filePath.endsWith(key)) score = Math.max(score, 92);
    else if (fileBase.includes(key) || key.includes(fileBase)) score = Math.max(score, 76);
    else if (filePath.includes(key)) score = Math.max(score, 58);
  }
  const folderBonus = folders?.some((folder) => cleanFolder(file.folder).startsWith(cleanFolder(folder))) ? 8 : 0;
  return score < 0 ? score : score + folderBonus;
}

export async function discoverIconSources(names, folders = ['icons'], { limit = 8, force = false } = {}) {
  const files = await getIconFiles({ force });
  return files
    .map((file) => ({ file, score: scoreFile(file, names, folders) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, limit)
    .map((item) => item.file.url);
}

export function installIconDebugger() {
  if (typeof window === 'undefined' || debugInstalled) return;
  debugInstalled = true;
  window.MSCWIcons = {
    list: async (force = false) => {
      const files = await getIconFiles({ force });
      console.table(files.map((file) => ({ name: file.name, path: file.path, url: file.url })));
      return files;
    },
    find: async (query, folders = ['icons']) => {
      const names = Array.isArray(query) ? query : [query];
      const files = await getIconFiles();
      const result = files
        .map((file) => ({ ...file, score: scoreFile(file, names, folders) }))
        .filter((file) => file.score >= 0)
        .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
      console.table(result.map((file) => ({ score: file.score, name: file.name, path: file.path, url: file.url })));
      return result;
    },
    test: async (query, folders = ['icons']) => {
      const names = Array.isArray(query) ? query : [query];
      const guessed = iconSourcesFromNames(names, folders);
      const discovered = await discoverIconSources(names, folders, { limit: 20 });
      const all = unique([...guessed, ...discovered]);
      const checks = await Promise.all(all.map(async (url) => {
        try {
          const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
          return { ok: res.ok, status: res.status, url };
        } catch {
          return { ok: false, status: 'ERR', url };
        }
      }));
      console.table(checks);
      return checks;
    },
    clearCache: () => {
      iconFilesCache = null;
      iconFilesPromise = null;
      console.log('MSCW icon cache cleared');
    },
  };
}

installIconDebugger();

export default function IconFallback({
  sources = [],
  names = [],
  folders = ['icons'],
  alt = '',
  className = '',
  style,
  fallback = null,
  onLoad,
  debugLabel = '',
}) {
  const staticList = useMemo(() => unique(sources.filter((src) => !String(src).includes('maplestory.io') && !String(src).includes('fandom.com') && !String(src).includes('strategywiki.org') && !String(src).includes('maplewiki.net'))), [sources.join('|')]);
  const nameList = useMemo(() => unique(names), [names.join('|')]);
  const folderList = useMemo(() => unique(folders), [folders.join('|')]);
  const [discovered, setDiscovered] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let stopped = false;
    if (!nameList.length) {
      setDiscovered([]);
      return () => { stopped = true; };
    }
    discoverIconSources(nameList, folderList).then((found) => {
      if (!stopped) setDiscovered(found);
    }).catch(() => {
      if (!stopped) setDiscovered([]);
    });
    return () => { stopped = true; };
  }, [nameList.join('|'), folderList.join('|')]);

  const nameGeneratedList = useMemo(() => iconSourcesFromNames(nameList, folderList), [nameList.join('|'), folderList.join('|')]);
  const list = useMemo(() => unique([...nameGeneratedList, ...staticList, ...discovered]), [staticList.join('|'), nameGeneratedList.join('|'), discovered.join('|')]);

  useEffect(() => setIndex(0), [list.join('|')]);

  if (!list[index]) {
    if (debugLabel && typeof window !== 'undefined') {
      window.__MSCW_LAST_MISSING_ICON__ = { debugLabel, names: nameList, folders: folderList, tried: list };
    }
    return fallback;
  }

  return (
    <img
      className={className}
      src={list[index]}
      alt={alt}
      draggable="false"
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={() => setIndex((value) => value + 1)}
      style={style}
    />
  );
}
