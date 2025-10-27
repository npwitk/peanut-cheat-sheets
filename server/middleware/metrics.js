/**
 * Prometheus Metrics Middleware
 * This file sets up metrics collection for monitoring application performance
 */

const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'peanut_',
  labels: { app: 'peanut_marketplace' }
});

// Custom Metrics

// 1. HTTP Request Duration (histogram)
const httpRequestDuration = new client.Histogram({
  name: 'peanut_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5] // Response time buckets in seconds
});
register.registerMetric(httpRequestDuration);

// 2. HTTP Request Counter
const httpRequestCounter = new client.Counter({
  name: 'peanut_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestCounter);

// 3. Active Users Gauge (current number of authenticated users)
const activeUsersGauge = new client.Gauge({
  name: 'peanut_active_users',
  help: 'Number of currently active authenticated users'
});
register.registerMetric(activeUsersGauge);

// 4. Database Query Duration
const dbQueryDuration = new client.Histogram({
  name: 'peanut_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});
register.registerMetric(dbQueryDuration);

// 5. File Upload Counter
const fileUploadCounter = new client.Counter({
  name: 'peanut_file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['status']
});
register.registerMetric(fileUploadCounter);

// 6. Purchase Counter
const purchaseCounter = new client.Counter({
  name: 'peanut_purchases_total',
  help: 'Total number of purchases',
  labelNames: ['status']
});
register.registerMetric(purchaseCounter);

// 7. Download Counter
const downloadCounter = new client.Counter({
  name: 'peanut_downloads_total',
  help: 'Total number of cheat sheet downloads'
});
register.registerMetric(downloadCounter);

// 8. Error Counter
const errorCounter = new client.Counter({
  name: 'peanut_errors_total',
  help: 'Total number of application errors',
  labelNames: ['error_type', 'route']
});
register.registerMetric(errorCounter);

/**
 * Express middleware to track HTTP requests
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };

    // Record metrics
    httpRequestDuration.observe(labels, duration);
    httpRequestCounter.inc(labels);

    // Track errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      errorCounter.inc({
        error_type: res.statusCode >= 500 ? 'server_error' : 'client_error',
        route: route
      });
    }
  });

  next();
}

/**
 * Update active users count
 */
function updateActiveUsers(count) {
  activeUsersGauge.set(count);
}

/**
 * Track database query
 */
function trackDbQuery(queryType, durationMs) {
  dbQueryDuration.observe({ query_type: queryType }, durationMs / 1000);
}

/**
 * Track file upload
 */
function trackFileUpload(status = 'success') {
  fileUploadCounter.inc({ status });
}

/**
 * Track purchase
 */
function trackPurchase(status = 'completed') {
  purchaseCounter.inc({ status });
}

/**
 * Track download
 */
function trackDownload() {
  downloadCounter.inc();
}

/**
 * Track error
 */
function trackError(errorType, route = 'unknown') {
  errorCounter.inc({ error_type: errorType, route });
}

module.exports = {
  register,
  metricsMiddleware,
  updateActiveUsers,
  trackDbQuery,
  trackFileUpload,
  trackPurchase,
  trackDownload,
  trackError,

  // Export individual metrics for direct access if needed
  metrics: {
    httpRequestDuration,
    httpRequestCounter,
    activeUsersGauge,
    dbQueryDuration,
    fileUploadCounter,
    purchaseCounter,
    downloadCounter,
    errorCounter
  }
};
