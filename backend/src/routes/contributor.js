const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const contributorController = require('../controllers/contributorController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');
const { validateContributorTrack } = require('../middlewares/trackGuard');
const quizWorkflowController = require('../controllers/quizWorkflowController');

// Setup multer storage for materials and excel upload
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// All contributor routes require authentication & contributor/faculty/admin role
router.use(authMiddleware);
router.use(roleGuard('contributor', 'faculty', 'admin'));

// Contributor Dashboard stats & hierarchy tree
router.get('/stats', contributorController.getDashboardStats);
router.get('/hierarchy', contributorController.getHierarchyTree);

// Quizzes management
router.get('/quizzes', contributorController.getMyQuizzes);
router.post('/quizzes', validateContributorTrack, contributorController.createQuiz);
router.put('/quizzes/:quizId', validateContributorTrack, quizWorkflowController.updateDraft);
router.post('/quizzes/:quizId/submit', quizWorkflowController.submitForReview);
router.post('/quizzes/:quizId/publish', quizWorkflowController.directPublish);
router.post('/quizzes/:quizId/archive', quizWorkflowController.archive);
router.post('/quizzes/bulk-upload', memoryUpload.single('file'), contributorController.bulkUploadQuestions);
router.get('/quizzes/template', contributorController.getSampleTemplate);

// Study Materials management
router.get('/materials', contributorController.getMyMaterials);
router.post('/materials', upload.single('file'), contributorController.createStudyMaterial);

// Submissions review status
router.get('/submissions', contributorController.getMySubmissions);

// Payouts and withdrawals
router.get('/payouts', contributorController.getPayouts);
router.post('/payouts/withdraw', contributorController.requestWithdrawal);

module.exports = router;
