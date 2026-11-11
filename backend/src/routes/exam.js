const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const authMiddleware = require('../middlewares/authMiddleware');
const { optionalAuth } = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');

// ─── Public read routes (used by student browse + faculty dropdowns) ──────────
// These are prefixed /api/exams and accessible to all authenticated users
router.get('/exams', optionalAuth, examController.listExams);
router.get('/exams/:examId/editions', authMiddleware, examController.listEditions);
router.get('/editions/:editionId/subjects', authMiddleware, examController.listSubjects);
router.get('/subjects/:subjectId/topics', authMiddleware, examController.listTopics);
router.get('/topics/:topicId/quizzes', authMiddleware, examController.listQuizzesByTopic);

// ─── Admin-only write routes ───────────────────────────────────────────────
router.post('/exams', authMiddleware, roleGuard('admin'), examController.createExam);
router.put('/exams/:examId', authMiddleware, roleGuard('admin'), examController.updateExam);
router.delete('/exams/:examId', authMiddleware, roleGuard('admin'), examController.deleteExam);

router.post('/exams/:examId/editions', authMiddleware, roleGuard('admin'), examController.createEdition);
router.put('/editions/:editionId', authMiddleware, roleGuard('admin'), examController.updateEdition);
router.delete('/editions/:editionId', authMiddleware, roleGuard('admin'), examController.deleteEdition);

router.post('/editions/:editionId/subjects', authMiddleware, roleGuard('admin'), examController.createSubject);
router.put('/subjects/:subjectId', authMiddleware, roleGuard('admin'), examController.updateSubject);
router.delete('/subjects/:subjectId', authMiddleware, roleGuard('admin'), examController.deleteSubject);

router.post('/subjects/:subjectId/topics', authMiddleware, roleGuard('admin', 'educator', 'faculty', 'contributor'), examController.createTopic);
router.put('/topics/:topicId', authMiddleware, roleGuard('admin'), examController.updateTopic);
router.delete('/topics/:topicId', authMiddleware, roleGuard('admin'), examController.deleteTopic);

// Admin exam stats
router.get('/exams/stats', authMiddleware, roleGuard('admin'), examController.getExamStats);

module.exports = router;
