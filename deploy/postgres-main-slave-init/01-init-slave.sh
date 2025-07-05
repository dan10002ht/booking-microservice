#!/bin/bash

# Initialize main database slave for booking_system
set -e

echo "🔧 Initializing main database slave..."

# Wait for master to be ready
until pg_isready -h postgres-main-master -p 5432 -U booking_user; do
    echo "⏳ Waiting for master database to be ready..."
    sleep 2
done

# Create recovery configuration
cat > /var/lib/postgresql/data/recovery.conf <<EOF
standby_mode = 'on'
primary_conninfo = 'host=postgres-main-master port=5432 user=replicator password=replicator_pass application_name=main-slave1'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_timeline = 'latest'
EOF

echo "✅ Main database slave initialized successfully!" 