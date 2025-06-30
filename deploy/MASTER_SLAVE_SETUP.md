# Master-Slave Database Setup

## Overview

This setup implements PostgreSQL master-slave replication for high availability and read scaling in the booking system.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Master DB     │    │   Slave DB 1    │    │   Slave DB 2    │
│  (Writes Only)  │◄───┤  (Reads Only)   │    │  (Reads Only)   │
│   Port: 55432   │    │   Port: 55433   │    │   Port: 55434   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Services

### Master Database (`postgres-master`)

- **Port**: 55432
- **Purpose**: Handles all write operations (INSERT, UPDATE, DELETE)
- **Configuration**:
  - WAL (Write-Ahead Logging) enabled
  - Replication slots configured
  - Archive mode enabled

### Slave Database 1 (`postgres-slave1`)

- **Port**: 55433
- **Purpose**: Handles read operations (SELECT queries)
- **Configuration**: Hot standby mode, replicates from master

### Slave Database 2 (`postgres-slave2`)

- **Port**: 55434
- **Purpose**: Additional read capacity and failover
- **Configuration**: Hot standby mode, replicates from master

### Legacy Database (`postgres`)

- **Port**: 55435
- **Purpose**: Backward compatibility for services not yet migrated
- **Configuration**: Standard PostgreSQL instance

## Environment Variables

Create a `.env` file in the `deploy/` directory:

```bash
# Master Database
POSTGRES_MASTER_DB=booking_system_auth
POSTGRES_MASTER_USER=booking_user
POSTGRES_MASTER_PASSWORD=booking_pass
POSTGRES_MASTER_PORT=55432

# Slave Database 1
POSTGRES_SLAVE1_DB=booking_system_auth
POSTGRES_SLAVE1_USER=booking_user
POSTGRES_SLAVE1_PASSWORD=booking_pass
POSTGRES_SLAVE1_PORT=55433

# Slave Database 2
POSTGRES_SLAVE2_DB=booking_system_auth
POSTGRES_SLAVE2_USER=booking_user
POSTGRES_SLAVE2_PASSWORD=booking_pass
POSTGRES_SLAVE2_PORT=55434

# Legacy Database
POSTGRES_DB=booking_system
POSTGRES_USER=booking_user
POSTGRES_PASSWORD=booking_pass
POSTGRES_PORT=55435
```

## Service Configuration

### Auth Service Configuration

Update your auth-service `.env` file:

```bash
# Master Database (for writes)
DB_MASTER_HOST=postgres-master
DB_MASTER_PORT=5432
DB_MASTER_NAME=booking_system_auth
DB_MASTER_USER=booking_user
DB_MASTER_PASSWORD=booking_pass

# Slave Database 1 (for reads)
DB_SLAVE1_HOST=postgres-slave1
DB_SLAVE1_PORT=5432
DB_SLAVE1_NAME=booking_system_auth
DB_SLAVE1_USER=booking_user
DB_SLAVE1_PASSWORD=booking_pass

# Slave Database 2 (optional)
DB_SLAVE2_HOST=postgres-slave2
DB_SLAVE2_PORT=5432
DB_SLAVE2_NAME=booking_system_auth
DB_SLAVE2_USER=booking_user
DB_SLAVE2_PASSWORD=booking_pass
```

## Startup Sequence

1. **Master starts first** with replication configuration
2. **Slaves wait** for master to be ready
3. **Replication slots** are created on master
4. **Slaves connect** and start replicating

## Health Checks

The setup includes health check endpoints:

```bash
# Check master health
curl http://localhost:55432/health

# Check slave health
curl http://localhost:55433/health
curl http://localhost:55434/health
```

## Monitoring

### Replication Status

Check replication status on master:

```sql
-- Check replication slots
SELECT * FROM pg_replication_slots;

-- Check active connections
SELECT * FROM pg_stat_replication;

-- Check WAL sender processes
SELECT * FROM pg_stat_activity WHERE backend_type = 'walsender';
```

### Slave Status

Check slave status:

```sql
-- Check if slave is in recovery mode
SELECT pg_is_in_recovery();

-- Check replication lag
SELECT
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;
```

## Failover Scenarios

### Master Failure

1. Promote slave1 to master
2. Update application configuration
3. Reconfigure remaining slaves

### Slave Failure

1. Application automatically routes to other slaves
2. Check slave logs for issues
3. Restart failed slave

## Backup and Recovery

### Master Backup

```bash
# Create base backup
pg_basebackup -h postgres-master -p 5432 -U replicator -D /backup/master -Ft -z -P
```

### Slave Backup

```bash
# Create slave backup
pg_basebackup -h postgres-slave1 -p 5432 -U booking_user -D /backup/slave1 -Ft -z -P
```

## Troubleshooting

### Common Issues

1. **Replication not starting**

   - Check master is running
   - Verify replication user exists
   - Check network connectivity

2. **Replication lag**

   - Monitor WAL generation rate
   - Check slave performance
   - Consider adding more slaves

3. **Connection timeouts**
   - Increase connection pool settings
   - Check network latency
   - Monitor resource usage

### Logs

```bash
# Master logs
docker logs postgres-master

# Slave logs
docker logs postgres-slave1
docker logs postgres-slave2
```

## Performance Tuning

### Master Configuration

```sql
-- Increase WAL buffers
ALTER SYSTEM SET wal_buffers = '16MB';

-- Optimize checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET max_wal_size = '2GB';
```

### Slave Configuration

```sql
-- Enable parallel queries
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;
```

## Migration Guide

### From Single Database

1. **Backup existing data**
2. **Start master-slave setup**
3. **Migrate data to master**
4. **Update application configuration**
5. **Test read/write separation**

### Adding New Slaves

1. **Create new slave service**
2. **Configure replication**
3. **Update application config**
4. **Test load balancing**
