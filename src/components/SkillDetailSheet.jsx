import IconFallback, { baseUrl, iconSourcesFromNames } from './IconFallback.jsx';

const SKILL_ICON_FOLDERS = ['icons/skill', 'icons/skills', 'icons'];

const SKILL_ICON_ALIASES = {
  'Base Attack': ['base attack', 'basic attack', 'attack', 'normal attack'],
  '基础攻击': ['base attack', 'basic attack', 'attack', 'normal attack'],
  '强力攻击': ['power strike', '1001001_Power_Strike'],
  '群体攻击': ['slash blast', '1001002_Slash_Blast'],
  '提高 HP 恢复': ['improved hp recovery', '1000000_Improved_HP_Recovery'],
  '提高 HP 上限': ['max hp increase', '1000001_Max_HP_Increase'],
  '精准打击': ['precise strikes', '1000002_Precise_Strikes'],
  '铁甲术': ['iron body', '1001000_Iron_Body'],
  '魔力弹': ['energy bolt', '2001002_Energy_Bolt'],
  '提高 MP 恢复': ['improved mp recovery', '2000000_Improved_MP_Recovery'],
  '提高 MP 上限': ['max mp increase', '2000001_Max_MP_Increase'],
  '魔法双击': ['magic claw', '2001003_Magic_Claw'],
  '魔法盾': ['magic guard', '2001000_Magic_Guard'],
  '魔法铠甲': ['magic armor', '2001001_Magic_Armor'],
  '强力箭': ['critical shot', '3000000_Critical_Shot'],
  '远程箭': ['eye of amazon', '3000002_The_Eye_of_Amazon'],
  '集中术': ['focus', '3001000_Focus'],
  '断魂箭': ['arrow blow', '3001001_Arrow_Blow'],
  '二连射': ['double shot', '3001002_Double_Shot'],
  '双飞斩': ['lucky seven', '4001003_Lucky_Seven'],
  '劈空斩': ['double stab', '4001002_Double_Stab'],
  '远程暗器': ['keen eyes', '4000001_Keen_Eyes'],
  '诅咒术': ['disorder', '4001000_Disorder'],
  '隐身': ['dark sight', '4001001_Dark_Sight'],
  '灵巧身手': ['nimble body', '4000000_Nimble_Body'],
  '剑精通': ['sword mastery', '1100000_Sword_Mastery', '1200000_Sword_Mastery'],
  '斧精通': ['axe mastery', '1100001_Axe_Mastery'],
  '钝器精通': ['blunt weapon mastery', '1200001_Blunt_Weapon_Mastery'],
  '枪精通': ['spear mastery', '1300000_Spear_Mastery'],
  '矛精通': ['polearm mastery', '1300001_Polearm_Mastery'],
  '终极剑': ['final attack sword', '1101000_Final_Attack_Sword', '1201000_Final_Attack_Sword'],
  '终极斧': ['final attack axe', '1101001_Final_Attack_Axe'],
  '终极钝器': ['final attack blunt weapon', '1201001_Final_Attack_Blunt_Weapon'],
  '终极枪': ['final attack spear', '1301000_Final_Attack_Spear'],
  '终极矛': ['final attack polearm', '1301001_Final_Attack_Polearm'],
  '剑加速': ['sword booster', '1101002_Sword_Booster', '1201002_Sword_Booster'],
  '斧加速': ['axe booster', '1101003_Axe_Booster'],
  '钝器加速': ['blunt weapon booster', '1201003_Blunt_Weapon_Booster'],
  '枪加速': ['spear booster', '1301002_Spear_Booster'],
  '矛加速': ['polearm booster', '1301003_Polearm_Booster'],
  '愤怒': ['rage', '1101004_Rage'],
  '伤害反击': ['power guard', '1101005_Power_Guard', '1201005_Power_Guard'],
  '压制术': ['threaten', '1201004_Threaten'],
  '钢铁意志': ['iron will', '1301004_Iron_Will'],
  '神圣之火': ['hyper body', '1301005_Hyper_Body'],
  'MP 吸收': ['mp eater', '2100000_MP_Eater', '2200000_MP_Eater', '2300000_MP_Eater'],
  '精神力': ['meditation', '2101000_Meditation', '2201000_Meditation'],
  '瞬间移动': ['teleport', '2101001_Teleport', '2201001_Teleport', '2301000_Teleport'],
  '缓速术': ['slow', '2101002_Slow', '2201002_Slow'],
  '火箭术': ['fire arrow', '2101003_Fire_Arrow'],
  '毒雾': ['poison breath', '2101004_Poison_Breath'],
  '冰冻术': ['cold beam', '2201003_Cold_Beam'],
  '雷电术': ['thunder bolt', '2201004_Thunder_Bolt'],
  '治愈术': ['heal', '2301001_Heal'],
  '神之保护': ['invincible', '2301002_Invincible'],
  '祝福': ['bless', '2301003_Bless'],
  '圣箭术': ['holy arrow', '2301004_Holy_Arrow'],
  '弓精通': ['bow mastery', '3100000_Bow_Mastery'],
  '终极弓': ['final attack bow', '3101000_Final_Attack_Bow'],
  '弓加速': ['bow booster', '3101001_Bow_Booster'],
  '强弓': ['power knockback', '3101002_Power_Knockback'],
  '无形箭': ['soul arrow bow', '3101003_Soul_Arrow_Bow'],
  '爆炸箭': ['arrow bomb bow', '3101004_Arrow_Bomb_Bow'],
  '弩精通': ['crossbow mastery', '3200000_Crossbow_Mastery'],
  '终极弩': ['final attack crossbow', '3201000_Final_Attack_Crossbow'],
  '弩加速': ['crossbow booster', '3201001_Crossbow_Booster'],
  '强弩': ['power knockback', '3201002_Power_Knockback'],
  '无形弩': ['soul arrow crossbow', '3201003_Soul_Arrow_Crossbow'],
  '穿透箭': ['iron arrow crossbow', '3201004_Iron_Arrow_Crossbow'],
  '精准暗器': ['claw mastery', '4100000_Claw_Mastery'],
  '强力投掷': ['critical throw', '4100001_Critical_Throw'],
  '恢复术': ['critical recovery', 'nimble recovery', '4100002_Critical_Recovery', '4200001_Nimble_Recovery'],
  '快速暗器': ['claw booster', '4101000_Claw_Booster'],
  '轻功': ['haste', '4101001_Haste', '4201001_Haste'],
  '吸血': ['drain', '4101002_Drain'],
  '精准短刀': ['dagger mastery', '4200000_Dagger_Mastery'],
  '快速短刀': ['dagger booster', '4201000_Dagger_Booster'],
  '偷窃': ['steal', '4201002_Steal'],
  '回旋斩': ['savage blow', '4201003_Savage_Blow'],
};

const SKILL_NOTES = {
  '魔法双击': '发射两道魔法爪攻击单体怪物，是法师一转最主要的练级输出技能。',
  '魔力弹': '基础魔法攻击，通常只点 1 点作为前置，后续用魔法双击替代。',
  '提高 MP 恢复': '提高站立时 MP 自然恢复效率，属于续航型被动技能。',
  '提高 MP 上限': '升级时增加更多 MP，是法师早期最重要的成长技能之一。',
  '魔法盾': '受到伤害时用 MP 抵消一部分 HP 伤害，提高容错。',
  '魔法铠甲': '临时提高防御力，前期开荒可以减少吃药压力。',
  '强力攻击': '战士一转单体主攻技能，适合打血量较高的怪。',
  '群体攻击': '战士一转范围清怪技能，适合怪物密集地图。',
  '提高 HP 上限': '升级时增加更多 HP，越早点满收益越高。',
  '强力箭': '弓箭手的暴击型被动技能，提高输出上限。',
  '远程箭': '增加攻击距离，让弓箭手更容易风筝怪物。',
  '集中术': '临时提高命中和回避，适合命中偏紧时使用。',
  '断魂箭': '弓箭手早期单体攻击技能。',
  '二连射': '连续射击两次，是弓箭手一转常见主攻技能。',
  '双飞斩': '标飞一转核心输出技能，一次投掷两枚飞镖。',
  '劈空斩': '刀飞一转近战攻击技能。',
  '远程暗器': '增加飞镖射程，是标飞早期很关键的被动技能。',
  '隐身': '进入隐身状态，适合赶路和躲避怪物。',
  '灵巧身手': '提高命中和回避，增强飞侠基础手感。',
  '轻功': '提高移动速度和跳跃力，是飞侠二转非常实用的辅助技能。',
  '回旋斩': '刀飞二转高段数爆发技能。',
  '治愈术': '恢复队友 HP，对亡灵怪也能造成伤害。',
  '祝福': '提高队伍命中、回避、防御等属性。',
  '神圣之火': '提高队伍最大 HP/MP，是枪战士核心辅助技能。',
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

function getSkillSources(name, iconKey = '') {
  if (name === 'Base Attack' || name === '基础攻击') return [];
  const names = getSkillNames(name);
  return unique([
    publicIconAsset(iconKey),
    ...iconSourcesFromNames(names, SKILL_ICON_FOLDERS),
  ]);
}

function getSkillDescription(skill, plan) {
  const damage = plan?.damageCards?.find((card) => card.name === skill.name);
  const points = Number(skill.level || 0);
  const base = SKILL_NOTES[skill.name] || (skill.locked ? '该技能目前还没有开放，达到对应转职等级后才可以加点。' : '当前技能描述使用通用模板；后续可以接入 AppData 的逐级技能表。');
  if (damage && points > 0) {
    return `${base} 当前投入 ${points} 点，估算伤害为 ${damage.min} - ${damage.max}。`;
  }
  if (points > 0) return `${base} 当前投入 ${points} 点，主要效果会随技能等级提升。`;
  return `${base} 当前还没有投入 SP。`;
}

function SkillIcon({ skill }) {
  const letters = String(skill?.name || '?').replace(/\s+/g, '').slice(0, 2);
  return (
    <div className="mg-skill-badge detail">
      <IconFallback
        className="mg-skill-icon-img"
        names={getSkillNames(skill?.name)}
        folders={SKILL_ICON_FOLDERS}
        sources={getSkillSources(skill?.name, skill?.iconKey)}
        alt=""
        fallback={<span>{letters}</span>}
      />
    </div>
  );
}

export default function SkillDetailSheet({ skill, plan, onClose }) {
  if (!skill) return null;
  const damage = plan?.damageCards?.find((card) => card.name === skill.name);
  const nextLevel = Math.min(Number(skill.max || 0), Number(skill.level || 0) + 1);
  const hasNext = !skill.locked && Number(skill.level || 0) < Number(skill.max || 0);

  return (
    <div className="mg-detail-backdrop" onClick={onClose}>
      <section className="mg-detail-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mg-detail-head">
          <SkillIcon skill={skill} />
          <div>
            <span>{skill.tierLabel || (skill.tier === 'second' ? '二转技能' : '一转技能')}</span>
            <h2>{skill.name}</h2>
            <p>当前 Lv. {skill.level}/{skill.max}</p>
          </div>
          <button onClick={onClose}>关闭</button>
        </div>

        <div className="mg-detail-kpis">
          <div><span>已投入 SP</span><strong>{skill.level}</strong></div>
          <div><span>最高等级</span><strong>{skill.max}</strong></div>
          <div><span>状态</span><strong>{skill.locked ? '未开放' : '可调整'}</strong></div>
        </div>

        <p className="mg-detail-copy">{getSkillDescription(skill, plan)}</p>

        {damage && (
          <div className="mg-detail-damage">
            <span>{damage.role || '技能效果'}</span>
            <strong>{damage.min} - {damage.max}</strong>
            <em>基于当前角色属性和当前技能点的估算值。</em>
          </div>
        )}

        <div className="mg-detail-list">
          <div><span>当前等级说明</span><strong>{skill.level > 0 ? `已经加了 ${skill.level} 点，可以作为当前路线使用。` : '还没有加点，只显示技能预览。'}</strong></div>
          <div><span>下一级预览</span><strong>{hasNext ? `再加 1 点后变为 Lv.${nextLevel}/${skill.max}` : '已经满级或暂未开放。'}</strong></div>
        </div>
      </section>
    </div>
  );
}
