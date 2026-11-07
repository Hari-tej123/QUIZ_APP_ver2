const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizAttempt = sequelize.define('QuizAttempt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    submitTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    score: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.0
    },
    status: {
      type: DataTypes.ENUM('in-progress', 'completed', 'auto-submitted', 'aborted'),
      allowNull: false,
      defaultValue: 'in-progress'
    },
    hiddenFromStudent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    mode: {
      type: DataTypes.ENUM('mock', 'practice'),
      defaultValue: 'mock',
      allowNull: false
    },
    questionOrder: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timeSpentSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    incorrectAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    skippedAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    tableName: 'quiz_attempts',
    timestamps: true
  });

  return QuizAttempt;
};
