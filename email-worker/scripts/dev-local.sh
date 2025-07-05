#!/bin/bash

# Local Development Script for Email Worker Service
# This script starts only infrastructure services and runs email-worker locally with hot reload

echo "🚀 Starting Email Worker Service Local Development Environment"

# Function to kill process using a specific port
kill_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Checking if port $port is in use by $service_name..."
    
    # Check if it's a Docker container using the port
    local container_id=$(docker ps --format "table {{.ID}}\t{{.Ports}}" | grep ":$port->" | awk '{print $1}' | head -1)
    if [ ! -z "$container_id" ]; then
        echo "🐳 Found Docker container using port $port: $container_id"
        echo "🛑 Stopping container $container_id..."
        docker stop $container_id 2>/dev/null || true
        echo "🗑️ Removing container $container_id..."
        docker rm $container_id 2>/dev/null || true
        sleep 3
    fi
    
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

# Function to kill email-worker processes
kill_email_worker() {
    echo "🔍 Looking for existing email-worker processes..."
    
    # Kill Go processes for email-worker
    local go_pids=$(ps aux | grep "go run.*email-worker" | grep -v grep | awk '{print $2}')
    if [ ! -z "$go_pids" ]; then
        echo "⚠️  Found Go processes: $go_pids, killing them..."
        echo $go_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill email-worker binary processes
    local binary_pids=$(ps aux | grep "email-worker" | grep -v grep | awk '{print $2}')
    if [ ! -z "$binary_pids" ]; then
        echo "⚠️  Found email-worker binary processes: $binary_pids, killing them..."
        echo $binary_pids | xargs kill -9 2>/dev/null
    fi
    
    sleep 2
    echo "✅ Email-worker processes cleaned up"
}

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.19+"
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
kill_email_worker
kill_port 8080 "email-worker"
kill_port 2112 "email-worker-metrics"

# Start only infrastructure services (no other microservices)
echo "🐳 Starting infrastructure services only..."
cd ../deploy
docker compose -f docker-compose.dev.yml up -d redis postgres-main-master postgres-main-slave1 postgres-main-slave2 kafka zookeeper prometheus grafana elasticsearch kibana

# Wait for services to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 15

# Go back to email-worker directory
cd ../email-worker

# Install dependencies if needed
echo "📦 Installing Go dependencies..."
go mod tidy

# Create .env file for local development
echo "📝 Creating .env file for local development..."
cat > .env << EOF
# Application Configuration
APP_NAME=email-worker
APP_ENV=development
LOG_LEVEL=debug
SHUTDOWN_TIMEOUT=30s

# Database Configuration - Master-Slave Setup
# Master Database (for write operations)
DB_MASTER_HOST=localhost
DB_MASTER_PORT=55435
DB_MASTER_NAME=booking_system
DB_MASTER_USER=booking_user
DB_MASTER_PASSWORD=booking_pass

# Slave Database (for read operations)
DB_SLAVE_HOST=localhost
DB_SLAVE_PORT=55436
DB_SLAVE_NAME=booking_system
DB_SLAVE_USER=booking_user
DB_SLAVE_PASSWORD=booking_pass

# Common Database Settings
DB_SSL_MODE=disable
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=56379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_POOL_SIZE=10

# Kafka Configuration
KAFKA_BROKERS=localhost:59092
KAFKA_GROUP_ID=email-worker
KAFKA_TOPIC_EMAIL_JOBS=email-jobs
KAFKA_TOPIC_EMAIL_EVENTS=email-events
KAFKA_AUTO_OFFSET_RESET=earliest

# gRPC Configuration
GRPC_AUTH_SERVICE=localhost:50051
GRPC_USER_SERVICE=localhost:50052
GRPC_BOOKING_SERVICE=localhost:50053
GRPC_TIMEOUT=30s

# Email Provider Configuration
EMAIL_PROVIDER=mock
EMAIL_FROM=noreply@bookingsystem.com
EMAIL_FROM_NAME=Booking System

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_TLS=true

# Metrics Configuration
METRICS_ENABLED=true
METRICS_PORT=2112

# Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY=5s
RETRY_BACKOFF_MULTIPLIER=2

# Batch Processing Configuration
BATCH_SIZE=100
BATCH_TIMEOUT=30s
MAX_CONCURRENT_JOBS=10

# Worker Configuration
WORKER_COUNT=2
WORKER_BATCH_SIZE=5
WORKER_POLL_INTERVAL=500ms
WORKER_MAX_RETRIES=3
WORKER_RETRY_DELAY=1s
WORKER_PROCESS_TIMEOUT=30s
WORKER_CLEANUP_INTERVAL=5m

# Server Configuration
PORT=8080
GRPC_PORT=50060
EOF

echo "✅ .env file created"

# Run database migrations if needed
echo "🗄️ Checking database migrations..."
if [ -d "database/migrations" ]; then
    echo "📋 Running database migrations..."
    # Note: You might need to implement migration runner
    echo "⚠️  Migrations not implemented yet, skipping..."
fi

echo "🎯 Starting Email Worker Service with hot reload..."
echo ""
echo "📊 Available endpoints:"
echo "   - HTTP API: http://localhost:8080"
echo "   - gRPC Server: localhost:50060"
echo "   - Metrics: http://localhost:2112"
echo "   - Health Check: http://localhost:8080/health"
echo ""
echo "🔧 Development tools:"
echo "   - Grafana: http://localhost:53001 (admin/admin)"
echo "   - Prometheus: http://localhost:59090"
echo "   - Kibana: http://localhost:55601"
echo "   - PostgreSQL Master: localhost:55435"
echo "   - PostgreSQL Slave: localhost:55436"
echo "   - Redis: localhost:56379"
echo "   - Kafka: localhost:59092"
echo ""
echo "💡 Tips:"
echo "   - Email Worker will auto-restart when you save changes (if using air)"
echo "   - Database is configured with Master-Slave pattern"
echo "   - Use Ctrl+C to stop the development server"
echo "   - Test with: curl http://localhost:8080/health"
echo ""

# Check if air is installed for hot reload
if command -v air &> /dev/null; then
    echo "🔥 Using air for hot reload..."
    air
elif [ -f "$(go env GOPATH)/bin/air" ]; then
    echo "🔥 Using air for hot reload (from GOPATH)..."
    $(go env GOPATH)/bin/air
else
    echo "⚡ Using go run for development (install air for hot reload: go install github.com/air-verse/air@latest)"
    go run main.go
fi 