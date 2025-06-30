import knex from 'knex';
import config from './index.js';
import logger from '../utils/logger.js';

// Database configuration
const dbConfig = {
  client: 'postgresql',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './src/database/migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
};

// Create database connection
const db = knex(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const result = await db.raw('SELECT 1 as health');
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export default db; 