const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const pdfParse = require('pdf-parse');
const { authenticateToken, requireAdmin, requireUploader, optionalAuth, verifyCheatSheetOwnership } = require('../middleware/auth');
const db = require('../config/database');
const { uploadFileToGCS, downloadFromGCS } = require('../config/storage');
const { addWatermarkToPDF } = require('../services/watermark');
const { trackEvent } = require('../services/analytics');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadDir;
    if (file.fieldname === 'pdf') {
      uploadDir = path.join(__dirname, '..', 'uploads', 'cheatsheets');
    } else if (file.fieldname === 'preview_image') {
      uploadDir = path.join(__dirname, '..', 'uploads', 'previews');
    } else {
      uploadDir = path.join(__dirname, '..', 'uploads');
    }
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // We need to change
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024 // 200MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for cheat sheet'));
      }
    } else if (file.fieldname === 'preview_image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for preview'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

/**
 * Get all cheat sheets (public, with optional auth for user-specific data)
 * GET /api/cheatsheets
 */
router.get('/', optionalAuth, async (req, res) => {
  const { course_code, search, sort = 'newest', limit = 20, offset = 0 } = req.query;
  const userId = req.user?.user_id;

  try {
    let query = `
      SELECT
        cs.cheatsheet_id,
        cs.title,
        cs.description,
        cs.course_code,
        cs.semester,
        cs.academic_year,
        cs.year_level,
        cs.exam_type,
        cs.price,
        cs.file_path,
        cs.file_size_mb,
        cs.page_count,
        cs.preview_image_path,
        cs.preview_text,
        cs.youtube_links,
        cs.is_active,
        cs.view_count,
        cs.purchase_count,
        cs.created_by,
        cs.created_at,
        cs.updated_at,
        u.name as creator_name,
        u.avatar_url as creator_avatar,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.review_id) as review_count
      FROM cheat_sheets cs
      LEFT JOIN users u ON cs.created_by = u.user_id
      LEFT JOIN reviews r ON cs.cheatsheet_id = r.cheatsheet_id AND r.is_approved = TRUE
      WHERE cs.is_active = TRUE AND cs.approval_status = 'approved'
    `;

    const params = [];

    if (course_code) {
      query += ' AND cs.course_code = ?';
      params.push(course_code);
    }

    if (search) {
      query += ' AND (cs.title LIKE ? OR cs.description LIKE ? OR cs.course_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY cs.cheatsheet_id, cs.title, cs.description, cs.course_code,
               cs.semester, cs.academic_year, cs.year_level, cs.exam_type, cs.price, cs.file_path, cs.file_size_mb,
               cs.page_count, cs.preview_image_path, cs.preview_text, cs.youtube_links, cs.is_active,
               cs.view_count, cs.purchase_count, cs.created_by, cs.created_at, cs.updated_at, u.name, u.avatar_url`;

    // Sorting
    switch (sort) {
      case 'popular':
        query += ' ORDER BY cs.purchase_count DESC, cs.view_count DESC';
        break;
      case 'price_low':
        query += ' ORDER BY cs.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY cs.price DESC';
        break;
      case 'rating':
        query += ' ORDER BY average_rating DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY cs.created_at DESC';
    }

    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const cheatSheets = await db.query(query, params);

    // If user is logged in, check which ones they've purchased
    let purchasedSet = new Set();
    if (userId) {
      const purchasedIds = await db.query(
        'SELECT cheatsheet_id FROM purchases WHERE user_id = ? AND payment_status = ?',
        [userId, 'paid']
      );
      purchasedSet = new Set(purchasedIds.map(p => p.cheatsheet_id));

      cheatSheets.forEach(cs => {
        cs.is_purchased = purchasedSet.has(cs.cheatsheet_id);
      });
    }

    // Hide sensitive data from users who haven't purchased
    cheatSheets.forEach(cs => {
      const isFree = parseFloat(cs.price) === 0;
      const hasPurchased = purchasedSet.has(cs.cheatsheet_id);

      // Hide YouTube links (only show to purchasers)
      if (!userId || (!hasPurchased && !isFree)) {
        cs.youtube_links = null;
      }

      // SECURITY: Hide actual file paths from everyone in public list
      // Users should never see the actual GCS paths
      delete cs.file_path; // Remove actual PDF path

      // Replace preview_image_path with a proxy URL (or keep full URL for now - images are safe to display)
      // Preview images are public (safe to show), but we want consistent pattern
      // Keep preview_image_path as-is for now since it's needed for display
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM cheat_sheets WHERE is_active = TRUE';
    const countParams = [];

    if (course_code) {
      countQuery += ' AND course_code = ?';
      countParams.push(course_code);
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR description LIKE ? OR course_code LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await db.queryOne(countQuery, countParams);

    res.json({
      total: countResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      cheat_sheets: cheatSheets
    });

  } catch (error) {
    console.error('Get cheat sheets error:', error);
    res.status(500).json({
      error: 'Failed to fetch cheat sheets',
      message: 'Could not retrieve cheat sheets'
    });
  }
});

/**
 * Get single cheat sheet details (public)
 * GET /api/cheatsheets/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.user_id;

  try {
    const cheatSheet = await db.queryOne(
      `SELECT
        cs.cheatsheet_id,
        cs.title,
        cs.description,
        cs.course_code,
        cs.semester,
        cs.academic_year,
        cs.year_level,
        cs.exam_type,
        cs.price,
        cs.file_path,
        cs.file_size_mb,
        cs.page_count,
        cs.preview_image_path,
        cs.preview_text,
        cs.youtube_links,
        cs.is_active,
        cs.view_count,
        cs.purchase_count,
        cs.created_by,
        cs.created_at,
        cs.updated_at,
        u.name as creator_name,
        u.avatar_url as creator_avatar,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.review_id) as review_count
       FROM cheat_sheets cs
       LEFT JOIN users u ON cs.created_by = u.user_id
       LEFT JOIN reviews r ON cs.cheatsheet_id = r.cheatsheet_id AND r.is_approved = TRUE
       WHERE cs.cheatsheet_id = ? AND cs.is_active = TRUE
       GROUP BY cs.cheatsheet_id, cs.title, cs.description, cs.course_code,
                cs.semester, cs.academic_year, cs.year_level, cs.exam_type, cs.price, cs.file_path, cs.file_size_mb,
                cs.page_count, cs.preview_image_path, cs.preview_text, cs.youtube_links, cs.is_active,
                cs.view_count, cs.purchase_count, cs.created_by, cs.created_at, cs.updated_at, u.name, u.avatar_url`,
      [id]
    );

    if (!cheatSheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The requested cheat sheet does not exist'
      });
    }

    // Increment view count only if not viewed in this session
    const viewedKey = `viewed_${id}`;
    if (!req.session[viewedKey]) {
      await db.update(
        'UPDATE cheat_sheets SET view_count = view_count + 1 WHERE cheatsheet_id = ?',
        [id]
      );
      // Mark as viewed in this session (expires with session)
      req.session[viewedKey] = true;

      // Track analytics event
      trackEvent({
        event_type: 'cheatsheet_view',
        user_id: userId,
        cheatsheet_id: id,
        session_id: req.sessionID,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        referrer_url: req.get('referer'),
        page_url: req.originalUrl
      });
    }

    // Check if it's free or if user has purchased
    const isFree = parseFloat(cheatSheet.price) === 0;
    let hasPurchased = isFree; // Free cheat sheets are automatically "purchased"

    if (userId && !isFree) {
      const purchase = await db.queryOne(
        'SELECT order_id, payment_status FROM purchases WHERE user_id = ? AND cheatsheet_id = ?',
        [userId, id]
      );

      if (purchase) {
        hasPurchased = purchase.payment_status === 'paid';
        cheatSheet.is_purchased = hasPurchased;
        cheatSheet.purchase_status = purchase.payment_status;
        cheatSheet.order_id = purchase.order_id;
      }
    } else if (isFree) {
      // Mark free cheat sheets as purchased for logged-in users
      cheatSheet.is_purchased = !!userId;
      cheatSheet.is_free = true;
    }

    // Hide sensitive data from users who haven't purchased
    // BUT allow creators to see their own youtube links for editing
    const isCreator = userId && userId === cheatSheet.created_by;
    if (!isCreator && (!hasPurchased || (isFree && !userId))) {
      cheatSheet.youtube_links = null;
    }

    // SECURITY: Hide actual file path from everyone
    // Only purchasers can download via the download endpoint with verification
    delete cheatSheet.file_path;

    res.json({ cheat_sheet: cheatSheet });

  } catch (error) {
    console.error('Get cheat sheet error:', error);
    res.status(500).json({
      error: 'Failed to fetch cheat sheet',
      message: 'Could not retrieve cheat sheet details'
    });
  }
});

/**
 * Create new cheat sheet (seller, admin)
 * POST /api/cheatsheets
 */
router.post('/', authenticateToken, requireUploader, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'preview_image', maxCount: 1 }
]), async (req, res) => {
  const {
    title,
    description,
    course_code,
    semester,
    academic_year,
    year_level,
    exam_type,
    price,
    youtube_links
  } = req.body;

  try {
    console.log('Starting cheat sheet upload...');
    const startTime = Date.now();

    // Validate required fields
    if (!title || !description || !course_code || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide title, description, course_code, and price'
      });
    }

    // Validate year_level if provided
    const validYearLevels = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
    if (year_level && !validYearLevels.includes(year_level)) {
      return res.status(400).json({
        error: 'Invalid year level',
        message: 'Year level must be one of: Freshman, Sophomore, Junior, Senior'
      });
    }

    // Validate exam_type if provided
    const validExamTypes = ['Midterm', 'Final', 'Quiz'];
    if (exam_type && !validExamTypes.includes(exam_type)) {
      return res.status(400).json({
        error: 'Invalid exam type',
        message: 'Exam type must be one of: Midterm, Final, Quiz'
      });
    }

    if (!req.files || !req.files.pdf) {
      return res.status(400).json({
        error: 'Missing file',
        message: 'Please upload a PDF file'
      });
    }

    const pdfFile = req.files.pdf[0];
    const previewImageFile = req.files.preview_image ? req.files.preview_image[0] : null;
    console.log(`Files validated (${Date.now() - startTime}ms)`);

    // Helper function to sanitize filename
    const sanitizeFilename = (filename) => {
      // Remove special characters and replace with hyphens
      return filename
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    };

    // Get file stats and extract page count
    const stats = await fs.stat(pdfFile.path);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`File size: ${fileSizeMB}MB (${Date.now() - startTime}ms)`);

    // Extract page count from PDF
    let pageCount = null;
    try {
      console.log(`Extracting page count from: ${pdfFile.path}`);
      // Use sync read for pdf-parse compatibility
      const pdfBuffer = fsSync.readFileSync(pdfFile.path);
      console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);

      // Parse PDF with explicit dataBuffer option
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0 // Parse all pages to get accurate count
      });

      pageCount = pdfData.numpages;
      console.log(`Page count extracted: ${pageCount} pages (${Date.now() - startTime}ms)`);
    } catch (pageError) {
      console.error('Failed to extract page count:', pageError.message);
      console.error('Full error:', pageError);
      console.error('Stack:', pageError.stack);
      // Continue without page count - it's not critical
    }

    // Sanitize filenames
    const sanitizedPdfName = sanitizeFilename(pdfFile.originalname);
    const pdfDestination = `cheatsheets/${Date.now()}-${sanitizedPdfName}`;

    console.log(`Uploading PDF to GCS...`);
    const pdfUrl = await uploadFileToGCS(pdfFile.path, pdfDestination);
    console.log(`PDF uploaded (${Date.now() - startTime}ms)`);

    // Upload preview image to GCS (if provided)
    let previewImageUrl = null;
    let previewDestination = null;
    if (previewImageFile) {
      console.log(`Uploading preview image to GCS...`);
      const sanitizedPreviewName = sanitizeFilename(previewImageFile.originalname);
      previewDestination = `previews/${Date.now()}-${sanitizedPreviewName}`;
      previewImageUrl = await uploadFileToGCS(previewImageFile.path, previewDestination);
      console.log(`Preview image uploaded (${Date.now() - startTime}ms)`);
    }

    // Clean up local temporary files
    await fs.unlink(pdfFile.path);
    if (previewImageFile) {
      await fs.unlink(previewImageFile.path);
    }
    console.log(`Cleaned up temp files (${Date.now() - startTime}ms)`);

    // Parse YouTube links if provided
    let parsedYoutubeLinks = null;
    if (youtube_links) {
      try {
        parsedYoutubeLinks = JSON.parse(youtube_links);
        // Validate that it's an array
        if (!Array.isArray(parsedYoutubeLinks)) {
          parsedYoutubeLinks = null;
        }
      } catch (e) {
        console.warn('Failed to parse youtube_links:', e);
        parsedYoutubeLinks = null;
      }
    }

    // Insert into database with GCS URLs
    console.log(`Saving to database...`);
    const cheatsheetId = await db.insert(
      `INSERT INTO cheat_sheets
       (title, description, course_code, semester, academic_year, year_level, exam_type, price, file_path, file_size_mb, page_count, preview_image_path, youtube_links, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        course_code,
        semester || null,
        academic_year || null,
        year_level || null,
        exam_type || null,
        parseFloat(price),
        pdfDestination, // Store GCS path (already sanitized)
        parseFloat(fileSizeMB),
        pageCount, // Auto-detected page count
        previewImageUrl, // Store full GCS URL
        parsedYoutubeLinks ? JSON.stringify(parsedYoutubeLinks) : null,
        req.user.user_id
      ]
    );
    console.log(`Saved to database (${Date.now() - startTime}ms)`);

    const newCheatSheet = await db.queryOne(
      'SELECT * FROM cheat_sheets WHERE cheatsheet_id = ?',
      [cheatsheetId]
    );

    console.log(`Upload complete! Total time: ${Date.now() - startTime}ms`);

    res.status(201).json({
      message: 'Cheat sheet created successfully',
      cheat_sheet: newCheatSheet
    });

  } catch (error) {
    console.error('Create cheat sheet error:', error);

    // Clean up uploaded files if database insert fails
    if (req.files) {
      if (req.files.pdf && req.files.pdf[0]) {
        try {
          await fs.unlink(req.files.pdf[0].path);
        } catch (unlinkErr) {
          console.error('Failed to delete uploaded PDF:', unlinkErr);
        }
      }
      if (req.files.preview_image && req.files.preview_image[0]) {
        try {
          await fs.unlink(req.files.preview_image[0].path);
        } catch (unlinkErr) {
          console.error('Failed to delete uploaded preview image:', unlinkErr);
        }
      }
    }

    res.status(500).json({
      error: 'Failed to create cheat sheet',
      message: 'Could not create cheat sheet. Please try again.'
    });
  }
});

/**
 * Update cheat sheet metadata (owner or admin)
 * PATCH /api/cheatsheets/:id/edit
 */
router.patch('/:id/edit', authenticateToken, verifyCheatSheetOwnership, upload.fields([
  { name: 'preview_image', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    course_code,
    semester,
    academic_year,
    year_level,
    exam_type,
    price,
    youtube_links
  } = req.body;

  try {
    // Build update query dynamically (exclude file_path to prevent changing the actual PDF)
    const updates = [];
    const params = [];

    if (title !== undefined && title.trim()) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined && description.trim()) {
      updates.push('description = ?');
      params.push(description.trim());
    }
    if (course_code !== undefined && course_code.trim()) {
      updates.push('course_code = ?');
      params.push(course_code.trim());
    }
    if (semester !== undefined) {
      updates.push('semester = ?');
      params.push(semester || null);
    }
    if (academic_year !== undefined) {
      updates.push('academic_year = ?');
      params.push(academic_year || null);
    }
    if (year_level !== undefined) {
      // Validate year_level
      const validYearLevels = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
      if (year_level && !validYearLevels.includes(year_level)) {
        return res.status(400).json({
          error: 'Invalid year level',
          message: 'Year level must be one of: Freshman, Sophomore, Junior, Senior'
        });
      }
      updates.push('year_level = ?');
      params.push(year_level || null);
    }
    if (exam_type !== undefined) {
      // Validate exam_type
      const validExamTypes = ['Midterm', 'Final', 'Quiz'];
      if (exam_type && !validExamTypes.includes(exam_type)) {
        return res.status(400).json({
          error: 'Invalid exam type',
          message: 'Exam type must be one of: Midterm, Final, Quiz'
        });
      }
      updates.push('exam_type = ?');
      params.push(exam_type || null);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(parseFloat(price));
    }
    if (youtube_links !== undefined) {
      // Parse and validate YouTube links
      let parsedYoutubeLinks = null;
      if (youtube_links) {
        try {
          parsedYoutubeLinks = JSON.parse(youtube_links);
          if (!Array.isArray(parsedYoutubeLinks)) {
            parsedYoutubeLinks = null;
          }
        } catch (e) {
          console.warn('Failed to parse youtube_links:', e);
          parsedYoutubeLinks = null;
        }
      }
      updates.push('youtube_links = ?');
      params.push(parsedYoutubeLinks ? JSON.stringify(parsedYoutubeLinks) : null);
    }

    // Handle preview image upload
    if (req.files && req.files.preview_image) {
      const previewImageFile = req.files.preview_image[0];

      // Sanitize filename
      const sanitizeFilename = (filename) => {
        return filename
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      };

      const sanitizedPreviewName = sanitizeFilename(previewImageFile.originalname);
      const previewDestination = `previews/${Date.now()}-${sanitizedPreviewName}`;

      // Upload to GCS
      const previewImageUrl = await uploadFileToGCS(previewImageFile.path, previewDestination);

      // Clean up local file
      await fs.unlink(previewImageFile.path);

      // Add to updates
      updates.push('preview_image_path = ?');
      params.push(previewImageUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }

    params.push(id);

    await db.update(
      `UPDATE cheat_sheets SET ${updates.join(', ')}, updated_at = NOW() WHERE cheatsheet_id = ?`,
      params
    );

    const updated = await db.queryOne(
      'SELECT * FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    res.json({
      message: 'Cheat sheet updated successfully',
      cheat_sheet: updated
    });

  } catch (error) {
    console.error('Update cheat sheet error:', error);

    // Clean up uploaded file if database update fails
    if (req.files && req.files.preview_image && req.files.preview_image[0]) {
      try {
        await fs.unlink(req.files.preview_image[0].path);
      } catch (unlinkErr) {
        console.error('Failed to delete uploaded preview image:', unlinkErr);
      }
    }

    res.status(500).json({
      error: 'Update failed',
      message: 'Could not update cheat sheet. Please try again.'
    });
  }
});

/**
 * Update cheat sheet (admin only)
 * PUT /api/cheatsheets/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    course_code,
    semester,
    academic_year,
    price,
    is_active
  } = req.body;

  try {
    // Check if cheat sheet exists
    const existing = await db.queryOne(
      'SELECT * FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (course_code !== undefined) {
      updates.push('course_code = ?');
      params.push(course_code);
    }
    if (semester !== undefined) {
      updates.push('semester = ?');
      params.push(semester);
    }
    if (academic_year !== undefined) {
      updates.push('academic_year = ?');
      params.push(academic_year);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(parseFloat(price));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }

    params.push(id);

    await db.update(
      `UPDATE cheat_sheets SET ${updates.join(', ')}, updated_at = NOW() WHERE cheatsheet_id = ?`,
      params
    );

    const updated = await db.queryOne(
      'SELECT * FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    res.json({
      message: 'Cheat sheet updated successfully',
      cheat_sheet: updated
    });

  } catch (error) {
    console.error('Update cheat sheet error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'Could not update cheat sheet. Please try again.'
    });
  }
});

/**
 * Delete cheat sheet (admin only) - soft delete
 * DELETE /api/cheatsheets/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.queryOne(
      'SELECT * FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    // Soft delete by setting is_active to false
    await db.update(
      'UPDATE cheat_sheets SET is_active = FALSE WHERE cheatsheet_id = ?',
      [id]
    );

    res.json({
      message: 'Cheat sheet deleted successfully',
      cheatsheet_id: id
    });

  } catch (error) {
    console.error('Delete cheat sheet error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'Could not delete cheat sheet. Please try again.'
    });
  }
});

/**
 * Download free cheat sheet with watermark
 * GET /api/cheatsheets/:id/download-free
 */
router.get('/:id/download-free', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  try {
    // Get cheat sheet details
    const cheatSheet = await db.queryOne(
      'SELECT cheatsheet_id, title, price, file_path FROM cheat_sheets WHERE cheatsheet_id = ? AND is_active = TRUE',
      [id]
    );

    if (!cheatSheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    // Verify it's actually free
    if (parseFloat(cheatSheet.price) !== 0) {
      return res.status(403).json({
        error: 'Not a free cheat sheet',
        message: 'This cheat sheet requires purchase'
      });
    }

    // Download PDF from Google Cloud Storage
    const pdfBuffer = await downloadFromGCS(cheatSheet.file_path);

    // Save to temporary file for watermarking
    const tempDir = path.join(__dirname, '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // Create watermarked PDF
    const watermarkedFilename = `free_${id}_${userId}_${Date.now()}.pdf`;
    const watermarkedPath = path.join(tempDir, watermarkedFilename);

    // Add watermark
    await addWatermarkToPDF(tempPdfPath, watermarkedPath, {
      name: req.user.name,
      email: req.user.email,
      order_id: 'FREE'
    });

    // Clean up temporary original file
    await fs.unlink(tempPdfPath);

    // Note: purchase_count is automatically updated by 'after_free_download' trigger
    // when download_logs entry is inserted (counts first download per user)

    // Log free download (order_id is NULL for free downloads)
    try {
      await db.insert(
        `INSERT INTO download_logs
         (order_id, user_id, cheatsheet_id, download_ip, user_agent, download_status)
         VALUES (NULL, ?, ?, ?, ?, 'completed')`,
        [
          userId,
          cheatSheet.cheatsheet_id,
          req.ip,
          req.headers['user-agent']
        ]
      );
    } catch (logError) {
      console.error('Failed to log free download:', logError);
      // Don't fail the download if logging fails
    }

    // Send file
    res.download(watermarkedPath, `${cheatSheet.title}.pdf`, async (err) => {
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
    console.error('Free download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: 'Failed to process download. Please try again.'
    });
  }
});

module.exports = router;
