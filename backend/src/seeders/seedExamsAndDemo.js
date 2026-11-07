'use strict';

const bcrypt = require('bcryptjs');
const {
  User,
  Exam,
  ExamEdition,
  ExamSubject,
  ExamTopic,
  Course,
  Subtopic,
  Quiz,
  Question,
  UserExamPreference
} = require('../config/database');

async function seed() {
  console.log('Seeding exam taxonomy and demo accounts...');
  const now = new Date();
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('AdminSecurePass2026!', 10);

  // 1. Ensure Exams exist: GATE, JEE Main, NEET, UPSC Civil Services, CAT
  const examDefs = [
    {
      id: 'ea111111-1111-1111-1111-111111111111',
      name: 'GATE (Graduate Aptitude Test in Engineering)',
      code: 'GATE',
      category: 'ENGINEERING',
      track: 'COMPETITIVE',
      description: 'National examination for M.Tech admissions and PSU recruitment in India.',
      status: 'active'
    },
    {
      id: 'ea222222-2222-2222-2222-222222222222',
      name: 'JEE Main (Joint Entrance Examination)',
      code: 'JEE_MAIN',
      category: 'ENGINEERING',
      track: 'COMPETITIVE',
      description: 'National entrance exam for undergraduate engineering programs (NITs, IIITs, GFTIs).',
      status: 'active'
    },
    {
      id: 'ea555555-5555-5555-5555-555555555555',
      name: 'NEET (National Eligibility cum Entrance Test)',
      code: 'NEET',
      category: 'MEDICAL',
      track: 'COMPETITIVE',
      description: 'National pre-medical entrance test for students wishing to pursue undergraduate medical (MBBS) and dental (BDS) courses.',
      status: 'active'
    },
    {
      id: 'ea333333-3333-3333-3333-333333333333',
      name: 'UPSC Civil Services Examination',
      code: 'UPSC',
      category: 'CIVIL_SERVICES',
      track: 'COMPETITIVE',
      description: "India's central civil services examination covering IAS, IPS, and IFS cadres.",
      status: 'active'
    },
    {
      id: 'ea444444-4444-4444-4444-444444444444',
      name: 'CAT (Common Admission Test)',
      code: 'CAT',
      category: 'MANAGEMENT',
      track: 'COMPETITIVE',
      description: 'All-India entrance test for postgraduate management and MBA programs (IIMs).',
      status: 'active'
    }
  ];

  for (const ed of examDefs) {
    const [exam] = await Exam.findOrCreate({
      where: { code: ed.code },
      defaults: ed
    });
    await exam.update(ed);
  }
  console.log(`✓ Active exams configured: ${examDefs.length}`);

  // 2. Configure editions, subjects, and topics for each exam
  // GATE Edition & Taxonomy
  const [gateEdition] = await ExamEdition.findOrCreate({
    where: { id: 'eb111111-1111-1111-1111-111111111111' },
    defaults: {
      examId: 'ea111111-1111-1111-1111-111111111111',
      year: 2026,
      description: 'GATE 2026 CS & Engineering Mathematics syllabus',
      is_active: true
    }
  });

  const [gateSubject] = await ExamSubject.findOrCreate({
    where: { id: 'ec111111-1111-1111-1111-111111111111' },
    defaults: {
      examEditionId: gateEdition.id,
      name: 'Computer Science & Information Technology',
      description: 'Algorithms, Data Structures, Operating Systems, Theory of Computation',
      status: 'active'
    }
  });

  const [gateTopicAlgorithms] = await ExamTopic.findOrCreate({
    where: { id: 'ed111111-1111-1111-1111-111111111111' },
    defaults: {
      subjectId: gateSubject.id,
      name: 'Asymptotic Analysis & Recurrences',
      description: 'Master theorem, Big-O notation, divide-and-conquer recurrence relations.',
      status: 'active'
    }
  });

  const [gateTopicDS] = await ExamTopic.findOrCreate({
    where: { id: 'ed222222-2222-2222-2222-222222222222' },
    defaults: {
      subjectId: gateSubject.id,
      name: 'Trees & Graph Traversal',
      description: 'Binary trees, AVL trees, BFS, DFS, and topological sort algorithms.',
      status: 'active'
    }
  });

  // JEE Main Edition & Taxonomy
  const [jeeEdition] = await ExamEdition.findOrCreate({
    where: { id: 'eb222222-2222-2222-2222-222222222222' },
    defaults: {
      examId: 'ea222222-2222-2222-2222-222222222222',
      year: 2026,
      description: 'JEE Main 2026 Physics & Mathematics',
      is_active: true
    }
  });

  const [jeeSubject] = await ExamSubject.findOrCreate({
    where: { id: 'ec222222-2222-2222-2222-222222222222' },
    defaults: {
      examEditionId: jeeEdition.id,
      name: 'Physics',
      description: 'Mechanics, Electromagnetism, Optics, and Modern Physics',
      status: 'active'
    }
  });

  const [jeeTopic] = await ExamTopic.findOrCreate({
    where: { id: 'ed333333-3333-3333-3333-333333333333' },
    defaults: {
      subjectId: jeeSubject.id,
      name: 'Kinematics & Newton Laws',
      description: 'Motion in 1D/2D, projectile motion, friction and circular motion.',
      status: 'active'
    }
  });

  // NEET Edition & Taxonomy
  const [neetEdition] = await ExamEdition.findOrCreate({
    where: { id: 'eb555555-5555-5555-5555-555555555555' },
    defaults: {
      examId: 'ea555555-5555-5555-5555-555555555555',
      year: 2026,
      description: 'NEET UG 2026 Biology, Chemistry & Physics',
      is_active: true
    }
  });

  const [neetSubject] = await ExamSubject.findOrCreate({
    where: { id: 'ec555555-5555-5555-5555-555555555551' },
    defaults: {
      examEditionId: neetEdition.id,
      name: 'Human Physiology & Genetics',
      description: 'Circulation, neural control, inheritance, and molecular biology.',
      status: 'active'
    }
  });

  const [neetTopic] = await ExamTopic.findOrCreate({
    where: { id: 'ed555555-5555-5555-5555-555555555551' },
    defaults: {
      subjectId: neetSubject.id,
      name: 'Principles of Inheritance and Variation',
      description: 'Mendelian genetics, sex determination, and chromosomal disorders.',
      status: 'active'
    }
  });

  // 3. Configure Demo Users (Student, Educator, Faculty, Admin)
  // Student
  const [student] = await User.findOrCreate({
    where: { email: 'student1@quizapp.com' },
    defaults: {
      id: 'd1111111-1111-1111-1111-111111111111',
      name: 'John Doe',
      email: 'student1@quizapp.com',
      password: defaultPasswordHash,
      role: 'STUDENT',
      instituteId: 'inst-mit-001',
      status: 'active'
    }
  });
  await student.update({
    password: defaultPasswordHash,
    role: 'STUDENT',
    instituteId: 'inst-mit-001'
  });

  // Educator (independent competitive only)
  const [educator] = await User.findOrCreate({
    where: { email: 'contributor1@quizapp.com' },
    defaults: {
      id: 'cc111111-1111-1111-1111-111111111111',
      name: 'Prof. Rajesh Sharma',
      email: 'contributor1@quizapp.com',
      password: defaultPasswordHash,
      role: 'EDUCATOR',
      educatorType: 'COMPETITIVE',
      instituteId: null,
      contributorStatus: 'approved',
      status: 'active'
    }
  });
  await educator.update({
    password: defaultPasswordHash,
    role: 'EDUCATOR',
    educatorType: 'COMPETITIVE',
    instituteId: null,
    contributorStatus: 'approved'
  });

  // Faculty (belongs to Institute inst-mit-001, educatorType BOTH -> College & Competitive)
  const [faculty] = await User.findOrCreate({
    where: { email: 'faculty1@quizapp.com' },
    defaults: {
      id: 'f1111111-1111-1111-1111-111111111111',
      name: 'Dr. Jane Smith',
      email: 'faculty1@quizapp.com',
      password: defaultPasswordHash,
      role: 'EDUCATOR',
      educatorType: 'BOTH',
      instituteId: 'inst-mit-001',
      department: 'Computer Science & Engineering',
      subject: 'Algorithms & Data Structures',
      status: 'active'
    }
  });
  await faculty.update({
    password: defaultPasswordHash,
    role: 'EDUCATOR',
    educatorType: 'BOTH',
    instituteId: 'inst-mit-001',
    department: 'Computer Science & Engineering',
    subject: 'Algorithms & Data Structures'
  });

  // Admin
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@quizapp.com' },
    defaults: {
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Quizzify Administrator',
      email: 'admin@quizapp.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      status: 'active'
    }
  });
  await admin.update({
    password: adminPasswordHash,
    role: 'ADMIN'
  });
  console.log('✓ Demo users verified with valid passwords and roles.');

  // 4. Ensure Faculty has a College Course & subtopic for inst-mit-001
  const [collegeCourse] = await Course.findOrCreate({
    where: { id: 'c1111111-1111-1111-1111-111111111111' },
    defaults: {
      id: 'c1111111-1111-1111-1111-111111111111',
      title: 'Data Structures & Algorithms (CS301)',
      description: 'Departmental undergraduate foundational course on complexity, sorting, and trees.',
      subject: 'Computer Science',
      facultyId: faculty.id,
      instituteId: 'inst-mit-001'
    }
  });
  await collegeCourse.update({ instituteId: 'inst-mit-001', facultyId: faculty.id });

  const [subtopic] = await Subtopic.findOrCreate({
    where: { id: 'da111111-1111-1111-1111-111111111111' },
    defaults: {
      id: 'da111111-1111-1111-1111-111111111111',
      courseId: collegeCourse.id,
      title: 'Unit 1: Asymptotic Notations & Master Theorem',
      description: 'Detailed analysis of divide-and-conquer recurrences.'
    }
  });

  // 5. Ensure Published Quizzes & Questions exist under GATE Topics
  const [gateQuiz] = await Quiz.findOrCreate({
    where: { id: 'cb111111-1111-1111-1111-111111111111' },
    defaults: {
      id: 'cb111111-1111-1111-1111-111111111111',
      title: 'Master Theorem & Recurrence Drill (GATE)',
      description: 'High-yield practice questions for GATE CS on asymptotic complexity.',
      duration: 15,
      durationMin: 15,
      track: 'COMPETITIVE',
      examId: 'ea111111-1111-1111-1111-111111111111',
      examEditionId: gateEdition.id,
      examSubjectId: gateSubject.id,
      examTopicId: gateTopicAlgorithms.id,
      ownerId: faculty.id,
      authorId: faculty.id,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: now
    }
  });
  await gateQuiz.update({
    track: 'COMPETITIVE',
    examId: 'ea111111-1111-1111-1111-111111111111',
    examEditionId: gateEdition.id,
    examSubjectId: gateSubject.id,
    examTopicId: gateTopicAlgorithms.id,
    status: 'PUBLISHED',
    isPublished: true
  });

  // Ensure Questions for the GATE Quiz
  const questionRows = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      quizId: gateQuiz.id,
      questionText: 'What is the solution of the recurrence T(n) = 2T(n/2) + O(n)?',
      optionA: 'O(n)',
      optionB: 'O(n log n)',
      optionC: 'O(n^2)',
      optionD: 'O(log n)',
      options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
      correctOption: 'B',
      correctAnswers: ['B'],
      explanation: 'By Case 2 of the Master Theorem (a=2, b=2, k=1), since log2(2) = 1 = k, T(n) = Theta(n log n).',
      difficulty: 'easy',
      marks: 1,
      track: 'COMPETITIVE',
      subject: 'Computer Science',
      topic: 'Asymptotic Analysis & Recurrences',
      examId: 'ea111111-1111-1111-1111-111111111111',
      status: 'published',
      createdBy: faculty.id
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      quizId: gateQuiz.id,
      questionText: 'Which sorting algorithm has a worst-case time complexity of O(n log n)?',
      optionA: 'Bubble Sort',
      optionB: 'Quick Sort',
      optionC: 'Merge Sort',
      optionD: 'Insertion Sort',
      options: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Insertion Sort'],
      correctOption: 'C',
      correctAnswers: ['C'],
      explanation: 'Merge Sort divides the array into halves and merges in linear time, guaranteeing O(n log n) even in worst case.',
      difficulty: 'medium',
      marks: 2,
      track: 'COMPETITIVE',
      subject: 'Computer Science',
      topic: 'Asymptotic Analysis & Recurrences',
      examId: 'ea111111-1111-1111-1111-111111111111',
      status: 'published',
      createdBy: faculty.id
    }
  ];

  for (const q of questionRows) {
    const [question] = await Question.findOrCreate({
      where: { id: q.id },
      defaults: q
    });
    await question.update(q);
  }

  // Also ensure College Quiz for Faculty & Institute
  const [collegeQuiz] = await Quiz.findOrCreate({
    where: { id: 'cb222222-2222-2222-2222-222222222222' },
    defaults: {
      id: 'cb222222-2222-2222-2222-222222222222',
      title: 'CS301 Semester Quiz 1 - Algorithms Basics',
      description: 'Mid-term evaluation quiz for MIT undergraduate students.',
      duration: 20,
      durationMin: 20,
      track: 'COLLEGE',
      courseId: collegeCourse.id,
      subtopicId: 'da111111-1111-1111-1111-111111111111',
      instituteId: 'inst-mit-001',
      ownerId: faculty.id,
      authorId: faculty.id,
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: now
    }
  });
  await collegeQuiz.update({
    track: 'COLLEGE',
    courseId: collegeCourse.id,
    subtopicId: 'da111111-1111-1111-1111-111111111111',
    instituteId: 'inst-mit-001',
    status: 'PUBLISHED',
    isPublished: true
  });

  console.log('✓ Taxonomy, courses, quizzes, and questions seeded successfully.');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
