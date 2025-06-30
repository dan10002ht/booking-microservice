import knex from 'knex';
import config from './index.js';
import logger from '../utils/logger.js';

// Create database connection
const db = knex({
  client: 'postgresql',
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
});

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Database connection established');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Close database connections
const closeDatabaseConnections = async () => {
  try {
    await db.destroy();
    logger.info('✅ Database connections closed');
  } catch (error) {
    logger.error('❌ Error closing database connections:', error);
  }
};

// Health check for database
const healthCheck = async () => {
  try {
    await db.raw('SELECT 1');
    return { status: 'healthy', service: 'database' };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', service: 'database', error: error.message };
  }
};

export { db, testConnection, closeDatabaseConnections, healthCheck }; 