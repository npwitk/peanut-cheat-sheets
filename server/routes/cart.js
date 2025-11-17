const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get cart items with cheat sheet details
    const cartItems = await db.query(
      `SELECT
        c.cart_id,
        c.cheatsheet_id,
        c.added_at,
        cs.title,
        cs.course_code,
        cs.description,
        cs.price,
        cs.preview_image_path
      FROM cart c
      JOIN cheat_sheets cs ON c.cheatsheet_id = cs.cheatsheet_id
      WHERE c.user_id = ? AND cs.is_active = TRUE
      ORDER BY c.added_at DESC`,
      [userId]
    );

    // Calculate totals and potential bundle discount
    const itemCount = cartItems.length;
    let subtotal = 0;
    let discountPercentage = 0;

    cartItems.forEach(item => {
      subtotal += parseFloat(item.price);
    });

    // Get applicable bundle discount
    if (itemCount >= 2) {
      const discount = await db.queryOne(
        `SELECT discount_percentage
         FROM bundle_discounts
         WHERE min_items <= ? AND is_active = TRUE
         ORDER BY min_items DESC
         LIMIT 1`,
        [itemCount]
      );

      if (discount) {
        discountPercentage = parseFloat(discount.discount_percentage);
      }
    }

    const discountAmount = (subtotal * discountPercentage) / 100;
    const total = subtotal - discountAmount;

    res.json({
      cart_items: cartItems,
      summary: {
        item_count: itemCount,
        subtotal: subtotal.toFixed(2),
        discount_percentage: discountPercentage,
        discount_amount: discountAmount.toFixed(2),
        total: total.toFixed(2),
        is_bundle: itemCount >= 2
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'Failed to get cart',
      message: error.message
    });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { cheatsheet_id } = req.body;

    if (!cheatsheet_id) {
      return res.status(400).json({
        error: 'Missing cheatsheet_id',
        message: 'Please provide a cheatsheet_id'
      });
    }

    // Use stored procedure to add to cart with validation
    const result = await db.query(
      `CALL AddToCart(?, ?, @success, @message)`,
      [userId, cheatsheet_id]
    );

    // Get output variables
    const output = await db.queryOne('SELECT @success as success, @message as message');

    // Get updated cart count
    const countResult = await db.queryOne(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    // Check if item was already in cart (success but with specific message)
    if (output.success && output.message === 'Item already in cart') {
      return res.status(200).json({
        success: true,
        message: output.message,
        cart_count: countResult.count,
        already_in_cart: true
      });
    }

    if (!output.success) {
      return res.status(400).json({
        error: 'Cannot add to cart',
        message: output.message
      });
    }

    res.json({
      success: true,
      message: output.message,
      cart_count: countResult.count,
      already_in_cart: false
    });
  } catch (error) {
    console.error('Add to cart error:', error);

    // Handle duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'Item already in cart',
        message: 'This cheat sheet is already in your cart'
      });
    }

    res.status(500).json({
      error: 'Failed to add to cart',
      message: error.message
    });
  }
});

// Remove item from cart
router.delete('/:cart_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { cart_id } = req.params;

    // Verify cart item belongs to user
    const cartItem = await db.queryOne(
      'SELECT * FROM cart WHERE cart_id = ? AND user_id = ?',
      [cart_id, userId]
    );

    if (!cartItem) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'This item is not in your cart'
      });
    }

    // Delete cart item
    await db.delete('DELETE FROM cart WHERE cart_id = ?', [cart_id]);

    // Get updated cart count
    const countResult = await db.queryOne(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart_count: countResult.count
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: 'Failed to remove from cart',
      message: error.message
    });
  }
});

// Clear entire cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    await db.delete('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Cart cleared',
      cart_count: 0
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'Failed to clear cart',
      message: error.message
    });
  }
});

// Get cart count (for navbar badge)
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await db.queryOne(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );

    res.json({
      count: result.count || 0
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      error: 'Failed to get cart count',
      message: error.message
    });
  }
});

// Checkout: Create order from cart
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Generate unique bundle order ID
    const bundleOrderId = `ORDER-${Date.now()}-${userId}`;

    // Use stored procedure to create order from cart
    await db.query(
      `CALL CreateOrderFromCart(?, ?, @total_amount, @item_count)`,
      [userId, bundleOrderId]
    );

    // Get output variables
    const output = await db.queryOne(
      'SELECT @total_amount as total_amount, @item_count as item_count'
    );

    if (!output.item_count || output.item_count === 0) {
      return res.status(400).json({
        error: 'Empty cart',
        message: 'Your cart is empty or all items have already been purchased. Please check your library for purchased items.'
      });
    }

    // Get the created purchase records
    const purchases = await db.query(
      `SELECT
        p.order_id,
        p.bundle_order_id,
        p.cheatsheet_id,
        p.payment_amount,
        p.original_price,
        p.discount_amount,
        p.is_bundle,
        cs.title,
        cs.course_code
      FROM purchases p
      JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
      WHERE p.bundle_order_id = ?`,
      [bundleOrderId]
    );

    res.json({
      success: true,
      message: 'Order created successfully',
      bundle_order_id: bundleOrderId,
      total_amount: parseFloat(output.total_amount).toFixed(2),
      item_count: output.item_count,
      items: purchases,
      is_bundle: output.item_count >= 2
    });
  } catch (error) {
    console.error('Checkout error:', error);

    // Handle duplicate purchase error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'Duplicate purchase',
        message: 'You already own one or more items in your cart'
      });
    }

    res.status(500).json({
      error: 'Checkout failed',
      message: error.message
    });
  }
});

module.exports = router;
