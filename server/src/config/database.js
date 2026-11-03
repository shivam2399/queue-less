const path = require('path');
const { Sequelize } = require('sequelize');
const env = require('./env');

let sequelize;

if (env.NODE_ENV === 'test' || env.DB_DIALECT === 'sqlite') {
  const isTest = env.NODE_ENV === 'test';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: isTest ? ':memory:' : path.join(__dirname, '../../dev.sqlite'),
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });
} else {
  sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'mysql',
    logging: env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    timezone: '+05:30' // Business default Asia/Kolkata
  });
}

module.exports = {
  sequelize,
  Sequelize
};
