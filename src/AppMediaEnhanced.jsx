import { useEffect, useMemo, useState } from 'react';
import CharacterPreview from './components/CharacterPreview.jsx';
import MonsterIcon from './components/MonsterIcon.jsx';
import MsioItemIcon from './components/MsioItemIcon.jsx';
import OsmsDataImage from './components/OsmsDataImage.jsx';
import SkillPanel from './components/SkillPanel.jsx';
import { CLASS_LINES, EDITIONS } from './data/classes.js';
import { buildStatPlan, getRecommendedApAllocation } from './engine/levelEngine.js';
import { applyGearOverrides, getGearCandidatesBySlot, selectGear } from './engine/gearSelector.js';
import { getMapRecommendations } from './engine/recommendationEngine.js';
import { loadOfficialGuideData } from './engine/officialDataAdapter.js';
import { getApNote, getRecommendedSkillAllocation, getSkillPlan } from './engine/skillPlanner.js';
import './styles/dashboard.css';
import './styles/character-dashboard.css';
import './styles/skill-gating.css';

const TABS = [['overview', '总览'], ['character', '角色'], ['maps', '地图'], ['materials', '材料']];
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
const tabIds = new Set(TABS.map(([id]) => id));

function getInitialTab() {
  if (typeof window === 'undefined') return 'overview';
  const hashTab = window.location.hash.replace(/^#/, '');
  return tabIds.has(hashTab) ? hashTab : 'overview';
}

export default function AppMediaEnhanced() {
  const [tab, setTab] = useState(getInitialTab);
  const [editionId, setEditionId] = useState('global');
  const [classId, setClassId] = useState('magician');
  const [branchId, setBranchId] = useState('magician');
  const [gender, setGender] = useState('female');
  const [level, setLevel] = useState(25);
  const [budget, setBudget] = useState('low');
  const [priority, setPriority] = useState('material');
  const [apAllocation, setApAllocation] = useState(null);
  const [skillAllocation, setSkillAllocation] = useState(null);
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
  useEffect(() => setApAllocation(getRecommendedApAllocation(classLine, level)), [classLine, level]);
  useEffect(() => setSkillAllocation(getRecommendedSkillAllocation({ classId: classLine.id, branchId: branch.id, level })), [classLine, branch, level]);
  useEffect(() => { setGearOverrides({}); setPickerSlot(null); }, [editionId, classId, branchId, gender, level, budget]);

  const recommendedApAllocation = useMemo(() => getRecommendedApAllocation(classLine, level), [classLine, level]);
  const effectiveApAllocation = apAllocation ?? recommendedApAllocation;
  const statPlan = useMemo(() => buildStatPlan(classLine, level, { apAllocation: effectiveApAllocation }), [classLine, level, effectiveApAllocation]);
  const maps = useMemo(() => getMapRecommendations({ classLine, level, statPlan, maps: activeData.maps, monsters: activeData.monsters }).slice(0, 8), [classLine, level, statPlan, activeData]);
  const recommendedGear = useMemo(() => selectGear({ classLine, branch, level, budget, gender, statPlan, items: activeData.items }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const candidatesBySlot = useMemo(() => getGearCandidatesBySlot({ classLine, branch, level, budget, gender, statPlan, items: activeData.items }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const gear = useMemo(() => applyGearOverrides(recommendedGear, gearOverrides), [recommendedGear, gearOverrides]);
  const weapon = gear.find((x) => x.slot === 'weapon');
  const mainAttack = calcMainAttack(classLine, statPlan, weapon);
  const stats = compactStats(statPlan, classLine, mainAttack);
  const bestMap = maps[0];
  const bestMonster = bestMap?.monsters?.[0];
  const recommendedSkillAllocation = useMemo(() => getRecommendedSkillAllocation({ classId: classLine.id, branchId: branch.id, level }), [classLine, branch, level]);
  const effectiveSkillAllocation = skillAllocation ?? recommendedSkillAllocation;
  const skillPlan = useMemo(() => getSkillPlan({ classId: classLine.id, branchId: branch.id, level, mainAttack, customSkills: effectiveSkillAllocation }), [classLine, branch, level, mainAttack, effectiveSkillAllocation]);
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

  const changeTab = (nextTab) => {
    setTab(nextTab);
    if (typeof window === 'undefined') return;
    const nextUrl = nextTab === 'overview'
      ? `${window.location.pathname}${window.location.search}`
      : `${window.location.pathname}${window.location.search}#${nextTab}`;
    window.history.replaceState(null, '', nextUrl);
  };

  const changeAp = (stat, delta) => {
    setApAllocation((current) => adjustPointAllocation(current ?? recommendedApAllocation, stat, delta, statPlan.totalAp));
  };

  const resetAp = () => setApAllocation(recommendedApAllocation);

  const changeSkill = (name, delta) => {
    const skill = skillPlan.skills.find((item) => item.name === name);
    if (!skill || skill.locked) return;
    const tierTotal = skillPlan.totalSpByTier?.[skill.tier] ?? skillPlan.totalSp;
    const tierUsed = skillPlan.skills
      .filter((item) => item.tier === skill.tier)
      .reduce((sum, item) => sum + item.level, 0);

    setSkillAllocation((current) => {
      const next = { ...(current ?? recommendedSkillAllocation) };
      const currentValue = Math.max(0, Number(next[name] ?? 0));
      if (delta > 0) {
        if (tierUsed >= tierTotal || currentValue >= skill.max) return next;
        next[name] = currentValue + 1;
        return next;
      }
      if (currentValue <= 0) return next;
      next[name] = currentValue - 1;
      return next;
    });
  };

  const resetSkills = () => setSkillAllocation(recommendedSkillAllocation);

  return <main className="app-shell">
    <nav className="top-tabs">{TABS.map(([id, name]) => <button key={id} className={tab === id ? 'top-tab active' : 'top-tab'} onClick={() => changeTab(id)}>{name}</button>)}</nav>
    {edition.dataMode !== 'official-appdata' && <p className="load-error">国服数据/公式已预留，当前暂不启用真实推荐。</p>}
    {tab === 'overview' && <Dashboard controls={controls} classLine={classLine} branch={branch} gender={gender} level={level} bestMonster={bestMonster} bestMap={bestMap} weapon={weapon} gear={gear} stats={stats} candidatesBySlot={candidatesBySlot} onPickSlot={setPickerSlot} onOpenMaps={() => changeTab('maps')} />}
    {tab === 'character' && <SkillPanel plan={skillPlan} apNote={apNote} statPlan={statPlan} classLine={classLine} gender={gender} gear={gear} level={level} weapon={weapon} apAllocation={effectiveApAllocation} onApChange={changeAp} onApReset={resetAp} onSkillChange={changeSkill} onSkillReset={resetSkills} />}
    {tab === 'maps' && <MapsPage maps={maps} data={activeData} />}
    {tab === 'materials' && <MaterialsPage data={activeData} />}
    {pickerSlot && <GearPicker slot={pickerSlot} items={candidatesBySlot[pickerSlot] ?? []} current={gear.find((item) => item.slot === pickerSlot)} onChoose={(item) => chooseGear(pickerSlot, item)} onClose={() => setPickerSlot(null)} />}
    {error && <p className="load-error">官方数据读取提示：{error}</p>}
  </main>;
}

function Dashboard({ controls, classLine, gender, level, bestMonster, bestMap, weapon, gear, stats, candidatesBySlot, onPickSlot, onOpenMaps }) {
  return <section className="mg-dashboard">
    <h1 className="mg-dashboard-title">MapleGuide: {classLine.name}开荒仪表盘</h1>
    <p className="mg-dashboard-subtitle">根据您的参数，为您推荐最佳路线</p>
    <div className="mg-dashboard-grid">
      <div className="mg-left-stack">
        <ConfigPanel {...controls} />
        <DashboardEquipmentSlots gear={gear} candidatesBySlot={candidatesBySlot} onPickSlot={onPickSlot} />
      </div>
      <div className="mg-right-stack">
        <StatusPanel bestMonster={bestMonster} bestMap={bestMap} onOpenMaps={onOpenMaps} />
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

function StatusPanel({ bestMonster, bestMap, onOpenMaps }) {
  return <button type="button" className="mg-status-panel mg-status-link" onClick={onOpenMaps}>
    <h2 className="mg-panel-title">地图刷怪推荐</h2>
    <div className="mg-status-row">
      <div>
        <p className="mg-status-line mg-status-monster"><MonsterIcon monster={bestMonster} size={42} /> <span>优先打</span><strong>{bestMonster?.name ?? '推荐怪物'}</strong></p>
        <p className="mg-status-line mg-status-map"><span>推荐地图</span><strong>{bestMap?.name ?? '读取中'}</strong></p>
        <p className="mg-status-line"><span>命中</span><strong>{bestMonster?.hitPercent ? `${bestMonster.hitPercent}%` : bestMap?.canHitAll ? '100%' : '偏紧'}</strong><span>刷怪数</span><strong>{bestMap?.spawnTotal ?? '-'}</strong></p>
      </div>
      {bestMap?.thumbnail && <OsmsDataImage className="mg-map-thumb" src={bestMap.thumbnail} sources={[bestMap.minimap]} alt={bestMap.name} placeholder="Map" />}
    </div>
  </button>;
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

function MapsPage({ maps, data }) {
  return <Section title="推荐路线">
    <p className="section-copy">{data?.maps?.length ? '地图大图、怪物图和刷怪数来自当前国际服数据；卡片会优先展示当前等级最适合打的怪。' : '当前版本地图数据未启用。'}</p>
    <div className="mg-map-grid">
      {maps.map((map, index) => {
        const target = map.monsters?.[0];
        return <article className="mg-map-card" key={map.id}>
          <div className="mg-map-rank">#{index + 1}</div>
          {map.thumbnail && <OsmsDataImage className="mg-map-card-image" src={map.thumbnail} sources={[map.minimap]} alt={map.name} placeholder="Map" />}
          <div className="mg-map-card-body">
            <span className="item-label">Lv.{map.levelRange?.[0]}-{map.levelRange?.[1]} · {map.region}</span>
            <h3>{map.name}</h3>
            <div className="mg-map-target">
              <MonsterIcon monster={target} size={38} />
              <div>
                <strong>{target?.name ?? '推荐怪物'}</strong>
                <span>Lv.{target?.level ?? '-'} · 命中 {target?.hitPercent ?? '-'}%</span>
              </div>
            </div>
            <div className="small-tags">
              <span>刷怪数 {map.spawnTotal ?? '-'}</span>
              <span>分数 {map.score}</span>
              <span>{map.canHitAll ? '命中稳定' : '命中偏紧'}</span>
            </div>
          </div>
        </article>;
      })}
    </div>
  </Section>;
}

function adjustPointAllocation(current, key, delta, totalPoints, maxForKey = Infinity) {
  const next = { ...(current ?? {}) };
  const used = Object.values(next).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const currentValue = Math.max(0, Number(next[key] ?? 0));

  if (delta > 0) {
    if (used >= totalPoints || currentValue >= maxForKey) return next;
    next[key] = currentValue + 1;
    return next;
  }

  if (currentValue <= 0) return next;
  next[key] = currentValue - 1;
  return next;
}

function MaterialsPage() { return <Section title="材料 / 锻造"><p className="section-copy">材料价值指数和锻造路线保留在后续国服/国际服数据整理阶段继续接入。</p></Section>; }
function Section({ title, children }) { return <section className="section-card"><h2>{title}</h2>{children}</section>; }
function compactStats(statPlan, classLine, mainAttack) { return [['STR', statPlan.stats.STR], ['DEX', statPlan.stats.DEX], ['INT', statPlan.stats.INT], ['LUK', statPlan.stats.LUK], ['ACC', statPlan.derived.accuracy], ['HP', statPlan.derived.hp], ['MP', statPlan.derived.mp], [classLine.id === 'magician' ? 'MATK' : 'WATK', mainAttack]]; }
function calcMainAttack(classLine, statPlan, weapon) { const primary = statPlan.stats[classLine.primaryStat] ?? 0; const secondary = statPlan.stats[classLine.secondaryStat] ?? 0; const gearAttack = classLine.id === 'magician' ? (weapon?.incMAD ?? 0) : (weapon?.incPAD ?? 0); return Math.max(1, Math.round(primary * 1.35 + secondary * 0.35 + statPlan.level * 0.7 + gearAttack)); }
