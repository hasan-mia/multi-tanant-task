require('dotenv').config();
const express = require('express');
const { sendResponse, ErrorHandler } = require('../utils/utils');
const { isAuthenticated } = require('../middleware/auth');
const { extractPublicIdFromUrl } = require('../utils/helper');
const localStorageService = require('../utils/localStorageService');
const localFileRouter = express.Router();

localFileRouter.post('/upload', isAuthenticated, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return sendResponse(res, 400, false, 'No file uploaded');
    }

    const storageService = new localStorageService();
    const files = req.files.file;

    // Check if single file or multiple files
    const isSingleFile = !Array.isArray(files);

    if (isSingleFile) {
      // Handle single file upload
      const data = await storageService.uploadFile(files);

      if (process.env.NODE_ENV !== 'production') {
        console.log('Upload response:', data);
      }
      const fileUrl =
        req.query.source == 'true' ? data : data.secure_url || data.url;
      if (!fileUrl) {
        return sendResponse(
          res,
          500,
          false,
          'Storage service did not return a file URL'
        );
      }

      return sendResponse(
        res,
        200,
        true,
        'File uploaded successfully',
        fileUrl,
        true
      );
    } else {
      // Handle multiple files upload
      const uploadResults = await storageService.uploadMultipleFiles(files);

      if (process.env.NODE_ENV !== 'production') {
        console.log('Upload responses:', uploadResults);
      }

      // Extract URLs from results
      const fileUrls = uploadResults.map((data) => {
        const fileUrl = data.secure_url || data.url;
        if (!fileUrl) {
          throw new Error('Storage service did not return a file URL');
        }
        return fileUrl;
      });

      return sendResponse(
        res,
        200,
        true,
        `${fileUrls.length} file(s) uploaded successfully`,
        fileUrls,
        true
      );
    }
  } catch (error) {
    console.error('File upload error:', error);

    if (error instanceof ErrorHandler) {
      return sendResponse(res, error.statusCode, false, error.message);
    }

    return sendResponse(res, 500, false, error.message || 'File upload failed');
  }
});

localFileRouter.delete('/delete', isAuthenticated, async (req, res) => {
  const { url, resourceType = 'image' } = req.query;
  try {
    const publicId = await extractPublicIdFromUrl(url);

    const storageService = new localStorageService();
    const deleted = await storageService.deleteFile(publicId, resourceType);

    if (!deleted || deleted.result === 'not found') {
      return sendResponse(
        res,
        404,
        false,
        'File not found or failed to delete'
      );
    }

    sendResponse(res, 200, true, 'File deleted successfully', deleted);
  } catch (error) {
    console.error('Delete handler error:', error);
    if (error instanceof ErrorHandler) {
      return sendResponse(res, error.statusCode, false, error.message);
    }
    return sendResponse(res, 500, false, error.message);
  }
});

localFileRouter.post('/video', isAuthenticated, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return sendResponse(res, 400, false, 'No file uploaded');
    }

    const storageService = new localStorageService();
    const data = await storageService.uploadVideo(req.files.file);

    if (!data) {
      return sendResponse(res, 500, false, 'Failed to upload video');
    }

    // For local storage, we return the direct URL instead of playback_url
    const videoUrl = data.secure_url || data.url;

    sendResponse(res, 200, true, 'Video uploaded successfully', videoUrl, true);
  } catch (error) {
    console.error('Video upload error:', error);
    if (error instanceof ErrorHandler) {
      return sendResponse(res, error.statusCode, false, error.message);
    }
    return sendResponse(res, 500, false, error.message);
  }
});

module.exports = localFileRouter;
