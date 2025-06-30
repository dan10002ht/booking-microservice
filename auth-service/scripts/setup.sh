#!/bin/bash

# Auth Service Setup Script

echo "🚀 Setting up Auth Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials and other settings"
    echo "   Then run this script again"
    exit 0
fi

# Load environment variables
source .env

# Create database if it doesn't exist
echo "🗄️  Setting up database..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists or creation failed"

# Run migrations
echo "🔄 Running database migrations..."
npm run migrate:latest

# Run seeds
echo "🌱 Seeding initial data..."
npm run seed:run

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 Auth Service is ready to run!"
echo ""
echo "To start the service:"
echo "  npm run dev:local"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@bookingsystem.com"
echo "  Password: admin123"
echo ""
echo "gRPC Service:"
echo "  Port: 50051"
echo "  Proto file: src/proto/auth.proto"
echo ""
echo "Available gRPC methods:"
echo "  • Register"
echo "  • Login"
echo "  • OAuthLogin"
echo "  • RefreshToken"
echo "  • Logout"
echo "  • VerifyToken"
echo "  • GetUserPermissions"
echo "  • GetUser"
echo "  • UpdateUser"
echo "  • DeleteUser"
echo "  • ForgotPassword"
echo "  • ResetPassword"
echo "  • SendVerificationEmail"
echo "  • VerifyEmail"
echo "  • HealthCheck"
echo ""
echo "Happy coding! 🚀" 