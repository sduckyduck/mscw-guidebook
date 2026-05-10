const WEAPONS = [
  [/1h\s*sword|one[- ]handed sword|long sword|gladius|cutlass|saber|sabre/i, 1.8, 1.8, 'sword'],
  [/2h\s*sword|two[- ]handed sword|scimitar|katana/i, 2.5, 2.5, 'sword'],
  [/1h\s*axe|one[- ]handed axe|fireman's axe|\baxe\b/i, 2.4, 1.2, 'axe'],
  [/2h\s*axe|two[- ]handed axe/i, 3.0, 2.0, 'axe'],
  [/1h\s*blunt|one[- ]handed blunt|mace|hammer/i, 2.4, 1.2, 'blunt'],
  [/2h\s*blunt|two[- ]handed blunt/i, 3.0, 2.0, 'blunt'],
  [/spear/i, 1.5, 3.5, 'spear'],
  [/pole\s*arm|polearm/i, 3.5, 1.5, 'polearm'],
  [/crossbow/i, 2.5, 2.5, 'crossbow'],
  [/\bbow\b|ryden/i, 2.5, 2.5, 'bow'],
  [/claw|reef claw|garnier/i, 2.5, 2.5, 'claw'],
  [/dagger/i, 1.0, 2.0, 'dagger'],
];

const PHYSICAL = {
  '普通攻击': [() => 1, 'mixed', 1],
  'Base Attack': [() => 1, 'mixed', 1],
  '强力攻击': [(lv) => (60 + lv * 10) / 100, 'mixed', 1],
  'Power Strike': [(lv) => (60 + lv * 10) / 100, 'mixed', 1],
  '群体攻击': [(lv) => (10 + lv * 6) / 100, 'mixed', 1],
  'Slash Blast': [(lv) => (10 + lv * 6) / 100, 'mixed', 1],
  '断魂箭': [(lv) => (60 + lv * 10) / 100, 'mixed', 1],
  'Arrow Blow': [(lv) => (60 + lv * 10) / 100, 'mixed', 1],
  '二连射': [(lv) => (20 + lv * 5) / 100, 'mixed', 2],
  'Double Shot': [(lv) => (20 + lv * 5) / 100, 'mixed', 2],
  '二连击': [(lv) => (60 + lv * 5) / 100, 'stab', 2],
  'Double Stab': [(lv) => (60 + lv * 5) / 100, 'stab', 2],
  '六连击': [(lv) => (50 + lv * 3) / 100, 'stab', 6],
  'Savage Blow': [(lv) => (50 + lv * 3) / 100, 'stab', 6],
  '双飞斩': [(lv) => (100 + lv * 5) / 100, 'lucky-seven', 2, 0.5],
  'Lucky Seven': [(lv) => (100 + lv * 5) / 100, 'lucky-seven', 2, 0.5],
};

const MAGIC = {
  '魔法弹': [(lv) => 10 + lv * 3, 1],
  'Energy Bolt': [(lv) => 10 + lv * 3, 1],
  '魔法双击': [(lv) => 10 + lv, 2],
  'Magic Claw': [(lv) => 10 + lv, 2],
  '火焰箭': [(lv) => 25 + lv * 3.5, 1],
  'Fire Arrow': [(lv) => 25 + lv * 3.5, 1],
  '冰冻术': [(lv) => 20 + lv * (100 / 30), 1],
  'Cold Beam': [(lv) => 20 + lv * (100 / 30), 1],
  '雷电术': [(lv) => 20 + lv * 3, 1],
  'Thunder Bolt': [(lv) => 20 + lv * 3, 1],
  '圣箭术': [(lv) => 10 + lv, 1],
  'Holy Arrow': [(lv) => 10 + lv, 1],
};

const MASTERY = {
  sword: [/sword mastery/i, /精准剑|剑精准/],
  axe: [/axe mastery/i, /精准斧|斧精准/],
  blunt: [/mace mastery|blunt weapon mastery|blunt mastery/i, /精准钝器|钝器精准/],
  spear: [/spear mastery/i, /精准枪|枪精准/],
  polearm: [/pole\s*arm mastery|polearm mastery/i, /精准矛|精准长枪|矛精准/],
  bow: [/bow mastery/i, /精准弓|弓精准/],
  crossbow: [/crossbow mastery/i, /精准弩|弩精准/],
  claw: [/claw mastery|throwing star mastery/i, /精准暗器|暗器精准/],
  dagger: [/dagger mastery/i, /精准短刀|短刀精准/],
};

const num = (v) => {
  const parsed = Number(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};
const norm = (v = '') => String(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function stat(label) {
  const box = [...document.querySelectorAll('.mg-stat-box')].find((node) => node.querySelector('span')?.textContent?.trim() === label);
  return num(box?.querySelector('strong')?.textContent);
}
function klass() {
  const text = document.querySelector('.mg-dashboard-title')?.textContent ?? '';
  if (/战士|warrior/i.test(text)) return 'warrior';
  if (/法师|魔法师|magician/i.test(text)) return 'magician';
  if (/弓箭手|bowman/i.test(text)) return 'bowman';
  if (/飞侠|thief/i.test(text)) return 'thief';
  return '';
}
function weaponName() {
  const tile = [...document.querySelectorAll('.mg-equip-tile')].find((node) => node.querySelector('span')?.textContent?.trim() === '武器');
  return tile?.querySelector('strong')?.textContent?.trim() ?? '';
}
function weaponItem(name) {
  const key = norm(name);
  const byName = window.__mscwGuideItemsByName;
  return byName?.get?.(key) ?? (window.__mscwGuideItems ?? []).find((item) => norm(item?.title ?? item?.name) === key);
}
function weaponProfile(item, fallback = '') {
  const text = `${item?.weaponType ?? item?.weapon_type ?? ''} ${item?.title ?? item?.name ?? ''} ${fallback}`;
  const row = WEAPONS.find(([pattern]) => pattern.test(text));
  return row ? { swing: row[1], stab: row[2], family: row[3] } : { swing: 2, stab: 2, family: '' };
}
function masteryLevel(family) {
  const patterns = MASTERY[family] ?? [];
  if (!patterns.length) return 0;
  let best = 0;
  for (const row of document.querySelectorAll('.mg-skill-row, [class*="skill"]')) {
    const text = row.textContent ?? '';
    if (patterns.some((pattern) => pattern.test(text))) {
      best = Math.max(best, num(text.match(/Lv\.\s*(\d+)\s*\//i)?.[1]) || num(text.match(/\b(\d+)\s*\//)?.[1]));
    }
  }
  return best;
}
function masteryRatio(family, forced) {
  if (forced !== undefined) return forced;
  const lv = Math.min(10, Math.max(0, masteryLevel(family)));
  return lv ? (0.1 + lv / 10) * 0.8 : 0.08;
}
function skillLevel(row) {
  return num(row?.textContent?.match(/Lv\.\s*(\d+)/i)?.[1]) || 1;
}
function primarySecondary(id) {
  if (id === 'bowman') return { primary: stat('DEX'), secondary: stat('STR') };
  if (id === 'thief') return { primary: stat('LUK'), secondary: stat('DEX') };
  return { primary: stat('STR'), secondary: stat('DEX') };
}
function physMult(profile, mode) {
  if (mode === 'stab') return profile.stab;
  if (mode === 'lucky-seven') return 3;
  return profile.swing * 0.6 + profile.stab * 0.4;
}
function physicalRange(skill, lv, id, watk, profile) {
  const { primary, secondary } = primarySecondary(id);
  if (!primary || !watk) return null;
  const [ratioFn, mode, hits, forcedMastery] = skill;
  const ratio = Math.max(0.01, ratioFn(lv));
  const mastery = masteryRatio(profile.family, forcedMastery);
  const mult = physMult(profile, mode);
  const min = (0.8 + (primary * mult * mastery + secondary) / 100) * watk * ratio;
  const max = (1 + (primary * mult + secondary) / 100) * watk * ratio;
  return { min: Math.max(1, Math.round(Math.min(min, max))), max: Math.max(1, Math.round(Math.max(min, max))), hits };
}
function magicAttack() {
  const item = weaponItem(weaponName());
  return Math.max(1, Math.floor(stat('INT') / 2) + num(item?.incMAD ?? item?.stats?.incMAD));
}
function magicRange(skill, lv, magic) {
  const [basicFn, hits] = skill;
  const basic = Math.max(1, basicFn(lv));
  const mastery = (0.1 + Math.min(10, Math.max(0, lv)) / 10) * 0.8;
  const min = (basic + magic / 7) * ((magic * 2 * mastery + magic) / 100 + 1);
  const max = (basic + magic / 7) * ((magic * 2 + magic) / 100 + 1);
  return { min: Math.max(1, Math.round(Math.min(min, max))), max: Math.max(1, Math.round(Math.max(min, max))), hits };
}
function format(range) {
  return range.hits > 1 ? `${range.min} - ${range.max}/hit` : `${range.min} - ${range.max}`;
}
function patchMatk() {
  if (klass() !== 'magician') return;
  const totalInt = stat('INT');
  const item = weaponItem(weaponName());
  const gearMagic = num(item?.incMAD ?? item?.stats?.incMAD);
  const magic = Math.max(1, Math.floor(totalInt / 2) + gearMagic);
  document.querySelectorAll('.mg-stat-box').forEach((box) => {
    if (box.querySelector('span')?.textContent?.trim() !== 'MATK') return;
    const value = box.querySelector('strong');
    const breakdown = box.querySelector('.mg-stat-breakdown');
    if (value) value.textContent = String(magic);
    if (breakdown) breakdown.textContent = `(${Math.floor(totalInt / 2)}+${gearMagic})`;
  });
}
function patchRows() {
  const id = klass();
  if (!id) return;
  patchMatk();
  const itemName = weaponName();
  const item = weaponItem(itemName);
  const watk = stat('WATK') || num(item?.incPAD ?? item?.stats?.incPAD);
  const matk = id === 'magician' ? magicAttack() : stat('MATK');
  const profile = weaponProfile(item, itemName);
  document.querySelectorAll('.mg-overview-damage-row').forEach((row) => {
    const name = row.querySelector('strong')?.textContent?.trim();
    const value = row.querySelector('em');
    if (!name || !value) return;
    const range = id === 'magician' ? (MAGIC[name] && magicRange(MAGIC[name], skillLevel(row), matk)) : (PHYSICAL[name] && physicalRange(PHYSICAL[name], skillLevel(row), id, watk, profile));
    if (!range) return;
    value.textContent = format(range);
    value.dataset.classicFormulaPatched = '1';
    value.dataset.weaponFamily = profile.family;
  });
}
function installBaseAttackFormulaPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBaseAttackFormulaPatchInstalled) return;
  window.__mscwBaseAttackFormulaPatchInstalled = true;
  const run = () => window.requestAnimationFrame(patchRows);
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
}
installBaseAttackFormulaPatch();
