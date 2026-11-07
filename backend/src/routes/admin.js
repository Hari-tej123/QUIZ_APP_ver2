const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleGuard = require('../middlewares/roleGuard');
const accessController = require('../controllers/accessController');
const educatorController = require('../controllers/educatorController');
const quizWorkflowController = require('../controllers/quizWorkflowController');

// All admin routes require authentication and admin role
router.use(authMiddleware, roleGuard('admin'));

router.get('/access-requests', accessController.listRequests);
router.put('/access-requests/:id/decision', accessController.decideRequest);
router.get('/users', accessController.listUsers);
router.put('/users/:id/access', accessController.updateUserAccess);
router.get('/educator-applications', educatorController.listApplications);
router.get('/educator-applications/:id/proof', educatorController.streamProof);
router.put('/educator-applications/:id/review', educatorController.reviewApplication);
router.post('/educator-invites', educatorController.createInvite);
router.get('/quiz-review', quizWorkflowController.reviewQueue);
router.put('/quiz-review/:quizId', quizWorkflowController.reviewDecision);
router.get('/audit-logs', quizWorkflowController.listAuditLogs);
router.get('/dashboard-counts', quizWorkflowController.dashboardCounts);

// Faculty Management
router.post('/faculty', adminController.addFaculty);
router.get('/faculty', adminController.getFacultyList);
router.put('/faculty/:id', adminController.updateFaculty);
router.put('/faculty/:id/deactivate', adminController.deactivateFaculty);
router.get('/stats', adminController.getSystemStats);

// Review Queue for Contributor Submissions
router.get('/review-queue', adminController.getReviewQueue);
router.post('/review-queue/:id/decision', adminController.reviewSubmission);

// Contributor & Educator Management
router.get('/contributors', adminController.getContributors);
router.put('/contributors/:id/status', adminController.updateContributorStatus);
router.get('/contributor-leaderboard', adminController.getContributorLeaderboard);

// Payout Rules & Platform Settings
router.get('/payout-settings', adminController.getPayoutSettings);
router.put('/payout-settings', adminController.updatePayoutSettings);

// Withdrawal Requests Management
router.get('/withdrawals', adminController.getWithdrawals);
router.put('/withdrawals/:id/status', adminController.processWithdrawal);

module.exports = router;
