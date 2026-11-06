const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlatformSetting = sequelize.define('PlatformSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'platform_settings',
    timestamps: true
  });

  return PlatformSetting;
};
