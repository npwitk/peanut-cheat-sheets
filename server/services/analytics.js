const db = require('../config/database');

/**
 * Track analytics events
 * @param {Object} eventData - Event data to track
 * @param {string} eventData.event_type - Type of event (page_view, cheatsheet_view, search, etc.)
 * @param {number} eventData.user_id - User ID (optional)
 * @param {number} eventData.cheatsheet_id - Cheat sheet ID (optional)
 * @param {string} eventData.session_id - Session ID (optional)
 * @param {string} eventData.ip_address - IP address
 * @param {string} eventData.user_agent - User agent string
 * @param {string} eventData.referrer_url - Referrer URL (optional)
 * @param {string} eventData.page_url - Current page URL (optional)
 * @param {Object} eventData.additional_data - Additional JSON data (optional)
 */
async function trackEvent(eventData) {
  try {
    const {
      event_type,
      user_id = null,
      cheatsheet_id = null,
      session_id = null,
      ip_address,
      user_agent,
      referrer_url = null,
      page_url = null,
      additional_data = null
    } = eventData;

    await db.insert(
      `INSERT INTO analytics
       (event_type, user_id, cheatsheet_id, session_id, ip_address, user_agent, referrer_url, page_url, additional_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_type,
        user_id,
        cheatsheet_id,
        session_id,
        ip_address,
        user_agent,
        referrer_url,
        page_url,
        additional_data ? JSON.stringify(additional_data) : null
      ]
    );
  } catch (error) {
    // Log error but don't throw - analytics failures shouldn't break the app
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Get analytics summary for admin dashboard
 */
async function getAnalyticsSummary() {
  try {
    // Total events by type
    const eventCounts = await db.query(
      `SELECT event_type, COUNT(*) as count
       FROM analytics
       GROUP BY event_type
       ORDER BY count DESC`
    );

    // Events over time (last 30 days)
    const dailyEvents = await db.query(
      `SELECT
         DATE(created_at) as date,
         event_type,
         COUNT(*) as count
       FROM analytics
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at), event_type
       ORDER BY date DESC, count DESC`
    );

    // Top viewed cheat sheets
    const topCheatSheets = await db.query(
      `SELECT
         cs.cheatsheet_id,
         cs.title,
         cs.course_code,
         COUNT(*) as view_count
       FROM analytics a
       JOIN cheat_sheets cs ON a.cheatsheet_id = cs.cheatsheet_id
       WHERE a.event_type = 'cheatsheet_view'
         AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY cs.cheatsheet_id, cs.title, cs.course_code
       ORDER BY view_count DESC
       LIMIT 10`
    );

    // Top search queries
    const topSearches = await db.query(
      `SELECT
         JSON_UNQUOTE(JSON_EXTRACT(additional_data, '$.query')) as search_query,
         COUNT(*) as search_count
       FROM analytics
       WHERE event_type = 'search'
         AND additional_data IS NOT NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY search_query
       ORDER BY search_count DESC
       LIMIT 20`
    );

    // User engagement metrics
    const userMetrics = await db.queryOne(
      `SELECT
         COUNT(DISTINCT user_id) as active_users,
         COUNT(DISTINCT session_id) as total_sessions,
         COUNT(*) as total_events
       FROM analytics
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    // Footer link clicks
    const footerClicks = await db.query(
      `SELECT
         JSON_UNQUOTE(JSON_EXTRACT(additional_data, '$.link_name')) as link_name,
         JSON_UNQUOTE(JSON_EXTRACT(additional_data, '$.link_type')) as link_type,
         COUNT(*) as click_count
       FROM analytics
       WHERE event_type = 'footer_link_click'
         AND additional_data IS NOT NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY link_name, link_type
       ORDER BY click_count DESC`
    );

    return {
      eventCounts,
      dailyEvents,
      topCheatSheets,
      topSearches,
      userMetrics,
      footerClicks
    };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
}

/**
 * Get detailed analytics for a specific cheat sheet
 */
async function getCheatSheetAnalytics(cheatsheetId) {
  try {
    // Total views
    const viewCount = await db.queryOne(
      `SELECT COUNT(*) as count
       FROM analytics
       WHERE event_type = 'cheatsheet_view'
         AND cheatsheet_id = ?`,
      [cheatsheetId]
    );

    // Views over time (last 30 days)
    const dailyViews = await db.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as views
       FROM analytics
       WHERE event_type = 'cheatsheet_view'
         AND cheatsheet_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [cheatsheetId]
    );

    // Unique viewers
    const uniqueViewers = await db.queryOne(
      `SELECT COUNT(DISTINCT user_id) as count
       FROM analytics
       WHERE event_type = 'cheatsheet_view'
         AND cheatsheet_id = ?
         AND user_id IS NOT NULL`,
      [cheatsheetId]
    );

    return {
      totalViews: viewCount.count,
      dailyViews,
      uniqueViewers: uniqueViewers.count
    };
  } catch (error) {
    console.error('Error fetching cheat sheet analytics:', error);
    throw error;
  }
}

module.exports = {
  trackEvent,
  getAnalyticsSummary,
  getCheatSheetAnalytics
};
