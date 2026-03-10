import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get cart items
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();

  try {
    const items = await db.all(`
      SELECT c.*, p.name_en, p.name_zh, p.name_ja, p.name_ko, p.name_ru,
             p.price, p.images, p.stock, p.status,
             u.name as seller_name
      FROM cart c
      JOIN products p ON c.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.user!.id]);

    const parsedItems = items.map(item => ({
      ...item,
      images: item.images ? JSON.parse(item.images) : []
    }));

    // Calculate totals
    const totalItems = parsedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      items: parsedItems,
      summary: {
        totalItems,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add to cart
router.post('/', authenticate, [
  body('product_id').isInt(),
  body('quantity').isInt({ min: 1 })
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { product_id, quantity } = req.body;
  const db = getDb();

  try {
    // Check product exists and has stock
    const product = await db.get('SELECT id, stock, status FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ error: 'Product is not available' });
    }

    // Check if already in cart
    const existing = await db.get(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user!.id, product_id]
    );

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock available' });
      }

      await db.run(
        'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existing.id]
      );
    } else {
      if (quantity > product.stock) {
        return res.status(400).json({ error: 'Not enough stock available' });
      }

      await db.run(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user!.id, product_id, quantity]
      );
    }

    res.json({ message: 'Added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update cart item quantity
router.put('/:id', authenticate, [
  body('quantity').isInt({ min: 0 })
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { quantity } = req.body;
  const db = getDb();

  try {
    // Check ownership
    const item = await db.get('SELECT * FROM cart WHERE id = ? AND user_id = ?', [id, req.user!.id]);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (quantity === 0) {
      await db.run('DELETE FROM cart WHERE id = ?', [id]);
      return res.json({ message: 'Item removed from cart' });
    }

    // Check stock
    const product = await db.get('SELECT stock FROM products WHERE id = ?', [item.product_id]);
    if (quantity > product.stock) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    await db.run(
      'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove from cart
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    const result = await db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, req.user!.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Clear cart
router.delete('/', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();

  try {
    await db.run('DELETE FROM cart WHERE user_id = ?', [req.user!.id]);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
