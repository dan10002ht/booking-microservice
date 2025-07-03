#!/bin/bash

# Email Worker Test Runner Script
# This script runs all tests for the email worker service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists go; then
        print_error "Go is not installed. Please install Go 1.21+"
        exit 1
    fi
    
    if ! command_exists docker; then
        print_warning "Docker is not installed. Integration tests will be skipped."
        DOCKER_AVAILABLE=false
    else
        DOCKER_AVAILABLE=true
    fi
    
    print_success "Prerequisites check completed"
}

# Function to install test dependencies
install_dependencies() {
    print_status "Installing test dependencies..."
    
    go mod download
    go mod tidy
    
    print_success "Dependencies installed"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    if [ -d "tests/unit" ]; then
        go test ./tests/unit/... -v -race -coverprofile=coverage_unit.out
        UNIT_TEST_EXIT_CODE=$?
        
        if [ $UNIT_TEST_EXIT_CODE -eq 0 ]; then
            print_success "Unit tests passed"
        else
            print_error "Unit tests failed"
            return $UNIT_TEST_EXIT_CODE
        fi
    else
        print_warning "No unit tests found in tests/unit/"
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        # Start test dependencies
        print_status "Starting test dependencies..."
        
        # Start Redis for testing
        docker run -d --name redis-test -p 6379:6379 redis:7-alpine
        sleep 2
        
        # Start PostgreSQL for testing
        docker run -d --name postgres-test \
            -p 5432:5432 \
            -e POSTGRES_DB=email_worker_test \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=password \
            postgres:15
        sleep 5
        
        # Run migrations
        print_status "Running database migrations..."
        PGPASSWORD=password psql -h localhost -U postgres -d email_worker_test -f database/migrations/001_initial_schema.sql || true
        
        # Run integration tests
        if [ -d "tests/integration" ]; then
            go test ./tests/integration/... -v -race -coverprofile=coverage_integration.out
            INTEGRATION_TEST_EXIT_CODE=$?
            
            if [ $INTEGRATION_TEST_EXIT_CODE -eq 0 ]; then
                print_success "Integration tests passed"
            else
                print_error "Integration tests failed"
            fi
        else
            print_warning "No integration tests found in tests/integration/"
        fi
        
        # Cleanup test dependencies
        print_status "Cleaning up test dependencies..."
        docker stop redis-test postgres-test || true
        docker rm redis-test postgres-test || true
        
        return $INTEGRATION_TEST_EXIT_CODE
    else
        print_warning "Skipping integration tests (Docker not available)"
        return 0
    fi
}

# Function to run benchmarks
run_benchmarks() {
    print_status "Running benchmarks..."
    
    if [ -d "tests/benchmarks" ]; then
        go test ./tests/benchmarks/... -bench=. -benchmem
        BENCHMARK_EXIT_CODE=$?
        
        if [ $BENCHMARK_EXIT_CODE -eq 0 ]; then
            print_success "Benchmarks completed"
        else
            print_error "Benchmarks failed"
            return $BENCHMARK_EXIT_CODE
        fi
    else
        print_warning "No benchmarks found in tests/benchmarks/"
    fi
}

# Function to generate coverage report
generate_coverage_report() {
    print_status "Generating coverage report..."
    
    # Combine coverage files if they exist
    if [ -f "coverage_unit.out" ] && [ -f "coverage_integration.out" ]; then
        go tool cover -func=coverage_unit.out > coverage_report.txt
        echo "" >> coverage_report.txt
        echo "Integration Tests Coverage:" >> coverage_report.txt
        go tool cover -func=coverage_integration.out >> coverage_report.txt
        
        # Generate HTML coverage report
        go tool cover -html=coverage_unit.out -o coverage_unit.html
        go tool cover -html=coverage_integration.out -o coverage_integration.html
        
        print_success "Coverage report generated: coverage_report.txt"
        print_success "HTML reports: coverage_unit.html, coverage_integration.html"
    elif [ -f "coverage_unit.out" ]; then
        go tool cover -func=coverage_unit.out > coverage_report.txt
        go tool cover -html=coverage_unit.out -o coverage_unit.html
        print_success "Unit test coverage report generated"
    elif [ -f "coverage_integration.out" ]; then
        go tool cover -func=coverage_integration.out > coverage_report.txt
        go tool cover -html=coverage_integration.out -o coverage_integration.html
        print_success "Integration test coverage report generated"
    else
        print_warning "No coverage files found"
    fi
}

# Function to run linting
run_linting() {
    print_status "Running linting..."
    
    if command_exists golangci-lint; then
        golangci-lint run ./...
        LINT_EXIT_CODE=$?
        
        if [ $LINT_EXIT_CODE -eq 0 ]; then
            print_success "Linting passed"
        else
            print_error "Linting failed"
            return $LINT_EXIT_CODE
        fi
    else
        print_warning "golangci-lint not found. Skipping linting."
        print_warning "Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"
    fi
}

# Function to run security scanning
run_security_scan() {
    print_status "Running security scan..."
    
    if command_exists gosec; then
        gosec ./...
        SECURITY_EXIT_CODE=$?
        
        if [ $SECURITY_EXIT_CODE -eq 0 ]; then
            print_success "Security scan passed"
        else
            print_warning "Security scan found issues"
        fi
    else
        print_warning "gosec not found. Skipping security scan."
        print_warning "Install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"
    fi
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Remove coverage files
    rm -f coverage_unit.out coverage_integration.out
    
    # Stop any running test containers
    docker stop redis-test postgres-test 2>/dev/null || true
    docker rm redis-test postgres-test 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main function
main() {
    print_status "Starting Email Worker test suite..."
    
    # Parse command line arguments
    RUN_UNIT=true
    RUN_INTEGRATION=true
    RUN_BENCHMARKS=false
    RUN_LINTING=true
    RUN_SECURITY=false
    GENERATE_COVERAGE=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                RUN_UNIT=true
                RUN_INTEGRATION=false
                RUN_BENCHMARKS=false
                shift
                ;;
            --integration-only)
                RUN_UNIT=false
                RUN_INTEGRATION=true
                RUN_BENCHMARKS=false
                shift
                ;;
            --benchmarks)
                RUN_BENCHMARKS=true
                shift
                ;;
            --no-lint)
                RUN_LINTING=false
                shift
                ;;
            --security)
                RUN_SECURITY=true
                shift
                ;;
            --no-coverage)
                GENERATE_COVERAGE=false
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --unit-only        Run only unit tests"
                echo "  --integration-only Run only integration tests"
                echo "  --benchmarks       Run benchmarks"
                echo "  --no-lint          Skip linting"
                echo "  --security         Run security scan"
                echo "  --no-coverage      Skip coverage report generation"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    # Run linting
    if [ "$RUN_LINTING" = true ]; then
        run_linting
    fi
    
    # Run security scan
    if [ "$RUN_SECURITY" = true ]; then
        run_security_scan
    fi
    
    # Run unit tests
    if [ "$RUN_UNIT" = true ]; then
        run_unit_tests
    fi
    
    # Run integration tests
    if [ "$RUN_INTEGRATION" = true ]; then
        run_integration_tests
    fi
    
    # Run benchmarks
    if [ "$RUN_BENCHMARKS" = true ]; then
        run_benchmarks
    fi
    
    # Generate coverage report
    if [ "$GENERATE_COVERAGE" = true ]; then
        generate_coverage_report
    fi
    
    print_success "Test suite completed successfully!"
}

# Run main function
main "$@" 