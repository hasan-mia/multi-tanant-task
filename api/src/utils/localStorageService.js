const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class localStorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDir() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true, mode: 0o755 });
        console.log(`✓ Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      console.error('Error creating upload directory:', error);
      throw error;
    }
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @param {string} extension - File extension
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName, extension) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const nameWithoutExt = path.basename(
      originalName,
      path.extname(originalName)
    );
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedName}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Upload file to local storage (converts images to WebP)
   * @param {fileUpload.UploadedFile} file
   * @returns {Promise} Upload result
   */
  async uploadFile(file) {
    try {
      // Check if file is an image
      const isImage = file.mimetype && file.mimetype.startsWith('image/');

      let filename;
      let filePath;
      let fileSize;

      if (isImage) {
        // Convert image to WebP
        filename = this.generateUniqueFilename(file.name, '.webp');
        filePath = path.join(this.uploadDir, filename);

        const imageBuffer = await sharp(file.data)
          .webp({ quality: 80 })
          .toBuffer();

        fs.writeFileSync(filePath, imageBuffer);
        fileSize = imageBuffer.length;
      } else {
        // Save non-image files as-is
        const extension = path.extname(file.name);
        filename = this.generateUniqueFilename(file.name, extension);
        filePath = path.join(this.uploadDir, filename);

        fs.writeFileSync(filePath, file.data);
        fileSize = file.data.length;
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Return result object
      return {
        public_id: path.parse(filename).name,
        url: `${this.baseUrl}/files/${filename}`,
        secure_url: `${this.baseUrl}/files/${filename}`,
        format: isImage ? 'webp' : path.extname(filename).slice(1),
        resource_type: isImage ? 'image' : 'raw',
        bytes: fileSize,
        created_at: stats.birthtime.toISOString(),
        filename: filename,
        original_filename: file.name,
        mimetype: isImage ? 'image/webp' : file.mimetype,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to local storage (converts images to WebP)
   * @param {Array|fileUpload.UploadedFile} files - Single file or array of files
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files) {
    try {
      // Convert single file to array for consistent handling
      const fileArray = Array.isArray(files) ? files : [files];

      // Validate file limit (optional - adjust as needed)
      if (fileArray.length > 10) {
        throw new Error('Maximum 10 files allowed per upload');
      }

      // Upload all files in parallel
      const uploadPromises = fileArray.map((file) => this.uploadFile(file));
      const results = await Promise.all(uploadPromises);

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload video to local storage
   * @param {fileUpload.UploadedFile} file - The uploaded video file
   * @returns {Promise} Upload result
   */
  async uploadVideo(file) {
    try {
      const extension = path.extname(file.name);
      const filename = this.generateUniqueFilename(file.name, extension);
      const filePath = path.join(this.uploadDir, filename);

      // Save video file
      fs.writeFileSync(filePath, file.data);

      // Get file stats
      const stats = fs.statSync(filePath);

      // Return Cloudinary-like result object
      return {
        public_id: path.parse(filename).name,
        url: `${this.baseUrl}/files/${filename}`,
        secure_url: `${this.baseUrl}/files/${filename}`,
        format: extension.slice(1),
        resource_type: 'video',
        bytes: file.data.length,
        created_at: stats.birthtime.toISOString(),
        filename: filename,
        original_filename: file.name,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Delete file from local storage
   * @param {string} publicId - The public ID (filename without extension) or full filename
   * @param {string} resourceType - The resource type ('image', 'video', 'raw')
   * @returns {Promise} Delete result
   */
  async deleteFile(publicId, resourceType = 'image') {
    try {
      // Find file in upload directory
      const files = fs.readdirSync(this.uploadDir);

      // Look for file that matches the public_id
      const fileToDelete = files.find((file) => {
        const fileNameWithoutExt = path.parse(file).name;
        return fileNameWithoutExt === publicId || file === publicId;
      });

      if (!fileToDelete) {
        return {
          result: 'not found',
          publicId: publicId,
        };
      }

      const filePath = path.join(this.uploadDir, fileToDelete);

      // Delete the file
      fs.unlinkSync(filePath);

      console.log(publicId, { result: 'ok' });

      return {
        result: 'ok',
        publicId: publicId,
        filename: fileToDelete,
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file information
   * @param {string} filename - The filename
   * @returns {Promise} File information
   */
  async getFileInfo(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filePath);
      const extension = path.extname(filename).slice(1);

      return {
        filename: filename,
        public_id: path.parse(filename).name,
        url: `${this.baseUrl}/files/${filename}`,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime,
        format: extension,
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * List all files in upload directory
   * @returns {Promise<Array>} Array of file information
   */
  async listFiles() {
    try {
      const files = fs.readdirSync(this.uploadDir);

      const fileList = files.map((filename) => {
        const filePath = path.join(this.uploadDir, filename);
        const stats = fs.statSync(filePath);

        return {
          filename: filename,
          public_id: path.parse(filename).name,
          url: `${this.baseUrl}/files/${filename}`,
          size: stats.size,
          created_at: stats.birthtime,
        };
      });

      return fileList;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}

module.exports = localStorageService;
