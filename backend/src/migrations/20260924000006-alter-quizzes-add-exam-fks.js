'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add nullable FK columns to quizzes so a quiz can optionally belong to the exam hierarchy
    await queryInterface.addColumn('quizzes', 'examEditionId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'exam_editions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('quizzes', 'examSubjectId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'exam_subjects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('quizzes', 'examTopicId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'exam_topics',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes on the new FK columns
    await queryInterface.addIndex('quizzes', ['examEditionId']);
    await queryInterface.addIndex('quizzes', ['examSubjectId']);
    await queryInterface.addIndex('quizzes', ['examTopicId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('quizzes', ['examEditionId']);
    await queryInterface.removeIndex('quizzes', ['examSubjectId']);
    await queryInterface.removeIndex('quizzes', ['examTopicId']);
    await queryInterface.removeColumn('quizzes', 'examEditionId');
    await queryInterface.removeColumn('quizzes', 'examSubjectId');
    await queryInterface.removeColumn('quizzes', 'examTopicId');
  }
};
