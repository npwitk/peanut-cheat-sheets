const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { generatePromptPayQR } = require('../services/promptpay');
const db = require('../config/database');

const router = express.Router();

/**
 * Create a purchase order with PromptPay QR code
 * POST /api/payments/create
 * Body: { cheatsheet_id }
 */
router.post('/create', authenticateToken, async (req, res) => {
  const { cheatsheet_id } = req.body;
  const userId = req.user.user_id;

  try {
    // Validate input
    if (!cheatsheet_id) {
      return res.status(400).json({
        error: 'Missing cheatsheet_id',
        message: 'Please provide a cheatsheet ID'
      });
    }

    // Check if cheat sheet exists
    const cheatSheet = await db.queryOne(
      'SELECT * FROM cheat_sheets WHERE cheatsheet_id = ? AND is_active = TRUE',
      [cheatsheet_id]
    );

    if (!cheatSheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The requested cheat sheet does not exist or is not available'
      });
    }

    // Check if user already purchased this cheat sheet
    const existingPurchase = await db.queryOne(
      'SELECT * FROM purchases WHERE user_id = ? AND cheatsheet_id = ?',
      [userId, cheatsheet_id]
    );

    if (existingPurchase) {
      // Already paid - cannot purchase again
      if (existingPurchase.payment_status === 'paid') {
        return res.status(400).json({
          error: 'Already purchased',
          message: 'You have already purchased this cheat sheet',
          purchase: existingPurchase
        });
      }

      // Payment pending - return existing QR code
      if (existingPurchase.payment_status === 'pending') {
        return res.status(200).json({
          message: 'Payment already pending. Use the existing QR code.',
          purchase: {
            order_id: existingPurchase.order_id,
            cheatsheet_id: existingPurchase.cheatsheet_id,
            title: cheatSheet.title,
            course_code: cheatSheet.course_code,
            amount: existingPurchase.payment_amount,
            status: existingPurchase.payment_status,
            qr_code: existingPurchase.qr_code_data,
            created_at: existingPurchase.purchase_date
          },
          instructions: {
            step1: 'Open your banking app',
            step2: 'Scan the QR code to pay via PromptPay',
            step3: `Pay exactly ${parseFloat(existingPurchase.payment_amount).toFixed(2)} THB`,
            step4: 'Wait for admin approval (usually within 24 hours)',
            step5: 'You will receive email notification when approved'
          }
        });
      }

      // Payment failed or refunded - delete old record and create new one
      if (existingPurchase.payment_status === 'failed' || existingPurchase.payment_status === 'refunded') {
        console.log(`Deleting ${existingPurchase.payment_status} purchase order #${existingPurchase.order_id} for retry`);
        await db.delete(
          'DELETE FROM purchases WHERE order_id = ?',
          [existingPurchase.order_id]
        );
      }
    }

    // Generate PromptPay QR code
    const promptpayPhone = process.env.PROMPTPAY_PHONE_NUMBER || '0956388462'; // Your PromptPay number
    const price = parseFloat(cheatSheet.price);
    const qrCodeDataURL = await generatePromptPayQR(promptpayPhone, price);

    // Create purchase order with pending status
    const orderId = await db.insert(
      `INSERT INTO purchases
       (user_id, cheatsheet_id, payment_status, payment_method, payment_amount, qr_code_data)
       VALUES (?, ?, 'pending', 'promptpay', ?, ?)`,
      [userId, cheatsheet_id, price, qrCodeDataURL]
    );

    // Get the created purchase
    const purchase = await db.queryOne(
      `SELECT p.*, cs.title, cs.course_code, cs.price
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.order_id = ?`,
      [orderId]
    );

    res.status(201).json({
      message: 'Payment order created successfully',
      purchase: {
        order_id: purchase.order_id,
        cheatsheet_id: purchase.cheatsheet_id,
        title: purchase.title,
        course_code: purchase.course_code,
        amount: purchase.payment_amount,
        status: purchase.payment_status,
        qr_code: purchase.qr_code_data,
        created_at: purchase.purchase_date
      },
      instructions: {
        step1: 'Open your banking app',
        step2: 'Scan the QR code to pay via PromptPay',
        step3: `Pay exactly ${price.toFixed(2)} THB`,
        step4: 'Wait for admin approval (usually within 24 hours)',
        step5: 'You will receive email notification when approved'
      }
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      cheatsheet_id,
      userId,
      message: error.message
    });
    res.status(500).json({
      error: 'Payment creation failed',
      message: error.message || 'Failed to create payment order. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Check payment status
 * GET /api/payments/status/:orderId
 */
router.get('/status/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.user_id;

  try {
    const purchase = await db.queryOne(
      `SELECT p.*, cs.title, cs.course_code
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.order_id = ? AND p.user_id = ?`,
      [orderId, userId]
    );

    if (!purchase) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Purchase order not found'
      });
    }

    res.json({
      order_id: purchase.order_id,
      title: purchase.title,
      course_code: purchase.course_code,
      amount: purchase.payment_amount,
      status: purchase.payment_status,
      purchase_date: purchase.purchase_date,
      payment_completed_at: purchase.payment_completed_at
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      error: 'Failed to check status',
      message: 'Could not retrieve payment status'
    });
  }
});

/**
 * Create a bundle payment order with PromptPay QR code
 * POST /api/payments/create-bundle
 * Body: { bundle_order_id } (from cart checkout)
 */
router.post('/create-bundle', authenticateToken, async (req, res) => {
  const { bundle_order_id } = req.body;
  const userId = req.user.user_id;

  try {
    // Validate input
    if (!bundle_order_id) {
      return res.status(400).json({
        error: 'Missing bundle_order_id',
        message: 'Please provide a bundle order ID'
      });
    }

    // Get all purchases in this bundle
    const purchases = await db.query(
      `SELECT p.*, cs.title, cs.course_code
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.bundle_order_id = ? AND p.user_id = ?`,
      [bundle_order_id, userId]
    );

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({
        error: 'Bundle order not found',
        message: 'The bundle order does not exist or does not belong to you'
      });
    }

    // Check if already paid
    const paidPurchase = purchases.find(p => p.payment_status === 'paid');
    if (paidPurchase) {
      return res.status(400).json({
        error: 'Already purchased',
        message: 'This bundle has already been paid for'
      });
    }

    // Check if payment is pending
    const pendingPurchase = purchases.find(p => p.payment_status === 'pending' && p.qr_code_data);
    if (pendingPurchase) {
      // Calculate total
      const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);

      return res.status(200).json({
        message: 'Payment already pending. Use the existing QR code.',
        bundle: {
          bundle_order_id: bundle_order_id,
          total_amount: totalAmount.toFixed(2),
          item_count: purchases.length,
          status: 'pending',
          qr_code: pendingPurchase.qr_code_data,
          items: purchases.map(p => ({
            title: p.title,
            course_code: p.course_code,
            price: parseFloat(p.payment_amount).toFixed(2)
          }))
        },
        instructions: {
          step1: 'Open your banking app',
          step2: 'Scan the QR code to pay via PromptPay',
          step3: `Pay exactly ${totalAmount.toFixed(2)} THB`,
          step4: 'Wait for admin approval (usually within 24 hours)',
          step5: 'You will receive email notification when approved'
        }
      });
    }

    // Calculate total amount
    const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);

    // Generate PromptPay QR code for total amount
    const promptpayPhone = process.env.PROMPTPAY_PHONE_NUMBER || '0812345678';
    const qrCodeDataURL = await generatePromptPayQR(promptpayPhone, totalAmount);

    // Update all purchases in bundle with QR code
    await db.update(
      `UPDATE purchases
       SET qr_code_data = ?
       WHERE bundle_order_id = ? AND user_id = ?`,
      [qrCodeDataURL, bundle_order_id, userId]
    );

    res.status(201).json({
      message: 'Bundle payment order created successfully',
      bundle: {
        bundle_order_id: bundle_order_id,
        total_amount: totalAmount.toFixed(2),
        item_count: purchases.length,
        is_bundle: purchases.length >= 2,
        discount_applied: purchases[0].discount_amount > 0,
        status: 'pending',
        qr_code: qrCodeDataURL,
        items: purchases.map(p => ({
          order_id: p.order_id,
          title: p.title,
          course_code: p.course_code,
          original_price: parseFloat(p.original_price || p.payment_amount).toFixed(2),
          discount: parseFloat(p.discount_amount || 0).toFixed(2),
          final_price: parseFloat(p.payment_amount).toFixed(2)
        }))
      },
      instructions: {
        step1: 'Open your banking app',
        step2: 'Scan the QR code to pay via PromptPay',
        step3: `Pay exactly ${totalAmount.toFixed(2)} THB`,
        step4: 'Wait for admin approval (usually within 24 hours)',
        step5: 'You will receive email notification when approved'
      }
    });

  } catch (error) {
    console.error('Bundle payment creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Bundle payment creation failed',
      message: error.message || 'Failed to create bundle payment order. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Check bundle payment status
 * GET /api/payments/bundle-status/:bundleOrderId
 */
router.get('/bundle-status/:bundleOrderId', authenticateToken, async (req, res) => {
  const { bundleOrderId } = req.params;
  const userId = req.user.user_id;

  try {
    const purchases = await db.query(
      `SELECT p.*, cs.title, cs.course_code
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.bundle_order_id = ? AND p.user_id = ?`,
      [bundleOrderId, userId]
    );

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({
        error: 'Bundle order not found',
        message: 'Bundle order not found'
      });
    }

    const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.payment_amount), 0);
    const status = purchases[0].payment_status; // All items in bundle have same status

    res.json({
      bundle_order_id: bundleOrderId,
      total_amount: totalAmount.toFixed(2),
      item_count: purchases.length,
      status: status,
      purchase_date: purchases[0].purchase_date,
      payment_completed_at: purchases[0].payment_completed_at,
      items: purchases.map(p => ({
        order_id: p.order_id,
        title: p.title,
        course_code: p.course_code,
        amount: parseFloat(p.payment_amount).toFixed(2)
      }))
    });

  } catch (error) {
    console.error('Bundle payment status check error:', error);
    res.status(500).json({
      error: 'Failed to check status',
      message: 'Could not retrieve bundle payment status'
    });
  }
});

module.exports = router;
