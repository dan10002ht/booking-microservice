#!/bin/bash

# Development script for email-worker service
# This script starts email-worker in development mode

echo "📧 Starting Email Worker Development Environment"

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

# Function to kill all email-worker processes
kill_email_worker_processes() {
    echo "🧹 Cleaning up email-worker processes..."
    
    # Kill all Go processes for email-worker
    local go_pids=$(ps aux | grep "go run.*email-worker" | grep -v grep | awk '{print $2}')
    if [ ! -z "$go_pids" ]; then
        echo "⚠️  Found email-worker Go processes: $go_pids, killing them..."
        echo $go_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill processes on email-worker ports
    kill_port 8080 "email-worker-api"
    kill_port 2112 "email-worker-metrics"
    kill_port 50060 "email-worker-grpc"
    
    sleep 3
    echo "✅ Email worker processes cleaned up"
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

echo "✅ Prerequisites check passed"

# Kill existing email-worker processes
echo "🧹 Cleaning up existing email-worker processes..."
kill_email_worker_processes

# Check if we're in the email-worker directory
if [ ! -f "go.mod" ]; then
    echo "❌ This script must be run from the email-worker directory"
    exit 1
fi

# Check if infrastructure is running
echo "🔍 Checking if infrastructure services are running..."
if ! docker ps | grep -q "deploy-postgres-1"; then
    echo "⚠️  Infrastructure services not running. Starting them..."
    cd ../deploy
    
    # Use docker compose v2 instead of docker-compose
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        echo "✅ Using Docker Compose v2"
        docker compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper
    else
        echo "❌ Docker Compose v2 not available, trying docker-compose..."
        docker-compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper
    fi
    
    # Wait for infrastructure to be ready
    echo "⏳ Waiting for infrastructure services to be ready..."
    sleep 15
    
    cd ../email-worker
else
    echo "✅ Infrastructure services are running"
fi

# Install dependencies
echo "📦 Installing email-worker dependencies..."
go mod tidy

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📋 Copying environment configuration..."
    cp env.example .env
    
    # Update database configuration for local development
    echo "🔧 Updating database configuration..."
    sed -i 's/DB_PORT=5432/DB_PORT=55435/' .env
    sed -i 's/DB_USER=postgres/DB_USER=booking_user/' .env
    sed -i 's/DB_PASSWORD=password/DB_PASSWORD=booking_pass/' .env
    sed -i 's/REDIS_PORT=6379/REDIS_PORT=56379/' .env
    sed -i 's/KAFKA_BROKERS=localhost:9092/KAFKA_BROKERS=localhost:59092/' .env
fi

# Start email-worker
echo "🚀 Starting email-worker..."
go run main.go &
EMAIL_WORKER_PID=$!

# Wait for email-worker to be ready
echo "⏳ Waiting for email-worker to be ready..."
sleep 10

# Check if email-worker is running
if ps -p $EMAIL_WORKER_PID > /dev/null; then
    echo ""
    echo "🎉 Email Worker started successfully!"
    echo ""
    echo "📊 Available endpoints:"
    echo "   - Email Worker API: http://localhost:8080"
    echo "   - Email Worker Metrics: http://localhost:2112"
    echo "   - Email Worker gRPC: localhost:50060"
    echo ""
    echo "🔧 Development tools:"
    echo "   - Grafana: http://localhost:53001 (admin/admin)"
    echo "   - Prometheus: http://localhost:59090"
    echo "   - Kibana: http://localhost:55601"
    echo ""
    echo "💡 Tips:"
    echo "   - Use Ctrl+C to stop email-worker"
    echo "   - Check logs for any errors"
    echo "   - Database migrations will run automatically"
    echo ""
else
    echo "❌ Failed to start email-worker"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping email-worker..."
    
    if [ ! -z "$EMAIL_WORKER_PID" ]; then
        echo "🛑 Stopping email-worker (PID: $EMAIL_WORKER_PID)..."
        kill -9 $EMAIL_WORKER_PID 2>/dev/null
    fi
    
    echo "✅ Email worker stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "Press Ctrl+C to stop email-worker..."
wait 