import { useEffect, useMemo, useRef, useState } from 'react';
import MonsterIcon from './MonsterIcon.jsx';
import { baseUrl } from './IconFallback.jsx';

const STORAGE_KEY = 'mscw-monster-drop-reports-v1';
const REPORTER_KEY = 'mscw-monster-drop-reporter';

const ITEM_CATEGORY_LABELS = {
  Equipment: '装备',
  Consumable: '消耗品',
  Etc: '材料',
  Setup: '其他',
};

const ITEM_CATEGORY_ORDER = ['Etc', 'Consumable', 'Equipment', 'Setup'];

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

function readReporter() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(REPORTER_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeReporter(name) {
  if (typeof window === 'undefined') return;
  try {
    if (name) window.localStorage.setItem(REPORTER_KEY, name);
    else window.localStorage.removeItem(REPORTER_KEY);
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

function aggregationKey(report) {
  if (report.itemId != null) return `id:${report.itemId}`;
  return `name:${String(report.itemName ?? '').toLowerCase().trim()}`;
}

function parseRate(rate) {
  if (rate == null) return null;
  const str = String(rate).trim();
  if (!str) return null;
  // Try "X/Y" form
  const frac = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const n = Number(frac[1]);
    const d = Number(frac[2]);
    if (d > 0) return n / d;
  }
  // Try percentage
  const pct = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return Number(pct[1]) / 100;
  // Plain number
  const num = Number(str);
  if (Number.isFinite(num)) {
    return num > 1 ? num / 100 : num;
  }
  return null;
}

function formatRatio(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  if (ratio >= 0.1) return `${(ratio * 100).toFixed(1)}%`;
  return `${(ratio * 100).toFixed(2)}%`;
}

function aggregateReports(reports) {
  const groups = new Map();
  for (const r of reports) {
    const key = aggregationKey(r);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        itemId: r.itemId ?? null,
        itemName: r.itemName ?? '',
        itemThumbnail: r.itemThumbnail ?? null,
        itemCategory: r.itemCategory ?? null,
        count: 0,
        rateSum: 0,
        rateCount: 0,
        reports: [],
      });
    }
    const g = groups.get(key);
    g.count += 1;
    g.reports.push(r);
    if (!g.itemThumbnail && r.itemThumbnail) g.itemThumbnail = r.itemThumbnail;
    if (!g.itemCategory && r.itemCategory) g.itemCategory = r.itemCategory;
    const ratio = parseRate(r.rate);
    if (ratio != null) {
      g.rateSum += ratio;
      g.rateCount += 1;
    }
  }
  return Array.from(groups.values())
    .map((g) => ({ ...g, avgRate: g.rateCount ? g.rateSum / g.rateCount : null }))
    .sort((a, b) => b.count - a.count);
}

function thumbnailUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${baseUrl()}AppData/${path.replace(/^\/+/, '')}`;
}

export default function MonsterReportPage({ data }) {
  const monsters = useMemo(() => Array.isArray(data?.monsters) ? data.monsters : [], [data]);
  const items = useMemo(() => Array.isArray(data?.items) ? data.items : [], [data]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [reports, setReports] = useState(() => readReports());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedItem, setPickedItem] = useState(null);

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
      itemId: payload.itemId ?? null,
      itemName: payload.itemName,
      itemThumbnail: payload.itemThumbnail ?? null,
      itemCategory: payload.itemCategory ?? null,
      rate: payload.rate ?? '',
      notes: payload.notes ?? '',
      reporter: payload.reporter ?? '',
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
              items={items}
              reports={reports[monsterKey(selectedMonster)] ?? []}
              onSubmit={(payload) => addReport(selectedMonster, payload)}
              onRemove={(id) => removeReport(selectedMonster, id)}
              onOpenPicker={() => setPickerOpen(true)}
            />
          ) : (
            <div className="mg-glass-panel mg-monsters-empty-card">
              <h2 className="mg-panel-title">选择一个怪物查看详情</h2>
              <p>从左侧列表选择怪物，可以查看其等级、HP、已知掉落，并提交你自己的掉落报告。</p>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <ItemPicker
          items={items}
          onPick={(item) => {
            setPickerOpen(false);
            setPickedItem(item);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {pickedItem && selectedMonster && (
        <QuickConfirmDialog
          monster={selectedMonster}
          item={pickedItem}
          onSubmit={(payload) => {
            addReport(selectedMonster, payload);
            setPickedItem(null);
          }}
          onCancel={() => setPickedItem(null)}
        />
      )}
    </section>
  );
}

function MonsterDetail({ monster, items, reports, onSubmit, onRemove, onOpenPicker }) {
  const [expandedGroup, setExpandedGroup] = useState(null);
  const knownDrops = useMemo(() => {
    if (Array.isArray(monster?.drops)) {
      return monster.drops
        .map((d) => (typeof d === 'string' ? { name: d } : d))
        .filter((d) => d && (d.name || d.itemName));
    }
    return [];
  }, [monster]);

  const aggregated = useMemo(() => aggregateReports(reports), [reports]);

  function quickConfirm(group) {
    onSubmit({
      itemId: group.itemId,
      itemName: group.itemName,
      itemThumbnail: group.itemThumbnail,
      itemCategory: group.itemCategory,
      rate: '',
      notes: '',
      reporter: readReporter() || '',
    });
  }

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
        <button type="button" className="mg-monsters-quick-add" onClick={onOpenPicker}>
          + 添加掉落
        </button>
      </header>

      {knownDrops.length > 0 && (
        <section className="mg-glass-panel mg-monsters-drops">
          <header className="mg-monsters-section-head">
            <h3 className="mg-panel-title">官方已知掉落</h3>
            <span>{knownDrops.length} 条</span>
          </header>
          <ul className="mg-monsters-drops-list">
            {knownDrops.map((drop, index) => (
              <li key={`${drop.id ?? drop.name ?? drop.itemName ?? index}`}>
                <strong>{drop.name ?? drop.itemName}</strong>
                {drop.rate != null && <span>{typeof drop.rate === 'number' ? `${(drop.rate * 100).toFixed(2)}%` : drop.rate}</span>}
                {drop.note && <em>{drop.note}</em>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mg-glass-panel mg-monsters-aggregate">
        <header className="mg-monsters-section-head">
          <h3 className="mg-panel-title">玩家观测掉落（{aggregated.length}）</h3>
          <span>总报告 {reports.length} 条 — 点击 “+1 我也见过” 快速确认</span>
        </header>
        {aggregated.length === 0 ? (
          <div className="mg-monsters-aggregate-empty">
            <p>还没有玩家报告。点击右上角 <strong>+ 添加掉落</strong> 报告你观察到的物品。</p>
          </div>
        ) : (
          <ul className="mg-monsters-aggregate-list">
            {aggregated.map((group) => {
              const expanded = expandedGroup === group.key;
              const avgText = formatRatio(group.avgRate);
              return (
                <li key={group.key} className={`mg-monsters-aggregate-row ${expanded ? 'is-expanded' : ''}`}>
                  <div className="mg-monsters-aggregate-main">
                    <div className="mg-monsters-aggregate-icon">
                      {group.itemThumbnail ? (
                        <img src={thumbnailUrl(group.itemThumbnail)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <span aria-hidden>?</span>
                      )}
                    </div>
                    <div className="mg-monsters-aggregate-info">
                      <strong>{group.itemName}</strong>
                      <span>
                        {group.count} 玩家观测{group.itemCategory ? ` · ${ITEM_CATEGORY_LABELS[group.itemCategory] ?? group.itemCategory}` : ''}
                        {avgText ? ` · 平均掉率 ~${avgText}` : ''}
                      </span>
                    </div>
                    <div className="mg-monsters-aggregate-actions">
                      <button type="button" className="mg-monsters-aggregate-plus" onClick={() => quickConfirm(group)}>
                        +1 我也见过
                      </button>
                      <button
                        type="button"
                        className="mg-monsters-aggregate-toggle"
                        aria-expanded={expanded}
                        onClick={() => setExpandedGroup(expanded ? null : group.key)}
                      >
                        {expanded ? '收起' : `${group.count} 条`}
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <ul className="mg-monsters-report-list">
                      {group.reports.map((r) => (
                        <li key={r.id}>
                          <div className="mg-monsters-report-main">
                            {r.rate && <span className="mg-monsters-report-rate">{r.rate}</span>}
                            {r.notes && <em>{r.notes}</em>}
                            {!r.rate && !r.notes && <em>—</em>}
                          </div>
                          <div className="mg-monsters-report-meta">
                            <span>{r.reporter || '匿名'} · {formatDate(r.createdAt)}</span>
                            <button type="button" onClick={() => onRemove(r.id)} aria-label="删除此条报告">删除</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function QuickConfirmDialog({ monster, item, onSubmit, onCancel }) {
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [reporter, setReporter] = useState(() => readReporter());
  const rateInputRef = useRef(null);

  useEffect(() => {
    rateInputRef.current?.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (reporter) writeReporter(reporter);
    onSubmit({
      itemId: item.id,
      itemName: item.name,
      itemThumbnail: item.thumbnail,
      itemCategory: item.category,
      rate: rate.trim(),
      notes: notes.trim(),
      reporter: reporter.trim(),
    });
  }

  return (
    <div className="mg-monsters-modal-backdrop" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <form className="mg-monsters-modal mg-monsters-confirm" onSubmit={handleSubmit}>
        <header className="mg-monsters-modal-head">
          <h3>提交掉落报告</h3>
          <button type="button" onClick={onCancel} aria-label="取消">×</button>
        </header>
        <div className="mg-monsters-confirm-summary">
          <span className="mg-monsters-confirm-from">{monster.name}</span>
          <span className="mg-monsters-confirm-arrow">→</span>
          <span className="mg-monsters-confirm-item">
            {item.thumbnail && <img src={thumbnailUrl(item.thumbnail)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
            <strong>{item.name}</strong>
            <em>{ITEM_CATEGORY_LABELS[item.category] ?? item.category}</em>
          </span>
        </div>
        <div className="mg-monsters-confirm-fields">
          <label>
            <span>观察到的掉率（可选）</span>
            <input ref={rateInputRef} type="text" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="如 约 5% 或 3/200" />
          </label>
          <label>
            <span>备注（可选）</span>
            <input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="地图、组队、Boss 房等" />
          </label>
          <label>
            <span>昵称（会记住下次）</span>
            <input type="text" value={reporter} onChange={(event) => setReporter(event.target.value)} placeholder="匿名" />
          </label>
        </div>
        <footer className="mg-monsters-confirm-actions">
          <button type="button" className="mg-monsters-secondary" onClick={() => onSubmit({
            itemId: item.id,
            itemName: item.name,
            itemThumbnail: item.thumbnail,
            itemCategory: item.category,
            rate: '',
            notes: '',
            reporter,
          })}>
            只提交，不填掉率
          </button>
          <button type="submit" className="mg-monsters-primary">提交报告</button>
        </footer>
      </form>
    </div>
  );
}

function ItemPicker({ items, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Etc');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items.filter((it) => {
      if (category === 'all') return true;
      return (it.category ?? 'Etc') === category;
    });
    const matched = q
      ? base.filter((it) => String(it.name ?? '').toLowerCase().includes(q) || String(it.id ?? '').includes(q))
      : base;
    return matched.slice(0, 200);
  }, [items, query, category]);

  const counts = useMemo(() => {
    const c = { all: items.length };
    ITEM_CATEGORY_ORDER.forEach((k) => { c[k] = 0; });
    items.forEach((it) => { const k = it.category ?? 'Etc'; c[k] = (c[k] ?? 0) + 1; });
    return c;
  }, [items]);

  return (
    <div className="mg-monsters-modal-backdrop" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mg-monsters-modal mg-monsters-picker">
        <header className="mg-monsters-modal-head">
          <h3>选择掉落物品</h3>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="mg-monsters-picker-tabs" role="tablist">
          {[['all', '全部']].concat(ITEM_CATEGORY_ORDER.map((k) => [k, ITEM_CATEGORY_LABELS[k]])).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={category === id}
              className={category === id ? 'is-active' : ''}
              onClick={() => setCategory(id)}
            >
              {label}
              <em>{counts[id] ?? 0}</em>
            </button>
          ))}
        </div>
        <label className="mg-monsters-picker-search">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按名称或 ID 搜索物品..."
            aria-label="搜索物品"
          />
        </label>
        <p className="mg-monsters-picker-hint">{filtered.length} 项匹配{filtered.length >= 200 ? '（仅显示前 200，请用搜索缩小范围）' : ''}</p>
        <ul className="mg-monsters-picker-list">
          {filtered.map((item) => (
            <li key={item.id}>
              <button type="button" className="mg-monsters-picker-row" onClick={() => onPick(item)}>
                <div className="mg-monsters-picker-icon">
                  {item.thumbnail ? (
                    <img src={thumbnailUrl(item.thumbnail)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : <span aria-hidden>?</span>}
                </div>
                <div className="mg-monsters-picker-text">
                  <strong>{item.name}</strong>
                  <span>{ITEM_CATEGORY_LABELS[item.category] ?? item.category} · {item.sub_category ?? '-'}{item.reqLevel ? ` · Lv.${item.reqLevel}` : ''}</span>
                </div>
                <em className="mg-monsters-picker-id">#{item.id}</em>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="mg-monsters-picker-empty">没有匹配的物品。</li>}
        </ul>
      </div>
    </div>
  );
}
