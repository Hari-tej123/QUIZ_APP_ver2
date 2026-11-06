'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('attempt_answers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      attemptId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'quiz_attempts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      questionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      selectedOption: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      marksObtained: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    // Add unique constraint on attemptId and questionId combination
    await queryInterface.addIndex('attempt_answers', ['attemptId', 'questionId'], {
      unique: true,
      name: 'attempt_answers_attempt_question_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('attempt_answers');
  }
};
