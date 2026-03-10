import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get favorites
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();

  try {
    const items = await db.all(`
      SELECT f.*, p.name_en, p.name_zh, p.name_ja, p.name_ko, p.name_ru,
             p.price, p.original_price, p.images, p.status,
             u.name as seller_name
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user!.id]);

    const parsedItems = items.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : []
    }));

    res.json({ items: parsedItems });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add to favorites
router.post('/', authenticate, [
  body('product_id').isInt()
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { product_id } = req.body;
  const db = getDb();

  try {
    // Check product exists
    const product = await db.get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already in favorites
    const existing = await db.get(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user!.id, product_id]
    );

    if (existing) {
      return res.status(400).json({ error: 'Product already in favorites' });
    }

    await db.run(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [req.user!.id, product_id]
    );

    res.status(201).json({ message: 'Added to favorites successfully' });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove from favorites
router.delete('/:productId', authenticate, async (req: AuthRequest, res) => {
  const { productId } = req.params;
  const db = getDb();

  try {
    const result = await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user!.id, productId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Check if product is in favorites
router.get('/check/:productId', authenticate, async (req: AuthRequest, res) => {
  const { productId } = req.params;
  const db = getDb();

  try {
    const favorite = await db.get(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user!.id, productId]
    );

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
});

export default router;
