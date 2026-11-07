const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // ── Track & Institute Support ──
    track: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'COMPETITIVE',
      validate: { isIn: [['COMPETITIVE', 'COLLEGE']] }
    },
    trackType: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this.getDataValue('track') || 'COMPETITIVE').toLowerCase();
      },
      set(val) {
        if (val) this.setDataValue('track', String(val).toUpperCase());
      }
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    instituteId: {
      type: DataTypes.STRING(100),
      allowNull: true
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
    durationMin: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      validate: { min: 1 }
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
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null
    },
    status: {
      type: DataTypes.STRING(30),
      defaultValue: 'DRAFT',
      allowNull: false,
      validate: { isIn: [['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']] }
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    publishedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    publishedAt: {
      type: DataTypes.DATE,
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
