const { logError } = require('../utils/utils');
const db = require('../models');
const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

const connectDatabase = async (retries = 5, baseDelay = 2000) => {
  const host = config.host;
  const port = config.port;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Connecting to DB at ${host}:${port}...`);

      await db.sequelize.authenticate();
      console.log('Database connection established.');
      return true;
    } catch (error) {
      logError(`DB connection attempt ${attempt}`, error);

      if (attempt === retries) {
        console.error(
          'Max DB connection attempts reached. Skipping DB operations.'
        );
        return false;
      }

      const jitter = Math.floor(Math.random() * 1000); // random delay
      const delay = baseDelay * attempt + jitter;

      console.warn(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = {
  connectDatabase,
};
