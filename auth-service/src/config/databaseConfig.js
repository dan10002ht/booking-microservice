import dotenv from 'dotenv';
import knex from 'knex';

dotenv.config();

// Master database configuration (for writes)
const masterConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_MASTER_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.DB_MASTER_PORT || process.env.DB_PORT || 5432,
    database: process.env.DB_MASTER_NAME || process.env.DB_NAME || 'booking_system_auth',
    user: process.env.DB_MASTER_USER || process.env.DB_USER || 'postgres',
    password: process.env.DB_MASTER_PASSWORD || process.env.DB_PASSWORD || 'password',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: parseInt(process.env.DB_MASTER_POOL_MIN) || 2,
    max: parseInt(process.env.DB_MASTER_POOL_MAX) || 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

// Slave database configurations (for reads)
const slaveConfigs = [
  {
    client: 'postgresql',
    connection: {
      host: process.env.DB_SLAVE1_HOST || process.env.DB_HOST || 'localhost',
      port: process.env.DB_SLAVE1_PORT || process.env.DB_PORT || 5432,
      database: process.env.DB_SLAVE1_NAME || process.env.DB_NAME || 'booking_system_auth',
      user: process.env.DB_SLAVE1_USER || process.env.DB_USER || 'postgres',
      password: process.env.DB_SLAVE1_PASSWORD || process.env.DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_SLAVE_POOL_MIN) || 2,
      max: parseInt(process.env.DB_SLAVE_POOL_MAX) || 8,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
  },
  // Có thể thêm nhiều slave khác ở đây
  ...(process.env.DB_SLAVE2_HOST
    ? [
        {
          client: 'postgresql',
          connection: {
            host: process.env.DB_SLAVE2_HOST,
            port: process.env.DB_SLAVE2_PORT || 5432,
            database: process.env.DB_SLAVE2_NAME || process.env.DB_NAME || 'booking_system_auth',
            user: process.env.DB_SLAVE2_USER || process.env.DB_USER || 'postgres',
            password: process.env.DB_SLAVE2_PASSWORD || process.env.DB_PASSWORD || 'password',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          },
          pool: {
            min: parseInt(process.env.DB_SLAVE_POOL_MIN) || 2,
            max: parseInt(process.env.DB_SLAVE_POOL_MAX) || 8,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            idleTimeoutMillis: 30000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 100,
          },
        },
      ]
    : []),
];

// Tạo master connection
const masterDb = knex(masterConfig);

// Tạo slave connections
const slaveDbs = slaveConfigs.map((config) => knex(config));

// Round-robin load balancer cho slaves
let currentSlaveIndex = 0;

const getSlaveDb = () => {
  if (slaveDbs.length === 0) {
    return masterDb;
  }

  const slave = slaveDbs[currentSlaveIndex];
  currentSlaveIndex = (currentSlaveIndex + 1) % slaveDbs.length;
  return slave;
};

// Health check function
const checkDatabaseHealth = async () => {
  const healthStatus = {
    master: false,
    slaves: [],
    timestamp: new Date().toISOString(),
  };

  try {
    await masterDb.raw('SELECT 1');
    healthStatus.master = true;
  } catch (error) {
    console.error('Master database health check failed:', error.message);
  }

  for (let i = 0; i < slaveDbs.length; i++) {
    try {
      await slaveDbs[i].raw('SELECT 1');
      healthStatus.slaves.push({ index: i, healthy: true });
    } catch (error) {
      console.error(`Slave ${i} database health check failed:`, error.message);
      healthStatus.slaves.push({ index: i, healthy: false });
    }
  }

  return healthStatus;
};

// Graceful shutdown
const closeConnections = async () => {
  try {
    await masterDb.destroy();
    await Promise.all(slaveDbs.map((db) => db.destroy()));
    console.log('All database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

export {
  masterDb,
  slaveDbs,
  getSlaveDb,
  checkDatabaseHealth,
  closeConnections,
  masterConfig,
  slaveConfigs,
};
