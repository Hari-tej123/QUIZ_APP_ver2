const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('FacultyRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  requestedRole: { type: DataTypes.ENUM('educator', 'faculty'), allowNull: false },
  name: { type: DataTypes.STRING(120), allowNull: false },
  institution: { type: DataTypes.STRING(180), allowNull: false },
  department: { type: DataTypes.STRING(120), allowNull: false },
  employeeId: { type: DataTypes.STRING(120), allowNull: true },
  proofUrl: { type: DataTypes.STRING(500), allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
  reviewedBy: { type: DataTypes.UUID, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  reviewReason: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'faculty_requests',
  timestamps: true,
  indexes: [{ fields: ['status'] }, { fields: ['userId'] }]
});