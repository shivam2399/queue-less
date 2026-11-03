const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BusinessQueue = sequelize.define('BusinessQueue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'businesses',
        key: 'id'
      }
    },
    queue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    current_token: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_token: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_paused: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'business_queues',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['business_id', 'queue_date']
      }
    ]
  });

  BusinessQueue.prototype.toSafeObject = function () {
    return {
      id: this.id,
      businessId: this.business_id,
      queueDate: this.queue_date,
      currentToken: this.current_token,
      lastToken: this.last_token,
      isPaused: this.is_paused,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  };

  return BusinessQueue;
};
