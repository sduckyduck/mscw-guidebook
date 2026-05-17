const SWIPE_TABS = [
  { id: 'overview', label: '总览' },
  { id: 'character', label: '角色' },
  { id: 'maps', label: '地图' },
  { id: 'quests', label: '任务' },
  { id: 'materials', label: '材料' },
];

const SWIPE_EXIT_MS = 150;
const SWIPE_ENTER_MS = 280;
const SWIPE_TOTAL_MS = SWIPE_EXIT_MS + SWIPE_ENTER_MS;
const SWIPE_THRESHOLD = 64;
const SWIPE_MAX_DRAG = 96;

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

function getShell() {
  return document.querySelector('.app-shell');
}

function resetSwipeAnimation(shell = getShell()) {
  if (!shell) return;
  shell.classList.remove(
    'mg-tab-swipe-dragging',
    'mg-tab-swipe-cancel',
    'mg-tab-swipe-exit-left',
    'mg-tab-swipe-exit-right',
    'mg-tab-swipe-enter-left',
    'mg-tab-swipe-enter-right',
    'mg-tab-swipe-animating',
  );
  shell.style.removeProperty('--mscw-swipe-drag');
}

function setDragOffset(dx) {
  const shell = getShell();
  if (!shell) return;
  const clamped = Math.max(-SWIPE_MAX_DRAG, Math.min(SWIPE_MAX_DRAG, dx));
  shell.classList.add('mg-tab-swipe-dragging');
  shell.style.setProperty('--mscw-swipe-drag', `${clamped}px`);
}

function playCancelAnimation() {
  const shell = getShell();
  if (!shell) return;
  shell.classList.remove('mg-tab-swipe-dragging');
  shell.classList.add('mg-tab-swipe-cancel');
  window.setTimeout(() => resetSwipeAnimation(shell), 180);
}

function playSwipeTabChange(delta, nextTabId) {
  const shell = getShell();
  if (!shell) return;

  const exitClass = delta > 0 ? 'mg-tab-swipe-exit-left' : 'mg-tab-swipe-exit-right';
  const enterClass = delta > 0 ? 'mg-tab-swipe-enter-right' : 'mg-tab-swipe-enter-left';

  shell.classList.remove('mg-tab-swipe-dragging');
  shell.classList.add('mg-tab-swipe-animating', exitClass);
  shell.style.removeProperty('--mscw-swipe-drag');

  window.setTimeout(() => {
    const changed = clickTabButton(nextTabId);
    if (!changed) {
      resetSwipeAnimation(shell);
      return;
    }

    window.requestAnimationFrame(() => {
      const nextShell = getShell();
      if (!nextShell) return;
      nextShell.classList.remove(exitClass);
      void nextShell.offsetWidth;
      nextShell.classList.add('mg-tab-swipe-animating', enterClass);

      window.setTimeout(() => {
        resetSwipeAnimation(nextShell);
      }, SWIPE_ENTER_MS + 80);
    });
  }, SWIPE_EXIT_MS);
}

function getAdjacentTab(delta) {
  const currentId = getCurrentTabId();
  const currentIndex = SWIPE_TABS.findIndex((tab) => tab.id === currentId);
  if (currentIndex < 0) return null;

  const nextIndex = Math.max(0, Math.min(SWIPE_TABS.length - 1, currentIndex + delta));
  if (nextIndex === currentIndex) return null;
  return SWIPE_TABS[nextIndex];
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
        transform: translateY(-1px) scale(1.018);
        box-shadow: inset 0 0 0 1px rgba(25, 128, 108, 0.15), 0 8px 18px rgba(14, 92, 88, 0.12);
      }

      .app-shell.mg-tab-swipe-animating,
      .app-shell.mg-tab-swipe-dragging,
      .app-shell.mg-tab-swipe-cancel {
        overflow-x: hidden !important;
      }

      .app-shell.mg-tab-swipe-dragging > :not(.top-tabs),
      .app-shell.mg-tab-swipe-cancel > :not(.top-tabs),
      .app-shell.mg-tab-swipe-exit-left > :not(.top-tabs),
      .app-shell.mg-tab-swipe-exit-right > :not(.top-tabs),
      .app-shell.mg-tab-swipe-enter-left > :not(.top-tabs),
      .app-shell.mg-tab-swipe-enter-right > :not(.top-tabs) {
        will-change: transform, opacity;
        backface-visibility: hidden;
        transform-style: preserve-3d;
      }

      .app-shell.mg-tab-swipe-dragging > :not(.top-tabs) {
        transform: translate3d(var(--mscw-swipe-drag, 0px), 0, 0) scale(0.992);
        opacity: 0.92;
        transition: none !important;
      }

      .app-shell.mg-tab-swipe-cancel > :not(.top-tabs) {
        transform: translate3d(0, 0, 0) scale(1);
        opacity: 1;
        transition: transform 170ms cubic-bezier(0.2, 0.9, 0.25, 1), opacity 170ms ease;
      }

      .app-shell.mg-tab-swipe-exit-left > :not(.top-tabs) {
        animation: mscwSwipeExitLeft ${SWIPE_EXIT_MS}ms cubic-bezier(0.45, 0, 0.9, 0.55) both;
      }

      .app-shell.mg-tab-swipe-exit-right > :not(.top-tabs) {
        animation: mscwSwipeExitRight ${SWIPE_EXIT_MS}ms cubic-bezier(0.45, 0, 0.9, 0.55) both;
      }

      .app-shell.mg-tab-swipe-enter-left > :not(.top-tabs) {
        animation: mscwSwipeEnterLeft ${SWIPE_ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .app-shell.mg-tab-swipe-enter-right > :not(.top-tabs) {
        animation: mscwSwipeEnterRight ${SWIPE_ENTER_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
    }

    @keyframes mscwSwipeExitLeft {
      from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      to { opacity: 0.10; transform: translate3d(-90px, 0, 0) scale(0.975); }
    }

    @keyframes mscwSwipeExitRight {
      from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      to { opacity: 0.10; transform: translate3d(90px, 0, 0) scale(0.975); }
    }

    @keyframes mscwSwipeEnterLeft {
      from { opacity: 0.10; transform: translate3d(-100px, 0, 0) scale(0.975); }
      to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }

    @keyframes mscwSwipeEnterRight {
      from { opacity: 0.10; transform: translate3d(100px, 0, 0) scale(0.975); }
      to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }

    @media (prefers-reduced-motion: reduce) {
      .top-tabs .top-tab,
      .app-shell.mg-tab-swipe-dragging > :not(.top-tabs),
      .app-shell.mg-tab-swipe-cancel > :not(.top-tabs),
      .app-shell.mg-tab-swipe-exit-left > :not(.top-tabs),
      .app-shell.mg-tab-swipe-exit-right > :not(.top-tabs),
      .app-shell.mg-tab-swipe-enter-left > :not(.top-tabs),
      .app-shell.mg-tab-swipe-enter-right > :not(.top-tabs) {
        animation: none !important;
        transition: none !important;
        transform: none !important;
        opacity: 1 !important;
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
  let isDragging = false;
  let isAnimating = false;

  window.addEventListener('touchstart', (event) => {
    if (isAnimating || !isPhoneSwipeEnabled() || !isMainGuidePage()) return;
    if (event.touches.length !== 1) return;
    if (isInteractiveStart(event.target)) return;

    const touch = event.touches[0];
    start = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isDragging = false;
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    if (!start || isAnimating || !isPhoneSwipeEnabled() || !isMainGuidePage()) return;
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (!isDragging && absX > 12 && absX > absY * 1.35) isDragging = true;
    if (!isDragging) return;

    const delta = dx < 0 ? 1 : -1;
    const adjacent = getAdjacentTab(delta);
    const resistance = adjacent ? 1 : 0.32;
    setDragOffset(dx * resistance);
  }, { passive: true });

  window.addEventListener('touchend', (event) => {
    if (!start || isAnimating || !isPhoneSwipeEnabled() || !isMainGuidePage()) {
      start = null;
      isDragging = false;
      return;
    }

    const touch = event.changedTouches?.[0];
    if (!touch) {
      start = null;
      isDragging = false;
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.time;
    start = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const isHorizontalSwipe = absX >= SWIPE_THRESHOLD && absX > absY * 1.35 && elapsed <= 1100;

    if (!isHorizontalSwipe) {
      if (isDragging) playCancelAnimation();
      isDragging = false;
      return;
    }

    const delta = dx < 0 ? 1 : -1;
    const adjacent = getAdjacentTab(delta);
    if (!adjacent) {
      playCancelAnimation();
      isDragging = false;
      return;
    }

    isAnimating = true;
    isDragging = false;
    playSwipeTabChange(delta, adjacent.id);
    window.setTimeout(() => {
      isAnimating = false;
    }, SWIPE_TOTAL_MS + 160);
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    start = null;
    if (isDragging) playCancelAnimation();
    isDragging = false;
  }, { passive: true });
}

installMobileSwipeTabs();
