const { AppError } = require('../utils/errors');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥:', err);
  }

  // Handle specific database errors
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors.map(el => el.message).join('. ');
    err.statusCode = 400;
    err.status = 'fail';
    error = new AppError(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401);
  }

  if (!error.isOperational) {
    error = new AppError('Something went wrong on the server.', 500);
  }

  const body = {
    status: error.status || err.status,
    message: error.message || 'Something went wrong on the server'
  };
  // Forward field-level validation errors when present
  if (error.errors || err.errors) {
    body.errors = error.errors || err.errors;
  }
  res.status(error.statusCode || err.statusCode).json(body);
};
