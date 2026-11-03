const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    opening_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    closing_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    timezone: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'Asia/Kolkata'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'businesses',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['is_active'] }
    ]
  });

  Business.prototype.toSafeObject = function () {
    return {
      id: this.id,
      ownerId: this.owner_id,
      name: this.name,
      description: this.description,
      address: this.address,
      phone: this.phone,
      openingTime: this.opening_time,
      closingTime: this.closing_time,
      timezone: this.timezone,
      isActive: this.is_active,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  };

  return Business;
};
