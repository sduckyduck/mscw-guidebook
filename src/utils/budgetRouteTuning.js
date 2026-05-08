const LOW_BUDGET_OLD_LABEL = '低资金';
const LOW_BUDGET_NEW_LABEL = '穷鬼流';

function replaceLowBudgetLabelInTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const nextText = String(node.nodeValue ?? '').replaceAll(LOW_BUDGET_OLD_LABEL, LOW_BUDGET_NEW_LABEL);
  if (nextText !== node.nodeValue) node.nodeValue = nextText;
}

function replaceLowBudgetLabels(root = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    replaceLowBudgetLabelInTextNode(node);
    node = walker.nextNode();
  }
}

function getSelectByLabel(labelText) {
  const fields = [...document.querySelectorAll('.mg-field')];
  const field = fields.find((item) => item.querySelector('label')?.textContent?.trim() === labelText);
  return field?.querySelector('select') ?? null;
}

function setSelectValue(select, value) {
  if (!select || select.value === value) return false;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function biasHighBudgetTowardHigherMonsters({ onlyWhenNotTouched = false } = {}) {
  const budgetSelect = getSelectByLabel('资金');
  const prioritySelect = getSelectByLabel('优先');
  if (!budgetSelect || !prioritySelect) return;
  if (budgetSelect.value !== 'high') return;
  if (onlyWhenNotTouched && prioritySelect.dataset.userTouched === '1') return;

  // High-budget route should act like a risk-tolerant training route:
  // the existing exp/high profile accepts about 80% hit and favors higher-level mobs.
  if (prioritySelect.value !== 'exp') setSelectValue(prioritySelect, 'exp');
}

function installBudgetRouteTuning() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBudgetRouteTuningInstalled) return;
  window.__mscwBudgetRouteTuningInstalled = true;

  replaceLowBudgetLabels();

  window.setTimeout(() => biasHighBudgetTowardHigherMonsters(), 120);

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    const fieldLabel = target.closest('.mg-field')?.querySelector('label')?.textContent?.trim();
    if (fieldLabel === '优先') {
      target.dataset.userTouched = '1';
      return;
    }
    if (fieldLabel === '资金') {
      const prioritySelect = getSelectByLabel('优先');
      if (prioritySelect) prioritySelect.dataset.userTouched = '';
      biasHighBudgetTowardHigherMonsters();
    }
  }, true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        replaceLowBudgetLabelInTextNode(mutation.target);
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          replaceLowBudgetLabelInTextNode(node);
        } else if (node instanceof Element) {
          replaceLowBudgetLabels(node);
        }
      }
    }
    window.setTimeout(() => biasHighBudgetTowardHigherMonsters({ onlyWhenNotTouched: true }), 0);
  });

  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

installBudgetRouteTuning();
