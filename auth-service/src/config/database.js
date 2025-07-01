import knex from 'knex';
import knexfile from '../../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

// Master connection cho write operations
const masterDb = knex({
  ...config,
  connection: config.connection,
});

// Slave connection cho read operations
const slaveDb = knex({
  ...config,
  connection: config.readConnection || config.connection,
});

// Database manager với fallback logic
class DatabaseManager {
  constructor() {
    this.master = masterDb;
    this.slave = slaveDb;
    this.fallbackToMaster = true; // Fallback to master nếu slave fail
  }

  // Write operations - luôn dùng master
  async write(operation) {
    try {
      return await operation(this.master);
    } catch (error) {
      console.error('Master write error:', error);
      throw error;
    }
  }

  // Read operations - ưu tiên slave, fallback to master
  async read(operation, options = {}) {
    const { forceMaster = false, retryCount = 0 } = options;

    if (forceMaster) {
      return await operation(this.master);
    }

    try {
      return await operation(this.slave);
    } catch (error) {
      console.warn('Slave read error, falling back to master:', error.message);

      if (this.fallbackToMaster && retryCount === 0) {
        return await this.read(operation, { forceMaster: true, retryCount: 1 });
      }

      throw error;
    }
  }

  // Check replication lag
  async checkReplicationLag() {
    try {
      const masterResult = await this.master.raw('SELECT pg_current_wal_lsn() as lsn');
      const slaveResult = await this.slave.raw('SELECT pg_last_wal_receive_lsn() as lsn');

      if (masterResult.rows[0] && slaveResult.rows[0]) {
        const lag = await this.slave.raw('SELECT pg_wal_lsn_diff(?, ?) as lag_bytes', [
          masterResult.rows[0].lsn,
          slaveResult.rows[0].lsn,
        ]);
        return lag.rows[0]?.lag_bytes || 0;
      }
      return null;
    } catch (error) {
      console.error('Error checking replication lag:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    const masterHealth = await this.master
      .raw('SELECT 1')
      .then(() => true)
      .catch(() => false);
    const slaveHealth = await this.slave
      .raw('SELECT 1')
      .then(() => true)
      .catch(() => false);
    const replicationLag = await this.checkReplicationLag();

    return {
      master: masterHealth,
      slave: slaveHealth,
      replicationLag,
      status: masterHealth ? (slaveHealth ? 'healthy' : 'degraded') : 'unhealthy',
    };
  }
}

const dbManager = new DatabaseManager();

export default dbManager;
export { masterDb, slaveDb };
