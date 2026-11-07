'use strict';

const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some(table => {
    const name = typeof table === 'string' ? table : table.tableName || table.table_name;
    return String(name).toLowerCase() === tableName.toLowerCase();
  });
};

const columnExists = async (queryInterface, tableName, columnName) => {
  const columns = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(columns, columnName);
};

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  if (!(await columnExists(queryInterface, tableName, columnName))) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

const addIndexIfMissing = async (queryInterface, tableName, fields, options = {}) => {
  const indexes = await queryInterface.showIndex(tableName);
  const expected = fields.join(',');
  const exists = indexes.some(index => index.name === options.name ||
    index.fields.map(field => field.attribute || field.name).join(',') === expected);
  if (!exists) await queryInterface.addIndex(tableName, fields, options);
};

const createTableIfMissing = async (queryInterface, tableName, columns) => {
  if (!(await tableExists(queryInterface, tableName))) {
    await queryInterface.createTable(tableName, columns);
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'password', { type: Sequelize.STRING, allowNull: true });
    await addColumnIfMissing(queryInterface, 'users', 'googleId', { type: Sequelize.STRING, allowNull: true });
    await addColumnIfMissing(queryInterface, 'users', 'emailVerified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addIndexIfMissing(queryInterface, 'users', ['googleId'], { unique: true, name: 'users_google_id_unique' });
    await addIndexIfMissing(queryInterface, 'users', ['role'], { name: 'users_role_idx' });
    await addIndexIfMissing(queryInterface, 'users', ['status'], { name: 'users_status_idx' });

    await createTableIfMissing(queryInterface, 'faculty_requests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      requestedRole: { type: Sequelize.STRING(20), allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      institution: { type: Sequelize.STRING(180), allowNull: false },
      department: { type: Sequelize.STRING(120), allowNull: false },
      employeeId: { type: Sequelize.STRING(120), allowNull: true },
      proofUrl: { type: Sequelize.STRING(500), allowNull: true },
      reason: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
      reviewedBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      reviewReason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await addIndexIfMissing(queryInterface, 'faculty_requests', ['status']);
    await addIndexIfMissing(queryInterface, 'faculty_requests', ['userId']);

    await createTableIfMissing(queryInterface, 'audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      actorId: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      action: { type: Sequelize.STRING(80), allowNull: false },
      targetId: { type: Sequelize.UUID, allowNull: true },
      targetType: { type: Sequelize.STRING(80), allowNull: false },
      metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await addIndexIfMissing(queryInterface, 'audit_logs', ['actorId']);
    await addIndexIfMissing(queryInterface, 'audit_logs', ['targetId']);
    await addIndexIfMissing(queryInterface, 'audit_logs', ['createdAt']);

    await createTableIfMissing(queryInterface, 'notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      title: { type: Sequelize.STRING(160), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      readAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await addIndexIfMissing(queryInterface, 'notifications', ['userId', 'readAt']);

    await queryInterface.changeColumn('questions', 'quizId', { type: Sequelize.UUID, allowNull: true });
    for (const field of ['optionA', 'optionB', 'optionC', 'optionD', 'correctOption']) {
      await queryInterface.changeColumn('questions', field, {
        type: field === 'correctOption' ? Sequelize.STRING : Sequelize.TEXT,
        allowNull: true
      });
    }
    await addColumnIfMissing(queryInterface, 'questions', 'questionType', { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'mcq' });
    await addColumnIfMissing(queryInterface, 'questions', 'options', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
    await addColumnIfMissing(queryInterface, 'questions', 'correctAnswers', { type: Sequelize.JSONB, allowNull: false, defaultValue: [] });
    await addColumnIfMissing(queryInterface, 'questions', 'subject', { type: Sequelize.STRING(120), allowNull: true });
    await addColumnIfMissing(queryInterface, 'questions', 'topic', { type: Sequelize.STRING(120), allowNull: true });
    await addColumnIfMissing(queryInterface, 'questions', 'track', { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'competitive' });
    await addColumnIfMissing(queryInterface, 'questions', 'status', { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'published' });
    await addColumnIfMissing(queryInterface, 'questions', 'createdBy', { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' });
    await addColumnIfMissing(queryInterface, 'questions', 'imageUrl', { type: Sequelize.STRING(500), allowNull: true });
    await queryInterface.sequelize.query(`
      UPDATE questions
      SET options = jsonb_build_array("optionA", "optionB", "optionC", "optionD"),
          "correctAnswers" = CASE WHEN "correctOption" IS NULL THEN '[]'::jsonb ELSE jsonb_build_array("correctOption") END
    `);
    await queryInterface.sequelize.query(`
      UPDATE questions q SET track = CASE WHEN quizzes."examTopicId" IS NOT NULL THEN 'exam' WHEN quizzes."courseId" IS NOT NULL THEN 'college' ELSE 'competitive' END
      FROM quizzes WHERE q."quizId" = quizzes.id
    `);
    await addIndexIfMissing(queryInterface, 'questions', ['track']);
    await addIndexIfMissing(queryInterface, 'questions', ['createdBy']);
    await addIndexIfMissing(queryInterface, 'questions', ['status']);

    await addColumnIfMissing(queryInterface, 'quiz_attempts', 'questionOrder', { type: Sequelize.JSONB, allowNull: true });
    await queryInterface.changeColumn('attempt_answers', 'selectedOption', { type: Sequelize.STRING(500), allowNull: false });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('attempt_answers', 'selectedOption', {
      type: Sequelize.ENUM('A', 'B', 'C', 'D'), allowNull: false
    });
    await queryInterface.removeColumn('quiz_attempts', 'questionOrder');
    for (const field of ['imageUrl', 'createdBy', 'status', 'track', 'topic', 'subject', 'correctAnswers', 'options', 'questionType']) {
      await queryInterface.removeColumn('questions', field);
    }
    for (const field of ['optionA', 'optionB', 'optionC', 'optionD', 'correctOption']) {
      await queryInterface.changeColumn('questions', field, {
        type: field === 'correctOption' ? Sequelize.STRING : Sequelize.TEXT,
        allowNull: false
      });
    }
    await queryInterface.changeColumn('questions', 'quizId', { type: Sequelize.UUID, allowNull: false });
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('faculty_requests');
    await queryInterface.removeIndex('users', 'users_status_idx');
    await queryInterface.removeIndex('users', 'users_role_idx');
    await queryInterface.removeIndex('users', 'users_google_id_unique');
    await queryInterface.removeColumn('users', 'emailVerified');
    await queryInterface.removeColumn('users', 'googleId');
    await queryInterface.changeColumn('users', 'password', { type: Sequelize.STRING, allowNull: false });
  }
};