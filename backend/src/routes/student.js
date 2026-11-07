const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');

// All student routes require authentication and student role
router.use(authMiddleware, roleGuard('student'));

// Courses & Enrollment
router.get('/courses/available', studentController.getAvailableCourses);
router.post('/courses/enroll', studentController.enrollInCourse);
router.get('/courses/enrolled', studentController.getEnrolledCourses);
router.get('/courses/:courseId', studentController.getCourseDetails);

// Topic Resources Hub (Materials & Quizzes)
router.get('/topics/:topicId/resources', studentController.getTopicResources);

// Quiz attempts & modes (Mock vs Practice)
router.post('/quizzes/:quizId/start', studentController.startQuizAttempt);
router.post('/attempts/:attemptId/check-question', studentController.checkQuestionAnswer);
router.post('/attempts/:attemptId/save', studentController.saveAttemptAnswer);
router.post('/attempts/:attemptId/submit', studentController.submitQuizAttempt);
router.get('/attempts/:attemptId/results', studentController.getAttemptResults);
router.delete('/attempts/:attemptId', studentController.deleteQuizAttempt);
router.get('/quizzes/:quizId/attempts', studentController.getQuizAttemptHistory);

// Bookmarks & Mistakes ("My Mistakes" & "Bookmarked Questions" folders)
router.post('/questions/:questionId/bookmark', studentController.toggleBookmark);
router.get('/bookmarks', studentController.getBookmarkedQuestions);
router.get('/mistakes', studentController.getMistakesList);
router.post('/revision/quiz', studentController.createRevisionQuiz);

// Performance Analytics & Peer Leaderboard
router.get('/performance-analytics', studentController.getPerformanceAnalytics);
router.get('/performance/trends', studentController.getQuizPerformanceTrends);
router.get('/leaderboard', studentController.getLeaderboard);

// Exam preference routes
router.get('/me/exam-preferences', studentController.getExamPreferences);
router.post('/me/exam-preferences', studentController.setExamPreferences);
router.put('/me/exam-preferences', studentController.setExamPreferences);
router.post('/exams/register', studentController.setExamPreferences);
router.post('/exams/:examId', studentController.addExamPreference);
router.delete('/exams/:examId', studentController.removeExamPreference);

// Student Quizzes & Topic-wise content
router.get('/quizzes', studentController.getStudentQuizzes);
router.get('/exams/:examId/topics', studentController.getExamTopicsWithCounts);

module.exports = router;
