const express = require('express');
const { requireAdmin, requireStaff } = require('../middleware/auth');
const db = require('../config/database');
const { deleteFromGCS, fileExists } = require('../config/storage');

const router = express.Router();

// All routes require admin authentication (applied in index.js)

/**
 * Get all pending payments for approval
 * GET /api/admin/payments/pending
 */
router.get('/payments/pending', requireStaff, async (req, res) => {
  try {
    const pendingPayments = await db.query(
      `SELECT
        p.order_id,
        p.user_id,
        p.cheatsheet_id,
        p.payment_amount,
        p.purchase_date,
        p.qr_code_data,
        u.name as user_name,
        u.email as user_email,
        cs.title as cheatsheet_title,
        cs.course_code
       FROM purchases p
       JOIN users u ON p.user_id = u.user_id
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.payment_status = 'pending'
       ORDER BY p.purchase_date DESC`
    );

    res.json({
      count: pendingPayments.length,
      payments: pendingPayments
    });

  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      error: 'Failed to fetch payments',
      message: 'Could not retrieve pending payments'
    });
  }
});

/**
 * Approve a payment
 * POST /api/admin/payments/:orderId/approve
 */
router.post('/payments/:orderId/approve', requireStaff, async (req, res) => {
  const { orderId } = req.params;
  const { payment_id } = req.body; // Optional reference number from bank transfer

  let connection;
  try {
    console.log(`Approving payment for order ${orderId}...`);

    // Start transaction
    connection = await db.beginTransaction();
    console.log(`Transaction started`);

    // Get purchase details
    const purchase = await db.queryOne(
      'SELECT * FROM purchases WHERE order_id = ?',
      [orderId]
    );

    if (!purchase) {
      console.log(`Purchase ${orderId} not found`);
      await db.rollback(connection);
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The specified purchase order does not exist'
      });
    }

    console.log(`Purchase found: ${purchase.cheatsheet_id}, status: ${purchase.payment_status}`);

    if (purchase.payment_status === 'paid') {
      console.log(`Purchase ${orderId} already paid`);
      await db.rollback(connection);
      return res.status(400).json({
        error: 'Already approved',
        message: 'This payment has already been approved'
      });
    }

    // Update purchase status using the stored procedure
    const paymentRef = payment_id || `ADMIN_APPROVED_${Date.now()}`;
    console.log(`Calling CompleteSinglePurchase(${orderId}, ${paymentRef})...`);

    await connection.query(
      'CALL CompleteSinglePurchase(?, ?)',
      [orderId, paymentRef]
    );

    console.log(`Stored procedure executed successfully`);

    // Commit transaction
    await db.commit(connection);
    console.log(`Transaction committed`);

    // Get updated purchase
    const updatedPurchase = await db.queryOne(
      `SELECT p.*, u.name, u.email, cs.title
       FROM purchases p
       JOIN users u ON p.user_id = u.user_id
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.order_id = ?`,
      [orderId]
    );

    console.log(`Payment approved successfully for order ${orderId}`);

    res.json({
      message: 'Payment approved successfully',
      purchase: updatedPurchase
    });

  } catch (error) {
    if (connection) {
      await db.rollback(connection);
      console.log(`↩Transaction rolled back`);
    }
    console.error('Payment approval error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({
      error: 'Approval failed',
      message: error.sqlMessage || error.message || 'Failed to approve payment. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Reject a payment
 * POST /api/admin/payments/:orderId/reject
 */
router.post('/payments/:orderId/reject', requireStaff, async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  try {
    const purchase = await db.queryOne(
      'SELECT * FROM purchases WHERE order_id = ?',
      [orderId]
    );

    if (!purchase) {
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The specified purchase order does not exist'
      });
    }

    // Update status to failed
    await db.update(
      'UPDATE purchases SET payment_status = ? WHERE order_id = ?',
      ['failed', orderId]
    );

    res.json({
      message: 'Payment rejected',
      order_id: orderId,
      reason: reason || 'Rejected by admin'
    });

  } catch (error) {
    console.error('Payment rejection error:', error);
    res.status(500).json({
      error: 'Rejection failed',
      message: 'Failed to reject payment. Please try again.'
    });
  }
});

/**
 * Get all purchases (for admin overview)
 * GET /api/admin/purchases
 */
router.get('/purchases', requireAdmin, async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT
        p.*,
        u.name as user_name,
        u.email as user_email,
        cs.title as cheatsheet_title,
        cs.course_code
      FROM purchases p
      JOIN users u ON p.user_id = u.user_id
      JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
    `;

    const params = [];

    if (status) {
      query += ' WHERE p.payment_status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.purchase_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const purchases = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM purchases';
    if (status) {
      countQuery += ' WHERE payment_status = ?';
    }
    const countResult = await db.queryOne(countQuery, status ? [status] : []);

    res.json({
      total: countResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      purchases
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      error: 'Failed to fetch purchases',
      message: 'Could not retrieve purchase data'
    });
  }
});

/**
 * Get all users
 * GET /api/admin/users
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    const safeLimit = Math.max(1, Math.min(1000, parseInt(limit) || 50));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const users = await db.query(
      `SELECT
        u.user_id,
        u.name,
        u.email,
        u.avatar_url,
        u.is_admin,
        u.is_seller,
        u.is_staff,
        u.is_deactivated,
        u.deactivated_at,
        u.created_at,
        COUNT(DISTINCT p.order_id) as total_purchases,
        COUNT(DISTINCT cs.cheatsheet_id) as total_uploads,
        SUM(CASE WHEN p.payment_status = 'paid' THEN p.payment_amount ELSE 0 END) as total_spent
       FROM users u
       LEFT JOIN purchases p ON u.user_id = p.user_id
       LEFT JOIN cheat_sheets cs ON u.user_id = cs.created_by
       ${whereClause}
       GROUP BY u.user_id
       ORDER BY u.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    // Get total count
    const countResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    res.json({
      users,
      total: countResult.total,
      limit: safeLimit,
      offset: safeOffset
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'Could not retrieve user data'
    });
  }
});

/**
 * Update user roles (admin only)
 * PATCH /api/admin/users/:userId/roles
 */
router.patch('/users/:userId/roles', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_admin, is_seller, is_staff } = req.body;

    // Prevent admins from removing their own admin role
    if (parseInt(userId) === req.user.user_id && is_admin === false) {
      return res.status(400).json({
        error: 'Cannot remove own admin role',
        message: 'You cannot remove your own admin privileges'
      });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (typeof is_admin === 'boolean') {
      updates.push('is_admin = ?');
      params.push(is_admin);
    }
    if (typeof is_seller === 'boolean') {
      updates.push('is_seller = ?');
      params.push(is_seller);
    }
    if (typeof is_staff === 'boolean') {
      updates.push('is_staff = ?');
      params.push(is_staff);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one role to update (is_admin, is_seller, is_staff)'
      });
    }

    params.push(userId);

    await db.update(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    // Get updated user data
    const updatedUser = await db.queryOne(
      'SELECT user_id, name, email, is_admin, is_seller, is_staff FROM users WHERE user_id = ?',
      [userId]
    );

    res.json({
      message: 'User roles updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user roles error:', error);
    res.status(500).json({
      error: 'Failed to update roles',
      message: 'Could not update user roles'
    });
  }
});

/**
 * Get statistics for admin dashboard
 * GET /api/admin/stats
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Get total users from users table
    const userCount = await db.queryOne('SELECT COUNT(*) as total_users FROM users');

    // Get other stats from purchases and cheat_sheets
    const purchaseStats = await db.queryOne(`
      SELECT
        COUNT(DISTINCT cheatsheet_id) as total_cheatsheets,
        COUNT(*) as total_purchases,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as completed_purchases,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_purchases,
        SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END) as total_revenue
      FROM purchases
    `);

    // Get total cheat sheets count (actual count from cheat_sheets table)
    const cheatsheetCount = await db.queryOne('SELECT COUNT(*) as total FROM cheat_sheets');

    const stats = {
      total_users: userCount.total_users,
      total_cheatsheets: cheatsheetCount.total,
      total_purchases: purchaseStats.total_purchases,
      completed_purchases: purchaseStats.completed_purchases,
      pending_purchases: purchaseStats.pending_purchases,
      total_revenue: purchaseStats.total_revenue || 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'Could not retrieve admin statistics'
    });
  }
});

/**
 * Clear all cheat sheets (database + GCS files)
 * DELETE /api/admin/cheatsheets/clear-all
 * DANGER: This will delete ALL cheat sheets and their files from GCS
 */
router.delete('/cheatsheets/clear-all', requireAdmin, async (req, res) => {
  const { confirm } = req.body;

  // Safety check - require explicit confirmation
  if (confirm !== 'DELETE_ALL_CHEATSHEETS') {
    return res.status(400).json({
      error: 'Confirmation required',
      message: 'Please send { "confirm": "DELETE_ALL_CHEATSHEETS" } to proceed',
      warning: 'This action is irreversible and will delete all cheat sheets from database and GCS'
    });
  }

  let connection;
  try {
    console.log('DANGER: Starting to clear all cheat sheets...');

    // Get all cheat sheets with file paths
    const allCheatSheets = await db.query(
      'SELECT cheatsheet_id, title, file_path, preview_image_path FROM cheat_sheets'
    );

    console.log(`Found ${allCheatSheets.length} cheat sheets to delete`);

    // Start transaction
    connection = await db.beginTransaction();

    // Delete all related data first (to avoid foreign key constraints)
    console.log('Deleting related data...');

    // Delete cart items
    await connection.query('DELETE FROM cart');

    // Delete purchases
    await connection.query('DELETE FROM purchases');

    // Delete reviews
    await connection.query('DELETE FROM reviews');

    // Delete cheatsheet_categories
    await connection.query('DELETE FROM cheatsheet_categories');

    // Delete download_logs
    await connection.query('DELETE FROM download_logs');

    // Delete cheat_sheets
    await connection.query('DELETE FROM cheat_sheets');

    // Commit database transaction
    await db.commit(connection);
    console.log('Database records deleted');

    // Now delete files from GCS
    console.log('Deleting files from GCS...');
    let deletedFiles = 0;
    let failedFiles = 0;

    for (const sheet of allCheatSheets) {
      // Delete PDF file
      if (sheet.file_path) {
        try {
          const exists = await fileExists(sheet.file_path);
          if (exists) {
            await deleteFromGCS(sheet.file_path);
            deletedFiles++;
            console.log(`  ✓ Deleted: ${sheet.file_path}`);
          }
        } catch (error) {
          console.error(`  ✗ Failed to delete ${sheet.file_path}:`, error.message);
          failedFiles++;
        }
      }

      // Delete preview image (if it's stored in GCS)
      if (sheet.preview_image_path && sheet.preview_image_path.includes('storage.googleapis.com')) {
        try {
          // Extract path from URL: https://storage.googleapis.com/bucket/path/to/file.jpg
          const urlParts = sheet.preview_image_path.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'storage.googleapis.com');
          if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
            const filePath = urlParts.slice(bucketIndex + 2).join('/');
            const exists = await fileExists(filePath);
            if (exists) {
              await deleteFromGCS(filePath);
              deletedFiles++;
              console.log(`  ✓ Deleted preview: ${filePath}`);
            }
          }
        } catch (error) {
          console.error(`  ✗ Failed to delete preview ${sheet.preview_image_path}:`, error.message);
          failedFiles++;
        }
      }
    }

    console.log('Cleanup complete!!!!');

    res.json({
      message: 'All cheat sheets cleared successfully',
      summary: {
        database_records_deleted: allCheatSheets.length,
        gcs_files_deleted: deletedFiles,
        gcs_files_failed: failedFiles
      },
      warning: 'All cheat sheets have been permanently deleted'
    });

  } catch (error) {
    if (connection) {
      await db.rollback(connection);
      console.log('Transaction rolled back');
    }
    console.error('Clear all cheatsheets error:', error);
    res.status(500).json({
      error: 'Clear failed',
      message: error.message || 'Failed to clear cheat sheets. Database transaction was rolled back.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get pending cheat sheets for approval
 * GET /api/admin/cheatsheets/pending
 */
router.get('/cheatsheets/pending', requireStaff, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const safeLimit = Math.max(1, Math.min(1000, parseInt(limit) || 50));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    const pendingCheatsheets = await db.query(
      `SELECT
        cs.cheatsheet_id,
        cs.title,
        cs.description,
        cs.course_code,
        cs.semester,
        cs.academic_year,
        cs.price,
        cs.file_path,
        cs.preview_image_path,
        cs.approval_status,
        cs.created_at,
        cs.created_by,
        u.name as creator_name,
        u.email as creator_email
       FROM cheat_sheets cs
       JOIN users u ON cs.created_by = u.user_id
       WHERE cs.approval_status = 'pending'
       ORDER BY cs.created_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );

    // Get total count of all cheat sheets (for staff dashboard)
    const totalCount = await db.queryOne(
      'SELECT COUNT(*) as total FROM cheat_sheets WHERE is_active = TRUE'
    );

    res.json({
      count: pendingCheatsheets.length,
      cheatsheets: pendingCheatsheets,
      totalCheatsheets: totalCount.total
    });

  } catch (error) {
    console.error('Get pending cheat sheets error:', error);
    res.status(500).json({
      error: 'Failed to fetch cheat sheets',
      message: 'Could not retrieve pending cheat sheets'
    });
  }
});

/**
 * Approve a cheat sheet
 * POST /api/admin/cheatsheets/:id/approve
 */
router.post('/cheatsheets/:id/approve', requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user.user_id;

    // Check if cheat sheet exists and is pending
    const cheatsheet = await db.queryOne(
      'SELECT cheatsheet_id, approval_status FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    if (!cheatsheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    if (cheatsheet.approval_status !== 'pending') {
      return res.status(400).json({
        error: 'Already processed',
        message: `This cheat sheet has already been ${cheatsheet.approval_status}`
      });
    }

    // Approve the cheat sheet
    await db.update(
      `UPDATE cheat_sheets
       SET approval_status = 'approved',
           approved_by = ?,
           approved_at = NOW()
       WHERE cheatsheet_id = ?`,
      [admin_id, id]
    );

    res.json({
      message: 'Cheat sheet approved successfully',
      cheatsheet_id: id
    });

  } catch (error) {
    console.error('Approve cheat sheet error:', error);
    res.status(500).json({
      error: 'Failed to approve cheat sheet',
      message: 'Could not approve cheat sheet. Please try again.'
    });
  }
});

/**
 * Reject a cheat sheet
 * POST /api/admin/cheatsheets/:id/reject
 */
router.post('/cheatsheets/:id/reject', requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const admin_id = req.user.user_id;

    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({
        error: 'Missing rejection reason',
        message: 'Please provide a reason for rejection'
      });
    }

    // Check if cheat sheet exists and is pending
    const cheatsheet = await db.queryOne(
      'SELECT cheatsheet_id, approval_status FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    if (!cheatsheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    if (cheatsheet.approval_status !== 'pending') {
      return res.status(400).json({
        error: 'Already processed',
        message: `This cheat sheet has already been ${cheatsheet.approval_status}`
      });
    }

    // Reject the cheat sheet
    await db.update(
      `UPDATE cheat_sheets
       SET approval_status = 'rejected',
           approved_by = ?,
           approved_at = NOW(),
           rejection_reason = ?
       WHERE cheatsheet_id = ?`,
      [admin_id, rejection_reason, id]
    );

    res.json({
      message: 'Cheat sheet rejected',
      cheatsheet_id: id
    });

  } catch (error) {
    console.error('Reject cheat sheet error:', error);
    res.status(500).json({
      error: 'Failed to reject cheat sheet',
      message: 'Could not reject cheat sheet. Please try again.'
    });
  }
});

/**
 * Get all cheat sheets (for admin management)
 * GET /api/admin/cheatsheets/all
 */
router.get('/cheatsheets/all', requireAdmin, async (req, res) => {
  try {
    const cheatSheets = await db.query(
      `SELECT
        cs.cheatsheet_id,
        cs.title,
        cs.course_code,
        cs.price,
        cs.is_active,
        cs.approval_status,
        cs.purchase_count,
        cs.created_at,
        cs.created_by,
        u.name as creator_name
       FROM cheat_sheets cs
       LEFT JOIN users u ON cs.created_by = u.user_id
       ORDER BY cs.created_at DESC`
    );

    res.json({
      cheat_sheets: cheatSheets
    });

  } catch (error) {
    console.error('Get all cheat sheets error:', error);
    res.status(500).json({
      error: 'Failed to fetch cheat sheets',
      message: 'Could not retrieve cheat sheets'
    });
  }
});

/**
 * Update cheat sheet active status
 * PATCH /api/admin/cheatsheets/:id/status
 */
router.patch('/cheatsheets/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    // Validate input
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'is_active must be a boolean value'
      });
    }

    // Check if cheat sheet exists
    const existing = await db.queryOne(
      'SELECT cheatsheet_id FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    // Update status
    await db.update(
      'UPDATE cheat_sheets SET is_active = ? WHERE cheatsheet_id = ?',
      [is_active, id]
    );

    res.json({
      message: `Cheat sheet ${is_active ? 'activated' : 'deactivated'} successfully`,
      cheatsheet_id: parseInt(id),
      is_active: is_active
    });

  } catch (error) {
    console.error('Update cheat sheet status error:', error);
    res.status(500).json({
      error: 'Failed to update status',
      message: 'Could not update cheat sheet status. Please try again.'
    });
  }
});

module.exports = router;
