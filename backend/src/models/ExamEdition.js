const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExamEdition = sequelize.define('ExamEdition', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 2000, max: 2100 }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'exam_editions',
    timestamps: true
  });

  return ExamEdition;
};
