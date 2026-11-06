'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('questions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      quizId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'quizzes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      questionText: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      optionA: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      optionB: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      optionC: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      optionD: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      correctOption: {
        type: Sequelize.STRING, // Store as string, validate A, B, C, D in model
        allowNull: false
      },
      marks: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('questions');
  }
};
