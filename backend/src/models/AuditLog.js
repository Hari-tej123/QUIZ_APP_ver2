const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  actorId: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(80), allowNull: false },
  targetId: { type: DataTypes.UUID, allowNull: true },
  targetType: { type: DataTypes.STRING(80), allowNull: false },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['actorId'] }, { fields: ['targetId'] }, { fields: ['createdAt'] }]
});