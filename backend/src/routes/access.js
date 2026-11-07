const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/accessController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');

const router = express.Router();
const requestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
router.use(authMiddleware);
router.post('/', roleGuard('student'), requestLimiter, controller.createRequest);
router.get('/mine', controller.getMyRequest);
router.get('/notifications', controller.getNotifications);

module.exports = router;