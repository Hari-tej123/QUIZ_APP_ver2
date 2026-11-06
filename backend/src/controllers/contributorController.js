const {
  User,
  Quiz,
  Question,
  StudyMaterial,
  ContentSubmission,
  Payout,
  PlatformSetting,
  Exam,
  ExamEdition,
  ExamSubject,
  ExamTopic,
  Course,
  Subtopic,
  QuizAttempt
} = require('../config/database');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const xlsx = require('xlsx');

// ─── Get Contributor Dashboard Statistics ────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const user = await User.findByPk(contributorId);

    const quizzes = await Quiz.findAll({ where: { authorId: contributorId } });
    const materials = await StudyMaterial.findAll({ where: { authorId: contributorId } });
    const submissions = await ContentSubmission.findAll({ where: { contributorId } });
    const payouts = await Payout.findAll({ where: { contributorId } });

    const totalQuizzes = quizzes.length;
    const approvedQuizzes = quizzes.filter(q => q.status === 'approved').length;
    const pendingQuizzes = quizzes.filter(q => q.status === 'pending').length;
    const totalMaterials = materials.length;
    const approvedMaterials = materials.filter(m => m.status === 'approved').length;

    // Total attempts across all authored quizzes
    const totalStudentAttempts = quizzes.reduce((sum, q) => sum + (q.totalAttempts || 0), 0);

    // Total lifetime earned & current balance
    const earningsBalance = user.earningsBalance || 0;
    const totalEarned = user.totalEarned || 0;
    const totalWithdrawn = payouts
      .filter(p => p.type === 'withdrawal' && (p.status === 'completed' || p.status === 'approved'))
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      status: 'success',
      data: {
        contributor: {
          id: user.id,
          name: user.name,
          email: user.email,
          badge: user.badge || (user.contributorStatus === 'approved' ? 'Verified Educator' : null),
          contributorStatus: user.contributorStatus,
          subjectExpertise: user.subjectExpertise,
          bio: user.bio,
          credentials: user.credentials
        },
        metrics: {
          totalQuizzes,
          approvedQuizzes,
          pendingQuizzes,
          totalMaterials,
          approvedMaterials,
          totalSubmissions: submissions.length,
          totalStudentAttempts,
          earningsBalance,
          totalEarned,
          totalWithdrawn
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Hierarchy for Dropdowns (Both Tracks) ──────────────────────────────
exports.getHierarchyTree = async (req, res, next) => {
  try {
    // 1. Competitive track hierarchy: Exams -> Editions -> Subjects -> Topics
    const exams = await Exam.findAll({
      where: { status: 'active' },
      include: [
        {
          model: ExamEdition,
          as: 'editions',
          include: [
            {
              model: ExamSubject,
              as: 'subjects',
              include: [
                {
                  model: ExamTopic,
                  as: 'topics'
                }
              ]
            }
          ]
        }
      ]
    });

    // 2. College track hierarchy: Courses -> Subtopics
    const courses = await Course.findAll({
      include: [
        {
          model: Subtopic,
          as: 'subtopics'
        }
      ]
    });

    res.status(200).json({
      status: 'success',
      data: {
        competitiveExams: exams,
        collegeCourses: courses
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── List Authored Quizzes ──────────────────────────────────────────────────
exports.getMyQuizzes = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const quizzes = await Quiz.findAll({
      where: { authorId: contributorId },
      include: [
        { model: Question, as: 'questions' },
        { model: ContentSubmission, as: 'submission' },
        { model: ExamTopic, as: 'examTopic', include: [{ model: ExamSubject, as: 'subject' }] },
        { model: Subtopic, as: 'subtopic', include: [{ model: Course, as: 'course' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: quizzes
    });
  } catch (err) {
    next(err);
  }
};

// ─── Create Quiz Submission ─────────────────────────────────────────────────
exports.createQuiz = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const user = await User.findByPk(contributorId);

    const {
      title,
      description,
      duration,
      trackType, // 'competitive' or 'college'
      // Competitive track IDs
      examEditionId,
      examSubjectId,
      examTopicId,
      // College track IDs
      courseId,
      subtopicId,
      questions // Array of question objects
    } = req.body;

    if (!title || !duration || !Array.isArray(questions) || questions.length === 0) {
      return next(new BadRequestError('Please provide quiz title, duration, and at least one question.'));
    }

    // Determine publish status: if user is admin/faculty => approved immediately; if contributor => pending review
    const isAutoApproved = req.user.role === 'admin' || req.user.role === 'faculty';
    const status = isAutoApproved ? 'approved' : 'pending';
    const isPublished = isAutoApproved;

    // Create the Quiz
    const quiz = await Quiz.create({
      title,
      description,
      duration: parseInt(duration, 10),
      authorId: contributorId,
      contributorAttribution: user.name + (user.badge ? ` (${user.badge})` : ' (Educator)'),
      status,
      isPublished,
      trackType: trackType || 'competitive',
      examEditionId: trackType === 'competitive' ? examEditionId || null : null,
      examSubjectId: trackType === 'competitive' ? examSubjectId || null : null,
      examTopicId: trackType === 'competitive' ? examTopicId || null : null,
      courseId: trackType === 'college' ? courseId || null : null,
      subtopicId: trackType === 'college' ? subtopicId || null : null
    });

    // Create Questions
    const questionsToInsert = questions.map(q => ({
      quizId: quiz.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      marks: q.marks ? parseInt(q.marks, 10) : 1,
      explanation: q.explanation || null,
      difficulty: q.difficulty || 'medium',
      tags: Array.isArray(q.tags) ? q.tags.join(', ') : q.tags || null
    }));

    await Question.bulkCreate(questionsToInsert);

    // Create Content Submission Record for review queue
    const submission = await ContentSubmission.create({
      contributorId,
      contentType: 'quiz',
      quizId: quiz.id,
      title: quiz.title,
      trackType: trackType || 'competitive',
      targetDetails: JSON.stringify({
        duration: quiz.duration,
        questionCount: questions.length,
        examTopicId,
        subtopicId,
        courseId
      }),
      status: isAutoApproved ? 'approved' : 'pending'
    });

    res.status(201).json({
      status: 'success',
      message: isAutoApproved
        ? 'Quiz created and published successfully.'
        : 'Quiz submitted successfully for Admin review!',
      data: {
        quiz,
        submission
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Bulk Upload Questions via CSV / Excel ──────────────────────────────────
exports.bulkUploadQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new BadRequestError('Please upload an Excel (.xlsx) or CSV file.'));
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData || sheetData.length === 0) {
      return next(new BadRequestError('The uploaded file is empty.'));
    }

    const parsedQuestions = [];
    const validationErrors = [];

    sheetData.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const qText = row['Question'] || row['question'] || row['QuestionText'] || row['questionText'];
      const opA = row['Option A'] || row['optionA'] || row['OptionA'] || row['A'];
      const opB = row['Option B'] || row['optionB'] || row['OptionB'] || row['B'];
      const opC = row['Option C'] || row['optionC'] || row['OptionC'] || row['C'];
      const opD = row['Option D'] || row['optionD'] || row['OptionD'] || row['D'];
      let correct = row['Correct Answer'] || row['correctOption'] || row['Correct'] || row['Answer'];
      const explanation = row['Explanation'] || row['explanation'] || '';
      const difficulty = (row['Difficulty'] || row['difficulty'] || 'medium').toLowerCase();
      const tags = row['Tags'] || row['tags'] || '';
      const marks = row['Marks'] || row['marks'] || 1;

      if (correct) {
        correct = String(correct).trim().toUpperCase();
      }

      if (!qText || !opA || !opB || !opC || !opD || !['A', 'B', 'C', 'D'].includes(correct)) {
        validationErrors.push(`Row ${rowNum}: Missing required fields or invalid correct answer (must be A, B, C, or D).`);
      } else {
        parsedQuestions.push({
          questionText: String(qText).trim(),
          optionA: String(opA).trim(),
          optionB: String(opB).trim(),
          optionC: String(opC).trim(),
          optionD: String(opD).trim(),
          correctOption: correct,
          explanation: String(explanation).trim(),
          difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
          tags: String(tags).trim(),
          marks: Number(marks) || 1
        });
      }
    });

    if (validationErrors.length > 0 && parsedQuestions.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'All rows in the uploaded template contained errors.',
        errors: validationErrors
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Parsed ${parsedQuestions.length} questions successfully.${validationErrors.length > 0 ? ` (${validationErrors.length} rows skipped due to errors)` : ''}`,
      data: {
        questions: parsedQuestions,
        errors: validationErrors
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Sample CSV / Excel Template ────────────────────────────────────────
exports.getSampleTemplate = (req, res) => {
  const sampleData = [
    {
      'Question': 'What is the time complexity of searching in a Balanced Binary Search Tree (AVL)?',
      'Option A': 'O(1)',
      'Option B': 'O(log N)',
      'Option C': 'O(N)',
      'Option D': 'O(N log N)',
      'Correct Answer': 'B',
      'Explanation': 'A balanced binary search tree maintains a height of O(log N), making search operations take logarithmic time in the worst case.',
      'Difficulty': 'easy',
      'Tags': 'Data Structures, Trees, Algorithms',
      'Marks': 1
    },
    {
      'Question': 'Which of the following sorting algorithms is NOT stable in its standard in-place form?',
      'Option A': 'Merge Sort',
      'Option B': 'Insertion Sort',
      'Option C': 'Quick Sort',
      'Option D': 'Bubble Sort',
      'Correct Answer': 'C',
      'Explanation': 'Standard in-place QuickSort is not stable because swapping distant elements can change the relative order of identical keys.',
      'Difficulty': 'medium',
      'Tags': 'Algorithms, Sorting, GATE',
      'Marks': 2
    }
  ];

  const ws = xlsx.utils.json_to_sheet(sampleData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Questions');
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=Quizzify_Questions_Template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

// ─── List Authored Study Materials ──────────────────────────────────────────
exports.getMyMaterials = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const materials = await StudyMaterial.findAll({
      where: { authorId: contributorId },
      include: [
        { model: ContentSubmission, as: 'submission' },
        { model: ExamTopic, as: 'examTopic', include: [{ model: ExamSubject, as: 'subject' }] },
        { model: Subtopic, as: 'subtopic', include: [{ model: Course, as: 'course' }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: materials
    });
  } catch (err) {
    next(err);
  }
};

// ─── Create Study Material Submission ───────────────────────────────────────
exports.createStudyMaterial = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const {
      title,
      description,
      type, // 'pdf', 'note', 'video'
      videoUrl,
      content,
      trackType,
      examId,
      examEditionId,
      examSubjectId,
      examTopicId,
      courseId,
      subtopicId
    } = req.body;

    if (!title || !type) {
      return next(new BadRequestError('Please provide title and material type.'));
    }

    let fileUrl = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const isAutoApproved = req.user.role === 'admin' || req.user.role === 'faculty';
    const status = isAutoApproved ? 'approved' : 'pending';

    const material = await StudyMaterial.create({
      title,
      description,
      type,
      fileUrl,
      videoUrl: videoUrl || null,
      content: content || null,
      trackType: trackType || 'competitive',
      examId: trackType === 'competitive' ? examId || null : null,
      examEditionId: trackType === 'competitive' ? examEditionId || null : null,
      examSubjectId: trackType === 'competitive' ? examSubjectId || null : null,
      examTopicId: trackType === 'competitive' ? examTopicId || null : null,
      courseId: trackType === 'college' ? courseId || null : null,
      subtopicId: trackType === 'college' ? subtopicId || null : null,
      authorId: contributorId,
      status
    });

    // Content submission entry
    const submission = await ContentSubmission.create({
      contributorId,
      contentType: 'study_material',
      materialId: material.id,
      title: material.title,
      trackType: trackType || 'competitive',
      targetDetails: JSON.stringify({
        type: material.type,
        examTopicId,
        subtopicId
      }),
      status: isAutoApproved ? 'approved' : 'pending'
    });

    res.status(201).json({
      status: 'success',
      message: isAutoApproved
        ? 'Study material published successfully.'
        : 'Study material submitted for Admin review!',
      data: {
        material,
        submission
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Submissions Status with Feedback ───────────────────────────────────
exports.getMySubmissions = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const submissions = await ContentSubmission.findAll({
      where: { contributorId },
      include: [
        { model: Quiz, as: 'quiz' },
        { model: StudyMaterial, as: 'material' },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: submissions
    });
  } catch (err) {
    next(err);
  }
};

// ─── Payout History & Ledger ────────────────────────────────────────────────
exports.getPayouts = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const user = await User.findByPk(contributorId);

    const payouts = await Payout.findAll({
      where: { contributorId },
      order: [['createdAt', 'DESC']]
    });

    // Fetch platform payout configuration for display
    const settings = await PlatformSetting.findAll();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    res.status(200).json({
      status: 'success',
      data: {
        balance: user.earningsBalance || 0,
        totalEarned: user.totalEarned || 0,
        platformRules: {
          bountyPerQuiz: settingsMap['flat_fee_per_quiz'] || '15.00',
          revSharePerAttempt: settingsMap['rev_share_per_attempt'] || '0.10',
          minWithdrawal: settingsMap['min_withdrawal'] || '20.00'
        },
        transactions: payouts
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── Request Payout Withdrawal ──────────────────────────────────────────────
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const contributorId = req.user.id;
    const { amount, paymentMethod, paymentDetails, notes } = req.body;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return next(new BadRequestError('Please provide a valid withdrawal amount.'));
    }

    const user = await User.findByPk(contributorId);
    if (user.earningsBalance < withdrawAmount) {
      return next(new BadRequestError(`Insufficient balance. Current balance is $${user.earningsBalance.toFixed(2)}.`));
    }

    // Check minimum threshold
    const minSetting = await PlatformSetting.findOne({ where: { key: 'min_withdrawal' } });
    const minThreshold = minSetting ? parseFloat(minSetting.value) : 10.0;
    if (withdrawAmount < minThreshold) {
      return next(new BadRequestError(`Minimum withdrawal threshold is $${minThreshold.toFixed(2)}.`));
    }

    // Deduct balance from contributor
    user.earningsBalance -= withdrawAmount;
    await user.save();

    // Create payout withdrawal entry
    const payout = await Payout.create({
      contributorId,
      amount: withdrawAmount,
      type: 'withdrawal',
      status: 'pending',
      paymentMethod: paymentMethod || 'Direct UPI / Bank Transfer',
      paymentDetails: typeof paymentDetails === 'object' ? JSON.stringify(paymentDetails) : paymentDetails,
      notes: notes || 'Withdrawal requested by educator'
    });

    res.status(201).json({
      status: 'success',
      message: 'Withdrawal request submitted successfully!',
      data: {
        payout,
        newBalance: user.earningsBalance
      }
    });
  } catch (err) {
    next(err);
  }
};
