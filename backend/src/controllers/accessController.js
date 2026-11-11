const { z } = require('zod');
const { Op } = require('sequelize');
const { FacultyRequest, User, AuditLog, Notification, sequelize } = require('../config/database');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

const requestSchema = z.object({
  requestedRole: z.enum(['educator', 'faculty']),
  name: z.string().trim().min(2).max(120),
  institution: z.string().trim().min(2).max(180),
  department: z.string().trim().min(2).max(120),
  employeeId: z.string().trim().max(120).optional().or(z.literal('')),
  proofUrl: z.string().url().max(500).optional().or(z.literal('')),
  reason: z.string().trim().min(10).max(2000)
}).refine(data => Boolean(data.employeeId || data.proofUrl), {
  message: 'Provide an employee ID or proof URL.',
  path: ['employeeId']
});

exports.createRequest = async (req, res, next) => {
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return next(new BadRequestError(parsed.error.issues[0]?.message || 'Invalid request details.'));

    const pending = await FacultyRequest.findOne({ where: { userId: req.user.id, status: 'pending' } });
    if (pending) return next(new ConflictError('You already have an access request awaiting review.'));

    const request = await FacultyRequest.create({
      ...parsed.data,
      employeeId: parsed.data.employeeId || null,
      proofUrl: parsed.data.proofUrl || null,
      userId: req.user.id
    });
    res.status(201).json({ status: 'success', data: request });
  } catch (err) {
    next(err);
  }
};

exports.getMyRequest = async (req, res, next) => {
  try {
    const request = await FacultyRequest.findOne({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['employeeId', 'proofUrl'] }
    });
    res.status(200).json({ status: 'success', data: request });
  } catch (err) {
    next(err);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.status(200).json({ status: 'success', data: notifications });
  } catch (err) {
    next(err);
  }
};

exports.listRequests = async (req, res, next) => {
  try {
    const where = {};
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) where.status = req.query.status;
    const requests = await FacultyRequest.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role', 'status'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ status: 'success', results: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
};

const sendOptionalEmail = async (user, request, status, reason) => {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;
  const approvalText = status === 'approved' ? `Your ${request.requestedRole} access was approved.` : 'Your access request was not approved.';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Quizzify access request update',
        text: `${approvalText}${reason ? ` Reason: ${reason}` : ''}`
      })
    });
  } catch {
    // In-app notifications remain authoritative if the optional provider is unavailable.
  }
};

exports.decideRequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const decisionSchema = z.object({ status: z.enum(['approved', 'rejected']), reason: z.string().trim().max(1000).optional() });
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError('Choose approve or reject and provide a valid optional reason.');

    const request = await FacultyRequest.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!request) throw new NotFoundError('Access request not found.');
    if (request.status === 'approved') throw new ConflictError('This request has already been approved.');

    const user = await User.findByPk(request.userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw new NotFoundError('Requesting user no longer exists.');
    const previousRole = user.role;
    request.status = parsed.data.status;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.reviewReason = parsed.data.reason || null;
    await request.save({ transaction });

    if (parsed.data.status === 'approved') {
      user.role = request.requestedRole;
      user.approvalStatus = 'APPROVED';
      user.contributorStatus = 'approved';
      await user.save({ transaction });
    }
    const message = parsed.data.status === 'approved'
      ? `Your ${request.requestedRole} access request was approved.`
      : `Your access request was rejected.${parsed.data.reason ? ` Reason: ${parsed.data.reason}` : ''}`;
    await Notification.create({
      userId: user.id,
      title: parsed.data.status === 'approved' ? 'Access approved' : 'Access request update',
      message
    }, { transaction });
    await AuditLog.create({
      actorId: req.user.id,
      action: `faculty_request_${parsed.data.status}`,
      targetId: user.id,
      targetType: 'user',
      metadata: { requestId: request.id, previousRole, role: user.role, reason: parsed.data.reason || null }
    }, { transaction });

    await transaction.commit();
    await sendOptionalEmail(user, request, parsed.data.status, parsed.data.reason);
    res.status(200).json({ status: 'success', data: request });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const where = {};
    const roleFilter = {
      student: 'STUDENT', educator: 'EDUCATOR', faculty: 'EDUCATOR',
      contributor: 'EDUCATOR', admin: 'ADMIN',
      STUDENT: 'STUDENT', EDUCATOR: 'EDUCATOR', ADMIN: 'ADMIN'
    };
    if (roleFilter[req.query.role]) where.role = roleFilter[req.query.role];
    if (['active', 'inactive'].includes(req.query.status)) where.status = req.query.status;
    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const result = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'educatorType', 'status', 'emailVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });
    res.status(200).json({ status: 'success', data: result.rows, total: result.count, page, pages: Math.ceil(result.count / limit) });
  } catch (err) {
    next(err);
  }
};

exports.updateUserAccess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const schema = z.object({
      role: z.enum(['STUDENT', 'EDUCATOR', 'ADMIN']),
      educatorType: z.enum(['COMPETITIVE', 'COLLEGE', 'BOTH']).optional(),
      status: z.enum(['active', 'inactive']).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError('A valid role and account status are required.');
    const target = await User.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!target) throw new NotFoundError('User not found.');
    if (parsed.data.role === 'EDUCATOR' && !parsed.data.educatorType && !target.educatorType) {
      throw new BadRequestError('Choose an educator type when granting educator access.');
    }
    const previous = { role: target.role, educatorType: target.educatorType, status: target.status };
    target.role = parsed.data.role;
    target.educatorType = parsed.data.role === 'EDUCATOR' ? (parsed.data.educatorType || target.educatorType) : null;
    if (parsed.data.role === 'EDUCATOR') {
      if (target.approvalStatus === 'PENDING') target.approvalStatus = 'APPROVED';
      if (!target.contributorStatus) target.contributorStatus = 'approved';
    }
    if (parsed.data.status) target.status = parsed.data.status;
    await target.save({ transaction });
    await AuditLog.create({
      actorId: req.user.id,
      action: 'user_access_changed',
      targetId: target.id,
      targetType: 'user',
      metadata: { previous, current: { role: target.role, educatorType: target.educatorType, status: target.status } }
    }, { transaction });
    if (previous.role !== target.role || previous.status !== target.status) {
      await Notification.create({
        userId: target.id,
        title: 'Account access updated',
        message: `Your account role is now ${target.role}${target.educatorType ? ` (${target.educatorType})` : ''} and status is ${target.status}.`
      }, { transaction });
    }
    await transaction.commit();
    res.status(200).json({ status: 'success', data: { id: target.id, name: target.name, email: target.email, role: target.role, educatorType: target.educatorType, status: target.status } });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    next(err);
  }
};