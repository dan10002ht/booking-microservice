#!/bin/bash

# Test Master-Slave Database Setup
# This script verifies that the master-slave replication is working correctly

set -e

echo "🔍 Testing Master-Slave Database Setup..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Function to check if database is accessible
check_db_connection() {
    local host=$1
    local port=$2
    local db=$3
    local user=$4
    local password=$5
    
    PGPASSWORD=$password psql -h $host -p $port -U $user -d $db -c "SELECT 1;" > /dev/null 2>&1
    return $?
}

# Function to check replication status
check_replication() {
    local host=$1
    local port=$2
    local db=$3
    local user=$4
    local password=$5
    
    PGPASSWORD=$password psql -h $host -p $port -U $user -d $db -c "SELECT pg_is_in_recovery();" 2>/dev/null
}

# Test 1: Check if all databases are running
echo "📊 Test 1: Checking database connectivity..."

echo "  Checking Master DB (postgres-master:5432)..."
if check_db_connection "postgres-master" "5432" "booking_system_auth" "booking_user" "booking_pass"; then
    print_status 0 "Master database is accessible"
else
    print_status 1 "Master database is not accessible"
fi

echo "  Checking Slave DB 1 (postgres-slave1:5432)..."
if check_db_connection "postgres-slave1" "5432" "booking_system_auth" "booking_user" "booking_pass"; then
    print_status 0 "Slave 1 database is accessible"
else
    print_status 1 "Slave 1 database is not accessible"
fi

echo "  Checking Slave DB 2 (postgres-slave2:5432)..."
if check_db_connection "postgres-slave2" "5432" "booking_system_auth" "booking_user" "booking_pass"; then
    print_status 0 "Slave 2 database is accessible"
else
    print_status 1 "Slave 2 database is not accessible"
fi

# Test 2: Check replication status
echo ""
echo "🔄 Test 2: Checking replication status..."

echo "  Checking if Master is not in recovery mode..."
MASTER_RECOVERY=$(check_replication "postgres-master" "5432" "booking_system_auth" "booking_user" "booking_pass")
if [ "$MASTER_RECOVERY" = "f" ]; then
    print_status 0 "Master is not in recovery mode (correct)"
else
    print_status 1 "Master is in recovery mode (incorrect)"
fi

echo "  Checking if Slave 1 is in recovery mode..."
SLAVE1_RECOVERY=$(check_replication "postgres-slave1" "5432" "booking_system_auth" "booking_user" "booking_pass")
if [ "$SLAVE1_RECOVERY" = "t" ]; then
    print_status 0 "Slave 1 is in recovery mode (correct)"
else
    print_status 1 "Slave 1 is not in recovery mode (incorrect)"
fi

echo "  Checking if Slave 2 is in recovery mode..."
SLAVE2_RECOVERY=$(check_replication "postgres-slave2" "5432" "booking_system_auth" "booking_user" "booking_pass")
if [ "$SLAVE2_RECOVERY" = "t" ]; then
    print_status 0 "Slave 2 is in recovery mode (correct)"
else
    print_status 1 "Slave 2 is not in recovery mode (incorrect)"
fi

# Test 3: Check replication slots on master
echo ""
echo "📋 Test 3: Checking replication slots on master..."

REPLICATION_SLOTS=$(PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -t -c "SELECT slot_name FROM pg_replication_slots;" 2>/dev/null)

if echo "$REPLICATION_SLOTS" | grep -q "replica_slot_1"; then
    print_status 0 "Replication slot 'replica_slot_1' exists"
else
    print_status 1 "Replication slot 'replica_slot_1' not found"
fi

if echo "$REPLICATION_SLOTS" | grep -q "replica_slot_2"; then
    print_status 0 "Replication slot 'replica_slot_2' exists"
else
    print_status 1 "Replication slot 'replica_slot_2' not found"
fi

# Test 4: Check active replication connections
echo ""
echo "🔗 Test 4: Checking active replication connections..."

REPLICATION_CONNECTIONS=$(PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -t -c "SELECT COUNT(*) FROM pg_stat_replication;" 2>/dev/null)

if [ "$REPLICATION_CONNECTIONS" -ge 2 ]; then
    print_status 0 "Active replication connections: $REPLICATION_CONNECTIONS"
else
    print_status 1 "Insufficient replication connections: $REPLICATION_CONNECTIONS"
fi

# Test 5: Test write on master and read on slaves
echo ""
echo "✍️ Test 5: Testing write on master and read on slaves..."

# Create a test table on master
PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -c "
CREATE TABLE IF NOT EXISTS test_replication (
    id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" > /dev/null 2>&1

# Insert test data on master
PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -c "
INSERT INTO test_replication (message) VALUES ('Test replication message');" > /dev/null 2>&1

# Wait a moment for replication
sleep 2

# Try to read from slave 1
SLAVE1_DATA=$(PGPASSWORD=booking_pass psql -h postgres-slave1 -p 5432 -U booking_user -d booking_system_auth -t -c "SELECT message FROM test_replication WHERE message = 'Test replication message';" 2>/dev/null)

if echo "$SLAVE1_DATA" | grep -q "Test replication message"; then
    print_status 0 "Data replicated to Slave 1 successfully"
else
    print_status 1 "Data not replicated to Slave 1"
fi

# Try to read from slave 2
SLAVE2_DATA=$(PGPASSWORD=booking_pass psql -h postgres-slave2 -p 5432 -U booking_user -d booking_system_auth -t -c "SELECT message FROM test_replication WHERE message = 'Test replication message';" 2>/dev/null)

if echo "$SLAVE2_DATA" | grep -q "Test replication message"; then
    print_status 0 "Data replicated to Slave 2 successfully"
else
    print_status 1 "Data not replicated to Slave 2"
fi

# Clean up test data
PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -c "DROP TABLE test_replication;" > /dev/null 2>&1

# Test 6: Check replication lag
echo ""
echo "⏱️ Test 6: Checking replication lag..."

REPLICATION_LAG=$(PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -t -c "
SELECT 
    client_addr,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes
FROM pg_stat_replication;" 2>/dev/null)

echo "  Replication lag information:"
echo "$REPLICATION_LAG"

# Test 7: Check WAL sender processes
echo ""
echo "📡 Test 7: Checking WAL sender processes..."

WAL_SENDERS=$(PGPASSWORD=booking_pass psql -h postgres-master -p 5432 -U booking_user -d booking_system_auth -t -c "
SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'walsender';" 2>/dev/null)

if [ "$WAL_SENDERS" -ge 2 ]; then
    print_status 0 "WAL sender processes: $WAL_SENDERS"
else
    print_status 1 "Insufficient WAL sender processes: $WAL_SENDERS"
fi

echo ""
echo "🎉 Master-Slave Database Setup Test Complete!"
echo "============================================="
echo ""
echo "📊 Summary:"
echo "  - Master DB: postgres-master:5432"
echo "  - Slave DB 1: postgres-slave1:5432"
echo "  - Slave DB 2: postgres-slave2:5432"
echo "  - Legacy DB: postgres:5432 (port 55435)"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update your service configurations to use master-slave"
echo "  2. Test your applications with the new setup"
echo "  3. Monitor replication lag and performance"
echo "  4. Set up automated failover if needed"
echo ""
echo "📚 Documentation: See MASTER_SLAVE_SETUP.md for detailed information" 