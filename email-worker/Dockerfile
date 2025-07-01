# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o email-worker .

# Final stage
FROM alpine:latest

WORKDIR /root/

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder stage
COPY --from=builder /app/email-worker .

# Copy configuration files
COPY --from=builder /app/env.example ./

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Change ownership
RUN chown -R appuser:appgroup /root/

# Switch to non-root user
USER appuser

# Expose port (if needed for health checks)
EXPOSE 8080

# Run the application
CMD ["./email-worker"] 