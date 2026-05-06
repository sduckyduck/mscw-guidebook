import CharacterPreview from './CharacterPreview.jsx';
import IconFallback, { baseUrl, discoverIconSources, iconSourcesFromNames } from './IconFallback.jsx';

const STAT_KEYS = ['STR', 'DEX', 'INT', 'LUK'];
const SKILL_ICON_FOLDERS = ['icons/skill', 'icons/skills', 'icons'];

const SKILL_ICON_ALIASES = {
  'Base Attack': ['base attack', 'basic attack', 'attack', 'normal attack', 'sword', 'slash'],
  '基础攻击': ['base attack', 'basic attack', 'attack', 'normal attack'],
  '强力攻击': ['power strike', 'power-strike', 'power_strike', 'powerstrike', '1001001_Power_Strike'],
  '群体攻击': ['slash blast', 'slash-blast', 'slash_blast', 'slashblast', '1001002_Slash_Blast'],
  '提高 HP 恢复': ['improved hp recovery', 'improving hp recovery', 'hp recovery', 'hp-recovery', '1000000_Improved_HP_Recovery'],
  '提高 HP 上限': ['max hp increase', 'improved max hp', 'improving max hp increase', 'max hp', 'max-hp', '1000001_Max_HP_Increase'],
  '精准打击': ['precise strikes', 'accuracy', 'precision', 'mastery', '1000002_Precise_Strikes'],
  '精准剑/斧': ['sword mastery', 'axe mastery', 'mastery', '1100000_Sword_Mastery', '1100001_Axe_Mastery'],
  '精准钝器/剑': ['sword mastery', 'blunt weapon mastery', 'mastery', '1200000_Sword_Mastery', '1200001_Blunt_Weapon_Mastery'],
  '精准枪/矛': ['spear mastery', 'polearm mastery', 'pole arm mastery', 'mastery', '1300000_Spear_Mastery', '1300001_Polearm_Mastery'],
  '快速武器': ['booster', 'weapon booster', 'sword booster', 'axe booster'],
  '快速枪/矛': ['spear booster', 'polearm booster', 'pole arm booster', 'booster', '1301002_Spear_Booster', '1301003_Polearm_Booster'],
  '终极剑/斧': ['final attack', 'final-attack', 'final attack sword', 'final attack axe', '1101000_Final_Attack_Sword', '1101001_Final_Attack_Axe'],
  '极限防御': ['iron will', 'hyper body', 'defense', '1301004_Iron_Will', '1301005_Hyper_Body'],

  '魔力弹': ['energy bolt', 'energy-bolt', 'magic bolt', '2001002_Energy_Bolt'],
  '提高 MP 恢复': ['improved mp recovery', 'improving mp recovery', 'mp recovery', 'mp-recovery', '2000000_Improved_MP_Recovery'],
  '提高 MP 上限': ['max mp increase', 'max-mp-increase', 'max_mp_increase', 'improving max mp increase', 'max mp', 'max-mp', '2000001_Max_MP_Increase'],
  '魔法双击': ['magic claw', 'magic-claw', 'magic_claw', '2001003_Magic_Claw'],
  '魔法盾': ['magic guard', 'magic-guard', 'magic_guard', '2001000_Magic_Guard'],
  '魔法铠甲': ['magic armor', 'magic-armor', 'magic_armor', '2001001_Magic_Armor'],
  '火箭术': ['fire arrow', 'fire-arrow', 'fire_arrow', '2101003_Fire_Arrow'],
  '毒雾': ['poison breath', 'poison brace', 'poison mist', 'poison', '2101004_Poison_Breath'],
  '精神力': ['meditation', 'spell booster', 'focus', '2101000_Meditation', '2201000_Meditation'],
  '冰冻术': ['cold beam', 'cold-beam', 'cold_beam', 'ice strike', 'ice', '2201003_Cold_Beam'],
  '雷电术': ['thunder bolt', 'thunder-bolt', 'thunder_bolt', 'thunderbolt', 'lightning', '2201004_Thunder_Bolt'],
  '治愈术': ['heal', 'healing', '2301001_Heal'],
  '祝福': ['bless', '2301003_Bless'],

  '精准箭': ['critical shot', 'blessing of amazon', 'amazon eye', 'arrow mastery', '3000000_Critical_Shot'],
  '强力箭': ['critical shot', 'critical-shot', 'powerful arrow', '3000000_Critical_Shot'],
  '远程箭': ['eye of amazon', 'the eye of amazon', 'range', '3000002_The_Eye_of_Amazon'],
  '集中术': ['focus', '3001000_Focus'],
  '断魂箭': ['arrow blow', 'arrow-blow', '3001001_Arrow_Blow'],
  '精准弓': ['bow mastery', 'bow-mastery', '3100000_Bow_Mastery'],
  '快速弓': ['bow booster', 'bow-booster', '3101001_Bow_Booster'],
  '终极弓': ['final attack bow', 'final-attack-bow', '3101000_Final_Attack_Bow'],
  '爆炸箭': ['arrow bomb bow', 'explosion arrow', 'explosive arrow', 'arrow bomb', '3101004_Arrow_Bomb_Bow'],
  '精准弩': ['crossbow mastery', 'crossbow-mastery', '3200000_Crossbow_Mastery'],
  '快速弩': ['crossbow booster', 'crossbow-booster', '3201001_Crossbow_Booster'],
  '终极弩': ['final attack crossbow', 'final-attack-crossbow', '3201000_Final_Attack_Crossbow'],
  '穿透箭': ['iron arrow crossbow', 'iron arrow', 'piercing arrow', '3201004_Iron_Arrow_Crossbow'],

  '双飞斩': ['lucky seven', 'lucky-seven', 'luckyseven', '4001003_Lucky_Seven'],
  '劈空斩': ['double stab', 'double-stab', '4001002_Double_Stab'],
  '远程暗器': ['keen eyes', 'keen-eyes', '4000001_Keen_Eyes'],
  '诅咒术': ['disorder', 'curse', '4001000_Disorder'],
  '隐身': ['dark sight', 'dark-sight', '4001001_Dark_Sight'],
  '精准暗器': ['claw mastery', 'claw-mastery', '4100000_Claw_Mastery'],
  '强力投掷': ['critical throw', 'critical-throw', '4100001_Critical_Throw'],
  '快速暗器': ['claw booster', 'claw-booster', '4101000_Claw_Booster'],
  '轻功': ['haste', '4101001_Haste', '4201001_Haste'],
  '精准短刀': ['dagger mastery', 'dagger-mastery', '4200000_Dagger_Mastery'],
  '快速短刀': ['dagger booster', 'dagger-booster', '4201000_Dagger_Booster'],
  '回旋斩': ['savage blow', 'savage-blow', '4201003_Savage_Blow'],
};

const LOCAL_SKILL_ICON_BY_NAME = {
  '强力攻击': 'icons/skill/1st_Job/Warrior/1001001_Power_Strike.png',
  '群体攻击': 'icons/skill/1st_Job/Warrior/1001002_Slash_Blast.png',
  '提高 HP 恢复': 'icons/skill/1st_Job/Warrior/1000000_Improved_HP_Recovery.png',
  '提高 HP 上限': 'icons/skill/1st_Job/Warrior/1000001_Max_HP_Increase.png',
  '精准打击': 'icons/skill/1st_Job/Warrior/1000002_Precise_Strikes.png',
  '精准剑/斧': ['icons/skill/2nd_Job/Fighter/1100000_Sword_Mastery.png', 'icons/skill/2nd_Job/Fighter/1100001_Axe_Mastery.png'],
  '精准钝器/剑': ['icons/skill/2nd_Job/Page/1200000_Sword_Mastery.png', 'icons/skill/2nd_Job/Page/1200001_Blunt_Weapon_Mastery.png'],
  '精准枪/矛': ['icons/skill/2nd_Job/Spearman/1300000_Spear_Mastery.png', 'icons/skill/2nd_Job/Spearman/1300001_Polearm_Mastery.png'],
  '快速武器': ['icons/skill/2nd_Job/Fighter/1101002_Sword_Booster.png', 'icons/skill/2nd_Job/Fighter/1101003_Axe_Booster.png'],
  '快速枪/矛': ['icons/skill/2nd_Job/Spearman/1301002_Spear_Booster.png', 'icons/skill/2nd_Job/Spearman/1301003_Polearm_Booster.png'],
  '终极剑/斧': ['icons/skill/2nd_Job/Fighter/1101000_Final_Attack_Sword.png', 'icons/skill/2nd_Job/Fighter/1101001_Final_Attack_Axe.png'],
  '极限防御': ['icons/skill/2nd_Job/Spearman/1301004_Iron_Will.png', 'icons/skill/2nd_Job/Spearman/1301005_Hyper_Body.png'],
  '魔力弹': 'icons/skill/1st_Job/Magician/2001002_Energy_Bolt.png',
  '提高 MP 恢复': 'icons/skill/1st_Job/Magician/2000000_Improved_MP_Recovery.png',
  '提高 MP 上限': 'icons/skill/1st_Job/Magician/2000001_Max_MP_Increase.png',
  '魔法双击': 'icons/skill/1st_Job/Magician/2001003_Magic_Claw.png',
  '魔法盾': 'icons/skill/1st_Job/Magician/2001000_Magic_Guard.png',
  '魔法铠甲': 'icons/skill/1st_Job/Magician/2001001_Magic_Armor.png',
  '火箭术': 'icons/skill/2nd_Job/FP_Wizard/2101003_Fire_Arrow.png',
  '毒雾': 'icons/skill/2nd_Job/FP_Wizard/2101004_Poison_Breath.png',
  '精神力': ['icons/skill/2nd_Job/FP_Wizard/2101000_Meditation.png', 'icons/skill/2nd_Job/IL_Wizard/2201000_Meditation.png'],
  '冰冻术': 'icons/skill/2nd_Job/IL_Wizard/2201003_Cold_Beam.png',
  '雷电术': 'icons/skill/2nd_Job/IL_Wizard/2201004_Thunder_Bolt.png',
  '治愈术': 'icons/skill/2nd_Job/Cleric/2301001_Heal.png',
  '祝福': 'icons/skill/2nd_Job/Cleric/2301003_Bless.png',
  '精准箭': 'icons/skill/1st_Job/Archer/3000000_Critical_Shot.png',
  '强力箭': 'icons/skill/1st_Job/Archer/3000000_Critical_Shot.png',
  '远程箭': 'icons/skill/1st_Job/Archer/3000002_The_Eye_of_Amazon.png',
  '集中术': 'icons/skill/1st_Job/Archer/3001000_Focus.png',
  '断魂箭': 'icons/skill/1st_Job/Archer/3001001_Arrow_Blow.png',
  '精准弓': 'icons/skill/2nd_Job/Hunter/3100000_Bow_Mastery.png',
  '快速弓': 'icons/skill/2nd_Job/Hunter/3101001_Bow_Booster.png',
  '终极弓': 'icons/skill/2nd_Job/Hunter/3101000_Final_Attack_Bow.png',
  '爆炸箭': 'icons/skill/2nd_Job/Hunter/3101004_Arrow_Bomb_Bow.png',
  '精准弩': 'icons/skill/2nd_Job/Crossbowman/3200000_Crossbow_Mastery.png',
  '快速弩': 'icons/skill/2nd_Job/Crossbowman/3201001_Crossbow_Booster.png',
  '终极弩': 'icons/skill/2nd_Job/Crossbowman/3201000_Final_Attack_Crossbow.png',
  '穿透箭': 'icons/skill/2nd_Job/Crossbowman/3201004_Iron_Arrow_Crossbow.png',
  '双飞斩': 'icons/skill/1st_Job/Theif/4001003_Lucky_Seven.png',
  '劈空斩': 'icons/skill/1st_Job/Theif/4001002_Double_Stab.png',
  '远程暗器': 'icons/skill/1st_Job/Theif/4000001_Keen_Eyes.png',
  '诅咒术': 'icons/skill/1st_Job/Theif/4001000_Disorder.png',
  '隐身': 'icons/skill/1st_Job/Theif/4001001_Dark_Sight.png',
  '精准暗器': 'icons/skill/2nd_Job/Assassin/4100000_Claw_Mastery.png',
  '强力投掷': 'icons/skill/2nd_Job/Assassin/4100001_Critical_Throw.png',
  '快速暗器': 'icons/skill/2nd_Job/Assassin/4101000_Claw_Booster.png',
  '轻功': ['icons/skill/2nd_Job/Assassin/4101001_Haste.png', 'icons/skill/2nd_Job/Bandit/4201001_Haste.png'],
  '精准短刀': 'icons/skill/2nd_Job/Bandit/4200000_Dagger_Mastery.png',
  '快速短刀': 'icons/skill/2nd_Job/Bandit/4201000_Dagger_Booster.png',
  '回旋斩': 'icons/skill/2nd_Job/Bandit/4201003_Savage_Blow.png',
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function publicIconAsset(path) {
  if (!path) return '';
  return `${baseUrl()}${String(path).replace(/^\/+/, '')}`;
}

function getSkillNames(name) {
  return [name, ...(SKILL_ICON_ALIASES[name] ?? [])].filter(Boolean);
}

function getLocalSkillSources(name) {
  return unique([LOCAL_SKILL_ICON_BY_NAME[name]].flat().map(publicIconAsset));
}

function installSkillIconDebugger() {
  if (typeof window === 'undefined' || window.MSCWSkills) return;
  window.MSCWSkills = {
    aliases: SKILL_ICON_ALIASES,
    local: LOCAL_SKILL_ICON_BY_NAME,
    names: getSkillNames,
    find: async (name) => {
      const names = getSkillNames(name);
      const found = await discoverIconSources(names, SKILL_ICON_FOLDERS, { limit: 20 });
      console.log('skill query names:', names);
      console.table(found.map((url, index) => ({ index, url })));
      return found;
    },
    test: async (name) => {
      const names = getSkillNames(name);
      const guessed = iconSourcesFromNames(names, SKILL_ICON_FOLDERS);
      const local = getLocalSkillSources(name);
      const discovered = await discoverIconSources(names, SKILL_ICON_FOLDERS, { limit: 20 });
      const all = unique([...local, ...guessed, ...discovered]);
      const checks = await Promise.all(all.map(async (url) => {
        try {
          const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
          return { ok: res.ok, status: res.status, url };
        } catch (error) {
          return { ok: false, status: 'ERR', url };
        }
      }));
      console.log('skill query names:', names);
      console.table(checks);
      return checks;
    },
  };
  console.info('MSCW skill debug ready. Try: await MSCWSkills.test("魔法双击"), await MSCWSkills.test("提高 MP 上限")');
}

installSkillIconDebugger();

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
            <div className="mg-character-meter mg-sp-meter">
              <span>剩余 SP</span>
              <strong>{plan.remainingSp}</strong>
              <em>一转 {plan.remainingByTier?.first ?? 0} / 二转 {plan.remainingByTier?.second ?? 0}</em>
            </div>
            <div className="mg-skill-stack compact">
              {plan.skills.map((skill) => {
                const remainingForTier = plan.remainingByTier?.[skill.tier] ?? plan.remainingSp;
                return (
                  <SkillPointRow
                    key={skill.name}
                    skill={skill}
                    canMinus={!skill.locked && skill.level > 0}
                    canPlus={!skill.locked && remainingForTier > 0 && skill.level < skill.max}
                    onMinus={() => onSkillChange(skill.name, -1)}
                    onPlus={() => onSkillChange(skill.name, 1)}
                  />
                );
              })}
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
  const rowClass = ['mg-skill-row', skill.locked ? 'locked' : '', skill.tier === 'second' ? 'second-job' : 'first-job'].filter(Boolean).join(' ');
  return (
    <article className={rowClass}>
      <SkillBadge name={skill.name} />
      <div className="mg-skill-main">
        <strong>{skill.name}</strong>
        <span>{skill.tierLabel} · Lv. {skill.level}/{skill.max}{skill.locked ? ' · Lv.30 后开放' : ' · [+/-]'}</span>
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
      <SkillBadge name={card.name} index={index} className={className} compact={card.isBase} />
      <div>
        <strong>{card.name}</strong>
        <span>{card.isBase ? '普通攻击' : `Lv. ${card.level}/${card.maxLevel} · ${card.role}`}</span>
      </div>
      <em>{card.min} - {card.max}</em>
    </article>
  );
}

function getSkillSources(name) {
  if (name === 'Base Attack' || name === '基础攻击') return [];
  const names = getSkillNames(name);
  return unique([
    ...getLocalSkillSources(name),
    ...iconSourcesFromNames(names, SKILL_ICON_FOLDERS),
  ]);
}

function SkillBadge({ name, compact = false }) {
  const letters = String(name || '?').replace(/\s+/g, '').slice(0, 2);
  const names = getSkillNames(name);
  return (
    <div className={compact ? 'mg-skill-badge neutral' : 'mg-skill-badge'}>
      <IconFallback
        className="mg-skill-icon-img"
        names={names}
        folders={SKILL_ICON_FOLDERS}
        sources={getSkillSources(name)}
        alt=""
        debugLabel={`skill:${name}`}
        fallback={<span>{letters}</span>}
      />
    </div>
  );
}
