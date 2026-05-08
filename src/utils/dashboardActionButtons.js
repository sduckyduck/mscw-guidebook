function goToBuilds() {
  window.location.assign('/builds');
}

function goToMapsTab() {
  const mapTab = [...document.querySelectorAll('.top-tab')]
    .find((button) => button.textContent?.trim() === '地图');
  if (mapTab) {
    mapTab.click();
    return;
  }
  window.location.hash = 'maps';
}

function enhanceDashboardActions() {
  const actions = document.querySelector('.mg-actions');
  if (!actions || actions.dataset.enhanced === 'true') return;

  const buttons = [...actions.querySelectorAll('button')];
  if (buttons.length < 3) return;

  const [leftButton, centerButton, rightButton] = buttons;

  leftButton.textContent = '保存 Build';
  leftButton.title = '保存当前配置到玩家 Build 库';
  leftButton.onclick = goToBuilds;

  centerButton.textContent = '玩家 Build 库';
  centerButton.title = '浏览和提交玩家 Build';
  centerButton.onclick = goToBuilds;

  rightButton.textContent = '地图路线';
  rightButton.title = '查看当前等级推荐地图路线';
  rightButton.onclick = goToMapsTab;

  actions.dataset.enhanced = 'true';
}

function installDashboardActionEnhancer() {
  if (typeof window === 'undefined' || window.__MSCW_DASHBOARD_ACTIONS_INSTALLED__) return;
  window.__MSCW_DASHBOARD_ACTIONS_INSTALLED__ = true;

  const run = () => window.requestAnimationFrame(enhanceDashboardActions);
  run();

  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
}

installDashboardActionEnhancer();
