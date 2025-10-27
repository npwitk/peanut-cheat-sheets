// 404 Not Found middleware

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      type: 'route_not_found',
      suggestion: 'Please check the API documentation for available endpoints'
    }
  });
};

module.exports = { notFound };