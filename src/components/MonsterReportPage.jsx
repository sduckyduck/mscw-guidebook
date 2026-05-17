import { useEffect, useMemo, useState } from 'react';
import MonsterIcon from './MonsterIcon.jsx';

const STORAGE_KEY = 'mscw-monster-drop-reports-v1';

function readReports() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeReports(reports) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    /* ignore */
  }
}

function formatDate(ts) {
  try {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function monsterKey(monster) {
  return String(monster?.id ?? monster?.name ?? '').toLowerCase();
}

export default function MonsterReportPage({ data }) {
  const monsters = useMemo(() => Array.isArray(data?.monsters) ? data.monsters : [], [data]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [reports, setReports] = useState(() => readReports());

  const visibleMonsters = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? monsters.filter((m) => String(m.name ?? '').toLowerCase().includes(q) || String(m.id ?? '').includes(q))
      : monsters;
    return filtered.slice().sort((a, b) => (Number(a.level ?? 0) - Number(b.level ?? 0)) || String(a.name).localeCompare(String(b.name))).slice(0, 120);
  }, [monsters, query]);

  const selectedMonster = useMemo(() => {
    if (selectedId == null) return visibleMonsters[0] ?? null;
    return monsters.find((m) => String(m.id) === String(selectedId)) ?? null;
  }, [monsters, selectedId, visibleMonsters]);

  const totalReports = useMemo(() => Object.values(reports).reduce((sum, list) => sum + list.length, 0), [reports]);

  function addReport(monster, payload) {
    if (!monster) return;
    const key = monsterKey(monster);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      monsterId: monster.id ?? null,
      monsterName: monster.name ?? '',
      itemName: payload.itemName,
      rate: payload.rate,
      notes: payload.notes,
      reporter: payload.reporter,
      createdAt: Date.now(),
    };
    setReports((prev) => {
      const next = { ...prev, [key]: [entry, ...(prev[key] ?? [])] };
      writeReports(next);
      return next;
    });
  }

  function removeReport(monster, reportId) {
    const key = monsterKey(monster);
    setReports((prev) => {
      const list = (prev[key] ?? []).filter((r) => r.id !== reportId);
      const next = { ...prev };
      if (list.length === 0) delete next[key];
      else next[key] = list;
      writeReports(next);
      return next;
    });
  }

  return (
    <section className="mg-dashboard mg-monsters-page">
      <h1 className="mg-dashboard-title">怪物图鉴 · 掉落物报告</h1>
      <p className="mg-dashboard-subtitle">
        浏览怪物数据并提交你观察到的掉落物。报告暂存在本地浏览器（{totalReports} 条已记录），后端接入后再统一同步。
      </p>

      <div className="mg-monsters-layout">
        <aside className="mg-monsters-list mg-glass-panel">
          <header className="mg-monsters-list-head">
            <h2 className="mg-panel-title">怪物列表</h2>
            <span>{visibleMonsters.length} / {monsters.length}</span>
          </header>
          <label className="mg-monsters-search">
            <input
              type="search"
              value={query}
              placeholder="搜索怪物名称..."
              onChange={(event) => setQuery(event.target.value)}
              aria-label="搜索怪物"
            />
          </label>
          {monsters.length === 0 && <p className="mg-monsters-empty">怪物数据尚未加载。</p>}
          <ul className="mg-monsters-rows" role="listbox">
            {visibleMonsters.map((monster) => {
              const reportCount = (reports[monsterKey(monster)] ?? []).length;
              const active = selectedMonster && String(selectedMonster.id) === String(monster.id);
              return (
                <li key={monster.id ?? monster.name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`mg-monster-row ${active ? 'is-active' : ''}`}
                    onClick={() => setSelectedId(monster.id)}
                  >
                    <MonsterIcon monster={monster} size={36} />
                    <div className="mg-monster-row-text">
                      <strong>{monster.name ?? '未知怪物'}</strong>
                      <span>Lv.{monster.level ?? '-'}{monster.hp ? ` · HP ${monster.hp.toLocaleString?.() ?? monster.hp}` : ''}</span>
                    </div>
                    {reportCount > 0 && <em className="mg-monster-row-badge">{reportCount}</em>}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="mg-monsters-detail">
          {selectedMonster ? (
            <MonsterDetail
              monster={selectedMonster}
              reports={reports[monsterKey(selectedMonster)] ?? []}
              onSubmit={(payload) => addReport(selectedMonster, payload)}
              onRemove={(id) => removeReport(selectedMonster, id)}
            />
          ) : (
            <div className="mg-glass-panel mg-monsters-empty-card">
              <h2 className="mg-panel-title">选择一个怪物查看详情</h2>
              <p>从左侧列表选择怪物，可以查看其等级、HP、已知掉落，并提交你自己的掉落报告。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MonsterDetail({ monster, reports, onSubmit, onRemove }) {
  const knownDrops = useMemo(() => {
    if (Array.isArray(monster?.drops)) {
      return monster.drops
        .map((d) => (typeof d === 'string' ? { name: d } : d))
        .filter((d) => d && (d.name || d.itemName));
    }
    return [];
  }, [monster]);

  return (
    <>
      <header className="mg-monsters-detail-head mg-glass-panel">
        <div className="mg-monsters-detail-icon">
          <MonsterIcon monster={monster} size={72} />
        </div>
        <div className="mg-monsters-detail-meta">
          <h2 className="mg-panel-title">{monster.name ?? '未知怪物'}</h2>
          <div className="mg-monsters-detail-chips">
            <span>Lv.{monster.level ?? '-'}</span>
            {monster.hp != null && <span>HP {monster.hp.toLocaleString?.() ?? monster.hp}</span>}
            {monster.exp != null && <span>EXP {monster.exp.toLocaleString?.() ?? monster.exp}</span>}
            {monster.mp != null && <span>MP {monster.mp}</span>}
            {Array.isArray(monster.maps) && monster.maps.length > 0 && <span>{monster.maps.length} 个地图出没</span>}
          </div>
        </div>
      </header>

      <section className="mg-glass-panel mg-monsters-drops">
        <header className="mg-monsters-section-head">
          <h3 className="mg-panel-title">已知掉落</h3>
          <span>{knownDrops.length} 条</span>
        </header>
        {knownDrops.length > 0 ? (
          <ul className="mg-monsters-drops-list">
            {knownDrops.map((drop, index) => (
              <li key={`${drop.id ?? drop.name ?? drop.itemName ?? index}`}>
                <strong>{drop.name ?? drop.itemName}</strong>
                {drop.rate != null && <span>{typeof drop.rate === 'number' ? `${(drop.rate * 100).toFixed(2)}%` : drop.rate}</span>}
                {drop.note && <em>{drop.note}</em>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mg-monsters-empty-line">官方数据中暂无掉落清单 — 你的报告会是第一手资料。</p>
        )}
      </section>

      <section className="mg-glass-panel mg-monsters-form">
        <header className="mg-monsters-section-head">
          <h3 className="mg-panel-title">提交掉落报告</h3>
          <span>你的观察会显示在下方列表</span>
        </header>
        <DropReportForm onSubmit={onSubmit} />
      </section>

      <section className="mg-glass-panel mg-monsters-reports">
        <header className="mg-monsters-section-head">
          <h3 className="mg-panel-title">玩家报告</h3>
          <span>{reports.length} 条</span>
        </header>
        {reports.length === 0 ? (
          <p className="mg-monsters-empty-line">还没有报告。上面的表单可以提交第一条。</p>
        ) : (
          <ul className="mg-monsters-report-list">
            {reports.map((r) => (
              <li key={r.id}>
                <div className="mg-monsters-report-main">
                  <strong>{r.itemName}</strong>
                  {r.rate && <span className="mg-monsters-report-rate">{r.rate}</span>}
                  {r.notes && <em>{r.notes}</em>}
                </div>
                <div className="mg-monsters-report-meta">
                  <span>{r.reporter || '匿名'} · {formatDate(r.createdAt)}</span>
                  <button type="button" onClick={() => onRemove(r.id)} aria-label="删除此条报告">删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function DropReportForm({ onSubmit }) {
  const [itemName, setItemName] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [reporter, setReporter] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = itemName.trim();
    if (!trimmed) {
      setError('请输入掉落物品名称');
      return;
    }
    onSubmit({ itemName: trimmed, rate: rate.trim(), notes: notes.trim(), reporter: reporter.trim() });
    setItemName('');
    setRate('');
    setNotes('');
    setError('');
  }

  return (
    <form className="mg-monsters-form-grid" onSubmit={handleSubmit}>
      <label>
        <span>物品名称 *</span>
        <input
          type="text"
          value={itemName}
          onChange={(event) => { setItemName(event.target.value); if (error) setError(''); }}
          placeholder="如：怪物精华 / Pulse"
          required
        />
      </label>
      <label>
        <span>观察到的掉落率（可选）</span>
        <input
          type="text"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          placeholder="如：约 5% 或 3/200"
        />
      </label>
      <label className="mg-monsters-form-wide">
        <span>备注（可选）</span>
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="情境、地图、是否组队等"
        />
      </label>
      <label>
        <span>你的昵称（可选）</span>
        <input
          type="text"
          value={reporter}
          onChange={(event) => setReporter(event.target.value)}
          placeholder="匿名"
        />
      </label>
      <div className="mg-monsters-form-actions">
        {error && <span className="mg-monsters-form-error">{error}</span>}
        <button type="submit" className="mg-monsters-form-submit">提交报告</button>
      </div>
    </form>
  );
}
