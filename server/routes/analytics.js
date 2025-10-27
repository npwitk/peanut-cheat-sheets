const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { trackEvent, getAnalyticsSummary, getCheatSheetAnalytics } = require('../services/analytics');

const router = express.Router();

/**
 * POST /api/analytics/track
 * Track a client-side analytics event
 */
router.post('/track', async (req, res) => {
  try {
    const { event_type, cheatsheet_id, additional_data } = req.body;

    if (!event_type) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'event_type is required'
      });
    }

    await trackEvent({
      event_type,
      user_id: req.user?.user_id || null,
      cheatsheet_id: cheatsheet_id || null,
      session_id: req.sessionID,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      referrer_url: req.get('referer'),
      page_url: req.body.page_url || req.originalUrl,
      additional_data: additional_data || null
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({
      error: 'Failed to track event',
      message: 'Could not record analytics event'
    });
  }
});

/**
 * GET /api/analytics/summary
 * Get analytics summary for admin dashboard (admin only)
 */
router.get('/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const summary = await getAnalyticsSummary();
    res.json(summary);
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: 'Could not retrieve analytics summary'
    });
  }
});

/**
 * GET /api/analytics/cheatsheet/:id
 * Get analytics for a specific cheat sheet (admin only)
 */
router.get('/cheatsheet/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await getCheatSheetAnalytics(id);
    res.json(analytics);
  } catch (error) {
    console.error('Get cheat sheet analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: 'Could not retrieve cheat sheet analytics'
    });
  }
});

module.exports = router;
