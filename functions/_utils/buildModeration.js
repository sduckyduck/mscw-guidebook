const BLOCKED_TERMS = [
  // Advertising / traffic diversion / contact harvesting
  '广告', '推广', '引流', '商务合作', '接推广', '广告位', '粉丝群', '返利', '返钱', '返现',
  '加微信', '加vx', '加v', '加qq', 'qq群', 'q群', '私聊', '私信我', '联系我', '联系方式',
  'telegram', 'tg群', '飞机群', 'discord.gg', 'line群', '拉群', '进群', '群号', '群聊',
  '公众号', '公粽号', '公种号', '小号', '主页有', '看主页', '主页联系', '私域', '导流', '置顶找',

  // Obfuscated contact words / platform slang
  '微信', '微 信', '薇信', '威信', '维信', '卫星', '微星', 'v信', 'vx', 'v x', 'wx', 'w x', 'weixin', 'wechat',
  '扣扣', '企鹅号', '球球', 'qq', 'q q', 'q裙', '扣群', '裙号', '君羊', '裙聊', '加卫星', '加薇', '加微', '加v', '加q',
  '飞书群', '电报群', '纸飞机', '飞机号', '蓝鸟', 'ins私信', 'line联系',

  // Game cheating / illegal game services
  '外挂', '脚本', '科技号', '脱机挂', '封包', '改爆率', '改伤害', '自动打怪', '自动挂机',
  '辅助软件', '辅助器', '破解版', '破解版脚本', '免封', '防封', '过检测', '绕检测', '代练', '代充', '低价充值',
  '黑号', '买号', '卖号', '租号', '金币交易', '出金', '工作室出货', '搬砖群', '收币', '卖币', '金币回收',

  // Gambling
  '博彩', '赌博', '网赌', '彩票', '六合彩', '时时彩', '北京赛车', '百家乐', '老虎机', '赌球',
  '澳门赌场', '真人荷官', '棋牌充值', '棋牌代理', '菠菜', '开盘', '投注', '稳赚盘口',

  // Adult / sexual services
  '色情', '成人网站', '黄片', '裸聊', '约炮', '援交', '外围', '上门服务', '特殊服务',
  '私房照', '成人视频', '成人直播', '擦边资源', '福利姬', '约妹妹', '同城约',

  // Scams / illegal finance / account crimes
  '贷款', '网贷', '套现', '信用卡代还', '银行卡收购', '收银行卡', '跑分', '洗钱', '杀猪盘',
  '刷单', '兼职刷单', '投资理财群', '稳赚', '稳赚不赔', '高收益', '日赚', '无风险套利', '资金盘',
  '杀盘', '杀鱼盘', '灰产', '黑产', '接码', '卡商', '实名资料', '身份证出售',

  // Drugs / controlled substances
  '毒品', '冰毒', '大麻', 'k粉', '摇头丸', '麻古', '迷药', '催情药', '违禁药', '上头电子烟',

  // Malware / credential theft / doxxing
  '盗号', '钓鱼链接', '木马', '远控', '盗取密码', '撞库', '社工库', '免杀', '开盒', '人肉', '查户籍',
];

const CONTACT_ALIASES = [
  '微信', '薇信', '威信', '维信', '卫星', '微星', 'v信', 'vx', 'wx', 'weixin', 'wechat',
  'qq', '扣扣', '企鹅', '球球', 'q群', 'q裙', '裙号', '君羊', '群号', 'tg', 'telegram', '电报', '飞机', '纸飞机',
];

const PROMO_VERBS = [
  '加', '➕', '+', '十', '＋', 'jia', '找', '看', '搜', '私', '私聊', '私信', '联系', '进', '入', '拉', '看主页', '主页',
];

const ILLEGAL_SPEECH_TERMS = [
  '辱华', '反华', '台独', '港独', '藏独', '疆独', '纳粹', '恐怖袭击', '炸学校', '炸地铁', '炸机场',
  '买枪', '卖枪', '枪支弹药', '自制炸弹', '炸药教程', '仇恨言论', '种族歧视', '人身威胁',
];

const BLOCKED_PATTERNS = [
  // Links and redirect bait
  { category: 'link', pattern: /https?:\/\//i },
  { category: 'link', pattern: /www\./i },
  { category: 'link', pattern: /(?:^|\s)(?:t\.me|telegram\.me|discord\.gg|bit\.ly|tinyurl\.com|goo\.gl|b23\.tv|linktr\.ee|xhslink\.com)\//i },
  { category: 'link', pattern: /(?:点|看|戳|进).{0,6}(?:链接|主页|置顶|评论区)/i },

  // Contact and obfuscated contact formats
  { category: 'contact', pattern: /(?:微信|薇信|威信|维信|卫星|微星|vx|v\s*x|w\s*x|wechat|weixin|qq|q\s*q|企鹅|扣扣|球球|纸飞机|telegram|tg|电报)\s*[:：=＋+\-—_ ]?\s*[a-z0-9_\-.]{3,}/i },
  { category: 'contact', pattern: /(?:加|➕|\+|＋|十|找|看|搜|私聊|私信|联系|进|入|拉)\s*(?:我|俺|主页|置顶)?\s*(?:微信|薇信|威信|维信|卫星|微星|v信|vx|v\s*x|wx|w\s*x|qq|q\s*q|扣扣|企鹅|球球|群|裙|君羊|纸飞机|telegram|tg|电报)/i },
  { category: 'contact', pattern: /(?:微|薇|威|卫|v|w)[\s\W_]{0,3}(?:信|x|星)/i },
  { category: 'contact', pattern: /(?:q|扣|企鹅|球)[\s\W_]{0,3}(?:q|扣|群|裙)/i },
  { category: 'contact', pattern: /(?:群|裙|君羊)[\s\W_]{0,4}(?:号|聊|主|二维码|码)/i },
  { category: 'contact', pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { category: 'contact', pattern: /(?:\+?\d[\s-]?){7,}/ },

  // Spam and promotion templates
  { category: 'spam', pattern: /(.)\1{8,}/ },
  { category: 'spam', pattern: /(?:免费|低价|优惠|返现|充值|代充|外挂|脚本|薅羊毛|福利|资源|课程|群).{0,18}(?:联系|私信|加|群|链接|主页|置顶|扫码|二维码)/i },
  { category: 'spam', pattern: /(?:全网最低|限时优惠|内部渠道|包过|包封|包出|秒到账|自动发货|一手货源)/i },

  // Harmful / illegal facilitation phrasing, kept specific to avoid blocking normal game combat words.
  { category: 'illegal', pattern: /(?:教程|方法|渠道|资源|购买|出售|代办).{0,10}(?:毒品|迷药|炸药|枪支|银行卡|身份证|社工库|开盒|洗钱|跑分)/i },
];

const MAX_FIELD_LENGTHS = {
  title: 80,
  authorName: 40,
  description: 1200,
  tags: 160,
};

const HOMOGLYPH_MAP = new Map([
  ['０', '0'], ['１', '1'], ['２', '2'], ['３', '3'], ['４', '4'], ['５', '5'], ['６', '6'], ['７', '7'], ['８', '8'], ['９', '9'],
  ['ｖ', 'v'], ['Ｖ', 'v'], ['ｗ', 'w'], ['Ｗ', 'w'], ['ｘ', 'x'], ['Ｘ', 'x'], ['ｑ', 'q'], ['Ｑ', 'q'],
  ['🛰', '卫星'], ['📡', '卫星'], ['✈', '飞机'], ['🛩', '飞机'], ['📮', '邮箱'], ['📧', '邮箱'], ['📩', '私信'],
  ['➕', '加'], ['＋', '加'], ['➖', '-'], ['☎', '电话'], ['📞', '电话'], ['📱', '手机'], ['💬', '私信'],
]);

function expandSymbols(value) {
  return [...String(value ?? '')].map((char) => HOMOGLYPH_MAP.get(char) ?? char).join('');
}

function normalizeText(value) {
  return expandSymbols(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/[＊*·・•。．.，,、_\-—~～\/\\|:：;；'"`^=!?！？()[\]{}<>《》【】#￥$%&@\s]+/g, '')
    .trim();
}

function looseText(value) {
  return expandSymbols(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readableText(value) {
  return expandSymbols(value)
    .normalize('NFKC')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .trim();
}

function containsBlockedTerm(text) {
  const compact = normalizeText(text);
  const loose = looseText(text);
  return [...BLOCKED_TERMS, ...ILLEGAL_SPEECH_TERMS].some((term) => {
    const normalizedTerm = normalizeText(term);
    return compact.includes(normalizedTerm) || loose.includes(looseText(term));
  });
}

function hasObfuscatedContactIntent(text) {
  const compact = normalizeText(text);
  const loose = looseText(text);
  const hasContactAlias = CONTACT_ALIASES.some((alias) => compact.includes(normalizeText(alias)) || loose.includes(looseText(alias)));
  if (!hasContactAlias) return false;

  return PROMO_VERBS.some((verb) => compact.includes(normalizeText(verb)) || loose.includes(looseText(verb)))
    || /[a-z0-9_\-.]{4,}/i.test(readableText(text));
}

function matchesBlockedPattern(text) {
  const readable = readableText(text);
  return BLOCKED_PATTERNS.some((rule) => rule.pattern.test(readable));
}

function tooLong(field, value) {
  const maxLength = MAX_FIELD_LENGTHS[field];
  return maxLength && readableText(value).length > maxLength;
}

export function validateBuildSubmission(input) {
  const fields = {
    title: input.title,
    authorName: input.authorName,
    description: input.description,
    tags: Array.isArray(input.tags) ? input.tags.join(' ') : input.tags,
  };

  for (const [field, value] of Object.entries(fields)) {
    if (tooLong(field, value)) {
      return {
        ok: false,
        code: 'FIELD_TOO_LONG',
        error: '内容过长，请缩短标题、作者名或说明后再提交。',
      };
    }
  }

  const combined = Object.values(fields).join(' ');
  if (containsBlockedTerm(combined) || matchesBlockedPattern(combined) || hasObfuscatedContactIntent(combined)) {
    return {
      ok: false,
      code: 'POLICY_BLOCKED',
      error: '提交失败：Build 标题、作者名或说明中包含广告、联系方式、外挂、博彩、色情、诈骗、违法引流或其他不适合公开展示的内容。请删除相关内容后再提交。',
    };
  }

  return { ok: true };
}
