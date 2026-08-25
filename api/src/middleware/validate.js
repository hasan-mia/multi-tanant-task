const { validationResult } = require("express-validator");
const { ErrorHandler } = require("../utils/utils");

// Centralized validation-result handler. Returns 422 with joined messages.
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(", ");
    return next(new ErrorHandler(message, 422));
  }
  next();
};
