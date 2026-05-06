const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];

export default function SkillPanel({
  plan,
  apNote,
  statPlan,
  classLine,
  apAllocation,
  onApChange,
  onApReset,
  onSkillChange,
  onSkillReset,
}) {
  return (
    <>
      <section className="section-card planner-card">
        <div className="planner-head">
          <div>
            <span className="item-label">AP 加点</span>
            <h2>能力值分配</h2>
          </div>
          <button className="planner-reset" onClick={onApReset}>系统推荐</button>
        </div>
        <p className="section-copy">{apNote}</p>
        <div className="planner-meter">
          <span>已分配 {statPlan.totalAp - statPlan.remainingAp}/{statPlan.totalAp}</span>
          <strong>剩余 AP {statPlan.remainingAp}</strong>
        </div>
        <div className="point-grid">
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

      <section className="section-card planner-card">
        <div className="planner-head">
          <div>
            <span className="item-label">SP 加点</span>
            <h2>技能点分配</h2>
          </div>
          <button className="planner-reset" onClick={onSkillReset}>系统推荐</button>
        </div>
        <p className="section-copy">{plan.summary}</p>
        <div className="planner-meter">
          <span>已分配 {plan.usedSp}/{plan.totalSp}</span>
          <strong>剩余 SP {plan.remainingSp}</strong>
        </div>
        <div className="mini-table">
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

      <section className="section-card">
        <h2>技能伤害</h2>
        <div className="mini-table">
          {plan.damageCards.map((card) => (
            <div key={card.name} className="route-row damage-calc-row">
              <div>
                <strong>{card.name}</strong>
                <span>{card.isBase ? `${classLine.name} 普通攻击` : `Lv.${card.level}/${card.maxLevel} · ${card.role}`}</span>
              </div>
              <strong>{card.min} ~ {card.max}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PointRow({ label, value, points, canMinus, canPlus, onMinus, onPlus }) {
  return (
    <article className="point-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <em>AP +{points}</em>
      </div>
      <div className="point-controls">
        <button onClick={onMinus} disabled={!canMinus}>-</button>
        <button onClick={onPlus} disabled={!canPlus}>+</button>
      </div>
    </article>
  );
}

function SkillPointRow({ skill, canMinus, canPlus, onMinus, onPlus }) {
  return (
    <div className="route-row skill-point-row">
      <div>
        <strong>{skill.name}</strong>
        <span>{skill.level}/{skill.max}</span>
      </div>
      <div className="point-controls">
        <button onClick={onMinus} disabled={!canMinus}>-</button>
        <button onClick={onPlus} disabled={!canPlus}>+</button>
      </div>
    </div>
  );
}
