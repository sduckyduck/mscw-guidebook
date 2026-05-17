const STORAGE_KEY = 'mscw-guidebook-state-v2';
const TOGGLE_ID = 'china-hp-toggle-field';
const STYLE_ID = 'china-hp-toggle-style';

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

function ensureDefault() {
  const state = readState();
  if (state.hpWashingEnabled === undefined) {
    writeState({ ...state, hpWashingEnabled: false, hpRouteEnabled: false });
  }
}

function preserveToggleWhenAppSaves() {
  if (window.__mscwChinaHpToggleStoragePatched) return;
  window.__mscwChinaHpToggleStoragePatched = true;
  const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
  window.localStorage.setItem = (key, value) => {
    if (key === STORAGE_KEY) {
      try {
        const oldState = readState();
        const nextState = JSON.parse(value || '{}');
        if (oldState.hpWashingEnabled !== undefined && nextState.hpWashingEnabled === undefined) {
          nextState.hpWashingEnabled = oldState.hpWashingEnabled;
          nextState.hpRouteEnabled = oldState.hpWashingEnabled;
          value = JSON.stringify(nextState);
        }
      } catch {
        // keep original value
      }
    }
    return originalSetItem(key, value);
  };
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

function renderToggle() {
  const existing = document.getElementById(TOGGLE_ID);
  if (!isChinaEdition()) {
    existing?.remove();
    return;
  }

  const grid = document.querySelector('.mg-field-grid');
  if (!grid) return;
  ensureStyle();
  const state = readState();
  const enabled = state.hpWashingEnabled === true;
  const label = enabled ? '洗血：开启' : '洗血：关闭';
  const hint = enabled ? '当前路线会影响 INT、HP/MP、装备和怪物推荐。' : '当前使用普通 AP/HP/MP 逻辑，不套用洗血路线。';

  if (!existing) {
    const field = document.createElement('div');
    field.id = TOGGLE_ID;
    field.className = 'mg-field china-hp-toggle-field';
    field.innerHTML = `<label>洗血</label><button type="button" class="china-hp-toggle-btn"></button><small></small>`;
    grid.appendChild(field);
  }

  const field = document.getElementById(TOGGLE_ID);
  const button = field.querySelector('button');
  const small = field.querySelector('small');
  button.textContent = label;
  button.classList.toggle('is-on', enabled);
  small.textContent = hint;
}

function toggleHpMode() {
  const state = readState();
  const nextEnabled = state.hpWashingEnabled !== true;
  writeState({ ...state, hpWashingEnabled: nextEnabled, hpRouteEnabled: nextEnabled, apAllocation: null });
  window.location.reload();
}

function installChinaHpToggle() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  preserveToggleWhenAppSaves();
  ensureDefault();

  const schedule = () => window.setTimeout(renderToggle, 0);
  schedule();

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.(`#${TOGGLE_ID} button`)) toggleHpMode();
  }, true);
  document.addEventListener('change', schedule, true);
  const root = document.querySelector('#root');
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
}

installChinaHpToggle();
