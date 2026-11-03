const { sequelize } = require('../models');

async function migrate() {
  try {
    console.log('Running database migrations...');
    await sequelize.authenticate();
    console.log('Database connected.');

    // sync({ force: false }) creates tables if they don't exist without altering/dropping
    await sequelize.sync();
    console.log('Database schema successfully migrated.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
