import { useEffect, useMemo, useState } from 'react';
import { fetchCommunityBuild, fetchCommunityBuilds, submitCommunityBuild } from '../services/buildApi.js';
import '../styles/community-builds.css';

const STORAGE_KEY = 'mscw-guidebook-state-v2';

const JOB_LABELS = {
  warrior: '战士',
  magician: '魔法师',
  bowman: '弓箭手',
  thief: '飞侠',
  pirate: '海盗',
};

const BRANCH_LABELS = {
  warrior: '战士',
  fighter: '剑客',
  page: '准骑士',
  spearman: '枪战士',
  magician: '魔法师',
  fp: '火毒法师',
  il: '冰雷法师',
  cleric: '牧师',
  bowman: '弓箭手',
  hunter: '猎人',
  crossbowman: '弩弓手',
  thief: '飞侠',
  assassin: '刺客',
  bandit: '侠客',
  pirate: '海盗',
  brawler: '拳手',
  gunslinger: '火枪手',
};

const BUDGET_LABELS = {
  low: '低资金',
  mid: '普通',
  high: '有钱',
};

const PRIORITY_LABELS = {
  stable: '稳定',
  exp: '经验',
  material: '材料',
  meso: '金币',
};

const EDITION_LABELS = {
  global: '国际服',
  china: '国服',
};

const GENDER_LABELS = {
  male: '男',
  female: '女',
};

const STAT_LABELS = {
  STR: 'STR',
  DEX: 'DEX',
  INT: 'INT',
  LUK: 'LUK',
  HP: 'HP',
  MP: 'MP',
  ACC: 'ACC',
  AVOID: 'AVOID',
};

const SLOT_LABELS = {
  weapon: '武器',
  cap: '头盔',
  overall: '套服',
  top: '上衣',
  bottom: '下衣',
  shoes: '鞋子',
  glove: '手套',
  shield: '盾牌',
  cape: '披风',
  earring: '耳环',
};

function readSavedGuideState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getBuildIdFromPath() {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/builds\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : '';
}

function formatLabel(map, value, fallback = '-') {
  return map[value] ?? value ?? fallback;
}

function createPayloadFromSavedState(form, savedState) {
  const classId = savedState.classId || 'unknown';
  const branchId = savedState.branchId || classId;
  const tags = [classId, branchId, savedState.budget, savedState.priority].filter(Boolean);

  return {
    title: form.title,
    authorName: form.authorName,
    description: form.description,
    tags,
    job: classId,
    branch: branchId,
    level: Number(savedState.level) || 1,
    budget: savedState.budget || '',
    priority: savedState.priority || '',
    mode: savedState.editionId || '',
    stats: {
      apAllocation: savedState.apAllocation ?? null,
      gender: savedState.gender ?? '',
      editionId: savedState.editionId ?? '',
    },
    skills: savedState.skillAllocation ?? {},
    gear: savedState.gearOverrides ?? {},
    maps: {},
  };
}

function navigateTo(path) {
  if (typeof window === 'undefined') return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function entriesFromObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '');
}

function getApRows(stats) {
  const allocation = stats?.apAllocation;
  return entriesFromObject(allocation)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .map(([key, value]) => ({ label: STAT_LABELS[key] ?? key, value: Number(value) }));
}

function getSkillRows(skills) {
  return entriesFromObject(skills)
    .map(([name, level]) => ({ name, level: Number(level) || 0 }))
    .filter((skill) => skill.level > 0)
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

function getGearRows(gear) {
  return entriesFromObject(gear)
    .filter(([, item]) => item && typeof item === 'object')
    .map(([slot, item]) => ({
      slot,
      slotLabel: SLOT_LABELS[slot] ?? slot,
      title: item.title || item.name || item.label || '未命名装备',
      reqLevel: item.reqLevel ?? item.level ?? '-',
      detail: [item.weaponType, item.reqJobLabel, item.scoreLabel, item.attackSpeed].filter(Boolean).join(' · '),
    }));
}

function copyShareUrl(url, onCopied) {
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(url).then(() => onCopied?.()).catch(() => {});
}

export default function CommunityBuildsPage() {
  const [routeKey, setRouteKey] = useState(() => (typeof window === 'undefined' ? '/builds' : window.location.pathname));
  const buildId = useMemo(() => getBuildIdFromPath(), [routeKey]);

  useEffect(() => {
    const sync = () => setRouteKey(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  return <main className="community-builds-shell">
    <header className="community-builds-hero">
      <button className="community-back" onClick={() => navigateTo('/')}>← 返回工具</button>
      <div>
        <p className="community-kicker">MSCW Guidebook</p>
        <h1>玩家 Build 库</h1>
        <p>保存你的职业、等级、AP、技能和装备配置，提交后其他玩家可以浏览和分享。</p>
      </div>
      <button className="community-primary" onClick={() => navigateTo('/builds')}>浏览 Build</button>
    </header>

    {buildId ? <BuildDetail buildId={buildId} /> : <BuildLibrary />}
  </main>;
}

function BuildLibrary() {
  const [savedState, setSavedState] = useState(() => readSavedGuideState());
  const [form, setForm] = useState({ title: '', authorName: '', description: '' });
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshBuilds = async () => {
    setLoading(true);
    setError('');
    try {
      setBuilds(await fetchCommunityBuilds());
    } catch (err) {
      setError(err.message || 'Build 列表读取失败。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshBuilds(); }, []);

  const reloadCurrentBuild = () => {
    setSavedState(readSavedGuideState());
    setMessage('已重新读取你当前工具里的角色配置。');
  };

  const submitBuild = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const payload = createPayloadFromSavedState(form, savedState);
      const build = await submitCommunityBuild(payload);
      setForm({ title: '', authorName: form.authorName, description: '' });
      setMessage('提交成功，可以复制分享链接。');
      await refreshBuilds();
      navigateTo(`/builds/${build.id}`);
    } catch (err) {
      setError(err.message || '提交失败。');
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="community-builds-grid">
    <section className="community-panel submit-panel">
      <div className="community-panel-head">
        <h2>提交当前 Build</h2>
        <button onClick={reloadCurrentBuild}>重新读取当前配置</button>
      </div>
      <CurrentBuildSummary savedState={savedState} />
      <form className="community-form" onSubmit={submitBuild}>
        <label>
          Build 标题
          <input value={form.title} maxLength={80} required placeholder="例如：低资金战士 10-30 开荒路线" onChange={(e) => setForm((old) => ({ ...old, title: e.target.value }))} />
        </label>
        <label>
          作者名
          <input value={form.authorName} maxLength={40} placeholder="不填则显示匿名玩家" onChange={(e) => setForm((old) => ({ ...old, authorName: e.target.value }))} />
        </label>
        <label>
          说明
          <textarea value={form.description} maxLength={1200} placeholder="写一下这个 Build 适合谁，怎么加点，为什么这么配。" onChange={(e) => setForm((old) => ({ ...old, description: e.target.value }))} />
        </label>
        <button className="community-primary wide" disabled={submitting}>{submitting ? '提交中...' : '提交 Build'}</button>
      </form>
      {message && <p className="community-success">{message}</p>}
      {error && <p className="community-error">{error}</p>}
    </section>

    <section className="community-panel browse-panel">
      <div className="community-panel-head">
        <h2>公开 Build</h2>
        <button onClick={refreshBuilds}>刷新</button>
      </div>
      {loading && <p className="community-muted">读取中...</p>}
      {!loading && error && <p className="community-error">{error}</p>}
      {!loading && !error && !builds.length && <p className="community-muted">还没有公开 Build。先提交一个测试 Build。</p>}
      <div className="build-card-list">
        {builds.map((build) => <BuildCard build={build} key={build.id} />)}
      </div>
    </section>
  </div>;
}

function CurrentBuildSummary({ savedState }) {
  const hasSavedState = Boolean(savedState && Object.keys(savedState).length);
  if (!hasSavedState) {
    return <p className="community-muted">还没有读取到当前配置。先回到工具页选择职业和等级，再回来提交。</p>;
  }

  return <div className="current-build-summary">
    <SummaryPill label="职业" value={formatLabel(JOB_LABELS, savedState.classId)} />
    <SummaryPill label="二转" value={formatLabel(BRANCH_LABELS, savedState.branchId)} />
    <SummaryPill label="等级" value={`Lv.${savedState.level ?? '-'}`} />
    <SummaryPill label="资金" value={formatLabel(BUDGET_LABELS, savedState.budget)} />
    <SummaryPill label="优先" value={formatLabel(PRIORITY_LABELS, savedState.priority)} />
  </div>;
}

function SummaryPill({ label, value }) {
  return <div className="summary-pill"><span>{label}</span><strong>{value}</strong></div>;
}

function BuildCard({ build }) {
  const shareUrl = typeof window === 'undefined' ? `/builds/${build.id}` : `${window.location.origin}/builds/${build.id}`;
  const copy = async (event) => {
    event.stopPropagation();
    copyShareUrl(shareUrl);
  };

  return <article className="build-card" onClick={() => navigateTo(`/builds/${build.id}`)}>
    <div>
      <h3>{build.title}</h3>
      <p>{build.description || '暂无说明。'}</p>
      <div className="build-tags">
        <span>{formatLabel(JOB_LABELS, build.job)}</span>
        <span>{formatLabel(BRANCH_LABELS, build.branch)}</span>
        <span>Lv.{build.level}</span>
        <span>{formatLabel(BUDGET_LABELS, build.budget)}</span>
      </div>
    </div>
    <footer>
      <span>by {build.authorName || '匿名玩家'} · {build.views ?? 0} views</span>
      <button onClick={copy}>复制链接</button>
    </footer>
  </article>;
}

function BuildDetail({ buildId }) {
  const [build, setBuild] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    fetchCommunityBuild(buildId)
      .then((data) => { if (alive) setBuild(data); })
      .catch((err) => { if (alive) setError(err.message || 'Build 读取失败。'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [buildId]);

  if (loading) return <section className="community-panel"><p className="community-muted">读取 Build 中...</p></section>;
  if (error) return <section className="community-panel"><p className="community-error">{error}</p></section>;
  if (!build) return null;

  const shareUrl = typeof window === 'undefined' ? `/builds/${build.id}` : `${window.location.origin}/builds/${build.id}`;
  const apRows = getApRows(build.stats);
  const skillRows = getSkillRows(build.skills);
  const gearRows = getGearRows(build.gear);

  const handleCopy = () => {
    copyShareUrl(shareUrl, () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return <section className="community-panel detail-panel">
    <div className="detail-head">
      <div>
        <p className="community-kicker">公开 Build</p>
        <h2>{build.title}</h2>
        <p>{build.description || '暂无说明。'}</p>
      </div>
      <div className="detail-actions">
        <button className="community-back" onClick={() => navigateTo('/builds')}>← 回到 Build 库</button>
        <button className="community-primary" onClick={handleCopy}>{copied ? '已复制' : '复制分享链接'}</button>
      </div>
    </div>

    <div className="current-build-summary detail-summary">
      <SummaryPill label="职业" value={formatLabel(JOB_LABELS, build.job)} />
      <SummaryPill label="二转" value={formatLabel(BRANCH_LABELS, build.branch)} />
      <SummaryPill label="等级" value={`Lv.${build.level ?? '-'}`} />
      <SummaryPill label="资金" value={formatLabel(BUDGET_LABELS, build.budget)} />
      <SummaryPill label="优先" value={formatLabel(PRIORITY_LABELS, build.priority)} />
      <SummaryPill label="浏览" value={build.views ?? 0} />
    </div>

    <div className="build-readable-layout">
      <ReadablePanel title="AP / 基础配置" subtitle="提交时保存的手动 AP 与基础参数。">
        <div className="ap-stat-grid">
          {apRows.length ? apRows.map((row) => <StatTile key={row.label} label={row.label} value={row.value} />) : <EmptyReadableState text="这个 Build 使用系统推荐 AP，没有保存手动 AP。" />}
        </div>
        <div className="mini-meta-row">
          <span>版本：{formatLabel(EDITION_LABELS, build.stats?.editionId)}</span>
          <span>性别：{formatLabel(GENDER_LABELS, build.stats?.gender)}</span>
        </div>
      </ReadablePanel>

      <ReadablePanel title="技能配置" subtitle="只展示投入点数大于 0 的技能。">
        {skillRows.length ? <div className="skill-readable-list">
          {skillRows.map((skill) => <SkillReadableRow key={skill.name} skill={skill} />)}
        </div> : <EmptyReadableState text="这个 Build 没有保存手动技能配置。" />}
      </ReadablePanel>

      <ReadablePanel title="手动装备配置" subtitle="只展示玩家主动替换过的装备。">
        {gearRows.length ? <div className="gear-readable-grid">
          {gearRows.map((item) => <GearReadableTile key={item.slot} item={item} />)}
        </div> : <EmptyReadableState text="暂无手动替换装备；打开时会按当前推荐逻辑生成装备。" />}
      </ReadablePanel>
    </div>
  </section>;
}

function ReadablePanel({ title, subtitle, children }) {
  return <section className="readable-panel">
    <div className="readable-panel-head">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {children}
  </section>;
}

function StatTile({ label, value }) {
  return <div className="ap-stat-tile">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>;
}

function SkillReadableRow({ skill }) {
  const letters = skill.name.replace(/[^a-zA-Z]/g, '').slice(0, 2) || skill.name.slice(0, 2);
  return <article className="skill-readable-row">
    <div className="skill-readable-icon">{letters}</div>
    <div>
      <strong>{skill.name}</strong>
      <span>已投入 {skill.level} 点</span>
    </div>
    <em>Lv. {skill.level}</em>
  </article>;
}

function GearReadableTile({ item }) {
  return <article className="gear-readable-tile">
    <span>{item.slotLabel}</span>
    <strong>{item.title}</strong>
    <p>Lv.{item.reqLevel}{item.detail ? ` · ${item.detail}` : ''}</p>
  </article>;
}

function EmptyReadableState({ text }) {
  return <div className="empty-readable-state">{text}</div>;
}
