const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

const { Institute } = require('../config/database');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'test' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test'
});

router.post('/register', authController.register);
router.post('/register/student', (req, res, next) => {
  req.body.role = 'student';
  return authController.register(req, res, next);
});
router.post('/register/faculty', (req, res, next) => {
  req.body.role = 'faculty';
  return authController.register(req, res, next);
});
router.post('/complete-profile', authMiddleware, authController.completeProfile);
router.get('/institutes', async (req, res, next) => {
  try {
    const institutes = await Institute.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    res.status(200).json({
      status: 'success',
      results: institutes.length,
      data: institutes
    });
  } catch (err) {
    next(err);
  }
});
router.post('/login', loginLimiter, authController.login);
router.get('/google', loginLimiter, authController.startGoogleAuth);
router.get('/google/callback', loginLimiter, authController.googleCallback);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
