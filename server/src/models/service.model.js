const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Service = sequelize.define('Service', {
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
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 5
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'services',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['business_id', 'is_active'] }
    ]
  });

  Service.prototype.toSafeObject = function () {
    return {
      id: this.id,
      businessId: this.business_id,
      name: this.name,
      description: this.description,
      durationMinutes: this.duration_minutes,
      price: parseFloat(this.price),
      isActive: this.is_active,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  };

  return Service;
};
