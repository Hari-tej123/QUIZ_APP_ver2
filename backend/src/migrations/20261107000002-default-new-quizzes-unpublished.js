'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TABLE quizzes ALTER COLUMN "isPublished" SET DEFAULT false');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TABLE quizzes ALTER COLUMN "isPublished" SET DEFAULT true');
  }
};