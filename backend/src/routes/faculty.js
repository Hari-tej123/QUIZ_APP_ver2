const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');
const { uploadMaterial, uploadExcel } = require('../middlewares/fileUpload');
const { ForbiddenError } = require('../utils/errors');

const checkApproval = (req, res, next) => {
  if (req.user?.approvalStatus === 'PENDING') {
    return next(new ForbiddenError('Awaiting approval. Your faculty account is pending verification by an administrator.'));
  }
  next();
};

// All faculty routes require authentication and faculty role
router.use(authMiddleware, roleGuard('faculty'));

router.post('/courses', checkApproval, facultyController.createCourse);
router.get('/courses', facultyController.getCourses);

// Subtopic creation with study material attachment
router.post('/subtopics', checkApproval, uploadMaterial.single('file'), facultyController.createSubtopic);

router.post('/quizzes', checkApproval, facultyController.createQuiz);
router.get('/quizzes/template', facultyController.downloadTemplate);
router.post('/quizzes/:quizId/questions', checkApproval, uploadExcel.single('file'), facultyController.bulkUploadQuestions);
router.get('/quizzes/:quizId/attempts', facultyController.getQuizAttempts);
router.delete('/quizzes/:quizId/attempts/:attemptId', facultyController.deleteQuizAttempt);
router.get('/quizzes/:quizId/analytics', facultyController.getQuizAnalytics);

module.exports = router;
