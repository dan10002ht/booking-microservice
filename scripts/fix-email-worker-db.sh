#!/bin/bash

echo "🔧 Fixing email-worker database configuration..."

# Go to email-worker directory
cd email-worker

# Keep the original configuration for main database
# DB_PORT=55435 (main postgres instance)
# DB_NAME=booking_system (main database)

echo "✅ Using main database configuration:"
echo "   - Port: 55435 (main postgres)"
echo "   - Database: booking_system (main app database)"

# Test database connection
echo "🔍 Testing database connection..."
sleep 5

# Try to connect to database
if PGPASSWORD=booking_pass psql -h localhost -p 55435 -U booking_user -d booking_system -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    
    # Check if email-worker tables exist
    echo "🔍 Checking email-worker tables..."
    if PGPASSWORD=booking_pass psql -h localhost -p 55435 -U booking_user -d booking_system -c "\dt email_*" > /dev/null 2>&1; then
        echo "✅ Email-worker tables found!"
    else
        echo "⚠️  Email-worker tables not found. Database may need initialization."
        echo "   The email-worker will create tables automatically on first run."
    fi
else
    echo "❌ Database connection failed."
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check if postgres container is running:"
    echo "      docker ps | grep postgres"
    echo "   2. Restart postgres container:"
    echo "      docker compose -f deploy/docker-compose.dev.yml restart postgres"
    echo "   3. Check postgres logs:"
    echo "      docker logs deploy-postgres-1"
fi

cd .. 