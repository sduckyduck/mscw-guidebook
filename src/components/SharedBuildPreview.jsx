import { useEffect, useMemo, useState } from 'react';
import CharacterPreview from './CharacterPreview.jsx';
import MonsterIcon from './MonsterIcon.jsx';
import MsioItemIcon from './MsioItemIcon.jsx';
import OsmsDataImage from './OsmsDataImage.jsx';
import IconFallback, { baseUrl } from './IconFallback.jsx';
import { CLASS_LINES } from '../data/classes.js';
import { buildStatPlan } from '../engine/levelEngine.js';
import { applyGearOverrides, getGearCandidatesBySlot, selectGear } from '../engine/gearSelector.js';
import { getMapRecommendations } from '../engine/recommendationEngine.js';
import { rankLevelingMapsByBreakpoints } from '../engine/levelingRouteAlgorithm.js';
import { loadOfficialGuideData } from '../engine/officialDataAdapter.js';
import { getRecommendedSkillAllocation, getSkillPlan } from '../engine/skillPlanner.js';

const emptyData = { items: [], maps: [], monsters: [], recipes: [], materials: [], skillGroups: [] };
const SLOTS = [
  ['weapon', '武器'], ['cap', '头盔'], ['overall', '套服'], ['top', '上衣'], ['bottom', '下衣'],
  ['shoes', '鞋子'], ['glove', '手套'], ['shield', '盾牌'], ['cape', '披风'], ['earring', '耳环'],
];

const BUDGET_LABELS = { low: '低资金', mid: '普通', high: '有钱' };
const PRIORITY_LABELS = { stable: '稳定', exp: '经验', material: '材料', meso: '金币' };
const GENDER_LABELS = { male: '男', female: '女' };
const EDITION_LABELS = { global: '国际服', china: '国服' };

function label(map, value, fallback = '-') {
  return map[value] ?? value ?? fallback;
}

function asObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function hasSkillAllocationMatch(allocation, recommended) {
  if (!allocation || typeof allocation !== 'object') return false;
  return Object.keys(recommended ?? {}).some((name) => Object.prototype.hasOwnProperty.call(allocation, name));
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
    sum.AVOID += getGearValue(item, ['incEVA', 'incAVOID', 'incAvoid', 'avoidability', 'eva']);
    sum.WATK += getGearValue(item, ['incPAD', 'pad', 'watk']);
    sum.MATK += getGearValue(item, ['incMAD', 'mad', 'matk']);
    sum.PDD += getGearValue(item, ['incPDD', 'pdd', 'wdef', 'defense']);
    sum.MDD += getGearValue(item, ['incMDD', 'mdd', 'magicDefense']);
    return sum;
  }, { STR: 0, DEX: 0, INT: 0, LUK: 0, HP: 0, MP: 0, ACC: 0, AVOID: 0, WATK: 0, MATK: 0, PDD: 0, MDD: 0 });
}

function calcMainAttack(classLine, statPlan, gear = []) {
  const bonuses = getGearBonuses(gear);
  const stats = statPlan?.stats ?? {};
  const primary = Number(stats[classLine?.primaryStat] ?? 4) + Number(bonuses[classLine?.primaryStat] ?? 0);
  const secondary = Number(stats[classLine?.secondaryStat] ?? 4) + Number(bonuses[classLine?.secondaryStat] ?? 0);
  const level = Number(statPlan?.level ?? 1);
  if (classLine?.id === 'magician') {
    return Math.max(1, Math.round(primary * 1.18 + secondary * 0.32 + level * 0.55 + bonuses.MATK * 2.25));
  }
  return Math.max(1, Math.round(primary * 1.32 + secondary * 0.42 + level * 0.7 + bonuses.WATK * 2.6));
}

function statRow(label, base, bonus = 0) {
  const roundedBase = Math.round(Number(base) || 0);
  const roundedBonus = Math.round(Number(bonus) || 0);
  return { label, base: roundedBase, bonus: roundedBonus, value: roundedBase + roundedBonus };
}

function compactStats(statPlan, classLine, gear = []) {
  const bonuses = getGearBonuses(gear);
  const stats = statPlan?.stats ?? {};
  const derived = statPlan?.derived ?? {};
  const mainAttack = calcMainAttack(classLine, statPlan, gear);
  return [
    statRow('STR', stats.STR, bonuses.STR),
    statRow('DEX', stats.DEX, bonuses.DEX),
    statRow('INT', stats.INT, bonuses.INT),
    statRow('LUK', stats.LUK, bonuses.LUK),
    statRow('ACC', derived.accuracy, bonuses.ACC),
    statRow('HP', derived.hp, bonuses.HP),
    statRow('MP', derived.mp, bonuses.MP),
    statRow(classLine?.id === 'magician' ? 'MATK' : 'WATK', mainAttack, 0),
  ];
}

function normalizeBuildState(build) {
  const stats = asObject(build?.stats);
  return {
    classId: build?.job || 'warrior',
    branchId: build?.branch || build?.job || 'warrior',
    level: Number(build?.level) || 10,
    budget: build?.budget || 'mid',
    priority: build?.priority || 'stable',
    gender: stats.gender || 'female',
    editionId: stats.editionId || build?.mode || 'global',
    apAllocation: stats.apAllocation ?? null,
    skillAllocation: asObject(build?.skills),
    gearOverrides: asObject(build?.gear),
  };
}

export default function SharedBuildPreview({ build }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const saved = useMemo(() => normalizeBuildState(build), [build]);

  useEffect(() => {
    let alive = true;
    loadOfficialGuideData()
      .then((next) => { if (alive) { setData(next); setError(''); } })
      .catch((err) => { if (alive) setError(err.message || '官方数据读取失败'); });
    return () => { alive = false; };
  }, []);

  const activeData = data ?? emptyData;
  const classLine = CLASS_LINES.find((item) => item.id === saved.classId) ?? CLASS_LINES[0];
  const branch = classLine.branches.find((item) => item.id === saved.branchId) ?? classLine.branches[0] ?? classLine;
  const recommendedSkillAllocation = useMemo(
    () => getRecommendedSkillAllocation({ classId: classLine.id, branchId: branch.id, level: saved.level, budget: saved.budget, skillGroups: activeData.skillGroups }),
    [classLine.id, branch.id, saved.level, saved.budget, activeData.skillGroups],
  );
  const effectiveSkillAllocation = hasSkillAllocationMatch(saved.skillAllocation, recommendedSkillAllocation) ? saved.skillAllocation : recommendedSkillAllocation;
  const skillPlanForStats = useMemo(
    () => getSkillPlan({ classId: classLine.id, branchId: branch.id, level: saved.level, budget: saved.budget, mainAttack: 0, customSkills: effectiveSkillAllocation, skillGroups: activeData.skillGroups }),
    [classLine.id, branch.id, saved.level, saved.budget, effectiveSkillAllocation, activeData.skillGroups],
  );
  const statPlan = useMemo(
    () => buildStatPlan(classLine, saved.level, { budget: saved.budget, apAllocation: saved.apAllocation, skillBonuses: skillPlanForStats.statBonuses }),
    [classLine, saved.level, saved.budget, saved.apAllocation, skillPlanForStats.statBonuses],
  );
  const recommendedGear = useMemo(
    () => selectGear({ classLine, branch, level: saved.level, budget: saved.budget, gender: saved.gender, statPlan, items: activeData.items }),
    [classLine, branch, saved.level, saved.budget, saved.gender, statPlan, activeData.items],
  );
  const gear = useMemo(() => applyGearOverrides(recommendedGear, saved.gearOverrides), [recommendedGear, saved.gearOverrides]);
  const candidatesBySlot = useMemo(
    () => getGearCandidatesBySlot({ classLine, branch, level: saved.level, budget: saved.budget, gender: saved.gender, statPlan, items: activeData.items, manualMode: true }),
    [classLine, branch, saved.level, saved.budget, saved.gender, statPlan, activeData.items],
  );
  const mainAttack = useMemo(() => calcMainAttack(classLine, statPlan, gear), [classLine, statPlan, gear]);
  const stats = useMemo(() => compactStats(statPlan, classLine, gear), [statPlan, classLine, gear]);
  const skillPlan = useMemo(
    () => getSkillPlan({ classId: classLine.id, branchId: branch.id, level: saved.level, budget: saved.budget, mainAttack, customSkills: effectiveSkillAllocation, skillGroups: activeData.skillGroups }),
    [classLine.id, branch.id, saved.level, saved.budget, mainAttack, effectiveSkillAllocation, activeData.skillGroups],
  );
  const baseMaps = useMemo(
    () => getMapRecommendations({ classLine, branch, level: saved.level, statPlan, budget: saved.budget, priority: saved.priority, maps: activeData.maps, monsters: activeData.monsters, gear }),
    [classLine, branch, saved.level, statPlan, saved.budget, saved.priority, activeData.maps, activeData.monsters, gear],
  );
  const maps = useMemo(
    () => rankLevelingMapsByBreakpoints({ maps: baseMaps, level: saved.level, budget: saved.budget, priority: saved.priority, skillPlan, mainAttack, items: activeData.items }).slice(0, 8),
    [baseMaps, saved.level, saved.budget, saved.priority, skillPlan, mainAttack, activeData.items],
  );

  const bestMap = maps[0];
  const bestMonster = bestMap?.monsters?.[0];
  const weapon = gear.find((item) => item.slot === 'weapon');

  return <section className="shared-build-dashboard mg-dashboard">
    <div className="shared-build-meta-row">
      <span>版本 {label(EDITION_LABELS, saved.editionId)}</span>
      <span>性别 {label(GENDER_LABELS, saved.gender)}</span>
      <span>{label(BUDGET_LABELS, saved.budget)}</span>
      <span>{label(PRIORITY_LABELS, saved.priority)}优先</span>
    </div>
    <div className="mg-dashboard-grid shared-build-grid">
      <div className="mg-left-stack">
        <SavedBuildConfigPanel classLine={classLine} branch={branch} saved={saved} />
        <SavedBuildEquipment gear={gear} candidatesBySlot={candidatesBySlot} />
      </div>
      <div className="mg-right-stack">
        <SavedBuildMapCard bestMonster={bestMonster} bestMap={bestMap} />
        <SavedBuildPreviewPanel classLine={classLine} branch={branch} saved={saved} weapon={weapon} gear={gear} stats={stats} />
        <SavedBuildDamagePanel classLine={classLine} skillPlan={skillPlan} />
      </div>
    </div>
    {error && <p className="community-error">官方数据读取提示：{error}</p>}
  </section>;
}

function SavedBuildConfigPanel({ classLine, branch, saved }) {
  return <section className="mg-glass-panel saved-build-config-panel">
    <h2 className="mg-panel-title">角色配置</h2>
    <div className="saved-build-config-grid">
      <ReadonlyField label="职业" value={classLine.name} />
      <ReadonlyField label="二转" value={branch.name} />
      <ReadonlyField label="等级" value={`Lv. ${saved.level}`} />
      <ReadonlyField label="资金" value={label(BUDGET_LABELS, saved.budget)} />
      <ReadonlyField label="优先" value={label(PRIORITY_LABELS, saved.priority)} />
    </div>
  </section>;
}

function ReadonlyField({ label, value }) {
  return <div className="saved-readonly-field">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>;
}

function SavedBuildEquipment({ gear, candidatesBySlot }) {
  const by = Object.fromEntries((gear ?? []).map((item) => [item.slot, item]));
  return <section className="mg-equipment-board saved-build-equipment-board">
    <div className="mg-equipment-head">
      <h2 className="mg-panel-title">装备快捷栏</h2>
      <span>保存预览</span>
    </div>
    <div className="mg-equipment-grid">
      {SLOTS.map(([slot, labelText]) => {
        const item = by[slot];
        const hasCandidates = Boolean(candidatesBySlot?.[slot]?.length);
        return <div className={item ? 'mg-equip-tile saved-equip-tile' : 'mg-equip-tile saved-equip-tile empty'} key={slot} title={labelText}>
          <MsioItemIcon item={item} size={30} />
          <span>{labelText}</span>
          <strong>{item?.title ?? item?.name ?? (hasCandidates ? '系统推荐' : '未装备')}</strong>
        </div>;
      })}
    </div>
  </section>;
}

function SavedBuildMapCard({ bestMonster, bestMap }) {
  const hitValue = Number(bestMonster?.hitPercent);
  const hitText = Number.isFinite(hitValue) ? `${hitValue}%` : bestMap?.canHitAll ? '100%' : '偏紧';
  return <section className="mg-status-panel saved-map-card">
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

function SavedBuildPreviewPanel({ classLine, branch, saved, weapon, gear, stats }) {
  return <section className="mg-preview-card no-rail saved-character-preview-card">
    <div className="mg-preview-main">
      <div className="mg-character-frame"><CharacterPreview classLine={classLine} gender={saved.gender} gear={gear} /></div>
      <div>
        <h3 className="mg-stats-title">角色属性</h3>
        <div className="mg-stats-grid">
          {stats.map((stat) => <div className="mg-stat-box" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong>{stat.bonus ? <small className="mg-stat-breakdown">({stat.base}+{stat.bonus})</small> : null}</div>)}
        </div>
      </div>
      <div className="preview-meta"><strong>{classLine.name} Lv.{saved.level}</strong><span>{weapon?.title ?? weapon?.name ?? branch.name}</span></div>
    </div>
  </section>;
}

function SavedBuildDamagePanel({ classLine, skillPlan }) {
  const cards = useMemo(() => {
    const all = skillPlan?.damageCards ?? [];
    const base = all.find((card) => card.isBase);
    const skillCards = all.filter((card) => !card.isBase).sort((a, b) => Number(b.max ?? 0) - Number(a.max ?? 0)).slice(0, 2);
    return classLine?.id === 'magician' ? skillCards : [base, ...skillCards].filter(Boolean);
  }, [classLine?.id, skillPlan]);

  if (!cards.length) return null;

  return <section className="mg-overview-damage-card saved-damage-card">
    <div className="mg-overview-damage-head">
      <h2>技能伤害</h2>
      <span>{classLine?.id === 'magician' ? '最高 2 项技能' : '普攻 + 最高 2 项'}</span>
    </div>
    <div className="mg-overview-damage-list">
      {cards.map((card) => <SavedDamageRow key={card.name} card={card} />)}
    </div>
  </section>;
}

function SavedDamageRow({ card }) {
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
