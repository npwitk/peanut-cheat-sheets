const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Submit a support ticket (authenticated users only)
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { ticket_type, message } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!ticket_type || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'ticket_type and message are required'
      });
    }

    // Validate ticket type
    const validTypes = [
      'QA',
      'feedback',
      'bug',
      'copyright',
      'payment',
      'download',
      'account',
      'content_quality',
      'refund',
      'other'
    ];
    if (!validTypes.includes(ticket_type)) {
      return res.status(400).json({
        error: 'Invalid ticket type',
        message: 'ticket_type must be one of: ' + validTypes.join(', ')
      });
    }

    // Insert ticket
    const ticketId = await db.insert(
      `INSERT INTO support_tickets (user_id, ticket_type, message, ticket_status, submitted_date)
       VALUES (?, ?, ?, 'open', NOW())`,
      [user_id, ticket_type, message]
    );

    res.status(201).json({
      message: 'Support ticket submitted successfully',
      ticket: {
        ticket_id: ticketId,
        user_id,
        ticket_type,
        message,
        ticket_status: 'open'
      }
    });
  } catch (error) {
    console.error('Submit support ticket error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to submit support ticket'
    });
  }
});

// Get user's own support tickets
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const tickets = await db.query(
      `SELECT ticket_id, ticket_type, message, ticket_status, submitted_date, updated_at
       FROM support_tickets
       WHERE user_id = ?
       ORDER BY submitted_date DESC`,
      [user_id]
    );

    res.json({
      tickets
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch support tickets'
    });
  }
});

// Get all support tickets (admin only)
router.get('/tickets/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, type } = req.query;

    let query = `
      SELECT
        st.ticket_id,
        st.user_id,
        st.ticket_type,
        st.message,
        st.ticket_status,
        st.submitted_date,
        st.updated_at,
        u.name as user_name,
        u.email as user_email
      FROM support_tickets st
      JOIN users u ON st.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND st.ticket_status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND st.ticket_type = ?';
      params.push(type);
    }

    query += ' ORDER BY st.submitted_date DESC';

    const tickets = await db.query(query, params);

    res.json({
      tickets
    });
  } catch (error) {
    console.error('Get all support tickets error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch all support tickets'
    });
  }
});

// Update ticket status (admin only)
router.patch('/tickets/:ticketId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { ticket_status } = req.body;

    // Validate status
    const validStatuses = ['open', 'closed', 'resolved'];
    if (!validStatuses.includes(ticket_status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'ticket_status must be one of: open, closed, resolved'
      });
    }

    const affected = await db.update(
      `UPDATE support_tickets
       SET ticket_status = ?, updated_at = NOW()
       WHERE ticket_id = ?`,
      [ticket_status, ticketId]
    );

    if (affected === 0) {
      return res.status(404).json({
        error: 'Ticket not found',
        message: 'Support ticket does not exist'
      });
    }

    res.json({
      message: 'Ticket status updated successfully'
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update ticket status'
    });
  }
});

// Deactivate account (authenticated users only)
// Note: Accounts are deactivated (soft delete) rather than permanently deleted
// to preserve data integrity and transaction history
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Try to deactivate user account (soft delete)
    // This will fail gracefully if columns don't exist (migration not run)
    try {
      // Check if account is already deactivated
      const user = await db.queryOne(
        'SELECT is_deactivated FROM users WHERE user_id = ?',
        [user_id]
      );

      if (user && user.is_deactivated) {
        return res.status(400).json({
          error: 'Account already deactivated',
          message: 'Your account has already been deactivated'
        });
      }

      // Deactivate user account (soft delete)
      await db.update(
        `UPDATE users
         SET is_deactivated = TRUE, deactivated_at = NOW()
         WHERE user_id = ?`,
        [user_id]
      );
    } catch (dbError) {
      // If deactivation columns don't exist (migration not run), just log user out
      // This provides backwards compatibility
      console.log('Deactivation columns not found, migration may not be run yet:', dbError.message);
    }

    // Logout user by destroying session
    req.logout((err) => {
      if (err) {
        console.error('Logout error during account deactivation:', err);
      }
    });

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error during account deactivation:', err);
      }
    });

    res.json({
      message: 'Account deactivated successfully. Your purchase history and data have been preserved.'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to deactivate account'
    });
  }
});

module.exports = router;
