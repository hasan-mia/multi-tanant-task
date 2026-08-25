const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { ErrorHandler } = require('../utils/utils');
const { getRolePermissionCodes } = require('../utils/permissions');
const { sendSMTPSingleEmail } = require('../utils/mailSmsService');
const { sendVerificationLinkTemplate } = require('../utils/mailBody');
const { generateJWT, extractPublicIdFromUrl } = require('../utils/helper');
const CloudinaryService = require('../utils/CloudinaryService');

// Register User Function
const registerUser = async (data) => {
  try {
    const { email, password, first_name, last_name, ...restData } = data;

    if (!email || !password || !first_name || !last_name) {
      throw new ErrorHandler('Missing required field', 400);
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) throw new ErrorHandler('Email already exists', 400);

    const role = await Role.findOne({ where: { name: 'User' } });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const validAttributes = Object.keys(User.rawAttributes);
    const invalidKeys = Object.keys(restData).filter(
      (key) => !validAttributes.includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ErrorHandler(
        `${invalidKeys.join(', ')} is not a valid field`,
        400
      );
    }

    // Create user
    const newUser = await User.create({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      role_id: role.id || null,
      status: 'active',
      ...restData,
    });

    // Reload user with role included
    const userWithRole = await User.findByPk(newUser.id, {
      include: [
        {
          model: Role,
          as: 'roleRecord',
          attributes: ['id', 'name', 'code', 'description'],
        },
      ],
    });

    if (!userWithRole)
      throw new ErrorHandler('User not found after creation', 500);

    // Permissions resolved dynamically from the user's role (score-free).
    const permissions = await getRolePermissionCodes(userWithRole.role_id);

    // Remove sensitive info
    const userResponse = { ...userWithRole.toJSON() };
    delete userResponse.password_hash;
    // Expose the stable role code so clients can drive role-aware UI.
    userResponse.role = userWithRole.roleRecord?.code ?? null;

    return {
      user: userResponse,
      permissions,
    };
  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const validationMessages = error.errors.map((e) => e.message).join(', ');
      throw new ErrorHandler(validationMessages, error.statusCode || 400);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Login User Function
const loginUser = async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new ErrorHandler('Email and password are required', 400);
  }

  try {
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'roleRecord',
          attributes: ['id', 'name', 'code', 'description'],
        },
      ],
    });

    if (!user) throw new ErrorHandler('User not found', 404);

    // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new ErrorHandler('Invalid credentials', 400);

    // Update last login
    await User.update({ last_login: new Date() }, { where: { id: user.id } });

    // Permissions resolved dynamically from the user's role (score-free).
    const permissions = await getRolePermissionCodes(user.role_id);

    // Remove sensitive data
    const userResponse = { ...user.toJSON() };
    delete userResponse.password_hash;
    // Expose the stable role code so clients can drive role-aware UI.
    userResponse.role = user.roleRecord?.code ?? null;

    return {
      user: userResponse,
      permissions,
    };
  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const validationMessages = error.errors.map((e) => e.message).join(', ');
      throw new ErrorHandler(validationMessages, error.statusCode || 400);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Password Update Function
const updatePassword = async (userId, data) => {
  const { password, newPassword, confirmPassword } = data;

  try {
    if (!password || !newPassword || !confirmPassword) {
      throw new ErrorHandler('All password fields are required', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) throw new ErrorHandler('User not found', 404);

    // If currentPassword is provided, verify it (for password change)
    if (password) {
    const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch)
        throw new ErrorHandler('Current password is incorrect', 400);
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      throw new ErrorHandler('New passwords do not match', 400);
    }

    // Validate password strength (optional)
    if (newPassword.length < 6) {
      throw new ErrorHandler(
        'Password must be at least 6 characters long',
        400
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.update({ password_hash: hashedPassword }, { where: { id: userId } });

    return {
      message: 'Password updated successfully',
    };
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Request OTP for Verification Function
const forgotPassword = async (identifier, type = 'email') => {
  try {
    // Find user by email or phone
    const whereClause =
      type === 'phone' ? { phone: identifier } : { email: identifier };

    console.log(identifier);

    const user = await User.findOne({
      where: whereClause,
      attributes: ['id', 'email', 'phone', 'first_name', 'last_name'],
    });
    if (!user) throw new ErrorHandler('User not found', 404);

    const token = generateJWT({ id: user.id }, '7d');

    // Verification link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/admin/reset-password?token=${token}`;

    // Send email or SMS
    if (type === 'email') {
      sendSMTPSingleEmail({
        to: user.email,
        subject: 'Reset Your Password',
        html: sendVerificationLinkTemplate({ user, verifyLink }),
        // text: `Hi ${user.first_name},\nPlease verify your email: ${verifyLink}`, // optional plain text fallback
      });
    } else if (type === 'phone') {
      console.log(`Verification link for phone (mock): ${verificationUrl}`);
    }

    return {
      message: `Link sent to ${type}`,
      method: type,
      // ...(process.env.NODE_ENV === "development" && { verifyLink }),
    };
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Reset Password (when user forgets password)
const resetPassword = async (userId, data) => {
  const { newPassword, confirmPassword } = data;
  try {
    // Find user by email or phone
    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) throw new ErrorHandler('User not found', 404);

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      throw new ErrorHandler('Passwords do not match', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.update({ password_hash: hashedPassword }, { where: { id: user.id } });

    return {
      message: 'Password reset successfully',
    };
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Update Profile
const updateProfile = async (userId, data) => {
  try {
    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) throw new ErrorHandler('User not found', 404);

    // Validate data
    const validAttributes = Object.keys(User.rawAttributes);
    const invalidKeys = Object.keys(data).filter(
      (key) => !validAttributes.includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ErrorHandler(
        `${invalidKeys.join(', ')} is not a valid field`,
        400
      );
    }
    // Delete existing image if have one
    if (data?.avatar && user?.avatar && user?.avatar !== data?.avatar) {
      const publicKey = await extractPublicIdFromUrl(user?.avatar);
      const cloudinaryService = new CloudinaryService();
      const deleted = await cloudinaryService.deleteFile(publicKey);
      if (!deleted) {
        throw new ErrorHandler('Failed to deleted file', 400);
      }
    }
    const result = await user.update(data);

    return result;
  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      const validationMessages = error.errors.map((e) => e.message).join(', ');
      throw new ErrorHandler(validationMessages, error.statusCode || 400);
    }
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

// Get user profile with permissions
const getProfile = async (userId) => {
  try {
    const user = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: Role,
          as: 'roleRecord',
          attributes: ['name'],
        },
      ],
      attributes: {
        exclude: ['password_hash', 'updated_at', 'role_id', 'last_login', 'otp'],
      },
    });

    if (!user) {
      throw new ErrorHandler('User not found', 404);
    }

    // Permissions resolved dynamically from the user's role (score-free).
    const permissions = await getRolePermissionCodes(user.role_id);

    const result = {
      ...user.toJSON(),
      role: user.roleRecord?.code ?? null,
      permissions,
    };

    return result;
  } catch (error) {
    throw new ErrorHandler(error.message, error.statusCode || 500);
  }
};

module.exports = {
  registerUser,
  loginUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  getProfile,
};
