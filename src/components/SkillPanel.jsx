import CharacterPreview from './CharacterPreview.jsx';

const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];

export default function SkillPanel({
  plan,
  apNote,
  statPlan,
  classLine,
  gender = 'female',
  gear = [],
  level = 10,
  weapon,
  apAllocation,
  onApChange,
  onApReset,
  onSkillChange,
  onSkillReset,
}) {
  return (
    <section className="mg-dashboard mg-character-dashboard">
      <h1 className="mg-dashboard-title">MapleGuide: 角色能力与技能分配</h1>
      <p className="mg-dashboard-subtitle">SP/AP Distribution · 当前 {classLine?.name ?? '角色'} Lv.{level}</p>

      <div className="mg-character-grid">
        <div className="mg-left-stack">
          <section className="mg-glass-panel mg-ap-panel">
            <PanelHead kicker="AP 加点" title="能力值分配" action="系统推荐" onAction={onApReset} />
            <p className="mg-character-note">{apNote}</p>
            <div className="mg-character-meter">
              <span>总剩余 AP</span>
              <strong>{statPlan.remainingAp}</strong>
            </div>
            <div className="mg-ap-grid">
              {STAT_KEYS.map((stat) => (
                <PointRow
                  key={stat}
                  label={stat}
                  value={statPlan.stats[stat]}
                  points={apAllocation?.[stat] ?? 0}
                  canMinus={(apAllocation?.[stat] ?? 0) > 0}
                  canPlus={statPlan.remainingAp > 0}
                  onMinus={() => onApChange(stat, -1)}
                  onPlus={() => onApChange(stat, 1)}
                />
              ))}
            </div>
          </section>

          <section className="mg-glass-panel mg-sp-panel">
            <PanelHead kicker="SP 加点" title="技能点分配" action="系统推荐" onAction={onSkillReset} />
            <p className="mg-character-note">{plan.summary}</p>
            <div className="mg-character-meter">
              <span>剩余 SP</span>
              <strong>{plan.remainingSp}</strong>
            </div>
            <div className="mg-skill-stack">
              {plan.skills.map((skill) => (
                <SkillPointRow
                  key={skill.name}
                  skill={skill}
                  canMinus={skill.level > 0}
                  canPlus={plan.remainingSp > 0 && skill.level < skill.max}
                  onMinus={() => onSkillChange(skill.name, -1)}
                  onPlus={() => onSkillChange(skill.name, 1)}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="mg-right-stack">
          <section className="mg-character-preview-card">
            <div className="mg-character-frame-lg">
              <CharacterPreview classLine={classLine} gender={gender} gear={gear} />
            </div>
            <div className="mg-character-preview-meta">
              <strong>{classLine?.name ?? '角色'} Lv.{level}</strong>
              <span>{weapon?.title ?? '当前装备'}</span>
            </div>
          </section>

          <section className="mg-damage-card">
            <h2>技能伤害</h2>
            <div className="mg-damage-list">
              {plan.damageCards.map((card, index) => (
                <DamageRow key={card.name} card={card} index={index} className={classLine?.id} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mg-actions mg-character-actions">
        <button className="mg-action-small">分享</button>
        <button className="mg-action-main">更换推荐 / 生成路线</button>
        <button className="mg-action-small">百科</button>
      </div>
      <p className="mg-footer">© 2026 MapleGuide | by SduckyDuck</p>
    </section>
  );
}

function PanelHead({ kicker, title, action, onAction }) {
  return (
    <div className="mg-character-panel-head">
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
      <button onClick={onAction}>{action}</button>
    </div>
  );
}

function PointRow({ label, value, points, canMinus, canPlus, onMinus, onPlus }) {
  return (
    <article className="mg-ap-box">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <em>AP +{points}</em>
      </div>
      <div className="mg-mini-controls">
        <button onClick={onMinus} disabled={!canMinus}>-</button>
        <button onClick={onPlus} disabled={!canPlus}>+</button>
      </div>
    </article>
  );
}

function SkillPointRow({ skill, canMinus, canPlus, onMinus, onPlus }) {
  return (
    <article className="mg-skill-row">
      <SkillBadge name={skill.name} />
      <div className="mg-skill-main">
        <strong>{skill.name}</strong>
        <span>Lv. {skill.level}/{skill.max} · [+/-]</span>
      </div>
      <div className="mg-mini-controls">
        <button onClick={onMinus} disabled={!canMinus}>-</button>
        <button onClick={onPlus} disabled={!canPlus}>+</button>
      </div>
    </article>
  );
}

function DamageRow({ card, index, className }) {
  return (
    <article className="mg-damage-row">
      <SkillBadge name={card.name} index={index} className={className} />
      <div>
        <strong>{card.name}</strong>
        <span>{card.isBase ? '普通攻击' : `Lv. ${card.level}/${card.maxLevel} · ${card.role}`}</span>
      </div>
      <em>{card.min} - {card.max}</em>
    </article>
  );
}

function SkillBadge({ name, index = 0, className = '' }) {
  const letters = String(name || '?').replace(/\s+/g, '').slice(0, 2);
  return <div className={`mg-skill-badge ${className} badge-${index % 4}`}><span>{letters}</span></div>;
}
