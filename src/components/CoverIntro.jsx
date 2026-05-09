const INTRO_ASSET_BASE = `${import.meta.env.BASE_URL || '/'}intro_setup/`;
const introAsset = (name) => `${INTRO_ASSET_BASE}${name}`;

export default function CoverIntro({ onEnter }) {
  return (
    <main className="cover-intro cover-intro-minimal" aria-label="MapleStory Classic World intro">
      <button className="intro-visual-button" type="button" onClick={onEnter} aria-label="Enter guidebook">
        <div className="intro-full-scene">
          <img className="intro-sky-bg" src={introAsset('sky.png')} alt="" draggable="false" />

          <div className="intro-depth intro-depth-back" aria-hidden="true">
            <img className="intro-cloud intro-cloud-left" src={introAsset('cloud.png')} alt="" draggable="false" />
            <img className="intro-cloud intro-cloud-right" src={introAsset('cloud.png')} alt="" draggable="false" />
            <img className="intro-mountains-bottom" src={introAsset('mt.png')} alt="" draggable="false" />
            <img className="intro-island intro-island-left" src={introAsset('island.png')} alt="" draggable="false" />
            <img className="intro-island intro-island-right" src={introAsset('island.png')} alt="" draggable="false" />
            <span className="intro-sun-glare" />
            <span className="intro-lens-haze" />
          </div>

          <img className="intro-logo-center" src={introAsset('logo.png')} alt="MapleStory Classic World 攻略宝典" draggable="false" />

          <div className="intro-depth intro-depth-front" aria-hidden="true">
            <img className="intro-platform-main" src={introAsset('front_platform.png')} alt="" draggable="false" />
            <img className="intro-left-main-float" src={introAsset('left_main.png')} alt="" draggable="false" />
            <img className="intro-right-main-float" src={introAsset('right_main.png')} alt="" draggable="false" />
            <img className="intro-mushroom-float" src={introAsset('mid_mushroom.png')} alt="" draggable="false" />
            <img className="intro-slime-float" src={introAsset('slime.png')} alt="" draggable="false" />
          </div>
        </div>
      </button>
    </main>
  );
}
