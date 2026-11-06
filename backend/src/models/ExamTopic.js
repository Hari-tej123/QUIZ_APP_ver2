const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExamTopic = sequelize.define('ExamTopic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      allowNull: false
    }
  }, {
    tableName: 'exam_topics',
    timestamps: true
  });

  return ExamTopic;
};
