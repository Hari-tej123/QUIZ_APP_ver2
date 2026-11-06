const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    optionA: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    optionB: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    optionC: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    optionD: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    correctOption: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: false
    },
    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium',
      allowNull: false
    },
    tags: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'questions',
    timestamps: true
  });

  return Question;
};
