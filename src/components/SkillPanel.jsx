import CharacterPreview from './CharacterPreview.jsx';
import IconFallback, { iconSourcesFromNames } from './IconFallback.jsx';

const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];

const SKILL_ICON_ALIASES = {
  'Base Attack': ['base attack', 'basic attack', 'attack', 'normal attack', 'sword', 'slash'],
  '基础攻击': ['base attack', 'basic attack', 'attack', 'normal attack'],
  '强力攻击': ['power strike', 'power-strike', 'power_strike', 'powerstrike'],
  '群体攻击': ['slash blast', 'slash-blast', 'slash_blast', 'slashblast'],
  '提高 HP 恢复': ['improving hp recovery', 'hp recovery', 'hp-recovery'],
  '提高 HP 上限': ['improving max hp increase', 'max hp', 'max-hp'],
  '精准打击': ['accuracy', 'precision', 'mastery'],
  '精准剑/斧': ['sword mastery', 'axe mastery', 'mastery'],
  '精准钝器/剑': ['sword mastery', 'blunt weapon mastery', 'mastery'],
  '精准枪/矛': ['spear mastery', 'pole arm mastery', 'mastery'],
  '快速武器': ['booster', 'weapon booster'],
  '快速枪/矛': ['spear booster', 'pole arm booster', 'booster'],
  '终极剑/斧': ['final attack', 'final-attack'],
  '极限防御': ['iron will', 'hyper body', 'defense'],
  '魔力弹': ['energy bolt', 'energy-bolt', 'magic bolt'],
  '提高 MP 恢复': ['improving mp recovery', 'mp recovery', 'mp-recovery'],
  '提高 MP 上限': ['improving max mp increase', 'max mp', 'max-mp'],
  '魔法双击': ['magic claw', 'magic-claw'],
  '魔法盾': ['magic guard', 'magic-guard'],
  '魔法铠甲': ['magic armor', 'magic-armor'],
  '火箭术': ['fire arrow', 'fire-arrow', 'fire_arrow'],
  '毒雾': ['poison brace', 'poison mist', 'poison'],
  '精神力': ['meditation', 'spell booster', 'focus'],
  '冰冻术': ['cold beam', 'cold-beam', 'ice strike', 'ice'],
  '雷电术': ['thunder bolt', 'thunder-bolt', 'thunderbolt', 'lightning'],
  '治愈术': ['heal', 'healing'],
  '祝福': ['bless'],
  '精准箭': ['blessing of amazon', 'amazon eye', 'arrow mastery'],
  '强力箭': ['critical shot', 'critical-shot', 'powerful arrow'],
  '远程箭': ['eye of amazon', 'range'],
  '集中术': ['focus'],
  '断魂箭': ['arrow blow', 'arrow-blow'],
  '精准弓': ['bow mastery', 'bow-mastery'],
  '快速弓': ['bow booster', 'bow-booster'],
  '终极弓': ['final attack bow', 'final-attack-bow'],
  '爆炸箭': ['explosion arrow', 'explosive arrow', 'arrow bomb'],
  '精准弩': ['crossbow mastery', 'crossbow-mastery'],
  '快速弩': ['crossbow booster', 'crossbow-booster'],
  '终极弩': ['final attack crossbow', 'final-attack-crossbow'],
  '穿透箭': ['iron arrow', 'piercing arrow'],
  '双飞斩': ['lucky seven', 'lucky-seven', 'luckyseven'],
  '劈空斩': ['double stab', 'double-stab'],
  '远程暗器': ['keen eyes', 'keen-eyes'],
  '诅咒术': ['disorder', 'curse'],
  '隐身': ['dark sight', 'dark-sight'],
  '精准暗器': ['claw mastery', 'claw-mastery'],
  '强力投掷': ['critical throw', 'critical-throw'],
  '快速暗器': ['claw booster', 'claw-booster'],
  '轻功': ['haste'],
  '精准短刀': ['dagger mastery', 'dagger-mastery'],
  '快速短刀': ['dagger booster', 'dagger-booster'],
  '回旋斩': ['savage blow', 'savage-blow'],
};

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

function getSkillSources(name) {
  const aliases = SKILL_ICON_ALIASES[name] ?? [];
  return iconSourcesFromNames([name, ...aliases], ['icons/skills', 'icons/skill', 'icons']);
}

function SkillBadge({ name, index = 0, className = '' }) {
  const letters = String(name || '?').replace(/\s+/g, '').slice(0, 2);
  return (
    <div className={`mg-skill-badge ${className} badge-${index % 4}`}>
      <IconFallback
        className="mg-skill-icon-img"
        sources={getSkillSources(name)}
        alt=""
        fallback={<span>{letters}</span>}
      />
    </div>
  );
}
