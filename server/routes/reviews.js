const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Create or update a review for a cheat sheet
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { cheatsheet_id, rating, comment } = req.body;
    const user_id = req.user.user_id;

    // Validate input
    if (!cheatsheet_id || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'cheatsheet_id and rating are required'
      });
    }

    // Validate rating (0.5 to 5.0 in 0.5 increments)
    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 0.5 || numRating > 5.0 || (numRating * 10) % 5 !== 0) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 0.5 and 5.0 in 0.5 increments (e.g., 0.5, 1.0, 1.5, ..., 5.0)'
      });
    }

    // Check if cheat sheet exists and get price
    const cheatSheet = await db.queryOne(
      'SELECT cheatsheet_id, price FROM cheat_sheets WHERE cheatsheet_id = ? AND is_active = TRUE',
      [cheatsheet_id]
    );

    if (!cheatSheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist or is not active'
      });
    }

    // Check if it's free or if user has purchased this cheat sheet
    const isFree = parseFloat(cheatSheet.price) === 0;
    const purchase = await db.queryOne(
      'SELECT order_id FROM purchases WHERE user_id = ? AND cheatsheet_id = ? AND payment_status = "paid"',
      [user_id, cheatsheet_id]
    );

    // Free cheat sheets: anyone can review (not verified)
    // Paid cheat sheets: only verified if purchased
    const is_verified_purchase = !isFree && !!purchase;

    // Check if user has already reviewed this cheat sheet
    const existingReview = await db.queryOne(
      'SELECT review_id FROM reviews WHERE user_id = ? AND cheatsheet_id = ?',
      [user_id, cheatsheet_id]
    );

    let reviewId;
    if (existingReview) {
      // Update existing review
      await db.update(
        `UPDATE reviews
         SET rating = ?, comment = ?, is_verified_purchase = ?, updated_at = NOW()
         WHERE review_id = ?`,
        [numRating, comment || null, is_verified_purchase, existingReview.review_id]
      );
      reviewId = existingReview.review_id;
    } else {
      // Insert new review
      reviewId = await db.insert(
        `INSERT INTO reviews (user_id, cheatsheet_id, rating, comment, is_verified_purchase, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id, cheatsheet_id, numRating, comment || null, is_verified_purchase]
      );
    }

    // Fetch the created/updated review
    const review = await db.queryOne(
      `SELECT r.*, u.name as user_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.review_id = ?`,
      [reviewId]
    );

    res.status(existingReview ? 200 : 201).json({
      message: existingReview ? 'Review updated successfully' : 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create/update review error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create/update review'
    });
  }
});

// Get all reviews for a specific cheat sheet
router.get('/cheatsheet/:cheatsheetId', async (req, res) => {
  try {
    const { cheatsheetId } = req.params;
    const { sort = 'recent', verified_only = 'false', limit = '10' } = req.query;

    let orderBy = 'r.created_at DESC'; // Default: most recent first
    if (sort === 'rating_high') {
      orderBy = 'r.rating DESC, r.created_at DESC';
    } else if (sort === 'rating_low') {
      orderBy = 'r.rating ASC, r.created_at DESC';
    }

    let whereClause = 'WHERE r.cheatsheet_id = ? AND r.is_approved = TRUE';
    const params = [cheatsheetId];

    if (verified_only === 'true') {
      whereClause += ' AND r.is_verified_purchase = TRUE';
    }

    // Validate and sanitize limit to prevent SQL injection
    let reviewLimit = parseInt(limit) || 10;
    if (isNaN(reviewLimit) || reviewLimit < 1) reviewLimit = 10;
    if (reviewLimit > 100) reviewLimit = 100; // Max 100 reviews

    // Note: LIMIT must be a literal number in the query, not a parameter
    const reviews = await db.query(
      `SELECT
         r.review_id,
         r.rating,
         r.comment,
         r.is_verified_purchase,
         r.created_at,
         r.updated_at,
         u.name as user_name,
         u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ${reviewLimit}`,
      params
    );

    // Get average rating and count
    const stats = await db.queryOne(
      `SELECT
         AVG(rating) as average_rating,
         COUNT(*) as total_reviews,
         SUM(CASE WHEN is_verified_purchase = TRUE THEN 1 ELSE 0 END) as verified_reviews
       FROM reviews
       WHERE cheatsheet_id = ? AND is_approved = TRUE`,
      [cheatsheetId]
    );

    // Calculate stats safely
    const avgRating = stats && stats.average_rating ? parseFloat(stats.average_rating) : 0;

    res.json({
      reviews,
      stats: {
        average_rating: avgRating ? parseFloat(avgRating.toFixed(1)) : 0,
        total_reviews: stats && stats.total_reviews ? parseInt(stats.total_reviews) : 0,
        verified_reviews: stats && stats.verified_reviews ? parseInt(stats.verified_reviews) : 0
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch reviews'
    });
  }
});

// Get user's own review for a cheat sheet
router.get('/my-review/:cheatsheetId', authenticateToken, async (req, res) => {
  try {
    const { cheatsheetId } = req.params;
    const user_id = req.user.user_id;

    const review = await db.queryOne(
      `SELECT
         r.*,
         u.name as user_name,
         u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.user_id = ? AND r.cheatsheet_id = ?`,
      [user_id, cheatsheetId]
    );

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'You have not reviewed this cheat sheet yet'
      });
    }

    res.json({ review });
  } catch (error) {
    console.error('Get user review error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch your review'
    });
  }
});

// Delete user's own review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user_id = req.user.user_id;

    // Verify ownership
    const review = await db.queryOne(
      'SELECT user_id FROM reviews WHERE review_id = ?',
      [reviewId]
    );

    if (!review) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    if (review.user_id !== user_id && !req.user.is_admin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own reviews'
      });
    }

    await db.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete review'
    });
  }
});

// Admin: Get all reviews with filters
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { approved, verified, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (approved !== undefined) {
      whereClause += ' AND r.is_approved = ?';
      params.push(approved === 'true');
    }

    if (verified !== undefined) {
      whereClause += ' AND r.is_verified_purchase = ?';
      params.push(verified === 'true');
    }

    const reviews = await db.query(
      `SELECT
         r.*,
         u.name as user_name,
         u.email as user_email,
         cs.title as cheatsheet_title,
         cs.course_code
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN cheat_sheets cs ON r.cheatsheet_id = cs.cheatsheet_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ reviews });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch reviews'
    });
  }
});

// Admin: Approve/disapprove a review
router.patch('/:reviewId/approval', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { is_approved } = req.body;

    if (typeof is_approved !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'is_approved must be a boolean value'
      });
    }

    const affected = await db.update(
      'UPDATE reviews SET is_approved = ?, updated_at = NOW() WHERE review_id = ?',
      [is_approved, reviewId]
    );

    if (affected === 0) {
      return res.status(404).json({
        error: 'Review not found',
        message: 'The specified review does not exist'
      });
    }

    res.json({
      message: `Review ${is_approved ? 'approved' : 'disapproved'} successfully`
    });
  } catch (error) {
    console.error('Update review approval error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update review approval'
    });
  }
});

module.exports = router;
