#!/bin/bash

# Generate Go-specific proto files from shared proto files
# This script creates temporary proto files with go_package options for Go generation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[HEADER]${NC} $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHARED_PROTO_DIR="$PROJECT_ROOT/shared-lib/protos"
TEMP_PROTO_DIR="$PROJECT_ROOT/temp-protos"

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    print_error "protoc is not installed. Please install protobuf-compiler first."
    exit 1
fi

# Check if Go protobuf plugins are installed
if ! command -v protoc-gen-go &> /dev/null; then
    print_warning "protoc-gen-go not found. Installing..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
fi

if ! command -v protoc-gen-go-grpc &> /dev/null; then
    print_warning "protoc-gen-go-grpc not found. Installing..."
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
fi

# Function to add go_package option to proto file
add_go_package_option() {
    local proto_file=$1
    local service_name=$2
    local temp_file="$TEMP_PROTO_DIR/$(basename "$proto_file")"
    
    # Create temp directory if it doesn't exist
    mkdir -p "$TEMP_PROTO_DIR"
    
    # Read the original proto file and add go_package option
    local package_name=""
    local go_package_path=""
    
    # Extract package name from proto file
    package_name=$(grep "^package " "$proto_file" | cut -d' ' -f2 | sed 's/;$//')
    
    # Determine go_package path based on service
    case $service_name in
        "email-worker")
            go_package_path="booking-system/email-worker/internal/protos"
            ;;
        "auth-service")
            go_package_path="booking-system/auth-service/internal/protos"
            ;;
        "booking-service")
            go_package_path="booking-system/booking-service/internal/protos"
            ;;
        "booking-worker")
            go_package_path="booking-system/booking-worker/internal/protos"
            ;;
        "ticket-service")
            go_package_path="booking-system/ticket-service/internal/protos"
            ;;
        "payment-service")
            go_package_path="booking-system/payment-service/internal/protos"
            ;;
        "realtime-service")
            go_package_path="booking-system/realtime-service/internal/protos"
            ;;
        "notification-service")
            go_package_path="booking-system/notification-service/internal/protos"
            ;;
        "invoice-service")
            go_package_path="booking-system/invoice-service/internal/protos"
            ;;
        "analytics-service")
            go_package_path="booking-system/analytics-service/internal/protos"
            ;;
        "event-management")
            go_package_path="booking-system/event-management/internal/protos"
            ;;
        "user-profile")
            go_package_path="booking-system/user-profile/internal/protos"
            ;;
        "pricing-service")
            go_package_path="booking-system/pricing-service/internal/protos"
            ;;
        "support-service")
            go_package_path="booking-system/support-service/internal/protos"
            ;;
        "rate-limiter")
            go_package_path="booking-system/rate-limiter/internal/protos"
            ;;
        *)
            go_package_path="booking-system/$service_name/internal/protos"
            ;;
    esac
    
    # Create temp proto file with go_package option
    {
        # Add syntax and package lines
        head -n 2 "$proto_file"
        echo ""
        echo "option go_package = \"$go_package_path\";"
        echo ""
        # Add the rest of the file (skip first 2 lines)
        tail -n +3 "$proto_file"
    } > "$temp_file"
    
    echo "$temp_file"
}

# Function to generate Go code for a specific service
generate_for_service() {
    local service_name=$1
    local service_dir="$PROJECT_ROOT/$service_name"
    local output_dir="$service_dir/internal/protos"
    
    if [ ! -d "$service_dir" ]; then
        print_warning "Service directory $service_dir does not exist. Skipping..."
        return
    fi
    
    print_status "Generating Go protos for $service_name..."
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Clean up previous temp files
    rm -rf "$TEMP_PROTO_DIR"
    
    # Generate Go code from specific proto files based on service
    if [ "$service_name" = "email-worker" ]; then
        # Only generate email proto for email-worker
        proto_file="$SHARED_PROTO_DIR/email.proto"
        if [ -f "$proto_file" ]; then
            local proto_name=$(basename "$proto_file" .proto)
            print_status "  Generating $proto_name..."
            
            # Create temp proto file with go_package option
            local temp_proto_file=$(add_go_package_option "$proto_file" "$service_name")
            
            # Generate Go code from temp proto file
            protoc \
                --go_out="$output_dir" \
                --go_opt=paths=source_relative \
                --go-grpc_out="$output_dir" \
                --go-grpc_opt=paths=source_relative \
                --proto_path="$TEMP_PROTO_DIR" \
                --proto_path="$SHARED_PROTO_DIR" \
                "$temp_proto_file"
        fi
    else
        # Generate all proto files for other services
        for proto_file in "$SHARED_PROTO_DIR"/*.proto; do
            if [ -f "$proto_file" ]; then
                local proto_name=$(basename "$proto_file" .proto)
                print_status "  Generating $proto_name..."
                
                # Create temp proto file with go_package option
                local temp_proto_file=$(add_go_package_option "$proto_file" "$service_name")
                
                # Generate Go code from temp proto file
                protoc \
                    --go_out="$output_dir" \
                    --go_opt=paths=source_relative \
                    --go-grpc_out="$output_dir" \
                    --go-grpc_opt=paths=source_relative \
                    --proto_path="$TEMP_PROTO_DIR" \
                    --proto_path="$SHARED_PROTO_DIR" \
                    "$temp_proto_file"
            fi
        done
    fi
    
    # Clean up temp files
    rm -rf "$TEMP_PROTO_DIR"
    
    print_status "Generated Go protos for $service_name in $output_dir"
}

# Function to generate for all Go services
generate_all_services() {
    print_status "Generating Go protos for all services..."
    
    # List of Go services (add more as needed)
    local services=(
        "email-worker"
        "auth-service"
        "booking-service"
        "booking-worker"
        "ticket-service"
        "payment-service"
        "realtime-service"
        "notification-service"
        "invoice-service"
        "analytics-service"
        "event-management"
        "user-profile"
        "pricing-service"
        "support-service"
        "rate-limiter"
    )
    
    for service in "${services[@]}"; do
        if [ -d "$PROJECT_ROOT/$service" ] && [ -f "$PROJECT_ROOT/$service/go.mod" ]; then
            generate_for_service "$service"
        fi
    done
}

# Function to clean up temp files
cleanup() {
    if [ -d "$TEMP_PROTO_DIR" ]; then
        rm -rf "$TEMP_PROTO_DIR"
        print_status "Cleaned up temporary proto files"
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

# Main execution
print_header "Go Proto Generation Script"
print_status "Project root: $PROJECT_ROOT"
print_status "Shared proto directory: $SHARED_PROTO_DIR"

if [ $# -eq 0 ]; then
    # No arguments provided, generate for all services
    generate_all_services
elif [ $# -eq 1 ]; then
    # Service name provided
    service_name=$1
    generate_for_service "$service_name"
else
    print_error "Invalid number of arguments"
    print_status "Usage: $0 [service_name]"
    print_status "Examples:"
    print_status "  $0                    # Generate for all services"
    print_status "  $0 email-worker       # Generate for email-worker only"
    exit 1
fi

print_status "Go proto generation completed!" 