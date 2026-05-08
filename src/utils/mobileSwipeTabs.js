const SWIPE_TABS = [
  { id: 'overview', label: '总览' },
  { id: 'character', label: '角色' },
  { id: 'maps', label: '地图' },
  { id: 'materials', label: '材料' },
];

const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '.mg-picker-backdrop',
  '.mg-picker-sheet',
  '.skill-detail-backdrop',
  '.skill-detail-sheet',
  '.cover-intro',
].join(',');

function isPhoneSwipeEnabled() {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  return coarsePointer || window.innerWidth <= 820;
}

function isMainGuidePage() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  if (path === '/builds' || path.startsWith('/builds/')) return false;
  if (path === '/admin/builds' || path.startsWith('/admin/builds/')) return false;
  return Boolean(document.querySelector('.top-tabs'));
}

function isInteractiveStart(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

function getHashTab() {
  const value = window.location.hash.replace(/^#/, '');
  return SWIPE_TABS.some((tab) => tab.id === value) ? value : '';
}

function getCurrentTabId() {
  const hashTab = getHashTab();
  if (hashTab) return hashTab;

  const activeButton = [...document.querySelectorAll('.top-tabs .top-tab.active')]
    .find((button) => SWIPE_TABS.some((tab) => button.textContent?.trim() === tab.label));
  const activeLabel = activeButton?.textContent?.trim();
  const activeTab = SWIPE_TABS.find((tab) => tab.label === activeLabel);
  return activeTab?.id ?? 'overview';
}

function clickTabButton(tabId) {
  const tab = SWIPE_TABS.find((item) => item.id === tabId);
  if (!tab) return false;

  const buttons = [...document.querySelectorAll('.top-tabs .top-tab')];
  const target = buttons.find((button) => button.textContent?.trim() === tab.label);
  if (!target) return false;

  target.click();
  return true;
}

function goToAdjacentTab(delta) {
  const currentId = getCurrentTabId();
  const currentIndex = SWIPE_TABS.findIndex((tab) => tab.id === currentId);
  if (currentIndex < 0) return;

  const nextIndex = Math.max(0, Math.min(SWIPE_TABS.length - 1, currentIndex + delta));
  if (nextIndex === currentIndex) return;

  const nextTab = SWIPE_TABS[nextIndex];
  clickTabButton(nextTab.id);
}

function installMobileSwipeTabs() {
  if (typeof window === 'undefined') return;
  if (window.__mscwMobileSwipeTabsInstalled) return;
  window.__mscwMobileSwipeTabsInstalled = true;

  let start = null;

  window.addEventListener('touchstart', (event) => {
    if (!isPhoneSwipeEnabled() || !isMainGuidePage()) return;
    if (event.touches.length !== 1) return;
    if (isInteractiveStart(event.target)) return;

    const touch = event.touches[0];
    start = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, { passive: true });

  window.addEventListener('touchend', (event) => {
    if (!start || !isPhoneSwipeEnabled() || !isMainGuidePage()) {
      start = null;
      return;
    }

    const touch = event.changedTouches?.[0];
    if (!touch) {
      start = null;
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;
    start = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const isHorizontalSwipe = absX >= 72 && absX > absY * 1.45 && elapsed <= 900;
    if (!isHorizontalSwipe) return;

    // Swipe left moves forward: 总览 → 角色 → 地图 → 材料.
    // Swipe right moves backward: 材料 → 地图 → 角色 → 总览.
    goToAdjacentTab(dx < 0 ? 1 : -1);
  }, { passive: true });
}

installMobileSwipeTabs();
