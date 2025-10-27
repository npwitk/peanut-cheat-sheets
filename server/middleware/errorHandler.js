// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate entry found';
    error = {
      message,
      statusCode: 409,
      type: 'duplicate_entry'
    };
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Referenced record does not exist';
    error = {
      message,
      statusCode: 400,
      type: 'foreign_key_constraint'
    };
  }

  // MySQL connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    const message = 'Database connection failed';
    error = {
      message,
      statusCode: 500,
      type: 'database_connection'
    };
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      type: 'validation_error'
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401,
      type: 'invalid_token'
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401,
      type: 'token_expired'
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      message,
      statusCode: 413,
      type: 'file_too_large'
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = {
      message,
      statusCode: 413,
      type: 'too_many_files'
    };
  }

  // Payment errors
  if (err.type === 'payment_error') {
    error = {
      message: err.message || 'Payment processing failed',
      statusCode: 402,
      type: 'payment_error'
    };
  }

  // Cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = {
      message,
      statusCode: 400,
      type: 'invalid_id'
    };
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = {
      message,
      statusCode: 429,
      type: 'rate_limit_exceeded'
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const response = {
    success: false,
    error: {
      message,
      type: error.type || 'internal_error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  };

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };