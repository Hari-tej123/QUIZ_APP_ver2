const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // ── Course-centric FKs (nullable so quiz can also belong directly to exam hierarchy) ──
    courseId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    subtopicId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true, // NULL / 0 means unlimited
      defaultValue: null
    },
    startTimeWindow: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTimeWindow: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // ── New optional exam-hierarchy FKs ──
    examEditionId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null
    },
    examSubjectId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null
    },
    examTopicId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null
    },
    // ── Contributor & Marketplace fields ──
    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'changes_requested'),
      defaultValue: 'approved',
      allowNull: false
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    totalAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    contributorAttribution: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'quizzes',
    timestamps: true
  });

  return Quiz;
};
