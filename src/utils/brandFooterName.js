const OLD_BRAND_NAMES = ['SduckyDuck', 'sduckyduck'];
const NEW_BRAND_NAME = '@奇怪小鸭';

function replaceBrandNameInTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  let nextText = node.nodeValue ?? '';
  for (const oldName of OLD_BRAND_NAMES) {
    nextText = nextText.replaceAll(oldName, NEW_BRAND_NAME);
  }
  if (nextText !== node.nodeValue) node.nodeValue = nextText;
}

function replaceBrandNames(root = document.body) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    replaceBrandNameInTextNode(node);
    node = walker.nextNode();
  }
}

function installBrandFooterName() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwBrandFooterNameInstalled) return;
  window.__mscwBrandFooterNameInstalled = true;

  replaceBrandNames();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        replaceBrandNameInTextNode(mutation.target);
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          replaceBrandNameInTextNode(node);
        } else if (node instanceof Element) {
          replaceBrandNames(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

installBrandFooterName();
