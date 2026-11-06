const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    facultyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'courses',
    timestamps: true
  });

  return Course;
};
