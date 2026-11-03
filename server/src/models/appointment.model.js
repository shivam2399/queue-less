const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'businesses',
        key: 'id'
      }
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'services',
        key: 'id'
      }
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    appointment_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    token_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('waiting', 'serving', 'completed', 'cancelled', 'no_show'),
      allowNull: false,
      defaultValue: 'waiting'
    },
    estimated_wait_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['business_id', 'appointment_date', 'token_number']
      },
      {
        fields: ['business_id', 'appointment_date', 'status', 'token_number']
      },
      {
        fields: ['customer_id', 'appointment_date']
      },
      {
        fields: ['service_id']
      }
    ]
  });

  Appointment.prototype.toSafeObject = function (options = {}) {
    const { includeCustomer = false } = options;
    const data = {
      id: this.id,
      customerId: this.customer_id,
      businessId: this.business_id,
      serviceId: this.service_id,
      appointmentDate: this.appointment_date,
      appointmentTime: this.appointment_time,
      tokenNumber: this.token_number,
      status: this.status,
      estimatedWaitMinutes: this.estimated_wait_minutes,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };

    if (this.Business) {
      data.business = this.Business.toSafeObject ? this.Business.toSafeObject() : this.Business;
    }
    if (this.Service) {
      data.service = this.Service.toSafeObject ? this.Service.toSafeObject() : this.Service;
    }
    if (includeCustomer && this.Customer) {
      data.customer = {
        id: this.Customer.id,
        name: this.Customer.name,
        email: this.Customer.email
      };
    }

    return data;
  };

  return Appointment;
};
