const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const facultyRoutes = require('./faculty');
const contributorRoutes = require('./contributor');
const studentRoutes = require('./student');
const examRoutes = require('./exam');
const accessRoutes = require('./access');
const questionRoutes = require('./questions');
const educatorRoutes = require('./educator');
const attemptRoutes = require('./attempts');

// Healthcheck route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Online Quiz API is running smoothly.',
    timestamp: new Date()
  });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/faculty', facultyRoutes);
router.use('/contributor', contributorRoutes);
router.use('/student', studentRoutes);
router.use('/access-requests', accessRoutes);
router.use('/questions', questionRoutes);
router.use('/educator-applications', educatorRoutes);
router.use('/', attemptRoutes);

// Exam hierarchy routes (public read + admin write)
router.use('/', examRoutes);

module.exports = router;
