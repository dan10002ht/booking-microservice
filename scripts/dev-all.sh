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

echo "✅ Prerequisites check passed"

# Kill all existing processes
echo "🧹 Cleaning up existing processes..."
kill_all_dev_processes

# Kill specific ports
kill_port 50051 "auth-service"
kill_port 50052 "device-service"
kill_port 50053 "security-service"
kill_port 53000 "gateway"

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
cd deploy

# Use docker compose v2 instead of docker-compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "✅ Using Docker Compose v2"
    docker compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper prometheus grafana elasticsearch kibana
else
    echo "❌ Docker Compose v2 not available, trying docker-compose..."
    docker-compose -f docker-compose.dev.yml up -d redis postgres-master postgres-slave1 postgres-slave2 kafka zookeeper prometheus grafana elasticsearch kibana
fi

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
sleep 15

# Go back to root directory
cd ..

# Start services in order
echo "🎯 Starting microservices..."

# 1. Auth Service (port 50051)
echo "🔐 Starting Auth Service..."
cd auth-service
if [ ! -d "node_modules" ]; then
    echo "📦 Installing auth-service dependencies..."
    yarn install
fi
echo "🚀 Starting auth-service with dev:local..."
yarn dev:local &
AUTH_PID=$!
cd ..

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

# 4. Gateway Service (port 53000)
echo "🌐 Starting Gateway Service..."
cd gateway
if [ ! -d "node_modules" ]; then
    echo "📦 Installing gateway dependencies..."
    yarn install
fi
echo "🚀 Starting gateway with dev:local..."
yarn dev:local &
GATEWAY_PID=$!
cd ..

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📊 Available endpoints:"
echo "   - Gateway API: http://localhost:53000"
echo "   - Auth Service (gRPC): localhost:50051"
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
echo "   - All services will auto-restart when you save changes"
echo "   - Use Ctrl+C to stop all services"
echo "   - Check logs in each service directory"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill background processes
    if [ ! -z "$AUTH_PID" ]; then
        echo "🛑 Stopping auth-service (PID: $AUTH_PID)..."
        kill -9 $AUTH_PID 2>/dev/null
    fi
    
    # if [ ! -z "$DEVICE_PID" ]; then
    #     echo "🛑 Stopping device-service (PID: $DEVICE_PID)..."
    #     kill -9 $DEVICE_PID 2>/dev/null
    # fi
    
    # if [ ! -z "$SECURITY_PID" ]; then
    #     echo "🛑 Stopping security-service (PID: $SECURITY_PID)..."
    #     kill -9 $SECURITY_PID 2>/dev/null
    # fi
    
    if [ ! -z "$GATEWAY_PID" ]; then
        echo "🛑 Stopping gateway (PID: $GATEWAY_PID)..."
        kill -9 $GATEWAY_PID 2>/dev/null
    fi
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
echo "Press Ctrl+C to stop all services..."
wait 