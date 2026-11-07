const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/google', loginLimiter, authController.startGoogleAuth);
router.get('/google/callback', loginLimiter, authController.googleCallback);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
