const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExamSubject = sequelize.define('ExamSubject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    examEditionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'exam_subjects',
    timestamps: true
  });

  return ExamSubject;
};
