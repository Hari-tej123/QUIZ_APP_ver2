const { Course, Subtopic, Quiz, Question, QuizAttempt, User, sequelize } = require('../config/database');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const excelService = require('../services/excelService');
const path = require('path');
const fs = require('fs');

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, subject } = req.body;

    if (!title || !description || !subject) {
      return next(new BadRequestError('Missing course title, description, or subject.'));
    }

    const course = await Course.create({
      title,
      description,
      subject,
      facultyId: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: course
    });
  } catch (err) {
    next(err);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      where: { facultyId: req.user.id },
      include: [
        { model: Subtopic, as: 'subtopics' },
        { model: Quiz, as: 'quizzes' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses
    });
  } catch (err) {
    next(err);
  }
};

exports.createSubtopic = async (req, res, next) => {
  try {
    const { courseId, title, description } = req.body;

    if (!courseId || !title) {
      return next(new BadRequestError('Course ID and title are required.'));
    }

    // Verify course belongs to this faculty
    const course = await Course.findOne({ where: { id: courseId, facultyId: req.user.id } });
    if (!course) {
      return next(new NotFoundError('Course not found or unauthorized.'));
    }

    let fileData = {};
    if (req.file) {
      fileData = {
        filePath: `uploads/materials/${req.file.filename}`,
        fileName: req.file.originalname,
        fileType: path.extname(req.file.originalname).substring(1).toLowerCase()
      };
    }

    const subtopic = await Subtopic.create({
      courseId,
      title,
      description,
      ...fileData
    });

    res.status(201).json({
      status: 'success',
      data: subtopic
    });
  } catch (err) {
    next(err);
  }
};

exports.createQuiz = async (req, res, next) => {
  try {
    const {
      courseId, subtopicId, title, description, duration, maxAttempts,
      startTimeWindow, endTimeWindow,
      // Optional exam-hierarchy linkage (additive, does not affect existing flow)
      examEditionId, examSubjectId, examTopicId
    } = req.body;

    if (!courseId || !subtopicId || !title || !duration) {
      return next(new BadRequestError('Course, Subtopic, Title, and Duration are required.'));
    }

    // Verify course belongs to this faculty
    const course = await Course.findOne({ where: { id: courseId, facultyId: req.user.id } });
    if (!course) {
      return next(new NotFoundError('Course not found or unauthorized.'));
    }

    // Verify subtopic belongs to this course
    const subtopic = await Subtopic.findOne({ where: { id: subtopicId, courseId } });
    if (!subtopic) {
      return next(new NotFoundError('Subtopic not found in this course.'));
    }

    const quiz = await Quiz.create({
      courseId,
      subtopicId,
      title,
      description,
      duration: parseInt(duration, 10),
      maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : null,
      startTimeWindow: startTimeWindow || null,
      endTimeWindow: endTimeWindow || null,
      // Exam hierarchy (nullable — both paths coexist)
      examEditionId: examEditionId || null,
      examSubjectId: examSubjectId || null,
      examTopicId: examTopicId || null
    });

    res.status(201).json({
      status: 'success',
      data: quiz
    });
  } catch (err) {
    next(err);
  }
};

exports.downloadTemplate = (req, res) => {
  const templateBuffer = excelService.generateTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=questions_upload_template.xlsx');
  res.send(templateBuffer);
};

exports.bulkUploadQuestions = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { quizId } = req.params;

    if (!req.file) {
      await transaction.rollback();
      return next(new BadRequestError('Please upload an Excel file containing questions.'));
    }

    // Verify quiz exists and belongs to this faculty's course
    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      await transaction.rollback();
      return next(new NotFoundError('Quiz not found.'));
    }

    if (quiz.course.facultyId !== req.user.id) {
      await transaction.rollback();
      return next(new BadRequestError('You do not have permission to manage this quiz.'));
    }

    // Parse and validate Excel buffer
    const validationResult = excelService.parseAndValidateQuestions(req.file.buffer);

    if (!validationResult.isValid) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'fail',
        message: 'Excel validation failed.',
        errors: validationResult.errors
      });
    }

    // Format questions with quizId
    const questionsToInsert = validationResult.questions.map(q => ({
      ...q,
      quizId,
      questionType: 'mcq',
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswers: [q.correctOption],
      track: quiz.examTopicId ? 'exam' : 'competitive',
      status: 'published',
      createdBy: req.user.id
    }));

    // Delete existing questions for this quiz if faculty uploads a new template (optional, let's keep it simple: append or replace? Let's clear and replace to ensure sync)
    await Question.destroy({ where: { quizId }, transaction });

    // Bulk create questions
    const createdQuestions = await Question.bulkCreate(questionsToInsert, { transaction });

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: `Successfully uploaded and validated ${createdQuestions.length} questions.`,
      count: createdQuestions.length
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getQuizAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    // Verify quiz course belongs to this faculty
    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz || quiz.course.facultyId !== req.user.id) {
      return next(new NotFoundError('Quiz not found or unauthorized.'));
    }

    const attempts = await QuizAttempt.findAll({
      where: { quizId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email', 'rollNumber'] }
      ],
      order: [['startTime', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: attempts
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteQuizAttempt = async (req, res, next) => {
  try {
    const { quizId, attemptId } = req.params;

    // Verify quiz course belongs to this faculty
    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz || quiz.course.facultyId !== req.user.id) {
      return next(new NotFoundError('Quiz not found or unauthorized.'));
    }

    const attempt = await QuizAttempt.findOne({ where: { id: attemptId, quizId } });
    if (!attempt) {
      return next(new NotFoundError('Attempt not found.'));
    }

    await attempt.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Attempt deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getQuizAnalytics = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        { model: Course, as: 'course' },
        { model: Question, as: 'questions' }
      ]
    });

    if (!quiz || quiz.course.facultyId !== req.user.id) {
      return next(new NotFoundError('Quiz not found or unauthorized.'));
    }

    // Aggregate statistics
    const attempts = await QuizAttempt.findAll({
      where: { quizId, status: ['completed', 'auto-submitted'] }
    });

    if (attempts.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          quizTitle: quiz.title,
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          distribution: []
        }
      });
    }

    const scores = attempts.map(a => a.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const averageScore = parseFloat((sum / attempts.length).toFixed(2));

    // Distribution (e.g. 0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
    // Let's find out the max possible marks
    const maxMarksResult = await Question.findOne({
      attributes: [[sequelize.fn('SUM', sequelize.col('marks')), 'totalMarks']],
      where: { quizId }
    });
    const maxMarks = maxMarksResult ? parseInt(maxMarksResult.get('totalMarks') || 0, 10) : 10;

    const ranges = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0
    };

    attempts.forEach(a => {
      const percentage = maxMarks > 0 ? (a.score / maxMarks) * 100 : 0;
      if (percentage <= 20) ranges['0-20%']++;
      else if (percentage <= 40) ranges['21-40%']++;
      else if (percentage <= 60) ranges['41-60%']++;
      else if (percentage <= 80) ranges['61-80%']++;
      else ranges['81-100%']++;
    });

    const distribution = Object.keys(ranges).map(key => ({
      range: key,
      count: ranges[key]
    }));

    res.status(200).json({
      status: 'success',
      data: {
        quizTitle: quiz.title,
        totalQuestions: quiz.questions.length,
        maxPossibleMarks: maxMarks,
        totalAttempts: attempts.length,
        averageScore,
        highestScore,
        lowestScore,
        distribution
      }
    });
  } catch (err) {
    next(err);
  }
};
