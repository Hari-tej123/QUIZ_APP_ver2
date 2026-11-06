const {
  Course,
  Subtopic,
  Quiz,
  Question,
  QuizAttempt,
  AttemptAnswer,
  Enrollment,
  User,
  Exam,
  ExamEdition,
  ExamSubject,
  ExamTopic,
  UserExamPreference,
  StudyMaterial,
  StudentQuestionRecord,
  PlatformSetting,
  Payout,
  sequelize
} = require('../config/database');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { Op } = require('sequelize');

// ─── Course Catalog & Enrollment ────────────────────────────────────────────
exports.getAvailableCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const courses = await Course.findAll({
      include: [
        { model: User, as: 'faculty', attributes: ['id', 'name', 'email', 'department'] },
        { model: Subtopic, as: 'subtopics', attributes: ['id', 'title'] },
        { model: Quiz, as: 'quizzes', where: { isPublished: true }, required: false, attributes: ['id', 'title'] },
        { model: StudyMaterial, as: 'materials', where: { status: 'approved' }, required: false, attributes: ['id', 'title', 'type'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const enrollments = await Enrollment.findAll({ where: { studentId } });
    const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

    const data = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      subject: course.subject,
      facultyName: course.faculty?.name || 'Faculty Instructor',
      isEnrolled: enrolledCourseIds.has(course.id),
      subtopicCount: course.subtopics ? course.subtopics.length : 0,
      quizCount: course.quizzes ? course.quizzes.length : 0,
      materialCount: course.materials ? course.materials.length : 0
    }));

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (err) {
    next(err);
  }
};

exports.enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.id;

    if (!courseId) {
      return next(new BadRequestError('Course ID is required.'));
    }

    const course = await Course.findByPk(courseId);
    if (!course) {
      return next(new NotFoundError('Course not found.'));
    }

    const existingEnrollment = await Enrollment.findOne({ where: { studentId, courseId } });
    if (existingEnrollment) {
      return next(new BadRequestError('You are already enrolled in this course.'));
    }

    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      enrolledAt: new Date()
    });

    res.status(201).json({
      status: 'success',
      message: 'Successfully enrolled in course.',
      data: enrollment
    });
  } catch (err) {
    next(err);
  }
};

exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.findAll({
      where: { studentId },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            { model: User, as: 'faculty', attributes: ['id', 'name', 'email'] },
            { model: Subtopic, as: 'subtopics', attributes: ['id', 'title'] },
            { model: Quiz, as: 'quizzes', where: { isPublished: true }, required: false, attributes: ['id'] }
          ]
        }
      ],
      order: [['enrolledAt', 'DESC']]
    });

    const data = enrollments.map(e => ({
      enrollmentId: e.id,
      enrolledAt: e.enrolledAt,
      course: {
        id: e.course.id,
        title: e.course.title,
        description: e.course.description,
        subject: e.course.subject,
        facultyName: e.course.faculty?.name || 'Faculty',
        subtopics: e.course.subtopics || [],
        quizCount: e.course.quizzes ? e.course.quizzes.length : 0
      }
    }));

    res.status(200).json({
      status: 'success',
      data
    });
  } catch (err) {
    next(err);
  }
};

exports.getCourseDetails = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const course = await Course.findByPk(courseId, {
      include: [
        { model: User, as: 'faculty', attributes: ['id', 'name', 'email', 'department'] },
        {
          model: Subtopic,
          as: 'subtopics',
          include: [
            {
              model: Quiz,
              as: 'quizzes',
              where: { isPublished: true },
              required: false,
              include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge'] }]
            },
            {
              model: StudyMaterial,
              as: 'materials',
              where: { status: 'approved' },
              required: false,
              include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge'] }]
            }
          ]
        },
        {
          model: Quiz,
          as: 'quizzes',
          where: { isPublished: true, subtopicId: null },
          required: false,
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge'] }]
        }
      ]
    });

    if (!course) {
      return next(new NotFoundError('Course not found.'));
    }

    const enrollment = await Enrollment.findOne({ where: { studentId, courseId } });

    res.status(200).json({
      status: 'success',
      data: {
        course,
        isEnrolled: !!enrollment
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Topic Resources Hub (Materials & Quizzes with Attribution) ─────────────
exports.getTopicResources = async (req, res, next) => {
  try {
    const { topicId } = req.params; // Can be an examTopicId or subtopicId
    const { track } = req.query; // 'competitive' or 'college'

    let topicData = null;
    let materials = [];
    let quizzes = [];

    if (track === 'college') {
      topicData = await Subtopic.findByPk(topicId, {
        include: [{ model: Course, as: 'course' }]
      });
      if (topicData) {
        materials = await StudyMaterial.findAll({
          where: { subtopicId: topicId, status: 'approved' },
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge', 'subjectExpertise'] }],
          order: [['createdAt', 'DESC']]
        });
        quizzes = await Quiz.findAll({
          where: { subtopicId: topicId, isPublished: true },
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge'] }],
          order: [['createdAt', 'DESC']]
        });
      }
    } else {
      // Default: competitive exam topic
      topicData = await ExamTopic.findByPk(topicId, {
        include: [{
          model: ExamSubject,
          as: 'subject',
          include: [{
            model: ExamEdition,
            as: 'edition',
            include: [{ model: Exam, as: 'exam' }]
          }]
        }]
      });
      if (topicData) {
        materials = await StudyMaterial.findAll({
          where: { examTopicId: topicId, status: 'approved' },
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge', 'subjectExpertise'] }],
          order: [['createdAt', 'DESC']]
        });
        quizzes = await Quiz.findAll({
          where: { examTopicId: topicId, isPublished: true },
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'badge'] }],
          order: [['createdAt', 'DESC']]
        });
      }
    }

    if (!topicData) {
      return next(new NotFoundError('Topic not found.'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        topic: topicData,
        materials,
        quizzes
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Quiz-Taking: Start Attempt (Mock vs Practice Mode) ──────────────────────
exports.startQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;
    const { mode = 'mock', action } = req.body || {}; // mode: 'mock' (timed) | 'practice' (instant feedback)

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        { model: Course, as: 'course', required: false },
        { model: ExamTopic, as: 'examTopic', required: false },
        { model: User, as: 'author', attributes: ['id', 'name', 'badge', 'subjectExpertise'], required: false }
      ]
    });

    if (!quiz) {
      return next(new NotFoundError('Quiz not found.'));
    }

    // Auto-enroll if college quiz
    if (quiz.courseId && !quiz.examTopicId) {
      await Enrollment.findOrCreate({
        where: { studentId, courseId: quiz.courseId },
        defaults: { enrolledAt: new Date() }
      }).catch(() => {});
    }

    // Check for existing in-progress attempt
    const existingInProgress = await QuizAttempt.findOne({
      where: { quizId, studentId, status: 'in-progress' },
      include: [{ model: AttemptAnswer, as: 'answers' }]
    });

    const fetchQuestions = async () => {
      return Question.findAll({
        where: { quizId },
        attributes: ['id', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'marks', 'difficulty', 'tags', 'explanation'],
        order: [['createdAt', 'ASC']]
      });
    };

    // Bookmarks for student
    const bookmarks = await StudentQuestionRecord.findAll({
      where: { studentId, isBookmarked: true }
    });
    const bookmarkedIds = new Set(bookmarks.map(b => b.questionId));

    if (existingInProgress) {
      if (action === 'terminate') {
        existingInProgress.status = 'aborted';
        existingInProgress.submitTime = new Date();
        await existingInProgress.save();
      } else if (action === 'resume') {
        const questions = await fetchQuestions();
        const savedAnswers = existingInProgress.answers.map(a => ({
          questionId: a.questionId,
          selectedOption: a.selectedOption,
          isCorrect: a.isCorrect
        }));

        return res.status(200).json({
          status: 'success',
          attempt: existingInProgress,
          quizTitle: quiz.title,
          quizDescription: quiz.description,
          quizDuration: quiz.duration,
          mode: existingInProgress.mode || mode,
          author: quiz.author,
          questions: questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            marks: q.marks,
            difficulty: q.difficulty,
            tags: q.tags,
            isBookmarked: bookmarkedIds.has(q.id),
            // Expose explanation in practice mode only if needed
            explanation: existingInProgress.mode === 'practice' ? q.explanation : undefined
          })),
          savedAnswers
        });
      } else {
        return res.status(200).json({
          status: 'success',
          needsDecision: true,
          existingAttempt: existingInProgress,
          quizTitle: quiz.title,
          quizDuration: quiz.duration,
          mode: existingInProgress.mode,
          message: 'You have an unfinished attempt. Would you like to resume it or start a new attempt?'
        });
      }
    }

    const totalAttempts = await QuizAttempt.count({ where: { quizId, studentId } });

    const newAttempt = await QuizAttempt.create({
      quizId,
      studentId,
      attemptNumber: totalAttempts + 1,
      startTime: new Date(),
      status: 'in-progress',
      score: 0.0,
      mode: ['mock', 'practice'].includes(mode) ? mode : 'mock'
    });

    const questions = await fetchQuestions();

    res.status(201).json({
      status: 'success',
      attempt: newAttempt,
      quizTitle: quiz.title,
      quizDescription: quiz.description,
      quizDuration: quiz.duration,
      mode: newAttempt.mode,
      author: quiz.author,
      questions: questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        marks: q.marks,
        difficulty: q.difficulty,
        tags: q.tags,
        isBookmarked: bookmarkedIds.has(q.id)
      })),
      savedAnswers: []
    });
  } catch (err) {
    next(err);
  }
};

// ─── Practice Mode: Instant Check Question Answer ───────────────────────────
exports.checkQuestionAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption } = req.body;
    const studentId = req.user.id;

    if (!questionId || !selectedOption) {
      return next(new BadRequestError('Question ID and selected option are required.'));
    }

    const attempt = await QuizAttempt.findOne({ where: { id: attemptId, studentId } });
    if (!attempt) {
      return next(new NotFoundError('Attempt not found.'));
    }

    const question = await Question.findByPk(questionId);
    if (!question) {
      return next(new NotFoundError('Question not found.'));
    }

    const isCorrect = selectedOption.toUpperCase() === question.correctOption;
    const marksObtained = isCorrect ? question.marks : 0;

    // Save AttemptAnswer
    const [answer, created] = await AttemptAnswer.findOrCreate({
      where: { attemptId, questionId },
      defaults: { selectedOption: selectedOption.toUpperCase(), isCorrect, marksObtained }
    });

    if (!created) {
      answer.selectedOption = selectedOption.toUpperCase();
      answer.isCorrect = isCorrect;
      answer.marksObtained = marksObtained;
      await answer.save();
    }

    // Upsert StudentQuestionRecord for mistake tracking
    const [record, rCreated] = await StudentQuestionRecord.findOrCreate({
      where: { studentId, questionId },
      defaults: {
        quizId: attempt.quizId,
        isMistake: !isCorrect,
        mistakeCount: isCorrect ? 0 : 1,
        lastSelectedOption: selectedOption.toUpperCase()
      }
    });

    if (!rCreated) {
      if (!isCorrect) {
        record.isMistake = true;
        record.mistakeCount += 1;
      }
      record.lastSelectedOption = selectedOption.toUpperCase();
      await record.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        questionId: question.id,
        selectedOption: selectedOption.toUpperCase(),
        correctOption: question.correctOption,
        isCorrect,
        explanation: question.explanation || 'No step-by-step explanation available for this question.',
        marksObtained,
        difficulty: question.difficulty,
        tags: question.tags
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Save Attempt Answer (Mock Test Autosave) ────────────────────────────────
exports.saveAttemptAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption } = req.body;
    const studentId = req.user.id;

    if (!questionId || !selectedOption) {
      return next(new BadRequestError('Question ID and selected option are required.'));
    }

    const attempt = await QuizAttempt.findByPk(attemptId, {
      include: [{ model: Quiz, as: 'quiz' }]
    });

    if (!attempt || attempt.studentId !== studentId) {
      return next(new NotFoundError('Quiz attempt not found or unauthorized.'));
    }

    if (attempt.status !== 'in-progress') {
      return next(new ForbiddenError('This quiz attempt is already closed.'));
    }

    // Only apply strict time limit for mock mode
    if (attempt.mode === 'mock') {
      const now = new Date();
      const timeLimit = new Date(attempt.startTime.getTime() + attempt.quiz.duration * 60 * 1000 + 30 * 1000);
      if (now > timeLimit) {
        return res.status(200).json({
          status: 'expired',
          message: 'Time has expired. Please submit the quiz.'
        });
      }
    }

    const question = await Question.findOne({ where: { id: questionId, quizId: attempt.quizId } });
    if (!question) {
      return next(new NotFoundError('Question not found in this quiz.'));
    }

    const isCorrect = selectedOption.toUpperCase() === question.correctOption;
    const marksObtained = isCorrect ? question.marks : 0;

    const [answer, created] = await AttemptAnswer.findOrCreate({
      where: { attemptId, questionId },
      defaults: { selectedOption: selectedOption.toUpperCase(), isCorrect, marksObtained }
    });

    if (!created) {
      answer.selectedOption = selectedOption.toUpperCase();
      answer.isCorrect = isCorrect;
      answer.marksObtained = marksObtained;
      await answer.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Answer saved.'
    });
  } catch (err) {
    next(err);
  }
};

// ─── Submit Quiz Attempt with Full Score & Analytics ────────────────────────
exports.submitQuizAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    const attempt = await QuizAttempt.findByPk(attemptId, {
      include: [
        { model: Quiz, as: 'quiz', include: [{ model: User, as: 'author' }] },
        { model: AttemptAnswer, as: 'answers' }
      ]
    });

    if (!attempt || attempt.studentId !== studentId) {
      return next(new NotFoundError('Quiz attempt not found or unauthorized.'));
    }

    if (attempt.status !== 'in-progress') {
      return res.status(200).json({
        status: 'success',
        message: 'Quiz already submitted.',
        attemptId: attempt.id
      });
    }

    const now = new Date();
    const timeSpentSeconds = Math.max(1, Math.round((now - new Date(attempt.startTime)) / 1000));

    // Get all quiz questions
    const allQuestions = await Question.findAll({ where: { quizId: attempt.quizId } });
    const totalQuestions = allQuestions.length;

    const answersMap = new Map();
    attempt.answers.forEach(a => answersMap.set(a.questionId, a));

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let totalScore = 0;

    for (const q of allQuestions) {
      const ans = answersMap.get(q.id);
      if (!ans || !ans.selectedOption) {
        skippedCount++;
      } else if (ans.isCorrect) {
        correctCount++;
        totalScore += ans.marksObtained;
        // Update mistake record if student corrected it
        const mistakeRec = await StudentQuestionRecord.findOne({ where: { studentId, questionId: q.id } });
        if (mistakeRec && mistakeRec.isMistake) {
          mistakeRec.isMistake = false;
          await mistakeRec.save();
        }
      } else {
        incorrectCount++;
        // Record into "My Mistakes" folder
        const [rec, created] = await StudentQuestionRecord.findOrCreate({
          where: { studentId, questionId: q.id },
          defaults: {
            quizId: attempt.quizId,
            isMistake: true,
            mistakeCount: 1,
            lastSelectedOption: ans.selectedOption
          }
        });
        if (!created) {
          rec.isMistake = true;
          rec.mistakeCount += 1;
          rec.lastSelectedOption = ans.selectedOption;
          await rec.save();
        }
      }
    }

    const isMock = attempt.mode === 'mock';
    const isLate = isMock && (now > new Date(attempt.startTime.getTime() + attempt.quiz.duration * 60 * 1000 + 30 * 1000));

    attempt.submitTime = now;
    attempt.score = totalScore;
    attempt.timeSpentSeconds = timeSpentSeconds;
    attempt.totalQuestions = totalQuestions;
    attempt.correctAnswers = correctCount;
    attempt.incorrectAnswers = incorrectCount;
    attempt.skippedAnswers = skippedCount;
    attempt.status = isLate ? 'auto-submitted' : 'completed';
    await attempt.save();

    // Increment Quiz totalAttempts
    if (attempt.quiz) {
      attempt.quiz.totalAttempts = (attempt.quiz.totalAttempts || 0) + 1;
      await attempt.quiz.save();

      // Revenue share to Contributor if applicable
      const author = attempt.quiz.author;
      if (author && author.role === 'contributor') {
        const revSetting = await PlatformSetting.findOne({ where: { key: 'rev_share_per_attempt' } });
        const revSharePerAttempt = revSetting ? parseFloat(revSetting.value) : 0.10;

        if (revSharePerAttempt > 0) {
          author.earningsBalance = (author.earningsBalance || 0) + revSharePerAttempt;
          author.totalEarned = (author.totalEarned || 0) + revSharePerAttempt;
          await author.save();

          await Payout.create({
            contributorId: author.id,
            amount: revSharePerAttempt,
            type: 'revenue_share',
            status: 'completed',
            paymentMethod: 'Platform RevShare',
            referenceId: `REV-${attempt.id.slice(0, 8)}`,
            notes: `Rev-share from student quiz attempt: "${attempt.quiz.title}"`,
            processedAt: new Date()
          });
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: isLate ? 'Time expired. Quiz auto-submitted.' : 'Quiz submitted successfully.',
      data: {
        attemptId: attempt.id,
        score: totalScore,
        accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        correctCount,
        incorrectCount,
        skippedCount,
        totalQuestions,
        timeSpentSeconds,
        status: attempt.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Comprehensive Attempt Results Breakdown ────────────────────────────────
exports.getAttemptResults = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    const attempt = await QuizAttempt.findOne({
      where: { id: attemptId, studentId },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          include: [
            { model: User, as: 'author', attributes: ['id', 'name', 'badge', 'subjectExpertise'] },
            { model: ExamTopic, as: 'examTopic', attributes: ['id', 'name'] },
            { model: Subtopic, as: 'subtopic', attributes: ['id', 'title'] }
          ]
        },
        { model: AttemptAnswer, as: 'answers' }
      ]
    });

    if (!attempt) {
      return next(new NotFoundError('Quiz attempt not found.'));
    }

    // Fetch all questions with answers & explanations
    const questions = await Question.findAll({
      where: { quizId: attempt.quizId },
      order: [['createdAt', 'ASC']]
    });

    // Fetch student's bookmarks
    const bookmarks = await StudentQuestionRecord.findAll({
      where: { studentId, isBookmarked: true }
    });
    const bookmarkedSet = new Set(bookmarks.map(b => b.questionId));

    const answerMap = new Map();
    attempt.answers.forEach(a => answerMap.set(a.questionId, a));

    let maxPossibleMarks = 0;
    const questionBreakdown = questions.map(q => {
      maxPossibleMarks += q.marks;
      const ans = answerMap.get(q.id);
      const selectedOption = ans ? ans.selectedOption : null;
      const isCorrect = ans ? ans.isCorrect : false;
      const isSkipped = !selectedOption;

      return {
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        selectedOption,
        correctOption: q.correctOption,
        isCorrect,
        isSkipped,
        marks: q.marks,
        marksObtained: ans ? ans.marksObtained : 0,
        explanation: q.explanation || 'No step-by-step explanation available for this question.',
        difficulty: q.difficulty,
        tags: q.tags,
        isBookmarked: bookmarkedSet.has(q.id)
      };
    });

    const totalQuestions = questions.length;
    const correctCount = questionBreakdown.filter(q => q.isCorrect).length;
    const incorrectCount = questionBreakdown.filter(q => !q.isCorrect && !q.isSkipped).length;
    const skippedCount = questionBreakdown.filter(q => q.isSkipped).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    res.status(200).json({
      status: 'success',
      data: {
        attempt: {
          id: attempt.id,
          quizId: attempt.quizId,
          quizTitle: attempt.quiz?.title || 'Quiz',
          track: attempt.quiz?.examTopicId ? 'competitive' : 'college',
          topicName: attempt.quiz?.examTopic?.name || attempt.quiz?.subtopic?.title || 'General',
          author: attempt.quiz?.author || { name: 'Quizzify Faculty', badge: 'Verified Educator' },
          mode: attempt.mode,
          score: attempt.score,
          maxPossibleMarks,
          accuracy,
          totalQuestions,
          correctCount,
          incorrectCount,
          skippedCount,
          timeSpentSeconds: attempt.timeSpentSeconds || 0,
          startTime: attempt.startTime,
          submitTime: attempt.submitTime,
          status: attempt.status
        },
        questions: questionBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Bookmarks & Mistakes Management ────────────────────────────────────────
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { notes } = req.body || {};
    const studentId = req.user.id;

    const question = await Question.findByPk(questionId);
    if (!question) {
      return next(new NotFoundError('Question not found.'));
    }

    const [record, created] = await StudentQuestionRecord.findOrCreate({
      where: { studentId, questionId },
      defaults: {
        quizId: question.quizId,
        isBookmarked: true,
        notes: notes || null
      }
    });

    if (!created) {
      record.isBookmarked = !record.isBookmarked;
      if (notes) record.notes = notes;
      await record.save();
    }

    res.status(200).json({
      status: 'success',
      isBookmarked: record.isBookmarked,
      message: record.isBookmarked ? 'Question bookmarked for revision.' : 'Question removed from bookmarks.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getBookmarkedQuestions = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const records = await StudentQuestionRecord.findAll({
      where: { studentId, isBookmarked: true },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{
            model: Quiz,
            as: 'quiz',
            attributes: ['id', 'title', 'examTopicId', 'subtopicId'],
            include: [
              { model: ExamTopic, as: 'examTopic', attributes: ['id', 'name'] },
              { model: Subtopic, as: 'subtopic', attributes: ['id', 'title'] },
              { model: User, as: 'author', attributes: ['id', 'name', 'badge'] }
            ]
          }]
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: records.map(r => ({
        id: r.id,
        questionId: r.questionId,
        notes: r.notes,
        savedAt: r.updatedAt,
        question: r.question
      }))
    });
  } catch (err) {
    next(err);
  }
};

exports.getMistakesList = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const mistakes = await StudentQuestionRecord.findAll({
      where: { studentId, isMistake: true },
      include: [
        {
          model: Question,
          as: 'question',
          include: [{
            model: Quiz,
            as: 'quiz',
            attributes: ['id', 'title', 'examTopicId', 'subtopicId'],
            include: [
              { model: ExamTopic, as: 'examTopic', attributes: ['id', 'name'] },
              { model: Subtopic, as: 'subtopic', attributes: ['id', 'title'] },
              { model: User, as: 'author', attributes: ['id', 'name', 'badge'] }
            ]
          }]
        }
      ],
      order: [['mistakeCount', 'DESC'], ['updatedAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      results: mistakes.length,
      data: mistakes.map(m => ({
        id: m.id,
        questionId: m.questionId,
        mistakeCount: m.mistakeCount,
        lastSelectedOption: m.lastSelectedOption,
        updatedAt: m.updatedAt,
        question: m.question
      }))
    });
  } catch (err) {
    next(err);
  }
};

// ─── Custom Revision Quiz Builder (From Mistakes or Bookmarks) ──────────────
exports.createRevisionQuiz = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { source = 'mistakes', limit = 10, mode = 'practice' } = req.body;

    const where = { studentId };
    if (source === 'bookmarks') {
      where.isBookmarked = true;
    } else {
      where.isMistake = true;
    }

    const records = await StudentQuestionRecord.findAll({
      where,
      limit: parseInt(limit, 10) || 10,
      include: [{ model: Question, as: 'question' }],
      order: sequelize.random()
    });

    if (records.length === 0) {
      return next(new BadRequestError(`No questions found in your ${source === 'bookmarks' ? 'Bookmarked' : 'My Mistakes'} folder.`));
    }

    const questions = records.map(r => r.question).filter(Boolean);

    // Create a dynamic temporary Quiz object
    const revisionQuiz = await Quiz.create({
      title: `⚡ Revision Quiz (${source === 'bookmarks' ? 'Bookmarked Questions' : 'Mistakes Review'})`,
      description: `Targeted revision set covering ${questions.length} questions from your ${source}.`,
      duration: Math.max(5, questions.length * 2),
      authorId: studentId,
      status: 'approved',
      isPublished: false
    });

    // Create a new Attempt
    const attempt = await QuizAttempt.create({
      quizId: revisionQuiz.id,
      studentId,
      attemptNumber: 1,
      startTime: new Date(),
      status: 'in-progress',
      score: 0.0,
      mode: ['mock', 'practice'].includes(mode) ? mode : 'practice'
    });

    // Associate cloned questions to this revision quiz or return them directly
    const questionsWithMeta = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      marks: q.marks,
      difficulty: q.difficulty,
      tags: q.tags,
      explanation: mode === 'practice' ? q.explanation : undefined,
      isBookmarked: source === 'bookmarks'
    }));

    res.status(201).json({
      status: 'success',
      message: 'Revision quiz generated successfully!',
      data: {
        attempt,
        quiz: revisionQuiz,
        questions: questionsWithMeta
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Performance Trends & Analytics with Strong/Weak Topics ─────────────────
exports.getPerformanceAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const attempts = await QuizAttempt.findAll({
      where: { studentId, status: ['completed', 'auto-submitted'], hiddenFromStudent: false },
      include: [
        {
          model: Quiz,
          as: 'quiz',
          attributes: ['id', 'title', 'duration', 'examTopicId', 'subtopicId', 'courseId'],
          include: [
            { model: ExamTopic, as: 'examTopic', attributes: ['id', 'name'] },
            { model: Subtopic, as: 'subtopic', attributes: ['id', 'title'] },
            { model: Course, as: 'course', attributes: ['id', 'title', 'subject'] }
          ]
        },
        { model: AttemptAnswer, as: 'answers' }
      ],
      order: [['submitTime', 'ASC']]
    });

    let totalScore = 0;
    let totalQuestionsAttempted = 0;
    let totalCorrect = 0;
    let totalTimeSpent = 0;

    const topicStatsMap = new Map(); // topicName -> { correct, total, track }

    const accuracyOverTime = attempts.map((a, idx) => {
      const qCount = a.totalQuestions || (a.answers ? a.answers.length : 1);
      const cCount = a.correctAnswers || (a.answers ? a.answers.filter(ans => ans.isCorrect).length : 0);
      const acc = qCount > 0 ? Math.round((cCount / qCount) * 100) : 0;

      totalQuestionsAttempted += qCount;
      totalCorrect += cCount;
      totalScore += a.score;
      totalTimeSpent += (a.timeSpentSeconds || 0);

      // Track by Topic
      const topicName = a.quiz?.examTopic?.name || a.quiz?.subtopic?.title || a.quiz?.course?.subject || 'General Topics';
      const track = a.quiz?.examTopicId ? 'Competitive' : 'College';

      if (!topicStatsMap.has(topicName)) {
        topicStatsMap.set(topicName, { correct: 0, total: 0, track });
      }
      const tStat = topicStatsMap.get(topicName);
      tStat.correct += cCount;
      tStat.total += qCount;

      return {
        attemptNumber: idx + 1,
        quizTitle: a.quiz?.title || 'Quiz',
        topic: topicName,
        accuracy: acc,
        score: a.score,
        mode: a.mode,
        date: new Date(a.submitTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    const topicBreakdown = [];
    topicStatsMap.forEach((val, topic) => {
      const accuracy = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
      topicBreakdown.push({
        topic,
        track: val.track,
        totalQuestions: val.total,
        correctQuestions: val.correct,
        accuracy
      });
    });

    // Sort to determine strongest and weakest topics
    topicBreakdown.sort((a, b) => b.accuracy - a.accuracy);
    const strongestTopics = topicBreakdown.slice(0, 3);
    const weakestTopics = topicBreakdown.slice(-3).reverse();

    const overallAccuracy = totalQuestionsAttempted > 0
      ? Math.round((totalCorrect / totalQuestionsAttempted) * 100)
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalAttempts: attempts.length,
          totalQuestionsSolved: totalQuestionsAttempted,
          totalCorrect,
          overallAccuracy,
          averageScore: attempts.length > 0 ? (totalScore / attempts.length).toFixed(1) : '0',
          totalStudyHours: (totalTimeSpent / 3600).toFixed(1)
        },
        accuracyOverTime,
        topicBreakdown,
        strongestTopics,
        weakestTopics
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Exam & Course Peer Leaderboard ─────────────────────────────────────────
exports.getLeaderboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { track = 'all' } = req.query;

    // Aggregate attempts by student
    const studentAttempts = await QuizAttempt.findAll({
      where: { status: ['completed', 'auto-submitted'] },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'rollNumber'] },
        { model: Quiz, as: 'quiz', attributes: ['id', 'examTopicId', 'courseId'] }
      ]
    });

    const studentMap = new Map();

    studentAttempts.forEach(a => {
      if (!a.student) return;
      const isCompetitive = !!a.quiz?.examTopicId;
      if (track === 'competitive' && !isCompetitive) return;
      if (track === 'college' && isCompetitive) return;

      const sid = a.student.id;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          id: sid,
          name: a.student.name,
          rollNumber: a.student.rollNumber,
          totalScore: 0,
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0
        });
      }
      const s = studentMap.get(sid);
      s.totalScore += a.score;
      s.totalAttempts += 1;
      s.totalCorrect += (a.correctAnswers || 0);
      s.totalQuestions += (a.totalQuestions || 0);
    });

    const leaderboard = Array.from(studentMap.values()).map(s => ({
      ...s,
      accuracy: s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0,
      averageScore: s.totalAttempts > 0 ? Math.round(s.totalScore / s.totalAttempts) : 0
    }));

    // Rank by total score descending
    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    // Calculate ranks and percentile
    const totalPeers = leaderboard.length;
    let studentRank = null;
    let studentPercentile = 0;

    leaderboard.forEach((item, index) => {
      item.rank = index + 1;
      if (item.id === studentId) {
        studentRank = item.rank;
        studentPercentile = totalPeers > 1
          ? Math.round(((totalPeers - studentRank) / (totalPeers - 1)) * 100)
          : 100;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        myStats: {
          rank: studentRank || '-',
          percentile: studentPercentile,
          totalPeers
        },
        leaderboard: leaderboard.slice(0, 50)
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Exam Preferences ────────────────────────────────────────────────────────
exports.getExamPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const preferences = await UserExamPreference.findAll({
      where: { userId },
      include: [{ model: Exam, as: 'exam' }]
    });
    res.status(200).json({
      status: 'success',
      data: preferences.map(p => p.exam)
    });
  } catch (err) { next(err); }
};

exports.setExamPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examIds } = req.body;

    if (!Array.isArray(examIds)) {
      return next(new BadRequestError('examIds must be an array.'));
    }

    const exams = await Exam.findAll({ where: { id: examIds, status: 'active' } });
    if (exams.length !== examIds.length) {
      return next(new BadRequestError('One or more exam IDs are invalid or inactive.'));
    }

    await sequelize.transaction(async (t) => {
      await UserExamPreference.destroy({ where: { userId }, transaction: t });
      if (examIds.length > 0) {
        const rows = examIds.map(examId => ({ userId, examId }));
        await UserExamPreference.bulkCreate(rows, { transaction: t });
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Exam preferences updated successfully.',
      data: { examIds }
    });
  } catch (err) { next(err); }
};

// ─── Quiz Attempt History & Management ──────────────────────────────────────
exports.deleteQuizAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    const attempt = await QuizAttempt.findOne({ where: { id: attemptId, studentId } });
    if (!attempt) {
      return next(new NotFoundError('Quiz attempt not found.'));
    }

    attempt.hiddenFromStudent = true;
    await attempt.save();

    res.status(200).json({
      status: 'success',
      message: 'Attempt removed from history.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getQuizAttemptHistory = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;

    const attempts = await QuizAttempt.findAll({
      where: { quizId, studentId, hiddenFromStudent: false },
      order: [['startTime', 'DESC']],
      include: [{ model: AttemptAnswer, as: 'answers' }]
    });

    res.status(200).json({
      status: 'success',
      data: attempts
    });
  } catch (err) {
    next(err);
  }
};

exports.getQuizPerformanceTrends = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const attempts = await QuizAttempt.findAll({
      where: { studentId, status: ['completed', 'auto-submitted'], hiddenFromStudent: false },
      include: [{ model: Quiz, as: 'quiz', attributes: ['id', 'title'] }],
      order: [['submitTime', 'ASC']]
    });

    const trends = attempts.map(a => ({
      id: a.id,
      quizTitle: a.quiz?.title || 'Quiz',
      score: a.score,
      totalQuestions: a.totalQuestions,
      correctAnswers: a.correctAnswers,
      incorrectAnswers: a.incorrectAnswers,
      timeSpentSeconds: a.timeSpentSeconds,
      accuracy: a.totalQuestions > 0 ? Math.round((a.correctAnswers / a.totalQuestions) * 100) : 0,
      date: a.submitTime
    }));

    res.status(200).json({
      status: 'success',
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

