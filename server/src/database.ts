import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initializeDatabase() {
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'global_shop.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create tables
  await createTables();
  console.log('Database initialized successfully');
  return db;
}

async function createTables() {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
      phone TEXT,
      address TEXT,
      is_verified BOOLEAN DEFAULT 0,
      verification_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      name_ja TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      category_id INTEGER,
      name_en TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      name_ja TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      name_ru TEXT NOT NULL,
      description_en TEXT,
      description_zh TEXT,
      description_ja TEXT,
      description_ko TEXT,
      description_ru TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      images TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
      featured BOOLEAN DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Cart table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    )
  `);

  // Favorites table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    )
  `);

  // Orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      shipping_address TEXT NOT NULL,
      shipping_name TEXT NOT NULL,
      shipping_phone TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    )
  `);

  // Order items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Insert default categories
  const categories = [
    { name_en: 'Electronics', name_zh: '电子产品', name_ja: '電子機器', name_ko: '전자제품', name_ru: 'Электроника', icon: 'laptop' },
    { name_en: 'Clothing', name_zh: '服装', name_ja: '衣類', name_ko: '의류', name_ru: 'Одежда', icon: 'shirt' },
    { name_en: 'Home & Garden', name_zh: '家居园艺', name_ja: 'ホーム＆ガーデン', name_ko: '홈＆가든', name_ru: 'Дом и сад', icon: 'home' },
    { name_en: 'Beauty & Health', name_zh: '美妆健康', name_ja: '美容＆健康', name_ko: '뷰티＆헬스', name_ru: 'Красота и здоровье', icon: 'heart' },
    { name_en: 'Sports', name_zh: '运动户外', name_ja: 'スポーツ', name_ko: '스포츠', name_ru: 'Спорт', icon: 'activity' },
    { name_en: 'Toys & Games', name_zh: '玩具游戏', name_ja: 'おもちゃ＆ゲーム', name_ko: '장난감＆게임', name_ru: 'Игрушки и игры', icon: 'gamepad' },
    { name_en: 'Food & Beverages', name_zh: '食品饮料', name_ja: '食品＆飲料', name_ko: '식음료', name_ru: 'Еда и напитки', icon: 'coffee' },
    { name_en: 'Jewelry & Accessories', name_zh: '珠宝配饰', name_ja: 'ジュエリー＆アクセサリー', name_ko: '주얼리＆액세서리', name_ru: 'Украшения и аксессуары', icon: 'gem' }
  ];

  for (const cat of categories) {
    await db.run(`
      INSERT OR IGNORE INTO categories (name_en, name_zh, name_ja, name_ko, name_ru, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [cat.name_en, cat.name_zh, cat.name_ja, cat.name_ko, cat.name_ru, cat.icon]);
  }
}

export function getDb() {
  return db;
}
