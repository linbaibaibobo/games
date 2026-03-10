import { v4 as uuidv4 } from 'uuid';
import * as db from './db.js';

// 初始化 FAQ 知识库数据
export function initializeFaqData(): void {
  const existingFaqs = db.getAllFaqs();
  if (existingFaqs.length > 0) {
    console.log('[FAQ] 知识库已存在数据，跳过初始化');
    return;
  }

  const now = new Date().toISOString();
  const faqs = [
    // 退款相关
    {
      id: uuidv4(),
      question: '如何申请退款？',
      answer: '您可以通过以下步骤申请退款：\n1. 登录账户，进入"我的订单"\n2. 找到需要退款的订单，点击"申请退款"\n3. 选择退款原因并提交\n4. 退款将在3-7个工作日内原路返回\n\n注意：已发货订单需要先申请退货，收到退货后才能退款。',
      category: 'refund',
      keywords: '退款,申请退款,退货,钱,退钱',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: '退款多久能到账？',
      answer: '退款到账时间取决于您的支付方式：\n- 支付宝/微信支付：1-3个工作日\n- 银行卡：3-7个工作日\n- 信用卡：7-15个工作日\n\n如遇节假日可能会延迟，请耐心等待。',
      category: 'refund',
      keywords: '退款,到账,多久,时间,什么时候',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: '退款失败怎么办？',
      answer: '如果退款失败，请检查以下几点：\n1. 确认原支付账户是否正常\n2. 检查银行卡是否已过期或注销\n3. 确认退款金额是否超过原支付金额\n\n如仍有问题，请提供订单号联系人工客服处理。',
      category: 'refund',
      keywords: '退款,失败,不到账,没收到',
      created_at: now,
      updated_at: now
    },

    // 订单查询相关
    {
      id: uuidv4(),
      question: '如何查询订单状态？',
      answer: '您可以通过以下方式查询订单：\n1. 登录账户，点击"我的订单"\n2. 输入订单号在搜索框查询\n3. 查看订单详情，包括物流信息\n\n订单状态说明：\n- 待付款：订单未支付\n- 待发货：已付款，等待发货\n- 已发货：商品已发出\n- 已完成：订单已完成',
      category: 'order',
      keywords: '订单,查询,查看,状态,物流,快递',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: '订单显示已发货但查不到物流？',
      answer: '这种情况可能有以下原因：\n1. 快递公司尚未揽收，请等待24小时后再查询\n2. 物流信息更新有延迟\n3. 快递单号输入错误\n\n建议：\n- 等待24小时后再次查询\n- 联系快递公司客服确认\n- 如超过48小时无更新，请联系我们的客服',
      category: 'order',
      keywords: '订单,物流,快递,查不到,没信息',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: '如何修改订单地址？',
      answer: '订单地址修改规则：\n- 未付款订单：可直接在订单详情页修改\n- 已付款未发货：联系客服修改\n- 已发货订单：无法修改地址，建议联系快递转寄\n\n注意：部分特殊商品不支持地址修改。',
      category: 'order',
      keywords: '订单,地址,修改,改地址,收货地址',
      created_at: now,
      updated_at: now
    },

    // 技术支持相关
    {
      id: uuidv4(),
      question: '无法登录账户怎么办？',
      answer: '无法登录的解决方法：\n1. 检查网络连接是否正常\n2. 确认账号密码是否正确（注意大小写）\n3. 清除浏览器缓存后重试\n4. 尝试使用验证码登录\n5. 如忘记密码，点击"忘记密码"重置\n\n如以上方法无效，请联系技术支持。',
      category: 'technical',
      keywords: '登录,无法登录,密码,账号,上不去',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: 'APP闪退/卡顿怎么办？',
      answer: 'APP问题的解决方法：\n1. 重启APP\n2. 清除APP缓存\n3. 检查是否为最新版本，如不是请更新\n4. 重启手机\n5. 卸载后重新安装APP\n\n如问题持续，请提供手机型号和系统版本联系技术支持。',
      category: 'technical',
      keywords: 'APP,闪退,卡顿,崩溃,打不开,卡死',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: '收不到验证码怎么办？',
      answer: '验证码问题的排查方法：\n1. 检查手机信号是否正常\n2. 确认手机号输入正确\n3. 检查短信是否被拦截（垃圾箱/骚扰拦截）\n4. 等待60秒后重新获取\n5. 尝试语音验证码\n\n如多次尝试无效，请联系客服人工验证。',
      category: 'technical',
      keywords: '验证码,收不到,短信,没收到',
      created_at: now,
      updated_at: now
    },

    // 转人工相关
    {
      id: uuidv4(),
      question: '如何联系人工客服？',
      answer: '联系人工客服的方式：\n1. 在对话框输入"人工"或"转人工"\n2. 工作时间：9:00-22:00\n3. 非工作时间可留言，客服上线后会第一时间回复\n\n人工客服可以帮您处理：\n- 复杂售后问题\n- 账户异常\n- 投诉建议\n- 特殊需求',
      category: 'human',
      keywords: '人工,客服,人工客服,转人工,联系客服',
      created_at: now,
      updated_at: now
    },

    // 常见问题
    {
      id: uuidv4(),
      question: '如何修改密码？',
      answer: '修改密码步骤：\n1. 登录账户，进入"个人中心"\n2. 点击"账户安全"\n3. 选择"修改密码"\n4. 输入原密码和新密码\n5. 确认修改\n\n如忘记原密码，请先退出登录，使用"忘记密码"功能重置。',
      category: 'general',
      keywords: '密码,修改,改密码,重置密码',
      created_at: now,
      updated_at: now
    },
    {
      id: uuidv4(),
      question: '如何领取优惠券？',
      answer: '领取优惠券的方式：\n1. 首页领券中心\n2. 商品详情页领取\n3. 活动页面领取\n4. 会员专属优惠券\n\n使用规则：\n- 请在有效期内使用\n- 部分商品不参与优惠\n- 不可与其他优惠叠加',
      category: 'general',
      keywords: '优惠券,领券,优惠券,折扣,优惠',
      created_at: now,
      updated_at: now
    }
  ];

  for (const faq of faqs) {
    db.createFaq(faq as db.FaqItem);
  }

  console.log(`[FAQ] 已初始化 ${faqs.length} 条知识库数据`);
}
