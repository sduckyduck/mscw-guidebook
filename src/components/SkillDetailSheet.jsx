import { translateSkillEffectType, translateSkillText } from '../engine/skillTextTranslator.js';

const BASE_URL = import.meta.env?.BASE_URL || '/';

function asset(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(String(path))) return String(path);
  return `${BASE_URL}${String(path).replace(/^\/+/, '')}`;
}

function levelOf(skill, offset = 0) {
  const max = Number(skill?.max || skill?.maxLevel || 0);
  return Math.max(0, Math.min(max, Number(skill?.level || 0) + offset));
}

function mk(type, note, current, next, values = []) {
  return { type, note, current, next, values };
}

function normalizeLevelStats(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, row]) => {
      if (typeof row === 'string') return row;
      if (!row || typeof row !== 'object') return String(row ?? '');
      return row.effect ?? row.desc ?? row.description ?? row.text ?? Object.entries(row)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k} ${v}`)
        .join('; ');
    });
}

function officialStats(skill) {
  return normalizeLevelStats(
    skill?.allLevelStats
      ?? skill?.all_level_stats
      ?? skill?.levelStats
      ?? skill?.levels
      ?? skill?.levelData
      ?? skill?.effectByLevel
      ?? skill?.effects,
  );
}

function cleanDescription(description = '') {
  return translateSkillText(description) || '当前技能数据来自当前版本数据源。';
}

function officialEffectType(skill, currentText = '') {
  const text = `${skill?.description ?? ''} ${currentText}`;
  if (/Damage|Basic Attack|Attack \d+x/i.test(text)) return '主动攻击技能';
  if (/\bfor\s+\d+\s+sec|while active|party/i.test(text)) return '主动增益技能';
  if (/Max HP|Max MP|Accuracy|Avoidability|Mastery|Critical Rate|Critical Damage|Recovery|Recover/i.test(text)) return '被动属性技能';
  return translateSkillEffectType(text);
}

function translateLevelText(value = '') {
  return translateSkillText(value) || String(value || '').trim();
}

function effectPills(text, nextText) {
  return [text, nextText]
    .flatMap((value) => String(value || '').split(/[；;,]/))
    .map((value) => translateLevelText(value).trim())
    .filter(Boolean)
    .slice(0, 4);
}

function officialSkillEffect(skill) {
  const stats = officialStats(skill);
  const lv = levelOf(skill);
  const nx = levelOf(skill, 1);
  const max = Number(skill?.max || skill?.maxLevel || 0);
  const currentRaw = lv > 0 ? String(stats[lv - 1] ?? '') : '';
  const nextRaw = nx > 0 ? String(stats[nx - 1] ?? '') : '';
  const currentText = translateLevelText(currentRaw);
  const nextText = translateLevelText(nextRaw);

  if (!stats.length) {
    return mk(
      '技能效果',
      cleanDescription(skill?.description),
      `当前 Lv.${lv}：当前没有逐级效果表。请检查 skills.json 是否包含 levels / levelStats / allLevelStats。`,
      lv >= max ? '下一级：已经满级。' : `下一级 Lv.${nx}：请参考技能说明。`,
      [],
    );
  }

  return mk(
    officialEffectType(skill, currentRaw || nextRaw),
    cleanDescription(skill?.description),
    currentText ? `当前 Lv.${lv}：${currentText}` : `当前 Lv.${lv}：尚未投入 SP，当前没有等级效果。`,
    lv >= max ? `下一级：已经满级。当前效果保持：${currentText || translateLevelText(stats[max - 1]) || '无'}` : `下一级 Lv.${nx}：${nextText}`,
    effectPills(currentRaw, nextRaw),
  );
}

function getDataSourceLabel(skill) {
  if (skill?.source === 'fallback') return '内置兜底路线';
  if (String(skill?.iconKey ?? skill?.thumbnail ?? '').includes('/cms/')) return '国服 CMS';
  if (String(skill?.iconKey ?? skill?.thumbnail ?? '').includes('AppData')) return '国际服 AppData';
  return skill?.source === 'official' ? '当前版本技能数据' : '未知来源';
}

function SkillIcon({ skill }) {
  const letters = String(skill?.name || '?').replace(/\s+/g, '').slice(0, 2);
  const src = asset(skill?.iconKey);
  return (
    <div className="mg-skill-badge detail">
      {src ? <img className="mg-skill-icon-img" src={src} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span>{letters}</span>}
    </div>
  );
}

export default function SkillDetailSheet({ skill, plan, onClose }) {
  if (!skill) return null;
  const damage = plan?.damageCards?.find((card) => card.name === skill.name);
  const effect = officialSkillEffect(skill);
  const currentLevel = Number(skill.level || 0);
  const maxLevel = Number(skill.max || skill.maxLevel || 0);
  const progress = maxLevel > 0 ? Math.round((currentLevel / maxLevel) * 100) : 0;
  const statsRows = officialStats(skill);
  const sourceLabel = getDataSourceLabel(skill);

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
          <div><span>技能 ID</span><strong>{skill.id || '-'}</strong></div>
          <div><span>数据源</span><strong>{sourceLabel}</strong></div>
          <div><span>效果表</span><strong>{statsRows.length ? `${statsRows.length} 行` : '缺失'}</strong></div>
        </div>

        <div className="mg-detail-kpis">
          <div><span>已投入 SP</span><strong>{skill.level}</strong></div>
          <div><span>最高等级</span><strong>{skill.max}</strong></div>
          <div><span>状态</span><strong>{skill.locked ? '未开放' : currentLevel >= maxLevel ? '已满级' : '可调整'}</strong></div>
        </div>

        <div className="mg-skill-progress">
          <span>技能等级进度</span>
          <div><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
          <em>{progress}%</em>
        </div>

        <p className="mg-detail-copy">{effect.note}</p>

        <div className="mg-effect-grid">
          <article><span>技能定位</span><strong>{effect.type}</strong></article>
          <article className="wide"><span>当前等级效果</span><strong>{effect.current}</strong></article>
          <article className="wide"><span>下一级变化</span><strong>{effect.next}</strong></article>
        </div>

        <div className="mg-effect-pills">
          {(effect.values || []).map((value) => <span key={value}>{value}</span>)}
        </div>

        {damage && (
          <div className="mg-detail-damage">
            <span>{damage.role || '路线估算伤害'}</span>
            <strong>{damage.min} - {damage.max}</strong>
            <em>这是根据当前角色属性、装备和当前技能点计算出来的路线估算伤害。上面的百分比是技能等级效果展示。</em>
          </div>
        )}
      </section>
    </div>
  );
}
