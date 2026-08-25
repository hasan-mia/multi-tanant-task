const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const path = require('path');
const errorMiddleware = require('./middleware/error');
const apiRoutes = require('./routes/index');
const ensureUploadDir = require('./utils/ensureUploadDir');
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim())
  || [
    'http://localhost:3000',
  ];
const app = express();

ensureUploadDir();

app.set('etag', false);
// Middleware
app.use(cookieParser());
// app.use(cors("*"));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: 'File size limit exceeded',
    useTempFiles: false,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use('/files', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Multi-Tenant Project & Task Management API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #5973e6 0%, #2a36eb 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(34, 73, 180, 0.3);
          max-width: 600px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 10px;
        }
        h1 {
          color: #333;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .status {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 30px;
        }
        .info-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          text-align: left;
        }
        .info-section h2 {
          color: #333;
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .endpoint {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #667eea;
          margin-bottom: 10px;
          word-break: break-all;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: white;
          border-radius: 8px;
        }
        .contact-item svg {
          width: 20px;
          height: 20px;
          fill: #667eea;
        }
        .contact-item a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .contact-item a:hover {
          text-decoration: underline;
        }
        .footer {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🧾</div>
        <h1>Multi-Tenant Project & Task Management API</h1>
        <p class="subtitle">Professional Multi-Tenant Project & Task Management System</p>
        <div class="status">✓ API Online</div>

        <div class="info-section">
          <h2>👨‍💻 Developer Contact</h2>
          <div class="contact-info">
            <div class="contact-item">
              <svg viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <a href="mailto:info.hasanrafi@gmail.com">info.hasanrafi@gmail.com</a>
            </div>
            <div class="contact-item">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span style="color: #64748b;">Version: 1.0.0</span>
            </div>
            <div class="contact-item">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.48v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33s1.7.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z"/>
              </svg>
              <a href="https://github.com/hasan-mia" target="_blank">GitHub</a>
            </div>
          </div>
        </div>

        <div class="footer">
          © 2026 Multi-Tenant Project & Task Management API. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `);
});

app.use('/api', apiRoutes);

// Error handlers
app.use(errorMiddleware);

module.exports = app;
