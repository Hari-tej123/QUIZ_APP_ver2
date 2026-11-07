'use strict';

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const columns = await queryInterface.describeTable(tableName);
  if (!Object.prototype.hasOwnProperty.call(columns, columnName)) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. users: instituteId
    await addColumnIfMissing(queryInterface, 'users', 'instituteId', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // 2. courses: instituteId
    await addColumnIfMissing(queryInterface, 'courses', 'instituteId', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // 3. quizzes: track, examId, instituteId
    await addColumnIfMissing(queryInterface, 'quizzes', 'track', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'COMPETITIVE'
    });
    await addColumnIfMissing(queryInterface, 'quizzes', 'examId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'exams', key: 'id' },
      onDelete: 'SET NULL'
    });
    await addColumnIfMissing(queryInterface, 'quizzes', 'instituteId', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Backfill quiz track based on courseId / examEditionId
    await queryInterface.sequelize.query(`
      UPDATE quizzes
      SET track = CASE
        WHEN "courseId" IS NOT NULL THEN 'COLLEGE'
        ELSE 'COMPETITIVE'
      END
    `);

    // Backfill quiz examId from exam_editions if examEditionId is set
    await queryInterface.sequelize.query(`
      UPDATE quizzes q
      SET "examId" = e."examId"
      FROM exam_editions e
      WHERE q."examEditionId" = e.id AND q."examId" IS NULL
    `);

    // 4. questions: track update and examId, instituteId, courseId
    await addColumnIfMissing(queryInterface, 'questions', 'examId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'exams', key: 'id' },
      onDelete: 'SET NULL'
    });
    await addColumnIfMissing(queryInterface, 'questions', 'courseId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'courses', key: 'id' },
      onDelete: 'SET NULL'
    });
    await addColumnIfMissing(queryInterface, 'questions', 'instituteId', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    // Normalize question track enum/values to COLLEGE / COMPETITIVE
    await queryInterface.sequelize.query(`
      UPDATE questions
      SET track = CASE
        WHEN lower(track) IN ('college') THEN 'COLLEGE'
        ELSE 'COMPETITIVE'
      END
    `);

    // Add indexes for efficient queries
    try {
      await queryInterface.addIndex('quizzes', ['track'], { name: 'quizzes_track_idx' });
      await queryInterface.addIndex('quizzes', ['examId'], { name: 'quizzes_exam_id_idx' });
      await queryInterface.addIndex('quizzes', ['courseId'], { name: 'quizzes_course_id_idx' });
      await queryInterface.addIndex('quizzes', ['instituteId'], { name: 'quizzes_institute_id_idx' });
      await queryInterface.addIndex('questions', ['track'], { name: 'questions_track_idx' });
      await queryInterface.addIndex('questions', ['examId'], { name: 'questions_exam_id_idx' });
      await queryInterface.addIndex('questions', ['courseId'], { name: 'questions_course_id_idx' });
      await queryInterface.addIndex('courses', ['instituteId'], { name: 'courses_institute_id_idx' });
      await queryInterface.addIndex('users', ['instituteId'], { name: 'users_institute_id_idx' });
    } catch (e) {
      console.log('Index creation notice:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // optional down
  }
};

