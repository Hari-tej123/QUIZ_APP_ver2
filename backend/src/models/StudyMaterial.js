const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudyMaterial = sequelize.define('StudyMaterial', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('pdf', 'note', 'video'),
      allowNull: false,
      defaultValue: 'note'
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // College Track FKs
    courseId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    subtopicId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Competitive Track FKs
    examId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    examEditionId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    examSubjectId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    examTopicId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'changes_requested'),
      defaultValue: 'approved',
      allowNull: false
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    downloadsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    tableName: 'study_materials',
    timestamps: true
  });

  return StudyMaterial;
};
