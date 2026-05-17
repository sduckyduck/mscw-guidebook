const BOOK_COVER_SRC = `${import.meta.env.BASE_URL || '/'}icons/book/m_cover2.png`;
const BUILDS_HREF = ((import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')) + '/builds';

export default function CoverIntro({ onEnter }) {
  function enterTab(tabId) {
    if (tabId) window.location.hash = tabId;
    onEnter();
  }

  return (
    <main className="cover-intro" aria-label="MapleGuide 攻略书">
      <div className="cover-hero">
        <div className="cover-hero-text">
          <h1 className="cover-hero-title">冒险岛怀旧服<br />开荒攻略书</h1>
          <p className="cover-hero-subtitle">输入职业、等级和预算，自动推荐练级地图、怪物、AP、技能、装备和材料路线。</p>
          <div className="cover-hero-ctas">
            <button type="button" className="cover-cta is-primary" onClick={() => enterTab(null)}>
              开始生成路线
            </button>
            <button type="button" className="cover-cta is-secondary" onClick={() => enterTab('maps')}>
              查看地图推荐
            </button>
            <button type="button" className="cover-cta is-secondary" onClick={() => { window.location.href = BUILDS_HREF; }}>
              浏览玩家Build
            </button>
          </div>
        </div>
        <button
          className="cover-book-button"
          type="button"
          onClick={() => enterTab(null)}
          aria-label="进入攻略书"
        >
          <img
            className="cover-book-image"
            src={BOOK_COVER_SRC}
            alt=""
            draggable="false"
          />
        </button>
      </div>
    </main>
  );
}
