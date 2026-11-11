const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  User,
  Course,
  Quiz,
  Question,
  QuizAttempt,
  Exam,
  ExamEdition,
  ExamSubject,
  ExamTopic,
  Subtopic,
  StudyMaterial,
  ContentSubmission,
  Payout,
  PlatformSetting,
  AuditLog,
  EducatorApplication,
  Notification,
  Institute,
  sequelize
} = require('../config/database');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

// ─── Existing Faculty Management ─────────────────────────────────────────────
exports.addFaculty = async (req, res, next) => {
  try {
    const { name, email, department, subject, phone, initialPassword } = req.body;

    if (!name || !email || !department || !subject || !phone) {
      return next(new BadRequestError('Missing required fields.'));
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new ConflictError('Email already in use.'));
    }

    const rawPassword = initialPassword || crypto.randomBytes(24).toString('base64url');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newFaculty = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'EDUCATOR',
      educatorType: 'COLLEGE',
      department,
      subject,
      phone,
      mustChangePassword: true,
      status: 'active'
    });
    await AuditLog.create({
      actorId: req.user.id,
      action: 'faculty_created',
      targetId: newFaculty.id,
      targetType: 'user',
      metadata: { role: 'EDUCATOR', educatorType: 'COLLEGE', status: 'active' }
    });

    res.status(201).json({
      status: 'success',
      message: 'Faculty account created successfully.',
      faculty: {
        id: newFaculty.id,
        name: newFaculty.name,
        email: newFaculty.email,
        department: newFaculty.department,
        subject: newFaculty.subject,
        phone: newFaculty.phone,
        status: newFaculty.status
      },
      generatedPassword: rawPassword
    });
  } catch (err) {
    next(err);
  }
};

exports.getFacultyList = async (req, res, next) => {
  try {
    const where = {
      role: 'EDUCATOR',
      [Op.or]: [
        { educatorType: 'COLLEGE' },
        { educatorType: 'BOTH' },
        { instituteId: { [Op.ne]: null } }
      ]
    };

    if (req.query.status) {
      const qStatus = String(req.query.status).toUpperCase();
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(qStatus)) {
        where.approvalStatus = qStatus;
      } else {
        where.status = req.query.status;
      }
    }
    if (req.query.approvalStatus) {
      where.approvalStatus = String(req.query.approvalStatus).toUpperCase();
    }

    const facultyList = await User.findAll({
      where,
      include: [{ model: Institute, as: 'institute', required: false }],
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: facultyList.length,
      data: facultyList
    });
  } catch (err) {
    next(err);
  }
};

exports.approveFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faculty = await User.findByPk(id);
    if (!faculty) return next(new NotFoundError('Faculty member not found.'));

    faculty.approvalStatus = 'APPROVED';
    await faculty.save();

    await Notification.create({
      userId: faculty.id,
      title: 'Faculty Account Approved',
      message: 'Your faculty account has been verified and approved by the administrator. You can now manage courses and create quizzes.'
    }).catch(() => {});

    await AuditLog.create({
      actorId: req.user.id,
      action: 'faculty_approved',
      targetId: faculty.id,
      targetType: 'user',
      metadata: { approvalStatus: 'APPROVED' }
    }).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Faculty account approved successfully.',
      data: faculty
    });
  } catch (err) {
    next(err);
  }
};

exports.rejectFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const faculty = await User.findByPk(id);
    if (!faculty) return next(new NotFoundError('Faculty member not found.'));

    faculty.approvalStatus = 'REJECTED';
    await faculty.save();

    await Notification.create({
      userId: faculty.id,
      title: 'Faculty Account Rejected',
      message: `Your faculty account verification was not approved. Reason: ${reason || 'Details could not be verified.'}`
    }).catch(() => {});

    await AuditLog.create({
      actorId: req.user.id,
      action: 'faculty_rejected',
      targetId: faculty.id,
      targetType: 'user',
      metadata: { reason }
    }).catch(() => {});

    res.status(200).json({
      status: 'success',
      message: 'Faculty account rejected.',
      data: faculty
    });
  } catch (err) {
    next(err);
  }
};

exports.updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, department, subject, phone, status } = req.body;

    const faculty = await User.findOne({ where: { id, role: 'EDUCATOR', educatorType: 'COLLEGE' } });
    if (!faculty) {
      return next(new NotFoundError('Faculty member not found.'));
    }

    if (email && email !== faculty.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return next(new ConflictError('Email already in use.'));
      }
      faculty.email = email;
    }

    if (name) faculty.name = name;
    if (department) faculty.department = department;
    if (subject) faculty.subject = subject;
    if (phone) faculty.phone = phone;
    if (status) faculty.status = status;

    await faculty.save();
    await AuditLog.create({
      actorId: req.user.id,
      action: 'faculty_updated',
      targetId: faculty.id,
      targetType: 'user',
      metadata: { changedFields: Object.keys(req.body || {}) }
    });

    res.status(200).json({
      status: 'success',
      message: 'Faculty account updated successfully.',
      data: faculty
    });
  } catch (err) {
    next(err);
  }
};

exports.deactivateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return next(new BadRequestError('Status must be active or inactive.'));
    }

    const faculty = await User.findOne({ where: { id, role: 'EDUCATOR', educatorType: 'COLLEGE' } });
    if (!faculty) {
      return next(new NotFoundError('Faculty member not found.'));
    }

    faculty.status = status;
    await faculty.save();
    await AuditLog.create({
      actorId: req.user.id,
      action: 'faculty_status_changed',
      targetId: faculty.id,
      targetType: 'user',
      metadata: { status }
    });

    res.status(200).json({
      status: 'success',
      message: `Faculty account has been ${status === 'active' ? 'activated' : 'deactivated'}.`,
      data: faculty
    });
  } catch (err) {
    next(err);
  }
};

// ─── Content Review Queue (Quizzes & Study Materials) ────────────────────────
exports.getReviewQueue = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.contentType = type;
    }

    const submissions = await ContentSubmission.findAll({
      where,
      include: [
        {
          model: User,
          as: 'contributor',
          attributes: ['id', 'name', 'email', 'contributorStatus', 'badge', 'subjectExpertise']
        },
        {
          model: Quiz,
          as: 'quiz',
          include: [
            { model: Question, as: 'questions' },
            { model: ExamTopic, as: 'examTopic', include: [{ model: ExamSubject, as: 'subject' }] },
            { model: Subtopic, as: 'subtopic', include: [{ model: Course, as: 'course' }] }
          ]
        },
        {
          model: StudyMaterial,
          as: 'material',
          include: [
            { model: ExamTopic, as: 'examTopic' },
            { model: Subtopic, as: 'subtopic' }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: submissions.length,
      data: submissions
    });
  } catch (err) {
    next(err);
  }
};

// ─── Review & Approve/Reject Submission ──────────────────────────────────────
exports.reviewSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, feedback, bountyAmount } = req.body; // decision: 'approved', 'rejected', 'changes_requested'

    if (!['approved', 'rejected', 'changes_requested'].includes(decision)) {
      return next(new BadRequestError('Decision must be approved, rejected, or changes_requested.'));
    }

    const submission = await ContentSubmission.findByPk(id, {
      include: [
        { model: User, as: 'contributor' },
        { model: Quiz, as: 'quiz' },
        { model: StudyMaterial, as: 'material' }
      ]
    });

    if (!submission) {
      return next(new NotFoundError('Submission record not found.'));
    }

    submission.status = decision;
    submission.adminFeedback = feedback || null;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();

    // Fetch bounty setting if approved
    if (decision === 'approved') {
      let payoutVal = bountyAmount;
      if (payoutVal === undefined || payoutVal === null) {
        const setting = await PlatformSetting.findOne({ where: { key: 'flat_fee_per_quiz' } });
        payoutVal = setting ? parseFloat(setting.value) : 15.0;
      }
      submission.payoutAmount = parseFloat(payoutVal);

      // If Quiz: mark approved & published
      if (submission.quiz) {
        submission.quiz.status = 'PUBLISHED';
        submission.quiz.isPublished = true;
        submission.quiz.publishedBy = req.user.id;
        submission.quiz.publishedAt = new Date();
        submission.quiz.reviewNotes = feedback || 'Approved by Admin';
        await submission.quiz.save();
        await Question.update({ status: 'published' }, { where: { quizId: submission.quiz.id } });
      }

      // If Material: mark approved
      if (submission.material) {
        submission.material.status = 'approved';
        submission.material.reviewNotes = feedback || 'Approved by Admin';
        await submission.material.save();
      }

      // Credit contributor earnings balance & create payout entry
      const contributor = submission.contributor;
      if (contributor && submission.payoutAmount > 0) {
        contributor.earningsBalance = (contributor.earningsBalance || 0) + submission.payoutAmount;
        contributor.totalEarned = (contributor.totalEarned || 0) + submission.payoutAmount;
        await contributor.save();

        await Payout.create({
          contributorId: contributor.id,
          amount: submission.payoutAmount,
          type: 'bounty_quiz',
          status: 'completed',
          paymentMethod: 'Platform Credit',
          referenceId: `SUB-${submission.id.slice(0, 8)}`,
          notes: `Bounty for approved submission: "${submission.title}"`,
          processedAt: new Date()
        });
      }
    } else {
      // Rejection or changes requested
      if (submission.quiz) {
        submission.quiz.status = 'REJECTED';
        submission.quiz.isPublished = false;
        submission.quiz.reviewNotes = feedback;
        submission.quiz.rejectionReason = feedback || null;
        await submission.quiz.save();
        await Question.update({ status: 'draft' }, { where: { quizId: submission.quiz.id } });
      }
      if (submission.material) {
        submission.material.status = decision;
        submission.material.reviewNotes = feedback;
        await submission.material.save();
      }
    }

    await submission.save();
    await AuditLog.create({
      actorId: req.user.id,
      action: `content_submission_${decision}`,
      targetId: submission.quizId || submission.materialId || submission.id,
      targetType: submission.contentType,
      metadata: { submissionId: submission.id, feedback: feedback || null }
    });

    res.status(200).json({
      status: 'success',
      message: `Submission marked as ${decision}.`,
      data: submission
    });
  } catch (err) {
    next(err);
  }
};

// ─── Contributor Applications & Management ──────────────────────────────────
exports.getContributors = async (req, res, next) => {
  try {
    const contributors = await User.findAll({
      where: { role: 'EDUCATOR' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: contributors
    });
  } catch (err) {
    next(err);
  }
};

exports.updateContributorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, badge } = req.body; // status: 'approved', 'rejected', 'pending'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return next(new BadRequestError('Status must be approved, rejected, or pending.'));
    }

    const contributor = await User.findOne({ where: { id, role: 'EDUCATOR' } });
    if (!contributor) {
      return next(new NotFoundError('Contributor not found.'));
    }

    contributor.contributorStatus = status;
    if (status === 'approved') {
      contributor.badge = badge || 'Verified Educator';
      contributor.approvalStatus = 'APPROVED';
    } else if (status === 'rejected') {
      contributor.badge = null;
    }

    await contributor.save();
    await AuditLog.create({
      actorId: req.user.id,
      action: 'educator_legacy_status_changed',
      targetId: contributor.id,
      targetType: 'user',
      metadata: { contributorStatus: status, badge: contributor.badge }
    });

    res.status(200).json({
      status: 'success',
      message: `Contributor status updated to ${status}.`,
      data: contributor
    });
  } catch (err) {
    next(err);
  }
};

// ─── Contributor Leaderboard ────────────────────────────────────────────────
exports.getContributorLeaderboard = async (req, res, next) => {
  try {
    const educators = await User.findAll({
      where: { role: 'EDUCATOR' },
      attributes: ['id', 'name', 'email', 'badge', 'subjectExpertise', 'totalEarned', 'earningsBalance'],
      include: [
        {
          model: Quiz,
          as: 'authoredQuizzes',
          where: { isPublished: true },
          required: false,
          attributes: ['id', 'totalAttempts']
        },
        {
          model: StudyMaterial,
          as: 'authoredMaterials',
          where: { status: 'approved' },
          required: false,
          attributes: ['id', 'downloadsCount']
        }
      ]
    });

    const leaderboard = educators.map(educator => {
      const publishedQuizzes = educator.authoredQuizzes || [];
      const materials = educator.authoredMaterials || [];
      const totalAttempts = publishedQuizzes.reduce((sum, q) => sum + (q.totalAttempts || 0), 0);
      const totalDownloads = materials.reduce((sum, m) => sum + (m.downloadsCount || 0), 0);
      const activityScore = (publishedQuizzes.length * 10) + (materials.length * 5) + totalAttempts;

      return {
        id: educator.id,
        name: educator.name,
        email: educator.email,
        badge: educator.badge || 'Verified Educator',
        subjectExpertise: educator.subjectExpertise || 'General Subject',
        quizzesCount: publishedQuizzes.length,
        materialsCount: materials.length,
        totalAttempts,
        totalDownloads,
        totalEarned: educator.totalEarned || 0,
        activityScore
      };
    });

    // Sort by activityScore descending
    leaderboard.sort((a, b) => b.activityScore - a.activityScore);

    res.status(200).json({
      status: 'success',
      data: leaderboard
    });
  } catch (err) {
    next(err);
  }
};

// ─── Payout Rules & Platform Settings ───────────────────────────────────────
exports.getPayoutSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSetting.findAll();

    // Default seeds if empty
    if (settings.length === 0) {
      await PlatformSetting.bulkCreate([
        { key: 'flat_fee_per_quiz', value: '15.00', description: 'Flat bounty payout for every approved quiz' },
        { key: 'rev_share_per_attempt', value: '0.10', description: 'Revenue share credited per student quiz completion' },
        { key: 'min_withdrawal', value: '20.00', description: 'Minimum balance required to request a payout withdrawal' }
      ]);
      settings = await PlatformSetting.findAll();
    }

    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    res.status(200).json({
      status: 'success',
      data: {
        settings: settingsMap,
        records: settings
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePayoutSettings = async (req, res, next) => {
  try {
    const { flatFeePerQuiz, revSharePerAttempt, minWithdrawal } = req.body;

    if (flatFeePerQuiz !== undefined) {
      await PlatformSetting.upsert({
        key: 'flat_fee_per_quiz',
        value: String(flatFeePerQuiz),
        description: 'Flat bounty payout for every approved quiz'
      });
    }

    if (revSharePerAttempt !== undefined) {
      await PlatformSetting.upsert({
        key: 'rev_share_per_attempt',
        value: String(revSharePerAttempt),
        description: 'Revenue share credited per student quiz completion'
      });
    }

    if (minWithdrawal !== undefined) {
      await PlatformSetting.upsert({
        key: 'min_withdrawal',
        value: String(minWithdrawal),
        description: 'Minimum balance required to request a payout withdrawal'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Payout platform settings updated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// ─── Withdrawal Requests Management ─────────────────────────────────────────
exports.getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Payout.findAll({
      where: { type: 'withdrawal' },
      include: [{ model: User, as: 'contributor', attributes: ['id', 'name', 'email', 'earningsBalance'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: withdrawals
    });
  } catch (err) {
    next(err);
  }
};

exports.processWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, referenceId, notes } = req.body; // 'completed', 'rejected'

    const payout = await Payout.findByPk(id, {
      include: [{ model: User, as: 'contributor' }]
    });

    if (!payout) {
      return next(new NotFoundError('Withdrawal record not found.'));
    }

    payout.status = status;
    payout.referenceId = referenceId || payout.referenceId;
    payout.notes = notes || payout.notes;
    payout.processedAt = new Date();

    // If rejected, refund the balance back to the contributor
    if (status === 'rejected' && payout.contributor) {
      payout.contributor.earningsBalance += payout.amount;
      await payout.contributor.save();
    }

    await payout.save();

    res.status(200).json({
      status: 'success',
      message: `Withdrawal marked as ${status}.`,
      data: payout
    });
  } catch (err) {
    next(err);
  }
};

// ─── Enhanced System KPIs ───────────────────────────────────────────────────
exports.getSystemStats = async (req, res, next) => {
  try {
    const totalFaculty = await User.count({ where: { role: 'EDUCATOR', educatorType: 'COLLEGE' } });
    const totalContributors = await User.count({ where: { role: 'EDUCATOR' } });
    const approvedEducators = totalContributors;
    const pendingSubmissions = await ContentSubmission.count({ where: { status: 'pending' } });
    const pendingApplications = await EducatorApplication.count({ where: { status: 'PENDING' } });
    const totalStudents = await User.count({ where: { role: 'STUDENT' } });
    const totalCourses = await Course.count();
    const totalQuizzes = await Quiz.count();
    const totalAttempts = await QuizAttempt.count();
    const activeExams = await Exam.count({ where: { status: 'active' } });
    const activeEditions = await ExamEdition.count({ where: { is_active: true } });

    const avgScoreResult = await QuizAttempt.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
      where: { status: ['completed', 'auto-submitted'] }
    });
    const averageScore = avgScoreResult ? parseFloat(avgScoreResult.get('avgScore') || 0).toFixed(2) : '0.00';

    const attemptsTrend = await QuizAttempt.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'day', sequelize.col('createdAt')), 'ASC']],
      limit: 15
    });

    const courseStats = await Course.findAll({
      attributes: [
        'id',
        'title',
        'subject',
        [
          sequelize.literal('(SELECT COUNT(*) FROM enrollments WHERE enrollments."courseId" = "Course".id)'),
          'enrollmentCount'
        ],
        [
          sequelize.literal('(SELECT COUNT(*) FROM quizzes WHERE quizzes."courseId" = "Course".id)'),
          'quizCount'
        ]
      ],
      order: [[sequelize.literal('"enrollmentCount"'), 'DESC']],
      limit: 5
    });

    res.status(200).json({
      status: 'success',
      data: {
        kpis: {
          totalFaculty,
          totalContributors,
          approvedEducators,
          pendingSubmissions,
          pendingApplications,
          totalStudents,
          totalCourses,
          totalQuizzes,
          totalAttempts,
          averageScore,
          activeExams,
          activeEditions
        },
        attemptsTrend: attemptsTrend.map(t => ({
          date: new Date(t.get('date')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: parseInt(t.get('count') || 0, 10)
        })),
        topCourses: courseStats.map(c => ({
          id: c.id,
          title: c.title,
          subject: c.subject,
          enrollments: parseInt(c.get('enrollmentCount') || 0, 10),
          quizzes: parseInt(c.get('quizCount') || 0, 10)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};
