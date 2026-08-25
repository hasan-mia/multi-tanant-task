const express = require('express');
const authRouter = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const otpRateLimiter = require('../middleware/otpRateLimiter');
const {
  register,
  login,
  refresh,
  changePassword,
  resetPassword,
  forgotPassword,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const { login: loginValidation, refresh: refreshValidation } = require('../utils/validators');

/*============================================
 * Public routes (no authentication required)
  =============================================*/

authRouter
  .post('/register', register)
  .post('/login', loginValidation, validate, login)
  .post('/refresh', refreshValidation, validate, refresh)
  .post('/forgot-password', forgotPassword);

/*============================================
 *  Protected routes (authentication required)
 =============================================*/

authRouter
  .post('/reset-password', isAuthenticated, resetPassword)
  .post('/change-password', isAuthenticated, changePassword)
  .get('/me', isAuthenticated, getProfile)
  .put('/profile', isAuthenticated, updateProfile);

module.exports = authRouter;
