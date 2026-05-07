import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AppMediaEnhanced from './AppMediaEnhanced.jsx';
import CoverIntro from './components/CoverIntro.jsx';
import CraftingMaterialsPageSafe from './components/CraftingMaterialsPageSafe.jsx';
import CommunityBuildsPage from './components/CommunityBuildsPage.jsx';
import './styles.css';
import './styles/cover-intro.css';
import './styles/materials-page.css';
import './styles/layout-unify.css';

const TABS = [['overview', '总览'], ['character', '角色'], ['maps', '地图'], ['materials', '材料']];

function replaceHash(tab) {
  const nextUrl = tab === 'overview'
    ? `${window.location.pathname}${window.location.search}`
    : `${window.location.pathname}${window.location.search}#${tab}`;
  window.history.replaceState(null, '', nextUrl);
}

function goToBuilds() {
  window.location.assign('/builds');
}

function isBuildRoute() {
  return window.location.pathname === '/builds' || window.location.pathname.startsWith('/builds/');
}

function GuidebookRouter() {
  const [materialsOpen, setMaterialsOpen] = useState(() => window.location.hash === '#materials');
  const [buildRouteOpen, setBuildRouteOpen] = useState(() => isBuildRoute());

  useEffect(() => {
    const sync = () => {
      setMaterialsOpen(window.location.hash === '#materials');
      setBuildRouteOpen(isBuildRoute());
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const openTab = (tab) => {
    replaceHash(tab);
    setMaterialsOpen(tab === 'materials');
    setBuildRouteOpen(false);
  };

  if (buildRouteOpen) return <CommunityBuildsPage />;

  if (materialsOpen) {
    return <main className="app-shell">
      <nav className="top-tabs">
        {TABS.map(([id, name]) => <button key={id} className={id === 'materials' ? 'top-tab active' : 'top-tab'} onClick={() => openTab(id)}>{name}</button>)}
        <button className="top-tab" onClick={goToBuilds}>玩家Build</button>
      </nav>
      <CraftingMaterialsPageSafe />
    </main>;
  }

  return <div onClickCapture={(event) => {
    const button = event.target?.closest?.('button');
    if (button?.textContent?.trim() === '材料') {
      event.preventDefault();
      event.stopPropagation();
      openTab('materials');
    }
  }}>
    <AppMediaEnhanced />
    <button className="community-builds-link" onClick={goToBuilds}>玩家 Build 库</button>
  </div>;
}

function AppWithIntro() {
  const [entered, setEntered] = useState(() => isBuildRoute());
  return entered ? <GuidebookRouter /> : <CoverIntro onEnter={() => setEntered(true)} />;
}

const container = document.querySelector('#root');
const app = createRoot(container);

app.render(
  <React.StrictMode>
    <AppWithIntro />
  </React.StrictMode>,
);
