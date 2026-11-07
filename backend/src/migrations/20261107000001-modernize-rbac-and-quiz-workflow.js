'use strict';

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  const columns = await queryInterface.describeTable(tableName);
  if (!Object.prototype.hasOwnProperty.call(columns, columnName)) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await addColumnIfMissing(queryInterface, 'users', 'educatorType', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.sequelize.query(`
      UPDATE users
      SET role = CASE
        WHEN lower(role) = 'admin' THEN 'ADMIN'
        WHEN lower(role) = 'faculty' THEN 'EDUCATOR'
        WHEN lower(role) = 'educator' THEN 'EDUCATOR'
        WHEN lower(role) = 'contributor' AND lower(coalesce("contributorStatus"::text, '')) = 'approved' THEN 'EDUCATOR'
        ELSE 'STUDENT'
      END,
      "educatorType" = CASE
        WHEN lower(role) = 'faculty' THEN 'COLLEGE'
        WHEN lower(role) IN ('educator', 'contributor') AND lower(coalesce("contributorStatus"::text, '')) = 'approved' THEN 'COMPETITIVE'
        ELSE NULL
      END
    `);
    await queryInterface.addIndex('users', ['role'], { name: 'users_canonical_role_idx' });

    await addColumnIfMissing(queryInterface, 'exams', 'category', {
      type: Sequelize.STRING(40),
      allowNull: false,
      defaultValue: 'ENGINEERING'
    });
    await addColumnIfMissing(queryInterface, 'exams', 'track', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'COMPETITIVE'
    });
    await queryInterface.sequelize.query(`
      UPDATE exams SET category = CASE
        WHEN upper(code) IN ('UPSC', 'IAS', 'STATE_PSC') THEN 'CIVIL_SERVICES'
        WHEN upper(code) IN ('CAT', 'XAT', 'GMAT') THEN 'MANAGEMENT'
        ELSE 'ENGINEERING'
      END, track = 'COMPETITIVE'
    `);
    await queryInterface.addIndex('exams', ['track', 'category'], { name: 'exams_track_category_idx' });

    await queryInterface.sequelize.query(`
      ALTER TABLE quizzes ALTER COLUMN status TYPE VARCHAR(30) USING status::text;
      ALTER TABLE quizzes ALTER COLUMN status SET DEFAULT 'DRAFT';
      ALTER TABLE quizzes ALTER COLUMN "isPublished" SET DEFAULT false;
    `);
    await addColumnIfMissing(queryInterface, 'quizzes', 'ownerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await addColumnIfMissing(queryInterface, 'quizzes', 'durationMin', { type: Sequelize.INTEGER, allowNull: true });
    await addColumnIfMissing(queryInterface, 'quizzes', 'rejectionReason', { type: Sequelize.TEXT, allowNull: true });
    await addColumnIfMissing(queryInterface, 'quizzes', 'publishedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await addColumnIfMissing(queryInterface, 'quizzes', 'publishedAt', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.sequelize.query(`
      UPDATE quizzes q
      SET "ownerId" = coalesce(q."authorId", c."facultyId"),
          "durationMin" = q.duration,
          status = CASE
            WHEN lower(q.status) = 'approved' AND q."isPublished" = true THEN 'PUBLISHED'
            WHEN lower(q.status) IN ('pending', 'pending_review') THEN 'PENDING_REVIEW'
            WHEN lower(q.status) = 'rejected' THEN 'REJECTED'
            ELSE 'DRAFT'
          END
      FROM courses c
      WHERE q."courseId" = c.id AND (q."ownerId" IS NULL OR q."durationMin" IS NULL)
    `);
    await queryInterface.sequelize.query(`
      UPDATE quizzes q
      SET "ownerId" = coalesce(q."ownerId", q."authorId"),
          "durationMin" = coalesce(q."durationMin", q.duration),
          status = CASE
            WHEN lower(q.status) = 'approved' AND q."isPublished" = true THEN 'PUBLISHED'
            WHEN lower(q.status) IN ('pending', 'pending_review') THEN 'PENDING_REVIEW'
            WHEN lower(q.status) = 'rejected' THEN 'REJECTED'
            ELSE 'DRAFT'
          END
    `);
    await queryInterface.sequelize.query(`
      UPDATE quizzes SET "isPublished" = (status = 'PUBLISHED')
    `);
    await queryInterface.changeColumn('quizzes', 'durationMin', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 15
    });
    await queryInterface.addIndex('quizzes', ['ownerId'], { name: 'quizzes_owner_id_idx' });
    await queryInterface.addIndex('quizzes', ['status'], { name: 'quizzes_workflow_status_idx' });

    await queryInterface.createTable('educator_applications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      fullName: { type: Sequelize.STRING(120), allowNull: false },
      qualification: { type: Sequelize.STRING(240), allowNull: false },
      experienceYears: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      subjectsExams: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      institution: { type: Sequelize.STRING(180), allowNull: true },
      proofUrl: { type: Sequelize.STRING(500), allowNull: true },
      proofFilePath: { type: Sequelize.STRING(500), allowNull: true },
      motivation: { type: Sequelize.TEXT, allowNull: false },
      requestedEducatorType: { type: Sequelize.STRING(20), allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'PENDING' },
      reviewedBy: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      rejectionReason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('educator_applications', ['status'], { name: 'educator_applications_status_idx' });
    await queryInterface.addIndex('educator_applications', ['userId', 'status'], {
      name: 'educator_applications_one_pending_per_user_idx',
      unique: true,
      where: { status: 'PENDING' }
    });

    await queryInterface.createTable('educator_invites', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      email: { type: Sequelize.STRING(254), allowNull: false },
      tokenHash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
      educatorType: { type: Sequelize.STRING(20), allowNull: false },
      invitedBy: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      acceptedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('educator_invites', ['email']);
    await queryInterface.addIndex('educator_invites', ['expiresAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('educator_invites');
    await queryInterface.dropTable('educator_applications');
    await queryInterface.removeIndex('quizzes', 'quizzes_workflow_status_idx');
    await queryInterface.removeIndex('quizzes', 'quizzes_owner_id_idx');
    await queryInterface.removeColumn('quizzes', 'publishedAt');
    await queryInterface.removeColumn('quizzes', 'publishedBy');
    await queryInterface.removeColumn('quizzes', 'rejectionReason');
    await queryInterface.removeColumn('quizzes', 'durationMin');
    await queryInterface.removeColumn('quizzes', 'ownerId');
    await queryInterface.sequelize.query(`
      UPDATE quizzes SET status = CASE
        WHEN status = 'PUBLISHED' THEN 'approved'
        WHEN status = 'PENDING_REVIEW' THEN 'pending'
        WHEN status = 'REJECTED' THEN 'rejected'
        ELSE 'draft'
      END
    `);
    await queryInterface.sequelize.query(`ALTER TABLE quizzes ALTER COLUMN status TYPE VARCHAR(30) USING status::text`);
    await queryInterface.removeIndex('exams', 'exams_track_category_idx');
    await queryInterface.removeColumn('exams', 'track');
    await queryInterface.removeColumn('exams', 'category');
    await queryInterface.removeIndex('users', 'users_canonical_role_idx');
    await queryInterface.removeColumn('users', 'educatorType');
    await queryInterface.sequelize.query(`
      UPDATE users SET role = CASE
        WHEN role = 'ADMIN' THEN 'admin'
        WHEN role = 'EDUCATOR' THEN 'contributor'
        ELSE 'student'
      END
    `);
  }
};