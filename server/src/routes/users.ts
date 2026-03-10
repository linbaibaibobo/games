import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();

  try {
    const user = await db.get(
      'SELECT id, email, name, avatar, role, phone, address, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().trim(),
  body('address').optional().trim()
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, phone, address, avatar } = req.body;
  const db = getDb();

  try {
    await db.run(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        avatar = COALESCE(?, avatar),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, phone, address, avatar, req.user!.id]);

    const user = await db.get(
      'SELECT id, email, name, avatar, role, phone, address FROM users WHERE id = ?',
      [req.user!.id]
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticate, [
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 6 })
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;
  const db = getDb();

  try {
    const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user!.id]);

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user!.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user stats (for sellers)
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();

  try {
    // Product stats
    const productStats = await db.get(`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN status = 'sold_out' THEN 1 ELSE 0 END) as sold_out_products
      FROM products
      WHERE seller_id = ?
    `, [req.user!.id]);

    // Order stats
    const orderStats = await db.get(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE seller_id = ?
    `, [req.user!.id]);

    res.json({
      products: productStats,
      orders: orderStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
