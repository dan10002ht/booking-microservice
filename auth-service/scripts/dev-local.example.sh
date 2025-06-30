#!/bin/bash

# Local Development Script for Auth Service
# This script starts only infrastructure services and runs auth-service locally with hot reload

echo "🚀 Starting Auth Service Local Development Environment"

# Function to kill process using a specific port
kill_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Checking if port $port is in use by $service_name..."
    
    # Find all processes using the port
    local pids=$(ss -tlnp | grep ":$port " | awk '{print $7}' | sed 's/.*pid=\([0-9]*\).*/\1/' | sort -u)
    
    if [ ! -z "$pids" ]; then
        echo "⚠️  Found processes using port $port: $pids, killing them..."
        echo $pids | xargs kill -9 2>/dev/null
        sleep 3
        
        # Verify the port is free
        if ss -tlnp | grep ":$port " > /dev/null; then
            echo "❌ Failed to kill all processes on port $port"
            # Try one more time with force
            local remaining_pids=$(ss -tlnp | grep ":$port " | awk '{print $7}' | sed 's/.*pid=\([0-9]*\).*/\1/' | sort -u)
            if [ ! -z "$remaining_pids" ]; then
                echo "🔄 Force killing remaining processes: $remaining_pids"
                echo $remaining_pids | xargs kill -9 2>/dev/null
                sleep 2
            fi
        else
            echo "✅ Successfully freed port $port"
        fi
    else
        echo "✅ Port $port is available"
    fi
}

# Function to kill auth-service processes
kill_auth_service() {
    echo "🔍 Looking for existing auth-service processes..."
    
    # Kill nodemon processes for auth-service
    local nodemon_pids=$(ps aux | grep "nodemon.*auth-service" | grep -v grep | awk '{print $2}')
    if [ ! -z "$nodemon_pids" ]; then
        echo "⚠️  Found nodemon processes: $nodemon_pids, killing them..."
        echo $nodemon_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill node processes for auth-service
    local node_pids=$(ps aux | grep "node.*auth-service" | grep -v grep | awk '{print $2}')
    if [ ! -z "$node_pids" ]; then
        echo "⚠️  Found node processes: $node_pids, killing them..."
        echo $node_pids | xargs kill -9 2>/dev/null
    fi
    
    sleep 2
    echo "✅ Auth-service processes cleaned up"
}

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed. Please install Yarn"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

# Check if Docker Compose v2 is installed
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose v2 is not installed. Hãy cài Docker Desktop mới hoặc docker compose plugin."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Kill existing processes before starting
echo "🧹 Cleaning up existing processes..."
kill_auth_service
kill_port 50051 "auth-service"

# Start only infrastructure services (no other microservices)
echo "🐳 Starting infrastructure services only..."
cd ../deploy
docker compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper prometheus grafana elasticsearch kibana

# Wait for services to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 10

# Go back to auth-service directory
cd ../auth-service

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Create .env file for local development
echo "📝 Creating .env file for local development..."
cat > .env << EOF
# Server Configuration
PORT=50051
HOST=0.0.0.0
NODE_ENV=development

# Database Configuration (Master-Slave Pattern)
DB_MASTER_HOST=localhost
DB_MASTER_PORT=55432
DB_MASTER_NAME=booking_system_auth
DB_MASTER_USER=booking_user
DB_MASTER_PASSWORD=booking_pass

DB_SLAVE1_HOST=localhost
DB_SLAVE1_PORT=55433
DB_SLAVE1_NAME=booking_system_auth
DB_SLAVE1_USER=booking_user
DB_SLAVE1_PASSWORD=booking_pass

DB_SLAVE2_HOST=localhost
DB_SLAVE2_PORT=55434
DB_SLAVE2_NAME=booking_system_auth
DB_SLAVE2_USER=booking_user
DB_SLAVE2_PASSWORD=booking_pass

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=56379
REDIS_PASSWORD=
REDIS_DATABASE=0

# JWT Configuration
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=dev_session_secret_change_in_production
SESSION_EXPIRES_IN=24h

# Email Configuration (for password reset, verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bookingsystem.com

# Security Configuration
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MAX_REQUESTS_AUTH=1000

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=json

# Monitoring Configuration
PROMETHEUS_PORT=9090

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=10000

# Master-Slave Configuration
DB_READ_PREFERENCE=slave
DB_WRITE_PREFERENCE=master
DB_FAILOVER_ENABLED=true
DB_FAILOVER_TIMEOUT=5000

# gRPC Configuration
GRPC_MAX_RECEIVE_MESSAGE_LENGTH=4194304
GRPC_MAX_SEND_MESSAGE_LENGTH=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000
GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS=true

# Circuit Breaker Configuration
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000
CIRCUIT_BREAKER_FALLBACK=true

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:53000

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
UPLOAD_PATH=./uploads

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Notification Configuration
NOTIFICATION_ENABLED=true
NOTIFICATION_PROVIDER=email
NOTIFICATION_QUEUE=notifications

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_PROVIDER=internal
ANALYTICS_QUEUE=analytics

# Backup Configuration
BACKUP_ENABLED=false
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30

# Development Configuration
DEBUG=true
VERBOSE_LOGGING=true
SKIP_EMAIL_VERIFICATION=true
SKIP_PHONE_VERIFICATION=true

# Google OAuth Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EOF

echo "✅ .env file created"

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate:latest

# Run database seeds
echo "🌱 Running database seeds..."
npm run seed:run

echo "🎯 Starting Auth Service with hot reload (nodemon)..."
echo ""
echo "📊 Available endpoints:"
echo "   - gRPC Server: localhost:50051"
echo "   - Health Check: gRPC health method"
echo "   - Metrics: http://localhost:9090 (if enabled)"
echo ""
echo "🔧 Development tools:"
echo "   - Grafana: http://localhost:53001 (admin/admin)"
echo "   - Prometheus: http://localhost:59090"
echo "   - Kibana: http://localhost:55601"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "💡 Tips:"
echo "   - Auth Service will auto-restart when you save changes"
echo "   - Database is configured with Master-Slave pattern"
echo "   - Use Ctrl+C to stop the development server"
echo "   - Test with: node test-grpc.js"
echo ""

# Start the application with nodemon for hot reload
yarn dev 