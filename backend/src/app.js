const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./utils/errors');

const app = express();

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows files (materials) to be downloaded across origins
}));

// Implement CORS
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Body parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (!isMutation || !req.cookies?.session || req.headers.authorization) return next();
  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.get('X-CSRF-Token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ status: 'fail', message: 'Request could not be verified.' });
  }
  next();
});

// Static files for study materials downloads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Limit requests from same IP (security)
const limiter = rateLimit({
  max: 200, // limit each IP to 200 requests per windowMs
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', routes);

// Handle undefined routes
app.all('/*splat', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server.`));
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
