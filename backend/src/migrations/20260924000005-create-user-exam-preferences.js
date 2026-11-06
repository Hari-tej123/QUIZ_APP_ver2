'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_exam_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      examId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'exams',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('user_exam_preferences', ['userId']);
    await queryInterface.addIndex('user_exam_preferences', ['examId']);
    await queryInterface.addIndex('user_exam_preferences', ['userId', 'examId'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_exam_preferences');
  }
};
