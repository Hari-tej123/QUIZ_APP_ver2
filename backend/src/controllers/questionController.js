const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const sanitizeHtml = require('sanitize-html');
const { z } = require('zod');
const { Op } = require('sequelize');
const { Question, Quiz, Course } = require('../config/database');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

const questionSchema = z.object({
  questionText: z.string().trim().min(1).max(5000),
  questionType: z.enum(['mcq', 'multiple-select', 'numeric', 'short-answer']),
  options: z.array(z.string().trim().min(1).max(500)).max(4),
  correctAnswers: z.array(z.string().trim().min(1).max(500)).min(1).max(4),
  explanation: z.string().max(5000).optional().nullable(),
  subject: z.string().trim().min(1).max(120),
  topic: z.string().trim().min(1).max(120),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.coerce.number().int().min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  track: z.enum(['competitive', 'exam', 'college']),
  status: z.enum(['draft', 'published']).default('draft'),
  quizId: z.string().uuid().nullable().optional()
}).superRefine((data, ctx) => {
  const choiceQuestion = ['mcq', 'multiple-select'].includes(data.questionType);
  if (choiceQuestion && data.options.length < 2) {
    ctx.addIssue({ code: 'custom', message: 'Choice questions require at least two options.', path: ['options'] });
  }
  if (choiceQuestion) {
    const validAnswers = data.options.map((_, index) => String.fromCharCode(65 + index));
    if (data.correctAnswers.some(answer => !validAnswers.includes(answer.toUpperCase()))) {
      ctx.addIssue({ code: 'custom', message: 'Correct answers must refer to an available option (A-D).', path: ['correctAnswers'] });
    }
    if (data.questionType === 'mcq' && data.correctAnswers.length !== 1) {
      ctx.addIssue({ code: 'custom', message: 'MCQ questions require exactly one correct answer.', path: ['correctAnswers'] });
    }
  }
});

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* Accept pipe-separated values in CSV uploads. */ }
  return value.split('|').map(item => item.trim()).filter(Boolean);
};

const normalizePayload = (body) => {
  const payload = { ...body };
  payload.options = parseArray(payload.options);
  payload.correctAnswers = parseArray(payload.correctAnswers);
  payload.tags = parseArray(payload.tags);
  if (!payload.correctAnswers.length && payload.correctAnswer) payload.correctAnswers = [payload.correctAnswer];
  if (payload.quizId === '') payload.quizId = null;
  if (payload.explanation === '') payload.explanation = null;
  return payload;
};

const validatePayload = (body) => {
  const parsed = questionSchema.safeParse(normalizePayload(body));
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message || 'Invalid question data.');
  const clean = parsed.data;
  clean.questionText = sanitizeHtml(clean.questionText, { allowedTags: [], allowedAttributes: {} }).trim();
  clean.explanation = clean.explanation
    ? sanitizeHtml(clean.explanation, { allowedTags: [], allowedAttributes: {} }).trim()
    : null;
  if (!clean.questionText) throw new BadRequestError('Question text is required.');
  clean.correctAnswers = clean.correctAnswers.map(answer => answer.trim());
  return clean;
};

const requireTrackPermission = (user, track) => {
  if (['ADMIN', 'admin'].includes(user.role)) return;
  const isLegacyApprovedContributor = user.role === 'contributor' && user.contributorStatus === 'approved';
  const educatorType = user.educatorType || (user.role === 'faculty' ? 'COLLEGE' : isLegacyApprovedContributor ? 'COMPETITIVE' : null);
  const requestedType = track === 'college' ? 'COLLEGE' : 'COMPETITIVE';
  if (['EDUCATOR', 'educator', 'faculty', 'contributor'].includes(user.role) &&
      (user.role !== 'contributor' || isLegacyApprovedContributor) &&
      (educatorType === 'BOTH' || educatorType === requestedType)) return;
  throw new ForbiddenError('You do not have permission to manage questions in this track.');
};

const verifyQuiz = async (quizId, user) => {
  if (!quizId) return;
  const quiz = await Quiz.findByPk(quizId, {
    include: [{ model: Course, as: 'course', required: false }]
  });
  if (!quiz) throw new BadRequestError('The selected quiz does not exist.');
  const ownsQuiz = quiz.ownerId === user.id || quiz.authorId === user.id || quiz.course?.facultyId === user.id;
  if (user.role !== 'admin' && !ownsQuiz) throw new ForbiddenError('You cannot add questions to this quiz.');
};

const toQuestionValues = (payload, user, imageUrl) => {
  const options = payload.options;
  const labels = options.map((_, index) => String.fromCharCode(65 + index));
  const choiceType = ['mcq', 'multiple-select'].includes(payload.questionType);
  const correctAnswers = choiceType
    ? payload.correctAnswers.map(answer => answer.toUpperCase())
    : payload.correctAnswers;
  return {
    ...payload,
    questionText: payload.questionText,
    options,
    correctAnswers,
    optionA: options[0] || null,
    optionB: options[1] || null,
    optionC: options[2] || null,
    optionD: options[3] || null,
    correctOption: payload.questionType === 'mcq' ? correctAnswers[0] : null,
    tags: payload.tags.join(', '),
    createdBy: user.id,
    ...(imageUrl ? { imageUrl } : {})
  };
};

const saveQuestionImage = (file) => {
  if (!file) return null;
  const signatures = [
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }
  ];
  const signature = signatures.find(item => item.mime === file.mimetype && item.bytes.every((byte, index) => file.buffer[index] === byte));
  if (!signature || (file.mimetype === 'image/webp' && file.buffer.toString('ascii', 8, 12) !== 'WEBP')) {
    throw new BadRequestError('The uploaded image file is invalid.');
  }
  const folder = path.join(__dirname, '../../uploads/questions');
  fs.mkdirSync(folder, { recursive: true });
  const extension = file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/png' ? '.png' : '.webp';
  const filename = `${crypto.randomUUID()}${extension}`;
  fs.writeFileSync(path.join(folder, filename), file.buffer);
  return `/uploads/questions/${filename}`;
};

exports.listMine = async (req, res, next) => {
  try {
    const where = ['ADMIN', 'admin'].includes(req.user.role) ? {} : { createdBy: req.user.id };
    if (['competitive', 'exam'].includes(req.query.track)) where.track = req.query.track;
    if (['draft', 'published'].includes(req.query.status)) where.status = req.query.status;
    if (['easy', 'medium', 'hard'].includes(req.query.difficulty)) where.difficulty = req.query.difficulty;
    if (req.query.search) where.questionText = { [Op.iLike]: `%${String(req.query.search).trim().slice(0, 100)}%` };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const result = await Question.findAndCountAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });
    res.status(200).json({ status: 'success', data: result.rows, total: result.count, page, pages: Math.ceil(result.count / limit) });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const payload = validatePayload(req.body);
    requireTrackPermission(req.user, payload.track);
    await verifyQuiz(payload.quizId, req.user);
    const imageUrl = saveQuestionImage(req.file);
    const question = await Question.create(toQuestionValues(payload, req.user, imageUrl));
    res.status(201).json({ status: 'success', data: question });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) throw new NotFoundError('Question not found.');
    if (!['ADMIN', 'admin'].includes(req.user.role) && question.createdBy !== req.user.id) throw new ForbiddenError('You can only edit questions you created.');
    const payload = validatePayload({ ...question.get({ plain: true }), ...req.body });
    requireTrackPermission(req.user, payload.track);
    await verifyQuiz(payload.quizId, req.user);
    const imageUrl = saveQuestionImage(req.file);
    await question.update(toQuestionValues(payload, req.user, imageUrl || question.imageUrl));
    res.status(200).json({ status: 'success', data: question });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) throw new NotFoundError('Question not found.');
    if (!['ADMIN', 'admin'].includes(req.user.role) && question.createdBy !== req.user.id) throw new ForbiddenError('You can only delete questions you created.');
    requireTrackPermission(req.user, question.track);
    await question.destroy();
    res.status(200).json({ status: 'success', message: 'Question deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.downloadTemplate = (req, res) => {
  const row = [{
    Question: 'What is the time complexity of binary search?',
    Type: 'mcq',
    Options: '["O(1)","O(log n)","O(n)"]',
    'Correct Answers': '["B"]',
    Explanation: 'Each step halves the search interval.',
    Subject: 'Computer Science',
    Topic: 'Algorithms',
    Difficulty: 'medium',
    Marks: 1,
    Tags: 'search|complexity',
    Track: ['exam', 'college'].includes(req.query.track) ? req.query.track : 'competitive',
    Status: 'draft',
    'Quiz ID': ''
  }];
  const sheet = XLSX.utils.json_to_sheet(row);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Question Template');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=question-upload-template.xlsx');
  res.send(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));
};

exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.file) throw new BadRequestError('Upload a CSV or Excel file.');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    if (!rows.length) throw new BadRequestError('The uploaded file contains no question rows.');
    const created = [];
    const errors = [];
    for (const [index, row] of rows.entries()) {
      try {
        const payload = validatePayload({
          questionText: row.Question,
          questionType: row.Type || 'mcq',
          options: row.Options,
          correctAnswers: row['Correct Answers'],
          explanation: row.Explanation,
          subject: row.Subject,
          topic: row.Topic,
          difficulty: row.Difficulty || 'medium',
          marks: row.Marks,
          tags: row.Tags,
          track: row.Track || req.body.track,
          status: row.Status || 'draft',
          quizId: row['Quiz ID'] || req.body.quizId || null
        });
        requireTrackPermission(req.user, payload.track);
        await verifyQuiz(payload.quizId, req.user);
        created.push(await Question.create(toQuestionValues(payload, req.user)));
      } catch (err) {
        errors.push({ row: index + 2, error: err.message || 'Invalid question row.' });
      }
    }
    res.status(errors.length ? 207 : 201).json({
      status: errors.length ? 'partial' : 'success',
      created: created.length,
      errors
    });
  } catch (err) {
    next(err);
  }
};

exports.validatePayload = validatePayload;
exports.requireTrackPermission = requireTrackPermission;