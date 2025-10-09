module.exports = function errorHandler(err, req, res, next) {
  console.error('ERROR:', err && err.stack ? err.stack : err);
  
  // Default error
  let status = 500;
  let message = 'Internal server error';
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate field value. This value already exists.';
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }
  
  // Custom application errors
  if (err.status) {
    status = err.status;
    message = err.message;
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Something went wrong. Please try again later.';
  }
  
  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
