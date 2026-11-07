const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EducatorInvite', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(254), allowNull: false },
  tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
  educatorType: { type: DataTypes.STRING(20), allowNull: false },
  invitedBy: { type: DataTypes.UUID, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  acceptedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'educator_invites',
  timestamps: true,
  indexes: [{ fields: ['email'] }, { fields: ['expiresAt'] }]
});