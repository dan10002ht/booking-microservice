#!/bin/bash

# Development script for all microservices with hot reload
# This script starts all services in development mode with hot reload

echo "🚀 Starting All Microservices Development Environment"

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

# Function to kill all development processes
kill_all_dev_processes() {
    echo "🧹 Cleaning up all development processes..."
    
    # Kill all nodemon processes
    local nodemon_pids=$(ps aux | grep nodemon | grep -v grep | awk '{print $2}')
    if [ ! -z "$nodemon_pids" ]; then
        echo "⚠️  Found nodemon processes: $nodemon_pids, killing them..."
        echo $nodemon_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill all node processes for our services
    local node_pids=$(ps aux | grep "node.*src/index.js" | grep -v grep | awk '{print $2}')
    if [ ! -z "$node_pids" ]; then
        echo "⚠️  Found node processes: $node_pids, killing them..."
        echo $node_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill all Go processes for our services
    local go_pids=$(ps aux | grep "go run main.go" | grep -v grep | awk '{print $2}')
    if [ ! -z "$go_pids" ]; then
        echo "⚠️  Found Go processes: $go_pids, killing them..."
        echo $go_pids | xargs kill -9 2>/dev/null
    fi
    
    sleep 3
    echo "✅ All development processes cleaned up"
}

# Function to kill specific service processes
kill_service() {
    local service_name=$1
    echo "🔍 Looking for existing $service_name processes..."
    
    # Kill nodemon processes for the service
    local nodemon_pids=$(ps aux | grep "nodemon.*$service_name" | grep -v grep | awk '{print $2}')
    if [ ! -z "$nodemon_pids" ]; then
        echo "⚠️  Found nodemon processes: $nodemon_pids, killing them..."
        echo $nodemon_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill node processes for the service
    local node_pids=$(ps aux | grep "node.*$service_name" | grep -v grep | awk '{print $2}')
    if [ ! -z "$node_pids" ]; then
        echo "⚠️  Found node processes: $node_pids, killing them..."
        echo $node_pids | xargs kill -9 2>/dev/null
    fi
    
    # Kill Go processes for the service
    local go_pids=$(ps aux | grep "go run.*$service_name" | grep -v grep | awk '{print $2}')
    if [ ! -z "$go_pids" ]; then
        echo "⚠️  Found Go processes: $go_pids, killing them..."
        echo $go_pids | xargs kill -9 2>/dev/null
    fi
    
    sleep 2
    echo "✅ $service_name processes cleaned up"
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

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose"
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.19+"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Kill all existing processes
echo "🧹 Cleaning up existing processes..."
kill_all_dev_processes

# Kill specific ports
kill_port 50051 "auth-service"
kill_port 50052 "device-service"
kill_port 50053 "security-service"
kill_port 53000 "gateway"
kill_port 8080 "email-worker"
kill_port 2112 "email-worker-metrics"

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
cd deploy

# Use docker compose v2 instead of docker-compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "✅ Using Docker Compose v2"
    docker compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper prometheus grafana elasticsearch kibana auth-service email-worker gateway
else
    echo "❌ Docker Compose v2 not available, trying docker-compose..."
    docker-compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper prometheus grafana elasticsearch kibana auth-service email-worker gateway
fi

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 15

# Go back to root directory
cd ..

# Start services in order
echo "🎯 Starting microservices..."

# 1. Auth Service (port 50051) - Now running in Docker
echo "🔐 Auth Service is running in Docker..."

# Wait for auth service to be ready
echo "⏳ Waiting for auth-service to be ready..."
sleep 15

# 2. Device Service (port 50052) - if exists
# if [ -d "device-service" ]; then
#     echo "📱 Starting Device Service..."
#     cd device-service
#     if [ ! -d "node_modules" ]; then
#         echo "📦 Installing device-service dependencies..."
#         yarn install
#     fi
#     if [ -f "scripts/dev-local.sh" ]; then
#         echo "🚀 Starting device-service with dev:local..."
#         yarn dev:local &
#         DEVICE_PID=$!
#     else
#         echo "⚠️  No dev:local script found for device-service"
#     fi
#     cd ..
#     sleep 10
# fi

# 3. Security Service (port 50053) - if exists
# if [ -d "security-service" ]; then
#     echo "🔒 Starting Security Service..."
#     cd security-service
#     if [ ! -d "node_modules" ]; then
#         echo "📦 Installing security-service dependencies..."
#         yarn install
#     fi
#     if [ -f "scripts/dev-local.sh" ]; then
#         echo "🚀 Starting security-service with dev:local..."
#         yarn dev:local &
#         SECURITY_PID=$!
#     else
#         echo "⚠️  No dev:local script found for security-service"
#     fi
#     cd ..
#     sleep 10
# fi

# 4. Email Worker Service (port 8080) - Now running in Docker
echo "📧 Email Worker Service is running in Docker..."

# 5. Gateway Service (port 53000) - Now running in Docker
echo "🌐 Gateway Service is running in Docker..."

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📊 Available endpoints:"
echo "   - Gateway API: http://localhost:53000"
echo "   - Auth Service (gRPC): localhost:50051"
echo "   - Email Worker API: http://localhost:8080"
echo "   - Email Worker gRPC: localhost:50060"
# if [ -d "device-service" ]; then
#     echo "   - Device Service (gRPC): localhost:50052"
# fi
# if [ -d "security-service" ]; then
#     echo "   - Security Service (gRPC): localhost:50053"
# fi
echo ""
echo "🔧 Development tools:"
echo "   - Grafana: http://localhost:53001 (admin/admin)"
echo "   - Prometheus: http://localhost:59090"
echo "   - Kibana: http://localhost:55601"
echo ""
echo "💡 Tips:"
echo "   - All services are running in Docker containers"
echo "   - Use Ctrl+C to stop all services"
echo "   - Check logs with: docker compose -f deploy/docker-compose.dev.yml logs -f [service-name]"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Stop Docker containers
    echo "🛑 Stopping Docker containers..."
    cd deploy
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        docker compose -f docker-compose.dev.yml down
    else
        docker-compose -f docker-compose.dev.yml down
    fi
    cd ..
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "Press Ctrl+C to stop all services..."
wait 