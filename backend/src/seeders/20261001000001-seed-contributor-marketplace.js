'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const hashedPassword = await bcrypt.hash('password123', 10);

    const contributor1Id = 'cc111111-1111-1111-1111-111111111111';
    const contributor2Id = 'cc222222-2222-2222-2222-222222222222';
    const contributor3Id = 'cc333333-3333-3333-3333-333333333333';

    // 1. Seed Contributors
    await queryInterface.bulkInsert('users', [
      {
        id: contributor1Id,
        name: 'Prof. Rajesh Sharma',
        email: 'contributor1@quizapp.com',
        password: hashedPassword,
        role: 'contributor',
        contributorStatus: 'approved',
        badge: 'Verified Educator',
        bio: 'Ex-IIT Kharagpur Faculty & 12+ years coaching top AIR rankers in GATE CSE and Algorithms.',
        credentials: 'M.Tech CSE (IIT Kharagpur), Author of "Algorithmic Paradigms for GATE"',
        subjectExpertise: 'Computer Science, Algorithms, Discrete Maths',
        phone: '+91 98765 43210',
        earningsBalance: 125.50,
        totalEarned: 350.00,
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: contributor2Id,
        name: 'Dr. Ananya Roy',
        email: 'contributor2@quizapp.com',
        password: hashedPassword,
        role: 'contributor',
        contributorStatus: 'approved',
        badge: 'Verified Educator',
        bio: 'Senior Physics Coach for JEE Advanced & Olympiads with over 15 years of teaching experience.',
        credentials: 'Ph.D. in Applied Physics, Gold Medalist, Top JEE Coach',
        subjectExpertise: 'Physics, Mechanics, Electrostatics',
        phone: '+91 98111 22233',
        earningsBalance: 90.00,
        totalEarned: 240.00,
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      },
      {
        id: contributor3Id,
        name: 'Coach Vikram Patel',
        email: 'contributor3@quizapp.com',
        password: hashedPassword,
        role: 'contributor',
        contributorStatus: 'pending',
        badge: null,
        bio: 'Quantitative Aptitude and Logical Reasoning Mentor for CAT & MBA Entrances.',
        credentials: 'MBA (IIM Indore), CAT 99.8%iler',
        subjectExpertise: 'Quantitative Aptitude, Data Interpretation',
        phone: '+91 98999 88877',
        earningsBalance: 0.0,
        totalEarned: 0.0,
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // 2. Seed Platform Settings
    await queryInterface.bulkInsert('platform_settings', [
      {
        id: 'ba111111-1111-1111-1111-111111111111',
        key: 'flat_fee_per_quiz',
        value: '15.00',
        description: 'Flat bounty payout for every approved question set',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'ba222222-2222-2222-2222-222222222222',
        key: 'rev_share_per_attempt',
        value: '0.10',
        description: 'Revenue share credited per completed student quiz attempt',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'ba333333-3333-3333-3333-333333333333',
        key: 'min_withdrawal',
        value: '20.00',
        description: 'Minimum balance required to request a payout withdrawal',
        createdAt: now,
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // 3. Seed Study Materials
    const material1Id = 'da111111-1111-1111-1111-111111111111';
    const material2Id = 'da222222-2222-2222-2222-222222222222';
    const material3Id = 'da333333-3333-3333-3333-333333333333';
    const material4Id = 'da444444-4444-4444-4444-444444444444';

    const gateTopic2Id = 'ed222222-2222-2222-2222-222222222222'; // Algorithms & Complexity
    const jeeTopic1Id = 'ed444444-4444-4444-4444-444444444444'; // Mechanics & Kinematics

    await queryInterface.bulkInsert('study_materials', [
      {
        id: material1Id,
        title: 'Complete Masterclass: Master Theorem & Recurrence Relations',
        description: 'Comprehensive notes with 15 solved GATE past-year recurrence problems using Master Theorem and substitution methods.',
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=0hWbAadg-K4',
        fileUrl: null,
        content: `### Master Theorem Summary\n\nFor recurrences of the form:\n$$T(n) = aT(n/b) + f(n)$$\nwhere $a \\ge 1$ and $b > 1$.\n\n1. If $f(n) = O(n^{\\log_b a - \\epsilon})$, then $T(n) = \\Theta(n^{\\log_b a})$.\n2. If $f(n) = \\Theta(n^{\\log_b a} \\log^k n)$, then $T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$.\n3. If $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$, then $T(n) = \\Theta(f(n))$.`,
        examTopicId: gateTopic2Id,
        authorId: contributor1Id,
        status: 'approved',
        reviewNotes: 'High quality notes with clear examples.',
        downloadsCount: 142,
        createdAt: now,
        updatedAt: now
      },
      {
        id: material2Id,
        title: 'Dynamic Programming vs Greedy Paradigms Handout',
        description: 'A curated comparison sheet of standard DP problems (0/1 Knapsack, LCS, Matrix Chain) vs greedy strategies.',
        type: 'pdf',
        videoUrl: null,
        fileUrl: '/uploads/sample-algorithms-handout.pdf',
        content: 'Summary cheat-sheet for Dynamic Programming optimal substructure and overlapping subproblems property.',
        examTopicId: gateTopic2Id,
        authorId: contributor1Id,
        status: 'approved',
        reviewNotes: 'Approved for GATE CS learners.',
        downloadsCount: 89,
        createdAt: now,
        updatedAt: now
      },
      {
        id: material3Id,
        title: 'Newtonian Kinematics & Projectile Motion Formulas Sheet',
        description: 'Formulas and short-cuts for 2D projectile motion on inclined planes, relative velocity vectors, and constraint relations.',
        type: 'note',
        videoUrl: null,
        fileUrl: null,
        content: `### Key Kinematic Formulae for JEE\n\n1. Trajectory Equation: $y = x \\tan\\theta - \\frac{g x^2}{2 u^2 \\cos^2\\theta}$\n2. Time of Flight: $T = \\frac{2 u \\sin\\theta}{g}$\n3. Max Height: $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n4. Range: $R = \\frac{u^2 \\sin(2\\theta)}{g}$`,
        examTopicId: jeeTopic1Id,
        authorId: contributor2Id,
        status: 'approved',
        reviewNotes: 'Verified formula sheet.',
        downloadsCount: 215,
        createdAt: now,
        updatedAt: now
      },
      {
        id: material4Id,
        title: 'Rotational Dynamics Visual Video Walkthrough',
        description: 'Deep-dive into moment of inertia tensors, parallel axis theorem, and pure rolling conditions without slipping.',
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=kYUP2YpP508',
        fileUrl: null,
        content: 'Detailed explanation of torque, angular momentum conservation, and rolling with friction.',
        examTopicId: jeeTopic1Id,
        authorId: contributor2Id,
        status: 'approved',
        reviewNotes: 'Excellent walkthrough for advanced students.',
        downloadsCount: 178,
        createdAt: now,
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // 4. Seed Contributor Quizzes
    const contribQuiz1Id = 'cb111111-1111-1111-1111-111111111111';
    const contribQuiz2Id = 'cb222222-2222-2222-2222-222222222222';

    await queryInterface.bulkInsert('quizzes', [
      {
        id: contribQuiz1Id,
        title: 'Asymptotic Analysis & Recurrences Challenge (GATE Special)',
        description: '10 challenging practice questions authored by Prof. Rajesh Sharma testing asymptotic bounds and master theorem edge cases.',
        duration: 15,
        maxAttempts: null,
        authorId: contributor1Id,
        status: 'approved',
        isPublished: true,
        totalAttempts: 34,
        contributorAttribution: 'Prof. Rajesh Sharma (Verified Educator)',
        examTopicId: gateTopic2Id,
        createdAt: now,
        updatedAt: now
      },
      {
        id: contribQuiz2Id,
        title: 'Graph Traversal & Shortest Path Drill',
        description: 'Pending submission covering Dijkstra, Bellman-Ford, and Topological Sorting.',
        duration: 20,
        maxAttempts: null,
        authorId: contributor1Id,
        status: 'pending',
        isPublished: false,
        totalAttempts: 0,
        contributorAttribution: 'Prof. Rajesh Sharma (Verified Educator)',
        examTopicId: gateTopic2Id,
        createdAt: now,
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // Questions for Contributor Quiz 1
    await queryInterface.bulkInsert('questions', [
      {
        id: 'cd111111-1111-1111-1111-111111111111',
        quizId: contribQuiz1Id,
        questionText: 'What is the solution of the recurrence relation T(n) = 2T(n/2) + n / log(n)?',
        optionA: 'Θ(n)',
        optionB: 'Θ(n log log n)',
        optionC: 'Θ(n log n)',
        optionD: 'Θ(n²)',
        correctOption: 'B',
        marks: 2,
        explanation: 'By applying the extended Master theorem or the recursion tree method: T(n) = n * sum(1 / (log n - i)) which sums to n * log(log n). Hence Θ(n log log n).',
        difficulty: 'hard',
        tags: 'Recurrences, Master Theorem, GATE CS',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cd222222-2222-2222-2222-222222222222',
        quizId: contribQuiz1Id,
        questionText: 'Which of the following tight bounds is correct for: f(n) = 2^(log₂ n) and g(n) = n?',
        optionA: 'f(n) = o(g(n))',
        optionB: 'f(n) = ω(g(n))',
        optionC: 'f(n) = Θ(g(n))',
        optionD: 'f(n) and g(n) cannot be asymptotically compared',
        correctOption: 'C',
        marks: 1,
        explanation: 'By logarithm identity, 2^(log₂ n) = n. Therefore, f(n) = n, which is strictly identical to g(n) = n, so f(n) = Θ(g(n)).',
        difficulty: 'easy',
        tags: 'Asymptotics, Logarithms',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cd333333-3333-3333-3333-333333333333',
        quizId: contribQuiz1Id,
        questionText: 'Given an array of n integers, what is the minimum number of comparisons needed to find both the maximum and minimum elements simultaneously?',
        optionA: '2n - 2',
        optionB: '⌈3n/2⌉ - 2',
        optionC: 'n log n',
        optionD: 'n - 1',
        correctOption: 'B',
        marks: 2,
        explanation: 'By comparing elements in pairs (1 comparison per pair) and then comparing the smaller with current min and larger with current max, the total comparisons is 3n/2 - 2 for even n.',
        difficulty: 'medium',
        tags: 'Algorithms, Comparisons, Sorting',
        createdAt: now,
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // 5. Seed Content Submissions for Review Queue
    await queryInterface.bulkInsert('content_submissions', [
      {
        id: 'ca111111-1111-1111-1111-111111111111',
        contributorId: contributor1Id,
        contentType: 'quiz',
        quizId: contribQuiz2Id,
        title: 'Graph Traversal & Shortest Path Drill',
        trackType: 'competitive',
        targetDetails: JSON.stringify({
          duration: 20,
          questionCount: 5,
          examName: 'GATE',
          subjectName: 'Computer Science',
          topicName: 'Algorithms & Complexity'
        }),
        status: 'pending',
        adminFeedback: null,
        payoutAmount: 0.0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'ca222222-2222-2222-2222-222222222222',
        contributorId: contributor1Id,
        contentType: 'quiz',
        quizId: contribQuiz1Id,
        title: 'Asymptotic Analysis & Recurrences Challenge (GATE Special)',
        trackType: 'competitive',
        targetDetails: JSON.stringify({
          duration: 15,
          questionCount: 3,
          examName: 'GATE',
          topicName: 'Algorithms & Complexity'
        }),
        status: 'approved',
        adminFeedback: 'Excellent questions with clear explanations. Approved for students.',
        payoutAmount: 15.00,
        createdAt: new Date(Date.now() - 3 * 86400000),
        updatedAt: now
      }
    ], { ignoreDuplicates: true });

    // 6. Seed Payouts
    await queryInterface.bulkInsert('payouts', [
      {
        id: 'ce111111-1111-1111-1111-111111111111',
        contributorId: contributor1Id,
        amount: 15.00,
        type: 'bounty_quiz',
        status: 'completed',
        paymentMethod: 'Platform Bounty',
        referenceId: 'SUB-ca222222',
        notes: 'Bounty for approved quiz: Asymptotic Analysis & Recurrences Challenge',
        processedAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'ce222222-2222-2222-2222-222222222222',
        contributorId: contributor1Id,
        amount: 3.40,
        type: 'revenue_share',
        status: 'completed',
        paymentMethod: 'RevShare',
        referenceId: 'REV-batch-01',
        notes: 'Revenue share from 34 student quiz completions',
        processedAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'ce333333-3333-3333-3333-333333333333',
        contributorId: contributor1Id,
        amount: 100.00,
        type: 'withdrawal',
        status: 'completed',
        paymentMethod: 'Razorpay UPI',
        referenceId: 'PAY-RZP-9842187',
        notes: 'Payout processed to rajesh.sharma@okaxis',
        processedAt: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: now
      }
    ], { ignoreDuplicates: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('payouts', null, {});
    await queryInterface.bulkDelete('content_submissions', null, {});
    await queryInterface.bulkDelete('study_materials', null, {});
    await queryInterface.bulkDelete('platform_settings', null, {});
  }
};
