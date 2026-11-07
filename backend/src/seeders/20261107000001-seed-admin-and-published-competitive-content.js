'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 16) {
      throw new Error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 16 characters before running this seeder.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    const [existingUsers] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE lower(email) = :email LIMIT 1',
      { replacements: { email } }
    );
    if (existingUsers.length) {
      await queryInterface.bulkUpdate('users', {
        name: 'Quizzify Administrator',
        password: passwordHash,
        role: 'ADMIN',
        educatorType: null,
        emailVerified: true,
        status: 'active',
        updatedAt: now
      }, { id: existingUsers[0].id });
    } else {
      await queryInterface.bulkInsert('users', [{
        id: crypto.randomUUID(),
        name: 'Quizzify Administrator',
        email,
        password: passwordHash,
        role: 'ADMIN',
        educatorType: null,
        emailVerified: true,
        mustChangePassword: false,
        status: 'active',
        createdAt: now,
        updatedAt: now
      }]);
    }

    await queryInterface.sequelize.query(`
      UPDATE exams SET category = CASE
        WHEN upper(code) IN ('UPSC', 'IAS', 'STATE_PSC') THEN 'CIVIL_SERVICES'
        WHEN upper(code) IN ('CAT', 'XAT', 'GMAT') THEN 'MANAGEMENT'
        ELSE 'ENGINEERING'
      END, track = 'COMPETITIVE'
    `);
    await queryInterface.sequelize.query(`
      UPDATE quizzes q
      SET status = 'PUBLISHED',
          "isPublished" = true,
          "durationMin" = coalesce("durationMin", duration),
          "publishedAt" = coalesce("publishedAt", NOW())
      WHERE q."examTopicId" IS NOT NULL
        AND EXISTS (SELECT 1 FROM questions question WHERE question."quizId" = q.id)
        AND q.status NOT IN ('PENDING_REVIEW', 'REJECTED', 'ARCHIVED')
    `);
    await queryInterface.sequelize.query(`
      UPDATE questions SET status = 'published', track = 'exam'
      WHERE "quizId" IN (SELECT id FROM quizzes WHERE status = 'PUBLISHED' AND "examTopicId" IS NOT NULL)
    `);
  },

  down: async () => {
    // Keep administrator and published taxonomy data on rollback to avoid locking users out.
  }
};