const express = require('express');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');

const router = express.Router();

// Attempt routes secured for student, educator, and admin testing
const attemptGuard = [authMiddleware, roleGuard('STUDENT', 'EDUCATOR', 'ADMIN')];

router.post('/quizzes/:quizId/attempts', ...attemptGuard, studentController.startQuizAttempt);
router.post('/attempts/:attemptId/answers', ...attemptGuard, studentController.saveAttemptAnswer);
router.post('/attempts/:attemptId/check-answer', ...attemptGuard, studentController.checkQuestionAnswer);
router.post('/attempts/:attemptId/submit', ...attemptGuard, studentController.submitQuizAttempt);
router.get('/attempts/:attemptId/results', ...attemptGuard, studentController.getAttemptResults);

module.exports = router;
