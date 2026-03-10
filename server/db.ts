import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'chat.db');

// 确保 data 目录存在
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 启用 WAL 模式以提高性能
db.pragma('journal_mode = WAL');

// 初始化数据库表
db.exec(`
  -- 会话表
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    sdk_session_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 消息表
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model TEXT,
    created_at TEXT NOT NULL,
    tool_calls TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  -- 为会话 ID 创建索引
  CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
`);

// 数据库迁移：添加 sdk_session_id 列（如果不存在）
try {
  const tableInfo = db.prepare("PRAGMA table_info(sessions)").all() as Array<{ name: string }>;
  const hasColumn = tableInfo.some(col => col.name === 'sdk_session_id');
  if (!hasColumn) {
    db.exec("ALTER TABLE sessions ADD COLUMN sdk_session_id TEXT");
    console.log("[DB] Added sdk_session_id column to sessions table");
  }
} catch (e) {
  // 忽略错误（列可能已存在）
}

// 类型定义
export interface DbSession {
  id: string;
  title: string;
  model: string;
  sdk_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  created_at: string;
  tool_calls: string | null;
}

// ============= 会话操作 =============

// 获取所有会话
export function getAllSessions(): DbSession[] {
  const stmt = db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC');
  return stmt.all() as DbSession[];
}

// 获取单个会话
export function getSession(id: string): DbSession | undefined {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as DbSession | undefined;
}

// 创建会话
export function createSession(session: DbSession): DbSession {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, title, model, sdk_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(session.id, session.title, session.model, session.sdk_session_id, session.created_at, session.updated_at);
  return session;
}

// 更新会话
export function updateSession(id: string, updates: Partial<Pick<DbSession, 'title' | 'model' | 'sdk_session_id'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.model !== undefined) {
    fields.push('model = ?');
    values.push(updates.model);
  }
  if (updates.sdk_session_id !== undefined) {
    fields.push('sdk_session_id = ?');
    values.push(updates.sdk_session_id);
  }
  
  if (fields.length === 0) return false;
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);
  
  const stmt = db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// 删除会话
export function deleteSession(id: string): boolean {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============= 消息操作 =============

// 获取会话的所有消息
export function getMessagesBySession(sessionId: string): DbMessage[] {
  const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
  return stmt.all(sessionId) as DbMessage[];
}

// 创建消息
export function createMessage(message: DbMessage): DbMessage {
  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    message.id,
    message.session_id,
    message.role,
    message.content,
    message.model,
    message.created_at,
    message.tool_calls
  );
  
  // 更新会话的 updated_at
  const updateStmt = db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?');
  updateStmt.run(new Date().toISOString(), message.session_id);
  
  return message;
}

// 更新消息内容
export function updateMessage(id: string, updates: Partial<Pick<DbMessage, 'content' | 'tool_calls'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.tool_calls !== undefined) {
    fields.push('tool_calls = ?');
    values.push(updates.tool_calls);
  }
  
  if (fields.length === 0) return false;
  
  values.push(id);
  
  const stmt = db.prepare(`UPDATE messages SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// 删除消息
export function deleteMessage(id: string): boolean {
  const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// 批量创建消息（用于保存对话）
export function createMessages(messages: DbMessage[]): void {
  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, model, created_at, tool_calls)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((msgs: DbMessage[]) => {
    for (const msg of msgs) {
      stmt.run(msg.id, msg.session_id, msg.role, msg.content, msg.model, msg.created_at, msg.tool_calls);
    }
  });

  insertMany(messages);
}

// 清空所有数据
export function clearAllData(): void {
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM sessions');
  db.exec('DELETE FROM faq_knowledge_base');
  db.exec('DELETE FROM satisfaction_ratings');
  db.exec('DELETE FROM intent_logs');
}

// ============= FAQ 知识库 =============

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string;
  created_at: string;
  updated_at: string;
}

// 初始化 FAQ 表
export function initFaqTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS faq_knowledge_base (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT NOT NULL,
      keywords TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_faq_category ON faq_knowledge_base(category);
  `);
}

// 获取所有 FAQ
export function getAllFaqs(): FaqItem[] {
  const stmt = db.prepare('SELECT * FROM faq_knowledge_base ORDER BY updated_at DESC');
  return stmt.all() as FaqItem[];
}

// 根据分类获取 FAQ
export function getFaqsByCategory(category: string): FaqItem[] {
  const stmt = db.prepare('SELECT * FROM faq_knowledge_base WHERE category = ? ORDER BY updated_at DESC');
  return stmt.all(category) as FaqItem[];
}

// 搜索 FAQ
export function searchFaqs(query: string): FaqItem[] {
  const searchTerm = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM faq_knowledge_base
    WHERE question LIKE ? OR answer LIKE ? OR keywords LIKE ?
    ORDER BY updated_at DESC
  `);
  return stmt.all(searchTerm, searchTerm, searchTerm) as FaqItem[];
}

// 创建 FAQ
export function createFaq(faq: FaqItem): FaqItem {
  const stmt = db.prepare(`
    INSERT INTO faq_knowledge_base (id, question, answer, category, keywords, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(faq.id, faq.question, faq.answer, faq.category, faq.keywords, faq.created_at, faq.updated_at);
  return faq;
}

// 更新 FAQ
export function updateFaq(id: string, updates: Partial<Omit<FaqItem, 'id' | 'created_at'>>): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.question !== undefined) {
    fields.push('question = ?');
    values.push(updates.question);
  }
  if (updates.answer !== undefined) {
    fields.push('answer = ?');
    values.push(updates.answer);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }
  if (updates.keywords !== undefined) {
    fields.push('keywords = ?');
    values.push(updates.keywords);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE faq_knowledge_base SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

// 删除 FAQ
export function deleteFaq(id: string): boolean {
  const stmt = db.prepare('DELETE FROM faq_knowledge_base WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// ============= 满意度评价 =============

export interface SatisfactionRating {
  id: string;
  session_id: string;
  rating: number; // 1-5
  feedback: string | null;
  created_at: string;
}

// 初始化满意度评价表
export function initSatisfactionTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS satisfaction_ratings (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      feedback TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_satisfaction_session ON satisfaction_ratings(session_id);
  `);
}

// 创建满意度评价
export function createSatisfactionRating(rating: SatisfactionRating): SatisfactionRating {
  const stmt = db.prepare(`
    INSERT INTO satisfaction_ratings (id, session_id, rating, feedback, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(rating.id, rating.session_id, rating.rating, rating.feedback, rating.created_at);
  return rating;
}

// 获取会话的满意度评价
export function getSatisfactionBySession(sessionId: string): SatisfactionRating | undefined {
  const stmt = db.prepare('SELECT * FROM satisfaction_ratings WHERE session_id = ?');
  return stmt.get(sessionId) as SatisfactionRating | undefined;
}

// 获取所有满意度统计
export function getSatisfactionStats(): { avgRating: number; totalCount: number; distribution: Record<number, number> } {
  const stmt = db.prepare('SELECT rating, COUNT(*) as count FROM satisfaction_ratings GROUP BY rating');
  const rows = stmt.all() as Array<{ rating: number; count: number }>;

  let totalCount = 0;
  let totalRating = 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const row of rows) {
    totalCount += row.count;
    totalRating += row.rating * row.count;
    distribution[row.rating] = row.count;
  }

  return {
    avgRating: totalCount > 0 ? totalRating / totalCount : 0,
    totalCount,
    distribution
  };
}

// ============= 意图识别日志 =============

export interface IntentLog {
  id: string;
  session_id: string;
  user_message: string;
  detected_intent: string;
  confidence: number;
  created_at: string;
}

// 初始化意图识别日志表
export function initIntentLogTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS intent_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      detected_intent TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_intent_session ON intent_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_intent_type ON intent_logs(detected_intent);
  `);
}

// 记录意图识别
export function createIntentLog(log: IntentLog): IntentLog {
  const stmt = db.prepare(`
    INSERT INTO intent_logs (id, session_id, user_message, detected_intent, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(log.id, log.session_id, log.user_message, log.detected_intent, log.confidence, log.created_at);
  return log;
}

// 获取意图统计
export function getIntentStats(): Array<{ intent: string; count: number }> {
  const stmt = db.prepare('SELECT detected_intent as intent, COUNT(*) as count FROM intent_logs GROUP BY detected_intent ORDER BY count DESC');
  return stmt.all() as Array<{ intent: string; count: number }>;
}

// 初始化所有表
export function initAllTables(): void {
  initFaqTable();
  initSatisfactionTable();
  initIntentLogTable();
}

// 初始化
initAllTables();

export default db;
