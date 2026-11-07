const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EducatorApplication', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  fullName: { type: DataTypes.STRING(120), allowNull: false },
  qualification: { type: DataTypes.STRING(240), allowNull: false },
  experienceYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  subjectsExams: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  institution: { type: DataTypes.STRING(180), allowNull: true },
  proofUrl: { type: DataTypes.STRING(500), allowNull: true },
  proofFilePath: { type: DataTypes.STRING(500), allowNull: true },
  motivation: { type: DataTypes.TEXT, allowNull: false },
  requestedEducatorType: { type: DataTypes.STRING(20), allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
  reviewedBy: { type: DataTypes.UUID, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'educator_applications',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['userId'] },
    { unique: true, fields: ['userId'], where: { status: 'PENDING' } }
  ]
});