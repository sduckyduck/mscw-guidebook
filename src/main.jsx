import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './utils/staffWeaponPickerPatch.js';
import AppMediaEnhanced from './AppMediaEnhanced.jsx';
import CoverIntro from './components/CoverIntro.jsx';
import CommunityBuildsPage from './components/CommunityBuildsPage.jsx';
import AdminBuildsPage from './components/AdminBuildsPage.jsx';
import './utils/cmsNoCacheFetchPatch.js';
import './utils/cmsSkillFetchPatch.js';
import './utils/officialDataSanityPatch.js';
import './utils/warriorStarterGearPatch.js';
import './utils/dashboardActionButtons.js';
import './utils/mobileSwipeTabs.js';
import './utils/removeZakumHelmet.js';
import './utils/brandFooterName.js';
import './utils/budgetRouteTuning.js';
import './utils/craftableGearBadges.js';
import './utils/dashboardDisplayFormatter.js';
import './utils/baseAttackFormulaPatch.js';
import './utils/zhNameTranslationPatch.js';
import './utils/equipmentSlotInspect.js';
import './styles.css';
import './styles/cover-intro.css';
import './styles/materials-page.css';
import './styles/layout-unify.css';
import './styles/community-build-detail.css';
import './styles/saved-build-cleanup.css';
import './styles/character-spap-layout-lock.css';
import './styles/skill-icon-click.css';
import './styles/skill-panel-actions.css';
import './styles/craftable-gear.css';
import './styles/equipment-inspect.css';
import './styles/app-polish.css';

function isBuildRoute() {
  return window.location.pathname === '/builds' || window.location.pathname.startsWith('/builds/');
}

function isAdminRoute() {
  return window.location.pathname === '/admin/builds' || window.location.pathname.startsWith('/admin/builds/');
}

function GuidebookRouter() {
  const [buildRouteOpen, setBuildRouteOpen] = useState(() => isBuildRoute());
  const [adminRouteOpen, setAdminRouteOpen] = useState(() => isAdminRoute());

  useEffect(() => {
    const sync = () => {
      setBuildRouteOpen(isBuildRoute());
      setAdminRouteOpen(isAdminRoute());
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  if (adminRouteOpen) return <AdminBuildsPage />;
  if (buildRouteOpen) return <CommunityBuildsPage />;

  return <AppMediaEnhanced />;
}

function AppWithIntro() {
  const [entered, setEntered] = useState(() => isBuildRoute() || isAdminRoute());
  return entered ? <GuidebookRouter /> : <CoverIntro onEnter={() => setEntered(true)} />;
}

const container = document.querySelector('#root');
const app = createRoot(container);

app.render(
  <React.StrictMode>
    <AppWithIntro />
  </React.StrictMode>,
);
