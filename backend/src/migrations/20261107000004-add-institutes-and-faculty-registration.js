'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create institutes table if not exists
    await queryInterface.createTable('institutes', {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // 2. Add columns to users table
    const userTable = await queryInterface.describeTable('users');

    if (!userTable.approvalStatus) {
      await queryInterface.addColumn('users', 'approvalStatus', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'APPROVED'
      });
    }

    if (!userTable.designation) {
      await queryInterface.addColumn('users', 'designation', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!userTable.employeeId) {
      await queryInterface.addColumn('users', 'employeeId', {
        type: Sequelize.STRING(120),
        allowNull: true
      });
    }

    if (!userTable.needsRoleSelection) {
      await queryInterface.addColumn('users', 'needsRoleSelection', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    // Add indexes
    await queryInterface.addIndex('institutes', ['code']).catch(() => {});
    await queryInterface.addIndex('users', ['approvalStatus']).catch(() => {});
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('institutes');
    await queryInterface.removeColumn('users', 'approvalStatus').catch(() => {});
    await queryInterface.removeColumn('users', 'designation').catch(() => {});
    await queryInterface.removeColumn('users', 'employeeId').catch(() => {});
    await queryInterface.removeColumn('users', 'needsRoleSelection').catch(() => {});
  }
};

