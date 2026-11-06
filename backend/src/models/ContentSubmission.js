const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContentSubmission = sequelize.define('ContentSubmission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contributorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    contentType: {
      type: DataTypes.ENUM('quiz', 'study_material'),
      allowNull: false
    },
    quizId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    materialId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    trackType: {
      type: DataTypes.ENUM('competitive', 'college'),
      allowNull: false,
      defaultValue: 'competitive'
    },
    targetDetails: {
      type: DataTypes.TEXT, // Stored as JSON string
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'changes_requested'),
      defaultValue: 'pending',
      allowNull: false
    },
    adminFeedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payoutAmount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
      allowNull: false
    }
  }, {
    tableName: 'content_submissions',
    timestamps: true
  });

  return ContentSubmission;
};
