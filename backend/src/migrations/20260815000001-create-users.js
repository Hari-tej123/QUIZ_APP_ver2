'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.STRING, // Use string for easier migrations, validate on model
        allowNull: false
      },
      department: {
        type: Sequelize.STRING,
        allowNull: true
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      rollNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      mustChangePassword: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active',
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
    await queryInterface.dropTable('users');
  }
};
