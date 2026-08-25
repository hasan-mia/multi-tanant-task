const {
  registerUser,
  loginUser,
  updatePassword,
  resetPassword,
  getProfile,
  forgotPassword,
  updateProfile,
} = require('../services/authService');
const { issueTokenPair, rotateRefreshToken } = require('../services/tokenService');

const catchAsyncError = require('../middleware/catchAsyncError');
const { sendResponse, handleError } = require('../utils/utils');

// Shape the public user object (never includes password_hash).
const shapeUser = (user) => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  role_id: user.role_id,
  role: user.roleRecord ? user.roleRecord.code : null,
  org_id: user.org_id,
  avatar: user.avatar,
});

// Standard token envelope expected by clients (access_token / refresh_token).
const tokenEnvelope = (user, permissions = []) => {
  const { accessToken, refreshToken } = user;
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: shapeUser(user),
    permissions,
  };
};

// Register Controller
exports.register = catchAsyncError(async (req, res) => {
  try {
    const { user, permissions } = await registerUser(req.body);

    const tokens = await issueTokenPair(user);

    sendResponse(
      res,
      201,
      true,
      'User registered successfully',
      tokenEnvelope({ ...user, ...tokens }, permissions),
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

// Login Controller
exports.login = catchAsyncError(async (req, res) => {
  try {
    const { user, permissions } = await loginUser(req.body);

    const tokens = await issueTokenPair(user);

    sendResponse(
      res,
      200,
      true,
      'Login successful',
      tokenEnvelope({ ...user, ...tokens }, permissions),
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

// Refresh Controller (rotation)
exports.refresh = catchAsyncError(async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const { accessToken, refreshToken: newRefreshToken } =
      await rotateRefreshToken(refreshToken);

    sendResponse(
      res,
      200,
      true,
      'Tokens refreshed',
      {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      },
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

// Update Password Controller (when user knows current password)
exports.changePassword = catchAsyncError(async (req, res) => {
  const userId = req.user.id;

  try {
    const { message } = await updatePassword(userId, req.body);

    sendResponse(res, 200, true, message, null, false);
  } catch (error) {
    handleError(res, error);
  }
});

// Forgot Password Controller (Request reset link)
exports.forgotPassword = catchAsyncError(async (req, res) => {
  const { identifier, type = 'email' } = req.body;

  try {
    // Validate required fields
    if (!identifier) {
      return sendResponse(res, 400, false, 'Email or phone number is required');
    }

    // Validate type
    if (!['email', 'phone'].includes(type)) {
      return sendResponse(res, 400, false, "Type must be 'email' or 'phone'");
    }

    const result = await forgotPassword(identifier, type);

    sendResponse(
      res,
      200,
      true,
      result.message,
      {
        method: result.method,
        // Include link in development for testing
        ...(process.env.NODE_ENV === 'development' && {
          verifyLink: result.verifyLink,
        }),
      },
      false
    );
  } catch (error) {
    handleError(res, error);
  }
});

// Reset Password Controller (when user forgets password)
exports.resetPassword = catchAsyncError(async (req, res) => {
  const userId = req.user.id;

  try {
    const { message } = await resetPassword(userId, req.body);

    sendResponse(res, 200, true, message, null, false);
  } catch (error) {
    handleError(res, error);
  }
});

// Update Profile Controller
exports.updateProfile = catchAsyncError(async (req, res) => {
  const userId = req.user.id;

  try {
    const data = await updateProfile(userId, req.body);

    sendResponse(res, 200, true, 'Profile updated successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});

// Get Current User Profile Controller
exports.getProfile = catchAsyncError(async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getProfile(userId);

    sendResponse(res, 200, true, 'Profile retrieved successfully', data, true);
  } catch (error) {
    handleError(res, error);
  }
});
