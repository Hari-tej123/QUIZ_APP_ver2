'use strict';

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const educatorId = 'cc111111-1111-1111-1111-111111111111';
    const adminId = 'a1111111-1111-1111-1111-111111111111';

    // 1. Exams (UPSC and CAT)
    await queryInterface.bulkInsert('exams', [
      {
        id: 'ea333333-3333-3333-3333-333333333333',
        name: 'UPSC Civil Services Examination',
        code: 'UPSC',
        description: "India's central civil services examination covering IAS, IPS, and IFS cadres.",
        logo_url: null,
        status: 'active',
        category: 'CIVIL_SERVICES',
        track: 'COMPETITIVE',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'ea444444-4444-4444-4444-444444444444',
        name: 'CAT (Common Admission Test)',
        code: 'CAT',
        description: 'Admission test for postgraduate management and MBA programs.',
        logo_url: null,
        status: 'active',
        category: 'MANAGEMENT',
        track: 'COMPETITIVE',
        createdAt: now,
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // 2. Exam Editions
    await queryInterface.bulkInsert('exam_editions', [
      { id: 'eb333333-3333-3333-3333-333333333333', examId: 'ea333333-3333-3333-3333-333333333333', year: 2026, description: 'UPSC CSE 2026 preparation.', is_active: true, createdAt: now, updatedAt: now },
      { id: 'eb444444-4444-4444-4444-444444444444', examId: 'ea444444-4444-4444-4444-444444444444', year: 2026, description: 'CAT 2026 management entrance preparation.', is_active: true, createdAt: now, updatedAt: now }
    ], { ignoreDuplicates: true });

    // 3. Exam Subjects
    await queryInterface.bulkInsert('exam_subjects', [
      { id: 'ec555555-5555-5555-5555-555555555555', examEditionId: 'eb333333-3333-3333-3333-333333333333', name: 'General Studies Paper I', description: 'History, geography, polity, economy, and environment.', status: 'active', createdAt: now, updatedAt: now },
      { id: 'ec666666-6666-6666-6666-666666666666', examEditionId: 'eb444444-4444-4444-4444-444444444444', name: 'Quantitative Aptitude', description: 'Quantitative ability and data interpretation.', status: 'active', createdAt: now, updatedAt: now }
    ], { ignoreDuplicates: true });

    // 4. Exam Topics (using ed888888 for UPSC to avoid collision with JEE chemistry ed666666)
    await queryInterface.bulkInsert('exam_topics', [
      { id: 'ed888888-8888-8888-8888-888888888888', subjectId: 'ec555555-5555-5555-5555-555555555555', name: 'Indian Polity & Constitution', description: 'Constitutional framework and governance.', status: 'active', createdAt: now, updatedAt: now },
      { id: 'ed777777-7777-7777-7777-777777777777', subjectId: 'ec666666-6666-6666-6666-666666666666', name: 'Number Systems & Algebra', description: 'Number properties, algebra, and sequences.', status: 'active', createdAt: now, updatedAt: now }
    ], { ignoreDuplicates: true });

    // 5. Starter Published Quizzes across GATE, JEE Main, UPSC, and CAT
    const quizzes = [
      {
        id: 'cb333333-3333-3333-3333-333333333333',
        title: 'Linear Algebra & Matrix Fundamentals (GATE Special)',
        description: 'Comprehensive multiple-choice practice covering eigenvalues, determinants, and matrix rank for GATE Engineering Mathematics.',
        duration: 15,
        durationMin: 15,
        maxAttempts: null,
        examEditionId: 'eb111111-1111-1111-1111-111111111111',
        examSubjectId: 'ec111111-1111-1111-1111-111111111111',
        examTopicId: 'ed111111-1111-1111-1111-111111111111',
        courseId: null,
        subtopicId: null,
        authorId: educatorId,
        ownerId: educatorId,
        contributorAttribution: 'Prof. Ramesh Rao (GATE CS Faculty)',
        status: 'PUBLISHED',
        isPublished: true,
        publishedBy: adminId,
        publishedAt: now,
        totalAttempts: 12,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cb444444-4444-4444-4444-444444444444',
        title: 'Newton\'s Laws & Kinematics Mastery (JEE Main)',
        description: 'Core problem-solving drill on 1D/2D kinematics, projectile motion, and Newton\'s third law applications.',
        duration: 15,
        durationMin: 15,
        maxAttempts: null,
        examEditionId: 'eb222222-2222-2222-2222-222222222222',
        examSubjectId: 'ec333333-3333-3333-3333-333333333333',
        examTopicId: 'ed444444-4444-4444-4444-444444444444',
        courseId: null,
        subtopicId: null,
        authorId: educatorId,
        ownerId: educatorId,
        contributorAttribution: 'Dr. S. Verma (Physics Lead)',
        status: 'PUBLISHED',
        isPublished: true,
        publishedBy: adminId,
        publishedAt: now,
        totalAttempts: 8,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cb555555-5555-5555-5555-555555555555',
        title: 'Constitutional Framework & Governance (UPSC CSE)',
        description: 'High-yield conceptual MCQs on Fundamental Rights, DPSP, and Parliamentary procedures for UPSC Civil Services Paper I.',
        duration: 15,
        durationMin: 15,
        maxAttempts: null,
        examEditionId: 'eb333333-3333-3333-3333-333333333333',
        examSubjectId: 'ec555555-5555-5555-5555-555555555555',
        examTopicId: 'ed888888-8888-8888-8888-888888888888',
        courseId: null,
        subtopicId: null,
        authorId: educatorId,
        ownerId: educatorId,
        contributorAttribution: 'Ananya Sharma, IAS Mentor',
        status: 'PUBLISHED',
        isPublished: true,
        publishedBy: adminId,
        publishedAt: now,
        totalAttempts: 15,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cb666666-6666-6666-6666-666666666666',
        title: 'Number Theory & Quantitative Essentials (CAT QA)',
        description: 'Advanced quantitative aptitude questions covering factors, remainders, LCM-HCF, and algebraic progressions for CAT aspirants.',
        duration: 15,
        durationMin: 15,
        maxAttempts: null,
        examEditionId: 'eb444444-4444-4444-4444-444444444444',
        examSubjectId: 'ec666666-6666-6666-6666-666666666666',
        examTopicId: 'ed777777-7777-7777-7777-777777777777',
        courseId: null,
        subtopicId: null,
        authorId: educatorId,
        ownerId: educatorId,
        contributorAttribution: 'IIM Alumni Aptitude Circle',
        status: 'PUBLISHED',
        isPublished: true,
        publishedBy: adminId,
        publishedAt: now,
        totalAttempts: 20,
        createdAt: now,
        updatedAt: now
      }
    ];
    await queryInterface.bulkInsert('quizzes', quizzes, { ignoreDuplicates: true });

    // 6. Questions for each quiz (4 options, 1 correct answer, duration > 0, explanation, difficulty)
    const questions = [
      // GATE Linear Algebra
      {
        id: '11111111-1111-1111-1111-111111111111',
        quizId: 'cb333333-3333-3333-3333-333333333333',
        questionText: 'If A is a 3x3 matrix with eigenvalues 1, -1, and 0, what is the determinant of A?',
        optionA: '0',
        optionB: '1',
        optionC: '-1',
        optionD: 'Undefined',
        correctOption: 'A',
        questionType: 'mcq',
        options: JSON.stringify(['0', '1', '-1', 'Undefined']),
        correctAnswers: JSON.stringify(['A']),
        marks: 1,
        difficulty: 'easy',
        explanation: 'The determinant of any square matrix equals the product of its eigenvalues. 1 * (-1) * 0 = 0.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '11111111-1111-1111-1111-111111111112',
        quizId: 'cb333333-3333-3333-3333-333333333333',
        questionText: 'For an n x n invertible matrix M, which of the following statements is ALWAYS true?',
        optionA: 'Rank of M is less than n',
        optionB: 'det(M) = 0',
        optionC: '0 cannot be an eigenvalue of M',
        optionD: 'Trace of M must be 1',
        correctOption: 'C',
        questionType: 'mcq',
        options: JSON.stringify(['Rank of M is less than n', 'det(M) = 0', '0 cannot be an eigenvalue of M', 'Trace of M must be 1']),
        correctAnswers: JSON.stringify(['C']),
        marks: 1,
        difficulty: 'medium',
        explanation: 'A matrix is invertible if and only if its determinant is non-zero. Since the determinant is the product of eigenvalues, zero cannot be an eigenvalue.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },

      // JEE Main Mechanics
      {
        id: '22222222-2222-2222-2222-222222222221',
        quizId: 'cb444444-4444-4444-4444-444444444444',
        questionText: 'A particle moves along a straight line such that its displacement x at time t is given by x = 2t^3 - 6t^2 + 4. At what time is its acceleration zero?',
        optionA: '1 second',
        optionB: '2 seconds',
        optionC: '0.5 seconds',
        optionD: '3 seconds',
        correctOption: 'A',
        questionType: 'mcq',
        options: JSON.stringify(['1 second', '2 seconds', '0.5 seconds', '3 seconds']),
        correctAnswers: JSON.stringify(['A']),
        marks: 1,
        difficulty: 'easy',
        explanation: 'Velocity v = dx/dt = 6t^2 - 12t. Acceleration a = dv/dt = 12t - 12. Setting a = 0 gives 12t = 12 => t = 1 second.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        quizId: 'cb444444-4444-4444-4444-444444444444',
        questionText: 'When a horse pulls a cart, the force that causes the horse to move forward is exerted by:',
        optionA: 'The cart on the horse',
        optionB: 'The ground on the horse',
        optionC: 'The horse on the ground',
        optionD: 'The horse on the cart',
        correctOption: 'B',
        questionType: 'mcq',
        options: JSON.stringify(['The cart on the horse', 'The ground on the horse', 'The horse on the ground', 'The horse on the cart']),
        correctAnswers: JSON.stringify(['B']),
        marks: 1,
        difficulty: 'medium',
        explanation: 'According to Newton\'s third law, the horse pushes backward against the ground, and the reaction force of the ground on the horse pushes the horse forward.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },

      // UPSC Indian Polity
      {
        id: '33333333-3333-3333-3333-333333333331',
        quizId: 'cb555555-5555-5555-5555-555555555555',
        questionText: 'Which Article of the Constitution of India provides for the right against self-incrimination in criminal matters?',
        optionA: 'Article 20(3)',
        optionB: 'Article 21',
        optionC: 'Article 22(1)',
        optionD: 'Article 19(2)',
        correctOption: 'A',
        questionType: 'mcq',
        options: JSON.stringify(['Article 20(3)', 'Article 21', 'Article 22(1)', 'Article 19(2)']),
        correctAnswers: JSON.stringify(['A']),
        marks: 1,
        difficulty: 'easy',
        explanation: 'Article 20(3) states that no person accused of any offence shall be compelled to be a witness against himself.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '33333333-3333-3333-3333-333333333332',
        quizId: 'cb555555-5555-5555-5555-555555555555',
        questionText: 'The concept of "Basic Structure" of the Indian Constitution was propounded by the Supreme Court in which landmark case?',
        optionA: 'Golaknath case (1967)',
        optionB: 'Kesavananda Bharati case (1973)',
        optionC: 'Minerva Mills case (1980)',
        optionD: 'Maneka Gandhi case (1978)',
        correctOption: 'B',
        questionType: 'mcq',
        options: JSON.stringify(['Golaknath case (1967)', 'Kesavananda Bharati case (1973)', 'Minerva Mills case (1980)', 'Maneka Gandhi case (1978)']),
        correctAnswers: JSON.stringify(['B']),
        marks: 1,
        difficulty: 'medium',
        explanation: 'In Kesavananda Bharati v. State of Kerala (1973), the Supreme Court ruled that Parliament cannot alter the basic structure or essential framework of the Constitution.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },

      // CAT Number Systems
      {
        id: '44444444-4444-4444-4444-444444444441',
        quizId: 'cb666666-6666-6666-6666-666666666666',
        questionText: 'What is the remainder when (2^100) is divided by 7?',
        optionA: '1',
        optionB: '2',
        optionC: '4',
        optionD: '6',
        correctOption: 'B',
        questionType: 'mcq',
        options: JSON.stringify(['1', '2', '4', '6']),
        correctAnswers: JSON.stringify(['B']),
        marks: 1,
        difficulty: 'medium',
        explanation: '2^3 = 8 = 1 (mod 7). 100 = 3 * 33 + 1. Therefore, 2^100 = (2^3)^33 * 2^1 = 1^33 * 2 = 2 (mod 7).',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '44444444-4444-4444-4444-444444444442',
        quizId: 'cb666666-6666-6666-6666-666666666666',
        questionText: 'How many trailing zeroes are there at the end of 100! (factorial)?',
        optionA: '20',
        optionB: '24',
        optionC: '25',
        optionD: '28',
        correctOption: 'B',
        questionType: 'mcq',
        options: JSON.stringify(['20', '24', '25', '28']),
        correctAnswers: JSON.stringify(['B']),
        marks: 1,
        difficulty: 'easy',
        explanation: 'Number of trailing zeros = floor(100/5) + floor(100/25) = 20 + 4 = 24.',
        status: 'published',
        track: 'exam',
        createdBy: educatorId,
        createdAt: now,
        updatedAt: now
      }
    ];
    await queryInterface.bulkInsert('questions', questions, { ignoreDuplicates: true });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('questions', {
      id: [
        '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111112',
        '22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333332',
        '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444442'
      ]
    });
    await queryInterface.bulkDelete('quizzes', {
      id: [
        'cb333333-3333-3333-3333-333333333333', 'cb444444-4444-4444-4444-444444444444',
        'cb555555-5555-5555-5555-555555555555', 'cb666666-6666-6666-6666-666666666666'
      ]
    });
    await queryInterface.bulkDelete('exam_topics', { id: ['ed888888-8888-8888-8888-888888888888', 'ed777777-7777-7777-7777-777777777777'] });
    await queryInterface.bulkDelete('exam_subjects', { id: ['ec555555-5555-5555-5555-555555555555', 'ec666666-6666-6666-6666-666666666666'] });
    await queryInterface.bulkDelete('exam_editions', { id: ['eb333333-3333-3333-3333-333333333333', 'eb444444-4444-4444-4444-444444444444'] });
    await queryInterface.bulkDelete('exams', { id: ['ea333333-3333-3333-3333-333333333333', 'ea444444-4444-4444-4444-444444444444'] });
  }
};
