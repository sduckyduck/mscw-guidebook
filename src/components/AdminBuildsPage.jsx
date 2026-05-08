import { useEffect, useMemo, useState } from 'react';
import {
  deleteAdminBuild,
  fetchAdminBuilds,
  getStoredAdminToken,
  storeAdminToken,
  updateAdminBuild,
} from '../services/adminBuildApi.js';
import '../styles/admin-builds.css';

const VISIBILITY_OPTIONS = [
  ['all', '全部'],
  ['public', '公开'],
  ['hidden', '隐藏'],
];

const JOB_LABELS = {
  warrior: '战士',
  magician: '魔法师',
  bowman: '弓箭手',
  thief: '飞侠',
  pirate: '海盗',
};

function safeDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

function buildUrl(id) {
  if (typeof window === 'undefined') return `/builds/${id}`;
  return `${window.location.origin}/builds/${id}`;
}

export default function AdminBuildsPage() {
  const [token, setToken] = useState(() => getStoredAdminToken());
  const [draftToken, setDraftToken] = useState(() => getStoredAdminToken());
  const [visibility, setVisibility] = useState('all');
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const counts = useMemo(() => {
    return builds.reduce((acc, build) => {
      acc.total += 1;
      acc[build.visibility] = (acc[build.visibility] ?? 0) + 1;
      return acc;
    }, { total: 0, public: 0, hidden: 0 });
  }, [builds]);

  const loadBuilds = async (nextVisibility = visibility, activeToken = token) => {
    if (!activeToken) {
      setError('请输入管理员 Token。');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await fetchAdminBuilds(activeToken, nextVisibility);
      setBuilds(data);
      setMessage(`已读取 ${data.length} 个 Build。`);
    } catch (err) {
      setError(err.message || '读取失败。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadBuilds(visibility, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (event) => {
    event.preventDefault();
    const clean = draftToken.trim();
    storeAdminToken(clean);
    setToken(clean);
    loadBuilds(visibility, clean);
  };

  const logout = () => {
    storeAdminToken('');
    setToken('');
    setDraftToken('');
    setBuilds([]);
    setMessage('已清除本机管理员 Token。');
  };

  const changeVisibilityFilter = (next) => {
    setVisibility(next);
    loadBuilds(next, token);
  };

  const applyLocalUpdate = (updated) => {
    setBuilds((old) => old.map((build) => (build.id === updated.id ? updated : build)));
  };

  const removeLocal = (id) => {
    setBuilds((old) => old.filter((build) => build.id !== id));
  };

  return <main className="admin-shell">
    <section className="admin-hero">
      <div>
        <p className="admin-kicker">MSCW Guidebook Admin</p>
        <h1>Build 审核后台</h1>
        <p>管理玩家提交的 Build：编辑文案、隐藏、恢复公开或删除。</p>
      </div>
      <button onClick={() => window.location.assign('/builds')}>返回玩家 Build 库</button>
    </section>

    <section className="admin-panel admin-login-panel">
      <form onSubmit={login} className="admin-token-form">
        <label>
          管理员 Token
          <input
            type="password"
            value={draftToken}
            placeholder="输入 Cloudflare ADMIN_TOKEN"
            onChange={(event) => setDraftToken(event.target.value)}
          />
        </label>
        <button type="submit">登录 / 刷新权限</button>
        <button type="button" className="admin-muted-button" onClick={logout}>清除 Token</button>
      </form>
      <p className="admin-note">Token 只保存在当前浏览器 localStorage。不要把后台链接和 Token 发给别人。</p>
    </section>

    <section className="admin-toolbar">
      <div className="admin-filter-group">
        {VISIBILITY_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            className={visibility === value ? 'active' : ''}
            onClick={() => changeVisibilityFilter(value)}
            disabled={!token || loading}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="admin-counts">
        <span>当前列表 {counts.total}</span>
        <span>公开 {counts.public ?? 0}</span>
        <span>隐藏 {counts.hidden ?? 0}</span>
      </div>
      <button onClick={() => loadBuilds(visibility, token)} disabled={!token || loading}>{loading ? '读取中...' : '刷新'}</button>
    </section>

    {message && <p className="admin-message success">{message}</p>}
    {error && <p className="admin-message error">{error}</p>}

    <section className="admin-build-list">
      {builds.map((build) => (
        <AdminBuildCard
          key={build.id}
          build={build}
          token={token}
          onUpdated={applyLocalUpdate}
          onDeleted={removeLocal}
        />
      ))}
      {!loading && token && builds.length === 0 && <p className="admin-empty">没有 Build。</p>}
    </section>
  </main>;
}

function AdminBuildCard({ build, token, onUpdated, onDeleted }) {
  const [title, setTitle] = useState(build.title || '');
  const [authorName, setAuthorName] = useState(build.authorName || '');
  const [description, setDescription] = useState(build.description || '');
  const [busy, setBusy] = useState(false);
  const [localMessage, setLocalMessage] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setTitle(build.title || '');
    setAuthorName(build.authorName || '');
    setDescription(build.description || '');
  }, [build.id, build.title, build.authorName, build.description]);

  const save = async (extra = {}) => {
    setBusy(true);
    setLocalMessage('');
    setLocalError('');
    try {
      const updated = await updateAdminBuild(token, build.id, {
        title,
        authorName,
        description,
        ...extra,
      });
      onUpdated(updated);
      setLocalMessage('已保存。');
    } catch (err) {
      setLocalError(err.message || '保存失败。');
    } finally {
      setBusy(false);
    }
  };

  const hide = () => save({ visibility: 'hidden' });
  const publish = () => save({ visibility: 'public' });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl(build.id));
      setLocalMessage('分享链接已复制。');
    } catch {
      setLocalError('复制失败。');
    }
  };

  const remove = async () => {
    const confirmed = window.confirm(`确定永久删除「${build.title}」吗？这个操作不能撤销。`);
    if (!confirmed) return;
    setBusy(true);
    setLocalMessage('');
    setLocalError('');
    try {
      await deleteAdminBuild(token, build.id);
      onDeleted(build.id);
    } catch (err) {
      setLocalError(err.message || '删除失败。');
    } finally {
      setBusy(false);
    }
  };

  return <article className={`admin-build-card ${build.visibility === 'hidden' ? 'hidden-build' : ''}`}>
    <header>
      <div>
        <span className={`admin-status ${build.visibility}`}>{build.visibility === 'public' ? '公开' : '隐藏'}</span>
        <h2>{build.title || 'Untitled Build'}</h2>
        <p>{JOB_LABELS[build.job] ?? build.job} / {build.branch} / Lv.{build.level} · {safeDate(build.createdAt)}</p>
      </div>
      <div className="admin-card-actions">
        <button onClick={() => window.open(`/builds/${build.id}`, '_blank', 'noopener,noreferrer')}>查看</button>
        <button onClick={copyLink}>复制链接</button>
        {build.visibility === 'public'
          ? <button onClick={hide} disabled={busy}>隐藏</button>
          : <button onClick={publish} disabled={busy}>恢复公开</button>}
        <button className="danger" onClick={remove} disabled={busy}>删除</button>
      </div>
    </header>

    <div className="admin-edit-grid">
      <label>
        标题
        <input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        作者
        <input value={authorName} maxLength={40} onChange={(event) => setAuthorName(event.target.value)} />
      </label>
      <label className="wide">
        说明
        <textarea value={description} maxLength={1200} onChange={(event) => setDescription(event.target.value)} />
      </label>
    </div>

    <footer>
      <span>ID: {build.id}</span>
      <span>浏览 {build.views ?? 0}</span>
      <button onClick={() => save()} disabled={busy}>{busy ? '处理中...' : '保存修改'}</button>
    </footer>

    {localMessage && <p className="admin-inline-message success">{localMessage}</p>}
    {localError && <p className="admin-inline-message error">{localError}</p>}
  </article>;
}
