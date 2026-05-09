const EXACT_TRANSLATIONS = {
  // Beginner / common skills
  'Base Attack': '普通攻击',
  'Three Snails': '蜗牛投掷术',
  'Recovery': '恢复术',
  'Nimble Feet': '轻功步伐',

  // Warrior skills
  'Power Strike': '强力攻击',
  'Slash Blast': '群体攻击',
  'Improving HP Recovery': '生命恢复提升',
  'Improving Max HP Increase': '生命强化',
  'Max HP Increase': '生命强化',
  'Endure': '忍耐',
  'Iron Body': '圣甲术',
  'Sword Mastery': '精准剑',
  'Axe Mastery': '精准斧',
  'Blunt Weapon Mastery': '精准钝器',
  'Spear Mastery': '精准枪',
  'Pole Arm Mastery': '精准矛',
  'Polearm Mastery': '精准矛',
  'Final Attack: Sword': '终极剑',
  'Final Attack: Axe': '终极斧',
  'Final Attack: Blunt Weapon': '终极钝器',
  'Final Attack: Spear': '终极枪',
  'Final Attack: Pole Arm': '终极矛',
  'Final Attack: Polearm': '终极矛',
  'Sword Booster': '快速剑',
  'Axe Booster': '快速斧',
  'Blunt Weapon Booster': '快速钝器',
  'Spear Booster': '快速枪',
  'Pole Arm Booster': '快速矛',
  'Polearm Booster': '快速矛',
  'Rage': '愤怒之火',
  'Power Guard': '伤害反击',
  'Threaten': '威胁',
  'Shield Mastery': '精准盾',
  'Iron Will': '神圣之火前置防御',
  'Hyper Body': '神圣之火',

  // Magician skills
  'Energy Bolt': '魔法弹',
  'Magic Claw': '魔法双击',
  'Improving MP Recovery': '魔力恢复提升',
  'Improving Max MP Increase': '魔力强化',
  'Max MP Increase': '魔力强化',
  'Magic Guard': '魔法盾',
  'Magic Armor': '魔法铠甲',
  'MP Eater': '魔力吸收',
  'Meditation': '精神力',
  'Teleport': '瞬间移动',
  'Slow': '缓速术',
  'Fire Arrow': '火焰箭',
  'Poison Breath': '毒雾术',
  'Cold Beam': '冰冻术',
  'Thunder Bolt': '雷电术',
  'Heal': '群体治愈',
  'Invincible': '神圣护甲',
  'Bless': '祝福',
  'Holy Arrow': '圣箭术',

  // Bowman skills
  "Amazon's Bless": '精准弓提升',
  'Critical Shot': '强力箭',
  'Eye of Amazon': '远程箭',
  'Focus': '集中术',
  'Arrow Blow': '断魂箭',
  'Double Shot': '二连射',
  'Bow Mastery': '精准弓',
  'Crossbow Mastery': '精准弩',
  'Final Attack: Bow': '终极弓',
  'Final Attack: Crossbow': '终极弩',
  'Bow Booster': '快速弓',
  'Crossbow Booster': '快速弩',
  'Power Knockback': '强弓',
  'Soul Arrow: Bow': '无形箭：弓',
  'Soul Arrow: Crossbow': '无形箭：弩',
  'Arrow Bomb: Bow': '爆炸箭',
  'Iron Arrow: Crossbow': '穿透箭',
  'Arrow Bomb': '爆炸箭',
  'Iron Arrow': '穿透箭',

  // Thief skills
  'Nimble Body': '集中术',
  'Keen Eyes': '远程暗器',
  'Disorder': '诅咒术',
  'Dark Sight': '隐身术',
  'Double Stab': '二连击',
  'Lucky Seven': '双飞斩',
  'Claw Mastery': '精准暗器',
  'Critical Throw': '强力投掷',
  'Claw Booster': '快速暗器',
  'Haste': '轻功',
  'Drain': '生命吸收',
  'Dagger Mastery': '精准短刀',
  'Dagger Booster': '快速短刀',
  'Steal': '妙手术',
  'Savage Blow': '六连击',

  // Monster names
  'Tutorial Jr. Sentinel': '新手小石球',
  'Jr. Sentinel': '小石球',
  'Sentinel': '石球',
  'Snail': '蜗牛',
  'Blue Snail': '蓝蜗牛',
  'Red Snail': '红蜗牛',
  'Shroom': '蘑菇仔',
  'Stump': '木妖',
  'Dark Stump': '黑木妖',
  'Axe Stump': '斧木妖',
  'Dark Axe Stump': '黑斧木妖',
  'Ghost Stump': '幽灵木妖',
  'Slime': '绿水灵',
  'Pig': '猪猪',
  'Ribbon Pig': '漂漂猪',
  'Iron Hog': '钢铁猪',
  'Octopus': '章鱼怪',
  'Blue Mushroom': '蓝蘑菇',
  'Orange Mushroom': '橙蘑菇',
  'Green Mushroom': '绿蘑菇',
  'Horny Mushroom': '刺蘑菇',
  'Zombie Mushroom': '僵尸蘑菇',
  'Bubbling': '泡泡鱼',
  'Stirge': '蝙蝠怪',
  'Jr. Necki': '小青蛇',
  'Ligator': '鳄鱼',
  'Croco': '青鳄鱼',
  'Wild Boar': '野猪',
  'Fire Boar': '火野猪',
  'Evil Eye': '风独眼兽',
  'Curse Eye': '冰独眼兽',
  'Cold Eye': '冷冻独眼兽',
  'Lupin': '猴子',
  'Zombie Lupin': '僵尸猴',
  'Jr. Wraith': '小幽灵',
  'Wraith': '幽灵',
  'Shade': '暗影幽灵',
  'Drake': '火龙',
  'Copper Drake': '铜龙',
  'Red Drake': '红龙',
  'Ice Drake': '冰龙',
  'Dark Drake': '黑龙',
  'Stone Golem': '石巨人',
  'Dark Stone Golem': '黑石巨人',
  'Mixed Golem': '混合石巨人',
  'Tauromacis': '牛魔王',
  'Taurospear': '牛魔枪兵',
  'Balrog': '蝙蝠魔',
  'Green Trixter': '绿提克斯特',
  'Trixter': '提克斯特',

  // Common map names shown in the guide
  'East Entrance to Mushroom Town': '蘑菇村东入口',
  'Snail Hunting Ground I': '蜗牛狩猎场 I',
  'Snail Hunting Ground II': '蜗牛狩猎场 II',
  'Snail Hunting Ground III': '蜗牛狩猎场 III',
  'A Split Road': '岔路口',
  'The Field West of Amherst': '阿姆赫斯特西边原野',
  'The Field East of Amherst': '阿姆赫斯特东边原野',
  'In a Small Forest': '小森林',
  'Dangerous Forest': '危险森林',
  'Mushroom Garden': '蘑菇花园',
  'Snail Garden': '蜗牛花园',
  'Hunting Ground Middle of the Forest I': '森林中央狩猎场 I',
  'Hunting Ground Middle of the Forest II': '森林中央狩猎场 II',
  'Snail Field of Flowers': '蜗牛花田',
  'Tomato Field': '番茄田',
  'Right Around Lith Harbor': '明珠港近郊',
  'Thicket Around the Beach I': '海边灌木丛 I',
  'Thicket Around the Beach II': '海边灌木丛 II',
  'Thicket Around the Beach III': '海边灌木丛 III',
  '3-Way Road-Split': '三岔路口',
  'The Pig Beach': '猪猪海岸',
  'Beach Hunting Ground': '海岸狩猎场',
  'Henesys Hunting Ground I': '射手村狩猎场 I',
  'Henesys Hunting Ground II': '射手村狩猎场 II',
  'Henesys Hunting Ground III': '射手村狩猎场 III',
  'A Hill West of Henesys': '射手村西边小山',
  'The Hill East of Henesys': '射手村东边小山',
  'Forest West of Henesys': '射手村西边森林',
  'The Forest East of Henesys': '射手村东边森林',
  'The Blue Mushroom Forest': '蓝蘑菇森林',
  'The Road to the Dungeon': '通往地下城之路',
  'The Forest of Wisdom': '智慧森林',
  'The Forest South of Ellinia': '魔法密林南部森林',
  'The Field Up North of Ellinia': '魔法密林北部原野',
  'The Forest North of Ellinia': '魔法密林北部森林',
  'Kerning City Construction Site': '废弃都市工地',
  'Construction Site North of Kerning City': '废弃都市北方工地',
  'Kerning City Middle Forest I': '废弃都市中间森林 I',
  'Kerning City Middle Forest II': '废弃都市中间森林 II',
  'Kerning City Middle Forest III': '废弃都市中间森林 III',
  'L Forest I': 'L森林 I',
  'L Forest II': 'L森林 II',
  'L Forest III': 'L森林 III',
  'Sunset Sky': '落日天空',
  'West Street Corner of Perion': '勇士部落西街角',
  'West Domain of Perion': '勇士部落西部领地',
  'East Domain of Perion': '勇士部落东部领地',
  'Perion Street Corner': '勇士部落街角',
  'West Rocky Mountain I': '西部岩山 I',
  'West Rocky Mountain II': '西部岩山 II',
  'West Rocky Mountain III': '西部岩山 III',
  'East Rocky Mountain I': '东部岩山 I',
  'East Rocky Mountain II': '东部岩山 II',
  'East Rocky Mountain III': '东部岩山 III',
  'East Rocky Mountain IV': '东部岩山 IV',
  'Rocky Road I': '岩石路 I',
  'Rocky Road II': '岩石路 II',
  'Deep Valley I': '深谷 I',
  'Deep Valley II': '深谷 II',
  'Hunting Ground in the Deep Forest I': '深林狩猎场 I',
  'Hunting Ground in the Deep Forest II': '深林狩猎场 II',
  'Deep Forest': '深林',
  "Drake's Meal Table": '火龙的饭桌',
};

const PHRASE_TRANSLATIONS = [
  ['Lith Harbor', '明珠港'],
  ['Henesys', '射手村'],
  ['Ellinia', '魔法密林'],
  ['Kerning City', '废弃都市'],
  ['Perion', '勇士部落'],
  ['Sleepywood', '林中之城'],
  ['Amherst', '阿姆赫斯特'],
  ['Mushroom Town', '蘑菇村'],
  ['Dungeon', '地下城'],
  ['Forest', '森林'],
  ['Field', '原野'],
  ['Road', '道路'],
  ['Hill', '山丘'],
  ['Street', '街道'],
  ['Corner', '角落'],
  ['Construction Site', '工地'],
  ['Hunting Ground', '狩猎场'],
  ['Rocky Mountain', '岩山'],
  ['Rocky Road', '岩石路'],
  ['Deep Valley', '深谷'],
  ['Deep Forest', '深林'],
  ['West of', '西边'],
  ['East of', '东边'],
  ['North of', '北边'],
  ['South of', '南边'],
  ['West', '西部'],
  ['East', '东部'],
  ['North', '北部'],
  ['South', '南部'],
  ['Blue Mushroom', '蓝蘑菇'],
  ['Orange Mushroom', '橙蘑菇'],
  ['Green Mushroom', '绿蘑菇'],
  ['Zombie Mushroom', '僵尸蘑菇'],
  ['Horny Mushroom', '刺蘑菇'],
  ['Mushroom', '蘑菇'],
  ['Snail', '蜗牛'],
  ['Pig', '猪猪'],
  ['Beach', '海岸'],
  ['Garden', '花园'],
  ['Entrance', '入口'],
  ['Domain', '领地'],
  ['Wisdom', '智慧'],
];

const SORTED_KEYS = Object.keys(EXACT_TRANSLATIONS).sort((a, b) => b.length - a.length);

function translateText(text = '') {
  let next = String(text);
  for (const key of SORTED_KEYS) {
    if (!next.includes(key)) continue;
    next = next.split(key).join(EXACT_TRANSLATIONS[key]);
  }
  for (const [from, to] of PHRASE_TRANSLATIONS) {
    if (!next.includes(from)) continue;
    next = next.split(from).join(to);
  }
  return next;
}

function shouldSkipNode(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'].includes(parent.tagName);
}

function translateVisibleText(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    if (shouldSkipNode(node)) continue;
    const oldText = node.nodeValue;
    const newText = translateText(oldText);
    if (newText !== oldText) node.nodeValue = newText;
  }
}

function installZhNameTranslationPatch() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__mscwZhNameTranslationPatchInstalled) return;
  window.__mscwZhNameTranslationPatchInstalled = true;

  const run = () => window.requestAnimationFrame(() => translateVisibleText(document.body));
  run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true });
}

installZhNameTranslationPatch();
