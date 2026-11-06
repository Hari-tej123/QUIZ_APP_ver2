const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');
const { uploadMaterial, uploadExcel } = require('../middlewares/fileUpload');

// All faculty routes require authentication and faculty role
router.use(authMiddleware, roleGuard('faculty'));

router.post('/courses', facultyController.createCourse);
router.get('/courses', facultyController.getCourses);

// Subtopic creation with study material attachment
router.post('/subtopics', uploadMaterial.single('file'), facultyController.createSubtopic);

router.post('/quizzes', facultyController.createQuiz);
router.get('/quizzes/template', facultyController.downloadTemplate);
router.post('/quizzes/:quizId/questions', uploadExcel.single('file'), facultyController.bulkUploadQuestions);
router.get('/quizzes/:quizId/attempts', facultyController.getQuizAttempts);
router.delete('/quizzes/:quizId/attempts/:attemptId', facultyController.deleteQuizAttempt);
router.get('/quizzes/:quizId/analytics', facultyController.getQuizAnalytics);

module.exports = router;
