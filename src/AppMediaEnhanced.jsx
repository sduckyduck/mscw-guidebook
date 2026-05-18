import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import CharacterPreview from './components/CharacterPreview.jsx';
import CraftingMaterialsPageSafe from './components/CraftingMaterialsPageSafe.jsx';
import IconFallback, { baseUrl } from './components/IconFallback.jsx';
import MonsterIcon from './components/MonsterIcon.jsx';
import MonsterReportPage from './components/MonsterReportPage.jsx';
import MsioItemIcon from './components/MsioItemIcon.jsx';
import OsmsDataImage from './components/OsmsDataImage.jsx';
import SkillPanel from './components/SkillPanel.jsx';
import { CLASS_LINES, EDITIONS } from './data/classes.js';
import { buildStatPlan, getRecommendedApAllocation } from './engine/levelEngine.js';
import { applyGearOverrides, getGearCandidatesBySlot, selectGear } from './engine/gearSelector.js';
import { getMapRecommendations } from './engine/recommendationEngine.js';
import { rankLevelingMapsByBreakpoints } from './engine/levelingRouteAlgorithm.js';
import { loadOfficialGuideData } from './engine/officialDataAdapter.js';
import { getApNote, getRecommendedSkillAllocation, getSkillPlan } from './engine/skillPlanner.js';
import './styles/dashboard.css';
import './styles/character-dashboard.css';
import './styles/skill-gating.css';
import './styles/dashboard-pc.css';

const TABS = [['overview', '总览'], ['character', '角色'], ['maps', '地图'], ['monsters', '怪物'], ['quests', '任务'], ['materials', '材料']];
const JOBS = [['warrior', '战士'], ['magician', '魔法师'], ['bowman', '弓箭手'], ['thief', '飞侠'], ['pirate', '海盗']].map(([id, name]) => ({ id, name }));
const BUDGETS = [['low', '低资金'], ['mid', '普通'], ['high', '有钱']].map(([id, name]) => ({ id, name }));
const PRIORITIES = [['stable', '稳定'], ['exp', '经验'], ['material', '材料'], ['meso', '金币']].map(([id, name]) => ({ id, name }));
const SLOTS = [
  ['weapon', '武器'], ['cap', '头盔'], ['overall', '套服'], ['top', '上衣'], ['bottom', '下衣'],
  ['shoes', '鞋子'], ['glove', '手套'], ['shield', '盾牌'], ['cape', '披风'], ['earring', '耳环'],
];
const emptyData = { items: [], maps: [], monsters: [], recipes: [], materials: [], skillGroups: [] };
const tabIds = new Set(TABS.map(([id]) => id));
const STORAGE_KEY = 'mscw-guidebook-state-v2';

function readSavedState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getInitialTab(saved = readSavedState()) {
  if (typeof window === 'undefined') return 'overview';
  const hashTab = window.location.hash.replace(/^#/, '');
  if (tabIds.has(hashTab)) return hashTab;
  return tabIds.has(saved.tab) ? saved.tab : 'overview';
}

function getSavedChoice(saved, key, fallback, allowed = null) {
  const value = saved?.[key];
  if (allowed && !allowed.includes(value)) return fallback;
  return value ?? fallback;
}

function getSavedNumber(saved, key, fallback) {
  const value = Number(saved?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function hasSkillAllocationMatch(allocation, recommended) {
  if (!allocation || typeof allocation !== 'object') return false;
  return Object.keys(recommended ?? {}).some((name) => Object.prototype.hasOwnProperty.call(allocation, name));
}

export default function AppMediaEnhanced() {
  const savedRef = useRef(readSavedState());
  const saved = savedRef.current;
  const [tab, setTab] = useState(() => getInitialTab(saved));
  const [editionId, setEditionId] = useState(() => getSavedChoice(saved, 'editionId', 'global', EDITIONS.map((x) => x.id)));
  const [classId, setClassId] = useState(() => getSavedChoice(saved, 'classId', 'magician', CLASS_LINES.map((x) => x.id)));
  const [branchId, setBranchId] = useState(() => getSavedChoice(saved, 'branchId', 'magician'));
  const [gender, setGender] = useState(() => getSavedChoice(saved, 'gender', 'female', ['male', 'female']));
  const [level, setLevel] = useState(() => getSavedNumber(saved, 'level', 25));
  const [budget, setBudget] = useState(() => getSavedChoice(saved, 'budget', 'low', BUDGETS.map((x) => x.id)));
  const [priority, setPriority] = useState(() => getSavedChoice(saved, 'priority', 'material', PRIORITIES.map((x) => x.id)));
  const [apAllocation, setApAllocation] = useState(() => saved.apAllocation ?? null);
  const [skillAllocation, setSkillAllocation] = useState(() => saved.skillAllocation ?? null);
  const [gearOverrides, setGearOverrides] = useState(() => saved.gearOverrides ?? {});
  const [pickerSlot, setPickerSlot] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const didInitAp = useRef(false);
  const didInitSkill = useRef(false);
  const didInitGearReset = useRef(false);
  const didInitStorage = useRef(false);

  useEffect(() => {
    loadOfficialGuideData().then(setData).catch((e) => setError(e.message || '官方数据读取失败'));
  }, []);

  const edition = EDITIONS.find((x) => x.id === editionId) ?? EDITIONS[0];
  const minLevel = edition.minLevel ?? 10;
  const maxLevel = edition.maxLevel ?? 50;
  const activeData = !data
    ? emptyData
    : edition.dataSource === 'cms-china'
      ? (data.byEdition?.china ?? emptyData)
      : (data.byEdition?.global ?? data);
  const skillGroups = activeData.skillGroups ?? [];
  const classes = CLASS_LINES.filter((x) => edition.classIds.includes(x.id));
  const classLine = classes.find((x) => x.id === classId) ?? classes[0];
  const branch = classLine.branches.find((x) => x.id === branchId) ?? classLine.branches[0] ?? classLine;

  useEffect(() => setLevel((v) => Math.min(maxLevel, Math.max(minLevel, v))), [minLevel, maxLevel]);
  useEffect(() => {
    if (!classes.some((x) => x.id === classId)) setClassId(classes[0]?.id ?? 'warrior');
    if (!classLine.branches.some((x) => x.id === branchId)) setBranchId(classLine.branches[0]?.id ?? classLine.id);
  }, [classes, classId, branchId, classLine]);
  useEffect(() => {
    if (!didInitAp.current) { didInitAp.current = true; return; }
    setApAllocation(getRecommendedApAllocation(classLine, level, { budget }));
  }, [classLine, level, budget]);
  useEffect(() => {
    if (!didInitSkill.current) { didInitSkill.current = true; return; }
    setSkillAllocation(getRecommendedSkillAllocation({ classId: classLine.id, branchId: branch.id, level, budget, skillGroups }));
  }, [classLine, branch, level, budget, skillGroups]);
  useEffect(() => {
    if (!didInitGearReset.current) { didInitGearReset.current = true; return; }
    setGearOverrides({});
    setPickerSlot(null);
  }, [editionId, classId, branchId, gender, level, budget]);

  const recommendedApAllocation = useMemo(() => getRecommendedApAllocation(classLine, level, { budget }), [classLine, level, budget]);
  const effectiveApAllocation = apAllocation ?? recommendedApAllocation;
  const recommendedSkillAllocation = useMemo(() => getRecommendedSkillAllocation({ classId: classLine.id, branchId: branch.id, level, budget, skillGroups }), [classLine, branch, level, budget, skillGroups]);
  const effectiveSkillAllocation = hasSkillAllocationMatch(skillAllocation, recommendedSkillAllocation) ? skillAllocation : recommendedSkillAllocation;
  const skillPlanForStats = useMemo(
    () => getSkillPlan({ classId: classLine.id, branchId: branch.id, level, budget, mainAttack: 0, customSkills: effectiveSkillAllocation, skillGroups }),
    [classLine, branch, level, budget, effectiveSkillAllocation, skillGroups],
  );
  const statPlan = useMemo(() => buildStatPlan(classLine, level, { budget, apAllocation: effectiveApAllocation, skillBonuses: skillPlanForStats.statBonuses }), [classLine, level, budget, effectiveApAllocation, skillPlanForStats]);
  const recommendedGear = useMemo(() => selectGear({ classLine, branch, level, budget, gender, statPlan, items: activeData.items }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const candidatesBySlot = useMemo(() => getGearCandidatesBySlot({ classLine, branch, level, budget, gender, statPlan, items: activeData.items, manualMode: true }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const gear = useMemo(() => applyGearOverrides(recommendedGear, gearOverrides), [recommendedGear, gearOverrides]);
  const weapon = gear.find((x) => x.slot === 'weapon');
  const mainAttack = useMemo(() => calcMainAttack(classLine, statPlan, gear), [classLine, statPlan, gear]);
  const stats = useMemo(() => compactStats(statPlan, classLine, gear), [statPlan, classLine, gear]);
  const skillPlan = useMemo(() => getSkillPlan({ classId: classLine.id, branchId: branch.id, level, budget, mainAttack, customSkills: effectiveSkillAllocation, skillGroups }), [classLine, branch, level, budget, mainAttack, effectiveSkillAllocation, skillGroups]);
  const baseMaps = useMemo(
    () => getMapRecommendations({ classLine, branch, level, statPlan, budget, priority, maps: activeData.maps, monsters: activeData.monsters, gear }),
    [classLine, branch, level, statPlan, budget, priority, activeData, gear],
  );
  const maps = useMemo(
    () => rankLevelingMapsByBreakpoints({ maps: baseMaps, level, budget, priority, skillPlan, mainAttack, items: activeData.items }).slice(0, 8),
    [baseMaps, level, budget, priority, skillPlan, mainAttack, activeData.items],
  );
  const bestMap = maps[0];
  const bestMonster = bestMap?.monsters?.[0];
  const apNote = useMemo(() => getApNote({ classLine, statPlan, budget }), [classLine, statPlan, budget]);
  const controls = { edition, editionId, setEditionId, classId, setClassId, branchId, setBranchId, gender, setGender, level, setLevel, budget, setBudget, priority, setPriority, classes, classLine, minLevel, maxLevel };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!didInitStorage.current) { didInitStorage.current = true; }
    const next = { tab, editionId, classId, branchId, gender, level, budget, priority, apAllocation, skillAllocation, gearOverrides };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore storage failures */ }
  }, [tab, editionId, classId, branchId, gender, level, budget, priority, apAllocation, skillAllocation, gearOverrides]);

  const chooseGear = (slot, item) => {
    setGearOverrides((old) => {
      const next = { ...old, [slot]: item };
      if (slot === 'overall') {
        delete next.top;
        delete next.bottom;
      }
      if (slot === 'top' || slot === 'bottom') delete next.overall;
      return next;
    });
    setPickerSlot(null);
  };

  const openGearPicker = (slot) => setPickerSlot(slot);

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
    const tierUsed = skillPlan.skills.filter((item) => item.tier === skill.tier).reduce((sum, item) => sum + item.level, 0);
    setSkillAllocation((current) => {
      const base = hasSkillAllocationMatch(current, recommendedSkillAllocation) ? current : recommendedSkillAllocation;
      const next = { ...base };
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
    <AppHeaderBar tab={tab} onTabChange={changeTab} classLine={classLine} level={level} />
    <MobileTabBar tab={tab} onTabChange={changeTab} />
    {tab === 'overview' && <Dashboard controls={controls} classLine={classLine} branch={branch} gender={gender} level={level} bestMonster={bestMonster} bestMap={bestMap} maps={maps} weapon={weapon} gear={gear} stats={stats} skillPlan={skillPlan} statPlan={statPlan} effectiveApAllocation={effectiveApAllocation} candidatesBySlot={candidatesBySlot} items={activeData.items} budget={budget} onPickSlot={openGearPicker} onOpenMaps={() => changeTab('maps')} onApChange={changeAp} />}
    {tab === 'character' && <SkillPanel plan={skillPlan} apNote={apNote} statPlan={statPlan} classLine={classLine} gender={gender} gear={gear} level={level} weapon={weapon} apAllocation={effectiveApAllocation} onApChange={changeAp} onApReset={resetAp} onSkillChange={changeSkill} onSkillReset={resetSkills} />}
    {tab === 'maps' && <MapsPage maps={maps} data={activeData} />}
    {tab === 'monsters' && <MonsterReportPage data={activeData} />}
    {tab === 'quests' && <QuestPage level={level} classLine={classLine} quests={activeData.quests} />}
    {tab === 'materials' && <MaterialsPage data={activeData} />}
    {pickerSlot && <GearPicker slot={pickerSlot} items={candidatesBySlot[pickerSlot] ?? []} current={gear.find((item) => item.slot === pickerSlot)} onChoose={(item) => chooseGear(pickerSlot, item)} onClose={() => setPickerSlot(null)} />}
    {error && <p className="load-error">官方数据读取提示：{error}</p>}
  </main>;
}

function Dashboard({ controls, classLine, branch, gender, level, bestMonster, bestMap, maps, weapon, gear, stats, skillPlan, statPlan, effectiveApAllocation, candidatesBySlot, items, budget, onPickSlot, onOpenMaps, onApChange }) {
  const buildId = `${classLine.id.toUpperCase()}-${String(level).padStart(3, '0')}`;
  const today = new Date().toISOString().slice(0, 10);
  return <section className="mg-dashboard">
    <h1 className="mg-dashboard-title">MapleGuide: {classLine.name}开荒仪表盘</h1>
    <p className="mg-dashboard-subtitle">根据你的配置，为你推荐最佳路线与成长方案</p>
    <div className="mg-dashboard-grid">
      <div className="mg-left-stack">
        <ConfigPanel {...controls} />
        <ApAllocatorPanel classLine={classLine} apAllocation={effectiveApAllocation} statPlan={statPlan} onApChange={onApChange} />
        <DashboardEquipmentSlots gear={gear} candidatesBySlot={candidatesBySlot} onPickSlot={onPickSlot} />
      </div>
      <div className="mg-center-stack">
        <header className="mg-main-card-title">
          <div>
            <h1>MapleGuide: {classLine.name}开荒仪表盘</h1>
            <p>根据你的配置，为你推荐最佳路线与成长方案</p>
          </div>
          <div className="mg-main-card-meta">
            <span>Build ID</span>
            <strong>#{buildId}</strong>
            <span>最后更新</span>
            <strong>{today}</strong>
          </div>
        </header>
        <PreviewPanel classLine={classLine} branch={branch} gender={gender} level={level} weapon={weapon} gear={gear} stats={stats} />
        <OverviewDamagePanel classLine={classLine} skillPlan={skillPlan} />
      </div>
      <div className="mg-right-stack">
        <StatusPanel bestMonster={bestMonster} bestMap={bestMap} onOpenMaps={onOpenMaps} />
        <GrowthRoutePanel maps={maps} level={level} onOpenMaps={onOpenMaps} />
        <MonsterPickPanel bestMap={bestMap} onOpenMaps={onOpenMaps} />
      </div>
    </div>
    <div className="mg-bottom-row">
      <NextActionsPanel classLine={classLine} level={level} bestMap={bestMap} bestMonster={bestMonster} gear={gear} candidatesBySlot={candidatesBySlot} />
      <WhyThisMapPanel bestMap={bestMap} level={level} classLine={classLine} />
    </div>
    <DashboardFooter />
    <div className="mg-copyright-row">
      <span>© 2026 MapleGuide | 枫叶冒险者指南站</span>
      <span>数据仅供参考 — 请以游戏内实际数据为准</span>
    </div>
    <div className="mg-actions">
      <button className="mg-action-small">分享</button>
      <button className="mg-action-main">更新推荐 / 生成路线</button>
      <button className="mg-action-small">复制</button>
    </div>
    <p className="mg-footer">© 2026 MapleGuide | by SduckyDuck</p>
  </section>;
}

function MobileTabBar({ tab, onTabChange }) {
  const tabs = [['overview','总览'],['character','角色'],['maps','地图'],['monsters','怪物'],['quests','任务'],['materials','材料']];
  return (
    <nav className="top-tabs mg-mobile-tabs">
      {tabs.map(([id, name]) => (
        <button key={id} type="button" className={tab === id ? 'top-tab active' : 'top-tab'} onClick={() => onTabChange(id)}>
          {name}
        </button>
      ))}
    </nav>
  );
}

function AppHeaderBar({ tab, onTabChange, classLine, level }) {
  const tabs = [
    ['overview', '总览', 'OV'],
    ['character', '角色', 'CH'],
    ['maps', '地图', 'MP'],
    ['monsters', '怪物', 'MN'],
    ['quests', '任务', 'Q'],
    ['materials', '材料', 'MT'],
  ];
  return <header className="mg-app-header-bar" role="navigation">
    <div className="mg-app-brand">
      <div className="mg-app-brand-logo" aria-hidden>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12 2l1.6 4.4 4.4-.4-2.4 3.7 3.4 2.9-4.4 1.1 1.1 4.4-3.7-2.4-3.7 2.4 1.1-4.4-4.4-1.1 3.4-2.9-2.4-3.7 4.4.4z"/></svg>
      </div>
      <div className="mg-app-brand-text">
        <span className="mg-app-brand-title">MapleGuide</span>
        <span className="mg-app-brand-sub">{classLine?.name ?? '战士'}开荒仪表盘</span>
      </div>
    </div>
    <div className="mg-app-header-tabs" role="tablist">
      {tabs.map(([id, name, icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          className={tab === id ? 'mg-app-header-tab active' : 'mg-app-header-tab'}
          onClick={() => onTabChange(id)}
        >
          <span className="mg-app-header-tab-icon" aria-hidden>{icon}</span>
          <span>{name}</span>
        </button>
      ))}
    </div>
    <div className="mg-app-header-right">
      <label className="mg-app-search">
        <input type="search" placeholder="搜索地图 / 怪物 / 材料..." aria-label="搜索" />
      </label>
      <button className="mg-app-bell" type="button" aria-label="通知">!</button>
      <div className="mg-app-profile">
        <div className="mg-app-profile-avatar" aria-hidden>{classLine?.name?.[0] ?? '冒'}</div>
        <div className="mg-app-profile-text">
          <span className="mg-app-profile-name">冒险家</span>
          <span className="mg-app-profile-meta">Lv.{level} {classLine?.name ?? ''}</span>
        </div>
      </div>
    </div>
  </header>;
}

function ApAllocatorPanel({ classLine, apAllocation, statPlan, onApChange }) {
  const stats = ['STR', 'DEX', 'INT', 'LUK'];
  const labels = { STR: '力量 (STR)', DEX: '敏捷 (DEX)', INT: '智力 (INT)', LUK: '运气 (LUK)' };
  const used = stats.reduce((sum, k) => sum + Math.max(0, Number(apAllocation?.[k] ?? 0)), 0);
  const remaining = Math.max(0, (statPlan?.totalAp ?? 0) - used);
  return <section className="mg-glass-panel mg-ap-allocator">
    <div className="mg-ap-head">
      <h2 className="mg-panel-title">属性加点</h2>
      <span>可用点数: {remaining}</span>
    </div>
    <div className="mg-ap-list">
      {stats.map((stat) => {
        const added = Number(apAllocation?.[stat] ?? 0);
        const total = Number(statPlan?.stats?.[stat] ?? 0);
        return <div className="mg-ap-row" key={stat}>
          <label>{labels[stat]}</label>
          <div className="mg-ap-value">{total}</div>
          <button type="button" onClick={() => onApChange(stat, -1)} disabled={added <= 0} aria-label={`减少 ${stat}`}>−</button>
          <button type="button" onClick={() => onApChange(stat, 1)} disabled={remaining <= 0} aria-label={`增加 ${stat}`}>+</button>
        </div>;
      })}
    </div>
  </section>;
}

function ClassLevelStrip({ classLine, branch, level }) {
  const progress = ((level % 1) === 0 ? 38.7 : 0);
  const branchTheme = branch?.theme ?? classLine?.role ?? '';
  return <div className="mg-class-strip" role="group">
    <div className="mg-class-strip-left">
      <div className="mg-class-strip-badge" aria-hidden>JOB</div>
      <div className="mg-class-strip-text">
        <strong>{classLine?.name ?? '战士'}</strong>
        <span>{branchTheme || (classLine?.role ?? '')}</span>
      </div>
    </div>
    <div className="mg-class-progress" style={{ minWidth: 180 }}>
      <div className="mg-class-progress-bar" aria-hidden>
        <div className="mg-class-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="mg-class-progress-meta">
        <span>当前经验值 <strong>{progress.toFixed(1)}%</strong></span>
        <span>距下一级 (Lv.{level + 1})</span>
      </div>
    </div>
    <div className="mg-class-strip-level">Lv.{level}</div>
  </div>;
}

function GrowthRoutePanel({ maps, level, onOpenMaps }) {
  const stages = useMemo(() => buildGrowthStages(maps, level), [maps, level]);
  if (!stages.length) return null;
  return <section className="mg-glass-panel mg-route-panel">
    <div className="mg-route-head">
      <h2 className="mg-panel-title">成长路线建议</h2>
      <button type="button" onClick={onOpenMaps}>查看更多</button>
    </div>
    <div className="mg-route-list">
      {stages.map((stage) => <article className={stage.kind === 'current' ? 'mg-route-row is-current' : 'mg-route-row'} key={stage.id}>
        <div className="mg-route-icon">
          {stage.thumbnail
            ? <OsmsDataImage src={stage.thumbnail} sources={[stage.minimap]} alt={stage.label} placeholder="Map" />
            : <span>MAP</span>}
        </div>
        <div className="mg-route-text">
          <strong>{stage.label}</strong>
          <span>{stage.name}</span>
        </div>
        <span className={`mg-route-badge is-${stage.kind}`}>{stage.badgeLabel}</span>
      </article>)}
    </div>
  </section>;
}

function MonsterPickPanel({ bestMap, onOpenMaps }) {
  const monsters = (bestMap?.monsters ?? []).slice(0, 3);
  if (!monsters.length) return null;
  const tags = ['经验高', '掉率良好', '寄居出', '稳定推'];
  return <section className="mg-glass-panel mg-monster-pick-panel">
    <div className="mg-monster-pick-head">
      <h2 className="mg-panel-title">怪物推荐</h2>
      <button type="button" onClick={onOpenMaps}>查看更多</button>
    </div>
    <div className="mg-monster-pick-grid">
      {monsters.map((monster, index) => <article className="mg-monster-pick" key={monster.id ?? monster.name}>
        <div className="mg-monster-pick-icon">
          <MonsterIcon monster={monster} size={50} />
        </div>
        <strong>{monster.name ?? '推荐怪'}</strong>
        <span>Lv.{monster.level ?? '-'}</span>
        <em>{tags[index] ?? '推荐'}</em>
      </article>)}
    </div>
  </section>;
}

const CLASS_PRIMARY_STAT = { warrior: 'STR', magician: 'INT', bowman: 'DEX', thief: 'LUK', pirate: 'STR' };
const CLASS_ACCURACY_STAT = { warrior: 'DEX', magician: 'INT', bowman: 'STR', thief: 'DEX', pirate: 'DEX' };
const SLOT_LABELS = { weapon: '武器', cap: '帽子', overall: '套服', top: '上衣', bottom: '裤子', shoes: '鞋子', glove: '手套', cape: '披风', earring: '耳环', shield: '盾牌' };

function computeNextActions({ classLine, level, bestMap, bestMonster, gear, candidatesBySlot }) {
  const actions = [];

  const monsterName = bestMonster?.name ?? bestMap?.monsters?.[0]?.name;
  if (bestMap?.name) {
    const grindText = monsterName ? `去 ${bestMap.name} 打 ${monsterName}` : `去 ${bestMap.name} 练级`;
    const grindDetail = bestMap.score != null ? `综合评分 ${Math.round(bestMap.score)}` : null;
    actions.push({ id: 'grind', text: grindText, detail: grindDetail });
  }

  const topMonster = bestMap?.monsters?.[0];
  const hitRate = bestMonster?.hitRate ?? topMonster?.hitRate ?? null;
  const classId = classLine?.id ?? 'warrior';
  const primaryStat = CLASS_PRIMARY_STAT[classId] ?? 'STR';
  const accStat = CLASS_ACCURACY_STAT[classId] ?? 'DEX';
  if (hitRate !== null && hitRate < 0.95) {
    actions.push({ id: 'ap', text: `下一点 AP 加 ${accStat}`, detail: `当前命中率 ${Math.round(hitRate * 100)}%，低于 95%` });
  } else {
    const detail = hitRate !== null ? `命中率 ${Math.round(hitRate * 100)}%，继续堆主属性` : `堆主属性 ${primaryStat}`;
    actions.push({ id: 'ap', text: `下一点 AP 加 ${primaryStat}`, detail });
  }

  const currentBySlot = Object.fromEntries((gear ?? []).map((g) => [g.slot, g]));
  let bestSlot = null;
  let bestItem = null;
  let bestGap = 0;
  for (const [slot, candidates] of Object.entries(candidatesBySlot ?? {})) {
    if (!candidates?.length) continue;
    const top = candidates[0];
    const current = currentBySlot[slot];
    if (!current) continue;
    const gap = Number(top?.reqLevel ?? 0) - Number(current?.reqLevel ?? 0);
    if (gap > bestGap) { bestGap = gap; bestSlot = slot; bestItem = top; }
  }
  if (bestSlot && bestItem) {
    const slotName = SLOT_LABELS[bestSlot] ?? bestSlot;
    const itemName = bestItem.title ?? bestItem.name ?? slotName;
    actions.push({ id: 'gear', text: `优先换 Lv.${bestItem.reqLevel} ${slotName}「${itemName}」`, detail: `比当前装备高 ${bestGap} 级` });
  }

  return actions;
}

function NextActionsPanel({ classLine, level, bestMap, bestMonster, gear, candidatesBySlot }) {
  const actions = useMemo(
    () => computeNextActions({ classLine, level, bestMap, bestMonster, gear, candidatesBySlot }),
    [classLine, level, bestMap, bestMonster, gear, candidatesBySlot],
  );
  if (!actions.length) return null;
  return (
    <section className="mg-next-actions-panel mg-bottom-panel">
      <div className="mg-bottom-panel-head">
        <h2>你现在该做什么</h2>
        <span>推荐行动</span>
      </div>
      <ol className="mg-next-actions-list">
        {actions.map((action, i) => (
          <li key={action.id} className="mg-next-action-item">
            <span className="mg-next-action-num">{i + 1}</span>
            <div className="mg-next-action-body">
              <strong>{action.text}</strong>
              {action.detail && <span>{action.detail}</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WhyThisMapPanel({ bestMap, level, classLine }) {
  if (!bestMap) return null;
  const bullets = [];
  const topMonster = bestMap.monsters?.[0];

  const lvMin = bestMap.levelRange?.[0] ?? bestMap.level ?? null;
  const lvMax = bestMap.levelRange?.[1] ?? null;
  if (lvMin != null) {
    const rangeStr = lvMax ? `Lv.${lvMin}–${lvMax}` : `Lv.${lvMin}+`;
    bullets.push({ label: '等级差', value: `你 Lv.${level} vs ${rangeStr}`, highlight: '' });
  }

  const hitRate = topMonster?.hitRate ?? (bestMap.canHitAll ? 1 : null);
  if (hitRate !== null) {
    const pct = Math.round(hitRate * 100);
    bullets.push({ label: '命中率', value: `${pct}%`, highlight: hitRate >= 0.99 ? 'good' : hitRate >= 0.85 ? 'ok' : 'warn' });
  }

  const densityScore = bestMap.scoreParts?.density ?? null;
  if (densityScore !== null) {
    bullets.push({ label: '怪物密度', value: densityScore >= 70 ? '高' : densityScore >= 40 ? '中' : '低', highlight: densityScore >= 70 ? 'good' : 'ok' });
  }

  const safetyScore = bestMap.scoreParts?.safety ?? null;
  if (safetyScore !== null) {
    bullets.push({ label: '药水消耗', value: safetyScore >= 70 ? '低' : safetyScore >= 40 ? '中' : '高', highlight: safetyScore >= 70 ? 'good' : safetyScore >= 40 ? 'ok' : 'warn' });
  }

  const classFit = bestMap.scoreParts?.classFit ?? null;
  if (classFit !== null) {
    const fitLabel = classFit >= 70 ? '非常适合' : classFit >= 40 ? '一般' : '勉强';
    bullets.push({ label: `适合${classLine?.name ?? ''}`, value: fitLabel, highlight: classFit >= 70 ? 'good' : 'ok' });
  }

  if (bestMap.warning) {
    bullets.push({ label: '注意', value: bestMap.warning, highlight: 'warn' });
  }

  return (
    <section className="mg-why-map-panel mg-bottom-panel">
      <div className="mg-bottom-panel-head">
        <h2>为什么推荐 {bestMap.name}？</h2>
        <span>评分 {Math.round(bestMap.score ?? 0)}</span>
      </div>
      <ul className="mg-why-map-list">
        {bullets.map((b) => (
          <li key={b.label} className={`mg-why-map-row${b.highlight ? ` is-${b.highlight}` : ''}`}>
            <span className="mg-why-map-label">{b.label}</span>
            <span className="mg-why-map-value">{b.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DashboardFooter() {
  return <footer className="mg-dashboard-footer">
    <div className="mg-dashboard-tip">
      <div className="mg-dashboard-tip-badge" aria-hidden>i</div>
      <span className="mg-dashboard-tip-text">小贴士：合理分配属性点与技能点，优先提升攻击力与生存能力！</span>
    </div>
    <button type="button" className="mg-dashboard-footer-btn is-primary">保存当前配置</button>
    <button type="button" className="mg-dashboard-footer-btn is-secondary">导出 Build</button>
    <button type="button" className="mg-dashboard-footer-btn is-secondary">分享 Build</button>
  </footer>;
}

function buildGrowthStages(maps, level) {
  const stagesDef = [
    { lo: 30, hi: 40, label: 'Lv.30 - 40' },
    { lo: 40, hi: 50, label: 'Lv.40 - 50' },
    { lo: 50, hi: 60, label: 'Lv.50 - 60' },
    { lo: 60, hi: 999, label: 'Lv.60+' },
  ];
  const fallbackNames = ['蚂蚁洞 / 火野猪', '玩具城 / 时间通道', '天空之城 / 星光精灵', '神木村 / 木妖'];
  return stagesDef.map((stage, index) => {
    const map = (maps ?? []).find((entry) => {
      const range = entry?.levelRange ?? [];
      const lo = Number(range[0] ?? 0);
      const hi = Number(range[1] ?? 0);
      return lo >= stage.lo && lo < stage.hi || (lo < stage.hi && hi >= stage.lo);
    });
    const inStage = level >= stage.lo && level < stage.hi;
    const isFuture = level < stage.lo;
    const kind = inStage ? 'current' : (isFuture ? 'advanced' : 'recommended');
    const badgeLabel = inStage ? '当前阶段' : (isFuture ? '进阶' : '推荐');
    return {
      id: `${stage.lo}-${stage.hi}`,
      label: stage.label,
      name: map?.name ?? map?.region ?? fallbackNames[index] ?? '推荐地图',
      thumbnail: map?.thumbnail,
      minimap: map?.minimap,
      kind,
      badgeLabel,
    };
  });
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

function getSlotSwapHint(slot, by) {
  if ((slot === 'top' || slot === 'bottom') && by.overall) return `点击换${slot === 'top' ? '上衣' : '下衣'}`;
  if (slot === 'overall' && (by.top || by.bottom)) return '点击换套服';
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
        const swapHint = getSlotSwapHint(slot, by);
        const interactive = hasCandidates || Boolean(swapHint);
        const displayTitle = item?.title ?? swapHint ?? conflict ?? '未装备';
        const className = ['mg-equip-tile', conflict ? 'conflict' : '', swapHint ? 'smart-swap' : ''].filter(Boolean).join(' ');
        return <button className={className} key={slot} onClick={() => onPickSlot(slot)} disabled={!interactive} title={swapHint || conflict || label}>
          <MsioItemIcon item={item} size={30} />
          <span>{label}</span>
          <strong>{displayTitle}</strong>
        </button>;
      })}
    </div>
  </section>;
}

function StatusPanel({ bestMonster, bestMap, onOpenMaps }) {
  const hitValue = Number(bestMonster?.hitPercent);
  const hitText = Number.isFinite(hitValue) ? `${hitValue}%` : bestMap?.canHitAll ? '100%' : '偏紧';
  const mapLevel = bestMap?.levelRange ? `Lv.${bestMap.levelRange[0]} - ${bestMap.levelRange[1]}` : '';
  const monsterLevel = bestMonster?.level ? `Lv.${bestMonster.level}` : '';
  const monsterRange = (bestMap?.monsters ?? []).reduce((acc, m) => {
    const lv = Number(m?.level ?? 0);
    if (!lv) return acc;
    return [Math.min(acc[0] ?? lv, lv), Math.max(acc[1] ?? lv, lv)];
  }, [null, null]);
  const expScore = bestMap?.scoreParts?.exp != null ? `${Math.round(Math.max(0, Math.min(1, bestMap.scoreParts.exp / 100)) * 100)}%` : '100%';
  const dropRate = '良好';
  const danger = bestMap?.warning ? '中' : (Number(bestMonster?.deathRisk ?? 0) > 0.1 ? '高' : '低');
  const stars = '5/5';
  return <button type="button" className="mg-status-panel mg-status-link" onClick={onOpenMaps}>
    <h2 className="mg-panel-title">地图刷怪推荐</h2>
    <div className="mg-status-route">
      <div className="mg-status-route-icon" aria-hidden>MAP</div>
      <div className="mg-status-route-text">
        <span className="mg-status-route-label">推荐地图</span>
        <span className="mg-status-route-name">{bestMap?.name ?? '读取中'} {bestMonster?.name ? `/ ${bestMonster.name}` : ''}</span>
      </div>
    </div>
    <div className="mg-status-row">
      <div>
        <div className="mg-status-line mg-status-monster"><MonsterIcon monster={bestMonster} size={42} /> <span>优先打</span><strong>{bestMonster?.name ?? '推荐怪物'}</strong></div>
        <div className="mg-status-line mg-status-map"><span>推荐地图</span><strong>{bestMap?.name ?? '读取中'}</strong></div>
        <div className="mg-status-line"><span>命中</span><strong>{hitText}</strong><span>刷怪数</span><strong>{bestMap?.spawnTotal ?? '-'}</strong></div>
        {(mapLevel || monsterLevel) && <div className="mg-status-line">{mapLevel && <><span>推荐等级</span><strong>{mapLevel}</strong></>}{monsterRange[0] && monsterRange[1] && <><span>怪物等级</span><strong>Lv.{monsterRange[0]} - {monsterRange[1]}</strong></>}</div>}
      </div>
      {bestMap?.thumbnail && <OsmsDataImage className="mg-map-thumb" src={bestMap.thumbnail} sources={[bestMap.minimap]} alt={bestMap.name} placeholder="Map" />}
    </div>
    <div className="mg-status-meta">
      <div className="mg-status-chip"><span className="mg-status-chip-label">经验值</span><span className="mg-status-chip-value">{expScore}</span></div>
      <div className="mg-status-chip"><span className="mg-status-chip-label">掉率</span><span className="mg-status-chip-value">{dropRate}</span></div>
      <div className="mg-status-chip"><span className="mg-status-chip-label">危险度</span><span className="mg-status-chip-value">{danger}</span></div>
      <div className="mg-status-chip"><span className="mg-status-chip-label">玩家推荐</span><span className="mg-status-chip-value is-stars">{stars}</span></div>
    </div>
  </button>;
}

function PreviewPanel({ classLine, branch, gender, level, weapon, gear, stats }) {
  return <section className="mg-preview-card no-rail">
    <div className="mg-preview-main">
      <div className="mg-character-column">
        <div className="mg-character-frame"><CharacterPreview classLine={classLine} gender={gender} gear={gear} /></div>
        <ClassLevelStrip classLine={classLine} branch={branch} level={level} />
      </div>
      <div className="mg-stats-card">
        <h3 className="mg-stats-title">角色属性</h3>
        <div className="mg-stats-grid">{stats.map((stat) => <div className={`mg-stat-box stat-${String(stat.label).toLowerCase()}`} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong>{stat.bonus ? <small className="mg-stat-breakdown">({stat.base}+{stat.bonus})</small> : null}</div>)}</div>
      </div>
      <div className="preview-meta"><strong>{classLine.name} Lv.{level}</strong><span>{weapon?.title ?? '装备读取中'}</span></div>
    </div>
  </section>;
}

function OverviewDamagePanel({ classLine, skillPlan }) {
  const cards = useMemo(() => {
    const all = skillPlan?.damageCards ?? [];
    const base = all.find((card) => card.isBase);
    const skillCards = all
      .filter((card) => !card.isBase)
      .sort((a, b) => Number(b.max ?? 0) - Number(a.max ?? 0))
      .slice(0, 2);
    return classLine?.id === 'magician' ? skillCards : [base, ...skillCards].filter(Boolean);
  }, [classLine?.id, skillPlan]);

  if (!cards.length) return null;

  return <section className="mg-overview-damage-card">
    <div className="mg-overview-damage-head">
      <h2>技能伤害</h2>
      <span>{classLine?.id === 'magician' ? '最高 2 项技能' : '普攻 + 最高 2 项'}</span>
    </div>
    <div className="mg-overview-damage-list">
      {cards.map((card) => <OverviewDamageRow key={card.name} card={card} />)}
    </div>
  </section>;
}

function OverviewDamageRow({ card }) {
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

function GearPicker({ slot, items, current, onChoose, onClose }) {
  const label = SLOTS.find(([id]) => id === slot)?.[1] ?? slot;
  const hint = slot === 'overall'
    ? '选择套服后，会自动脱下当前上衣和下衣。'
    : (slot === 'top' || slot === 'bottom')
      ? `选择${label}后，会自动脱下当前套服。`
      : '';
  return <div className="mg-picker-backdrop" onClick={onClose}>
    <div className="mg-picker-sheet" onClick={(event) => event.stopPropagation()}>
      <div className="mg-picker-head">
        <h2>选择{label}</h2>
        <button onClick={onClose}>关闭</button>
      </div>
      {hint && <p className="mg-picker-hint">{hint}</p>}
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
  return <Section title="推荐路线" className="mg-maps-section">
    <p className="section-copy">{data?.maps?.length ? '地图大图、怪物图和刷怪数来自当前国际服数据；卡片会优先展示当前等级最适合打的怪。' : '当前版本地图数据未启用。'}</p>
    <div className="mg-map-grid">
      {maps.map((map, index) => {
        const target = map.monsters?.[0];
        const expValue = target?.estimatedExpPerMp ?? '-';
        const potionValue = Number(target?.expectedPotionCost) > 0 ? `${target.expectedPotionCost} meso/只` : '低消耗';
        return <article className="mg-map-card mg-map-card-redesign" key={map.id}>
          <div className="mg-map-card-hero">
            {map.thumbnail && <OsmsDataImage className="mg-map-card-bg" src={map.thumbnail} sources={[map.minimap]} alt={map.name} placeholder="Map" />}
            <div className="mg-map-rank">#{index + 1}</div>
            <div className="mg-map-card-hero-copy">
              <span>Lv.{map.levelRange?.[0]}-{map.levelRange?.[1]} · {map.region}</span>
              <h3>{map.name}</h3>
            </div>
          </div>
          <div className="mg-map-card-body">
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
              {target?.bestSkillName && <span>{target.bestSkillName} {target.expectedCastsToKill ?? target.hitsToKill} 次</span>}
              {target?.estimatedExpPerMp && <span>EXP/MP {target.estimatedExpPerMp}</span>}
              {Number(target?.expectedPotionCost) > 0 && <span>药水 {target.expectedPotionCost} meso/只</span>}
              {Number(target?.maxIncomingDamage) > 0 && <span>最大伤害 {target.maxIncomingDamage}</span>}
              {Number(target?.deathRisk) > 0 && <span>死亡风险 {Math.round(target.deathRisk * 100)}%</span>}
            </div>
          </div>
          <div className="mg-map-card-footer">
            <span>EXP/MP <strong className="is-exp">{expValue}</strong></span>
            <span>药水 <strong className="is-meso">{potionValue}</strong></span>
          </div>
        </article>;
      })}
    </div>
  </Section>;
}

function QuestPage({ level, classLine, quests: questsProp }) {
  const [payload, setPayload] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('near');
  const [error, setError] = useState('');

  useEffect(() => {
    if (questsProp?.length > 0) return;
    let alive = true;
    fetch(`${baseUrl()}AppData/quests.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`quests.json ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (alive) setPayload(data);
      })
      .catch((err) => {
        if (alive) setError(err.message || '任务数据读取失败');
      });
    return () => { alive = false; };
  }, [questsProp]);

  const quests = useMemo(() => {
    if (questsProp?.length > 0) return questsProp;
    return Array.isArray(payload?.quests) ? payload.quests : [];
  }, [questsProp, payload]);
  const visibleQuests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quests
      .filter((quest) => {
        const minLevel = Number(quest.level_min ?? quest.chain_level_min ?? 0);
        const matchesFilter =
          filter === 'all' ||
          (filter === 'near' && minLevel <= level + 8 && minLevel >= Math.max(0, level - 12)) ||
          (filter === 'daily' && quest.is_daily) ||
          (filter === 'repeatable' && (quest.is_repeatable || quest.is_weekly));
        if (!matchesFilter) return false;
        if (!q) return true;
        return [quest.name, quest.parent, quest.region, quest.npc_name, quest.requirements]
          .some((value) => String(value ?? '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        const aLevel = Number(a.level_min ?? 0);
        const bLevel = Number(b.level_min ?? 0);
        if (filter === 'near') return Math.abs(aLevel - level) - Math.abs(bLevel - level) || aLevel - bLevel;
        return aLevel - bLevel || String(a.name).localeCompare(String(b.name));
      })
      .slice(0, 36);
  }, [quests, query, filter, level]);

  const totalRewards = visibleQuests.reduce((sum, quest) => sum + Number(quest.rewards_exp ?? 0), 0);
  const repeatableCount = quests.filter((quest) => quest.is_daily || quest.is_weekly || quest.is_repeatable).length;
  const filters = [
    ['near', '适合当前等级'],
    ['daily', '每日'],
    ['repeatable', '可重复'],
    ['all', '全部'],
  ];

  return <Section title="任务路线" className="mg-quest-section">
    <div className="mg-quest-hero">
      <div>
        <span>Quest Data</span>
        <h3>{classLine?.name ?? '冒险家'} Lv.{level} 任务板</h3>
        <p>使用 AppData/quests.json，按等级、每日与可重复任务筛选。</p>
      </div>
      <div className="mg-quest-kpis">
        <div><span>任务数</span><strong>{quests.length || '-'}</strong></div>
        <div><span>可重复</span><strong>{repeatableCount || '-'}</strong></div>
        <div><span>当前页经验</span><strong>{totalRewards.toLocaleString()}</strong></div>
      </div>
    </div>
    <div className="mg-quest-toolbar">
      <label>
        <span>搜索任务 / NPC / 地区</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nella / Olaf / Kerning..." />
      </label>
      <div className="mg-quest-filter-tabs" role="tablist">
        {filters.map(([id, label]) => <button key={id} type="button" className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}
      </div>
    </div>
    {error && <p className="load-error">任务数据读取提示：{error}</p>}
    <div className="mg-quest-grid">
      {visibleQuests.map((quest) => <QuestCard quest={quest} key={quest.id} />)}
      {!visibleQuests.length && <article className="mg-quest-empty"><strong>没有匹配任务</strong><span>换一个筛选或搜索关键词试试。</span></article>}
    </div>
  </Section>;
}

function QuestCard({ quest }) {
  const requirements = Array.isArray(quest.requirements_list) ? quest.requirements_list : [];
  const rewards = Array.isArray(quest.rewards) ? quest.rewards : [];
  const rewardText = [
    Number(quest.rewards_exp ?? 0) > 0 ? `EXP ${Number(quest.rewards_exp).toLocaleString()}` : '',
    Number(quest.rewards_money ?? 0) > 0 ? `${Number(quest.rewards_money).toLocaleString()} meso` : '',
    ...rewards.filter((reward) => reward.type === 'item').slice(0, 2).map((reward) => `${reward.name ?? 'Item'} x${reward.count ?? 1}`),
  ].filter(Boolean);
  const description = String(quest.description ?? '').split('\n').find(Boolean) ?? '任务描述待补充。';

  return <article className="mg-quest-card">
    <header>
      <div className="mg-quest-icon" aria-hidden>Q</div>
      <div>
        <span>{quest.region || 'Unknown'} · Lv.{quest.level_min ?? '-'}</span>
        <h3>{quest.name}</h3>
      </div>
      {(quest.is_daily || quest.is_weekly || quest.is_repeatable) && <em>{quest.is_daily ? '每日' : quest.is_weekly ? '每周' : '重复'}</em>}
    </header>
    <p>{description}</p>
    <div className="mg-quest-meta">
      <span>NPC <strong>{quest.npc_name || '-'}</strong></span>
      <span>系列 <strong>{quest.parent || quest.name}</strong></span>
    </div>
    <div className="mg-quest-lines">
      {(requirements.length ? requirements : [{ label: quest.requirements || '无前置需求' }]).slice(0, 3).map((row, index) => <span key={`${quest.id}-req-${index}`}>{row.label ?? row.name ?? row.type}</span>)}
    </div>
    <div className="mg-quest-rewards">
      {(rewardText.length ? rewardText : ['奖励未记录']).slice(0, 4).map((reward) => <span key={reward}>{reward}</span>)}
    </div>
  </article>;
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

function MaterialsPage() { return <CraftingMaterialsPageSafe />; }
function Section({ title, className = '', children }) { return <section className={['section-card', className].filter(Boolean).join(' ')}><h2>{title}</h2>{children}</section>; }

function statRow(label, base, bonus = 0) {
  const roundedBase = Math.round(Number(base) || 0);
  const roundedBonus = Math.round(Number(bonus) || 0);
  return { label, base: roundedBase, bonus: roundedBonus, value: roundedBase + roundedBonus };
}

function getGearValue(item, aliases) {
  for (const key of aliases) {
    const value = item?.[key] ?? item?.stats?.[key];
    if (value !== undefined && value !== null && value !== '') return Number(value) || 0;
  }
  return 0;
}

function getGearBonuses(gear = []) {
  return (gear ?? []).reduce((sum, item) => {
    sum.STR += getGearValue(item, ['incSTR', 'str']);
    sum.DEX += getGearValue(item, ['incDEX', 'dex']);
    sum.INT += getGearValue(item, ['incINT', 'int']);
    sum.LUK += getGearValue(item, ['incLUK', 'luk']);
    sum.HP += getGearValue(item, ['incMHP', 'incMaxHP', 'incHP', 'mhp', 'hp']);
    sum.MP += getGearValue(item, ['incMMP', 'incMaxMP', 'incMP', 'mmp', 'mp']);
    sum.ACC += getGearValue(item, ['incACC', 'accuracy', 'acc']);
    sum.WATK += getGearValue(item, ['incPAD', 'pad', 'watk']);
    sum.MATK += getGearValue(item, ['incMAD', 'mad', 'matk']);
    return sum;
  }, { STR: 0, DEX: 0, INT: 0, LUK: 0, HP: 0, MP: 0, ACC: 0, WATK: 0, MATK: 0 });
}

function compactStats(statPlan, classLine, gear = []) {
  const bonuses = getGearBonuses(gear);
  const attackLabel = classLine.id === 'magician' ? 'MATK' : 'WATK';
  const baseAttack = calcMainAttack(classLine, statPlan, []);
  const totalAttack = calcMainAttack(classLine, statPlan, gear);
  return [
    statRow('STR', statPlan.stats.STR, bonuses.STR),
    statRow('DEX', statPlan.stats.DEX, bonuses.DEX),
    statRow('INT', statPlan.stats.INT, bonuses.INT),
    statRow('LUK', statPlan.stats.LUK, bonuses.LUK),
    statRow('ACC', statPlan.derived.accuracy, bonuses.ACC),
    statRow('HP', statPlan.derived.hp, bonuses.HP),
    statRow('MP', statPlan.derived.mp, bonuses.MP),
    statRow(attackLabel, baseAttack, totalAttack - baseAttack),
  ];
}

function calcMainAttack(classLine, statPlan, gear = []) {
  const bonuses = getGearBonuses(gear);
  const primary = (statPlan.stats[classLine.primaryStat] ?? 0) + (bonuses[classLine.primaryStat] ?? 0);
  const secondary = (statPlan.stats[classLine.secondaryStat] ?? 0) + (bonuses[classLine.secondaryStat] ?? 0);
  const gearAttack = classLine.id === 'magician' ? bonuses.MATK : bonuses.WATK;
  const skillAttack = classLine.id === 'magician'
    ? (statPlan.derived?.magicAttackBonus ?? 0)
    : (statPlan.derived?.weaponAttackBonus ?? 0);
  return Math.max(1, Math.round(primary * 1.35 + secondary * 0.35 + statPlan.level * 0.7 + gearAttack + skillAttack));
}
