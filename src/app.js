const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic rate limiting to protect the service and the upstream GitHub API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please slow down.' }
});
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/profiles/analyze   { "username": "octocat" }',
      list: 'GET  /api/profiles',
      detail: 'GET  /api/profiles/:username',
      refresh: 'POST /api/profiles/:username/refresh',
      remove: 'DELETE /api/profiles/:username',
      health: 'GET  /health'
    }
  });
});

// Routes
app.use('/api/profiles', profileRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
