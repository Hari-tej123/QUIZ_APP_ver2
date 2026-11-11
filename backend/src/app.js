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

// Trust reverse proxy (Render, Vercel, Railway, etc.) for secure cookies & rate-limiting
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows files (materials) to be downloaded across origins
}));

// Implement CORS
const defaultOrigins = [
  'https://quiz-app-ver2-beta.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

const envOrigins = [
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

const allowedOrigins = [...defaultOrigins, ...envOrigins]
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  // Automatically allow any vercel preview deployment for this project
  if (/^https:\/\/quiz-app-ver2.*\.vercel\.app$/.test(normalized)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie', 'X-CSRF-Token'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes BEFORE rate-limiting
app.options('/{*splat}', cors(corsOptions));

// Body parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF / Origin verification middleware
app.use((req, res, next) => {
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (!isMutation) return next();

  // Authentication endpoints create/destroy sessions and are origin-verified by CORS
  if (req.originalUrl.includes('/api/auth/')) return next();

  // Requests with Bearer tokens or no session cookie do not use cookie-based auth
  if (!req.cookies?.session || req.headers.authorization) return next();

  // If request comes from an allowed origin (verified via CORS & Origin header)
  const origin = req.get('Origin');
  if (origin && isOriginAllowed(origin)) {
    return next();
  }

  // Double-submit CSRF cookie check
  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.get('X-CSRF-Token');
  if (cookieToken && headerToken && cookieToken === headerToken) {
    return next();
  }

  return res.status(403).json({ status: 'fail', message: 'Request could not be verified.' });
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
