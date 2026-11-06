const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Enrollment = sequelize.define('Enrollment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    enrolledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'enrollments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'courseId']
      }
    ]
  });

  return Enrollment;
};
