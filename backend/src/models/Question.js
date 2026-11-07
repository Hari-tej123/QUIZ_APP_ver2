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
      allowNull: true
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { len: [1, 5000] },
      validate: {
        notEmpty: true
      }
    },
    optionA: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    optionB: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    optionC: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    optionD: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    correctOption: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    questionType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'mcq',
      validate: { isIn: [['mcq', 'multiple-select', 'numeric', 'short-answer']] }
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    correctAnswers: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    subject: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    topic: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    track: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'COMPETITIVE'
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    instituteId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [['draft', 'published']] }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
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
      timestamps: true,
      indexes: [
        { fields: ['track'] },
        { fields: ['createdBy'] },
        { fields: ['status'] }
      ]
  });

  return Question;
};
