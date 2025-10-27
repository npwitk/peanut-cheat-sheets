const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const cheatSheetRoutes = require('./routes/cheatSheets');
const purchaseRoutes = require('./routes/purchases');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const cartRoutes = require('./routes/cart');
const reviewRoutes = require('./routes/reviews');
const sellerApplicationRoutes = require('./routes/sellerApplications');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { authenticateToken } = require('./middleware/auth');
const { register: metricsRegister, metricsMiddleware } = require('./middleware/metrics');

// Import database connection
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:*"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting - only for API routes, not auth
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/auth'), // Skip rate limit for auth routes
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware (before routes to track all requests)
app.use(metricsMiddleware);

// Session configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 86400000, // 24 hours
});

app.use(session({
  key: 'cheat_sheet_session',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files (uploaded PDFs, images) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Prometheus metrics endpoint with optional authentication for production
app.get('/metrics', (req, res, next) => {
  // Protect metrics endpoint in production with basic auth
  if (process.env.NODE_ENV === 'production' && process.env.METRICS_USERNAME) {
    const auth = req.headers.authorization;

    if (!auth) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Metrics"');
      return res.status(401).send('Authentication required');
    }

    try {
      const [username, password] = Buffer.from(auth.split(' ')[1], 'base64')
        .toString()
        .split(':');

      if (
        username !== process.env.METRICS_USERNAME ||
        password !== process.env.METRICS_PASSWORD
      ) {
        return res.status(401).send('Invalid credentials');
      }
    } catch (error) {
      return res.status(401).send('Invalid authorization header');
    }
  }

  next();
}, async (req, res) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    res.end(await metricsRegister.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version || '1.0.0',
    database: 'checking...',
  };

  // Test database connection
  try {
    await db.query('SELECT 1');
    health.database = 'connected';
    res.status(200).json(health);
  } catch (error) {
    health.status = 'DEGRADED';
    health.database = 'disconnected';
    health.error = error.message;
    res.status(503).json(health);
  }
});

// API routes
app.use('/auth', authRoutes);
app.use('/api/cheatsheets', cheatSheetRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/seller-applications', sellerApplicationRoutes);
app.use('/api/analytics', analyticsRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Cheat Sheet Marketplace API',
    version: '2.0.0',
    description: 'API for Peanut Cheat Sheet Marketplace',
    endpoints: {
      auth: '/auth',
      cheatsheets: '/api/cheatsheets',
      purchases: '/api/purchases',
      payments: '/api/payments',
      admin: '/api/admin',
      support: '/api/support',
      cart: '/api/cart',
    },
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS origin: ${process.env.CLIENT_URL}`);
  console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

module.exports = app;