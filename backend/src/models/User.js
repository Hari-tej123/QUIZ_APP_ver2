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
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'STUDENT',
      validate: { isIn: [['STUDENT', 'EDUCATOR', 'ADMIN']] }
    },
    educatorType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { isIn: [['COMPETITIVE', 'COLLEGE', 'BOTH']] }
    },
    instituteId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    employeeId: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    approvalStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'APPROVED',
      validate: { isIn: [['PENDING', 'APPROVED', 'REJECTED']] }
    },
    needsRoleSelection: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
