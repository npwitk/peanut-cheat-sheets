const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data from database (include is_deactivated)
    const user = await db.queryOne(
      'SELECT user_id, google_id, name, email, is_admin, is_seller, is_staff, is_deactivated, created_at FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User associated with this token no longer exists'
      });
    }

    // Check if user is deactivated
    if (user.is_deactivated) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify email domain
    if (!user.email.endsWith('@g.siit.tu.ac.th')) {
      return res.status(403).json({
        error: 'Invalid domain',
        message: 'Only SIIT students are allowed'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid authentication token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first'
    });
  }

  if (!req.user.is_admin) {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Only administrators can access this resource'
    });
  }

  next();
};

// Middleware to check if user is staff or admin (can manage approvals)
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first'
    });
  }

  if (!req.user.is_admin && !req.user.is_staff) {
    return res.status(403).json({
      error: 'Staff access required',
      message: 'Only staff and administrators can access this resource'
    });
  }

  next();
};

// Middleware to check if user can upload (admin or seller)
const requireUploader = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login first'
    });
  }

  if (!req.user.is_admin && !req.user.is_seller) {
    return res.status(403).json({
      error: 'Uploader access required',
      message: 'Only sellers and administrators can upload cheat sheets'
    });
  }

  next();
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.queryOne(
      'SELECT user_id, google_id, name, email, is_admin, is_seller, is_staff, is_deactivated, created_at FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    // Only set req.user if user exists, is not deactivated, and has valid domain
    if (user && !user.is_deactivated && user.email.endsWith('@g.siit.tu.ac.th')) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    // Silently fail for optional auth
    req.user = null;
  }

  next();
};

// Middleware to validate SIIT email domain
const validateSIITDomain = (req, res, next) => {
  const { email } = req.body;
  
  if (!email || !email.endsWith('@g.siit.tu.ac.th')) {
    return res.status(403).json({
      error: 'Invalid email domain',
      message: 'Only SIIT students with @g.siit.tu.ac.th email are allowed'
    });
  }

  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '3d' }
  );
};

// Verify if user can access specific cheat sheet (for downloads)
const verifyCheatSheetAccess = async (req, res, next) => {
  const { cheatsheetId } = req.params;
  const userId = req.user.user_id;

  try {
    // Check if user has purchased this cheat sheet
    const purchase = await db.queryOne(`
      SELECT order_id, payment_status, purchase_date
      FROM purchases
      WHERE user_id = ? AND cheatsheet_id = ? AND payment_status = 'paid'
    `, [userId, cheatsheetId]);

    if (!purchase) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You must purchase this cheat sheet to download it'
      });
    }

    req.purchase = purchase;
    next();
  } catch (error) {
    console.error('Access verification error:', error);
    res.status(500).json({
      error: 'Verification error',
      message: 'An error occurred while verifying access'
    });
  }
};

// Middleware to verify cheat sheet ownership (for editing)
const verifyCheatSheetOwnership = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  try {
    // Check if cheat sheet exists and get creator
    const cheatSheet = await db.queryOne(
      'SELECT cheatsheet_id, created_by FROM cheat_sheets WHERE cheatsheet_id = ?',
      [id]
    );

    if (!cheatSheet) {
      return res.status(404).json({
        error: 'Cheat sheet not found',
        message: 'The specified cheat sheet does not exist'
      });
    }

    // Allow admins or the creator to edit
    if (!req.user.is_admin && cheatSheet.created_by !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only edit your own cheat sheets'
      });
    }

    req.cheatSheet = cheatSheet;
    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    res.status(500).json({
      error: 'Verification error',
      message: 'An error occurred while verifying ownership'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStaff,
  requireUploader,
  optionalAuth,
  validateSIITDomain,
  generateToken,
  verifyCheatSheetAccess,
  verifyCheatSheetOwnership
};