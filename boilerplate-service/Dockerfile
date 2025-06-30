FROM golang:1.21-alpine AS builder

# Install protobuf compiler
RUN apk add --no-cache protobuf

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o boilerplate-service .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/boilerplate-service .

EXPOSE 8080

CMD ["./boilerplate-service"] 