// 意图识别模块

export type IntentType = 'refund' | 'order' | 'technical' | 'human' | 'greeting' | 'goodbye' | 'general' | 'unknown';

export interface IntentResult {
  intent: IntentType;
  confidence: number; // 0-1
  matchedKeywords: string[];
}

// 意图关键词映射
const intentKeywords: Record<IntentType, string[]> = {
  refund: [
    '退款', '退钱', '退货', '退款申请', '退款进度', '退款失败', '退款到账',
    'return', 'refund', 'money back', '退', '返款', '退还', '退回'
  ],
  order: [
    '订单', '查询订单', '订单状态', '物流', '快递', '发货', '到货', '收货',
    'order', 'tracking', 'shipment', 'delivery', '快递单号', '物流信息',
    '改地址', '修改地址', '取消订单', '订单号'
  ],
  technical: [
    '登录', '密码', '验证码', '闪退', '卡顿', 'BUG', '故障', '错误',
    'login', 'password', 'verification', 'crash', 'error', 'bug',
    '无法登录', '上不去', '打不开', '收不到', '卡死', '黑屏', '白屏'
  ],
  human: [
    '人工', '人工客服', '转人工', '人工服务', '找客服', '联系客服',
    'human', 'agent', 'customer service', '客服', '人工帮助', '人工支持',
    '投诉', '建议', '反馈', '举报', '不满意'
  ],
  greeting: [
    '你好', '您好', '嗨', 'Hello', 'Hi', 'hey', '在吗', '有人吗',
    'hello', 'hi', 'hey', '您好', '你好啊', '早上好', '下午好', '晚上好'
  ],
  goodbye: [
    '再见', '拜拜', 'bye', 'goodbye', '谢谢', '感谢', 'byebye',
    '再会', '回见', '走了', '结束', '关闭', '退出'
  ],
  general: [
    '优惠券', '活动', '会员', '积分', '余额', '充值', '提现',
    'coupon', 'promotion', 'member', 'points', 'balance',
    '怎么买', '多少钱', '价格', '优惠', '折扣'
  ],
  unknown: []
};

// 检测用户意图
export function detectIntent(message: string): IntentResult {
  const lowerMessage = message.toLowerCase();
  const scores: Record<IntentType, number> = {
    refund: 0,
    order: 0,
    technical: 0,
    human: 0,
    greeting: 0,
    goodbye: 0,
    general: 0,
    unknown: 0
  };
  const matchedKeywords: Record<IntentType, string[]> = {
    refund: [],
    order: [],
    technical: [],
    human: [],
    greeting: [],
    goodbye: [],
    general: [],
    unknown: []
  };

  // 计算每个意图的匹配分数
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        scores[intent as IntentType] += 1;
        matchedKeywords[intent as IntentType].push(keyword);
      }
    }
  }

  // 特殊规则：转人工的高优先级检测
  if (scores.human > 0 || /^(人工|客服|转人工|找客服)/.test(message)) {
    return {
      intent: 'human',
      confidence: 0.95,
      matchedKeywords: matchedKeywords.human
    };
  }

  // 找到最高分的意图
  let maxIntent: IntentType = 'unknown';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (intent !== 'unknown' && score > maxScore) {
      maxScore = score;
      maxIntent = intent as IntentType;
    }
  }

  // 计算置信度
  let confidence = 0;
  if (maxScore > 0) {
    // 基于匹配关键词数量计算置信度
    confidence = Math.min(0.5 + maxScore * 0.15, 0.95);
  }

  // 如果没有匹配到任何关键词，检查是否为问候语
  if (maxScore === 0) {
    // 检查是否为简单问候
    if (/^(你好|您好|嗨|hello|hi|hey)/i.test(message.trim())) {
      return {
        intent: 'greeting',
        confidence: 0.8,
        matchedKeywords: ['问候']
      };
    }
    return {
      intent: 'unknown',
      confidence: 0,
      matchedKeywords: []
    };
  }

  return {
    intent: maxIntent,
    confidence,
    matchedKeywords: matchedKeywords[maxIntent]
  };
}

// 获取意图对应的中文名称
export function getIntentName(intent: IntentType): string {
  const names: Record<IntentType, string> = {
    refund: '退款/退货',
    order: '订单查询',
    technical: '技术支持',
    human: '转人工服务',
    greeting: '问候',
    goodbye: '结束对话',
    general: '一般咨询',
    unknown: '未知意图'
  };
  return names[intent];
}

// 获取意图对应的建议回复
export function getIntentSuggestion(intent: IntentType): string {
  const suggestions: Record<IntentType, string> = {
    refund: '检测到您可能想了解退款相关问题，我可以帮您：\n1. 查询退款进度\n2. 申请退款\n3. 了解退款规则\n\n请告诉我具体需要什么帮助？',
    order: '检测到您想查询订单，我可以帮您：\n1. 查询订单状态\n2. 查看物流信息\n3. 修改订单信息\n\n请提供订单号或告诉我具体需求。',
    technical: '检测到您遇到了技术问题，我可以帮您：\n1. 登录问题\n2. APP使用问题\n3. 账户安全问题\n\n请描述一下具体遇到了什么问题？',
    human: '正在为您转接人工客服，请稍候...\n\n工作时间：9:00-22:00\n非工作时间可留言，客服上线后会第一时间回复您。',
    greeting: '您好！我是智能客服助手，很高兴为您服务。\n\n我可以帮您处理：\n- 退款/退货\n- 订单查询\n- 技术支持\n- 其他问题\n\n请问有什么可以帮您？',
    goodbye: '感谢您的咨询，祝您生活愉快！\n\n如果您还有其他问题，随时欢迎再次咨询。再见！',
    general: '收到您的咨询，我来为您解答。\n\n如果您需要更专业的帮助，也可以随时说"人工"转接人工客服。',
    unknown: '感谢您的咨询。为了更好地帮助您，您可以：\n1. 详细描述您的问题\n2. 或者直接说"人工"转接人工客服'
  };
  return suggestions[intent];
}

// 检查是否需要转人工
export function shouldTransferToHuman(intent: IntentType, message: string, conversationTurns: number): boolean {
  // 明确请求人工
  if (intent === 'human') return true;

  // 多次未解决（对话轮次超过5轮且意图未知）
  if (conversationTurns > 5 && intent === 'unknown') return true;

  // 包含投诉关键词
  const complaintKeywords = ['投诉', '举报', '不满意', '差评', '欺骗', '诈骗', '骗子'];
  if (complaintKeywords.some(kw => message.includes(kw))) return true;

  // 情绪激动的表达
  const angryPatterns = /[!！]{2,}|[?？]{3,}|.{5,}[!！]|[啊呀哇]{2,}/;
  if (angryPatterns.test(message) && intent === 'unknown') return true;

  return false;
}
