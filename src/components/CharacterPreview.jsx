import { useEffect, useMemo, useState } from 'react';
import { getCmsItemIconUrl, getMappedMsioItemId } from './MsioItemIcon.jsx';

const API_REGION = 'MCW';
const API_VERSION = '1';
const SKIN = 2000;

const HAIR = {
  male: [30000, 30060, 30100, 30120, 30140, 30200, 30210, 30260, 30300],
  female: [31000, 31030, 31040, 31070, 31100, 31150, 31260, 31280, 31310],
};
const FACE = {
  male: [20000, 20001, 20002, 20003, 20005, 20011, 20014],
  female: [21000, 21001, 21002, 21003, 21004, 21010, 21014],
};
const BACKUP = {
  warrior: [1002001, 1060016, 1302000],
  magician: [1002019, 1050003, 1372000],
  bowman: [1002165, 1452000],
  thief: [1002170, 1472000],
  pirate: [1002610, 1492000],
};
const EMOTE = { warrior: 'angry', magician: 'bewildered', bowman: 'default', thief: 'wink', pirate: 'wink' };
const PREVIEW_SLOTS = ['cap', 'overall', 'top', 'bottom', 'shoes', 'glove', 'cape', 'shield', 'weapon'];

function idNum(value) {
  const n = Number(String(value ?? '').replace(/^0+/, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mappedGear(gear) {
  const slots = {};
  for (const item of gear ?? []) {
    const id = getMappedMsioItemId(item);
    if (!id) continue;
    const slot = item.slot || 'other';
    if (slot === 'overall') {
      slots.overall = id;
      delete slots.top;
      delete slots.bottom;
    } else if (PREVIEW_SLOTS.includes(slot)) {
      slots[slot] = id;
    }
  }
  return [slots.cap, slots.overall, slots.top, slots.bottom, slots.shoes, slots.glove, slots.cape, slots.shield, slots.weapon].filter(Boolean);
}

function actionFor(gear) {
  const w = (gear ?? []).find((item) => item.slot === 'weapon');
  const txt = `${w?.weaponType ?? w?.weapon_type ?? ''} ${w?.title ?? w?.name ?? ''}`.toLowerCase();
  const usesStand2 = ['crossbow', 'pole arm', 'polearm', 'spear', '2h', '2-handed', 'two-handed', 'two handed', 'two hand', 'two-handed sword', 'two-handed axe', 'two-handed blunt weapon', '2h sword', '2h axe', '2h blunt'].some((word) => txt.includes(word));
  return usesStand2 ? 'stand2' : 'stand1';
}

function unique(ids) {
  const seen = new Set();
  return (ids ?? []).map(idNum).filter(Boolean).filter((id) => {
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function url({ hair, face, emote, ids, action }) {
  const entries = [hair, `${face}:${emote}`, ...unique(ids)];
  const path = encodeURIComponent(entries.join(','));
  return `https://maplestory.io/api/${API_REGION}/${API_VERSION}/Character/${SKIN}/${path}/${encodeURIComponent(action)}/0?resize=3&renderMode=Full&bgColor=0,0,0,0&faceEmote=${encodeURIComponent(emote)}`;
}

function urlsFor({ classLine, gender, gear }) {
  const g = gender === 'male' ? 'male' : 'female';
  const classId = classLine?.id ?? 'warrior';
  const seed = classId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) + (g === 'female' ? 11 : 0);
  const hair = HAIR[g][Math.abs(seed) % HAIR[g].length];
  const face = FACE[g][Math.abs(seed) % FACE[g].length];
  const emote = EMOTE[classId] ?? 'default';
  const action = actionFor(gear);
  const recommended = mappedGear(gear);
  const backup = BACKUP[classId] ?? BACKUP.warrior;
  return [recommended.length ? recommended : null, backup, []].filter((ids) => ids !== null).map((ids) => url({ hair, face, emote, ids, action }));
}

function getSlotLabel(slot) {
  return { cap: '头', overall: '套', top: '衣', bottom: '裤', shoes: '鞋', glove: '手', cape: '披', shield: '盾', weapon: '武' }[slot] ?? '装';
}

function gearPreviewItems(gear = []) {
  const bySlot = new Map();
  for (const item of gear) {
    if (!item?.slot || !PREVIEW_SLOTS.includes(item.slot)) continue;
    if (item.slot === 'overall') {
      bySlot.delete('top');
      bySlot.delete('bottom');
    }
    if ((item.slot === 'top' || item.slot === 'bottom') && bySlot.has('overall')) continue;
    bySlot.set(item.slot, item);
  }
  return PREVIEW_SLOTS.map((slot) => bySlot.get(slot)).filter(Boolean);
}

function EquippedGearOverlay({ gear = [] }) {
  const items = gearPreviewItems(gear);
  if (!items.length) return null;
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
    <div style={{ position: 'absolute', left: 8, top: 8, display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 92 }}>
      {items.map((item) => {
        const src = getCmsItemIconUrl(item);
        const label = getSlotLabel(item.slot);
        return <div key={`${item.slot}-${item.id}`} title={item.title ?? item.name ?? item.id} style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(10,30,45,0.14)', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', display: 'grid', placeItems: 'center' }}>
          {src ? <img src={src} alt="" style={{ width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated' }} /> : <span style={{ fontSize: 10, fontWeight: 900, color: '#667085' }}>{label}</span>}
        </div>;
      })}
    </div>
    <div style={{ position: 'absolute', right: 8, bottom: 8, padding: '3px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.9)', color: '#344054', fontSize: 10, fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>CMS 装备</div>
  </div>;
}

export function buildCharacterImageUrl({ classLine, gender, gear }) {
  return urlsFor({ classLine, gender, gear })[0];
}

export default function CharacterPreview({ classLine, gender = 'female', gear = [] }) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setAttempt(0); }, [classLine, gender, gear]);
  const urls = useMemo(() => urlsFor({ classLine, gender, gear }), [classLine, gender, gear]);
  const src = urls[Math.min(attempt, urls.length - 1)];
  const fallback = !src || attempt >= urls.length;

  return <div style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center' }} title={src || 'CMS character preview'}>
    {fallback ? <div className={`pixel-avatar ${classLine?.id ?? ''}`} style={{ transform: 'scale(1.05)' }}><div className="avatar-hat" /><div className="avatar-face" /><div className="avatar-body" /><div className="avatar-weapon" /></div> : <img key={src} className="real-character-preview" src={src} alt={`${classLine?.name ?? '角色'} preview`} onError={() => setAttempt((i) => i + 1)} draggable="false" />}
    <EquippedGearOverlay gear={gear} />
  </div>;
}
