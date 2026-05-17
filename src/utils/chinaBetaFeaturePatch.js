const STORAGE_KEY = 'mscw-guidebook-state-v2';
const PATCH_NODE_ID = 'china-beta-materials-replacement';
const STYLE_NODE_ID = 'china-beta-feature-styles';

function readSavedEdition() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return saved?.editionId;
  } catch {
    return '';
  }
}

function getEditionSelect() {
  return [...document.querySelectorAll('.mg-field')]
    .find((field) => field.textContent?.includes('版本'))
    ?.querySelector('select');
}

function isChinaEdition() {
  const select = getEditionSelect();
  return select?.value === 'china' || readSavedEdition() === 'china';
}

function setTabLabel(button, chinaActive) {
  const nextLabel = chinaActive ? '拍卖行' : '材料';
  const previousLabel = chinaActive ? '材料' : '拍卖行';
  const labelSpan = [...button.querySelectorAll('span')]
    .find((span) => span.textContent.trim() === previousLabel || span.textContent.trim() === nextLabel);

  if (labelSpan) {
    labelSpan.textContent = nextLabel;
    return;
  }

  if (button.textContent.trim() === previousLabel || button.textContent.trim() === nextLabel) {
    button.textContent = nextLabel;
  }
}

function syncNavigationLabels() {
  const chinaActive = isChinaEdition();
  document.querySelectorAll('.mg-app-header-tab, .mg-mobile-tabs .top-tab').forEach((button) => {
    setTabLabel(button, chinaActive);
  });

  document.querySelectorAll('.mg-app-search input').forEach((input) => {
    input.placeholder = chinaActive ? '搜索地图 / 怪物 / 拍卖行...' : '搜索地图 / 怪物 / 材料...';
  });
}

function ensureStyles() {
  if (document.getElementById(STYLE_NODE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_NODE_ID;
  style.textContent = `
    .china-beta-page {
      display: grid;
      gap: 18px;
      width: min(1180px, calc(100vw - 32px));
      margin: 18px auto 48px;
    }
    .china-beta-hero,
    .china-beta-card,
    .china-beta-route-card {
      border: 1px solid rgba(255, 255, 255, 0.32);
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 250, 230, 0.78));
      box-shadow: 0 16px 38px rgba(94, 68, 28, 0.14);
      border-radius: 24px;
      padding: 22px;
      color: #4b3214;
    }
    .china-beta-hero {
      display: grid;
      grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
      gap: 18px;
      align-items: stretch;
      background:
        radial-gradient(circle at top left, rgba(255, 207, 92, 0.38), transparent 34%),
        linear-gradient(135deg, rgba(255, 248, 220, 0.95), rgba(253, 226, 150, 0.86));
    }
    .china-beta-kicker {
      display: inline-flex;
      width: fit-content;
      border-radius: 999px;
      padding: 6px 12px;
      background: rgba(125, 78, 16, 0.11);
      color: #895719;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .china-beta-hero h1,
    .china-beta-card h2,
    .china-beta-route-card h3 { margin: 8px 0 8px; }
    .china-beta-hero h1 { font-size: clamp(28px, 4vw, 48px); line-height: 1.05; }
    .china-beta-hero p,
    .china-beta-card p,
    .china-beta-route-card p { margin: 0; line-height: 1.7; color: rgba(75, 50, 20, 0.78); }
    .china-beta-hero-panel {
      display: grid;
      gap: 12px;
      align-content: center;
      border-radius: 20px;
      padding: 18px;
      background: rgba(255, 255, 255, 0.54);
      border: 1px solid rgba(131, 91, 36, 0.15);
    }
    .china-beta-stat {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border-radius: 14px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.62);
      font-weight: 800;
    }
    .china-beta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .china-beta-card { display: grid; gap: 14px; }
    .china-beta-card.is-wide { grid-column: span 2; }
    .china-beta-route-card { display: grid; gap: 10px; }
    .china-beta-route-card strong { font-size: 22px; color: #8b5214; }
    .china-beta-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .china-beta-tags span {
      border-radius: 999px;
      padding: 7px 10px;
      background: rgba(255, 196, 70, 0.22);
      color: #704512;
      font-size: 12px;
      font-weight: 800;
    }
    .china-beta-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
    .china-beta-list li {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 10px;
      align-items: start;
      padding: 10px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.55);
    }
    .china-beta-list b {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      background: #f7b53b;
      color: #5c3305;
      font-size: 12px;
    }
    .china-beta-note {
      border-left: 4px solid #f0a521;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(255, 246, 220, 0.78);
      font-weight: 700;
    }
    @media (max-width: 860px) {
      .china-beta-hero,
      .china-beta-grid { grid-template-columns: 1fr; }
      .china-beta-card.is-wide { grid-column: auto; }
    }
  `;
  document.head.appendChild(style);
}

function createChinaBetaPage() {
  const node = document.createElement('section');
  node.id = PATCH_NODE_ID;
  node.className = 'china-beta-page';
  node.dataset.chinaBetaMaterialPage = 'true';
  node.innerHTML = `
    <header class="china-beta-hero">
      <div>
        <span class="china-beta-kicker">国服内测专属</span>
        <h1>拍卖行与洗血路线</h1>
        <p>国服内测没有锻造系统，所以这里不再展示材料与专业升级。这个页面先替换成国服专属的拍卖行入口，并预留血量成长 / 洗血路线规划。</p>
      </div>
      <aside class="china-beta-hero-panel" aria-label="国服内测机制摘要">
        <div class="china-beta-stat"><span>数据源</span><strong>cms/*.json</strong></div>
        <div class="china-beta-stat"><span>材料页</span><strong>替换为拍卖行</strong></div>
        <div class="china-beta-stat"><span>新模块</span><strong>洗血路线</strong></div>
      </aside>
    </header>

    <section class="china-beta-grid">
      <article class="china-beta-card is-wide">
        <span class="china-beta-kicker">Auction House</span>
        <h2>拍卖行模块</h2>
        <p>这里用于放国服内测的新交易逻辑：装备、卷轴、材料和稀有掉落统一进入拍卖行。后续你提供规则后，可以继续接入抵用券价格、手续费、上架限制、价格区间和推荐买入/卖出逻辑。</p>
        <div class="china-beta-tags">
          <span>抵用券流通</span><span>金币账号绑定</span><span>价格观察</span><span>装备/卷轴筛选</span>
        </div>
        <ul class="china-beta-list">
          <li><b>1</b><span><strong>市场货币切换</strong><br />拍卖行不再以传统金币作为玩家交易核心，后续可按抵用券价格建立估值表。</span></li>
          <li><b>2</b><span><strong>物品分类</strong><br />先按装备、卷轴、消耗、怪物掉落、任务材料分组，方便做查询与推荐。</span></li>
          <li><b>3</b><span><strong>后续数据接口</strong><br />如果你补充拍卖行字段，可以把 cms/items.json、cms/monsters.json 的掉落与物品信息连到交易页面。</span></li>
        </ul>
      </article>

      <article class="china-beta-card">
        <span class="china-beta-kicker">Why replace</span>
        <h2>为什么不展示材料页</h2>
        <p>国际服材料页服务于锻造/专业系统；国服内测没有锻造系统时，这套路线会误导玩家。因此国服版本直接把材料 tab 改成拍卖行。</p>
      </article>
    </section>

    <section class="china-beta-card">
      <span class="china-beta-kicker">Blood Washing</span>
      <h2>洗血路线</h2>
      <p class="china-beta-note">下面是先放进去的页面结构：穷鬼路线、平衡路线、有钱路线。具体每个职业需要多少 AP 重置、目标 HP、等级节点和计算公式，后续可以用你的国服规则表继续填充。</p>
      <div class="china-beta-grid">
        <article class="china-beta-route-card">
          <strong>穷鬼路线</strong>
          <h3>少洗 / 不洗，优先能练级</h3>
          <p>适合零氪或低预算玩家。核心是先保证伤害、命中和升级效率，不强行堆高 INT；靠自然血量、装备、活动补血量。</p>
          <div class="china-beta-tags"><span>低成本</span><span>少 AP 重置</span><span>练级优先</span></div>
        </article>
        <article class="china-beta-route-card">
          <strong>平衡路线</strong>
          <h3>少量 INT + 分阶段重置</h3>
          <p>适合想兼顾体验和后期生存的玩家。早期用少量基础 INT 或 INT 装，等关键等级节点再逐步洗回主属性。</p>
          <div class="china-beta-tags"><span>成本可控</span><span>中期成型</span><span>推荐主线</span></div>
        </article>
        <article class="china-beta-route-card">
          <strong>有钱路线</strong>
          <h3>高 INT / INT 装 / 大量 AP 重置</h3>
          <p>适合追求后期 Boss 门槛和极限血量的玩家。用更高 MP 成长换未来血量空间，核心成本来自 AP 重置券。</p>
          <div class="china-beta-tags"><span>高预算</span><span>Boss 向</span><span>后期收益</span></div>
        </article>
      </div>
    </section>
  `;
  return node;
}

function mountChinaBetaPage() {
  const craftPage = document.querySelector('.craft-safe-page');
  const existing = document.getElementById(PATCH_NODE_ID);
  const shouldReplace = Boolean(craftPage && isChinaEdition());

  if (!shouldReplace) {
    if (craftPage) craftPage.hidden = false;
    existing?.remove();
    return;
  }

  ensureStyles();
  craftPage.hidden = true;
  if (!existing) craftPage.insertAdjacentElement('afterend', createChinaBetaPage());
}

function applyChinaBetaPatch() {
  syncNavigationLabels();
  mountChinaBetaPage();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const observer = new MutationObserver(() => applyChinaBetaPatch());
  const start = () => {
    applyChinaBetaPatch();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('hashchange', () => window.setTimeout(applyChinaBetaPatch, 0));
  document.addEventListener('click', () => window.setTimeout(applyChinaBetaPatch, 0), true);
  document.addEventListener('change', () => window.setTimeout(applyChinaBetaPatch, 0), true);
}
