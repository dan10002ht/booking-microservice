# Makefile for booking-system project

.PHONY: help proto-gen proto-gen-all proto-gen-service build test clean

# Default target
help:
	@echo "Available commands:"
	@echo "  proto-gen-all     - Generate Go protos for all services"
	@echo "  proto-gen-service - Generate Go protos for a specific service (usage: make proto-gen-service SERVICE=email-worker)"
	@echo "  build            - Build all Go services"
	@echo "  test             - Run tests for all services"
	@echo "  clean            - Clean generated files"
	@echo ""
	@echo "Note: JS services load proto files directly from shared-lib/protos"
	@echo "      Go services use generated code with go_package options"

# Generate Go protos for all services
proto-gen-all:
	@echo "Generating Go protos for all services..."
	@chmod +x scripts/generate-go-protos.sh
	@./scripts/generate-go-protos.sh

# Generate Go protos for a specific service
proto-gen-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: SERVICE parameter is required. Usage: make proto-gen-service SERVICE=email-worker"; \
		exit 1; \
	fi
	@echo "Generating Go protos for $(SERVICE)..."
	@chmod +x scripts/generate-go-protos.sh
	@./scripts/generate-go-protos.sh $(SERVICE)

# Build all Go services
build:
	@echo "Building all Go services..."
	@for service in */go.mod; do \
		if [ -f "$$service" ]; then \
			service_dir=$$(dirname "$$service"); \
			echo "Building $$service_dir..."; \
			cd "$$service_dir" && go build ./... && cd - > /dev/null; \
		fi; \
	done

# Run tests for all services
test:
	@echo "Running tests for all services..."
	@for service in */go.mod; do \
		if [ -f "$$service" ]; then \
			service_dir=$$(dirname "$$service"); \
			echo "Testing $$service_dir..."; \
			cd "$$service_dir" && go test ./... && cd - > /dev/null; \
		fi; \
	done

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	@find . -name "*.pb.go" -type f -delete
	@find . -name "*.pb.gw.go" -type f -delete
	@find . -name "*.swagger.json" -type f -delete
	@echo "Cleaned generated files"

# Install dependencies for all services
deps:
	@echo "Installing dependencies for all services..."
	@for service in */go.mod; do \
		if [ -f "$$service" ]; then \
			service_dir=$$(dirname "$$service"); \
			echo "Installing deps for $$service_dir..."; \
			cd "$$service_dir" && go mod tidy && cd - > /dev/null; \
		fi; \
	done

# Format code for all services
fmt:
	@echo "Formatting code for all services..."
	@for service in */go.mod; do \
		if [ -f "$$service" ]; then \
			service_dir=$$(dirname "$$service"); \
			echo "Formatting $$service_dir..."; \
			cd "$$service_dir" && go fmt ./... && cd - > /dev/null; \
		fi; \
	done

# Lint code for all services
lint:
	@echo "Linting code for all services..."
	@for service in */go.mod; do \
		if [ -f "$$service" ]; then \
			service_dir=$$(dirname "$$service"); \
			echo "Linting $$service_dir..."; \
			cd "$$service_dir" && golangci-lint run && cd - > /dev/null; \
		fi; \
	done 