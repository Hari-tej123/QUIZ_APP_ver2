const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/questionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');
const { questionUpload, uploadExcel } = require('../middlewares/fileUpload');

const router = express.Router();
const writeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
router.use(authMiddleware);
router.get('/mine', roleGuard('admin', 'faculty', 'educator', 'contributor'), controller.listMine);
router.get('/template', roleGuard('admin', 'faculty', 'educator', 'contributor'), controller.downloadTemplate);
router.post('/bulk-upload', roleGuard('admin', 'faculty', 'educator', 'contributor'), writeLimiter, uploadExcel.single('file'), controller.bulkUpload);
router.post('/', roleGuard('admin', 'faculty', 'educator', 'contributor'), writeLimiter, questionUpload.single('image'), controller.create);
router.put('/:id', roleGuard('admin', 'faculty', 'educator', 'contributor'), writeLimiter, questionUpload.single('image'), controller.update);
router.delete('/:id', roleGuard('admin', 'faculty', 'educator', 'contributor'), writeLimiter, controller.remove);

module.exports = router;