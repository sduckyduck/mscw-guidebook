import CharacterPreview from './CharacterPreview.jsx';
import IconFallback, { baseUrl } from './IconFallback.jsx';
import MonsterIcon from './MonsterIcon.jsx';
import MsioItemIcon from './MsioItemIcon.jsx';
import OsmsDataImage from './OsmsDataImage.jsx';
import { CLASS_LINES } from '../data/classes.js';

const SLOTS = [
  ['weapon', '武器'], ['cap', '头盔'], ['overall', '套服'], ['top', '上衣'], ['bottom', '下衣'],
  ['shoes', '鞋子'], ['glove', '手套'], ['shield', '盾牌'], ['cape', '披风'], ['earring', '耳环'],
];

const BUDGET_LABELS = { low: '低资金', mid: '普通', high: '有钱' };
const PRIORITY_LABELS = { stable: '稳定', exp: '经验', material: '材料', meso: '金币' };
const EDITION_LABELS = { global: '国际服', china: '国服' };
const GENDER_LABELS = { male: '男', female: '女' };

function label(map, value, fallback = '-') {
  return map[value] ?? value ?? fallback;
}

function findClassLine(id) {
  return CLASS_LINES.find((item) => item.id === id) ?? CLASS_LINES[0];
}

function getGearBySlot(gear = []) {
  return Object.fromEntries((gear ?? []).map((item) => [item.slot, item]));
}

function selectDamageCards(snapshot) {
  const all = snapshot?.skillPlan?.damageCards ?? [];
  const base = all.find((card) => card.isBase);
  const skillCards = all
    .filter((card) => !card.isBase)
    .sort((a, b) => Number(b.max ?? 0) - Number(a.max ?? 0))
    .slice(0, 2);
  return snapshot?.classId === 'magician' ? skillCards : [base, ...skillCards].filter(Boolean);
}

export default function BuildSnapshotDashboard({ snapshot, build, copied, onBack, onCopy }) {
  const classLine = findClassLine(snapshot?.classId);
  const gear = snapshot?.gear ?? [];
  const weapon = snapshot?.weapon ?? gear.find((item) => item.slot === 'weapon');
  const stats = snapshot?.stats ?? [];
  const damageCards = selectDamageCards(snapshot);

  return <section className="mg-dashboard build-snapshot-dashboard">
    <div className="build-snapshot-topbar">
      <button className="mg-action-small" onClick={onBack}>← 回到 Build 库</button>
      <button className="mg-action-main build-snapshot-share" onClick={onCopy}>{copied ? '已复制' : '复制分享链接'}</button>
    </div>

    <h1 className="mg-dashboard-title">MapleGuide: {snapshot?.className ?? classLine.name}开荒仪表盘</h1>
    <p className="mg-dashboard-subtitle">公开 Build · {build?.title ?? '玩家配置'} · by {build?.authorName || '匿名玩家'}</p>

    <div className="mg-dashboard-grid">
      <div className="mg-left-stack">
        <SnapshotConfigPanel snapshot={snapshot} />
        <SnapshotEquipmentSlots gear={gear} />
      </div>
      <div className="mg-right-stack">
        <SnapshotStatusPanel snapshot={snapshot} />
        <SnapshotPreviewPanel classLine={classLine} snapshot={snapshot} gear={gear} weapon={weapon} stats={stats} />
        <SnapshotDamagePanel snapshot={snapshot} damageCards={damageCards} />
      </div>
    </div>

    <div className="mg-actions build-snapshot-actions">
      <button className="mg-action-small" onClick={onBack}>返回</button>
      <button className="mg-action-main" onClick={onCopy}>{copied ? '已复制' : '复制分享链接'}</button>
      <button className="mg-action-small" onClick={onCopy}>复制</button>
    </div>
    <p className="mg-footer">© 2026 MapleGuide | by SduckyDuck</p>
  </section>;
}

function SnapshotConfigPanel({ snapshot }) {
  return <section className="mg-glass-panel">
    <h2 className="mg-panel-title">角色配置</h2>
    <div className="mg-field-grid">
      <ReadOnlySelect label="版本" value={label(EDITION_LABELS, snapshot?.editionId)} />
      <ReadOnlySelect label="性别" value={label(GENDER_LABELS, snapshot?.gender)} />
      <ReadOnlySelect label="职业" value={snapshot?.className ?? snapshot?.classId} />
      <ReadOnlySelect label="二转" value={snapshot?.branchName ?? snapshot?.branchId} />
      <div className="mg-level">
        <label>等级</label>
        <div className="mg-level-row">
          <button className="mg-level-btn" disabled>-</button>
          <div className="mg-level-value">Lv. {snapshot?.level ?? '-'}</div>
          <button className="mg-level-btn" disabled>+</button>
        </div>
        <input className="mg-range" type="range" min={snapshot?.minLevel ?? 1} max={snapshot?.maxLevel ?? 120} value={snapshot?.level ?? 1} readOnly />
      </div>
      <ReadOnlySelect label="资金" value={label(BUDGET_LABELS, snapshot?.budget)} />
      <ReadOnlySelect label="优先" value={label(PRIORITY_LABELS, snapshot?.priority)} />
    </div>
  </section>;
}

function ReadOnlySelect({ label, value }) {
  return <div className="mg-field">
    <label>{label}</label>
    <select className="mg-select" value={value ?? '-'} disabled>
      <option>{value ?? '-'}</option>
    </select>
  </div>;
}

function SnapshotEquipmentSlots({ gear }) {
  const by = getGearBySlot(gear);
  return <section className="mg-equipment-board">
    <div className="mg-equipment-head">
      <h2 className="mg-panel-title">装备快捷栏</h2>
      <span>公开快照</span>
    </div>
    <div className="mg-equipment-grid">
      {SLOTS.map(([slot, labelText]) => {
        const item = by[slot];
        return <button className="mg-equip-tile" key={slot} disabled>
          <MsioItemIcon item={item} size={30} />
          <span>{labelText}</span>
          <strong>{item?.title ?? '未装备'}</strong>
        </button>;
      })}
    </div>
  </section>;
}

function SnapshotStatusPanel({ snapshot }) {
  const bestMonster = snapshot?.bestMonster;
  const bestMap = snapshot?.bestMap;
  const hitValue = Number(bestMonster?.hitPercent);
  const hitText = Number.isFinite(hitValue) ? `${hitValue}%` : bestMap?.canHitAll ? '100%' : '偏紧';
  return <section className="mg-status-panel">
    <h2 className="mg-panel-title">地图刷怪推荐</h2>
    <div className="mg-status-row">
      <div>
        <p className="mg-status-line mg-status-monster"><MonsterIcon monster={bestMonster} size={42} /> <span>优先打</span><strong>{bestMonster?.name ?? '推荐怪物'}</strong></p>
        <p className="mg-status-line mg-status-map"><span>推荐地图</span><strong>{bestMap?.name ?? '读取中'}</strong></p>
        <p className="mg-status-line"><span>命中</span><strong>{hitText}</strong><span>刷怪数</span><strong>{bestMap?.spawnTotal ?? '-'}</strong></p>
      </div>
      {bestMap?.thumbnail && <OsmsDataImage className="mg-map-thumb" src={bestMap.thumbnail} sources={[bestMap.minimap]} alt={bestMap.name} placeholder="Map" />}
    </div>
  </section>;
}

function SnapshotPreviewPanel({ classLine, snapshot, gear, weapon, stats }) {
  return <section className="mg-preview-card no-rail">
    <div className="mg-preview-main">
      <div className="mg-character-frame"><CharacterPreview classLine={classLine} gender={snapshot?.gender} gear={gear} /></div>
      <div>
        <h3 className="mg-stats-title">角色属性</h3>
        <div className="mg-stats-grid">{stats.map((stat) => <div className="mg-stat-box" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong>{stat.bonus ? <small className="mg-stat-breakdown">({stat.base}+{stat.bonus})</small> : null}</div>)}</div>
      </div>
      <div className="preview-meta"><strong>{snapshot?.className ?? classLine.name} Lv.{snapshot?.level ?? '-'}</strong><span>{weapon?.title ?? '装备读取中'}</span></div>
    </div>
  </section>;
}

function SnapshotDamagePanel({ snapshot, damageCards }) {
  if (!damageCards.length) return null;
  return <section className="mg-overview-damage-card">
    <div className="mg-overview-damage-head">
      <h2>技能伤害</h2>
      <span>{snapshot?.classId === 'magician' ? '最高 2 项技能' : '普攻 + 最高 2 项'}</span>
    </div>
    <div className="mg-overview-damage-list">
      {damageCards.map((card) => <SnapshotDamageRow key={card.name} card={card} />)}
    </div>
  </section>;
}

function SnapshotDamageRow({ card }) {
  const letters = card.isBase ? 'Ba' : String(card.name || '?').replace(/\s+/g, '').slice(0, 2);
  return <article className="mg-overview-damage-row">
    <div className={card.isBase ? 'mg-overview-damage-icon base' : 'mg-overview-damage-icon'}>
      <IconFallback
        className="mg-overview-damage-img"
        sources={card.iconKey ? [`${baseUrl()}${String(card.iconKey).replace(/^\/+/, '')}`] : []}
        names={[card.name]}
        folders={['icons/skill', 'icons']}
        alt=""
        fallback={<span>{letters}</span>}
      />
    </div>
    <div>
      <strong>{card.name}</strong>
      <span>{card.isBase ? '普通攻击' : `Lv. ${card.level}/${card.maxLevel}`}</span>
    </div>
    <em>{card.min} - {card.max}</em>
  </article>;
}
