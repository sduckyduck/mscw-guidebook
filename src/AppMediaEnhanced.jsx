import { useEffect, useMemo, useState } from 'react';
import CharacterPreview from './components/CharacterPreview.jsx';
import MonsterIcon from './components/MonsterIcon.jsx';
import MsioItemIcon from './components/MsioItemIcon.jsx';
import OsmsDataImage from './components/OsmsDataImage.jsx';
import SkillPanel from './components/SkillPanel.jsx';
import { CLASS_LINES, EDITIONS } from './data/classes.js';
import { buildStatPlan } from './engine/levelEngine.js';
import { applyGearOverrides, getGearCandidatesBySlot, selectGear } from './engine/gearSelector.js';
import { getMapRecommendations } from './engine/recommendationEngine.js';
import { loadOfficialGuideData } from './engine/officialDataAdapter.js';
import { getApNote, getSkillPlan } from './engine/skillPlanner.js';
import './styles/dashboard.css';

const TABS = [['overview', '总览'], ['character', '角色'], ['maps', '地图'], ['gear', '装备'], ['materials', '材料']];
const JOBS = [['warrior', '战士'], ['magician', '魔法师'], ['bowman', '弓箭手'], ['thief', '飞侠'], ['pirate', '海盗']].map(([id, name]) => ({ id, name }));
const BUDGETS = [['low', '低资金'], ['mid', '普通'], ['high', '有钱']].map(([id, name]) => ({ id, name }));
const PRIORITIES = [['stable', '稳定'], ['exp', '经验'], ['material', '材料'], ['meso', '金币']].map(([id, name]) => ({ id, name }));
const SLOTS = [
  ['weapon', '武器'],
  ['cap', '头盔'],
  ['overall', '套服'],
  ['top', '上衣'],
  ['bottom', '下衣'],
  ['shoes', '鞋子'],
  ['glove', '手套'],
  ['shield', '盾牌'],
  ['cape', '披风'],
  ['earring', '耳环'],
];
const emptyData = { items: [], maps: [], monsters: [], recipes: [], materials: [] };

export default function AppMediaEnhanced() {
  const [tab, setTab] = useState('overview');
  const [editionId, setEditionId] = useState('global');
  const [classId, setClassId] = useState('magician');
  const [branchId, setBranchId] = useState('magician');
  const [gender, setGender] = useState('female');
  const [level, setLevel] = useState(25);
  const [budget, setBudget] = useState('low');
  const [priority, setPriority] = useState('material');
  const [gearOverrides, setGearOverrides] = useState({});
  const [pickerSlot, setPickerSlot] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadOfficialGuideData().then(setData).catch((e) => setError(e.message || '官方数据读取失败')); }, []);

  const edition = EDITIONS.find((x) => x.id === editionId) ?? EDITIONS[0];
  const minLevel = edition.minLevel ?? 10;
  const maxLevel = edition.maxLevel ?? 50;
  const activeData = edition.dataMode === 'official-appdata' ? (data ?? emptyData) : emptyData;
  const classes = CLASS_LINES.filter((x) => edition.classIds.includes(x.id));
  const classLine = classes.find((x) => x.id === classId) ?? classes[0];
  const branch = classLine.branches.find((x) => x.id === branchId) ?? classLine.branches[0] ?? classLine;

  useEffect(() => setLevel((v) => Math.min(maxLevel, Math.max(minLevel, v))), [minLevel, maxLevel]);
  useEffect(() => {
    if (!classes.some((x) => x.id === classId)) setClassId(classes[0]?.id ?? 'warrior');
    if (!classLine.branches.some((x) => x.id === branchId)) setBranchId(classLine.branches[0]?.id ?? classLine.id);
  }, [classes, classId, branchId, classLine]);
  useEffect(() => { setGearOverrides({}); setPickerSlot(null); }, [editionId, classId, branchId, gender, level, budget]);

  const statPlan = useMemo(() => buildStatPlan(classLine, level), [classLine, level]);
  const maps = useMemo(() => getMapRecommendations({ classLine, level, statPlan, maps: activeData.maps, monsters: activeData.monsters }).slice(0, 8), [classLine, level, statPlan, activeData]);
  const recommendedGear = useMemo(() => selectGear({ classLine, branch, level, budget, gender, statPlan, items: activeData.items }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const candidatesBySlot = useMemo(() => getGearCandidatesBySlot({ classLine, branch, level, budget, gender, statPlan, items: activeData.items }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const gear = useMemo(() => applyGearOverrides(recommendedGear, gearOverrides), [recommendedGear, gearOverrides]);
  const weapon = gear.find((x) => x.slot === 'weapon');
  const mainAttack = calcMainAttack(classLine, statPlan, weapon);
  const stats = compactStats(statPlan, classLine, mainAttack);
  const bestMap = maps[0];
  const bestMonster = bestMap?.monsters?.[0];
  const skillPlan = useMemo(() => getSkillPlan({ classId: classLine.id, branchId: branch.id, level, mainAttack }), [classLine, branch, level, mainAttack]);
  const apNote = useMemo(() => getApNote({ classLine, statPlan }), [classLine, statPlan]);
  const controls = { edition, editionId, setEditionId, classId, setClassId, branchId, setBranchId, gender, setGender, level, setLevel, budget, setBudget, priority, setPriority, classes, classLine, minLevel, maxLevel };

  const chooseGear = (slot, item) => {
    setGearOverrides((old) => {
      const next = { ...old, [slot]: item };
      if (slot === 'overall') { delete next.top; delete next.bottom; }
      if (slot === 'top' || slot === 'bottom') delete next.overall;
      return next;
    });
    setPickerSlot(null);
  };

  return <main className="app-shell">
    <nav className="top-tabs">{TABS.map(([id, name]) => <button key={id} className={tab === id ? 'top-tab active' : 'top-tab'} onClick={() => setTab(id)}>{name}</button>)}</nav>
    {edition.dataMode !== 'official-appdata' && <p className="load-error">国服数据/公式已预留，当前暂不启用真实推荐。</p>}
    {tab === 'overview' && <Dashboard controls={controls} classLine={classLine} branch={branch} gender={gender} level={level} bestMonster={bestMonster} bestMap={bestMap} weapon={weapon} gear={gear} stats={stats} candidatesBySlot={candidatesBySlot} onPickSlot={setPickerSlot} />}
    {tab === 'character' && <><Parameters {...controls} /><StatsCard stats={stats} classLine={classLine} /><SkillPanel plan={skillPlan} apNote={apNote} /></>}
    {tab === 'maps' && <MapsPage maps={maps} data={activeData} />}
    {tab === 'gear' && <GearPage gear={gear} candidatesBySlot={candidatesBySlot} onPickSlot={setPickerSlot} />}
    {tab === 'materials' && <MaterialsPage data={activeData} />}
    {pickerSlot && <GearPicker slot={pickerSlot} items={candidatesBySlot[pickerSlot] ?? []} current={gear.find((item) => item.slot === pickerSlot)} onChoose={(item) => chooseGear(pickerSlot, item)} onClose={() => setPickerSlot(null)} />}
    {error && <p className="load-error">官方数据读取提示：{error}</p>}
  </main>;
}

function Dashboard({ controls, classLine, gender, level, bestMonster, bestMap, weapon, gear, stats, candidatesBySlot, onPickSlot }) {
  return <section className="mg-dashboard">
    <h1 className="mg-dashboard-title">MapleGuide: {classLine.name}开荒仪表盘</h1>
    <p className="mg-dashboard-subtitle">根据您的参数，为您推荐最佳路线</p>
    <div className="mg-dashboard-grid">
      <div className="mg-left-stack">
        <ConfigPanel {...controls} />
        <DashboardEquipmentSlots gear={gear} candidatesBySlot={candidatesBySlot} onPickSlot={onPickSlot} />
      </div>
      <div className="mg-right-stack">
        <StatusPanel bestMonster={bestMonster} bestMap={bestMap} />
        <PreviewPanel classLine={classLine} gender={gender} level={level} weapon={weapon} gear={gear} stats={stats} />
      </div>
    </div>
    <div className="mg-actions">
      <button className="mg-action-small">分享</button>
      <button className="mg-action-main">更新推荐 / 生成路线</button>
      <button className="mg-action-small">复制</button>
    </div>
    <p className="mg-footer">© 2026 MapleGuide | by SduckyDuck</p>
  </section>;
}

function ConfigPanel(props) {
  const { editionId, setEditionId, classId, setClassId, branchId, setBranchId, gender, setGender, level, setLevel, budget, setBudget, priority, setPriority, classes, classLine, minLevel, maxLevel } = props;
  return <section className="mg-glass-panel">
    <h2 className="mg-panel-title">角色配置</h2>
    <div className="mg-field-grid">
      <SelectField label="版本" value={editionId} onChange={setEditionId} options={EDITIONS.map((x) => ({ id: x.id, name: x.name }))} />
      <SelectField label="性别" value={gender} onChange={setGender} options={[{ id: 'male', name: '男' }, { id: 'female', name: '女' }]} />
      <SelectField label="职业" value={classId} onChange={setClassId} options={JOBS.filter((job) => classes.some((x) => x.id === job.id))} />
      <SelectField label="二转" value={branchId} onChange={setBranchId} options={classLine.branches.map((x) => ({ id: x.id, name: x.name }))} />
      <div className="mg-level">
        <label>等级</label>
        <div className="mg-level-row">
          <button className="mg-level-btn" onClick={() => setLevel(Math.max(minLevel, level - 1))}>-</button>
          <div className="mg-level-value">Lv. {level}</div>
          <button className="mg-level-btn" onClick={() => setLevel(Math.min(maxLevel, level + 1))}>+</button>
        </div>
        <input className="mg-range" type="range" min={minLevel} max={maxLevel} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
      </div>
      <SelectField label="资金" value={budget} onChange={setBudget} options={BUDGETS} />
      <SelectField label="优先" value={priority} onChange={setPriority} options={PRIORITIES} />
    </div>
  </section>;
}

function SelectField({ label, value, onChange, options }) {
  return <div className="mg-field">
    <label>{label}</label>
    <select className="mg-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  </div>;
}

function getSlotConflict(slot, by) {
  if ((slot === 'top' || slot === 'bottom') && by.overall) return '套服占用';
  if (slot === 'overall' && (by.top || by.bottom)) return '上下衣占用';
  return '';
}

function DashboardEquipmentSlots({ gear, candidatesBySlot, onPickSlot }) {
  const by = Object.fromEntries((gear ?? []).map((item) => [item.slot, item]));
  return <section className="mg-equipment-board">
    <div className="mg-equipment-head">
      <h2 className="mg-panel-title">装备快捷栏</h2>
      <span>点击更换</span>
    </div>
    <div className="mg-equipment-grid">
      {SLOTS.map(([slot, label]) => {
        const item = by[slot];
        const conflict = getSlotConflict(slot, by);
        const hasCandidates = Boolean(candidatesBySlot?.[slot]?.length);
        const displayTitle = (item?.title ?? conflict) || '未装备';
        return <button className={conflict ? 'mg-equip-tile conflict' : 'mg-equip-tile'} key={slot} onClick={() => onPickSlot(slot)} disabled={!hasCandidates} title={conflict || label}>
          <MsioItemIcon item={item} size={30} />
          <span>{label}</span>
          <strong>{displayTitle}</strong>
        </button>;
      })}
    </div>
  </section>;
}

function StatusPanel({ bestMonster, bestMap }) {
  return <section className="mg-status-panel">
    <h2 className="mg-panel-title">推荐 & 状态</h2>
    <div className="mg-status-row">
      <div>
        <p className="mg-status-line"><MonsterIcon monster={bestMonster} size={30} /> 优先打：<strong>{bestMonster?.name ?? '推荐怪物'}</strong></p>
        <p className="mg-status-line">推荐地图：<strong>{bestMap?.name ?? '读取中'}</strong></p>
        <p className="mg-status-line">命中：<strong>{bestMap?.canHitAll ? '100%' : '偏紧'}</strong> · 刷怪数：<strong>{bestMap?.spawnTotal ?? '-'}</strong></p>
      </div>
      {bestMap?.thumbnail && <OsmsDataImage className="mg-map-thumb" src={bestMap.thumbnail} sources={[bestMap.minimap]} alt={bestMap.name} placeholder="Map" />}
    </div>
  </section>;
}

function PreviewPanel({ classLine, gender, level, weapon, gear, stats }) {
  return <section className="mg-preview-card no-rail">
    <div className="mg-preview-main">
      <div className="mg-character-frame"><CharacterPreview classLine={classLine} gender={gender} gear={gear} /></div>
      <div>
        <h3 className="mg-stats-title">角色属性</h3>
        <div className="mg-stats-grid">{stats.map(([label, value]) => <div className="mg-stat-box" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </div>
      <div className="preview-meta"><strong>{classLine.name} Lv.{level}</strong><span>{weapon?.title ?? '装备读取中'}</span></div>
    </div>
  </section>;
}

function GearPicker({ slot, items, current, onChoose, onClose }) {
  const label = SLOTS.find(([id]) => id === slot)?.[1] ?? slot;
  return <div className="mg-picker-backdrop" onClick={onClose}>
    <div className="mg-picker-sheet" onClick={(event) => event.stopPropagation()}>
      <div className="mg-picker-head">
        <h2>选择{label}</h2>
        <button onClick={onClose}>关闭</button>
      </div>
      <div className="mg-picker-list">
        {items.length ? items.map((item) => <button key={`${slot}-${item.id}`} className={current?.id === item.id ? 'mg-picker-item active' : 'mg-picker-item'} onClick={() => onChoose(item)}>
          <MsioItemIcon item={item} size={36} />
          <div>
            <strong>{item.title}</strong>
            <span>Lv.{item.reqLevel ?? '-'} · {item.weaponType ?? item.reqJobLabel ?? item.label}</span>
          </div>
          <em>{current?.id === item.id ? '当前' : '替换'}</em>
        </button>) : <p className="section-copy">当前等级和职业没有可替换装备。</p>}
      </div>
    </div>
  </div>;
}

function MapsPage({ maps, data }) { return <Section title="推荐路线"><p className="section-copy">{data?.maps?.length ? '地图大图、怪物图和刷怪数来自当前版本数据；图片缺失时会 fallback 到 OSMS Guide 的 data 资源。' : '当前版本地图数据未启用。'}</p><div className="map-stack">{maps.map((map) => <article className="map-result" key={map.id}><div className="map-result-main"><div><span className="item-label">Lv.{map.levelRange?.[0]}-{map.levelRange?.[1]} · {map.region}</span><h3>{map.monsters?.[0]?.name ?? map.name}</h3><p>{map.monsters?.[0] ? `Lv.${map.monsters[0].level} · EXP ${map.monsters[0].exp ?? '-'} · ${map.canHitAll ? '命中 100%' : '命中偏紧'}` : map.routeNote}</p></div><button className="option-btn" style={{ minWidth: 110 }}>查看地图</button></div>{map.thumbnail && <OsmsDataImage className="map-preview" src={map.thumbnail} sources={[map.minimap]} alt={map.name} placeholder="No Image" />}<h3 style={{ marginTop: 12 }}>{map.name}</h3><p className="section-copy">{map.spawnTotal ?? '-'} 只 · {map.canHitAll ? '安全' : '需补命中'}</p><div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>{map.monsters?.slice(0, 8).map((monster) => <div key={`${map.id}-${monster.id}`} style={{ minWidth: 82, border: '1px solid var(--border)', borderRadius: 12, background: '#fff', padding: 8 }}><MonsterIcon monster={monster} size={34} /><strong style={{ display: 'block', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{monster.name}</strong><span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 900 }}>Lv.{monster.level}</span></div>)}</div></article>)}</div></Section>; }
function GearPage({ gear, candidatesBySlot, onPickSlot }) { return <Section title="装备推荐"><p className="section-copy">装备 icon 使用同一套 MapleStory.io 名称映射，点击槽位可替换当前等级可用装备。</p><div className="mg-equipment-grid page-grid">{SLOTS.map(([slot, label]) => { const item = gear.find((g) => g.slot === slot); return <button className="mg-equip-tile" key={slot} onClick={() => onPickSlot(slot)} disabled={!(candidatesBySlot?.[slot]?.length)}><MsioItemIcon item={item} size={34} /><span>{label}</span><strong>{item?.title ?? '未装备'}</strong></button>; })}</div></Section>; }
function MaterialsPage() { return <Section title="材料 / 锻造"><p className="section-copy">材料价值指数和锻造路线保留在后续国服/国际服数据整理阶段继续接入。</p></Section>; }
function Parameters(props) { return <Section title="角色参数"><ConfigPanel {...props} /></Section>; }
function StatsCard({ stats, classLine }) { return <Section title="最终属性"><div className="stat-stack">{stats.map(([label, value]) => <div className="stat-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="next-ap-note"><strong>下一点 AP：{classLine.primaryStat}</strong><span>当前建议主 {classLine.primaryStat}，{classLine.secondaryStat} 只保留装备/命中需求。</span></div></Section>; }
function Section({ title, children }) { return <section className="section-card"><h2>{title}</h2>{children}</section>; }
function compactStats(statPlan, classLine, mainAttack) { return [['STR', statPlan.stats.STR], ['DEX', statPlan.stats.DEX], ['INT', statPlan.stats.INT], ['LUK', statPlan.stats.LUK], ['ACC', statPlan.derived.accuracy], ['HP', statPlan.derived.hp], ['MP', statPlan.derived.mp], [classLine.id === 'magician' ? 'MATK' : 'WATK', mainAttack]]; }
function calcMainAttack(classLine, statPlan, weapon) { const primary = statPlan.stats[classLine.primaryStat] ?? 0; const secondary = statPlan.stats[classLine.secondaryStat] ?? 0; const gearAttack = classLine.id === 'magician' ? (weapon?.incMAD ?? 0) : (weapon?.incPAD ?? 0); return Math.max(1, Math.round(primary * 1.35 + secondary * 0.35 + statPlan.level * 0.7 + gearAttack)); }
