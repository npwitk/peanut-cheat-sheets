const express = require('express');
const { authenticateToken, requireAdmin, requireStaff } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Encryption key for bank account numbers (should be in .env)
const ENCRYPTION_KEY = process.env.BANK_ENCRYPTION_KEY || 'bankaccount_peanut';

/**
 * Submit seller application
 * POST /api/seller-applications
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { full_name, bank_name, bank_account_number, bank_account_name, phone_number, reason } = req.body;

    // Validate required fields
    if (!full_name || !bank_name || !bank_account_number || !bank_account_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide full name, bank name, account number, and account holder name'
      });
    }

    // Check if user is already a seller
    if (req.user.is_seller) {
      return res.status(400).json({
        error: 'Already a seller',
        message: 'You are already approved as a seller'
      });
    }

    // Check if user already has a pending/approved application
    const existingApp = await db.queryOne(
      'SELECT application_id, status FROM seller_applications WHERE user_id = ?',
      [user_id]
    );

    if (existingApp) {
      if (existingApp.status === 'pending') {
        return res.status(400).json({
          error: 'Application pending',
          message: 'You already have a pending application. Please wait for admin review.'
        });
      } else if (existingApp.status === 'approved') {
        return res.status(400).json({
          error: 'Already approved',
          message: 'Your seller application has already been approved'
        });
      } else if (existingApp.status === 'rejected') {
        // Allow resubmission if previously rejected - delete old application
        await db.query('DELETE FROM seller_applications WHERE application_id = ?', [existingApp.application_id]);
      }
    }

    // Insert application with encrypted bank account number
    const applicationId = await db.insert(
      `INSERT INTO seller_applications
       (user_id, full_name, bank_name, bank_account_number, bank_account_name, phone_number, reason, status)
       VALUES (?, ?, ?, AES_ENCRYPT(?, ?), ?, ?, ?, 'pending')`,
      [user_id, full_name, bank_name, bank_account_number, ENCRYPTION_KEY, bank_account_name, phone_number || null, reason || null]
    );

    res.status(201).json({
      message: 'Seller application submitted successfully',
      application_id: applicationId
    });

  } catch (error) {
    console.error('Submit seller application error:', error);
    res.status(500).json({
      error: 'Failed to submit application',
      message: 'Could not submit seller application. Please try again.'
    });
  }
});

/**
 * Get user's own seller application status
 * GET /api/seller-applications/my
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const application = await db.queryOne(
      `SELECT
        application_id,
        full_name,
        bank_name,
        bank_account_name,
        phone_number,
        reason,
        status,
        admin_notes,
        submitted_at,
        reviewed_at
       FROM seller_applications
       WHERE user_id = ?`,
      [user_id]
    );

    if (!application) {
      return res.status(404).json({
        error: 'No application found',
        message: 'You have not submitted a seller application yet'
      });
    }

    // Don't return encrypted bank account number to user
    res.json({ application });

  } catch (error) {
    console.error('Get my application error:', error);
    res.status(500).json({
      error: 'Failed to fetch application',
      message: 'Could not retrieve your application'
    });
  }
});

/**
 * Admin: Get all seller applications
 * GET /api/seller-applications/admin/all
 */
router.get('/admin/all', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // Sanitize limit and offset (ensure they're safe integers)
    const safeLimit = Math.max(1, Math.min(1000, parseInt(limit) || 50));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    let whereClause = 'WHERE 1=1';
    const params = [ENCRYPTION_KEY];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause += ' AND sa.status = ?';
      params.push(status);
    }

    // Build query with LIMIT and OFFSET directly in the string (not as placeholders)
    // This is safe because we've sanitized the values above
    const applications = await db.query(
      `SELECT
        sa.application_id,
        sa.user_id,
        sa.full_name,
        sa.bank_name,
        CAST(AES_DECRYPT(sa.bank_account_number, ?) AS CHAR) as bank_account_number,
        sa.bank_account_name,
        sa.phone_number,
        sa.reason,
        sa.status,
        sa.admin_notes,
        sa.reviewed_by,
        sa.reviewed_at,
        sa.submitted_at,
        sa.updated_at,
        u.name as user_name,
        u.email as user_email,
        reviewer.name as reviewed_by_name
       FROM seller_applications sa
       JOIN users u ON sa.user_id = u.user_id
       LEFT JOIN users reviewer ON sa.reviewed_by = reviewer.user_id
       ${whereClause}
       ORDER BY sa.submitted_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );

    res.json({ applications });

  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      error: 'Failed to fetch applications',
      message: 'Could not retrieve seller applications'
    });
  }
});

/**
 * Admin: Approve seller application
 * POST /api/seller-applications/:id/approve
 */
router.post('/:id/approve', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const admin_id = req.user.user_id;

    // Get application
    const application = await db.queryOne(
      'SELECT user_id, status FROM seller_applications WHERE application_id = ?',
      [id]
    );

    if (!application) {
      return res.status(404).json({
        error: 'Application not found',
        message: 'The specified application does not exist'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        error: 'Application already processed',
        message: `This application has already been ${application.status}`
      });
    }

    // Start transaction
    const connection = await db.beginTransaction();

    try {
      // Update application status
      await connection.query(
        `UPDATE seller_applications
         SET status = 'approved',
             admin_notes = ?,
             reviewed_by = ?,
             reviewed_at = NOW()
         WHERE application_id = ?`,
        [admin_notes || null, admin_id, id]
      );

      // Grant seller status to user
      await connection.query(
        'UPDATE users SET is_seller = TRUE WHERE user_id = ?',
        [application.user_id]
      );

      await db.commit(connection);

      res.json({
        message: 'Seller application approved successfully',
        user_id: application.user_id
      });

    } catch (error) {
      await db.rollback(connection);
      throw error;
    }

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      error: 'Failed to approve application',
      message: 'Could not approve seller application. Please try again.'
    });
  }
});

/**
 * Admin: Reject seller application
 * POST /api/seller-applications/:id/reject
 */
router.post('/:id/reject', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;
    const admin_id = req.user.user_id;

    if (!admin_notes) {
      return res.status(400).json({
        error: 'Missing rejection reason',
        message: 'Please provide a reason for rejection'
      });
    }

    // Get application
    const application = await db.queryOne(
      'SELECT status FROM seller_applications WHERE application_id = ?',
      [id]
    );

    if (!application) {
      return res.status(404).json({
        error: 'Application not found',
        message: 'The specified application does not exist'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        error: 'Application already processed',
        message: `This application has already been ${application.status}`
      });
    }

    // Update application status
    await db.update(
      `UPDATE seller_applications
       SET status = 'rejected',
           admin_notes = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE application_id = ?`,
      [admin_notes, admin_id, id]
    );

    res.json({
      message: 'Seller application rejected'
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      error: 'Failed to reject application',
      message: 'Could not reject seller application. Please try again.'
    });
  }
});

module.exports = router;
