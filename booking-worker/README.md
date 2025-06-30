# Booking Worker Service (Go)

**Language:** Go (Golang)

**Why Go?**

- Handles 100k+ concurrent booking requests efficiently
- Goroutines for lightweight concurrency
- High throughput, low latency, easy to scale horizontally

## Overview

The **Booking Worker Service** is designed to handle high-concurrency booking requests by managing a distributed queue for clients attempting to book tickets. With 5,000 tickets and over 100,000 clients, this service ensures fairness, prevents overselling, and provides a smooth user experience by placing clients in a queue and processing their booking requests in order.

## 🎯 Responsibilities

- **Distributed Queue Management**: Place and manage client booking requests in a distributed queue (Redis/Kafka).
- **Fairness & Concurrency Control**: Ensure first-come, first-served processing and prevent overselling.
- **Queue Notifications**: Notify clients of their queue position and status (via WebSocket or polling).
- **Timeout Handling**: Remove clients who do not complete booking in time.
- **Scalability**: Scale horizontally to handle spikes in demand.
- **gRPC Integration**: Communicate with Booking Service, Ticket Service, Realtime Service, and Gateway via gRPC.

## 🏗️ Architecture

### Technology Stack

- **Language**: Go 1.21+
- **Framework**: Go kit / Fiber / Gin (suggested)
- **Queue**: Redis (go-redis) or Kafka (segmentio/kafka-go)
- **gRPC**: google.golang.org/grpc
- **WebSocket**: gorilla/websocket
- **Monitoring**: Prometheus client_golang, Grafana
- **Concurrency**: Goroutines, channels
- **Distributed Locking**: Redlock (go-redsync)

### Key Components

```
Booking Worker Service (Go)
├── Queue Manager (Redis/Kafka)
├── Worker Processor (goroutines)
├── Timeout Handler
├── gRPC Server/Client (protobuf)
├── Realtime Notifier (WebSocket)
├── Metrics Exporter (Prometheus)
└── Health Checker
```

## 🔄 Booking Queue Flow

1. **Client Request**: Client requests to book a ticket via Gateway.
2. **Queue Placement**: Client is placed in a distributed queue (Redis List or Kafka Topic).
3. **Queue Notification**: Client receives their queue position and estimated wait time (via Realtime Service).
4. **Worker Processing**: Booking Worker dequeues requests and processes them one by one:
   - Checks ticket availability (via Ticket Service)
   - Reserves ticket (via Booking Service)
   - Notifies client to proceed with payment
5. **Timeout/Failure Handling**: If client does not complete payment in time, ticket is released and next client is notified.
6. **Completion**: Successful bookings are confirmed and tickets are issued.

## 📡 gRPC APIs

### BookingWorkerService

```protobuf
service BookingWorkerService {
  rpc EnqueueBooking(EnqueueBookingRequest) returns (EnqueueBookingResponse);
  rpc GetQueueStatus(GetQueueStatusRequest) returns (QueueStatusResponse);
  rpc DequeueAndProcess(DequeueRequest) returns (ProcessResult);
  rpc NotifyClient(NotifyRequest) returns (NotifyResponse);
}
```

### Integration Points

- **Booking Service**: Reserve and confirm bookings
- **Ticket Service**: Check and update ticket inventory
- **Realtime Service**: Send queue position and status updates to clients
- **Gateway**: Route booking requests and queue status APIs

## ⚙️ Configuration

### Environment Variables

```bash
# Queue Backend
QUEUE_TYPE=redis # or kafka
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
QUEUE_NAME=booking-queue

# gRPC Endpoints
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_TICKET_SERVICE_URL=ticket-service:50054
GRPC_REALTIME_SERVICE_URL=realtime-service:50055
GRPC_GATEWAY_URL=gateway:50052

# Timeout Settings
BOOKING_TIMEOUT_SECONDS=120
QUEUE_MAX_LENGTH=100000

# Monitoring
PROMETHEUS_PORT=9100
```

## 🚀 Performance & Scalability

- **Horizontal Scaling**: Multiple worker instances can process the queue in parallel (with distributed locking or consumer groups).
- **Atomic Operations**: Use Redis Lua scripts or Kafka consumer groups for atomic dequeue and processing.
- **Backpressure**: If queue is full, new requests are rejected or delayed.
- **Metrics**: Expose queue length, processing rate, and timeout metrics for monitoring.

## 🔐 Security

- **gRPC Authentication**: Use mTLS or JWT for secure inter-service calls.
- **Rate Limiting**: Integrate with Rate Limiter Service to prevent abuse.
- **Audit Logging**: Log all queue and booking operations.

## 🧪 Testing

- **Unit Tests**: Test queue logic, timeout handling, and gRPC endpoints.
- **Integration Tests**: Simulate high concurrency booking scenarios.
- **Load Tests**: Validate performance under 100,000+ concurrent clients.

## 🛠️ Example Redis Queue Schema

- `booking-queue`: Redis List for incoming booking requests
- `booking-timeouts`: Sorted Set for tracking timeouts
- `booking-status:{clientId}`: Hash for per-client status

## 📞 Troubleshooting

- **Queue Stuck**: Check Redis/Kafka health and worker logs
- **Overselling**: Ensure atomic reservation and ticket checks
- **Slow Processing**: Scale out workers, check for bottlenecks

## 🔗 Related Services

- **Booking Service**: Reservation logic
- **Ticket Service**: Inventory management
- **Realtime Service**: Client notifications
- **Gateway**: API routing

## 🧑‍💻 Go Implementation Best Practices

- Use goroutines for concurrent queue processing
- Use channels for internal communication
- Use context for cancellation/timeouts
- Use structured logging (zap, zerolog)
- Use dependency injection for testability
- Use go modules for dependency management
- Write unit and integration tests (testing, testify)

---
