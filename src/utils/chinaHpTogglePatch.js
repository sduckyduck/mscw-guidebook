const STORAGE_KEY = 'mscw-guidebook-state-v2';
const TOGGLE_STORAGE_KEY = 'mscw-guidebook-china-hp-washing-enabled';
const TOGGLE_ID = 'china-hp-toggle-field';
const STYLE_ID = 'china-hp-toggle-style';
let renderScheduled = false;

function readState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(next) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function readEnabled() {
  return window.localStorage.getItem(TOGGLE_STORAGE_KEY) === 'true';
}

function writeEnabled(enabled) {
  window.localStorage.setItem(TOGGLE_STORAGE_KEY, enabled ? 'true' : 'false');
}

function getEditionSelect() {
  return [...document.querySelectorAll('.mg-field')]
    .find((field) => field.querySelector('label')?.textContent?.trim() === '版本')
    ?.querySelector('select');
}

function isChinaEdition() {
  const select = getEditionSelect();
  if (select?.value) return select.value === 'china';
  return readState().editionId === 'china';
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .china-hp-toggle-field { display: grid; gap: 8px; }
    .china-hp-toggle-btn {
      width: 100%;
      min-height: 42px;
      border-radius: 14px;
      border: 1px solid rgba(121, 205, 255, 0.42);
      background: rgba(7, 39, 66, 0.82);
      color: #e9f8ff;
      font-weight: 900;
      cursor: pointer;
    }
    .china-hp-toggle-btn.is-on {
      background: linear-gradient(135deg, rgba(39, 169, 118, 0.9), rgba(13, 106, 144, 0.88));
      border-color: rgba(160, 255, 211, 0.55);
    }
    .china-hp-toggle-field small { color: rgba(219, 244, 255, 0.72); line-height: 1.35; }
  `;
  document.head.appendChild(style);
}

function renderToggleNow() {
  renderScheduled = false;
  const existing = document.getElementById(TOGGLE_ID);
  if (!isChinaEdition()) {
    existing?.remove();
    return;
  }

  const grid = document.querySelector('.mg-field-grid');
  if (!grid) return;
  ensureStyle();
  const enabled = readEnabled();
  const label = enabled ? '洗血：开启' : '洗血：关闭';
  const hint = enabled ? '当前路线会影响 INT、HP/MP、装备和怪物推荐。' : '当前使用普通 AP/HP/MP 逻辑，不套用洗血路线。';

  let field = document.getElementById(TOGGLE_ID);
  if (!field) {
    field = document.createElement('div');
    field.id = TOGGLE_ID;
    field.className = 'mg-field china-hp-toggle-field';
    field.innerHTML = `<label>洗血</label><button type="button" class="china-hp-toggle-btn"></button><small></small>`;
    grid.appendChild(field);
  }

  const button = field.querySelector('button');
  const small = field.querySelector('small');
  if (button.textContent !== label) button.textContent = label;
  button.classList.toggle('is-on', enabled);
  if (small.textContent !== hint) small.textContent = hint;
}

function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  window.setTimeout(renderToggleNow, 60);
}

function toggleHpMode() {
  const nextEnabled = !readEnabled();
  writeEnabled(nextEnabled);
  const state = readState();
  writeState({ ...state, hpWashingEnabled: nextEnabled, hpRouteEnabled: nextEnabled, apAllocation: null });
  window.location.reload();
}

function installChinaHpToggle() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwChinaHpToggleInstalled) return;
  window.__mscwChinaHpToggleInstalled = true;

  if (window.localStorage.getItem(TOGGLE_STORAGE_KEY) === null) writeEnabled(false);
  scheduleRender();
  window.setTimeout(scheduleRender, 400);
  window.setTimeout(scheduleRender, 1200);

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.(`#${TOGGLE_ID} button`)) toggleHpMode();
  }, true);
  document.addEventListener('change', (event) => {
    const label = event.target?.closest?.('.mg-field')?.querySelector('label')?.textContent?.trim();
    if (label === '版本') scheduleRender();
  }, true);
  window.addEventListener('hashchange', scheduleRender);
}

installChinaHpToggle();
