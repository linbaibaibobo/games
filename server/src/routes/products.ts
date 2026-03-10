import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { getDb } from '../database';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all products with filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isInt(),
  query('search').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'popular'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const category = req.query.category as string;
  const search = req.query.search as string;
  const minPrice = req.query.minPrice as string;
  const maxPrice = req.query.maxPrice as string;
  const sort = req.query.sort as string;

  const db = getDb();

  try {
    let whereClause = 'WHERE p.status = "active"';
    const params: any[] = [];

    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.name_en LIKE ? OR p.name_zh LIKE ? OR p.name_ja LIKE ? OR p.name_ko LIKE ? OR p.name_ru LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (minPrice) {
      whereClause += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      whereClause += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    let orderClause = 'ORDER BY p.created_at DESC';
    switch (sort) {
      case 'price_asc':
        orderClause = 'ORDER BY p.price ASC';
        break;
      case 'price_desc':
        orderClause = 'ORDER BY p.price DESC';
        break;
      case 'popular':
        orderClause = 'ORDER BY p.view_count DESC';
        break;
    }

    const countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const { total } = await db.get(countQuery, params);

    const productsQuery = `
      SELECT p.*, u.name as seller_name, u.avatar as seller_avatar,
             c.name_en as category_name_en, c.name_zh as category_name_zh,
             c.name_ja as category_name_ja, c.name_ko as category_name_ko, c.name_ru as category_name_ru
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const products = await db.all(productsQuery, [...params, limit, offset]);

    // Parse images JSON
    const parsedProducts = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    }));

    res.json({
      products: parsedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    const product = await db.get(`
      SELECT p.*, u.name as seller_name, u.avatar as seller_avatar,
             c.name_en as category_name_en, c.name_zh as category_name_zh,
             c.name_ja as category_name_ja, c.name_ko as category_name_ko, c.name_ru as category_name_ru
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment view count
    await db.run('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);

    product.images = product.images ? JSON.parse(product.images) : [];

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (seller only)
router.post('/',
  authenticate,
  requireRole(['seller', 'admin']),
  upload.array('images', 5),
  [
    body('name_en').trim().isLength({ min: 2 }),
    body('name_zh').trim().isLength({ min: 2 }),
    body('price').isFloat({ min: 0 }),
    body('stock').isInt({ min: 0 }),
    body('category_id').optional().isInt()
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const files = req.files as Express.Multer.File[];
    const images = files ? files.map(f => `/uploads/${f.filename}`) : [];

    const {
      name_en, name_zh, name_ja, name_ko, name_ru,
      description_en, description_zh, description_ja, description_ko, description_ru,
      price, original_price, stock, category_id
    } = req.body;

    try {
      const result = await db.run(`
        INSERT INTO products (
          seller_id, category_id,
          name_en, name_zh, name_ja, name_ko, name_ru,
          description_en, description_zh, description_ja, description_ko, description_ru,
          price, original_price, stock, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.user!.id, category_id || null,
        name_en, name_zh, name_ja || name_en, name_ko || name_en, name_ru || name_en,
        description_en, description_zh, description_ja || description_en,
        description_ko || description_en, description_ru || description_en,
        price, original_price || null, stock, JSON.stringify(images)
      ]);

      const product = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
      product.images = JSON.parse(product.images || '[]');

      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product (seller only)
router.put('/:id',
  authenticate,
  requireRole(['seller', 'admin']),
  upload.array('images', 5),
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const db = getDb();

    try {
      // Check ownership
      const existing = await db.get('SELECT seller_id FROM products WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (existing.seller_id !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const files = req.files as Express.Multer.File[];
      const newImages = files ? files.map(f => `/uploads/${f.filename}`) : [];

      const {
        name_en, name_zh, name_ja, name_ko, name_ru,
        description_en, description_zh, description_ja, description_ko, description_ru,
        price, original_price, stock, category_id, status, keep_images
      } = req.body;

      // Merge images
      let images = newImages;
      if (keep_images) {
        const keptImages = JSON.parse(keep_images);
        images = [...keptImages, ...newImages];
      }

      await db.run(`
        UPDATE products SET
          name_en = COALESCE(?, name_en),
          name_zh = COALESCE(?, name_zh),
          name_ja = COALESCE(?, name_ja),
          name_ko = COALESCE(?, name_ko),
          name_ru = COALESCE(?, name_ru),
          description_en = COALESCE(?, description_en),
          description_zh = COALESCE(?, description_zh),
          description_ja = COALESCE(?, description_ja),
          description_ko = COALESCE(?, description_ko),
          description_ru = COALESCE(?, description_ru),
          price = COALESCE(?, price),
          original_price = COALESCE(?, original_price),
          stock = COALESCE(?, stock),
          category_id = COALESCE(?, category_id),
          status = COALESCE(?, status),
          images = COALESCE(?, images),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name_en, name_zh, name_ja, name_ko, name_ru,
        description_en, description_zh, description_ja, description_ko, description_ru,
        price, original_price, stock, category_id, status,
        images.length > 0 ? JSON.stringify(images) : null,
        id
      ]);

      const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
      product.images = JSON.parse(product.images || '[]');

      res.json({ message: 'Product updated successfully', product });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// Delete product (seller only)
router.delete('/:id', authenticate, requireRole(['seller', 'admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    const existing = await db.get('SELECT seller_id FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.seller_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.run('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get seller's products
router.get('/seller/my-products', authenticate, requireRole(['seller', 'admin']), async (req: AuthRequest, res) => {
  const db = getDb();

  try {
    const products = await db.all(`
      SELECT p.*, c.name_en as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC
    `, [req.user!.id]);

    const parsedProducts = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    }));

    res.json({ products: parsedProducts });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  const db = getDb();

  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY sort_order');
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
