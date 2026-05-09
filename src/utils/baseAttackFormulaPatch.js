const WEAPON_PROFILES = [
  { match: /\b1h\s*sword\b|\bone handed sword\b|\bone-handed sword\b|long sword|gladius|cutlass|saber|sabre/i, swing: 1.8, stab: 1.8 },
  { match: /\b2h\s*sword\b|\btwo handed sword\b|\btwo-handed sword\b|scimitar|katana/i, swing: 2.5, stab: 2.5 },
  { match: /\b1h\s*axe\b|\bone handed axe\b|\bone-handed axe\b|fireman's axe|axe/i, swing: 2.4, stab: 1.2 },
  { match: /\b2h\s*axe\b|\btwo handed axe\b|\btwo-handed axe\b/i, swing: 3.0, stab: 2.0 },
  { match: /\b1h\s*blunt\b|\bone handed blunt\b|\bone-handed blunt\b|mace|hammer/i, swing: 2.4, stab: 1.2 },
  { match: /\b2h\s*blunt\b|\btwo handed blunt\b|\btwo-handed blunt\b/i, swing: 3.0, stab: 2.0 },
  { match: /\bspear\b/i, swing: 1.5, stab: 3.5 },
  { match: /\bpole\s*arm\b|\bpolearm\b/i, swing: 3.5, stab: 1.5 },
  { match: /\bcrossbow\b/i, swing: 2.5, stab: 2.5 },
  { match: /\bbow\b|ryden/i, swing: 2.5, stab: 2.5 },
  { match: /\bclaw\b|reef claw|garnier/i, swing: 2.5, stab: 2.5 },
  { match: /\bdagger\b/i, swing: 1.0, stab: 2.0 },
];

const PHYSICAL_SKILLS = {
  '普通攻击': { ratio: () => 1, mode: 'mixed', hits: 1 },
  'Base Attack': { ratio: () => 1, mode: 'mixed', hits: 1 },
  '强力攻击': { ratio: (level) => (60 + level * 10) / 100, mode: 'mixed', hits: 1 },
  'Power Strike': { ratio: (level) => (60 + level * 10) / 100, mode: 'mixed', hits: 1 },
  '群体攻击': { ratio: (level) => (10 + level * 6) / 100, mode: 'mixed', hits: 1 },
  'Slash Blast': { ratio: (level) => (10 + level * 6) / 100, mode: 'mixed', hits: 1 },
  '断魂箭': { ratio: (level) => (60 + level * 10) / 100, mode: 'mixed', hits: 1 },
  'Arrow Blow': { ratio: (level) => (60 + level * 10) / 100, mode: 'mixed', hits: 1 },
  '二连射': { ratio: (level) => (20 + level * 5) / 100, mode: 'mixed', hits: 2 },
  'Double Shot': { ratio: (level) => (20 + level * 5) / 100, mode: 'mixed', hits: 2 },
  '二连击': { ratio: (level) => (60 + level * 5) / 100, mode: 'stab', hits: 2 },
  'Double Stab': { ratio: (level) => (60 + level * 5) / 100, mode: 'stab', hits: 2 },
  '双飞斩': { ratio: (level) => (100 + level * 5) / 100, mode: 'lucky-seven', hits: 2, mastery: 0.5 },
  'Lucky Seven': { ratio: (level) => (100 + level * 5) / 100, mode: 'lucky-seven', hits: 2, mastery: 0.5 },
  '六连击': { ratio: (level) => (50 + level * 3) / 100, mode: 'stab', hits: 6 },
  'Savage Blow': { ratio: (level) => (50 + level * 3) / 100, mode: 'stab', hits: 6 },
};

const MAGIC_SKILLS = {
  '魔法弹': { basic: (level) => 10 + level * 3, hits: 1 },
  'Energy Bolt': { basic: (level) => 10 + level * 3, hits: 1 },
  '魔法双击': { basic: (level) => 10 + level, hits: 2 },
  'Magic Claw': { basic: (level) => 10 + level, hits: 2 },
  '火焰箭': { basic: (level) => 25 + level * 3.5, hits: 1 },
  'Fire Arrow': { basic: (level) => 25 + level * 3.5, hits: 1 },
  '冰冻术': { basic: (level) => 20 + level * (100 / 30), hits: 1 },
  'Cold Beam': { basic: (level) => 20 + level * (100 / 30), hits: 1 },
  '雷电术': { basic: (level) => 20 + level * 3, hits: 1 },
  'Thunder Bolt': { basic: (level) => 20 + level * 3, hits: 1 },
  '圣箭术': { basic: (level) => 10 + level, hits: 1 },
  'Holy Arrow': { basic: (level) => 10 + level, hits: 1 },
};

function number(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function statValue(label) {
  const box = [...document.querySelectorAll('.mg-stat-box')]
    .find((node) => node.querySelector('span')?.textContent?.trim() === label);
  return number(box?.querySelector('strong')?.textContent);
}

function classId() {
  const text = document.querySelector('.mg-dashboard-title')?.textContent ?? '';
  if (/战士|warrior/i.test(text)) return 'warrior';
  if (/法师|魔法师|magician/i.test(text)) return 'magician';
  if (/弓箭手|bowman/i.test(text)) return 'bowman';
  if (/飞侠|thief/i.test(text)) return 'thief';
  return '';
}

function weaponTileName() {
  const tile = [...document.querySelectorAll('.mg-equip-tile')]
    .find((node) => node.querySelector('span')?.textContent?.trim() === '武器');
  return tile?.querySelector('strong')?.textContent?.trim() ?? '';
}

function findWeapon(name) {
  const key = normalize(name);
  const byName = window.__mscwGuideItemsByName;
  if (byName?.get?.(key)) return byName.get(key);
  return (window.__mscwGuideItems ?? []).find((item) => normalize(item?.title ?? item?.name) === key);
}

function getWeaponProfile(weapon, fallbackName = '') {
  const text = `${weapon?.weaponType ?? weapon?.weapon_type ?? ''} ${weapon?.title ?? weapon?.name ?? ''} ${fallbackName}`;
  return WEAPON_PROFILES.find((item) => item.match.test(text)) ?? { swing: 2.0, stab: 2.0 };
}

function physicalMultiplier(profile, mode) {
  if (mode === 'stab') return profile.stab;
  if (mode === 'lucky-seven') return 3.0;
  return profile.swing * 0.6 + profile.stab * 0.4;
}

function primarySecondary(id) {
  if (id === 'bowman') return { primary: statValue('DEX'), secondary: statValue('STR') };
  if (id === 'thief') return { primary: statValue('LUK'), secondary: statValue('DEX') };
  return { primary: statValue('STR'), secondary: statValue('DEX') };
}

function parseSkillLevel(row) {
  const text = row?.textContent ?? '';
  return number(text.match(/Lv\.\s*(\d+)/i)?.[1]) || 1;
}

function calcPhysicalRange({ skill, level, id, watk, profile }) {
  const { primary, secondary } = primarySecondary(id);
  if (!primary || !watk) return null;
  const ratio = Math.max(0.01, skill.ratio(level));
  const mastery = skill.mastery ?? 0.08;
  const mult = physicalMultiplier(profile, skill.mode);
  const min = (0.8 + (primary * mult * mastery + secondary) / 100) * watk * ratio;
  const max = (1.0 + (primary * mult + secondary) / 100) * watk * ratio;
  return { min: Math.max(1, Math.round(Math.min(min, max))), max: Math.max(1, Math.round(Math.max(min, max))), hits: skill.hits ?? 1 };
}

function magicMastery(level) {
  const masteryLevel = Math.min(10, Math.max(0, number(level)));
  return (0.1 + masteryLevel / 10) * 0.8;
}

function calcMagicRange({ skill, level, magic }) {
  if (!magic) return null;
  const basicAttack = Math.max(1, skill.basic(level));
  const mastery = magicMastery(level);
  const min = (basicAttack + magic / 7) * ((magic * 2 * mastery + magic) / 100 + 1);
  const max = (basicAttack + magic / 7) * ((magic * 2 + magic) / 100 + 1);
  return { min: Math.max(1, Math.round(Math.min(min, max))), max: Math.max(1, Math.round(Math.max(min, max))), hits: skill.hits ?? 1 };
}

function formatRange(range) {
  if (!range) return '';
  return range.hits > 1 ? `${range.min} - ${range.max}/hit` : `${range.min} - ${range.max}`;
}

function patchDamageRows() {
  const id = classId();
  if (!id) return;

  const weaponName = weaponTileName();
  const weapon = findWeapon(weaponName);
  const watk = statValue('WATK') || number(weapon?.incPAD ?? weapon?.stats?.incPAD);
  const magic = statValue('MATK') || statValue('Magic') || number(weapon?.incMAD ?? weapon?.stats?.incMAD);
  const profile = getWeaponProfile(weapon, weaponName);

  document.querySelectorAll('.mg-overview-damage-row').forEach((row) => {
    const name = row.querySelector('strong')?.textContent?.trim();
    const value = row.querySelector('em');
    if (!name || !value) return;

    const level = parseSkillLevel(row);
    let range = null;

    if (id === 'magician') {
      const magicSkill = MAGIC_SKILLS[name];
      if (magicSkill) range = calcMagicRange({ skill: magicSkill, level, magic });
    } else {
      const physicalSkill = PHYSICAL_SKILLS[name];
      if (physicalSkill) range = calcPhysicalRange({ skill: physicalSkill, level, id, watk, profile });
    }

    if (!range) return;
    const next = formatRange(range);
    if (value.textContent !== next) {
      value.textContent = next;
      value.dataset.classicFormulaPatched = '1';
    }
  });
}

function installBaseAttackFormulaPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBaseAttackFormulaPatchInstalled) return;
  window.__mscwBaseAttackFormulaPatchInstalled = true;

  const run = () => window.requestAnimationFrame(patchDamageRows);
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
}

installBaseAttackFormulaPatch();
