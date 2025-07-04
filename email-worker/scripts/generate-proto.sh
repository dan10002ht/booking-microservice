#!/bin/bash

# Generate protobuf code for email-worker
echo "🔧 Generating protobuf code..."

# Check if protoc is installed
if ! command -v protoc &> /dev/null; then
    echo "❌ protoc is not installed. Please install Protocol Buffers compiler."
    exit 1
fi

# Check if go-grpc plugin is installed
if ! command -v protoc-gen-go-grpc &> /dev/null; then
    echo "📦 Installing protoc-gen-go-grpc..."
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
fi

# Check if go plugin is installed
if ! command -v protoc-gen-go &> /dev/null; then
    echo "📦 Installing protoc-gen-go..."
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
fi

# Create protos directory if it doesn't exist
mkdir -p protos

# Generate Go code from protobuf
echo "📝 Generating Go code from protobuf files..."

# Generate email verification protobuf
protoc --go_out=. \
       --go_opt=paths=source_relative \
       --go-grpc_out=. \
       --go-grpc_opt=paths=source_relative \
       protos/email_verification.proto

# Generate email service protobuf (if exists)
if [ -f "protos/email_service.proto" ]; then
    protoc --go_out=. \
           --go_opt=paths=source_relative \
           --go-grpc_out=. \
           --go-grpc_opt=paths=source_relative \
           protos/email_service.proto
fi

echo "✅ Protobuf code generated successfully!"
echo "📁 Generated files:"
find protos -name "*.pb.go" -type f 