export default function SkillPanel({ plan, apNote }) {
  return (
    <>
      <section className="section-card">
        <p className="section-copy">{apNote}</p>
      </section>

      <section className="section-card">
        <h2>技能 / AP</h2>
        <p className="section-copy">{plan.summary}</p>

        <h3 style={{ marginTop: 18 }}>当前技能</h3>
        <div className="mini-table">
          {plan.current.map((skill) => (
            <div key={skill.name} className="route-row">
              <span>{skill.name}</span>
              <strong>{skill.level}/{skill.max}</strong>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 18 }}>接下来</h3>
        <div className="mini-table">
          {plan.next.map((step) => (
            <div key={`${step.level}-${step.text}`} className="route-row">
              <span>Lv.{step.level}</span>
              <strong>{step.text}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <h2>技能伤害</h2>
        <div className="mini-table">
          {plan.damageCards.map((card) => (
            <div key={card.name} className="route-row" style={{ alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: 18 }}>{card.name}</strong>
                <span style={{ color: 'var(--muted)', fontWeight: 900 }}>Lv.{card.level}/{card.maxLevel} · {card.role}</span>
              </div>
              <strong style={{ color: '#2d6f90', fontSize: 22 }}>{card.min} ~ {card.max}</strong>
            </div>
          ))}
        </div>
        <p className="section-copy" style={{ marginTop: 14 }}>伤害估算：按当前主攻/魔攻、技能等级和旧服技能倍率做开荒参考，后续可替换成国服真实公式。</p>
      </section>
    </>
  );
}
