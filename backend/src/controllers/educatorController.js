const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { z } = require('zod');
const { Op } = require('sequelize');
const {
  EducatorApplication, EducatorInvite, User, Exam, ExamEdition, ExamSubject,
  ExamTopic, Notification, AuditLog, sequelize
} = require('../config/database');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  qualification: z.string().trim().min(2).max(240),
  experienceYears: z.coerce.number().int().min(0).max(70),
  subjectsExams: z.array(z.string().uuid()).min(1).max(50),
  institution: z.string().trim().max(180).optional().or(z.literal('')),
  proofUrl: z.string().url().max(500).optional().or(z.literal('')),
  motivation: z.string().trim().min(20).max(2000),
  requestedEducatorType: z.enum(['COMPETITIVE', 'COLLEGE', 'BOTH'])
});

const inviteTokenHash = token => crypto.createHash('sha256').update(token).digest('hex');

exports.listTaxonomyOptions = async (req, res, next) => {
  try {
    const topics = await ExamTopic.findAll({
      where: { status: 'active' },
      include: [{
        model: ExamSubject,
        as: 'subject',
        include: [{
          model: ExamEdition,
          as: 'edition',
          include: [{ model: Exam, as: 'exam' }]
        }]
      }],
      order: [['name', 'ASC']]
    });
    res.status(200).json({
      status: 'success',
      data: topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        subject: topic.subject?.name,
        exam: topic.subject?.edition?.exam?.name,
        track: topic.subject?.edition?.exam?.track || 'COMPETITIVE'
      }))
    });
  } catch (err) {
    next(err);
  }
};

exports.createApplication = async (req, res, next) => {
  try {
    const parsed = applicationSchema.safeParse({
      ...req.body,
      subjectsExams: Array.isArray(req.body.subjectsExams)
        ? req.body.subjectsExams
        : JSON.parse(req.body.subjectsExams || '[]')
    });
    if (!parsed.success) return next(new BadRequestError(parsed.error.issues[0]?.message || 'Invalid application details.'));
    if (!parsed.data.proofUrl && !req.file) return next(new BadRequestError('Provide a proof link or upload a PDF/JPEG/PNG document.'));

    const topicCount = await ExamTopic.count({ where: { id: { [Op.in]: parsed.data.subjectsExams } } });
    if (topicCount !== parsed.data.subjectsExams.length) return next(new BadRequestError('One or more selected topics are invalid.'));

    const application = await EducatorApplication.create({
      ...parsed.data,
      institution: parsed.data.institution || null,
      proofUrl: parsed.data.proofUrl || null,
      proofFilePath: req.file?.filename || null,
      userId: req.user.id,
      status: 'PENDING'
    });
    res.status(201).json({ status: 'success', data: application });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return next(new ConflictError('You already have an application pending review.'));
    }
    next(err);
  }
};

exports.getMyApplication = async (req, res, next) => {
  try {
    const application = await EducatorApplication.findOne({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['proofFilePath'] }
    });
    res.status(200).json({ status: 'success', data: application });
  } catch (err) {
    next(err);
  }
};

exports.listApplications = async (req, res, next) => {
  try {
    const where = {};
    if (['PENDING', 'APPROVED', 'REJECTED'].includes(req.query.status)) where.status = req.query.status;
    const applications = await EducatorApplication.findAll({
      where,
      include: [{ model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'role', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ status: 'success', results: applications.length, data: applications });
  } catch (err) {
    next(err);
  }
};

exports.streamProof = async (req, res, next) => {
  try {
    const application = await EducatorApplication.findByPk(req.params.id);
    if (!application) return next(new NotFoundError('Application not found.'));
    if (!application.proofFilePath) return next(new NotFoundError('No proof file was uploaded.'));
    const proofPath = path.join(__dirname, '../../private_uploads/educator-proofs', path.basename(application.proofFilePath));
    if (!fs.existsSync(proofPath)) return next(new NotFoundError('Proof file not found.'));
    res.download(proofPath, 'educator-proof');
  } catch (err) {
    next(err);
  }
};

const sendOptionalEmail = async (email, status, reason) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Quizzify educator application update',
        text: status === 'APPROVED' ? 'Your educator application was approved.' : `Your application was rejected. ${reason}`
      })
    });
  } catch {
    // In-app notifications remain available when email delivery is not configured.
  }
};

exports.reviewApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const schema = z.object({
      decision: z.enum(['APPROVED', 'REJECTED']),
      educatorType: z.enum(['COMPETITIVE', 'COLLEGE', 'BOTH']).optional(),
      reason: z.string().trim().max(1000).optional()
    }).superRefine((data, ctx) => {
      if (data.decision === 'APPROVED' && !data.educatorType) {
        ctx.addIssue({ code: 'custom', message: 'Choose an educator type.', path: ['educatorType'] });
      }
      if (data.decision === 'REJECTED' && !data.reason) {
        ctx.addIssue({ code: 'custom', message: 'A rejection reason is required.', path: ['reason'] });
      }
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message || 'Invalid review decision.');

    const application = await EducatorApplication.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!application) throw new NotFoundError('Application not found.');
    if (application.status !== 'PENDING') throw new ConflictError('Only pending applications can be reviewed.');
    const user = await User.findByPk(application.userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw new NotFoundError('Applicant account no longer exists.');

    application.status = parsed.data.decision;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.rejectionReason = parsed.data.decision === 'REJECTED' ? parsed.data.reason : null;
    if (parsed.data.decision === 'APPROVED') {
      user.role = 'EDUCATOR';
      user.educatorType = parsed.data.educatorType;
      application.requestedEducatorType = parsed.data.educatorType;
      await user.save({ transaction });
    }
    await application.save({ transaction });
    await Notification.create({
      userId: user.id,
      title: parsed.data.decision === 'APPROVED' ? 'Educator access approved' : 'Educator application update',
      message: parsed.data.decision === 'APPROVED'
        ? `Your educator access was approved for ${parsed.data.educatorType}.`
        : `Your application was rejected. Reason: ${parsed.data.reason}`
    }, { transaction });
    await AuditLog.create({
      actorId: req.user.id,
      action: `educator_application_${parsed.data.decision.toLowerCase()}`,
      targetId: user.id,
      targetType: 'user',
      metadata: { applicationId: application.id, educatorType: parsed.data.educatorType || null, reason: parsed.data.reason || null }
    }, { transaction });
    await transaction.commit();
    await sendOptionalEmail(user.email, parsed.data.decision, parsed.data.reason);
    res.status(200).json({ status: 'success', data: application });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};

exports.createInvite = async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().trim().email().max(254),
      educatorType: z.enum(['COMPETITIVE', 'COLLEGE', 'BOTH'])
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new BadRequestError('Provide a valid email and educator type.'));

    const token = crypto.randomBytes(32).toString('base64url');
    const invite = await EducatorInvite.create({
      email: parsed.data.email.toLowerCase(),
      tokenHash: inviteTokenHash(token),
      educatorType: parsed.data.educatorType,
      invitedBy: req.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await AuditLog.create({
      actorId: req.user.id,
      action: 'educator_invite_created',
      targetId: invite.id,
      targetType: 'educator_invite',
      metadata: { email: invite.email, educatorType: invite.educatorType }
    });
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.status(201).json({ status: 'success', data: { id: invite.id, email: invite.email, educatorType: invite.educatorType, expiresAt: invite.expiresAt, inviteUrl: `${baseUrl}/register?invite=${encodeURIComponent(token)}` } });
  } catch (err) {
    next(err);
  }
};

exports.consumeInvite = async (token, email, transaction) => {
  if (!token) return null;
  const invite = await EducatorInvite.findOne({
    where: {
      tokenHash: inviteTokenHash(String(token)),
      email: String(email).trim().toLowerCase(),
      acceptedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {})
  });
  if (!invite) throw new BadRequestError('This educator invite is invalid, expired, or for a different email.');
  return invite;
};