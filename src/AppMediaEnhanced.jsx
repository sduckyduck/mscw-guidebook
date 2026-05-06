import { useEffect, useMemo, useState } from 'react';
import CharacterPreview from './components/CharacterPreview.jsx';
import MonsterIcon from './components/MonsterIcon.jsx';
import MsioItemIcon from './components/MsioItemIcon.jsx';
import OsmsDataImage from './components/OsmsDataImage.jsx';
import SkillPanel from './components/SkillPanel.jsx';
import { CLASS_LINES, EDITIONS } from './data/classes.js';
import { buildStatPlan } from './engine/levelEngine.js';
import { selectGear } from './engine/gearSelector.js';
import { getMapRecommendations } from './engine/recommendationEngine.js';
import { loadOfficialGuideData } from './engine/officialDataAdapter.js';
import { getApNote, getSkillPlan } from './engine/skillPlanner.js';

const TABS = [['overview', '总览'], ['character', '角色'], ['maps', '地图'], ['gear', '装备'], ['materials', '材料']];
const JOBS = [['warrior', '战士'], ['magician', '魔法师'], ['bowman', '弓箭手'], ['thief', '飞侠'], ['pirate', '海盗']].map(([id, name]) => ({ id, name }));
const BUDGETS = [['low', '低资金'], ['mid', '普通'], ['high', '有钱']].map(([id, name]) => ({ id, name }));
const PRIORITIES = [['stable', '稳定'], ['exp', '经验'], ['material', '材料'], ['meso', '金币']].map(([id, name]) => ({ id, name }));
const SLOTS = [['weapon', '武器'], ['cap', '头盔'], ['top', '上衣'], ['overall', '套服'], ['bottom', '裤子'], ['shoes', '鞋子'], ['glove', '手套'], ['shield', '盾牌'], ['cape', '披风'], ['earring', '耳环']];
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

  const statPlan = useMemo(() => buildStatPlan(classLine, level), [classLine, level]);
  const maps = useMemo(() => getMapRecommendations({ classLine, level, statPlan, maps: activeData.maps, monsters: activeData.monsters }).slice(0, 8), [classLine, level, statPlan, activeData]);
  const gear = useMemo(() => selectGear({ classLine, branch, level, budget, gender, statPlan, items: activeData.items }), [classLine, branch, level, budget, gender, statPlan, activeData]);
  const weapon = gear.find((x) => x.slot === 'weapon');
  const mainAttack = calcMainAttack(classLine, statPlan, weapon);
  const stats = compactStats(statPlan, classLine, mainAttack);
  const bestMap = maps[0];
  const bestMonster = bestMap?.monsters?.[0];
  const skillPlan = useMemo(() => getSkillPlan({ classId: classLine.id, branchId: branch.id, level, mainAttack }), [classLine, branch, level, mainAttack]);
  const apNote = useMemo(() => getApNote({ classLine, statPlan }), [classLine, statPlan]);

  const controls = { edition, editionId, setEditionId, classId, setClassId, branchId, setBranchId, gender, setGender, level, setLevel, budget, setBudget, priority, setPriority, classes, classLine, minLevel, maxLevel };

  return <main className="app-shell">
    <nav className="top-tabs">{TABS.map(([id, name]) => <button key={id} className={tab === id ? 'top-tab active' : 'top-tab'} onClick={() => setTab(id)}>{name}</button>)}</nav>
    {edition.dataMode !== 'official-appdata' && <p className="load-error">国服数据/公式已预留，当前暂不启用真实推荐。</p>}
    {tab === 'overview' && <><Hero controls={controls} classLine={classLine} gender={gender} level={level} bestMonster={bestMonster} bestMap={bestMap} weapon={weapon} gear={gear} stats={stats} /><NextStep bestMonster={bestMonster} bestMap={bestMap} weapon={weapon} nextAp={classLine.primaryStat} /></>}
    {tab === 'character' && <><Parameters {...controls} /><StatsCard stats={stats} classLine={classLine} /><SkillPanel plan={skillPlan} apNote={apNote} /></>}
    {tab === 'maps' && <MapsPage maps={maps} data={activeData} />}
    {tab === 'gear' && <GearPage gear={gear} />}
    {tab === 'materials' && <MaterialsPage data={activeData} />}
    {error && <p className="load-error">官方数据读取提示：{error}</p>}
  </main>;
}

function Hero({ controls, classLine, gender, level, bestMonster, bestMap, weapon, gear, stats }) {
  return <section className="hero-card"><h1>Lv.{level} {classLine.name} 开荒驾驶舱</h1><p>优先打 <strong>{bestMonster?.name ?? '推荐怪物'}</strong>，推荐地图 <strong>{bestMap?.name ?? '读取中'}</strong>。</p><CompactControls {...controls} /><div className="preview-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(160px,.95fr)', gap: 12 }}><div><div className="preview-frame real-preview-frame" style={{ minHeight: 270 }}><CharacterPreview classLine={classLine} gender={gender} gear={gear} /></div><StatsStrip stats={stats} /></div><EquipmentFrame gear={gear} /><div className="preview-meta" style={{ gridColumn: '1 / -1' }}><strong>{classLine.name} Lv.{level}</strong><span>{weapon?.title ?? '装备读取中'} · 怪物/地图/技能已接入</span></div></div></section>;
}

function EquipmentFrame({ gear }) { const by = Object.fromEntries((gear ?? []).map((x) => [x.slot, x])); return <aside style={{ border: '1px solid var(--border)', borderRadius: 16, background: '#fff', padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><strong style={{ fontSize: 18 }}>装备框</strong><span style={{ color: 'var(--muted)', fontWeight: 900 }}>当前推荐</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>{SLOTS.map(([slot, label]) => <div key={slot} style={{ minHeight: 76, border: '1px solid var(--border)', borderRadius: 13, background: by[slot] ? '#f8fbf9' : '#f1f4f2', padding: 7, overflow: 'hidden' }}><MsioItemIcon item={by[slot]} /><span style={{ display: 'block', color: 'var(--muted)', fontSize: 11, fontWeight: 1000 }}>{label}</span><strong style={{ display: 'block', color: by[slot] ? 'var(--blue)' : '#9aa4b2', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{by[slot]?.title ?? '未装备'}</strong></div>)}</div></aside>; }

function NextStep({ bestMonster, bestMap, weapon, nextAp }) { return <Section title="下一步"><div className="info-list"><Info label="练级" title={`${bestMonster?.name ?? '推荐怪物'} Lv.${bestMonster?.level ?? '-'}`} desc="按当前命中和等级推荐" media={<MonsterIcon monster={bestMonster} size={38} />} /><Info label="地图" title={bestMap?.name ?? '推荐地图读取中'} desc={`${bestMap?.canHitAll ? '安全' : '需补命中'} · 刷怪数 ${bestMap?.spawnTotal ?? '-'}`} /><Info label="装备" title={weapon?.title ?? '职业武器'} desc={weapon?.desc ?? '按当前等级推荐'} media={<MsioItemIcon item={weapon} size={38} />} /><Info label="AP" title={nextAp} desc="按当前职业主属性优先" /></div></Section>; }

function MapsPage({ maps, data }) { return <Section title="推荐路线"><p className="section-copy">{data?.maps?.length ? '地图大图、怪物图和刷怪数来自当前版本数据；图片缺失时会 fallback 到 OSMS Guide 的 data 资源。' : '当前版本地图数据未启用。'}</p><div className="map-stack">{maps.map((map) => <article className="map-result" key={map.id}><div className="map-result-main"><div><span className="item-label">Lv.{map.levelRange?.[0]}-{map.levelRange?.[1]} · {map.region}</span><h3>{map.monsters?.[0]?.name ?? map.name}</h3><p>{map.monsters?.[0] ? `Lv.${map.monsters[0].level} · EXP ${map.monsters[0].exp ?? '-'} · ${map.canHitAll ? '命中 100%' : '命中偏紧'}` : map.routeNote}</p></div><button className="option-btn" style={{ minWidth: 110 }}>查看地图</button></div>{map.thumbnail && <OsmsDataImage className="map-preview" src={map.thumbnail} sources={[map.minimap]} alt={map.name} placeholder="No Image" />}<h3 style={{ marginTop: 12 }}>{map.name}</h3><p className="section-copy">{map.spawnTotal ?? '-'} 只 · {map.canHitAll ? '安全' : '需补命中'}</p><div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>{map.monsters?.slice(0, 8).map((monster) => <div key={`${map.id}-${monster.id}`} style={{ minWidth: 82, border: '1px solid var(--border)', borderRadius: 12, background: '#fff', padding: 8 }}><MonsterIcon monster={monster} size={34} /><strong style={{ display: 'block', fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{monster.name}</strong><span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 900 }}>Lv.{monster.level}</span></div>)}</div></article>)}</div></Section>; }

function GearPage({ gear }) { return <Section title="装备推荐"><p className="section-copy">装备 icon 使用同一套 MapleStory.io 名称映射。</p><div className="gear-stack">{gear.map((item) => <article className="gear-card" key={`${item.slot}-${item.id}`}><MsioItemIcon item={item} size={40} /><div><span className="item-label">{item.label} · Lv.{item.reqLevel ?? '-'}</span><h3>{item.title}</h3><p>{item.desc}</p></div></article>)}</div></Section>; }
function MaterialsPage() { return <Section title="材料 / 锻造"><p className="section-copy">材料价值指数和锻造路线保留在后续国服/国际服数据整理阶段继续接入。</p></Section>; }
function StatsStrip({ stats }) { return <div style={{ border: '1px solid var(--border)', borderRadius: 16, background: '#fff', padding: 12, marginTop: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><strong style={{ fontSize: 18 }}>最终属性</strong><span style={{ color: 'var(--muted)', fontWeight: 900 }}>角色属性</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>{stats.map(([label, value]) => <MiniStat key={label} label={label} value={value} />)}</div></div>; }
function CompactControls(props) { const { edition, editionId, setEditionId, classId, setClassId, branchId, setBranchId, gender, setGender, level, setLevel, budget, setBudget, priority, setPriority, classes, classLine, minLevel, maxLevel } = props; return <div style={{ marginTop: 18, border: '1px solid rgba(255,255,255,.28)', borderRadius: 18, background: 'rgba(255,255,255,.12)', padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><strong style={{ fontSize: 18 }}>角色参数</strong><span style={{ color: 'rgba(255,255,255,.78)', fontWeight: 900 }}>{edition.name} Lv.{minLevel}-{maxLevel}</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}><SmallSelect title="版本" value={editionId} setValue={setEditionId} options={EDITIONS} /><SmallSelect title="性别" value={gender} setValue={setGender} options={[{ id: 'male', name: '男' }, { id: 'female', name: '女' }]} /><SmallSelect title="职业" value={classId} setValue={setClassId} options={JOBS.filter((job) => classes.some((x) => x.id === job.id))} /><SmallSelect title="二转" value={branchId} setValue={setBranchId} options={classLine.branches.map((x) => ({ id: x.id, name: x.name }))} /><SmallLevel level={level} setLevel={setLevel} min={minLevel} max={maxLevel} /><SmallSelect title="资金" value={budget} setValue={setBudget} options={BUDGETS} /><SmallSelect title="优先" value={priority} setValue={setPriority} options={PRIORITIES} wide /></div></div>; }
function Parameters(props) { return <Section title="角色参数"><CompactControls {...props} /></Section>; }
function SmallSelect({ title, value, setValue, options, wide = false }) { return <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}><div style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>{title}</div><div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.length, 4)}, minmax(0, 1fr))`, gap: 6 }}>{options.map((o) => <button key={o.id} onClick={() => setValue(o.id)} style={{ minHeight: 42, borderRadius: 12, padding: '8px 10px', fontWeight: 1000, fontSize: 14, border: '1px solid rgba(255,255,255,.28)', background: value === o.id ? '#dceee7' : 'rgba(255,255,255,.14)', color: value === o.id ? '#176d5b' : 'white' }}>{o.name}</button>)}</div></div>; }
function SmallLevel({ level, setLevel, min, max }) { return <div><div style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>等级</div><div style={{ display: 'grid', gridTemplateColumns: '42px minmax(0,1fr) 42px', gap: 6 }}><button style={smallLevelButton} onClick={() => setLevel(Math.max(min, level - 1))}>-</button><div style={{ ...smallLevelButton, display: 'grid', placeItems: 'center', background: 'white', color: '#111827', fontSize: 22 }}>{level}</div><button style={smallLevelButton} onClick={() => setLevel(Math.min(max, level + 1))}>+</button></div><input style={{ width: '100%', marginTop: 8, accentColor: '#dceee7' }} type="range" min={min} max={max} value={level} onChange={(e) => setLevel(Number(e.target.value))} /></div>; }
const smallLevelButton = { minHeight: 42, borderRadius: 12, padding: '8px 10px', fontWeight: 1000, border: '1px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.16)', color: 'white' };
function StatsCard({ stats, classLine }) { return <Section title="最终属性"><div className="stat-stack">{stats.map(([label, value]) => <div className="stat-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="next-ap-note"><strong>下一点 AP：{classLine.primaryStat}</strong><span>当前建议主 {classLine.primaryStat}，{classLine.secondaryStat} 只保留装备/命中需求。</span></div></Section>; }
function MiniStat({ label, value }) { return <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '8px 7px', background: '#f8fbf9' }}><span style={{ display: 'block', color: 'var(--muted)', fontWeight: 1000, fontSize: 10 }}>{label}</span><strong style={{ display: 'block', color: 'var(--text)', fontSize: 20 }}>{value}</strong></div>; }
function Section({ title, children }) { return <section className="section-card"><h2>{title}</h2>{children}</section>; }
function Info({ label, title, desc, media }) { return <article className="info-row"><span>{label}</span><div className="info-row-main">{media}<div><strong>{title}</strong><p>{desc}</p></div></div></article>; }
function compactStats(statPlan, classLine, mainAttack) { return [['STR', statPlan.stats.STR], ['DEX', statPlan.stats.DEX], ['INT', statPlan.stats.INT], ['LUK', statPlan.stats.LUK], ['ACC', statPlan.derived.accuracy], ['HP', statPlan.derived.hp], ['MP', statPlan.derived.mp], [classLine.id === 'magician' ? 'MATK' : 'WATK', mainAttack]]; }
function calcMainAttack(classLine, statPlan, weapon) { const primary = statPlan.stats[classLine.primaryStat] ?? 0; const secondary = statPlan.stats[classLine.secondaryStat] ?? 0; const gearAttack = classLine.id === 'magician' ? (weapon?.incMAD ?? 0) : (weapon?.incPAD ?? 0); return Math.max(1, Math.round(primary * 1.35 + secondary * 0.35 + statPlan.level * 0.7 + gearAttack)); }
