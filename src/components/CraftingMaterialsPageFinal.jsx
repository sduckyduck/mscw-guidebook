import { useEffect, useRef } from 'react';
import CraftingMaterialsPageProfessionTabs from './CraftingMaterialsPageProfessionTabs.jsx';
import '../styles/materials-final-polish.css';

const BASE_URL = import.meta.env?.BASE_URL || '/';
const publicAsset = (path) => `${BASE_URL}${String(path).replace(/^\/+/, '')}`;

const SPECIAL_MATERIAL_ICONS = [
  {
    key: 'animal-fur-bundle',
    src: publicAsset('icons/crafting/animal_fur_bundle.png'),
    aliases: ['Animal Fur Bundle', 'Animal Fur Bundles', '动物皮毛包', '皮毛包'],
  },
  {
    key: 'processed-leather',
    src: publicAsset('icons/crafting/processed_leather.png'),
    aliases: ['Processed Leather', '加工皮革'],
  },
  {
    key: 'spool-of-thread',
    src: publicAsset('icons/crafting/spool_of_thread.png'),
    aliases: ['Spool of Thread', 'Spoon of Thread', 'Thread', '线轴', '丝线'],
  },
];

function replaceSpecialMaterialIcons(root) {
  if (!root) return;

  const candidates = root.querySelectorAll([
    '.craft-chip',
    '.craft-bottleneck-row',
    '.craft-matrix-row',
    '.craft-recipe-card',
    '.craft-material-focus',
  ].join(','));

  candidates.forEach((node) => {
    const text = node.textContent || '';
    const match = SPECIAL_MATERIAL_ICONS.find((icon) => icon.aliases.some((alias) => text.includes(alias)));
    if (!match) return;

    const slot = node.querySelector('.craft-msio-icon');
    if (!slot || slot.dataset.specialIcon === match.key) return;

    slot.dataset.specialIcon = match.key;
    slot.innerHTML = `<span class="craft-special-icon"><img src="${match.src}" alt="" loading="lazy" /></span>`;
  });
}

export default function CraftingMaterialsPageFinal() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    replaceSpecialMaterialIcons(root);
    const observer = new MutationObserver(() => replaceSpecialMaterialIcons(root));
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  const handleProfessionClickCapture = (event) => {
    const button = event.target?.closest?.('.craft-prof-tab');
    if (!button || !rootRef.current?.contains(button)) return;

    const isAllButton = button.textContent?.includes('全部');
    if (isAllButton || !button.classList.contains('active')) return;

    event.preventDefault();
    event.stopPropagation();
    rootRef.current.querySelector('.craft-prof-tab')?.click();
  };

  return (
    <div ref={rootRef} className="craft-final-page" onClickCapture={handleProfessionClickCapture}>
      <CraftingMaterialsPageProfessionTabs />
    </div>
  );
}
