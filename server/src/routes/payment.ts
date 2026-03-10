import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Payment methods configuration
const PAYMENT_METHODS = {
  visa: {
    name: 'Visa/Mastercard',
    icon: 'credit-card',
    supported: true
  },
  wechat: {
    name: 'WeChat Pay',
    icon: 'message-circle',
    supported: true
  },
  alipay: {
    name: 'Alipay',
    icon: 'wallet',
    supported: true
  },
  applepay: {
    name: 'Apple Pay',
    icon: 'apple',
    supported: true
  }
};

// Get available payment methods
router.get('/methods', async (req, res) => {
  res.json({ methods: PAYMENT_METHODS });
});

// Process payment (simulation)
router.post('/process', authenticate, [
  body('order_id').isInt(),
  body('payment_method').isIn(['visa', 'wechat', 'alipay', 'applepay']),
  body('payment_details').optional()
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { order_id, payment_method, payment_details } = req.body;
  const db = getDb();

  try {
    // Get order
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND buyer_id = ?', [order_id, req.user!.id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Simulate payment processing
    const paymentResult = await simulatePayment(payment_method, order.total_amount, payment_details);

    if (paymentResult.success) {
      // Update order
      await db.run(`
        UPDATE orders SET
          payment_method = ?,
          payment_status = 'paid',
          status = 'paid',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [payment_method, order_id]);

      res.json({
        success: true,
        message: 'Payment processed successfully',
        transaction_id: paymentResult.transaction_id
      });
    } else {
      await db.run('UPDATE orders SET payment_status = "failed", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [order_id]);

      res.status(400).json({
        success: false,
        error: paymentResult.error || 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Simulate payment processing
async function simulatePayment(method: string, amount: number, details: any) {
  // In a real application, this would integrate with actual payment gateways
  // For demo purposes, we simulate a successful payment 90% of the time

  return new Promise<{ success: boolean; transaction_id?: string; error?: string }>((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        resolve({
          success: true,
          transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      } else {
        resolve({
          success: false,
          error: 'Payment declined. Please try again or use a different payment method.'
        });
      }
    }, 1000); // Simulate network delay
  });
}

// Get payment status
router.get('/status/:orderId', authenticate, async (req: AuthRequest, res) => {
  const { orderId } = req.params;
  const db = getDb();

  try {
    const order = await db.get(
      'SELECT id, payment_status, payment_method, status FROM orders WHERE id = ? AND buyer_id = ?',
      [orderId, req.user!.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ payment: order });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

export default router;
