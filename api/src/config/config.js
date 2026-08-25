require("dotenv").config();

const isSSL = process.env.DB_SSL === "true";

const dialectOptions = {
  ...(isSSL && {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  }),
  charset: 'utf8mb4',
};

const baseConfig = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_TYPE || "mysql",
  dialectOptions,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  },
};

module.exports = {
  development: { ...baseConfig },
  test: { ...baseConfig },
  production: { ...baseConfig, logging: false },
};