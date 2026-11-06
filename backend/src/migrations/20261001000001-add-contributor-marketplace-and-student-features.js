'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Update users table
    // In PostgreSQL, add 'contributor' to enum_users_role if it exists
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
            ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'contributor';
          END IF;
        END$$;
      `);
    } catch (e) {
      console.log('Enum update note:', e.message);
    }

    const userTable = await queryInterface.describeTable('users');
    if (!userTable.contributorStatus && !userTable.contributor_status) {
      await queryInterface.addColumn('users', 'contributorStatus', {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: true,
        defaultValue: null
      });
    }
    if (!userTable.bio) {
      await queryInterface.addColumn('users', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!userTable.credentials) {
      await queryInterface.addColumn('users', 'credentials', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!userTable.subjectExpertise && !userTable.subject_expertise) {
      await queryInterface.addColumn('users', 'subjectExpertise', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    if (!userTable.earningsBalance && !userTable.earnings_balance) {
      await queryInterface.addColumn('users', 'earningsBalance', {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
      });
    }
    if (!userTable.totalEarned && !userTable.total_earned) {
      await queryInterface.addColumn('users', 'totalEarned', {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
      });
    }
    if (!userTable.badge) {
      await queryInterface.addColumn('users', 'badge', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // 2. Update questions table
    const questionTable = await queryInterface.describeTable('questions');
    if (!questionTable.explanation) {
      await queryInterface.addColumn('questions', 'explanation', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!questionTable.difficulty) {
      await queryInterface.addColumn('questions', 'difficulty', {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium',
        allowNull: false
      });
    }
    if (!questionTable.tags) {
      await queryInterface.addColumn('questions', 'tags', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // 3. Update quizzes table
    try {
      await queryInterface.changeColumn('quizzes', 'courseId', {
        type: Sequelize.UUID,
        allowNull: true
      });
      await queryInterface.changeColumn('quizzes', 'subtopicId', {
        type: Sequelize.UUID,
        allowNull: true
      });
    } catch (e) {
      console.log('Quizzes column nullable note:', e.message);
    }

    const quizTable = await queryInterface.describeTable('quizzes');
    if (!quizTable.authorId && !quizTable.author_id) {
      await queryInterface.addColumn('quizzes', 'authorId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    if (!quizTable.status) {
      await queryInterface.addColumn('quizzes', 'status', {
        type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'changes_requested'),
        defaultValue: 'approved',
        allowNull: false
      });
    }
    if (!quizTable.isPublished && !quizTable.is_published) {
      await queryInterface.addColumn('quizzes', 'isPublished', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      });
    }
    if (!quizTable.reviewNotes && !quizTable.review_notes) {
      await queryInterface.addColumn('quizzes', 'reviewNotes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (!quizTable.totalAttempts && !quizTable.total_attempts) {
      await queryInterface.addColumn('quizzes', 'totalAttempts', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
    if (!quizTable.contributorAttribution && !quizTable.contributor_attribution) {
      await queryInterface.addColumn('quizzes', 'contributorAttribution', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // 4. Update quiz_attempts table
    const attemptTable = await queryInterface.describeTable('quiz_attempts');
    if (!attemptTable.mode) {
      await queryInterface.addColumn('quiz_attempts', 'mode', {
        type: Sequelize.ENUM('mock', 'practice'),
        defaultValue: 'mock',
        allowNull: false
      });
    }
    if (!attemptTable.timeSpentSeconds && !attemptTable.time_spent_seconds) {
      await queryInterface.addColumn('quiz_attempts', 'timeSpentSeconds', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
    if (!attemptTable.totalQuestions && !attemptTable.total_questions) {
      await queryInterface.addColumn('quiz_attempts', 'totalQuestions', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
    if (!attemptTable.correctAnswers && !attemptTable.correct_answers) {
      await queryInterface.addColumn('quiz_attempts', 'correctAnswers', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
    if (!attemptTable.incorrectAnswers && !attemptTable.incorrect_answers) {
      await queryInterface.addColumn('quiz_attempts', 'incorrectAnswers', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
    if (!attemptTable.skippedAnswers && !attemptTable.skipped_answers) {
      await queryInterface.addColumn('quiz_attempts', 'skippedAnswers', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }

    // 5. Create study_materials table
    await queryInterface.createTable('study_materials', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('pdf', 'note', 'video'),
        allowNull: false,
        defaultValue: 'note'
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      videoUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      courseId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'courses', key: 'id' },
        onDelete: 'CASCADE'
      },
      subtopicId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'subtopics', key: 'id' },
        onDelete: 'CASCADE'
      },
      examId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exams', key: 'id' },
        onDelete: 'CASCADE'
      },
      examEditionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exam_editions', key: 'id' },
        onDelete: 'CASCADE'
      },
      examSubjectId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exam_subjects', key: 'id' },
        onDelete: 'CASCADE'
      },
      examTopicId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'exam_topics', key: 'id' },
        onDelete: 'CASCADE'
      },
      authorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'changes_requested'),
        defaultValue: 'approved',
        allowNull: false
      },
      reviewNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      downloadsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 6. Create content_submissions table
    await queryInterface.createTable('content_submissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      contributorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      contentType: {
        type: Sequelize.ENUM('quiz', 'study_material'),
        allowNull: false
      },
      quizId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'quizzes', key: 'id' },
        onDelete: 'SET NULL'
      },
      materialId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'study_materials', key: 'id' },
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      trackType: {
        type: Sequelize.ENUM('competitive', 'college'),
        allowNull: false,
        defaultValue: 'competitive'
      },
      targetDetails: {
        type: Sequelize.TEXT, // JSON serialized details
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'changes_requested'),
        defaultValue: 'pending',
        allowNull: false
      },
      adminFeedback: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      payoutAmount: {
        type: Sequelize.DOUBLE,
        defaultValue: 0.0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 7. Create payouts table
    await queryInterface.createTable('payouts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      contributorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('bounty_quiz', 'revenue_share', 'withdrawal'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'completed', 'rejected'),
        defaultValue: 'completed',
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentDetails: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      referenceId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 8. Create platform_settings table
    await queryInterface.createTable('platform_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 9. Create student_question_records table
    await queryInterface.createTable('student_question_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      studentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      questionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'questions', key: 'id' },
        onDelete: 'CASCADE'
      },
      quizId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'quizzes', key: 'id' },
        onDelete: 'SET NULL'
      },
      isBookmarked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isMistake: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      mistakeCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lastSelectedOption: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for high-speed queries
    await queryInterface.addIndex('student_question_records', ['studentId', 'questionId'], { unique: true });
    await queryInterface.addIndex('student_question_records', ['studentId', 'isBookmarked']);
    await queryInterface.addIndex('student_question_records', ['studentId', 'isMistake']);
    await queryInterface.addIndex('study_materials', ['examTopicId']);
    await queryInterface.addIndex('study_materials', ['subtopicId']);
    await queryInterface.addIndex('content_submissions', ['contributorId']);
    await queryInterface.addIndex('content_submissions', ['status']);
    await queryInterface.addIndex('payouts', ['contributorId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('student_question_records');
    await queryInterface.dropTable('payouts');
    await queryInterface.dropTable('content_submissions');
    await queryInterface.dropTable('study_materials');
    await queryInterface.dropTable('platform_settings');
  }
};
