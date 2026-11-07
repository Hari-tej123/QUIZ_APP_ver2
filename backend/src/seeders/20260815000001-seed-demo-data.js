'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminId = 'a1111111-1111-1111-1111-111111111111';
    const faculty1Id = 'f1111111-1111-1111-1111-111111111111';
    const faculty2Id = 'f2222222-2222-2222-2222-222222222222';
    
    const studentIds = [
      'd1111111-1111-1111-1111-111111111111',
      'd2222222-2222-2222-2222-222222222222',
      'd3333333-3333-3333-3333-333333333333',
      'd4444444-4444-4444-4444-444444444444',
      'd5555555-5555-5555-5555-555555555555'
    ];

    // Course UUIDs
    const course1Id = 'c1111111-1111-1111-1111-111111111111'; // DSA
    const course2Id = 'c2222222-2222-2222-2222-222222222222'; // Linear Algebra & Discrete Math
    const course3Id = 'c3333333-3333-3333-3333-333333333333'; // Computer Networks
    const course4Id = 'c4444444-4444-4444-4444-444444444444'; // Operating Systems
    const course5Id = 'c5555555-5555-5555-5555-555555555555'; // DBMS
    const course6Id = 'c6666666-6666-6666-6666-666666666666'; // OOP & Design Patterns

    // Subtopic (Unit/Module) UUIDs
    const subtopic1Id = 'b1111111-1111-1111-1111-111111111111';
    const subtopic2Id = 'b2222222-2222-2222-2222-222222222222';
    const subtopic3Id = 'b3333333-3333-3333-3333-333333333333';
    const subtopic4Id = 'b4444444-4444-4444-4444-444444444444';
    const subtopic5Id = 'b5555555-5555-5555-5555-555555555555';
    const subtopic6Id = 'b6666666-6666-6666-6666-666666666666';
    const subtopic7Id = 'b7777777-7777-7777-7777-777777777777';
    const subtopic8Id = 'b8888888-8888-8888-8888-888888888888';

    // Quiz UUIDs
    const quiz1Id = 'e1111111-1111-1111-1111-111111111111';
    const quiz2Id = 'e2222222-2222-2222-2222-222222222222';
    const quiz3Id = 'e3333333-3333-3333-3333-333333333333';
    const quiz4Id = 'e4444444-4444-4444-4444-444444444444';

    const passwordHash = bcrypt.hashSync('password123', 10);
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const now = new Date();

    // 1. Seed Users
    await queryInterface.bulkInsert('users', [
      ...(adminEmail && adminPassword && adminPassword.length >= 16 ? [{
        id: adminId,
        name: 'Super Admin',
        email: adminEmail,
        password: bcrypt.hashSync(adminPassword, 10),
        role: 'ADMIN',
        educatorType: null,
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }] : []),
      {
        id: faculty1Id,
        name: 'Dr. Jane Smith',
        email: 'faculty1@quizapp.com',
        password: passwordHash,
        role: 'EDUCATOR',
        educatorType: 'COLLEGE',
        department: 'Computer Science',
        subject: 'Algorithms & Systems',
        phone: '1234567890',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: faculty2Id,
        name: 'Prof. Alan Turing',
        email: 'faculty2@quizapp.com',
        password: passwordHash,
        role: 'EDUCATOR',
        educatorType: 'COLLEGE',
        department: 'Mathematics',
        subject: 'Discrete Structures & Linear Algebra',
        phone: '9876543210',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: studentIds[0],
        name: 'John Doe',
        email: 'student1@quizapp.com',
        password: passwordHash,
        role: 'STUDENT',
        rollNumber: 'CS-2026-001',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: studentIds[1],
        name: 'Alice Johnson',
        email: 'student2@quizapp.com',
        password: passwordHash,
        role: 'STUDENT',
        rollNumber: 'CS-2026-002',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: studentIds[2],
        name: 'Bob Miller',
        email: 'student3@quizapp.com',
        password: passwordHash,
        role: 'STUDENT',
        rollNumber: 'CS-2026-003',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: studentIds[3],
        name: 'Charlie Davis',
        email: 'student4@quizapp.com',
        password: passwordHash,
        role: 'STUDENT',
        rollNumber: 'MA-2026-001',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: studentIds[4],
        name: 'Diana Prince',
        email: 'student5@quizapp.com',
        password: passwordHash,
        role: 'STUDENT',
        rollNumber: 'MA-2026-002',
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 2. Seed College / Academic Track Courses
    await queryInterface.bulkInsert('courses', [
      {
        id: course1Id,
        title: 'Data Structures and Algorithms',
        description: 'Comprehensive university curriculum covering linear structures, balanced binary search trees, graph traversals, and dynamic programming analysis.',
        subject: 'Computer Science',
        facultyId: faculty1Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: course2Id,
        title: 'Linear Algebra and Discrete Mathematics',
        description: 'Vector spaces, matrix decompositions, eigenvalues, graph theory proofs, propositional logic, and combinatorics for computational sciences.',
        subject: 'Mathematics',
        facultyId: faculty2Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: course3Id,
        title: 'Computer Networks & Internet Protocols',
        description: 'Layered architecture, link layer framing, Dijkstra link-state routing, TCP congestion control, DNS, and modern socket programming.',
        subject: 'Computer Science',
        facultyId: faculty1Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: course4Id,
        title: 'Operating Systems & System Architecture',
        description: 'Process scheduling, concurrency primitives, virtual memory paging with TLB caches, file system inodes, and disk scheduling.',
        subject: 'Computer Science',
        facultyId: faculty1Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: course5Id,
        title: 'Database Management Systems (DBMS)',
        description: 'Relational algebra, SQL query optimization, 1NF-BCNF normalization, transaction ACID guarantees, 2-phase locking, and B+ tree indexing.',
        subject: 'Computer Science',
        facultyId: faculty1Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: course6Id,
        title: 'Object-Oriented Programming & Design Patterns',
        description: 'Core OOP pillars (encapsulation, inheritance, polymorphism), SOLID architectural guidelines, and GoF design patterns (Singleton, Factory, Observer).',
        subject: 'Software Engineering',
        facultyId: faculty1Id,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 3. Seed Enrollments
    await queryInterface.bulkInsert('enrollments', [
      {
        id: uuidv4(),
        studentId: studentIds[0],
        courseId: course1Id,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        studentId: studentIds[0],
        courseId: course3Id,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        studentId: studentIds[0],
        courseId: course4Id,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        studentId: studentIds[1],
        courseId: course1Id,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        studentId: studentIds[2],
        courseId: course2Id,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 4. Seed Subtopics (Units / Modules)
    await queryInterface.bulkInsert('subtopics', [
      // DSA Units
      {
        id: subtopic1Id,
        courseId: course1Id,
        title: 'Unit 1: Asymptotic Analysis & Recurrence Relations',
        description: 'Understanding runtime complexity, Big-O, Big-Theta, Master Theorem, and recurrence equations.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: subtopic2Id,
        courseId: course1Id,
        title: 'Unit 2: Balanced Search Trees & AVL Operations',
        description: 'Binary search tree invariants, left/right AVL rotations, height balancing, and red-black tree properties.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: subtopic3Id,
        courseId: course1Id,
        title: 'Unit 3: Graph Traversals & Shortest Paths',
        description: 'Breadth-first search, depth-first search, topological sort, Dijkstra algorithm, and Bellman-Ford.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      // Computer Networks Units
      {
        id: subtopic4Id,
        courseId: course3Id,
        title: 'Unit 1: Network Layer & Routing Protocols',
        description: 'IPv4/IPv6 addressing, subnet masking, distance-vector routing, and link-state OSPF.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: subtopic5Id,
        courseId: course3Id,
        title: 'Unit 2: Transport Layer & TCP Flow Control',
        description: 'Three-way handshake, sliding window protocols, congestion avoidance (AIMD), and UDP.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      // Operating Systems Units
      {
        id: subtopic6Id,
        courseId: course4Id,
        title: 'Unit 1: CPU Scheduling & Process Control',
        description: 'Context switching, process state diagrams, round-robin, priority scheduling, and multilevel feedback queues.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: subtopic7Id,
        courseId: course4Id,
        title: 'Unit 2: Virtual Memory & Page Replacement',
        description: 'Page tables, inverted page tables, TLB hit/miss analysis, LRU and FIFO page replacement algorithms.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      },
      // DBMS Units
      {
        id: subtopic8Id,
        courseId: course5Id,
        title: 'Unit 1: Normalization & Indexing Structures',
        description: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF decomposition, and B+ tree node splitting.',
        filePath: null,
        fileName: null,
        fileType: null,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 5. Seed College Quizzes
    await queryInterface.bulkInsert('quizzes', [
      {
        id: quiz1Id,
        courseId: course1Id,
        subtopicId: subtopic1Id,
        title: 'Big O & Recurrence Relations Drill',
        description: 'Test your understanding of Big-O notations, asymptotic bounds, and runtime recurrence trees.',
        duration: 10,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: null,
        examSubjectId: null,
        examTopicId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: quiz2Id,
        courseId: course1Id,
        subtopicId: subtopic2Id,
        title: 'Binary Search Trees & AVL Rotations',
        description: 'Practice insertion, deletion, and balancing rotations on AVL and binary search trees.',
        duration: 15,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: null,
        examSubjectId: null,
        examTopicId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: quiz3Id,
        courseId: course3Id,
        subtopicId: subtopic4Id,
        title: 'IP Subnetting & Link-State Routing',
        description: 'CIDR notation, subnet calculations, and Dijkstra shortest path routing protocol mechanisms.',
        duration: 12,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: null,
        examSubjectId: null,
        examTopicId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: quiz4Id,
        courseId: course4Id,
        subtopicId: subtopic7Id,
        title: 'Virtual Memory & Page Replacement',
        description: 'Page faults, TLB miss penalties, effective memory access time, and LRU page replacement.',
        duration: 15,
        maxAttempts: 3,
        startTimeWindow: null,
        endTimeWindow: null,
        examEditionId: null,
        examSubjectId: null,
        examTopicId: null,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // 6. Seed Questions for College Quizzes
    await queryInterface.bulkInsert('questions', [
      // Quiz 1 Questions (DSA Big O)
      {
        id: uuidv4(),
        quizId: quiz1Id,
        questionText: 'What is the worst-case time complexity of searching in an unsorted array of size N?',
        optionA: 'O(1)',
        optionB: 'O(log N)',
        optionC: 'O(N)',
        optionD: 'O(N log N)',
        correctOption: 'C',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz1Id,
        questionText: 'Which data structure follows the Last-In-First-Out (LIFO) operational principle?',
        optionA: 'Queue',
        optionB: 'Stack',
        optionC: 'Binary Tree',
        optionD: 'Graph',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz1Id,
        questionText: 'What is the solution to the recurrence relation T(N) = 2T(N/2) + O(N) according to the Master Theorem?',
        optionA: 'O(N)',
        optionB: 'O(N log N)',
        optionC: 'O(N^2)',
        optionD: 'O(log N)',
        correctOption: 'B',
        marks: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz1Id,
        questionText: 'Which sorting algorithm has a guaranteed worst-case time complexity of O(N log N)?',
        optionA: 'Quick Sort',
        optionB: 'Merge Sort',
        optionC: 'Bubble Sort',
        optionD: 'Selection Sort',
        correctOption: 'B',
        marks: 3,
        createdAt: now,
        updatedAt: now
      },

      // Quiz 2 Questions (DSA Trees)
      {
        id: uuidv4(),
        quizId: quiz2Id,
        questionText: 'What is the maximum height of an AVL tree with N nodes?',
        optionA: 'O(N)',
        optionB: 'O(log N)',
        optionC: 'O(sqrt(N))',
        optionD: 'O(N log N)',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz2Id,
        questionText: 'Which traversal of a Binary Search Tree produces elements in sorted ascending order?',
        optionA: 'Pre-order',
        optionB: 'In-order',
        optionC: 'Post-order',
        optionD: 'Level-order',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz2Id,
        questionText: 'In an AVL tree, when a node becomes unbalanced with balance factor +2 after an insertion into the left child\'s right subtree, which rotation is required?',
        optionA: 'Single Left Rotation',
        optionB: 'Single Right Rotation',
        optionC: 'Left-Right (LR) Double Rotation',
        optionD: 'Right-Left (RL) Double Rotation',
        correctOption: 'C',
        marks: 3,
        createdAt: now,
        updatedAt: now
      },

      // Quiz 3 Questions (Computer Networks)
      {
        id: uuidv4(),
        quizId: quiz3Id,
        questionText: 'In IPv4 CIDR notation /26, how many usable host addresses are available in the subnet?',
        optionA: '64',
        optionB: '62',
        optionC: '30',
        optionD: '126',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz3Id,
        questionText: 'Which routing protocol is an interior gateway protocol based on Link-State algorithm?',
        optionA: 'RIP',
        optionB: 'OSPF',
        optionC: 'BGP',
        optionD: 'EGP',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz3Id,
        questionText: 'What is the purpose of the 3-Way Handshake in TCP?',
        optionA: 'To encrypt application payload',
        optionB: 'To synchronize sequence numbers and establish connection state',
        optionC: 'To measure round-trip ping time',
        optionD: 'To calculate DNS cache records',
        correctOption: 'B',
        marks: 3,
        createdAt: now,
        updatedAt: now
      },

      // Quiz 4 Questions (Operating Systems)
      {
        id: uuidv4(),
        quizId: quiz4Id,
        questionText: 'What is the primary function of the Translation Lookaside Buffer (TLB)?',
        optionA: 'Disk block cache',
        optionB: 'Hardware cache for fast virtual-to-physical address translation',
        optionC: 'Process priority queue',
        optionD: 'Interrupt vector table',
        correctOption: 'B',
        marks: 2,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        quizId: quiz4Id,
        questionText: 'Which page replacement algorithm suffers from Belady\'s Anomaly?',
        optionA: 'LRU (Least Recently Used)',
        optionB: 'Optimal Page Replacement',
        optionC: 'FIFO (First-In-First-Out)',
        optionD: 'LFU (Least Frequently Used)',
        correctOption: 'C',
        marks: 3,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('questions', null, {});
    await queryInterface.bulkDelete('quizzes', null, {});
    await queryInterface.bulkDelete('subtopics', null, {});
    await queryInterface.bulkDelete('enrollments', null, {});
    await queryInterface.bulkDelete('courses', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
