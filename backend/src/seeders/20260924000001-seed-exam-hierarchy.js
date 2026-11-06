'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seeder: Comprehensive Competitive Exam Hierarchy (GATE, JEE Main, UPSC, CAT)
 * Includes Editions, Subjects, Topics, Topic-level Quizzes, and Questions.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // ─── 1. Exam IDs ─────────────────────────────────────────────────────────
    const gateId = 'ea111111-1111-1111-1111-111111111111';
    const jeeId  = 'ea222222-2222-2222-2222-222222222222';
    const upscId = 'ea333333-3333-3333-3333-333333333333';
    const catId  = 'ea444444-4444-4444-4444-444444444444';

    // ─── 2. Edition IDs ──────────────────────────────────────────────────────
    const gateEditionId = 'eb111111-1111-1111-1111-111111111111';
    const jeeEditionId  = 'eb222222-2222-2222-2222-222222222222';
    const upscEditionId = 'eb333333-3333-3333-3333-333333333333';
    const catEditionId  = 'eb444444-4444-4444-4444-444444444444';

    // ─── 3. Subject IDs ──────────────────────────────────────────────────────
    const gateSubject1Id = 'ec111111-1111-1111-1111-111111111111'; // Engineering Mathematics
    const gateSubject2Id = 'ec222222-2222-2222-2222-222222222222'; // Computer Science
    const jeeSubject1Id  = 'ec333333-3333-3333-3333-333333333333'; // Physics
    const jeeSubject2Id  = 'ec444444-4444-4444-4444-444444444444'; // Chemistry
    const upscSubject1Id = 'ec555555-5555-5555-5555-555555555555'; // General Studies Paper I
    const catSubject1Id  = 'ec666666-6666-6666-6666-666666666666'; // Quantitative Aptitude

    // ─── 4. Topic IDs ────────────────────────────────────────────────────────
    const gateTopic1Id = 'ed111111-1111-1111-1111-111111111111'; // Linear Algebra
    const gateTopic2Id = 'ed222222-2222-2222-2222-222222222222'; // Algorithms & Complexity
    const gateTopic3Id = 'ed333333-3333-3333-3333-333333333333'; // Operating Systems
    const jeeTopic1Id  = 'ed444444-4444-4444-4444-444444444444'; // Mechanics & Kinematics
    const jeeTopic2Id  = 'ed555555-5555-5555-5555-555555555555'; // Electrostatics & Gauss Law
    const upscTopic1Id = 'ed666666-6666-6666-6666-666666666666'; // Indian Polity & Constitution
    const catTopic1Id  = 'ed777777-7777-7777-7777-777777777777'; // Number Systems & Algebra

    // ─── 5. Quiz IDs ─────────────────────────────────────────────────────────
    const examQuiz1Id = 'ee111111-1111-1111-1111-111111111111'; // GATE Linear Algebra
    const examQuiz2Id = 'ee222222-2222-2222-2222-222222222222'; // GATE Algorithms
    const examQuiz3Id = 'ee333333-3333-3333-3333-333333333333'; // GATE OS
    const examQuiz4Id = 'ee444444-4444-4444-4444-444444444444'; // JEE Mechanics
    const examQuiz5Id = 'ee555555-5555-5555-5555-555555555555'; // UPSC Polity

    // 1. Seed Exams
    await queryInterface.bulkInsert('exams', [
      {
        id: gateId,
        name: 'GATE (Graduate Aptitude Test in Engineering)',
        code: 'GATE',
        description: 'National entrance examination for Master\'s admissions and prestigious public sector PSU recruitments across India.',
        logo_url: null,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: jeeId,
        name: 'JEE Main (Joint Entrance Examination)',
        code: 'JEE_MAIN',
        description: 'Premier undergraduate national entrance examination for admission into NITs, IIITs, and Centrally Funded Technical Institutes.',
        logo_url: null,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: upscId,
        name: 'UPSC Civil Services Examination',
        code: 'UPSC',
        description: 'India\'s premier central recruitment examination for civil services including IAS, IPS, and IFS cadres.',
        logo_url: null,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: catId,
        name: 'CAT (Common Admission Test)',
        code: 'CAT',
        description: 'Computer-based admission test for postgraduate management and MBA programs across IIMs and top business schools.',
        logo_url: null,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 2. Seed Exam Editions
    await queryInterface.bulkInsert('exam_editions', [
      {
        id: gateEditionId,
        examId: gateId,
        year: 2026,
        description: 'GATE 2026 — Computer Science & Engineering curriculum.',
        is_active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: jeeEditionId,
        examId: jeeId,
        year: 2026,
        description: 'JEE Main 2026 — Session 1 & 2 comprehensive testing suite.',
        is_active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: upscEditionId,
        examId: upscId,
        year: 2026,
        description: 'UPSC CSE 2026 — Preliminary exam syllabus and GS papers.',
        is_active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: catEditionId,
        examId: catId,
        year: 2026,
        description: 'CAT 2026 — Quantitative Aptitude & Data Interpretation.',
        is_active: true,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 3. Seed Exam Subjects
    await queryInterface.bulkInsert('exam_subjects', [
      {
        id: gateSubject1Id,
        examEditionId: gateEditionId,
        name: 'Engineering Mathematics',
        description: 'Linear algebra, calculus, probability distributions, and discrete structures.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: gateSubject2Id,
        examEditionId: gateEditionId,
        name: 'Computer Science',
        description: 'Algorithms, data structures, operating systems, DBMS, and computer networks.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: jeeSubject1Id,
        examEditionId: jeeEditionId,
        name: 'Physics',
        description: 'Mechanics, electrostatics, thermodynamics, modern physics, and optics.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: jeeSubject2Id,
        examEditionId: jeeEditionId,
        name: 'Chemistry',
        description: 'Organic reaction mechanisms, physical chemistry, and coordination compounds.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: upscSubject1Id,
        examEditionId: upscEditionId,
        name: 'General Studies Paper I',
        description: 'Indian Polity, governance, constitution, economic development, and history.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: catSubject1Id,
        examEditionId: catEditionId,
        name: 'Quantitative Aptitude',
        description: 'Number systems, arithmetic, modern algebra, permutations, and probability.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 4. Seed Exam Topics
    await queryInterface.bulkInsert('exam_topics', [
      {
        id: gateTopic1Id,
        subjectId: gateSubject1Id,
        name: 'Linear Algebra & Matrices',
        description: 'Eigenvalues, eigenvectors, matrix rank, vector spaces, and determinants.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: gateTopic2Id,
        subjectId: gateSubject2Id,
        name: 'Algorithms & Complexity',
        description: 'Asymptotic analysis, dynamic programming, graph algorithms, and NP-completeness.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: gateTopic3Id,
        subjectId: gateSubject2Id,
        name: 'Operating Systems Architecture',
        description: 'Virtual memory paging, CPU scheduling, synchronization, and deadlocks.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: jeeTopic1Id,
        subjectId: jeeSubject1Id,
        name: 'Mechanics & Newton\'s Laws',
        description: 'Kinematics, work-energy theorem, rotational dynamics, and conservation of momentum.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: jeeTopic2Id,
        subjectId: jeeSubject1Id,
        name: 'Electrostatics & Gauss Law',
        description: 'Electric fields, Coulomb\'s law, electric potential, and capacitance.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: upscTopic1Id,
        subjectId: upscSubject1Id,
        name: 'Indian Polity & Constitutional Framework',
        description: 'Fundamental rights, directive principles, parliamentary system, and judiciary.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: catTopic1Id,
        subjectId: catSubject1Id,
        name: 'Number Systems & Algebra',
        description: 'Divisibility, modular arithmetic, quadratic inequalities, and sequences.',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 5. Seed Topic Quizzes in the Exam Hierarchy
    await queryInterface.bulkInsert('quizzes', [
      {
        id: examQuiz1Id,
        courseId: null,
        subtopicId: null,
        title: 'GATE Linear Algebra & Eigenvalues Drill',
        description: 'High-yield practice questions testing eigenvalues, matrix invertibility, and vector space dimensions.',
        duration: 12,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: gateEditionId,
        examSubjectId: gateSubject1Id,
        examTopicId: gateTopic1Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: examQuiz2Id,
        courseId: null,
        subtopicId: null,
        title: 'GATE Algorithms & Complexity Analysis',
        description: 'Rigorous asymptotic analysis, recurrence relations, dynamic programming, and greedy algorithms.',
        duration: 15,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: gateEditionId,
        examSubjectId: gateSubject2Id,
        examTopicId: gateTopic2Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: examQuiz3Id,
        courseId: null,
        subtopicId: null,
        title: 'GATE OS Virtual Memory & Scheduling',
        description: 'Multi-level page tables, TLB hit rates, scheduling turnaround times, and semaphore synchronization.',
        duration: 15,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: gateEditionId,
        examSubjectId: gateSubject2Id,
        examTopicId: gateTopic3Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: examQuiz4Id,
        courseId: null,
        subtopicId: null,
        title: 'JEE Mechanics Kinematics & Work-Energy',
        description: 'Challenging physics numericals on projectile motion, friction, and rotational inertia.',
        duration: 15,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: jeeEditionId,
        examSubjectId: jeeSubject1Id,
        examTopicId: jeeTopic1Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: examQuiz5Id,
        courseId: null,
        subtopicId: null,
        title: 'UPSC Constitutional Framework & Rights',
        description: 'Analytical multiple choice questions on Fundamental Rights, DPSP, and landmark judicial rulings.',
        duration: 15,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: upscEditionId,
        examSubjectId: upscSubject1Id,
        examTopicId: upscTopic1Id,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 6. Seed Questions for Competitive Topic Quizzes
    await queryInterface.bulkInsert('questions', [
      // GATE Linear Algebra Questions
      {
        id: uuidv4(),
        quizId: examQuiz1Id,
        questionText: 'If a square matrix A has eigenvalues 2 and 3, what are the eigenvalues of matrix A^2?',
        optionA: '2 and 3',
        optionB: '4 and 9',
        optionC: 'sqrt(2) and sqrt(3)',
        optionD: '1/2 and 1/3',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: examQuiz1Id,
        questionText: 'For an n x n real symmetric matrix, which of the following is always true?',
        optionA: 'All eigenvalues are complex',
        optionB: 'All eigenvalues are real',
        optionC: 'The determinant is zero',
        optionD: 'The trace is negative',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: examQuiz1Id,
        questionText: 'What is the determinant of an upper triangular matrix?',
        optionA: 'Sum of diagonal elements',
        optionB: 'Product of diagonal elements',
        optionC: 'Zero',
        optionD: 'Always 1',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },

      // GATE Algorithms Questions
      {
        id: uuidv4(),
        quizId: examQuiz2Id,
        questionText: 'What is the worst-case running time of the Floyd-Warshall all-pairs shortest path algorithm for a graph with V vertices?',
        optionA: 'O(V^2)',
        optionB: 'O(V^3)',
        optionC: 'O(V log V)',
        optionD: 'O(V + E)',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: examQuiz2Id,
        questionText: 'Which algorithmic paradigm does Huffman Coding employ?',
        optionA: 'Dynamic Programming',
        optionB: 'Greedy Approach',
        optionC: 'Divide and Conquer',
        optionD: 'Branch and Bound',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },

      // JEE Mechanics Questions
      {
        id: uuidv4(),
        quizId: examQuiz4Id,
        questionText: 'A particle moves in a circle of radius R with constant speed V. What is the magnitude of its acceleration?',
        optionA: 'Zero',
        optionB: 'V^2 / R directed radially inward',
        optionC: 'V / R^2 directed tangential',
        optionD: 'V^2 * R',
        correctOption: 'B',
        marks: 4,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: examQuiz4Id,
        questionText: 'What is the work done by the centripetal force on an object in uniform circular motion over a full revolution?',
        optionA: '2 * pi * F * R',
        optionB: 'F * R',
        optionC: '0',
        optionD: 'F / (2 * pi)',
        correctOption: 'C',
        marks: 4,
        createdAt: now,
        updatedAt: now
      },

      // UPSC Polity Questions
      {
        id: uuidv4(),
        quizId: examQuiz5Id,
        questionText: 'Which article of the Indian Constitution guarantees the Right to Constitutional Remedies (Writ Jurisdiction)?',
        optionA: 'Article 14',
        optionB: 'Article 19',
        optionC: 'Article 21',
        optionD: 'Article 32',
        correctOption: 'D',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: examQuiz5Id,
        questionText: 'Under the Indian Constitution, the Directive Principles of State Policy (DPSP) are inspired by which constitution?',
        optionA: 'United States Constitution',
        optionB: 'Irish Constitution',
        optionC: 'Australian Constitution',
        optionD: 'French Constitution',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('questions', null, {});
    await queryInterface.bulkDelete('quizzes', null, {});
    await queryInterface.bulkDelete('exam_topics', null, {});
    await queryInterface.bulkDelete('exam_subjects', null, {});
    await queryInterface.bulkDelete('exam_editions', null, {});
    await queryInterface.bulkDelete('exams', null, {});
  }
};
