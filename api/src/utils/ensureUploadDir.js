const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

const ensureUploadDir = () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 });
      console.log(`✓ Created upload directory: ${UPLOAD_DIR}`);
    } else {
      console.log(`✓ Upload directory exists: ${UPLOAD_DIR}`);
    }
  } catch (error) {
    console.error('Error creating upload directory:', error);
    process.exit(1);
  }
};

module.exports = ensureUploadDir;
