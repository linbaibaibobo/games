import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get user orders
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const db = getDb();
  const { role } = req.query;

  try {
    let orders;
    if (role === 'seller') {
      orders = await db.all(`
        SELECT o.*, u.name as buyer_name, u.email as buyer_email
        FROM orders o
        JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ?
        ORDER BY o.created_at DESC
      `, [req.user!.id]);
    } else {
      orders = await db.all(`
        SELECT o.*, u.name as seller_name
        FROM orders o
        JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC
      `, [req.user!.id]);
    }

    // Get order items for each order
    for (const order of orders) {
      const items = await db.all(`
        SELECT oi.*, p.name_en, p.name_zh, p.name_ja, p.name_ko, p.name_ru
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    const order = await db.get(`
      SELECT o.*, u.name as buyer_name, u.email as buyer_email, u.phone as buyer_phone
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.id = ? AND (o.buyer_id = ? OR o.seller_id = ?)
    `, [id, req.user!.id, req.user!.id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db.all(`
      SELECT oi.*, p.name_en, p.name_zh, p.name_ja, p.name_ko, p.name_ru
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order from cart
router.post('/', authenticate, [
  body('shipping_address').trim().isLength({ min: 5 }),
  body('shipping_name').trim().isLength({ min: 2 }),
  body('shipping_phone').trim().isLength({ min: 5 })
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { shipping_address, shipping_name, shipping_phone, cart_item_ids } = req.body;
  const db = getDb();

  try {
    // Get cart items
    let cartItemsQuery = 'SELECT c.*, p.* FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?';
    let params = [req.user!.id];

    if (cart_item_ids && cart_item_ids.length > 0) {
      cartItemsQuery += ` AND c.id IN (${cart_item_ids.map(() => '?').join(',')})`;
      params = [...params, ...cart_item_ids];
    }

    const cartItems = await db.all(cartItemsQuery, params);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Group items by seller
    const itemsBySeller: { [key: number]: typeof cartItems } = {};
    for (const item of cartItems) {
      if (!itemsBySeller[item.seller_id]) {
        itemsBySeller[item.seller_id] = [];
      }
      itemsBySeller[item.seller_id].push(item);
    }

    const orders = [];

    // Create order for each seller
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderNumber = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;

      // Create order
      const orderResult = await db.run(`
        INSERT INTO orders (order_number, buyer_id, seller_id, total_amount, shipping_address, shipping_name, shipping_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderNumber, req.user!.id, parseInt(sellerId), totalAmount, shipping_address, shipping_name, shipping_phone]);

      const orderId = orderResult.lastID;

      // Create order items
      for (const item of items) {
        await db.run(`
          INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id,
          item.name_en,
          item.images ? JSON.parse(item.images)[0] : null,
          item.price,
          item.quantity
        ]);

        // Update product stock
        await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);

        // Remove from cart
        await db.run('DELETE FROM cart WHERE id = ?', [item.id]);
      }

      const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      orders.push(order);
    }

    res.status(201).json({ message: 'Order created successfully', orders });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (seller only)
router.put('/:id/status', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDb();

  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only seller or admin can update status
    if (order.seller_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (buyer only)
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = getDb();

  try {
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    // Restore stock
    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await db.run('UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
