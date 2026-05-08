import { useState } from 'react';
import IconFallback, { baseUrl, iconSourcesFromNames } from './IconFallback.jsx';
import SkillDetailSheet from './SkillDetailSheet.jsx';
import '../styles/detail-sheets.css';
import '../styles/character-page-clean.css';

const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];
const MIN_STAT_AP = 4;
const SKILL_ICON_FOLDERS = ['icons/skill', 'icons/skills', 'icons'];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function publicIconAsset(path) {
  if (!path) return '';
  return `${baseUrl()}${String(path).replace(/^\/+/, '')}`;
}

function getSkillNames(name) {
  return [name].filter(Boolean);
}

function getSkillSources(name, iconKey = '') {
  if (name === 'Base Attack' || name === '基础攻击') return [];
  return unique([
    publicIconAsset(iconKey),
    ...iconSourcesFromNames(getSkillNames(name), SKILL_ICON_FOLDERS),
  ]);
}

export default function SkillPanel({
  plan,
  apNote,
  statPlan,
  classLine,
  level = 10,
  apAllocation,
  onApChange,
  onApReset,
  onSkillChange,
  onSkillReset,
}) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const firstJobSkills = plan.skills.filter((skill) => skill.tier !== 'second');
  const secondJobSkills = plan.skills.filter((skill) => skill.tier === 'second');

  return (
    <section className="mg-dashboard mg-character-dashboard mg-character-dashboard-clean">
      <h1 className="mg-dashboard-title">MapleGuide: 角色能力与技能分配</h1>
      <p className="mg-dashboard-subtitle">SP/AP Distribution · 当前 {classLine?.name ?? '角色'} Lv.{level}</p>

      <div className="mg-character-clean-layout">
        <section className="mg-glass-panel mg-ap-panel mg-ap-panel-wide">
          <PanelHead kicker="AP 加点" title="能力值分配" action="系统推荐" onAction={onApReset} />
          <div className="mg-ap-wide-summary">
            <p className="mg-character-note">{apNote}</p>
            <div className="mg-character-meter mg-ap-meter-compact">
              <span>可分配 AP</span>
              <strong>{statPlan.remainingAp}</strong>
              <em>最低值按职业转职要求保护</em>
            </div>
          </div>
          <div className="mg-ap-grid mg-ap-grid-horizontal">
            {STAT_KEYS.map((stat) => {
              const apValue = statPlan.apAllocation?.[stat] ?? apAllocation?.[stat] ?? MIN_STAT_AP;
              const minValue = statPlan.apMinStats?.[stat] ?? MIN_STAT_AP;
              return (
                <PointRow
                  key={stat}
                  label={stat}
                  value={statPlan.stats[stat]}
                  points={apValue}
                  minValue={minValue}
                  canMinus={apValue > minValue}
                  canPlus={statPlan.remainingAp > 0}
                  onMinus={() => onApChange(stat, -1)}
                  onPlus={() => onApChange(stat, 1)}
                />
              );
            })}
          </div>
        </section>

        <div className="mg-skill-clean-grid">
          <SkillGroupCard
            title="一转技能"
            kicker="SP 加点"
            action="系统推荐"
            onAction={onSkillReset}
            note={plan.summary}
            remaining={plan.remainingByTier?.first ?? 0}
            total={plan.totalSpByTier?.first ?? 0}
            skills={firstJobSkills}
            plan={plan}
            onSkillChange={onSkillChange}
            onSkillInspect={setSelectedSkill}
            glass
          />

          {secondJobSkills.length > 0 && (
            <SkillGroupCard
              title="二转技能"
              kicker={Number(level) > 30 ? '已开放' : 'Lv.30 后开放'}
              remaining={plan.remainingByTier?.second ?? 0}
              total={plan.totalSpByTier?.second ?? 0}
              skills={secondJobSkills}
              plan={plan}
              onSkillChange={onSkillChange}
              onSkillInspect={setSelectedSkill}
              className="mg-second-skill-card"
            />
          )}
        </div>
      </div>

      <div className="mg-actions mg-character-actions">
        <button className="mg-action-small">分享</button>
        <button className="mg-action-main">更换推荐 / 生成路线</button>
        <button className="mg-action-small">百科</button>
      </div>
      <p className="mg-footer">© 2026 MapleGuide | by SduckyDuck</p>
      <SkillDetailSheet skill={selectedSkill} plan={plan} onClose={() => setSelectedSkill(null)} />
    </section>
  );
}

function SkillGroupCard({ title, kicker, action, onAction, note, remaining, total, skills, plan, onSkillChange, onSkillInspect, glass = false, className = '' }) {
  const cardClass = [glass ? 'mg-glass-panel mg-sp-panel' : 'mg-skill-side-card', className].filter(Boolean).join(' ');

  return (
    <section className={cardClass}>
      <PanelHead kicker={kicker} title={title} action={action} onAction={onAction} />
      {note && <p className="mg-character-note">{note}</p>}
      <div className="mg-character-meter mg-sp-meter">
        <span>剩余 SP</span>
        <strong>{remaining}</strong>
        <em>{title} {remaining}/{total}</em>
      </div>
      <SkillList skills={skills} plan={plan} onSkillChange={onSkillChange} onSkillInspect={onSkillInspect} />
    </section>
  );
}

function SkillList({ skills, plan, onSkillChange, onSkillInspect }) {
  return (
    <div className="mg-skill-stack compact">
      {skills.map((skill) => {
        const remainingForTier = plan.remainingByTier?.[skill.tier] ?? plan.remainingSp;
        return (
          <SkillPointRow
            key={skill.name}
            skill={skill}
            canMinus={!skill.locked && skill.level > 0}
            canPlus={!skill.locked && remainingForTier > 0 && skill.level < skill.max}
            onMinus={() => onSkillChange(skill.name, -1)}
            onPlus={() => onSkillChange(skill.name, 1)}
            onInspect={() => onSkillInspect(skill)}
          />
        );
      })}
    </div>
  );
}

function PanelHead({ kicker, title, action, onAction }) {
  return (
    <div className="mg-character-panel-head">
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
      {action && <button onClick={onAction}>{action}</button>}
    </div>
  );
}

function PointRow({ label, value, points, minValue, canMinus, canPlus, onMinus, onPlus }) {
  return (
    <article className="mg-ap-box">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <em>AP {points} · 最低 {minValue}</em>
      </div>
      <div className="mg-mini-controls">
        <button onClick={onMinus} disabled={!canMinus}>-</button>
        <button onClick={onPlus} disabled={!canPlus}>+</button>
      </div>
    </article>
  );
}

function SkillPointRow({ skill, canMinus, canPlus, onMinus, onPlus, onInspect }) {
  const rowClass = ['mg-skill-row clickable', skill.locked ? 'locked' : '', skill.tier === 'second' ? 'second-job' : 'first-job'].filter(Boolean).join(' ');
  return (
    <article className={rowClass} role="button" tabIndex={0} onClick={onInspect} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onInspect(); }}>
      <SkillBadge name={skill.name} iconKey={skill.iconKey} />
      <div className="mg-skill-main">
        <strong>{skill.name}</strong>
        <span>Lv. {skill.level}/{skill.max}{skill.locked ? ' · Lv.30 后开放' : ' · [+/-]'}</span>
      </div>
      <div className="mg-mini-controls" onClick={(event) => event.stopPropagation()}>
        <button onClick={onMinus} disabled={!canMinus}>-</button>
        <button onClick={onPlus} disabled={!canPlus}>+</button>
      </div>
    </article>
  );
}

function SkillBadge({ name, iconKey = '', compact = false }) {
  const letters = String(name || '?').replace(/\s+/g, '').slice(0, 2);
  const names = getSkillNames(name);
  return (
    <div className={compact ? 'mg-skill-badge neutral' : 'mg-skill-badge'}>
      <IconFallback
        className="mg-skill-icon-img"
        names={names}
        folders={SKILL_ICON_FOLDERS}
        sources={getSkillSources(name, iconKey)}
        alt=""
        debugLabel={`skill:${name}`}
        fallback={<span>{letters}</span>}
      />
    </div>
  );
}
