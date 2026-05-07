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
    try { await navigator.clipboard.writeText(shareUrl); } catch { /* ignore */ }
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

  return <section className="community-panel detail-panel">
    <div className="detail-head">
      <div>
        <p className="community-kicker">公开 Build</p>
        <h2>{build.title}</h2>
        <p>{build.description || '暂无说明。'}</p>
      </div>
      <button className="community-primary" onClick={() => navigator.clipboard?.writeText(shareUrl)}>复制分享链接</button>
    </div>

    <div className="current-build-summary detail-summary">
      <SummaryPill label="职业" value={formatLabel(JOB_LABELS, build.job)} />
      <SummaryPill label="二转" value={formatLabel(BRANCH_LABELS, build.branch)} />
      <SummaryPill label="等级" value={`Lv.${build.level ?? '-'}`} />
      <SummaryPill label="资金" value={formatLabel(BUDGET_LABELS, build.budget)} />
      <SummaryPill label="优先" value={formatLabel(PRIORITY_LABELS, build.priority)} />
      <SummaryPill label="浏览" value={build.views ?? 0} />
    </div>

    <div className="detail-sections">
      <JsonBlock title="AP / 基础配置" value={build.stats} />
      <JsonBlock title="技能配置" value={build.skills} />
      <JsonBlock title="手动装备配置" value={build.gear} />
    </div>
  </section>;
}

function JsonBlock({ title, value }) {
  const text = JSON.stringify(value ?? {}, null, 2);
  return <section className="json-block">
    <h3>{title}</h3>
    <pre>{text === '{}' ? '暂无自定义数据' : text}</pre>
  </section>;
}
