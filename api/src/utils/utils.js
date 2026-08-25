require('dotenv').config();
class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const sendResponse = (
  res,
  statusCode,
  success,
  message,
  payload = {},
  nested = false
) => {
  const response = {
    success,
    message,
    ...(nested ? { data: payload } : payload),
  };

  res.status(statusCode).json(response);
};

// Set cookie with cross-domain compatibility
const setAuthCookie = (res, token) => {
  res.cookie('roshoon_auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
  });
};

const logError = (context, error) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${context}:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
  });
};

const handleError = (res, error) => {
  if (error instanceof ErrorHandler) {
    return sendResponse(res, error.statusCode, false, error.message);
  }
  sendResponse(res, 500, false, error.message || 'Internal Server Error');
};

module.exports = {
  ErrorHandler,
  sendResponse,
  setAuthCookie,
  logError,
  handleError,
};
