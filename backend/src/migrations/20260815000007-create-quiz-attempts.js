'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quiz_attempts', {
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
      studentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      attemptNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      submitTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      score: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0.0
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'in-progress'
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
    await queryInterface.dropTable('quiz_attempts');
  }
};
