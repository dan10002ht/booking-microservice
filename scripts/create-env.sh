#!/bin/bash

echo "📋 Creating .env file for email-worker..."

cd email-worker

if [ -f ".env" ]; then
    echo "⚠️  .env file already exists, backing up..."
    cp .env .env.backup
fi

# Create .env file from env.example
cp env.example .env

# Update database configuration for local development
echo "🔧 Updating database configuration..."

# Master database
sed -i 's/DB_MASTER_PORT=55435/DB_MASTER_PORT=55435/' .env
sed -i 's/DB_MASTER_USER=booking_user/DB_MASTER_USER=booking_user/' .env
sed -i 's/DB_MASTER_PASSWORD=booking_pass/DB_MASTER_PASSWORD=booking_pass/' .env

# Slave database
sed -i 's/DB_SLAVE_PORT=55436/DB_SLAVE_PORT=55436/' .env
sed -i 's/DB_SLAVE_USER=booking_user/DB_SLAVE_USER=booking_user/' .env
sed -i 's/DB_SLAVE_PASSWORD=booking_pass/DB_SLAVE_PASSWORD=booking_pass/' .env

# Redis and Kafka
sed -i 's/REDIS_PORT=6379/REDIS_PORT=56379/' .env
sed -i 's/KAFKA_BROKERS=localhost:9092/KAFKA_BROKERS=localhost:59092/' .env

echo "✅ .env file created successfully!"
echo "📁 Location: email-worker/.env"

cd .. 