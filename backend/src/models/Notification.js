const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(160), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  readAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [{ fields: ['userId', 'readAt'] }]
});