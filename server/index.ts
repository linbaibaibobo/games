import express from "express";
import { query, unstable_v2_createSession, unstable_v2_authenticate, PermissionResult, CanUseTool } from "@tencent-ai/agent-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import * as db from "./db.js";
import { initializeFaqData } from "./faq-data.js";
import { detectIntent, getIntentName, getIntentSuggestion, shouldTransferToHuman, IntentType } from "./intent-detector.js";

const execAsync = promisify(exec);

// 待处理的权限请求
interface PendingPermission {
  resolve: (result: PermissionResult) => void;
  reject: (error: Error) => void;
  toolName: string;
  input: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
}

const pendingPermissions = new Map<string, PendingPermission>();

// 权限请求超时时间（5分钟）
const PERMISSION_TIMEOUT = 5 * 60 * 1000;

// 会话状态管理（用于多轮对话）
const sessionStates = new Map<string, {
  intent?: IntentType;
  lastTopic?: string;
  transferToHuman?: boolean;
  conversationTurns: number;
}>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// 缓存可用模型列表
let cachedModels: Array<{ modelId: string; name: string; description?: string }> = [];
const defaultModel = "claude-sonnet-4";

// 智能客服系统提示词
const customerServiceSystemPrompt = `你是「智能客服助手」，专门为用户提供专业、友好的客户服务。

## 你的职责
1. 解答用户关于退款、订单查询、技术支持等常见问题
2. 使用 FAQ 知识库回答用户问题
3. 识别用户意图，提供精准帮助
4. 当无法解决问题时，主动建议转人工客服

## 服务原则
- 礼貌友好，使用"您好"、"请"、"谢谢"等礼貌用语
- 回答简洁清晰，避免冗长
- 主动询问用户是否还有其他问题
- 不确定时诚实告知，不编造信息

## 可处理的业务类型
- 退款/退货：退款申请、进度查询、退款规则
- 订单查询：订单状态、物流信息、修改订单
- 技术支持：登录问题、APP问题、账户安全
- 其他咨询：优惠券、活动、会员等

## 转人工规则
当遇到以下情况时，请建议用户转人工客服：
1. 用户明确要求转人工
2. 问题复杂，超出知识库范围
3. 用户情绪激动或投诉
4. 涉及账户安全、隐私等敏感问题

## 回复格式
- 使用 Markdown 格式
- 重要信息使用加粗
- 步骤使用编号列表`;

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 登录方式类型
type LoginMethod = 'env' | 'cli' | 'none';

interface LoginStatusResponse {
  isLoggedIn: boolean;
  method?: LoginMethod;
  envConfigured?: boolean;
  cliConfigured?: boolean;
  error?: string;
  apiKey?: string;
  envVars?: {
    apiKey?: string;
    authToken?: string;
    internetEnv?: string;
    baseUrl?: string;
  };
}

// 检查 CodeBuddy CLI 登录状态
app.get("/api/check-login", async (req, res) => {
  const response: LoginStatusResponse = {
    isLoggedIn: false,
    envConfigured: false,
    cliConfigured: false,
    envVars: {},
  };

  const apiKey = process.env.CODEBUDDY_API_KEY;
  const authToken = process.env.CODEBUDDY_AUTH_TOKEN;
  const internetEnv = process.env.CODEBUDDY_INTERNET_ENVIRONMENT;
  const baseUrl = process.env.CODEBUDDY_BASE_URL;

  if (apiKey || authToken) {
    response.envConfigured = true;
    if (apiKey) {
      response.envVars!.apiKey = apiKey.slice(0, 8) + '****' + apiKey.slice(-4);
      response.apiKey = response.envVars!.apiKey;
    }
    if (authToken) {
      response.envVars!.authToken = authToken.slice(0, 8) + '****' + authToken.slice(-4);
    }
    if (internetEnv) response.envVars!.internetEnv = internetEnv;
    if (baseUrl) response.envVars!.baseUrl = baseUrl;
  }

  try {
    let needsLogin = false;
    const result = await unstable_v2_authenticate({
      environment: 'external',
      onAuthUrl: async (authState) => {
        needsLogin = true;
        response.error = '未登录，请先登录 CodeBuddy CLI';
      }
    });

    if (!needsLogin && result?.userinfo) {
      response.isLoggedIn = true;
      response.cliConfigured = true;
      response.method = response.envConfigured ? 'env' : 'cli';
    } else if (!needsLogin) {
      response.isLoggedIn = true;
      response.cliConfigured = true;
      response.method = response.envConfigured ? 'env' : 'cli';
    }
  } catch (error: any) {
    if (response.envConfigured) {
      response.isLoggedIn = true;
      response.method = 'env';
    } else {
      response.error = error?.message || String(error);
      response.method = 'none';
    }
  }

  res.json(response);
});

// 保存环境变量配置
app.post("/api/save-env-config", (req, res) => {
  const { apiKey, authToken, internetEnv, baseUrl } = req.body;

  if (!apiKey && !authToken) {
    return res.status(400).json({ error: '请至少配置 API Key 或 Auth Token' });
  }

  const configuredVars: string[] = [];

  if (apiKey) {
    process.env.CODEBUDDY_API_KEY = apiKey;
    configuredVars.push('CODEBUDDY_API_KEY');
  }
  if (authToken) {
    process.env.CODEBUDDY_AUTH_TOKEN = authToken;
    configuredVars.push('CODEBUDDY_AUTH_TOKEN');
  }
  if (internetEnv) {
    process.env.CODEBUDDY_INTERNET_ENVIRONMENT = internetEnv;
    configuredVars.push('CODEBUDDY_INTERNET_ENVIRONMENT');
  }
  if (baseUrl) {
    process.env.CODEBUDDY_BASE_URL = baseUrl;
    configuredVars.push('CODEBUDDY_BASE_URL');
  }

  cachedModels = [];

  res.json({
    success: true,
    message: `已设置: ${configuredVars.join(', ')}`,
    note: '环境变量仅在当前服务器进程有效，重启后需要重新设置'
  });
});

// 获取可用模型列表
app.get("/api/models", async (req, res) => {
  try {
    if (cachedModels.length === 0) {
      const session = await unstable_v2_createSession({ cwd: process.cwd() });
      const models = await session.getAvailableModels();
      if (models && Array.isArray(models)) {
        cachedModels = models;
      }
    }

    res.json({
      models: cachedModels.length > 0 ? cachedModels : [
        { modelId: "claude-sonnet-4", name: "Claude Sonnet 4" }
      ],
      defaultModel
    });
  } catch (error: any) {
    res.json({
      models: [
        { modelId: "claude-sonnet-4", name: "Claude Sonnet 4" },
        { modelId: "claude-opus-4", name: "Claude Opus 4" }
      ],
      defaultModel,
      error: error?.message || String(error)
    });
  }
});

// ============= FAQ API =============

// 获取所有 FAQ
app.get("/api/faqs", (req, res) => {
  try {
    const { category, search } = req.query;
    let faqs;

    if (search) {
      faqs = db.searchFaqs(search as string);
    } else if (category) {
      faqs = db.getFaqsByCategory(category as string);
    } else {
      faqs = db.getAllFaqs();
    }

    res.json({ faqs });
  } catch (error: any) {
    console.error("[FAQ] Error:", error);
    res.status(500).json({ error: error?.message || "获取 FAQ 失败" });
  }
});

// 创建 FAQ
app.post("/api/faqs", (req, res) => {
  try {
    const { question, answer, category, keywords } = req.body;
    const now = new Date().toISOString();

    const faq = db.createFaq({
      id: uuidv4(),
      question,
      answer,
      category,
      keywords: keywords || '',
      created_at: now,
      updated_at: now
    });

    res.json({ faq });
  } catch (error: any) {
    console.error("[Create FAQ] Error:", error);
    res.status(500).json({ error: error?.message || "创建 FAQ 失败" });
  }
});

// 更新 FAQ
app.patch("/api/faqs/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, keywords } = req.body;

    const success = db.updateFaq(id, { question, answer, category, keywords });

    if (!success) {
      return res.status(404).json({ error: "FAQ 不存在" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Update FAQ] Error:", error);
    res.status(500).json({ error: error?.message || "更新 FAQ 失败" });
  }
});

// 删除 FAQ
app.delete("/api/faqs/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = db.deleteFaq(id);

    if (!success) {
      return res.status(404).json({ error: "FAQ 不存在" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Delete FAQ] Error:", error);
    res.status(500).json({ error: error?.message || "删除 FAQ 失败" });
  }
});

// ============= 会话 API =============

// 获取所有会话
app.get("/api/sessions", (req, res) => {
  try {
    const sessions = db.getAllSessions();
    const sessionsWithMessages = sessions.map(session => {
      const messages = db.getMessagesBySession(session.id);
      const satisfaction = db.getSatisfactionBySession(session.id);
      return {
        ...session,
        messageCount: messages.length,
        satisfaction: satisfaction || null
      };
    });
    res.json({ sessions: sessionsWithMessages });
  } catch (error: any) {
    console.error("[Sessions] Error:", error);
    res.status(500).json({ error: error?.message || "获取会话失败" });
  }
});

// 获取单个会话
app.get("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = db.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "会话不存在" });
    }

    const messages = db.getMessagesBySession(sessionId);
    const satisfaction = db.getSatisfactionBySession(sessionId);

    const parsedMessages = messages.map(msg => ({
      ...msg,
      tool_calls: msg.tool_calls ? JSON.parse(msg.tool_calls) : null
    }));

    res.json({ session, messages: parsedMessages, satisfaction });
  } catch (error: any) {
    console.error("[Session] Error:", error);
    res.status(500).json({ error: error?.message || "获取会话失败" });
  }
});

// 创建新会话
app.post("/api/sessions", (req, res) => {
  try {
    const { model = defaultModel, title = "新对话" } = req.body;
    const now = new Date().toISOString();

    const session = db.createSession({
      id: uuidv4(),
      title,
      model,
      sdk_session_id: null,
      created_at: now,
      updated_at: now
    });

    // 初始化会话状态
    sessionStates.set(session.id, {
      conversationTurns: 0
    });

    res.json({ session });
  } catch (error: any) {
    console.error("[Create Session] Error:", error);
    res.status(500).json({ error: error?.message || "创建会话失败" });
  }
});

// 更新会话
app.patch("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, model } = req.body;

    const success = db.updateSession(sessionId, { title, model });

    if (!success) {
      return res.status(404).json({ error: "会话不存在" });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Update Session] Error:", error);
    res.status(500).json({ error: error?.message || "更新会话失败" });
  }
});

// 删除会话
app.delete("/api/sessions/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = db.deleteSession(sessionId);

    if (!success) {
      return res.status(404).json({ error: "会话不存在" });
    }

    // 清理会话状态
    sessionStates.delete(sessionId);

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Delete Session] Error:", error);
    res.status(500).json({ error: error?.message || "删除会话失败" });
  }
});

// ============= 满意度评价 API =============

// 创建满意度评价
app.post("/api/sessions/:sessionId/satisfaction", (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;

    const session = db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "会话不存在" });
    }

    const existingRating = db.getSatisfactionBySession(sessionId);
    if (existingRating) {
      return res.status(400).json({ error: "该会话已评价" });
    }

    const satisfaction = db.createSatisfactionRating({
      id: uuidv4(),
      session_id: sessionId,
      rating,
      feedback: feedback || null,
      created_at: new Date().toISOString()
    });

    res.json({ satisfaction });
  } catch (error: any) {
    console.error("[Satisfaction] Error:", error);
    res.status(500).json({ error: error?.message || "提交评价失败" });
  }
});

// 获取满意度统计
app.get("/api/satisfaction/stats", (req, res) => {
  try {
    const stats = db.getSatisfactionStats();
    res.json({ stats });
  } catch (error: any) {
    console.error("[Satisfaction Stats] Error:", error);
    res.status(500).json({ error: error?.message || "获取统计失败" });
  }
});

// ============= 意图识别统计 API =============

// 获取意图统计
app.get("/api/intent-stats", (req, res) => {
  try {
    const stats = db.getIntentStats();
    res.json({ stats });
  } catch (error: any) {
    console.error("[Intent Stats] Error:", error);
    res.status(500).json({ error: error?.message || "获取意图统计失败" });
  }
});

// ============= 聊天 API =============

// 权限响应 API
app.post("/api/permission-response", (req, res) => {
  const { requestId, behavior, message } = req.body;

  const pending = pendingPermissions.get(requestId);
  if (!pending) {
    return res.status(404).json({ error: "权限请求不存在或已超时" });
  }

  pendingPermissions.delete(requestId);

  if (behavior === 'allow') {
    pending.resolve({
      behavior: 'allow',
      updatedInput: pending.input
    });
  } else {
    pending.resolve({
      behavior: 'deny',
      message: message || '用户拒绝了此操作'
    });
  }

  res.json({ success: true });
});

// 发送消息并获取流式响应
app.post("/api/chat", async (req, res) => {
  const { sessionId, message, model, cwd, permissionMode } = req.body;

  console.log(`\n[Chat] ========== 新请求 ==========`);
  console.log(`[Chat] SessionId: ${sessionId}`);
  console.log(`[Chat] Message: ${message?.slice(0, 100)}${message?.length > 100 ? '...' : ''}`);

  if (!message) {
    return res.status(400).json({ error: "消息不能为空" });
  }

  // 获取或创建会话
  let session = sessionId ? db.getSession(sessionId) : null;
  const now = new Date().toISOString();

  if (!session) {
    session = db.createSession({
      id: sessionId || uuidv4(),
      title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
      model: model || defaultModel,
      sdk_session_id: null,
      created_at: now,
      updated_at: now
    });
    sessionStates.set(session.id, { conversationTurns: 0 });
  }

  // 获取会话状态
  let sessionState = sessionStates.get(session.id);
  if (!sessionState) {
    const messages = db.getMessagesBySession(session.id);
    sessionState = { conversationTurns: Math.floor(messages.length / 2) };
    sessionStates.set(session.id, sessionState);
  }
  sessionState.conversationTurns++;

  const selectedModel = model || session.model;
  const sdkSessionId = session.sdk_session_id;

  // 意图识别
  const intentResult = detectIntent(message);
  console.log(`[Chat] 检测到意图: ${intentResult.intent}, 置信度: ${intentResult.confidence.toFixed(2)}`);

  // 记录意图识别日志
  db.createIntentLog({
    id: uuidv4(),
    session_id: session.id,
    user_message: message,
    detected_intent: intentResult.intent,
    confidence: intentResult.confidence,
    created_at: now
  });

  // 更新会话状态
  sessionState.intent = intentResult.intent;

  // 检查是否需要转人工
  const needTransfer = shouldTransferToHuman(intentResult.intent, message, sessionState.conversationTurns);
  if (needTransfer) {
    sessionState.transferToHuman = true;
  }

  const userMessageId = uuidv4();
  const assistantMessageId = uuidv4();

  // 保存用户消息
  db.createMessage({
    id: userMessageId,
    session_id: session.id,
    role: 'user',
    content: message,
    model: null,
    created_at: now,
    tool_calls: null
  });

  // 设置 SSE 头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const workingDir = cwd || process.cwd();

  try {
    // 搜索相关 FAQ
    const relatedFaqs = db.searchFaqs(message).slice(0, 3);
    const faqContext = relatedFaqs.length > 0
      ? '\n\n相关 FAQ 知识库：\n' + relatedFaqs.map((f, i) =>
        `${i + 1}. 问题：${f.question}\n   答案：${f.answer}`
      ).join('\n\n')
      : '';

    // 构建增强的系统提示词
    const enhancedSystemPrompt = customerServiceSystemPrompt +
      `\n\n当前用户意图：${getIntentName(intentResult.intent)}` +
      (needTransfer ? '\n\n【注意】此用户需要转人工客服处理。' : '') +
      faqContext;

    // 构建用户消息（添加意图上下文）
    let enhancedMessage = message;
    if (intentResult.confidence > 0.5 && intentResult.intent !== 'unknown') {
      enhancedMessage = `[用户意图：${getIntentName(intentResult.intent)}] ${message}`;
    }

    // 创建 canUseTool 回调
    const canUseTool: CanUseTool = async (toolName, input, options) => {
      console.log(`[Permission] Tool request: ${toolName}`);

      if (permissionMode === 'bypassPermissions') {
        return { behavior: 'allow', updatedInput: input };
      }

      const requestId = uuidv4();
      const permissionRequest = {
        requestId,
        toolUseId: options.toolUseID,
        toolName,
        input,
        sessionId: session.id,
        timestamp: Date.now()
      };

      res.write(`data: ${JSON.stringify({
        type: "permission_request",
        ...permissionRequest
      })}\n\n`);

      return new Promise<PermissionResult>((resolve, reject) => {
        const pending: PendingPermission = {
          resolve,
          reject,
          toolName,
          input,
          sessionId: session.id,
          timestamp: Date.now()
        };

        pendingPermissions.set(requestId, pending);

        setTimeout(() => {
          if (pendingPermissions.has(requestId)) {
            pendingPermissions.delete(requestId);
            resolve({
              behavior: 'deny',
              message: '权限请求超时'
            });
          }
        }, PERMISSION_TIMEOUT);
      });
    };

    // 使用 Query API
    const stream = query({
      prompt: enhancedMessage,
      options: {
        cwd: workingDir,
        model: selectedModel,
        maxTurns: 10,
        systemPrompt: enhancedSystemPrompt,
        permissionMode: permissionMode || 'default',
        canUseTool,
        ...(sdkSessionId ? { resume: sdkSessionId } : {})
      }
    });

    let fullResponse = "";
    let toolCalls: Array<{
      id: string;
      name: string;
      input?: Record<string, unknown>;
      status: string;
      result?: string;
      isError?: boolean;
    }> = [];
    let newSdkSessionId: string | null = null;

    // 发送会话ID和消息ID
    res.write(`data: ${JSON.stringify({
      type: "init",
      sessionId: session.id,
      userMessageId,
      assistantMessageId,
      model: selectedModel,
      intent: intentResult.intent,
      needTransfer
    })}\n\n`);

    let currentToolId: string | null = null;

    // 处理流式响应
    for await (const msg of stream) {
      if (msg.type === "system" && (msg as any).subtype === "init") {
        newSdkSessionId = (msg as any).session_id;
        if (newSdkSessionId && newSdkSessionId !== sdkSessionId) {
          db.updateSession(session.id, { sdk_session_id: newSdkSessionId });
        }
      } else if (msg.type === "assistant") {
        const content = msg.message.content;

        if (typeof content === "string") {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ type: "text", content })}\n\n`);
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text") {
              fullResponse += block.text;
              res.write(`data: ${JSON.stringify({ type: "text", content: block.text })}\n\n`);
            } else if (block.type === "tool_use") {
              currentToolId = block.id || uuidv4();
              const toolInput = (block as any).input || {};
              const toolCall = {
                id: currentToolId,
                name: block.name,
                input: toolInput,
                status: "running"
              };
              toolCalls.push(toolCall);
              res.write(`data: ${JSON.stringify({
                type: "tool",
                id: toolCall.id,
                name: toolCall.name,
                input: toolCall.input,
                status: toolCall.status
              })}\n\n`);
            }
          }
        }
      } else if (msg.type === "tool_result") {
        const msgAny = msg as any;
        const toolId = msgAny.tool_use_id || currentToolId;
        const isError = msgAny.is_error || false;
        const content = msgAny.content;

        const tool = toolCalls.find(t => t.id === toolId) || toolCalls[toolCalls.length - 1];
        if (tool) {
          tool.status = isError ? "error" : "completed";
          tool.isError = isError;
          tool.result = typeof content === 'string'
            ? content
            : JSON.stringify(content);
          res.write(`data: ${JSON.stringify({
            type: "tool_result",
            toolId: tool.id,
            content: tool.result,
            isError: isError
          })}\n\n`);
        }
        currentToolId = null;
      } else if (msg.type === "result") {
        toolCalls.forEach(tool => {
          if (tool.status === "running") {
            tool.status = "completed";
            res.write(`data: ${JSON.stringify({ type: "tool_result", toolId: tool.id, content: tool.result || "已完成" })}\n\n`);
          }
        });
        res.write(`data: ${JSON.stringify({ type: "done", duration: msg.duration, cost: msg.cost })}\n\n`);
      }
    }

    // 保存助手消息
    db.createMessage({
      id: assistantMessageId,
      session_id: session.id,
      role: 'assistant',
      content: fullResponse,
      model: selectedModel,
      created_at: new Date().toISOString(),
      tool_calls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : null
    });

    // 更新会话标题
    const messages = db.getMessagesBySession(session.id);
    if (messages.length <= 2) {
      db.updateSession(session.id, {
        title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
        model: selectedModel
      });
    }

    console.log(`[Chat] 请求完成 ✓`);
    res.end();
  } catch (error: any) {
    console.error(`[Chat] Error:`, error?.message);
    const errorMessage = error?.message || "处理请求时发生错误";
    res.write(`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`);
    res.end();
  }
});

// ============= 管理后台 API =============

// 获取仪表盘统计数据
app.get("/api/admin/dashboard", (req, res) => {
  try {
    const sessions = db.getAllSessions();
    const satisfactionStats = db.getSatisfactionStats();
    const intentStats = db.getIntentStats();

    // 计算今日数据
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.created_at.startsWith(today));

    res.json({
      totalSessions: sessions.length,
      todaySessions: todaySessions.length,
      satisfaction: satisfactionStats,
      intentStats,
      recentSessions: sessions.slice(0, 10)
    });
  } catch (error: any) {
    console.error("[Dashboard] Error:", error);
    res.status(500).json({ error: error?.message || "获取仪表盘数据失败" });
  }
});

// 启动服务器
app.listen(PORT, () => {
  // 初始化 FAQ 数据
  initializeFaqData();

  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║     ◉ 智能客服系统已启动                    ║
║                                            ║
║     地址: http://localhost:${PORT}            ║
║     数据库: SQLite (data/chat.db)          ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});
