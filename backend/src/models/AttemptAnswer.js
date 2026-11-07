const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AttemptAnswer = sequelize.define('AttemptAnswer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    attemptId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    selectedOption: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    marksObtained: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'attempt_answers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['attemptId', 'questionId']
      }
    ]
  });

  return AttemptAnswer;
};
