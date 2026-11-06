const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payout = sequelize.define('Payout', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contributorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('bounty_quiz', 'revenue_share', 'withdrawal'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'completed', 'rejected'),
      defaultValue: 'completed',
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'payouts',
    timestamps: true
  });

  return Payout;
};
