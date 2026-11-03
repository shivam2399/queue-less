const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');
const { ZodError } = require('zod');
const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Zod validation error
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  // Sequelize Unique Constraint
  if (err instanceof UniqueConstraintError) {
    const details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return sendError(res, 'A record with this identifier already exists', 409, 'CONFLICT', details);
  }

  // Sequelize Foreign Key Constraint
  if (err instanceof ForeignKeyConstraintError) {
    return sendError(res, 'Referenced entity not found', 400, 'INVALID_REFERENCE');
  }

  // Custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // Unexpected server error
  console.error('Unhandled Server Error:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : (err.message || 'Internal server error');

  return sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
}

function notFoundHandler(req, res, next) {
  return sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND');
}

module.exports = {
  errorHandler,
  notFoundHandler
};
