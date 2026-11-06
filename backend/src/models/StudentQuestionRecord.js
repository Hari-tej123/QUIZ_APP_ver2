const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudentQuestionRecord = sequelize.define('StudentQuestionRecord', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    isBookmarked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    isMistake: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    mistakeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastSelectedOption: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'student_question_records',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'questionId']
      }
    ]
  });

  return StudentQuestionRecord;
};
