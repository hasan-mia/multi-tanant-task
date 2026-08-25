const { ErrorHandler } = require('../utils/utils');

module.exports = (err, _, res, __) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Sequelize Validation Error (model level validation fail)
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map((e) => e.message).join(', ');
    err = new ErrorHandler(message, 400);
  }

  // Sequelize Unique Constraint (duplicate entry)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path).join(', ');
    const message = `Duplicate value entered for: ${fields}`;
    err = new ErrorHandler(message, 409);
  }

  // Sequelize Foreign Key Constraint
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = `Invalid reference: related record not found`;
    err = new ErrorHandler(message, 400);
  }

  // Sequelize Database Error (syntax error, wrong column, etc.)
  if (err.name === 'SequelizeDatabaseError') {
    const message = `Database error: ${err.message}`;
    err = new ErrorHandler(message, 500);
  }

  // Sequelize Connection Error
  if (err.name === 'SequelizeConnectionError' ||
      err.name === 'SequelizeConnectionRefusedError' ||
      err.name === 'SequelizeHostNotFoundError' ||
      err.name === 'SequelizeAccessDeniedError') {
    const message = `Database connection failed`;
    err = new ErrorHandler(message, 503);
  }

  // Sequelize Timeout
  if (err.name === 'SequelizeConnectionTimedOutError' ||
      err.name === 'SequelizeTimeoutError') {
    const message = `Database request timed out, please try again`;
    err = new ErrorHandler(message, 503);
  }

  // Wrong JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = `JSON Web Token is invalid, try again`;
    err = new ErrorHandler(message, 401);
  }

  // JWT Expire error
  if (err.name === 'TokenExpiredError') {
    const message = `JSON Web Token is expired, try again`;
    err = new ErrorHandler(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
