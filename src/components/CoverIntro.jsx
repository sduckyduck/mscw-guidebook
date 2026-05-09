import {
  BookOpen,
  ChevronRight,
  Flame,
  Home,
  Map as MapIcon,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Swords,
  Wrench,
} from 'lucide-react';

const INTRO_ASSET_BASE = `${import.meta.env.BASE_URL || '/'}intro_setup/`;
const introAsset = (name) => `${INTRO_ASSET_BASE}${name}`;

const FEATURE_CARDS = [
  { title: '加点模拟', desc: '精准计算属性', icon: Swords },
  { title: '练级路线', desc: '最佳升级路线', icon: MapIcon },
  { title: '配装推荐', desc: '毕业装备搭配', icon: Shield },
  { title: '技能分析', desc: '技能伤害计算', icon: BookOpen },
];

const BOTTOM_NAV = [
  { label: '首页', icon: Home, active: false },
  { label: '工具', icon: Wrench, active: false },
  { label: '攻略', icon: BookOpen, active: true },
  { label: '收藏', icon: Star, active: false },
  { label: '设置', icon: Settings, active: false },
];

export default function CoverIntro({ onEnter }) {
  return (
    <main className="cover-intro" aria-label="MapleStory Classic World 攻略宝典首页">
      <section className="intro-phone-frame">
        <div className="intro-scene" aria-hidden="true">
          <img className="intro-sky" src={introAsset('sky.png')} alt="" draggable="false" />
          <img className="intro-cloud intro-cloud-a" src={introAsset('cloud.png')} alt="" draggable="false" />
          <img className="intro-cloud intro-cloud-b" src={introAsset('cloud.png')} alt="" draggable="false" />
          <img className="intro-mountains" src={introAsset('mt.png')} alt="" draggable="false" />
          <img className="intro-islands" src={introAsset('island.png')} alt="" draggable="false" />
          <span className="intro-sun-glow" />
        </div>

        <img className="intro-logo" src={introAsset('logo.png')} alt="MapleStory Classic World 攻略宝典" draggable="false" />

        <div className="intro-characters" aria-hidden="true">
          <img className="intro-left-main" src={introAsset('left_main.png')} alt="" draggable="false" />
          <img className="intro-right-main" src={introAsset('right_main.png')} alt="" draggable="false" />
          <img className="intro-front-platform" src={introAsset('front_platform.png')} alt="" draggable="false" />
          <img className="intro-mid-mushroom" src={introAsset('mid_mushroom.png')} alt="" draggable="false" />
        </div>

        <section className="intro-panel" aria-label="攻略功能入口">
          <div className="intro-panel-head">
            <span className="intro-title-rule" />
            <h1>最专业的冒险岛攻略指南</h1>
            <span className="intro-title-rule" />
          </div>

          <div className="intro-trust-row">
            <span><Sparkles size={15} /> 数据准确</span>
            <span><Sparkles size={15} /> 路线推荐</span>
            <span><Sparkles size={15} /> 职业分析</span>
            <span><Sparkles size={15} /> 配装模拟</span>
          </div>

          <div className="intro-feature-grid">
            {FEATURE_CARDS.map(({ title, desc, icon: Icon }) => (
              <button className="intro-feature-card" type="button" key={title} onClick={onEnter}>
                <Icon aria-hidden="true" />
                <strong>{title}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>

          <button className="intro-search" type="button" onClick={onEnter}>
            <Search aria-hidden="true" />
            <span>搜索地图、怪物、装备、技能...</span>
          </button>

          <div className="intro-recommend-head">
            <strong><Flame size={22} /> 热门推荐</strong>
            <button type="button" onClick={onEnter}>查看全部 <ChevronRight size={18} /></button>
          </div>

          <button className="intro-hot-card" type="button" onClick={onEnter}>
            <span className="intro-hot-thumb">
              <img src={introAsset('mid_mushroom.png')} alt="" draggable="false" />
            </span>
            <span className="intro-hot-copy">
              <small>练级圣地</small>
              <strong>僵尸蘑菇王地图</strong>
              <span>Lv. 40-55　经验值极高</span>
            </span>
            <span className="intro-hot-region">玩具城 <ChevronRight size={16} /></span>
          </button>
        </section>

        <nav className="intro-bottom-nav" aria-label="入口导航">
          {BOTTOM_NAV.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={active ? 'intro-nav-item active' : 'intro-nav-item'}
              type="button"
              onClick={onEnter}
            >
              <span className="intro-nav-icon"><Icon aria-hidden="true" /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
