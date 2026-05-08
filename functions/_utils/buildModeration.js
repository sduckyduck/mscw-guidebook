const BLOCKED_TERMS = [
  // Advertising / traffic diversion / contact harvesting
  '广告', '推广', '引流', '商务合作', '接推广', '广告位', '粉丝群', '返利', '返钱', '返现',
  '加微信', '加vx', '加v', '加qq', 'qq群', 'q群', '私聊', '私信我', '联系我', '联系方式',
  'telegram', 'tg群', '飞机群', 'discord.gg', 'line群',

  // Game cheating / illegal game services
  '外挂', '脚本', '科技号', '脱机挂', '封包', '改爆率', '改伤害', '自动打怪', '自动挂机',
  '辅助软件', '代练', '代充', '低价充值', '黑号', '买号', '卖号', '租号', '金币交易', '出金',

  // Gambling
  '博彩', '赌博', '网赌', '彩票', '六合彩', '时时彩', '北京赛车', '百家乐', '老虎机', '赌球',
  '澳门赌场', '真人荷官', '棋牌充值', '棋牌代理',

  // Adult / sexual services
  '色情', '成人网站', '黄片', '裸聊', '约炮', '援交', '外围', '上门服务', '特殊服务',
  '私房照', '成人视频', '成人直播',

  // Scams / illegal finance / account crimes
  '贷款', '网贷', '套现', '信用卡代还', '银行卡收购', '收银行卡', '跑分', '洗钱', '杀猪盘',
  '刷单', '兼职刷单', '投资理财群', '稳赚', '稳赚不赔', '高收益', '日赚', '无风险套利',

  // Drugs / controlled substances
  '毒品', '冰毒', '大麻', 'k粉', '摇头丸', '麻古', '迷药', '催情药', '违禁药',

  // Malware / credential theft
  '盗号', '钓鱼链接', '木马', '远控', '盗取密码', '撞库', '社工库', '免杀',
];

const BLOCKED_PATTERNS = [
  { category: 'link', pattern: /https?:\/\//i },
  { category: 'link', pattern: /www\./i },
  { category: 'link', pattern: /(?:^|\s)(?:t\.me|telegram\.me|discord\.gg|bit\.ly|tinyurl\.com|goo\.gl|b23\.tv)\//i },
  { category: 'contact', pattern: /(?:微信|vx|v信|wechat|qq|企鹅)\s*[:：]?\s*[a-z0-9_\-]{4,}/i },
  { category: 'contact', pattern: /(?:加|看|找)\s*(?:我)?\s*(?:微信|vx|v信|qq)/i },
  { category: 'contact', pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
  { category: 'contact', pattern: /(?:\+?\d[\s-]?){7,}/ },
  { category: 'spam', pattern: /(.)\1{8,}/ },
  { category: 'spam', pattern: /(?:免费|低价|优惠|返现|充值|代充|外挂|脚本).{0,12}(?:联系|私信|加|群|链接)/i },
];

const MAX_FIELD_LENGTHS = {
  title: 80,
  authorName: 40,
  description: 1200,
  tags: 160,
};

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .replace(/[＊*·・•。．.，,、_\-—~～\s]+/g, '')
    .trim();
}

function readableText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u200b-\u200f\ufeff]/g, '')
    .trim();
}

function containsBlockedTerm(text) {
  const compact = normalizeText(text);
  return BLOCKED_TERMS.some((term) => compact.includes(normalizeText(term)));
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
  if (containsBlockedTerm(combined) || matchesBlockedPattern(combined)) {
    return {
      ok: false,
      code: 'POLICY_BLOCKED',
      error: '提交失败：Build 标题、作者名或说明中包含广告、联系方式、外挂、博彩、色情、诈骗等不适合公开展示的内容。请删除相关内容后再提交。',
    };
  }

  return { ok: true };
}
