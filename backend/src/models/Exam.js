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
    category: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'ENGINEERING',
      validate: { isIn: [['ENGINEERING', 'CIVIL_SERVICES', 'MANAGEMENT', 'MEDICAL', 'OTHER']] }
    },
    track: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'COMPETITIVE',
      validate: { isIn: [['COMPETITIVE', 'COLLEGE']] }
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
