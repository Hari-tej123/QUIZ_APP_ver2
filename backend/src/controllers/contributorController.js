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
  QuizAttempt,
  AuditLog
} = require('../config/database');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const xlsx = require('xlsx');
const { z } = require('zod');
const { Op } = require('sequelize');

const emptyToNull = (val) => (val === '' || val === undefined ? null : val);

const quizQuestionSchema = z.object({
  id: z.any().optional(),
  questionText: z.string().trim().min(1, 'Question text cannot be empty.').max(5000),
  optionA: z.string().trim().min(1, 'Option A is required.').max(1000),
  optionB: z.string().trim().min(1, 'Option B is required.').max(1000),
  optionC: z.string().trim().min(1, 'Option C is required.').max(1000),
  optionD: z.string().trim().min(1, 'Option D is required.').max(1000),
  correctOption: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Correct option must be A, B, C, or D.' })
  }),
  explanation: z.preprocess(emptyToNull, z.string().max(5000).optional().nullable()),
  difficulty: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(['easy', 'medium', 'hard']).default('medium')
  ),
  tags: z.preprocess(
    (val) => (val === '' ? null : val),
    z.union([z.string().max(500), z.array(z.string().max(80)).max(20)]).optional().nullable()
  ),
  marks: z.coerce.number().int().min(1, 'Marks must be at least 1.').max(100).default(1)
}).strip();

const quizDraftSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(180),
  description: z.preprocess(emptyToNull, z.string().max(3000).optional().nullable()),
  duration: z.coerce.number().int().min(1, 'Duration must be at least 1 minute.').max(600),
  track: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.enum(['COMPETITIVE', 'COLLEGE']).optional()
  ),
  trackType: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    z.enum(['competitive', 'college']).default('competitive')
  ),
  examId: z.preprocess(emptyToNull, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid exam ID.').optional().nullable()),
  examEditionId: z.preprocess(emptyToNull, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid edition ID.').optional().nullable()),
  examSubjectId: z.preprocess(emptyToNull, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid subject ID.').optional().nullable()),
  examTopicId: z.preprocess(emptyToNull, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid topic ID.').optional().nullable()),
  courseId: z.preprocess(emptyToNull, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid course ID.').optional().nullable()),
  subtopicId: z.preprocess(emptyToNull, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid subtopic ID.').optional().nullable()),
  instituteId: z.preprocess(emptyToNull, z.string().max(100).optional().nullable()),
  questions: z.array(quizQuestionSchema).min(1, 'At least one question is required.').max(200)
}).strip().superRefine((data, ctx) => {
  const normalizedTrack = (data.track || (data.trackType ? data.trackType.toUpperCase() : 'COMPETITIVE'));
  if (normalizedTrack === 'COLLEGE') {
    if (!data.courseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['courseId'],
        message: 'Course is required for College track quizzes.'
      });
    }
  }
});

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
      where: { [Op.or]: [{ ownerId: contributorId }, { authorId: contributorId }] },
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
    const parsed = quizDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return res.status(400).json({
        success: false,
        status: 'fail',
        message: parsed.error.issues[0]?.message || 'Invalid quiz data.',
        errors: formattedErrors
      });
    }

    const {
      title,
      description,
      duration,
      track,
      trackType,
      examId,
      examEditionId,
      examSubjectId,
      examTopicId,
      courseId,
      subtopicId,
      questions
    } = parsed.data;

    const normalizedTrack = (track || (trackType ? trackType.toUpperCase() : 'COMPETITIVE'));
    const isCollege = normalizedTrack === 'COLLEGE';
    const isAdmin = req.user.role === 'ADMIN';
    const quizStatus = isAdmin ? 'PUBLISHED' : 'DRAFT';

    // If examId is not directly passed but examEditionId is, try to resolve examId
    let resolvedExamId = examId || null;
    if (!resolvedExamId && examEditionId && !isCollege) {
      const edition = await ExamEdition.findByPk(examEditionId);
      if (edition) resolvedExamId = edition.examId;
    }

    // Determine instituteId: if college track, take user's instituteId if faculty
    let resolvedInstituteId = null;
    if (isCollege) {
      resolvedInstituteId = req.user.instituteId || null;
    }

    // Create the Quiz
    const quiz = await Quiz.create({
      title,
      description: description || null,
      duration: parseInt(duration, 10),
      durationMin: parseInt(duration, 10),
      ownerId: contributorId,
      authorId: contributorId,
      contributorAttribution: user.name + (user.badge ? ` (${user.badge})` : ' (Educator)'),
      status: quizStatus,
      isPublished: isAdmin,
      track: normalizedTrack,
      instituteId: resolvedInstituteId,
      examId: !isCollege ? resolvedExamId : null,
      examEditionId: !isCollege ? examEditionId || null : null,
      examSubjectId: !isCollege ? examSubjectId || null : null,
      examTopicId: !isCollege ? examTopicId || null : null,
      courseId: isCollege ? courseId || null : null,
      subtopicId: isCollege ? subtopicId || null : null
    });

    // Create Questions
    const questionsToInsert = questions.map(q => ({
      quizId: quiz.id,
      questionText: q.questionText.trim(),
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      questionType: 'mcq',
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswers: [q.correctOption],
      track: normalizedTrack,
      examId: !isCollege ? resolvedExamId : null,
      courseId: isCollege ? courseId || null : null,
      instituteId: resolvedInstituteId,
      status: isAdmin ? 'published' : 'draft',
      createdBy: contributorId,
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
      trackType: normalizedTrack.toLowerCase(),
      targetDetails: JSON.stringify({
        duration: quiz.duration,
        questionCount: questions.length,
        examTopicId,
        subtopicId,
        courseId,
        track: normalizedTrack
      }),
      status: isAdmin ? 'approved' : 'pending'
    });

    res.status(201).json({
      success: true,
      status: 'success',
      message: isAdmin ? 'Quiz created and published.' : 'Quiz saved as draft.',
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

    const isAutoApproved = req.user.role === 'ADMIN';
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
