#!/bin/bash

# Set environment variables for database connection
export DB_MASTER_PASSWORD=booking_pass
export DB_SLAVE_PASSWORD=booking_pass

# Run the email worker
go run main.go 