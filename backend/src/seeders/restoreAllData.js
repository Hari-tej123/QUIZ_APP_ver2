'use strict';

/**
 * FULL DATA RESTORE SCRIPT
 * Runs ALL seeders in the correct dependency order using ignoreDuplicates / findOrCreate.
 * Safe to run multiple times — will not duplicate existing rows.
 *
 * Usage:
 *   node src/seeders/restoreAllData.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function run() {
  const qi = sequelize.getQueryInterface();
  const now = new Date();

  console.log('\n========================================');
  console.log('  Quizzify Full Data Restore Script');
  console.log('========================================\n');

  // ─── STEP 0: Institutes ───────────────────────────────────────────────────
  console.log('[1/9] Seeding institutes...');
  await qi.bulkInsert('institutes', [
    { id: 'inst-mit-001',      name: 'MIT College of Engineering',          code: 'MIT',      city: 'Pune',      state: 'Maharashtra', status: 'active', createdAt: now, updatedAt: now },
    { id: 'inst-iit-001',      name: 'Indian Institute of Technology Bombay', code: 'IITB',   city: 'Mumbai',    state: 'Maharashtra', status: 'active', createdAt: now, updatedAt: now },
    { id: 'inst-bits-001',     name: 'BITS Pilani',                          code: 'BITS',    city: 'Pilani',    state: 'Rajasthan',   status: 'active', createdAt: now, updatedAt: now },
    { id: 'inst-delhi-001',    name: 'Delhi Technological University',       code: 'DTU',     city: 'New Delhi', state: 'Delhi',       status: 'active', createdAt: now, updatedAt: now },
    { id: 'inst-stanford-001', name: 'Stanford University',                  code: 'STANFORD',city: 'Stanford',  state: 'California',  status: 'active', createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });
  console.log('   ✓ Institutes OK');

  // ─── STEP 1: Users ────────────────────────────────────────────────────────
  console.log('[2/9] Seeding users...');
  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminHash = bcrypt.hashSync('AdminSecurePass2026!', 10);

  const baseUserFields = {
    earningsBalance: 0.0,
    totalEarned: 0.0,
    emailVerified: true,
    mustChangePassword: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  };

  await qi.bulkInsert('users', [
    // Admin
    {
      ...baseUserFields,
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Quizzify Administrator',
      email: 'admin@quizapp.com',
      password: adminHash,
      role: 'ADMIN',
      educatorType: null,
      approvalStatus: 'APPROVED'
    },
    // Faculty 1
    {
      ...baseUserFields,
      id: 'f1111111-1111-1111-1111-111111111111',
      name: 'Dr. Jane Smith',
      email: 'faculty1@quizapp.com',
      password: passwordHash,
      role: 'EDUCATOR',
      educatorType: 'BOTH',
      approvalStatus: 'APPROVED',
      department: 'Computer Science & Engineering',
      subject: 'Algorithms & Data Structures',
      designation: 'Associate Professor',
      employeeId: 'EMP-MIT-8841',
      phone: '1234567890',
      instituteId: 'inst-mit-001'
    },
    // Faculty 2
    {
      ...baseUserFields,
      id: 'f2222222-2222-2222-2222-222222222222',
      name: 'Prof. Alan Turing',
      email: 'faculty2@quizapp.com',
      password: passwordHash,
      role: 'EDUCATOR',
      educatorType: 'COLLEGE',
      approvalStatus: 'APPROVED',
      department: 'Mathematics',
      subject: 'Discrete Structures & Linear Algebra',
      phone: '9876543210'
    },
    // Students
    {
      ...baseUserFields,
      id: 'd1111111-1111-1111-1111-111111111111',
      name: 'John Doe',
      email: 'student1@quizapp.com',
      password: passwordHash,
      role: 'STUDENT',
      approvalStatus: 'APPROVED',
      rollNumber: 'CS-2026-001',
      instituteId: 'inst-mit-001'
    },
    {
      ...baseUserFields,
      id: 'd2222222-2222-2222-2222-222222222222',
      name: 'Alice Johnson',
      email: 'student2@quizapp.com',
      password: passwordHash,
      role: 'STUDENT',
      approvalStatus: 'APPROVED',
      rollNumber: 'CS-2026-002'
    },
    {
      ...baseUserFields,
      id: 'd3333333-3333-3333-3333-333333333333',
      name: 'Bob Miller',
      email: 'student3@quizapp.com',
      password: passwordHash,
      role: 'STUDENT',
      approvalStatus: 'APPROVED',
      rollNumber: 'CS-2026-003'
    },
    {
      ...baseUserFields,
      id: 'd4444444-4444-4444-4444-444444444444',
      name: 'Charlie Davis',
      email: 'student4@quizapp.com',
      password: passwordHash,
      role: 'STUDENT',
      approvalStatus: 'APPROVED',
      rollNumber: 'MA-2026-001'
    },
    {
      ...baseUserFields,
      id: 'd5555555-5555-5555-5555-555555555555',
      name: 'Diana Prince',
      email: 'student5@quizapp.com',
      password: passwordHash,
      role: 'STUDENT',
      approvalStatus: 'APPROVED',
      rollNumber: 'MA-2026-002'
    },
    // Competitive Contributors
    {
      ...baseUserFields,
      id: 'cc111111-1111-1111-1111-111111111111',
      name: 'Prof. Rajesh Sharma',
      email: 'contributor1@quizapp.com',
      password: passwordHash,
      role: 'EDUCATOR',
      educatorType: 'COMPETITIVE',
      approvalStatus: 'APPROVED',
      contributorStatus: 'approved',
      badge: 'Verified Educator',
      bio: 'Ex-IIT Kharagpur Faculty & 12+ years coaching top AIR rankers in GATE CSE and Algorithms.',
      credentials: 'M.Tech CSE (IIT Kharagpur), Author of "Algorithmic Paradigms for GATE"',
      subjectExpertise: 'Computer Science, Algorithms, Discrete Maths',
      phone: '+91 98765 43210',
      earningsBalance: 125.50,
      totalEarned: 350.00
    },
    {
      ...baseUserFields,
      id: 'cc222222-2222-2222-2222-222222222222',
      name: 'Dr. Ananya Roy',
      email: 'contributor2@quizapp.com',
      password: passwordHash,
      role: 'EDUCATOR',
      educatorType: 'COMPETITIVE',
      approvalStatus: 'APPROVED',
      contributorStatus: 'approved',
      badge: 'Verified Educator',
      bio: 'Senior Physics Coach for JEE Advanced & Olympiads with over 15 years of teaching experience.',
      credentials: 'Ph.D. in Applied Physics, Gold Medalist, Top JEE Coach',
      subjectExpertise: 'Physics, Mechanics, Electrostatics',
      phone: '+91 98111 22233',
      earningsBalance: 90.00,
      totalEarned: 240.00
    },
    {
      ...baseUserFields,
      id: 'cc333333-3333-3333-3333-333333333333',
      name: 'Coach Vikram Patel',
      email: 'contributor3@quizapp.com',
      password: passwordHash,
      role: 'STUDENT',
      educatorType: null,
      approvalStatus: 'APPROVED',
      contributorStatus: 'pending',
      bio: 'Quantitative Aptitude and Logical Reasoning Mentor for CAT & MBA Entrances.',
      credentials: 'MBA (IIM Indore), CAT 99.8%iler',
      subjectExpertise: 'Quantitative Aptitude, Data Interpretation',
      phone: '+91 98999 88877',
      earningsBalance: 0.0,
      totalEarned: 0.0
    }
  ], { ignoreDuplicates: true });
  console.log('   ✓ Users OK');

  // ─── STEP 2: Courses ──────────────────────────────────────────────────────
  console.log('[3/9] Seeding courses...');
  await qi.bulkInsert('courses', [
    { id: 'c1111111-1111-1111-1111-111111111111', title: 'Data Structures and Algorithms', description: 'Comprehensive university curriculum covering linear structures, balanced binary search trees, graph traversals, and dynamic programming analysis.', subject: 'Computer Science', facultyId: 'f1111111-1111-1111-1111-111111111111', instituteId: 'inst-mit-001', createdAt: now, updatedAt: now },
    { id: 'c2222222-2222-2222-2222-222222222222', title: 'Linear Algebra and Discrete Mathematics', description: 'Vector spaces, matrix decompositions, eigenvalues, graph theory proofs, propositional logic, and combinatorics for computational sciences.', subject: 'Mathematics', facultyId: 'f2222222-2222-2222-2222-222222222222', createdAt: now, updatedAt: now },
    { id: 'c3333333-3333-3333-3333-333333333333', title: 'Computer Networks & Internet Protocols', description: 'Layered architecture, link layer framing, Dijkstra link-state routing, TCP congestion control, DNS, and modern socket programming.', subject: 'Computer Science', facultyId: 'f1111111-1111-1111-1111-111111111111', createdAt: now, updatedAt: now },
    { id: 'c4444444-4444-4444-4444-444444444444', title: 'Operating Systems & System Architecture', description: 'Process scheduling, concurrency primitives, virtual memory paging with TLB caches, file system inodes, and disk scheduling.', subject: 'Computer Science', facultyId: 'f1111111-1111-1111-1111-111111111111', createdAt: now, updatedAt: now },
    { id: 'c5555555-5555-5555-5555-555555555555', title: 'Database Management Systems (DBMS)', description: 'Relational algebra, SQL query optimization, 1NF-BCNF normalization, transaction ACID guarantees, 2-phase locking, and B+ tree indexing.', subject: 'Computer Science', facultyId: 'f1111111-1111-1111-1111-111111111111', createdAt: now, updatedAt: now },
    { id: 'c6666666-6666-6666-6666-666666666666', title: 'Object-Oriented Programming & Design Patterns', description: 'Core OOP pillars, SOLID architectural guidelines, and GoF design patterns.', subject: 'Software Engineering', facultyId: 'f1111111-1111-1111-1111-111111111111', createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });
  console.log('   ✓ Courses OK');

  // ─── STEP 3: Enrollments ──────────────────────────────────────────────────
  console.log('[4/9] Seeding enrollments...');
  const [existingEnrollments] = await sequelize.query('SELECT "studentId", "courseId" FROM enrollments');
  const enrolled = new Set(existingEnrollments.map(e => `${e.studentId}|${e.courseId}`));

  const enrollmentDefs = [
    { studentId: 'd1111111-1111-1111-1111-111111111111', courseId: 'c1111111-1111-1111-1111-111111111111' },
    { studentId: 'd1111111-1111-1111-1111-111111111111', courseId: 'c3333333-3333-3333-3333-333333333333' },
    { studentId: 'd1111111-1111-1111-1111-111111111111', courseId: 'c4444444-4444-4444-4444-444444444444' },
    { studentId: 'd2222222-2222-2222-2222-222222222222', courseId: 'c1111111-1111-1111-1111-111111111111' },
    { studentId: 'd3333333-3333-3333-3333-333333333333', courseId: 'c2222222-2222-2222-2222-222222222222' }
  ];
  const newEnrollments = enrollmentDefs
    .filter(e => !enrolled.has(`${e.studentId}|${e.courseId}`))
    .map(e => ({ id: uuidv4(), ...e, enrolledAt: now, createdAt: now, updatedAt: now }));
  if (newEnrollments.length) await qi.bulkInsert('enrollments', newEnrollments, { ignoreDuplicates: true });
  console.log(`   ✓ Enrollments OK (${newEnrollments.length} new)`);

  // ─── STEP 4: Subtopics ────────────────────────────────────────────────────
  console.log('[5/9] Seeding subtopics...');
  await qi.bulkInsert('subtopics', [
    { id: 'b1111111-1111-1111-1111-111111111111', courseId: 'c1111111-1111-1111-1111-111111111111', title: 'Unit 1: Asymptotic Analysis & Recurrence Relations', description: 'Understanding runtime complexity, Big-O, Big-Theta, Master Theorem.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b2222222-2222-2222-2222-222222222222', courseId: 'c1111111-1111-1111-1111-111111111111', title: 'Unit 2: Balanced Search Trees & AVL Operations', description: 'Binary search tree invariants, left/right AVL rotations, height balancing.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b3333333-3333-3333-3333-333333333333', courseId: 'c1111111-1111-1111-1111-111111111111', title: 'Unit 3: Graph Traversals & Shortest Paths', description: 'BFS, DFS, topological sort, Dijkstra algorithm, and Bellman-Ford.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b4444444-4444-4444-4444-444444444444', courseId: 'c3333333-3333-3333-3333-333333333333', title: 'Unit 1: Network Layer & Routing Protocols', description: 'IPv4/IPv6 addressing, subnet masking, distance-vector routing, OSPF.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b5555555-5555-5555-5555-555555555555', courseId: 'c3333333-3333-3333-3333-333333333333', title: 'Unit 2: Transport Layer & TCP Flow Control', description: 'Three-way handshake, sliding window protocols, congestion avoidance (AIMD), and UDP.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b6666666-6666-6666-6666-666666666666', courseId: 'c4444444-4444-4444-4444-444444444444', title: 'Unit 1: CPU Scheduling & Process Control', description: 'Context switching, process state diagrams, round-robin, priority scheduling.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b7777777-7777-7777-7777-777777777777', courseId: 'c4444444-4444-4444-4444-444444444444', title: 'Unit 2: Virtual Memory & Page Replacement', description: 'Page tables, TLB hit/miss analysis, LRU and FIFO page replacement algorithms.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'b8888888-8888-8888-8888-888888888888', courseId: 'c5555555-5555-5555-5555-555555555555', title: 'Unit 1: Normalization & Indexing Structures', description: 'Functional dependencies, 1NF-BCNF decomposition, and B+ tree node splitting.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now },
    { id: 'da111111-1111-1111-1111-111111111111', courseId: 'c1111111-1111-1111-1111-111111111111', title: 'Unit 1: Asymptotic Notations & Master Theorem', description: 'Detailed analysis of divide-and-conquer recurrences.', filePath: null, fileName: null, fileType: null, createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });
  console.log('   ✓ Subtopics OK');

  // ─── STEP 5: Exams ────────────────────────────────────────────────────────
  console.log('[6/9] Seeding exam hierarchy (exams → editions → subjects → topics)...');
  await qi.bulkInsert('exams', [
    { id: 'ea111111-1111-1111-1111-111111111111', name: 'GATE (Graduate Aptitude Test in Engineering)', code: 'GATE', description: 'National entrance examination for Master\'s admissions and PSU recruitments.', logo_url: null, category: 'ENGINEERING', track: 'COMPETITIVE', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ea222222-2222-2222-2222-222222222222', name: 'JEE Main (Joint Entrance Examination)', code: 'JEE_MAIN', description: 'Premier undergraduate national entrance examination for NITs, IIITs, and GFTIs.', logo_url: null, category: 'ENGINEERING', track: 'COMPETITIVE', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ea333333-3333-3333-3333-333333333333', name: 'UPSC Civil Services Examination', code: 'UPSC', description: 'India\'s central civil services examination covering IAS, IPS, and IFS cadres.', logo_url: null, category: 'CIVIL_SERVICES', track: 'COMPETITIVE', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ea444444-4444-4444-4444-444444444444', name: 'CAT (Common Admission Test)', code: 'CAT', description: 'Computer-based admission test for postgraduate management and MBA programs.', logo_url: null, category: 'MANAGEMENT', track: 'COMPETITIVE', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ea555555-5555-5555-5555-555555555555', name: 'NEET (National Eligibility cum Entrance Test)', code: 'NEET', description: 'National pre-medical entrance test for MBBS and BDS courses.', logo_url: null, category: 'MEDICAL', track: 'COMPETITIVE', status: 'active', createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });

  await qi.bulkInsert('exam_editions', [
    { id: 'eb111111-1111-1111-1111-111111111111', examId: 'ea111111-1111-1111-1111-111111111111', year: 2026, description: 'GATE 2026 — Computer Science & Engineering curriculum.', is_active: true, createdAt: now, updatedAt: now },
    { id: 'eb222222-2222-2222-2222-222222222222', examId: 'ea222222-2222-2222-2222-222222222222', year: 2026, description: 'JEE Main 2026 — Session 1 & 2 comprehensive testing suite.', is_active: true, createdAt: now, updatedAt: now },
    { id: 'eb333333-3333-3333-3333-333333333333', examId: 'ea333333-3333-3333-3333-333333333333', year: 2026, description: 'UPSC CSE 2026 — Preliminary exam syllabus and GS papers.', is_active: true, createdAt: now, updatedAt: now },
    { id: 'eb444444-4444-4444-4444-444444444444', examId: 'ea444444-4444-4444-4444-444444444444', year: 2026, description: 'CAT 2026 — Quantitative Aptitude & Data Interpretation.', is_active: true, createdAt: now, updatedAt: now },
    { id: 'eb555555-5555-5555-5555-555555555555', examId: 'ea555555-5555-5555-5555-555555555555', year: 2026, description: 'NEET UG 2026 Biology, Chemistry & Physics', is_active: true, createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });

  await qi.bulkInsert('exam_subjects', [
    { id: 'ec111111-1111-1111-1111-111111111111', examEditionId: 'eb111111-1111-1111-1111-111111111111', name: 'Engineering Mathematics', description: 'Linear algebra, calculus, probability distributions, and discrete structures.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ec222222-2222-2222-2222-222222222222', examEditionId: 'eb111111-1111-1111-1111-111111111111', name: 'Computer Science', description: 'Algorithms, data structures, operating systems, DBMS, and computer networks.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ec333333-3333-3333-3333-333333333333', examEditionId: 'eb222222-2222-2222-2222-222222222222', name: 'Physics', description: 'Mechanics, electrostatics, thermodynamics, modern physics, and optics.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ec444444-4444-4444-4444-444444444444', examEditionId: 'eb222222-2222-2222-2222-222222222222', name: 'Chemistry', description: 'Organic reaction mechanisms, physical chemistry, and coordination compounds.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ec555555-5555-5555-5555-555555555555', examEditionId: 'eb333333-3333-3333-3333-333333333333', name: 'General Studies Paper I', description: 'Indian Polity, governance, constitution, economic development, and history.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ec666666-6666-6666-6666-666666666666', examEditionId: 'eb444444-4444-4444-4444-444444444444', name: 'Quantitative Aptitude', description: 'Number systems, arithmetic, modern algebra, permutations, and probability.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ec555555-5555-5555-5555-555555555551', examEditionId: 'eb555555-5555-5555-5555-555555555555', name: 'Human Physiology & Genetics', description: 'Circulation, neural control, inheritance, and molecular biology.', status: 'active', createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });

  await qi.bulkInsert('exam_topics', [
    { id: 'ed111111-1111-1111-1111-111111111111', subjectId: 'ec111111-1111-1111-1111-111111111111', name: 'Linear Algebra & Matrices', description: 'Eigenvalues, eigenvectors, matrix rank, vector spaces, and determinants.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed222222-2222-2222-2222-222222222222', subjectId: 'ec222222-2222-2222-2222-222222222222', name: 'Algorithms & Complexity', description: 'Asymptotic analysis, dynamic programming, graph algorithms, and NP-completeness.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed333333-3333-3333-3333-333333333333', subjectId: 'ec222222-2222-2222-2222-222222222222', name: 'Operating Systems Architecture', description: 'Virtual memory paging, CPU scheduling, synchronization, and deadlocks.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed444444-4444-4444-4444-444444444444', subjectId: 'ec333333-3333-3333-3333-333333333333', name: 'Mechanics & Newton\'s Laws', description: 'Kinematics, work-energy theorem, rotational dynamics, and conservation of momentum.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed555555-5555-5555-5555-555555555555', subjectId: 'ec333333-3333-3333-3333-333333333333', name: 'Electrostatics & Gauss Law', description: 'Electric fields, Coulomb\'s law, electric potential, and capacitance.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed666666-6666-6666-6666-666666666666', subjectId: 'ec555555-5555-5555-5555-555555555555', name: 'Indian Polity & Constitutional Framework', description: 'Fundamental rights, directive principles, parliamentary system, and judiciary.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed777777-7777-7777-7777-777777777777', subjectId: 'ec666666-6666-6666-6666-666666666666', name: 'Number Systems & Algebra', description: 'Divisibility, modular arithmetic, quadratic inequalities, and sequences.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed888888-8888-8888-8888-888888888888', subjectId: 'ec555555-5555-5555-5555-555555555555', name: 'Indian Polity & Constitution', description: 'Constitutional framework and governance.', status: 'active', createdAt: now, updatedAt: now },
    { id: 'ed555555-5555-5555-5555-555555555551', subjectId: 'ec555555-5555-5555-5555-555555555551', name: 'Principles of Inheritance and Variation', description: 'Mendelian genetics, sex determination, and chromosomal disorders.', status: 'active', createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });
  console.log('   ✓ Exam hierarchy OK');

  // ─── STEP 6: Quizzes ──────────────────────────────────────────────────────
  console.log('[7/9] Seeding quizzes...');
  const quizRows = [
    // College quizzes (Course track)
    { id: 'e1111111-1111-1111-1111-111111111111', courseId: 'c1111111-1111-1111-1111-111111111111', subtopicId: 'b1111111-1111-1111-1111-111111111111', title: 'Big O & Recurrence Relations Drill', description: 'Test your understanding of Big-O notations, asymptotic bounds, and runtime recurrence trees.', duration: 10, durationMin: 10, maxAttempts: 3, track: 'COLLEGE', status: 'PUBLISHED', isPublished: true, publishedAt: now, ownerId: 'f1111111-1111-1111-1111-111111111111', authorId: 'f1111111-1111-1111-1111-111111111111', instituteId: 'inst-mit-001', createdAt: now, updatedAt: now },
    { id: 'e2222222-2222-2222-2222-222222222222', courseId: 'c1111111-1111-1111-1111-111111111111', subtopicId: 'b2222222-2222-2222-2222-222222222222', title: 'Binary Search Trees & AVL Rotations', description: 'Practice insertion, deletion, and balancing rotations on AVL and binary search trees.', duration: 15, durationMin: 15, maxAttempts: 3, track: 'COLLEGE', status: 'PUBLISHED', isPublished: true, publishedAt: now, ownerId: 'f1111111-1111-1111-1111-111111111111', authorId: 'f1111111-1111-1111-1111-111111111111', instituteId: 'inst-mit-001', createdAt: now, updatedAt: now },
    { id: 'e3333333-3333-3333-3333-333333333333', courseId: 'c3333333-3333-3333-3333-333333333333', subtopicId: 'b4444444-4444-4444-4444-444444444444', title: 'IP Subnetting & Link-State Routing', description: 'CIDR notation, subnet calculations, and Dijkstra shortest path routing protocol mechanisms.', duration: 12, durationMin: 12, maxAttempts: 3, track: 'COLLEGE', status: 'PUBLISHED', isPublished: true, publishedAt: now, ownerId: 'f1111111-1111-1111-1111-111111111111', authorId: 'f1111111-1111-1111-1111-111111111111', instituteId: 'inst-mit-001', createdAt: now, updatedAt: now },
    { id: 'e4444444-4444-4444-4444-444444444444', courseId: 'c4444444-4444-4444-4444-444444444444', subtopicId: 'b7777777-7777-7777-7777-777777777777', title: 'Virtual Memory & Page Replacement', description: 'Page faults, TLB miss penalties, effective memory access time, and LRU page replacement.', duration: 15, durationMin: 15, maxAttempts: 3, track: 'COLLEGE', status: 'PUBLISHED', isPublished: true, publishedAt: now, ownerId: 'f1111111-1111-1111-1111-111111111111', authorId: 'f1111111-1111-1111-1111-111111111111', instituteId: 'inst-mit-001', createdAt: now, updatedAt: now },
    // Faculty GATE quiz (seedExamsAndDemo)
    { id: 'cb111111-1111-1111-1111-111111111111', title: 'Master Theorem & Recurrence Drill (GATE)', description: 'High-yield practice questions for GATE CS on asymptotic complexity.', duration: 15, durationMin: 15, track: 'COMPETITIVE', examId: 'ea111111-1111-1111-1111-111111111111', examEditionId: 'eb111111-1111-1111-1111-111111111111', examSubjectId: 'ec222222-2222-2222-2222-222222222222', examTopicId: 'ed222222-2222-2222-2222-222222222222', ownerId: 'f1111111-1111-1111-1111-111111111111', authorId: 'f1111111-1111-1111-1111-111111111111', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    // Faculty College quiz (seedExamsAndDemo)
    { id: 'cb222222-2222-2222-2222-222222222222', title: 'CS301 Semester Quiz 1 - Algorithms Basics', description: 'Mid-term evaluation quiz for MIT undergraduate students.', duration: 20, durationMin: 20, track: 'COLLEGE', courseId: 'c1111111-1111-1111-1111-111111111111', subtopicId: 'da111111-1111-1111-1111-111111111111', instituteId: 'inst-mit-001', ownerId: 'f1111111-1111-1111-1111-111111111111', authorId: 'f1111111-1111-1111-1111-111111111111', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    // Competitive exam hierarchy quizzes
    { id: 'ee111111-1111-1111-1111-111111111111', title: 'GATE Linear Algebra & Eigenvalues Drill', description: 'High-yield practice questions testing eigenvalues, matrix invertibility, and vector space dimensions.', duration: 12, durationMin: 12, maxAttempts: 3, track: 'COMPETITIVE', examEditionId: 'eb111111-1111-1111-1111-111111111111', examSubjectId: 'ec111111-1111-1111-1111-111111111111', examTopicId: 'ed111111-1111-1111-1111-111111111111', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'ee222222-2222-2222-2222-222222222222', title: 'GATE Algorithms & Complexity Analysis', description: 'Rigorous asymptotic analysis, recurrence relations, dynamic programming, and greedy algorithms.', duration: 15, durationMin: 15, maxAttempts: 3, track: 'COMPETITIVE', examEditionId: 'eb111111-1111-1111-1111-111111111111', examSubjectId: 'ec222222-2222-2222-2222-222222222222', examTopicId: 'ed222222-2222-2222-2222-222222222222', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'ee333333-3333-3333-3333-333333333333', title: 'GATE OS Virtual Memory & Scheduling', description: 'Multi-level page tables, TLB hit rates, scheduling turnaround times, and semaphore synchronization.', duration: 15, durationMin: 15, maxAttempts: 3, track: 'COMPETITIVE', examEditionId: 'eb111111-1111-1111-1111-111111111111', examSubjectId: 'ec222222-2222-2222-2222-222222222222', examTopicId: 'ed333333-3333-3333-3333-333333333333', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'ee444444-4444-4444-4444-444444444444', title: 'JEE Mechanics Kinematics & Work-Energy', description: 'Challenging physics numericals on projectile motion, friction, and rotational inertia.', duration: 15, durationMin: 15, maxAttempts: 3, track: 'COMPETITIVE', examEditionId: 'eb222222-2222-2222-2222-222222222222', examSubjectId: 'ec333333-3333-3333-3333-333333333333', examTopicId: 'ed444444-4444-4444-4444-444444444444', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    { id: 'ee555555-5555-5555-5555-555555555555', title: 'UPSC Constitutional Framework & Rights', description: 'Analytical MCQs on Fundamental Rights, DPSP, and landmark judicial rulings.', duration: 15, durationMin: 15, maxAttempts: 3, track: 'COMPETITIVE', examEditionId: 'eb333333-3333-3333-3333-333333333333', examSubjectId: 'ec555555-5555-5555-5555-555555555555', examTopicId: 'ed666666-6666-6666-6666-666666666666', status: 'PUBLISHED', isPublished: true, publishedAt: now, createdAt: now, updatedAt: now },
    // Contributor quizzes (marketplace)
    { id: 'cb333333-3333-3333-3333-333333333333', title: 'Linear Algebra & Matrix Fundamentals (GATE Special)', description: 'Comprehensive MCQ practice covering eigenvalues, determinants, and matrix rank for GATE.', duration: 15, durationMin: 15, track: 'COMPETITIVE', examEditionId: 'eb111111-1111-1111-1111-111111111111', examSubjectId: 'ec111111-1111-1111-1111-111111111111', examTopicId: 'ed111111-1111-1111-1111-111111111111', authorId: 'cc111111-1111-1111-1111-111111111111', ownerId: 'cc111111-1111-1111-1111-111111111111', contributorAttribution: 'Prof. Ramesh Rao (GATE CS Faculty)', status: 'PUBLISHED', isPublished: true, publishedBy: 'a1111111-1111-1111-1111-111111111111', publishedAt: now, totalAttempts: 12, createdAt: now, updatedAt: now },
    { id: 'cb444444-4444-4444-4444-444444444444', title: 'Newton\'s Laws & Kinematics Mastery (JEE Main)', description: 'Core problem-solving drill on 1D/2D kinematics, projectile motion, and Newton\'s third law.', duration: 15, durationMin: 15, track: 'COMPETITIVE', examEditionId: 'eb222222-2222-2222-2222-222222222222', examSubjectId: 'ec333333-3333-3333-3333-333333333333', examTopicId: 'ed444444-4444-4444-4444-444444444444', authorId: 'cc111111-1111-1111-1111-111111111111', ownerId: 'cc111111-1111-1111-1111-111111111111', contributorAttribution: 'Dr. S. Verma (Physics Lead)', status: 'PUBLISHED', isPublished: true, publishedBy: 'a1111111-1111-1111-1111-111111111111', publishedAt: now, totalAttempts: 8, createdAt: now, updatedAt: now },
    { id: 'cb555555-5555-5555-5555-555555555555', title: 'Constitutional Framework & Governance (UPSC CSE)', description: 'High-yield conceptual MCQs on Fundamental Rights, DPSP, and Parliamentary procedures.', duration: 15, durationMin: 15, track: 'COMPETITIVE', examEditionId: 'eb333333-3333-3333-3333-333333333333', examSubjectId: 'ec555555-5555-5555-5555-555555555555', examTopicId: 'ed888888-8888-8888-8888-888888888888', authorId: 'cc111111-1111-1111-1111-111111111111', ownerId: 'cc111111-1111-1111-1111-111111111111', contributorAttribution: 'Ananya Sharma, IAS Mentor', status: 'PUBLISHED', isPublished: true, publishedBy: 'a1111111-1111-1111-1111-111111111111', publishedAt: now, totalAttempts: 15, createdAt: now, updatedAt: now },
    { id: 'cb666666-6666-6666-6666-666666666666', title: 'Number Theory & Quantitative Essentials (CAT QA)', description: 'Advanced quantitative aptitude questions covering factors, remainders, LCM-HCF, and algebraic progressions.', duration: 15, durationMin: 15, track: 'COMPETITIVE', examEditionId: 'eb444444-4444-4444-4444-444444444444', examSubjectId: 'ec666666-6666-6666-6666-666666666666', examTopicId: 'ed777777-7777-7777-7777-777777777777', authorId: 'cc111111-1111-1111-1111-111111111111', ownerId: 'cc111111-1111-1111-1111-111111111111', contributorAttribution: 'IIM Alumni Aptitude Circle', status: 'PUBLISHED', isPublished: true, publishedBy: 'a1111111-1111-1111-1111-111111111111', publishedAt: now, totalAttempts: 20, createdAt: now, updatedAt: now },
    // Contributor marketplace quizzes
    { id: 'cb101010-1010-1010-1010-101010101010', title: 'Asymptotic Analysis & Recurrences Challenge (GATE Special)', description: '10 challenging practice questions by Prof. Rajesh Sharma on asymptotic bounds and master theorem edge cases.', duration: 15, durationMin: 15, track: 'COMPETITIVE', examTopicId: 'ed222222-2222-2222-2222-222222222222', authorId: 'cc111111-1111-1111-1111-111111111111', ownerId: 'cc111111-1111-1111-1111-111111111111', status: 'PUBLISHED', isPublished: true, totalAttempts: 34, contributorAttribution: 'Prof. Rajesh Sharma (Verified Educator)', createdAt: now, updatedAt: now },
    { id: 'cb202020-2020-2020-2020-202020202020', title: 'Graph Traversal & Shortest Path Drill', description: 'Pending submission covering Dijkstra, Bellman-Ford, and Topological Sorting.', duration: 20, durationMin: 20, track: 'COMPETITIVE', examTopicId: 'ed222222-2222-2222-2222-222222222222', authorId: 'cc111111-1111-1111-1111-111111111111', ownerId: 'cc111111-1111-1111-1111-111111111111', status: 'PENDING_REVIEW', isPublished: false, totalAttempts: 0, contributorAttribution: 'Prof. Rajesh Sharma (Verified Educator)', createdAt: now, updatedAt: now }
  ].map(q => ({
    totalAttempts: 0,
    startTimeWindow: null,
    endTimeWindow: null,
    ...q
  }));

  await qi.bulkInsert('quizzes', quizRows, { ignoreDuplicates: true });
  console.log('   ✓ Quizzes OK');

  // ─── STEP 7: Questions ────────────────────────────────────────────────────
  console.log('[8/9] Seeding questions...');
  const rawQuestions = [
    // College Quiz 1 (Big O & Recurrences) - e1111111
    { quizId: 'e1111111-1111-1111-1111-111111111111', questionText: 'What is the worst-case time complexity of searching in an unsorted array of size N?', optionA: 'O(1)', optionB: 'O(log N)', optionC: 'O(N)', optionD: 'O(N log N)', correctOption: 'C', marks: 2, difficulty: 'easy', explanation: 'In an unsorted array, we must potentially inspect every element in the worst case, leading to O(N).' },
    { quizId: 'e1111111-1111-1111-1111-111111111111', questionText: 'Which data structure follows the Last-In-First-Out (LIFO) operational principle?', optionA: 'Queue', optionB: 'Stack', optionC: 'Binary Tree', optionD: 'Graph', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'A stack strictly follows Last-In-First-Out (LIFO).' },
    { quizId: 'e1111111-1111-1111-1111-111111111111', questionText: 'What is the solution to T(N) = 2T(N/2) + O(N) by Master Theorem?', optionA: 'O(N)', optionB: 'O(N log N)', optionC: 'O(N^2)', optionD: 'O(log N)', correctOption: 'B', marks: 3, difficulty: 'medium', explanation: 'Case 2 of Master Theorem: a=2, b=2, c=1. Since log2(2) = 1, T(N) = O(N log N).' },
    { quizId: 'e1111111-1111-1111-1111-111111111111', questionText: 'Which sorting algorithm has a guaranteed worst-case time complexity of O(N log N)?', optionA: 'Quick Sort', optionB: 'Merge Sort', optionC: 'Bubble Sort', optionD: 'Selection Sort', correctOption: 'B', marks: 3, difficulty: 'medium', explanation: 'Merge sort always splits the list in half and takes linear time to merge, guaranteeing O(N log N).' },
    // College Quiz 2 (AVL Trees) - e2222222
    { quizId: 'e2222222-2222-2222-2222-222222222222', questionText: 'What is the maximum height of an AVL tree with N nodes?', optionA: 'O(N)', optionB: 'O(log N)', optionC: 'O(sqrt(N))', optionD: 'O(N log N)', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'The AVL balancing condition strictly limits tree height to approximately 1.44 log2(N).' },
    { quizId: 'e2222222-2222-2222-2222-222222222222', questionText: 'Which traversal of a Binary Search Tree produces elements in sorted ascending order?', optionA: 'Pre-order', optionB: 'In-order', optionC: 'Post-order', optionD: 'Level-order', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'In-order traversal visits left subtree, root, right subtree, yielding non-decreasing order in BST.' },
    { quizId: 'e2222222-2222-2222-2222-222222222222', questionText: 'In an AVL tree, when balance factor is +2 after insertion into the left child\'s right subtree, which rotation is required?', optionA: 'Single Left Rotation', optionB: 'Single Right Rotation', optionC: 'Left-Right (LR) Double Rotation', optionD: 'Right-Left (RL) Double Rotation', correctOption: 'C', marks: 3, difficulty: 'hard', explanation: 'Left-Right imbalance requires a Left-Right (LR) double rotation to restore balance.' },
    // College Quiz 3 (Networks) - e3333333
    { quizId: 'e3333333-3333-3333-3333-333333333333', questionText: 'In IPv4 CIDR notation /26, how many usable host addresses are available in the subnet?', optionA: '64', optionB: '62', optionC: '30', optionD: '126', correctOption: 'B', marks: 2, difficulty: 'medium', explanation: '32 - 26 = 6 host bits. 2^6 - 2 = 62 usable addresses.' },
    { quizId: 'e3333333-3333-3333-3333-333333333333', questionText: 'Which routing protocol is an interior gateway protocol based on Link-State algorithm?', optionA: 'RIP', optionB: 'OSPF', optionC: 'BGP', optionD: 'EGP', correctOption: 'B', marks: 2, difficulty: 'medium', explanation: 'OSPF is the canonical link-state interior gateway routing protocol.' },
    { quizId: 'e3333333-3333-3333-3333-333333333333', questionText: 'What is the purpose of the 3-Way Handshake in TCP?', optionA: 'To encrypt application payload', optionB: 'To synchronize sequence numbers and establish connection state', optionC: 'To measure round-trip ping time', optionD: 'To calculate DNS cache records', correctOption: 'B', marks: 3, difficulty: 'medium', explanation: 'SYN, SYN-ACK, ACK synchronizes sequence numbers and confirms bidirectional communication.' },
    // College Quiz 4 (OS) - e4444444
    { quizId: 'e4444444-4444-4444-4444-444444444444', questionText: 'What is the primary function of the Translation Lookaside Buffer (TLB)?', optionA: 'Disk block cache', optionB: 'Hardware cache for fast virtual-to-physical address translation', optionC: 'Process priority queue', optionD: 'Interrupt vector table', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'TLB is an associative hardware cache inside the MMU storing recent page table translations.' },
    { quizId: 'e4444444-4444-4444-4444-444444444444', questionText: 'Which page replacement algorithm suffers from Belady\'s Anomaly?', optionA: 'LRU (Least Recently Used)', optionB: 'Optimal Page Replacement', optionC: 'FIFO (First-In-First-Out)', optionD: 'LFU (Least Frequently Used)', correctOption: 'C', marks: 3, difficulty: 'medium', explanation: 'FIFO may incur more page faults when allocated more physical frames.' },
    // GATE Linear Algebra - ee111111
    { quizId: 'ee111111-1111-1111-1111-111111111111', questionText: 'If a square matrix A has eigenvalues 2 and 3, what are the eigenvalues of A^2?', optionA: '2 and 3', optionB: '4 and 9', optionC: 'sqrt(2) and sqrt(3)', optionD: '1/2 and 1/3', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'If lambda is an eigenvalue of A, then lambda^k is an eigenvalue of A^k.' },
    { quizId: 'ee111111-1111-1111-1111-111111111111', questionText: 'For an n x n real symmetric matrix, which of the following is always true?', optionA: 'All eigenvalues are complex', optionB: 'All eigenvalues are real', optionC: 'The determinant is zero', optionD: 'The trace is negative', correctOption: 'B', marks: 2, difficulty: 'medium', explanation: 'Real symmetric matrices always have entirely real eigenvalues.' },
    { quizId: 'ee111111-1111-1111-1111-111111111111', questionText: 'What is the determinant of an upper triangular matrix?', optionA: 'Sum of diagonal elements', optionB: 'Product of diagonal elements', optionC: 'Zero', optionD: 'Always 1', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'Determinant of any triangular matrix equals the product of its diagonal entries.' },
    // GATE Algorithms - ee222222
    { quizId: 'ee222222-2222-2222-2222-222222222222', questionText: 'What is the worst-case running time of Floyd-Warshall all-pairs shortest path for V vertices?', optionA: 'O(V^2)', optionB: 'O(V^3)', optionC: 'O(V log V)', optionD: 'O(V + E)', correctOption: 'B', marks: 2, difficulty: 'medium', explanation: 'Floyd-Warshall runs three nested loops over V vertices, giving O(V^3).' },
    { quizId: 'ee222222-2222-2222-2222-222222222222', questionText: 'Which algorithmic paradigm does Huffman Coding employ?', optionA: 'Dynamic Programming', optionB: 'Greedy Approach', optionC: 'Divide and Conquer', optionD: 'Branch and Bound', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'Huffman coding greedily merges the two lowest-frequency tree nodes.' },
    // JEE Mechanics - ee444444
    { quizId: 'ee444444-4444-4444-4444-444444444444', questionText: 'A particle moves in a circle of radius R with constant speed V. What is the magnitude of its acceleration?', optionA: 'Zero', optionB: 'V^2 / R directed radially inward', optionC: 'V / R^2 directed tangential', optionD: 'V^2 * R', correctOption: 'B', marks: 4, difficulty: 'easy', explanation: 'Centripetal acceleration magnitude is V^2 / R directed toward the center of curvature.' },
    { quizId: 'ee444444-4444-4444-4444-444444444444', questionText: 'What is the work done by centripetal force on an object in uniform circular motion over a full revolution?', optionA: '2 * pi * F * R', optionB: 'F * R', optionC: '0', optionD: 'F / (2 * pi)', correctOption: 'C', marks: 4, difficulty: 'medium', explanation: 'Centripetal force is perpendicular to velocity at every instant, so work done is 0.' },
    // UPSC Polity - ee555555
    { quizId: 'ee555555-5555-5555-5555-555555555555', questionText: 'Which article of the Indian Constitution guarantees the Right to Constitutional Remedies (Writ Jurisdiction)?', optionA: 'Article 14', optionB: 'Article 19', optionC: 'Article 21', optionD: 'Article 32', correctOption: 'D', marks: 2, difficulty: 'easy', explanation: 'Article 32 is called the heart and soul of the Constitution by Dr. B.R. Ambedkar.' },
    { quizId: 'ee555555-5555-5555-5555-555555555555', questionText: 'The Directive Principles of State Policy (DPSP) are inspired by which constitution?', optionA: 'United States Constitution', optionB: 'Irish Constitution', optionC: 'Australian Constitution', optionD: 'French Constitution', correctOption: 'B', marks: 2, difficulty: 'easy', explanation: 'The makers of the Indian Constitution borrowed DPSPs from the 1937 Irish Constitution.' },
    // cb111111 (Faculty GATE quiz questions)
    { id: '11111111-1111-1111-1111-111111111111', quizId: 'cb111111-1111-1111-1111-111111111111', questionText: 'What is the solution of the recurrence T(n) = 2T(n/2) + O(n)?', optionA: 'O(n)', optionB: 'O(n log n)', optionC: 'O(n^2)', optionD: 'O(log n)', correctOption: 'B', marks: 1, difficulty: 'easy', explanation: 'By Case 2 of the Master Theorem (a=2, b=2, k=1), T(n) = Theta(n log n).', track: 'COMPETITIVE', createdBy: 'f1111111-1111-1111-1111-111111111111' },
    { id: '22222222-2222-2222-2222-222222222222', quizId: 'cb111111-1111-1111-1111-111111111111', questionText: 'Which sorting algorithm has a worst-case time complexity of O(n log n)?', optionA: 'Bubble Sort', optionB: 'Quick Sort', optionC: 'Merge Sort', optionD: 'Insertion Sort', correctOption: 'C', marks: 2, difficulty: 'medium', explanation: 'Merge Sort divides the array into halves and merges in linear time, guaranteeing O(n log n).', track: 'COMPETITIVE', createdBy: 'f1111111-1111-1111-1111-111111111111' },
    // cb333333 contributor quiz GATE Linear Algebra
    { id: '11111111-1111-1111-1111-111111111113', quizId: 'cb333333-3333-3333-3333-333333333333', questionText: 'If A is a 3x3 matrix with eigenvalues 1, -1, and 0, what is the determinant of A?', optionA: '0', optionB: '1', optionC: '-1', optionD: 'Undefined', correctOption: 'A', marks: 1, difficulty: 'easy', explanation: 'det(A) = product of eigenvalues = 1 * (-1) * 0 = 0.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    { id: '11111111-1111-1111-1111-111111111112', quizId: 'cb333333-3333-3333-3333-333333333333', questionText: 'For an n x n invertible matrix M, which statement is ALWAYS true?', optionA: 'Rank of M is less than n', optionB: 'det(M) = 0', optionC: '0 cannot be an eigenvalue of M', optionD: 'Trace of M must be 1', correctOption: 'C', marks: 1, difficulty: 'medium', explanation: 'An invertible matrix has non-zero determinant, so zero cannot be an eigenvalue.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    // cb444444 JEE Mechanics
    { id: '22222222-2222-2222-2222-222222222221', quizId: 'cb444444-4444-4444-4444-444444444444', questionText: 'x = 2t^3 - 6t^2 + 4. At what time is acceleration zero?', optionA: '1 second', optionB: '2 seconds', optionC: '0.5 seconds', optionD: '3 seconds', correctOption: 'A', marks: 1, difficulty: 'easy', explanation: 'a = d2x/dt2 = 12t - 12 = 0 → t = 1 second.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    // cb555555 UPSC Polity
    { id: '33333333-3333-3333-3333-333333333331', quizId: 'cb555555-5555-5555-5555-555555555555', questionText: 'Which Article provides for the right against self-incrimination in criminal matters?', optionA: 'Article 20(3)', optionB: 'Article 21', optionC: 'Article 22(1)', optionD: 'Article 19(2)', correctOption: 'A', marks: 1, difficulty: 'easy', explanation: 'Article 20(3) protects against self-incrimination.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    { id: '33333333-3333-3333-3333-333333333332', quizId: 'cb555555-5555-5555-5555-555555555555', questionText: 'The concept of "Basic Structure" was propounded in which landmark case?', optionA: 'Golaknath case (1967)', optionB: 'Kesavananda Bharati case (1973)', optionC: 'Minerva Mills case (1980)', optionD: 'Maneka Gandhi case (1978)', correctOption: 'B', marks: 1, difficulty: 'medium', explanation: 'Kesavananda Bharati v. State of Kerala (1973) established the basic structure doctrine.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    // cb666666 CAT Number Systems
    { id: '44444444-4444-4444-4444-444444444441', quizId: 'cb666666-6666-6666-6666-666666666666', questionText: 'What is the remainder when 2^100 is divided by 7?', optionA: '1', optionB: '2', optionC: '4', optionD: '6', correctOption: 'B', marks: 1, difficulty: 'medium', explanation: '2^3 ≡ 1 (mod 7). 100 = 3*33+1. So 2^100 ≡ 2 (mod 7).', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    { id: '44444444-4444-4444-4444-444444444442', quizId: 'cb666666-6666-6666-6666-666666666666', questionText: 'How many trailing zeroes are there at the end of 100!?', optionA: '20', optionB: '24', optionC: '25', optionD: '28', correctOption: 'B', marks: 1, difficulty: 'easy', explanation: 'floor(100/5) + floor(100/25) = 20 + 4 = 24.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    // cb101010 Contributor asymptotic
    { id: 'cd111111-1111-1111-1111-111111111111', quizId: 'cb101010-1010-1010-1010-101010101010', questionText: 'What is the solution of T(n) = 2T(n/2) + n / log(n)?', optionA: 'Θ(n)', optionB: 'Θ(n log log n)', optionC: 'Θ(n log n)', optionD: 'Θ(n²)', correctOption: 'B', marks: 2, difficulty: 'hard', explanation: 'By the recursion tree method, T(n) = n * sum(1/(log n - i)) = n log log n.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    { id: 'cd222222-2222-2222-2222-222222222222', quizId: 'cb101010-1010-1010-1010-101010101010', questionText: 'For f(n) = 2^(log₂ n) and g(n) = n, which tight bound is correct?', optionA: 'f(n) = o(g(n))', optionB: 'f(n) = ω(g(n))', optionC: 'f(n) = Θ(g(n))', optionD: 'Cannot be compared', correctOption: 'C', marks: 1, difficulty: 'easy', explanation: '2^(log₂ n) = n, so f(n) = Θ(g(n)).', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' },
    { id: 'cd333333-3333-3333-3333-333333333333', quizId: 'cb101010-1010-1010-1010-101010101010', questionText: 'What is the minimum number of comparisons needed to find both max and min in an array of n integers?', optionA: '2n - 2', optionB: '⌈3n/2⌉ - 2', optionC: 'n log n', optionD: 'n - 1', correctOption: 'B', marks: 2, difficulty: 'medium', explanation: 'Compare in pairs: 1 comparison to compare the pair, then compare smaller with min and larger with max.', track: 'COMPETITIVE', createdBy: 'cc111111-1111-1111-1111-111111111111' }
  ].map(q => ({
    id: q.id || uuidv4(),
    quizId: q.quizId,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    questionType: 'mcq',
    options: JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)),
    correctAnswers: JSON.stringify([q.correctOption]),
    difficulty: q.difficulty || 'medium',
    marks: q.marks || 1,
    status: 'published',
    track: q.track || 'COMPETITIVE',
    explanation: q.explanation || null,
    createdBy: q.createdBy || null,
    createdAt: now,
    updatedAt: now
  }));

  await qi.bulkInsert('questions', rawQuestions, { ignoreDuplicates: true });
  console.log('   ✓ Questions OK');

  // ─── STEP 8: Platform settings, study materials, submissions, payouts ─────
  console.log('[9/9] Seeding platform settings, study materials, submissions, payouts...');
  await qi.bulkInsert('platform_settings', [
    { id: 'ba111111-1111-1111-1111-111111111111', key: 'flat_fee_per_quiz', value: '15.00', description: 'Flat bounty payout for every approved question set', createdAt: now, updatedAt: now },
    { id: 'ba222222-2222-2222-2222-222222222222', key: 'rev_share_per_attempt', value: '0.10', description: 'Revenue share credited per completed student quiz attempt', createdAt: now, updatedAt: now },
    { id: 'ba333333-3333-3333-3333-333333333333', key: 'min_withdrawal', value: '20.00', description: 'Minimum balance required to request a payout withdrawal', createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });

  await qi.bulkInsert('study_materials', [
    { id: 'da111111-1111-1111-1111-111111111111', title: 'Complete Masterclass: Master Theorem & Recurrence Relations', description: 'Comprehensive notes with 15 solved GATE past-year recurrence problems.', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=0hWbAadg-K4', fileUrl: null, content: '### Master Theorem Summary\nFor T(n) = aT(n/b) + f(n) ...', examTopicId: 'ed222222-2222-2222-2222-222222222222', authorId: 'cc111111-1111-1111-1111-111111111111', status: 'approved', reviewNotes: 'High quality notes with clear examples.', downloadsCount: 142, createdAt: now, updatedAt: now },
    { id: 'da222222-2222-2222-2222-222222222222', title: 'Dynamic Programming vs Greedy Paradigms Handout', description: 'Curated comparison sheet of standard DP problems vs greedy strategies.', type: 'pdf', videoUrl: null, fileUrl: '/uploads/sample-algorithms-handout.pdf', content: 'Summary cheat-sheet for DP and greedy approaches.', examTopicId: 'ed222222-2222-2222-2222-222222222222', authorId: 'cc111111-1111-1111-1111-111111111111', status: 'approved', reviewNotes: 'Approved for GATE CS learners.', downloadsCount: 89, createdAt: now, updatedAt: now },
    { id: 'da333333-3333-3333-3333-333333333333', title: 'Newtonian Kinematics & Projectile Motion Formulas Sheet', description: 'Formulas and short-cuts for 2D projectile motion on inclined planes.', type: 'note', videoUrl: null, fileUrl: null, content: '### Key Kinematic Formulae for JEE\n1. Trajectory: y = x tan θ ...', examTopicId: 'ed444444-4444-4444-4444-444444444444', authorId: 'cc222222-2222-2222-2222-222222222222', status: 'approved', reviewNotes: 'Verified formula sheet.', downloadsCount: 215, createdAt: now, updatedAt: now },
    { id: 'da444444-4444-4444-4444-444444444444', title: 'Rotational Dynamics Visual Video Walkthrough', description: 'Deep-dive into moment of inertia tensors and rolling conditions.', type: 'video', videoUrl: 'https://www.youtube.com/watch?v=kYUP2YpP508', fileUrl: null, content: 'Detailed explanation of torque and angular momentum conservation.', examTopicId: 'ed444444-4444-4444-4444-444444444444', authorId: 'cc222222-2222-2222-2222-222222222222', status: 'approved', reviewNotes: 'Excellent walkthrough for advanced students.', downloadsCount: 178, createdAt: now, updatedAt: now }
  ], { ignoreDuplicates: true });

  await qi.bulkInsert('content_submissions', [
    { id: 'ca111111-1111-1111-1111-111111111111', contributorId: 'cc111111-1111-1111-1111-111111111111', contentType: 'quiz', quizId: 'cb202020-2020-2020-2020-202020202020', title: 'Graph Traversal & Shortest Path Drill', trackType: 'competitive', targetDetails: JSON.stringify({ duration: 20, questionCount: 5, examName: 'GATE', subjectName: 'Computer Science', topicName: 'Algorithms & Complexity' }), status: 'pending', adminFeedback: null, payoutAmount: 0.0, createdAt: now, updatedAt: now },
    { id: 'ca222222-2222-2222-2222-222222222222', contributorId: 'cc111111-1111-1111-1111-111111111111', contentType: 'quiz', quizId: 'cb101010-1010-1010-1010-101010101010', title: 'Asymptotic Analysis & Recurrences Challenge (GATE Special)', trackType: 'competitive', targetDetails: JSON.stringify({ duration: 15, questionCount: 3, examName: 'GATE', topicName: 'Algorithms & Complexity' }), status: 'approved', adminFeedback: 'Excellent questions with clear explanations. Approved for students.', payoutAmount: 15.00, createdAt: new Date(Date.now() - 3 * 86400000), updatedAt: now }
  ], { ignoreDuplicates: true });

  await qi.bulkInsert('payouts', [
    { id: 'ce111111-1111-1111-1111-111111111111', contributorId: 'cc111111-1111-1111-1111-111111111111', amount: 15.00, type: 'bounty_quiz', status: 'completed', paymentMethod: 'Platform Bounty', referenceId: 'SUB-ca222222', notes: 'Bounty for approved quiz: Asymptotic Analysis & Recurrences Challenge', processedAt: now, createdAt: now, updatedAt: now },
    { id: 'ce222222-2222-2222-2222-222222222222', contributorId: 'cc111111-1111-1111-1111-111111111111', amount: 3.40, type: 'revenue_share', status: 'completed', paymentMethod: 'RevShare', referenceId: 'REV-batch-01', notes: 'Revenue share from 34 student quiz completions', processedAt: now, createdAt: now, updatedAt: now },
    { id: 'ce333333-3333-3333-3333-333333333333', contributorId: 'cc111111-1111-1111-1111-111111111111', amount: 100.00, type: 'withdrawal', status: 'completed', paymentMethod: 'Razorpay UPI', referenceId: 'PAY-RZP-9842187', notes: 'Payout processed to rajesh.sharma@okaxis', processedAt: new Date(Date.now() - 86400000), createdAt: new Date(Date.now() - 86400000), updatedAt: now }
  ], { ignoreDuplicates: true });
  console.log('   ✓ Platform settings, study materials, submissions, payouts OK');

  console.log('\n========================================');
  console.log('  ✅ Full restore completed successfully!');
  console.log('========================================');
  console.log('\nDemo accounts:');
  console.log('  Admin:       admin@quizapp.com          / AdminSecurePass2026!');
  console.log('  Faculty:     faculty1@quizapp.com        / password123');
  console.log('  Faculty 2:   faculty2@quizapp.com        / password123');
  console.log('  Student:     student1@quizapp.com        / password123  (also student2-5)');
  console.log('  Contributor: contributor1@quizapp.com    / password123  (also contributor2-3)');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Restore failed:', err.message);
    console.error(err);
    process.exit(1);
  });
