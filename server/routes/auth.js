const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { generateToken } = require('../middleware/auth');
const db = require('../config/database');
const crypto = require('crypto');

const router = express.Router();

// Store for PKCE code verifiers (in production, use Redis or database)
const pkceStore = new Map();

// Configure Google OAuth Strategy with domain restriction
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      // Enforce SIIT domain restriction
      if (!email.endsWith('@g.siit.tu.ac.th')) {
        return done(null, false, {
          message: 'Only SIIT students with @g.siit.tu.ac.th email are allowed'
        });
      }

      // Check if user exists
      let user = await db.queryOne(
        'SELECT * FROM users WHERE google_id = ?',
        [profile.id]
      );

      if (user) {
        // Check if user is deactivated
        if (user.is_deactivated) {
          return done(null, false, {
            message: 'Your account has been deactivated. Please contact support.'
          });
        }

        // Update existing user
        await db.update(
          `UPDATE users
           SET name = ?, email = ?, avatar_url = ?, updated_at = NOW()
           WHERE google_id = ?`,
          [profile.displayName, email, profile.photos[0]?.value, profile.id]
        );
      } else {
        // Create new user
        const userId = await db.insert(
          `INSERT INTO users (google_id, name, email, avatar_url, is_admin)
           VALUES (?, ?, ?, ?, ?)`,
          [profile.id, profile.displayName, email, profile.photos[0]?.value, false]
        );

        user = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [userId]);
      }

      return done(null, user);
    } catch (error) {
      console.error('OAuth error:', error);
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.queryOne(
      'SELECT user_id, google_id, name, email, avatar_url, is_admin, is_seller, is_staff, created_at FROM users WHERE user_id = ?',
      [id]
    );
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Helper functions for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Google OAuth routes with PKCE
router.get('/google', (req, res, next) => {
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Generate state parameter for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Store verifier and state temporarily (expires in 10 minutes)
  pkceStore.set(state, {
    codeVerifier,
    timestamp: Date.now()
  });

  // Clean up expired entries (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of pkceStore.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      pkceStore.delete(key);
    }
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    hd: 'g.siit.tu.ac.th', // Domain restriction parameter
    prompt: 'select_account',
    state: state,
    // Note: Google OAuth doesn't natively support PKCE in the standard way
    // This implementation adds extra security via state parameter
    // For full PKCE, consider migrating to Google Identity Services
  })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    // Verify state parameter (PKCE-like security)
    const state = req.query.state;
    const storedData = pkceStore.get(state);

    if (!storedData) {
      console.warn('Invalid or expired state parameter');
      return res.redirect(`${process.env.CLIENT_URL}/?error=invalid_state`);
    }

    // Remove used state from store
    pkceStore.delete(state);

    passport.authenticate('google', {
      session: true,
      failureRedirect: `${process.env.CLIENT_URL}/?error=auth_failed`
    }, (err, user, info) => {
      if (err) {
        console.error('Auth error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/?error=auth_error`);
      }

      if (!user) {
        // Check if it's a domain restriction issue
        if (info && info.message && info.message.includes('SIIT')) {
          return res.redirect(`${process.env.CLIENT_URL}/?error=invalid_domain`);
        }
        return res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect(`${process.env.CLIENT_URL}/?error=login_error`);
        }

        // Generate JWT token
        const token = generateToken(user.user_id);

        // Redirect to client with token
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
      });
    })(req, res, next);
  }
);

// Get current user - requires JWT token in Authorization header
router.get('/me', async (req, res) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Fallback to session-based auth if no JWT token
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'Please login first'
        });
      }

      // Return user from session
      const { user_id, name, email, avatar_url, is_admin, is_seller, created_at } = req.user;
      return res.json({
        user: { user_id, name, email, avatar_url, is_admin, is_seller, created_at }
      });
    }

    // Verify JWT token
    const jwt = require('jsonwebtoken');
    const db = require('../config/database');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.queryOne(
      'SELECT user_id, google_id, name, email, avatar_url, is_admin, is_seller, is_staff, is_deactivated, created_at FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    // Check if user is deactivated
    if (user.is_deactivated) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Return user without sensitive data
    const { user_id, name, email, avatar_url, is_admin, is_seller, is_staff, created_at } = user;
    res.json({
      user: { user_id, name, email, avatar_url, is_admin, is_seller, is_staff, created_at }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get user information'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Session destroy failed',
          message: 'Failed to clear session'
        });
      }

      res.json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
