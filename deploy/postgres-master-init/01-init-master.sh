#!/bin/bash
set -e

echo "🚀 Initializing PostgreSQL Master..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Create replication user
echo "👤 Creating replication user..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
CREATE USER replicator REPLICATION LOGIN PASSWORD 'replicator_pass';
"

# Grant necessary permissions
echo "🔐 Granting permissions to replicator..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
GRANT CONNECT ON DATABASE booking_system_auth TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO replicator;
"

# Create replication slots
echo "📦 Creating replication slots..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
SELECT pg_create_physical_replication_slot('replica_slot_1', true);
SELECT pg_create_physical_replication_slot('replica_slot_2', true);
"

# Configure PostgreSQL for replication
echo "⚙️ Configuring PostgreSQL for replication..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET wal_level = replica;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET max_wal_senders = 3;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET max_replication_slots = 3;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET hot_standby = on;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET archive_mode = on;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET archive_command = 'test ! -f /var/lib/postgresql/backup_in_progress && (test ! -f /var/lib/postgresql/archive/%f || cp %p /var/lib/postgresql/archive/%f)';"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET archive_timeout = 60;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET synchronous_commit = off;"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "ALTER SYSTEM SET max_wal_size = 1073741824;"

# Create archive directory
echo "📁 Creating archive directory..."
mkdir -p /var/lib/postgresql/archive
chown postgres:postgres /var/lib/postgresql/archive

# Configure pg_hba.conf for replication
echo "🔐 Configuring pg_hba.conf for replication..."
cat >> /var/lib/postgresql/data/pg_hba.conf <<EOF

# Replication connections
host    replication     replicator      172.18.0.0/16         md5
host    replication     replicator      172.17.0.0/16         md5
host    replication     replicator      172.19.0.0/16         md5
host    replication     replicator      10.0.0.0/8            md5
EOF

# Reload configuration
echo "🔄 Reloading configuration..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT pg_reload_conf();"

# Verify configuration
echo "🔍 Verifying configuration..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "
SELECT name, setting FROM pg_settings WHERE name IN ('wal_level', 'max_wal_senders', 'max_replication_slots', 'hot_standby');
"

echo "✅ Master initialization completed!" 