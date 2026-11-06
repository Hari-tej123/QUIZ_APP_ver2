const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'faculty', 'student', 'contributor'),
      allowNull: false
    },
    // Contributor & Educator specific
    contributorStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: true,
      defaultValue: null
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    credentials: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subjectExpertise: {
      type: DataTypes.STRING,
      allowNull: true
    },
    earningsBalance: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.0
    },
    totalEarned: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0.0
    },
    badge: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Faculty specific
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Student specific
    rollNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    // Change password on first login for faculty
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
