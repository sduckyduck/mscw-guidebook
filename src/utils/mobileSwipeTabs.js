const SWIPE_TABS = [
  { id: 'overview', label: '总览' },
  { id: 'character', label: '角色' },
  { id: 'maps', label: '地图' },
  { id: 'materials', label: '材料' },
];

const SWIPE_ANIMATION_MS = 340;

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

function resetSwipeAnimation(shell) {
  shell.classList.remove('mg-tab-swipe-forward', 'mg-tab-swipe-backward', 'mg-tab-swipe-animating');
}

function playSwipeAnimation(direction) {
  window.requestAnimationFrame(() => {
    const shell = document.querySelector('.app-shell');
    if (!shell) return;

    resetSwipeAnimation(shell);
    // Force a new animation frame even when the user swipes quickly multiple times.
    void shell.offsetWidth;

    const className = direction > 0 ? 'mg-tab-swipe-forward' : 'mg-tab-swipe-backward';
    shell.classList.add('mg-tab-swipe-animating', className);

    window.setTimeout(() => {
      resetSwipeAnimation(shell);
    }, SWIPE_ANIMATION_MS + 90);
  });
}

function goToAdjacentTab(delta) {
  const currentId = getCurrentTabId();
  const currentIndex = SWIPE_TABS.findIndex((tab) => tab.id === currentId);
  if (currentIndex < 0) return;

  const nextIndex = Math.max(0, Math.min(SWIPE_TABS.length - 1, currentIndex + delta));
  if (nextIndex === currentIndex) return;

  const nextTab = SWIPE_TABS[nextIndex];
  const changed = clickTabButton(nextTab.id);
  if (changed) playSwipeAnimation(delta);
}

function installSwipeAnimationStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mscw-mobile-swipe-tab-styles')) return;

  const style = document.createElement('style');
  style.id = 'mscw-mobile-swipe-tab-styles';
  style.textContent = `
    @media (pointer: coarse), (max-width: 820px) {
      .top-tabs .top-tab {
        transition:
          background-color 240ms ease,
          border-color 240ms ease,
          color 240ms ease,
          box-shadow 240ms ease,
          transform 240ms ease;
      }

      .top-tabs .top-tab.active {
        transform: translateY(-1px) scale(1.015);
        box-shadow: inset 0 0 0 1px rgba(25, 128, 108, 0.12), 0 8px 18px rgba(14, 92, 88, 0.10);
      }

      .app-shell.mg-tab-swipe-animating {
        overflow-x: hidden !important;
      }

      .app-shell.mg-tab-swipe-forward > :not(.top-tabs) {
        animation: mscwSwipeTabForward ${SWIPE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
        will-change: transform, opacity, filter;
      }

      .app-shell.mg-tab-swipe-backward > :not(.top-tabs) {
        animation: mscwSwipeTabBackward ${SWIPE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
        will-change: transform, opacity, filter;
      }
    }

    @keyframes mscwSwipeTabForward {
      0% {
        opacity: 0.18;
        transform: translate3d(34px, 0, 0) scale(0.985);
        filter: blur(2px);
      }
      58% {
        opacity: 1;
        filter: blur(0);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0);
      }
    }

    @keyframes mscwSwipeTabBackward {
      0% {
        opacity: 0.18;
        transform: translate3d(-34px, 0, 0) scale(0.985);
        filter: blur(2px);
      }
      58% {
        opacity: 1;
        filter: blur(0);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .top-tabs .top-tab,
      .app-shell.mg-tab-swipe-forward > :not(.top-tabs),
      .app-shell.mg-tab-swipe-backward > :not(.top-tabs) {
        animation: none !important;
        transition: none !important;
        transform: none !important;
        filter: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function installMobileSwipeTabs() {
  if (typeof window === 'undefined') return;
  if (window.__mscwMobileSwipeTabsInstalled) return;
  window.__mscwMobileSwipeTabsInstalled = true;
  installSwipeAnimationStyles();

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
