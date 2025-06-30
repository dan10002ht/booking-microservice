FROM golang:1.23-alpine AS builder

# Install protobuf compiler
RUN apk add --no-cache protobuf

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy protobuf definitions
COPY shared-lib/protos ./protos

# Generate gRPC code
RUN protoc --go_out=. --go-grpc_out=. ./protos/*.proto

# Copy source code
COPY . .

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o email-worker .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/email-worker .

CMD ["./email-worker"] 