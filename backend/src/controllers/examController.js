const {
  Exam, ExamEdition, ExamSubject, ExamTopic, Quiz, Question, User, sequelize
} = require('../config/database');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/errors');

// ═══════════════════════════════════════════════════════════════════════════
// EXAMS
// ═══════════════════════════════════════════════════════════════════════════

exports.listExams = async (req, res, next) => {
  try {
    const exams = await Exam.findAll({
      include: [{ model: ExamEdition, as: 'editions', attributes: ['id', 'year', 'is_active'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ status: 'success', results: exams.length, data: exams });
  } catch (err) { next(err); }
};

exports.createExam = async (req, res, next) => {
  try {
    const { name, code, description, logo_url, status } = req.body;
    if (!name || !code) return next(new BadRequestError('Exam name and code are required.'));

    const existing = await Exam.findOne({ where: { code: code.toUpperCase() } });
    if (existing) return next(new ConflictError('An exam with this code already exists.'));

    const exam = await Exam.create({
      name,
      code: code.toUpperCase(),
      description,
      logo_url: logo_url || null,
      status: status || 'active'
    });
    res.status(201).json({ status: 'success', data: exam });
  } catch (err) { next(err); }
};

exports.updateExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { name, description, logo_url, status } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) return next(new NotFoundError('Exam not found.'));

    if (name) exam.name = name;
    if (description !== undefined) exam.description = description;
    if (logo_url !== undefined) exam.logo_url = logo_url;
    if (status) exam.status = status;

    await exam.save();
    res.status(200).json({ status: 'success', data: exam });
  } catch (err) { next(err); }
};

exports.deleteExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findByPk(examId);
    if (!exam) return next(new NotFoundError('Exam not found.'));
    await exam.destroy();
    res.status(200).json({ status: 'success', message: 'Exam deleted successfully.' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXAM EDITIONS
// ═══════════════════════════════════════════════════════════════════════════

exports.listEditions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findByPk(examId);
    if (!exam) return next(new NotFoundError('Exam not found.'));

    const editions = await ExamEdition.findAll({
      where: { examId },
      include: [{ model: ExamSubject, as: 'subjects', attributes: ['id', 'name', 'status'] }],
      order: [['year', 'DESC']]
    });
    res.status(200).json({ status: 'success', results: editions.length, data: editions });
  } catch (err) { next(err); }
};

exports.createEdition = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { year, description, is_active } = req.body;

    const exam = await Exam.findByPk(examId);
    if (!exam) return next(new NotFoundError('Exam not found.'));
    if (!year) return next(new BadRequestError('Year is required.'));

    const edition = await ExamEdition.create({
      examId,
      year: parseInt(year, 10),
      description,
      is_active: is_active !== false
    });
    res.status(201).json({ status: 'success', data: edition });
  } catch (err) { next(err); }
};

exports.updateEdition = async (req, res, next) => {
  try {
    const { editionId } = req.params;
    const { year, description, is_active } = req.body;

    const edition = await ExamEdition.findByPk(editionId);
    if (!edition) return next(new NotFoundError('Edition not found.'));

    if (year) edition.year = parseInt(year, 10);
    if (description !== undefined) edition.description = description;
    if (is_active !== undefined) edition.is_active = is_active;

    await edition.save();
    res.status(200).json({ status: 'success', data: edition });
  } catch (err) { next(err); }
};

exports.deleteEdition = async (req, res, next) => {
  try {
    const { editionId } = req.params;
    const edition = await ExamEdition.findByPk(editionId);
    if (!edition) return next(new NotFoundError('Edition not found.'));
    await edition.destroy();
    res.status(200).json({ status: 'success', message: 'Edition deleted successfully.' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXAM SUBJECTS
// ═══════════════════════════════════════════════════════════════════════════

exports.listSubjects = async (req, res, next) => {
  try {
    const { editionId } = req.params;
    const edition = await ExamEdition.findByPk(editionId);
    if (!edition) return next(new NotFoundError('Edition not found.'));

    const subjects = await ExamSubject.findAll({
      where: { examEditionId: editionId },
      include: [{ model: ExamTopic, as: 'topics', attributes: ['id', 'name', 'status'] }],
      order: [['name', 'ASC']]
    });
    res.status(200).json({ status: 'success', results: subjects.length, data: subjects });
  } catch (err) { next(err); }
};

exports.createSubject = async (req, res, next) => {
  try {
    const { editionId } = req.params;
    const { name, description, status } = req.body;

    const edition = await ExamEdition.findByPk(editionId);
    if (!edition) return next(new NotFoundError('Edition not found.'));
    if (!name) return next(new BadRequestError('Subject name is required.'));

    const subject = await ExamSubject.create({
      examEditionId: editionId,
      name,
      description,
      status: status || 'active'
    });
    res.status(201).json({ status: 'success', data: subject });
  } catch (err) { next(err); }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { name, description, status } = req.body;

    const subject = await ExamSubject.findByPk(subjectId);
    if (!subject) return next(new NotFoundError('Subject not found.'));

    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (status) subject.status = status;

    await subject.save();
    res.status(200).json({ status: 'success', data: subject });
  } catch (err) { next(err); }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subject = await ExamSubject.findByPk(subjectId);
    if (!subject) return next(new NotFoundError('Subject not found.'));
    await subject.destroy();
    res.status(200).json({ status: 'success', message: 'Subject deleted successfully.' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXAM TOPICS
// ═══════════════════════════════════════════════════════════════════════════

exports.listTopics = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subject = await ExamSubject.findByPk(subjectId);
    if (!subject) return next(new NotFoundError('Subject not found.'));

    const topics = await ExamTopic.findAll({
      where: { subjectId },
      order: [['name', 'ASC']]
    });
    res.status(200).json({ status: 'success', results: topics.length, data: topics });
  } catch (err) { next(err); }
};

exports.createTopic = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { name, description, status } = req.body;

    const subject = await ExamSubject.findByPk(subjectId);
    if (!subject) return next(new NotFoundError('Subject not found.'));
    if (!name) return next(new BadRequestError('Topic name is required.'));

    const topic = await ExamTopic.create({
      subjectId,
      name,
      description,
      status: status || 'active'
    });
    res.status(201).json({ status: 'success', data: topic });
  } catch (err) { next(err); }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { name, description, status } = req.body;

    const topic = await ExamTopic.findByPk(topicId);
    if (!topic) return next(new NotFoundError('Topic not found.'));

    if (name) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (status) topic.status = status;

    await topic.save();
    res.status(200).json({ status: 'success', data: topic });
  } catch (err) { next(err); }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const topic = await ExamTopic.findByPk(topicId);
    if (!topic) return next(new NotFoundError('Topic not found.'));
    await topic.destroy();
    res.status(200).json({ status: 'success', message: 'Topic deleted successfully.' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// QUIZZES UNDER A TOPIC (public read — used by faculty dropdowns & student browse)
// ═══════════════════════════════════════════════════════════════════════════

exports.listQuizzesByTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const topic = await ExamTopic.findByPk(topicId);
    if (!topic) return next(new NotFoundError('Topic not found.'));

    const quizzes = await Quiz.findAll({
      where: { examTopicId: topicId },
      include: [
        { model: Question, as: 'questions', attributes: ['id', 'marks'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const mapped = quizzes.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      duration: q.duration,
      maxAttempts: q.maxAttempts,
      questionCount: q.questions.length,
      totalMarks: q.questions.reduce((sum, qn) => sum + (qn.marks || 0), 0)
    }));

    res.status(200).json({ status: 'success', results: mapped.length, data: mapped });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN STATS — extend to include exam counts
// ═══════════════════════════════════════════════════════════════════════════

exports.getExamStats = async (req, res, next) => {
  try {
    const activeExams = await Exam.count({ where: { status: 'active' } });
    const activeEditions = await ExamEdition.count({ where: { is_active: true } });
    res.status(200).json({ status: 'success', data: { activeExams, activeEditions } });
  } catch (err) { next(err); }
};
