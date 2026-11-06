const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserExamPreference = sequelize.define('UserExamPreference', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'user_exam_preferences',
    timestamps: true
  });

  return UserExamPreference;
};
