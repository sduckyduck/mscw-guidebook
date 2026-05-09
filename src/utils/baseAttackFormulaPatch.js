const WEAPON_MULTIPLIERS = [
  { match: /\b1h\s*sword\b|\bone handed sword\b|\bone-handed sword\b/i, mult: 1.8 },
  { match: /\b2h\s*sword\b|\btwo handed sword\b|\btwo-handed sword\b/i, mult: 2.5 },
  { match: /\b1h\s*axe\b|\bone handed axe\b|\bone-handed axe\b/i, mult: 2.4 },
  { match: /\b2h\s*axe\b|\btwo handed axe\b|\btwo-handed axe\b/i, mult: 3.0 },
  { match: /\b1h\s*blunt\b|\bone handed blunt\b|\bone-handed blunt\b/i, mult: 2.4 },
  { match: /\b2h\s*blunt\b|\btwo handed blunt\b|\btwo-handed blunt\b/i, mult: 3.0 },
  { match: /\bspear\b/i, mult: 3.5 },
  { match: /\bpole\s*arm\b|\bpolearm\b/i, mult: 3.5 },
  { match: /\bcrossbow\b/i, mult: 2.5 },
  { match: /\bbow\b/i, mult: 2.5 },
  { match: /\bclaw\b/i, mult: 2.5 },
  { match: /\bdagger\b/i, mult: 1.4 },
];

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

function weaponMult(weapon) {
  const text = `${weapon?.weaponType ?? weapon?.weapon_type ?? ''} ${weapon?.title ?? weapon?.name ?? ''}`;
  return WEAPON_MULTIPLIERS.find((item) => item.match.test(text))?.mult ?? 2.0;
}

function primarySecondary(id) {
  if (id === 'bowman') return { primary: statValue('DEX'), secondary: statValue('STR') };
  if (id === 'thief') return { primary: statValue('LUK'), secondary: statValue('DEX') };
  return { primary: statValue('STR'), secondary: statValue('DEX') };
}

function patchBaseAttack() {
  const id = classId();
  if (!id || id === 'magician') return;
  const weapon = findWeapon(weaponTileName());
  const watk = statValue('WATK') || number(weapon?.incPAD ?? weapon?.stats?.incPAD);
  if (!watk) return;

  const { primary, secondary } = primarySecondary(id);
  if (!primary) return;

  const mult = weaponMult(weapon);
  const mastery = 0.08;
  const min = Math.max(1, Math.round((0.8 + (primary * mult * mastery + secondary) / 100) * watk));
  const max = Math.max(min, Math.round((1.0 + (primary * mult + secondary) / 100) * watk));

  document.querySelectorAll('.mg-overview-damage-row').forEach((row) => {
    const name = row.querySelector('strong')?.textContent?.trim();
    const value = row.querySelector('em');
    if (name === 'Base Attack' && value) {
      value.textContent = `${min} - ${max}`;
      value.dataset.baseAttackFormulaPatched = '1';
    }
  });
}

function installBaseAttackFormulaPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBaseAttackFormulaPatchInstalled) return;
  window.__mscwBaseAttackFormulaPatchInstalled = true;

  const run = () => window.requestAnimationFrame(patchBaseAttack);
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
}

installBaseAttackFormulaPatch();
