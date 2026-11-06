const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
app.use(cors({
  origin: '*', // For demo. In production, restrict to frontend domain.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for study materials downloads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
