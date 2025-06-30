#!/bin/bash
set -e

echo "🚀 Initializing PostgreSQL Slave..."

# Wait for master to be ready
until pg_isready -h postgres-master -p 5432 -U booking_user; do
  echo "⏳ Waiting for master database..."
  sleep 2
done

echo "✅ Master database is ready"

# Create archive directory
echo "📁 Creating archive directory..."
mkdir -p /var/lib/postgresql/archive
chown postgres:postgres /var/lib/postgresql/archive

# Create recovery.conf for replication (PostgreSQL 12+ uses postgresql.conf)
echo "⚙️ Configuring replication settings..."

# For PostgreSQL 15, we use postgresql.conf instead of recovery.conf
cat >> /var/lib/postgresql/data/postgresql.conf <<EOF

# Replication settings
primary_conninfo = 'host=postgres-master port=5432 user=replicator password=replicator_pass'
primary_slot_name = 'replica_slot_1'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_timeline = 'latest'
hot_standby = on
wal_receiver_status_interval = 10s
hot_standby_feedback = on
max_standby_archive_delay = 30s
max_standby_streaming_delay = 30s
EOF

# Create standby.signal file (required for PostgreSQL 12+)
echo "📝 Creating standby.signal file..."
touch /var/lib/postgresql/data/standby.signal
chown postgres:postgres /var/lib/postgresql/data/standby.signal

echo "✅ Slave initialization completed!" 