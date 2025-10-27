const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, verifyCheatSheetAccess } = require('../middleware/auth');
const { addWatermarkToPDF } = require('../services/watermark');
const db = require('../config/database');
const { downloadFromGCS } = require('../config/storage');

const router = express.Router();

/**
 * Get current user's purchases
 * GET /api/purchases/my
 */
router.get('/my', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const purchases = await db.query(
      `SELECT
        p.order_id,
        p.cheatsheet_id,
        p.payment_status,
        p.payment_amount,
        p.purchase_date,
        p.payment_completed_at,
        p.download_count,
        p.last_download_at,
        cs.title,
        cs.description,
        cs.course_code,
        cs.semester,
        cs.academic_year,
        cs.preview_image_path
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.user_id = ?
       ORDER BY p.purchase_date DESC`,
      [userId]
    );

    res.json({
      count: purchases.length,
      purchases
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      error: 'Failed to fetch purchases',
      message: 'Could not retrieve your purchases'
    });
  }
});

/**
 * Get specific purchase details
 * GET /api/purchases/:orderId
 */
router.get('/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.user_id;

  try {
    const purchase = await db.queryOne(
      `SELECT
        p.*,
        cs.title,
        cs.description,
        cs.course_code,
        cs.semester,
        cs.academic_year,
        cs.preview_image_path,
        cs.page_count,
        cs.file_size_mb
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.order_id = ? AND p.user_id = ?`,
      [orderId, userId]
    );

    if (!purchase) {
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The specified purchase does not exist'
      });
    }

    res.json({ purchase });

  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      error: 'Failed to fetch purchase',
      message: 'Could not retrieve purchase details'
    });
  }
});

/**
 * Download purchased cheat sheet with watermark
 * GET /api/purchases/:orderId/download
 */
router.get('/:orderId/download', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.user_id;

  try {
    // Verify purchase
    const purchase = await db.queryOne(
      `SELECT p.*, cs.file_path, cs.title
       FROM purchases p
       JOIN cheat_sheets cs ON p.cheatsheet_id = cs.cheatsheet_id
       WHERE p.order_id = ? AND p.user_id = ?`,
      [orderId, userId]
    );

    if (!purchase) {
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The specified purchase does not exist'
      });
    }

    // Check if payment is completed
    if (purchase.payment_status !== 'paid') {
      return res.status(403).json({
        error: 'Payment not completed',
        message: 'Please wait for payment approval before downloading',
        status: purchase.payment_status
      });
    }

    // Download PDF from Google Cloud Storage
    const pdfBuffer = await downloadFromGCS(purchase.file_path);

    // Save to temporary file for watermarking
    const tempDir = path.join(__dirname, '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // Create watermarked PDF
    const watermarkedFilename = `${orderId}_${userId}_${Date.now()}.pdf`;
    const watermarkedPath = path.join(tempDir, watermarkedFilename);

    // Add watermark
    await addWatermarkToPDF(tempPdfPath, watermarkedPath, {
      name: req.user.name,
      email: req.user.email,
      order_id: orderId
    });

    // Clean up temporary original file
    await fs.unlink(tempPdfPath);

    // Update download count and log
    await db.update(
      `UPDATE purchases
       SET download_count = download_count + 1,
           last_download_at = NOW()
       WHERE order_id = ?`,
      [orderId]
    );

    // Log download
    await db.insert(
      `INSERT INTO download_logs
       (order_id, user_id, cheatsheet_id, download_ip, user_agent, download_status)
       VALUES (?, ?, ?, ?, ?, 'completed')`,
      [
        orderId,
        userId,
        purchase.cheatsheet_id,
        req.ip,
        req.headers['user-agent']
      ]
    );

    // Send file
    res.download(watermarkedPath, `${purchase.title}.pdf`, async (err) => {
      if (err) {
        console.error('Download error:', err);
      }

      // Clean up watermarked file after sending
      try {
        await fs.unlink(watermarkedPath);
      } catch (unlinkErr) {
        console.error('Failed to delete watermarked file:', unlinkErr);
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: 'Failed to process download. Please try again.'
    });
  }
});

/**
 * Check if user can download a cheat sheet
 * GET /api/purchases/check/:cheatsheetId
 */
router.get('/check/:cheatsheetId', authenticateToken, async (req, res) => {
  const { cheatsheetId } = req.params;
  const userId = req.user.user_id;

  try {
    const purchase = await db.queryOne(
      `SELECT order_id, payment_status, purchase_date, download_count
       FROM purchases
       WHERE user_id = ? AND cheatsheet_id = ?`,
      [userId, cheatsheetId]
    );

    if (!purchase) {
      return res.json({
        can_download: false,
        reason: 'not_purchased'
      });
    }

    if (purchase.payment_status !== 'paid') {
      return res.json({
        can_download: false,
        reason: 'payment_pending',
        order_id: purchase.order_id,
        status: purchase.payment_status
      });
    }

    res.json({
      can_download: true,
      order_id: purchase.order_id,
      download_count: purchase.download_count,
      purchase_date: purchase.purchase_date
    });

  } catch (error) {
    console.error('Check download access error:', error);
    res.status(500).json({
      error: 'Check failed',
      message: 'Could not verify download access'
    });
  }
});

module.exports = router;
