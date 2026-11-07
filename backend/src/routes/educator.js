const express = require('express');
const rateLimit = require('express-rate-limit');
const educatorController = require('../controllers/educatorController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');
const { educatorProofUpload } = require('../middlewares/fileUpload');

const router = express.Router();
const applicationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false });
router.get('/taxonomy-options', authMiddleware, roleGuard('STUDENT'), educatorController.listTaxonomyOptions);
router.post('/', authMiddleware, roleGuard('STUDENT'), applicationLimiter, educatorProofUpload.single('proof'), educatorController.createApplication);
router.get('/mine', authMiddleware, educatorController.getMyApplication);

module.exports = router;