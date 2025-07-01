import dotenv from 'dotenv';

dotenv.config();

const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_MASTER_HOST || 'localhost',
      port: process.env.DB_MASTER_PORT || 5432,
      database: process.env.DB_MASTER_NAME || 'booking_system_auth',
      user: process.env.DB_MASTER_USER || 'booking_user',
      password: process.env.DB_MASTER_PASSWORD || 'booking_pass',
    },
    // Master connection cho write operations
    pool: {
      min: 2,
      max: 10,
    },
    // Slave connection cho read operations
    readConnection: {
      host: process.env.DB_SLAVE_HOST || 'localhost',
      port: process.env.DB_SLAVE_PORT || 55433,
      database: process.env.DB_SLAVE_NAME || 'booking_system_auth',
      user: process.env.DB_SLAVE_USER || 'booking_user',
      password: process.env.DB_SLAVE_PASSWORD || 'booking_pass',
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'booking_system_auth_test',
      user: process.env.TEST_DB_USER || 'booking_user',
      password: process.env.TEST_DB_PASSWORD || 'booking_pass',
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_MASTER_HOST,
      port: process.env.DB_MASTER_PORT || 5432,
      database: process.env.DB_MASTER_NAME,
      user: process.env.DB_MASTER_USER,
      password: process.env.DB_MASTER_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default config;
