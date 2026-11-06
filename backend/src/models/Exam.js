const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exam = sequelize.define('Exam', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'exams',
    timestamps: true
  });

  return Exam;
};
