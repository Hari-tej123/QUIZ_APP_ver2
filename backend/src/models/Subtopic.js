const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subtopic = sequelize.define('Subtopic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false
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
    filePath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'subtopics',
    timestamps: true
  });

  return Subtopic;
};
