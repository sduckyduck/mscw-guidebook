function parseTextRange(text = '') {
  const match = String(text).match(/(\d+)\s*[-~～]\s*(\d+)/);
  if (!match) return null;
  return { low: Number(match[1]) || 0, high: Number(match[2]) || 0 };
}

function tuneRange(label = '', range) {
  if (!range) return null;
  if (!/power\s+strike/i.test(label)) return range;
  if (range.high < 600) return range;
  return { low: range.low, high: Math.max(range.low, Math.round((range.low + range.high) / 2)) };
}

function writeRange(range) {
  return `${range.low} - ${range.high}`;
}

function patchRows(root = document) {
  root.querySelectorAll?.('.mg-overview-damage-row')?.forEach((row) => {
    const label = row.querySelector('strong')?.textContent?.trim() ?? '';
    const value = row.querySelector('em');
    if (!value || value.dataset.rangeTuned === '1') return;
    const range = tuneRange(label, parseTextRange(value.textContent));
    if (!range) return;
    value.textContent = writeRange(range);
    value.dataset.rangeTuned = '1';
  });

  root.querySelectorAll?.('.mg-detail-sheet')?.forEach((sheet) => {
    const label = sheet.querySelector('.mg-detail-head h2')?.textContent?.trim() ?? '';
    const value = sheet.querySelector('.mg-detail-damage strong');
    if (!value || value.dataset.rangeTuned === '1') return;
    const range = tuneRange(label, parseTextRange(value.textContent));
    if (!range) return;
    value.textContent = writeRange(range);
    value.dataset.rangeTuned = '1';
  });
}

function installSkillRangeFormatter() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwSkillRangeFormatterInstalled) return;
  window.__mscwSkillRangeFormatterInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) patchRows(node);
        }
      }
      if (mutation.type === 'characterData') {
        const scope = mutation.target?.parentElement?.closest?.('.mg-dashboard, .mg-detail-sheet') ?? document;
        patchRows(scope);
      }
    }
  });

  patchRows();
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

installSkillRangeFormatter();
