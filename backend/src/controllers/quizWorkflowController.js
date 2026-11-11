const { z } = require('zod');
const {
  Quiz, Question, User, AuditLog, Notification, ContentSubmission, sequelize
} = require('../config/database');
const { ExamTopic, ExamSubject, ExamEdition, EducatorApplication, QuizAttempt } = require('../config/database');
const { BadRequestError, ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');

const questionSchema = z.object({
  questionText: z.string().trim().min(1).max(5000),
  optionA: z.string().trim().min(1).max(1000),
  optionB: z.string().trim().min(1).max(1000),
  optionC: z.string().trim().min(1).max(1000),
  optionD: z.string().trim().min(1).max(1000),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().max(5000).optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tags: z.union([z.string().max(500), z.array(z.string().max(80)).max(20)]).optional(),
  marks: z.coerce.number().int().min(1).max(100).default(1)
});

const questionRows = (questions, quiz) => questions.map(raw => {
  const parsed = questionSchema.safeParse(raw);
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message || 'Invalid question.');
  const question = parsed.data;
  const options = [question.optionA, question.optionB, question.optionC, question.optionD];
  return {
    ...question,
    quizId: quiz.id,
    questionText: question.questionText,
    options,
    correctAnswers: [question.correctOption],
    track: quiz.trackType === 'college' ? 'college' : 'exam',
    status: 'draft',
    createdBy: quiz.ownerId,
    tags: Array.isArray(question.tags) ? question.tags.join(', ') : question.tags || null
  };
});

const findOwnedQuiz = async (id, userId, transaction) => {
  const quiz = await Quiz.findByPk(id, transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {});
  if (!quiz) throw new NotFoundError('Quiz not found.');
  if (quiz.ownerId !== userId && quiz.authorId !== userId) throw new ForbiddenError('You can only manage your own quizzes.');
  return quiz;
};

exports.updateDraft = async (req, res, next) => {
  try {
    if (req.user?.approvalStatus === 'PENDING' && req.user?.contributorStatus !== 'approved') {
      throw new ForbiddenError('Awaiting approval. Your faculty account is pending verification by an administrator.');
    }
    const quiz = await findOwnedQuiz(req.params.quizId, req.user.id);
    if (!['DRAFT', 'REJECTED'].includes(quiz.status)) {
      throw new ConflictError('Only draft or rejected quizzes can be edited. Published quizzes must be archived before creating a new version.');
    }
    const schema = z.object({
      title: z.string().trim().min(3).max(180).optional(),
      description: z.string().max(3000).nullable().optional(),
      duration: z.coerce.number().int().min(1).max(600).optional(),
      questions: z.array(questionSchema).min(1).max(200).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message || 'Invalid quiz data.');
    const { questions, ...fields } = parsed.data;
    if (fields.duration !== undefined) {
      quiz.duration = fields.duration;
      quiz.durationMin = fields.duration;
    }
    if (fields.title !== undefined) quiz.title = fields.title;
    if (fields.description !== undefined) quiz.description = fields.description;
    quiz.status = 'DRAFT';
    quiz.isPublished = false;
    quiz.rejectionReason = null;
    await quiz.save();
    if (questions) {
      await Question.destroy({ where: { quizId: quiz.id } });
      await Question.bulkCreate(questionRows(questions, quiz));
    }
    res.status(200).json({ status: 'success', data: quiz });
  } catch (err) {
    next(err);
  }
};

exports.submitForReview = async (req, res, next) => {
  try {
    if (req.user?.approvalStatus === 'PENDING' && req.user?.contributorStatus !== 'approved') {
      throw new ForbiddenError('Awaiting approval. Your faculty account is pending verification by an administrator.');
    }
    const quiz = await findOwnedQuiz(req.params.quizId, req.user.id);
    if (!['DRAFT', 'REJECTED'].includes(quiz.status)) throw new ConflictError('Only drafts or rejected quizzes can be submitted.');
    const count = await Question.count({ where: { quizId: quiz.id } });
    if (count < 1) throw new BadRequestError('Add at least one valid question before submitting.');

    quiz.status = 'PENDING_REVIEW';
    quiz.isPublished = false;
    quiz.rejectionReason = null;
    await quiz.save();
    await Question.update({ status: 'draft' }, { where: { quizId: quiz.id } });
    await ContentSubmission.findOrCreate({
      where: { quizId: quiz.id, contentType: 'quiz' },
      defaults: {
        contributorId: quiz.ownerId || quiz.authorId,
        contentType: 'quiz',
        quizId: quiz.id,
        title: quiz.title,
        trackType: quiz.trackType || 'competitive',
        status: 'pending'
      }
    }).then(([submission]) => submission.update({ status: 'pending', title: quiz.title }));
    res.status(200).json({ status: 'success', data: quiz });
  } catch (err) {
    next(err);
  }
};

exports.directPublish = async (req, res, next) => {
  try {
    const quiz = await findOwnedQuiz(req.params.quizId, req.user.id);
    if (!['DRAFT', 'REJECTED'].includes(quiz.status)) throw new ConflictError('Only drafts or rejected quizzes can be published directly.');

    quiz.status = 'PUBLISHED';
    quiz.isPublished = true;
    quiz.publishedBy = req.user.id;
    quiz.publishedAt = new Date();
    quiz.rejectionReason = null;
    await quiz.save();

    await Question.update({ status: 'published' }, { where: { quizId: quiz.id } });
    await ContentSubmission.findOrCreate({
      where: { quizId: quiz.id, contentType: 'quiz' },
      defaults: {
        contributorId: quiz.ownerId || quiz.authorId,
        contentType: 'quiz',
        quizId: quiz.id,
        title: quiz.title,
        trackType: quiz.trackType || 'competitive',
        status: 'approved'
      }
    }).then(([submission]) => submission.update({ status: 'approved', title: quiz.title }));

    res.status(200).json({ status: 'success', data: quiz });
  } catch (err) {
    next(err);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const quiz = await findOwnedQuiz(req.params.quizId, req.user.id);
    if (quiz.status !== 'PUBLISHED') throw new ConflictError('Only published quizzes can be archived.');
    quiz.status = 'ARCHIVED';
    quiz.isPublished = false;
    await quiz.save();
    await AuditLog.create({ actorId: req.user.id, action: 'quiz_archived', targetId: quiz.id, targetType: 'quiz', metadata: {} });
    res.status(200).json({ status: 'success', data: quiz });
  } catch (err) {
    next(err);
  }
};

exports.reviewQueue = async (req, res, next) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { status: 'PENDING_REVIEW' },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'educatorType'] },
        { model: Question, as: 'questions', order: [['createdAt', 'ASC']] },
        { model: ExamTopic, as: 'examTopic', include: [{ model: ExamSubject, as: 'subject', include: [{ model: ExamEdition, as: 'edition', include: [{ model: Exam, as: 'exam' }] }] }] }
      ],
      order: [['updatedAt', 'ASC']]
    });
    res.status(200).json({ status: 'success', results: quizzes.length, data: quizzes });
  } catch (err) {
    next(err);
  }
};

exports.reviewDecision = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const schema = z.object({
      decision: z.enum(['PUBLISHED', 'REJECTED']),
      reason: z.string().trim().max(1000).optional(),
      edits: z.object({
        title: z.string().trim().min(3).max(180).optional(),
        description: z.string().max(3000).nullable().optional(),
        durationMin: z.coerce.number().int().min(1).max(600).optional(),
        questions: z.array(questionSchema).min(1).max(200).optional()
      }).optional()
    })
      .superRefine((data, ctx) => {
        if (data.decision === 'REJECTED' && !data.reason) ctx.addIssue({ code: 'custom', message: 'A rejection reason is required.' });
      });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message || 'Invalid decision.');

    const quiz = await Quiz.findByPk(req.params.quizId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
      include: [{ model: User, as: 'owner' }]
    });
    if (!quiz) throw new NotFoundError('Quiz not found.');
    if (quiz.status !== 'PENDING_REVIEW') throw new ConflictError('Only pending quizzes can be reviewed.');

    if (parsed.data.edits) {
      const { title, description, durationMin, questions } = parsed.data.edits;
      if (title !== undefined) quiz.title = title;
      if (description !== undefined) quiz.description = description;
      if (durationMin !== undefined) {
        quiz.durationMin = durationMin;
        quiz.duration = durationMin;
      }
      if (questions) {
        await Question.destroy({ where: { quizId: quiz.id }, transaction });
        await Question.bulkCreate(questionRows(questions, quiz), { transaction });
      }
    }

    quiz.status = parsed.data.decision;
    quiz.isPublished = parsed.data.decision === 'PUBLISHED';
    quiz.publishedBy = quiz.isPublished ? req.user.id : null;
    quiz.publishedAt = quiz.isPublished ? new Date() : null;
    quiz.rejectionReason = quiz.isPublished ? null : parsed.data.reason;
    quiz.reviewNotes = quiz.rejectionReason;
    await quiz.save({ transaction });
    await Question.update({ status: quiz.isPublished ? 'published' : 'draft' }, { where: { quizId: quiz.id }, transaction });
    await ContentSubmission.update({
      status: quiz.isPublished ? 'approved' : 'rejected',
      adminFeedback: quiz.rejectionReason || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    }, { where: { quizId: quiz.id, contentType: 'quiz' }, transaction });
    await AuditLog.create({ actorId: req.user.id, action: `quiz_${parsed.data.decision.toLowerCase()}`, targetId: quiz.id, targetType: 'quiz', metadata: { reason: parsed.data.reason || null, edited: Boolean(parsed.data.edits) } }, { transaction });
    await Notification.create({
      userId: quiz.ownerId || quiz.authorId,
      title: quiz.isPublished ? 'Quiz published' : 'Quiz needs changes',
      message: quiz.isPublished ? `"${quiz.title}" is now published.` : `"${quiz.title}" was rejected. Reason: ${parsed.data.reason}`
    }, { transaction });
    await transaction.commit();
    res.status(200).json({ status: 'success', data: quiz });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};

exports.dashboardCounts = async (req, res, next) => {
  try {
    const [students, educators, admins, pendingApplications, pendingQuizzes, publishedQuizzes, totalAttempts] = await Promise.all([
      User.count({ where: { role: 'STUDENT' } }),
      User.count({ where: { role: 'EDUCATOR' } }),
      User.count({ where: { role: 'ADMIN' } }),
      EducatorApplication.count({ where: { status: 'PENDING' } }),
      Quiz.count({ where: { status: 'PENDING_REVIEW' } }),
      Quiz.count({ where: { status: 'PUBLISHED' } }),
      QuizAttempt.count()
    ]);
    res.status(200).json({ status: 'success', data: { usersByRole: { STUDENT: students, EDUCATOR: educators, ADMIN: admins }, pendingApplications, pendingQuizzes, publishedQuizzes, totalAttempts } });
  } catch (err) {
    next(err);
  }
};

exports.listAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({ include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'email'] }], order: [['createdAt', 'DESC']], limit: 200 });
    res.status(200).json({ status: 'success', data: logs });
  } catch (err) {
    next(err);
  }
};