const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Booking } = require('../models');
const { ErrorHandler } = require('./utils');
const generateJWT = (
  payload,
  expiresIn = process.env.JWT_EXPIRES_IN || '1500m',
  JWT
) => {
  return jwt.sign(payload, JWT ?? process.env.JWT_SECRET, { expiresIn });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateOrderNumber = (prefix = 'ORD') => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(3).toString('hex');
  return `${prefix}${timestamp.toUpperCase()}${randomPart.toUpperCase()}`;
};

const generateConfirmationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 9; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const formatDateTime = (date, time, timezone) => {
  const [timeStr, period] = time.split(' ');
  const [hours, minutes] = timeStr.split(':').map(Number);
  let hour24 = hours;

  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;

  const dateStr = new Date(date).toISOString().split('T')[0];
  return `${dateStr}T${hour24.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:00`;
};

const generateBookingNumber = async () => {
  const prefix = 'BK';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Find the last booking number for today
  const lastBooking = await Booking.findOne({
    where: {
      booking_number: {
        [Op.like]: `${prefix}-${year}${month}%`,
      },
    },
    order: [['created_at', 'DESC']],
  });

  let sequence = 1;
  if (lastBooking) {
    const lastSequence = parseInt(lastBooking.booking_number.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${year}${month}${String(sequence).padStart(6, '0')}`;
};

const isValidateData = (rawAttributes, data) => {
  const validAttributes = Object.keys(rawAttributes);
  const invalidKeys = Object.keys(data).filter(
    (key) => !validAttributes.includes(key)
  );
  if (invalidKeys.length > 0) {
    return (`${invalidKeys.join(', ')} is not a valid field`, 400);
  }
};

const generateSlug = async (Model, name) => {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0980-\u09FF-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Fallback if slug is empty
  if (!baseSlug) {
    baseSlug = 'item';
  }

  let slug = baseSlug;

  const existingSlugs = await Model.findAll({
    where: {
      slug: {
        [Op.like]: `${baseSlug}%`,
      },
    },
    attributes: ['slug'],
  });

  if (existingSlugs.length === 0) {
    return slug;
  }

  const numbers = existingSlugs
    .map((item) => {
      const match = item.slug.match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .sort((a, b) => a - b);

  const nextNumber = numbers[numbers.length - 1] + 1;

  slug = `${baseSlug}-${nextNumber}`;
  return slug;
};

/**
 * Extract public ID from Cloudinary URL or Local Storage URL
 * Works with both Cloudinary and local file URLs
 *
 * Examples:
 * Cloudinary: https://res.cloudinary.com/.../image/upload/v1234/sample_abc123.jpg
 * Local: http://localhost:3000/files/sample_abc123.webp
 *
 * @param {string} url - The file URL
 * @returns {Promise<string>} The public ID (filename without extension)
 */
const extractPublicIdFromUrl = async (url) => {
  try {
    if (!url) {
      throw new Error('URL is required');
    }

    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
      // Extract Cloudinary public_id
      // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');

      if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL format');
      }

      // Get everything after 'upload/' and before the file extension
      const publicIdWithVersion = parts.slice(uploadIndex + 1).join('/');

      // Remove version (v1234567890) if present
      const publicIdParts = publicIdWithVersion.split('/');
      const versionRemoved = publicIdParts.filter(
        (part) => !part.startsWith('v') || isNaN(part.substring(1))
      );

      // Remove file extension
      const fullPath = versionRemoved.join('/');
      const publicId =
        fullPath.substring(0, fullPath.lastIndexOf('.')) || fullPath;

      return publicId;
    } else {
      // Handle local storage URL
      // Format: http://localhost:3000/files/filename_123_abc.webp
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract filename from path
      const filename = pathname.split('/').pop();

      if (!filename) {
        throw new Error('Could not extract filename from URL');
      }

      // Remove file extension to get public_id
      const publicId =
        filename.substring(0, filename.lastIndexOf('.')) || filename;

      return publicId;
    }
  } catch (error) {
    console.error('Error extracting public ID:', error);
    throw new Error(`Failed to extract public ID from URL: ${error.message}`);
  }
};

/**
 * Extract full filename from local storage URL
 * @param {string} url - The file URL
 * @returns {string} The full filename with extension
 */
const extractFilenameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();

    if (!filename) {
      throw new Error('Could not extract filename from URL');
    }

    return filename;
  } catch (error) {
    console.error('Error extracting filename:', error);
    throw new Error(`Failed to extract filename from URL: ${error.message}`);
  }
};

/**
 * Validate if URL is from local storage or Cloudinary
 * @param {string} url - The file URL
 * @returns {object} Validation result with type
 */
const validateFileUrl = (url) => {
  try {
    const urlObj = new URL(url);

    if (url.includes('cloudinary.com')) {
      return {
        isValid: true,
        type: 'cloudinary',
        domain: urlObj.hostname,
      };
    } else if (urlObj.pathname.includes('/files/')) {
      return {
        isValid: true,
        type: 'local',
        domain: urlObj.hostname,
      };
    } else {
      return {
        isValid: false,
        type: 'unknown',
        domain: urlObj.hostname,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      type: 'invalid',
      error: error.message,
    };
  }
};

/**
 * Get file extension from URL
 * @param {string} url - The file URL
 * @returns {string} The file extension (e.g., 'webp', 'mp4', 'pdf')
 */
const getFileExtension = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop();

    return extension || '';
  } catch (error) {
    console.error('Error getting file extension:', error);
    return '';
  }
};

/**
 * Check if URL points to an image
 * @param {string} url - The file URL
 * @returns {boolean} True if image, false otherwise
 */
const isImageUrl = (url) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const extension = getFileExtension(url).toLowerCase();
  return imageExtensions.includes(extension);
};

/**
 * Check if URL points to a video
 * @param {string} url - The file URL
 * @returns {boolean} True if video, false otherwise
 */
const isVideoUrl = (url) => {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm3u8'];
  const extension = getFileExtension(url).toLowerCase();
  return videoExtensions.includes(extension);
};

module.exports = {
  generateJWT,
  generateOtp,
  generateOrderNumber,
  generateConfirmationCode,
  formatDateTime,
  generateBookingNumber,
  generateSlug,
  isValidateData,
  extractPublicIdFromUrl,
  extractFilenameFromUrl,
  validateFileUrl,
  getFileExtension,
  isImageUrl,
  isVideoUrl,
};
