const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Institute = sequelize.define('Institute', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'institutes',
    timestamps: true
  });

  return Institute;
};

