# Booking Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Transaction, business logic, consistency
- Good for complex workflows, queue integration

## Overview

The Booking Service is the core component of the ticket booking system, responsible for managing ticket reservations, seat allocation, and booking lifecycle. It implements the Saga pattern for distributed transactions and uses Redis for distributed locking to prevent race conditions during high-concurrency booking scenarios.

## 🎯 Responsibilities

- **Ticket Reservation**: Handle ticket booking requests with concurrency control
- **Seat Management**: Manage seat allocation and availability
- **Booking Lifecycle**: Track booking status (pending, confirmed, cancelled)
- **Distributed Transactions**: Implement Saga pattern for booking workflows
- **Inventory Management**: Real-time ticket inventory tracking
- **Booking Validation**: Validate booking rules and constraints
- **Event Publishing**: Publish booking events for other services
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (booking data)
- **Cache**: Redis (distributed locking, caching)
- **Message Queue**: Kafka (event publishing)
- **gRPC**: grpc-java for inter-service communication
- **Distributed Locking**: Redisson
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Booking Service
├── REST API Server
├── gRPC Server
├── Booking Controller
├── Booking Service Layer
├── Saga Orchestrator
├── Distributed Lock Manager
├── Event Publisher
├── Inventory Manager
├── Validation Engine
└── Health Checker
```

## 🔄 Booking Flow

### Standard Booking Flow

```
User Booking Request
    ↓
Input Validation
    ↓
Distributed Lock Acquisition
    ↓
Inventory Check
    ↓
Seat Allocation
    ↓
Booking Creation
    ↓
Payment Saga Initiation
    ↓
Event Publishing
    ↓
Lock Release
    ↓
Return Booking Confirmation
```

### Saga Pattern Implementation

```
Booking Saga
├── Start Booking
├── Reserve Seats
├── Process Payment
├── Send Confirmation
└── Compensate (if needed)
    ├── Release Seats
    ├── Refund Payment
    └── Send Cancellation
```

## 📡 API Endpoints

### Public Endpoints (REST)

```
GET    /bookings/:id              # Get booking details
POST   /bookings                  # Create new booking
PUT    /bookings/:id              # Update booking
DELETE /bookings/:id              # Cancel booking
GET    /bookings/user/:userId     # Get user bookings
POST   /bookings/:id/confirm      # Confirm booking
POST   /bookings/:id/cancel       # Cancel booking
```

### gRPC Services (Internal)

```
booking.BookingService
├── CreateBooking(CreateBookingRequest) returns (CreateBookingResponse)
├── GetBooking(GetBookingRequest) returns (GetBookingResponse)
├── UpdateBooking(UpdateBookingRequest) returns (UpdateBookingResponse)
├── CancelBooking(CancelBookingRequest) returns (CancelBookingResponse)
├── GetUserBookings(GetUserBookingsRequest) returns (GetUserBookingsResponse)
├── ConfirmBooking(ConfirmBookingRequest) returns (ConfirmBookingResponse)
├── ReserveSeats(ReserveSeatsRequest) returns (ReserveSeatsResponse)
└── ReleaseSeats(ReleaseSeatsRequest) returns (ReleaseSeatsResponse)

booking.InventoryService
├── CheckAvailability(CheckAvailabilityRequest) returns (CheckAvailabilityResponse)
├── GetEventInventory(GetEventInventoryRequest) returns (GetEventInventoryResponse)
├── UpdateInventory(UpdateInventoryRequest) returns (UpdateInventoryResponse)
└── LockSeats(LockSeatsRequest) returns (LockSeatsResponse)
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate tokens from gRPC metadata
- **Role-based Access**: Different permissions for users and admins
- **Booking Ownership**: Users can only access their own bookings
- **Audit Logging**: Track all booking operations

### Concurrency Control

- **Distributed Locking**: Redis-based locks for seat allocation
- **Optimistic Locking**: Version-based concurrency control
- **Pessimistic Locking**: Database-level row locks
- **Deadlock Prevention**: Timeout-based lock release

### Data Integrity

- **ACID Transactions**: Database transaction management
- **Saga Compensation**: Rollback mechanisms for failures
- **Event Sourcing**: Audit trail of all changes
- **Idempotency**: Prevent duplicate bookings

## 📊 Database Schema

### Bookings Table

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    seat_count INTEGER NOT NULL,
    seats JSONB NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    expires_at TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);
```

### Booking Items Table

```sql
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    seat_numbers TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8080
GRPC_PORT=50053
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/booking_db
SPRING_DATASOURCE_USERNAME=booking_user
SPRING_DATASOURCE_PASSWORD=booking_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=0

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_BOOKING_EVENTS=booking-events
KAFKA_TOPIC_PAYMENT_EVENTS=payment-events
KAFKA_GROUP_ID=booking-service

# gRPC Configuration
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000
GRPC_TLS_ENABLED=true
GRPC_TLS_CERT_PATH=/etc/grpc/certs/server.crt
GRPC_TLS_KEY_PATH=/etc/grpc/certs/server.key

# Booking Configuration
BOOKING_EXPIRY_MINUTES=15
SEAT_LOCK_TIMEOUT_SECONDS=300
MAX_SEATS_PER_BOOKING=10
BOOKING_CONFIRMATION_TIMEOUT_MINUTES=30
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Booking Cache**: Cache active bookings in Redis
- **Inventory Cache**: Cache seat availability
- **User Bookings Cache**: Cache user booking history
- **Event Cache**: Cache event information

### Database Optimization

- **Connection Pooling**: HikariCP connection pool
- **Indexes**: Composite indexes for queries
- **Read Replicas**: For read-heavy operations
- **Partitioning**: Partition by event_id or date

### Concurrency Optimization

- **Distributed Locking**: Redis-based locks
- **Connection Pooling**: Optimize database connections
- **Async Processing**: Non-blocking operations
- **Batch Operations**: Batch database operations

## 📊 Monitoring & Observability

### Metrics

- **Booking Rate**: Bookings per minute
- **Success Rate**: Successful vs failed bookings
- **Response Time**: Average booking response time
- **Lock Contention**: Seat lock conflicts
- **Saga Success Rate**: Saga completion rate
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Booking Logs**: All booking operations
- **Saga Logs**: Saga execution steps
- **Error Logs**: Booking failures and errors
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache and lock connectivity
- **Kafka Health**: Message queue connectivity
- **gRPC Health**: gRPC health check protocol

## 🧪 Testing

### Unit Tests

```bash
./mvnw test
```

### Integration Tests

```bash
./mvnw test -Dtest=IntegrationTest
```

### gRPC Tests

```bash
./mvnw test -Dtest=GrpcTest
```

### Load Tests

```bash
./mvnw test -Dtest=LoadTest
```

## 🚀 Deployment

### Docker

```dockerfile
FROM openjdk:17-jdk-slim

# Install protobuf compiler
RUN apt-get update && apt-get install -y protobuf-compiler

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Copy protobuf definitions
COPY shared-lib/protos ./protos

# Generate gRPC code
RUN ./mvnw grpc:generate

# Copy source code
COPY src ./src

# Build application
RUN ./mvnw clean package -DskipTests

EXPOSE 8080 50053

CMD ["java", "-jar", "target/booking-service.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: booking-service
  template:
    metadata:
      labels:
        app: booking-service
    spec:
      containers:
        - name: booking
          image: booking-system/booking-service:latest
          ports:
            - containerPort: 8080
            - containerPort: 50053
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: booking-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
          volumeMounts:
            - name: grpc-certs
              mountPath: /etc/grpc/certs
              readOnly: true
      volumes:
        - name: grpc-certs
          secret:
            secretName: grpc-tls-certs
```

## 🔄 Saga Implementation

### Booking Saga Steps

```java
@Component
public class BookingSaga {

    @SagaStart
    public BookingResponse createBooking(CreateBookingRequest request) {
        // Step 1: Reserve seats
        SeatReservationResponse seatResponse = seatService.reserveSeats(request);

        // Step 2: Create booking
        Booking booking = bookingService.createBooking(request, seatResponse);

        // Step 3: Initiate payment
        PaymentResponse paymentResponse = paymentService.processPayment(booking);

        // Step 4: Confirm booking
        if (paymentResponse.isSuccess()) {
            bookingService.confirmBooking(booking.getId());
            eventPublisher.publishBookingConfirmed(booking);
        } else {
            // Compensation: Release seats
            seatService.releaseSeats(seatResponse.getSeatIds());
            bookingService.cancelBooking(booking.getId());
        }

        return new BookingResponse(booking, paymentResponse);
    }
}
```

## 🛡️ Security Best Practices

### Input Validation

- **Request Validation**: Validate all input parameters
- **Business Rules**: Enforce booking constraints
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

### Concurrency Control

- **Distributed Locking**: Prevent race conditions
- **Optimistic Locking**: Handle concurrent updates
- **Timeout Management**: Release locks on timeout
- **Deadlock Prevention**: Use timeout-based locks

### Data Integrity

- **ACID Transactions**: Ensure data consistency
- **Saga Compensation**: Handle partial failures
- **Event Sourcing**: Maintain audit trail
- **Idempotency**: Prevent duplicate operations

## 📞 Troubleshooting

### Common Issues

1. **Seat Lock Conflicts**: Check lock timeout settings
2. **Saga Failures**: Monitor compensation actions
3. **Database Connection**: Verify connection pool settings
4. **Redis Connectivity**: Check Redis service health
5. **gRPC Connection**: Verify service endpoints

### Debug Commands

```bash
# Check service health
curl http://booking-service:8080/actuator/health

# Test gRPC connectivity
grpcurl -plaintext booking-service:50053 list

# Check Redis locks
redis-cli keys "*lock*"

# Monitor Kafka messages
kafka-console-consumer --bootstrap-server kafka:9092 --topic booking-events
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and validation
- **Ticket Service**: Event and ticket information
- **Payment Service**: Payment processing
- **Notification Service**: Booking confirmations

### Infrastructure

- **PostgreSQL**: Booking data storage
- **Redis**: Distributed locking and caching
- **Kafka**: Event publishing and messaging
- **Protocol Buffers**: Message serialization

## 🆕 Integration with Booking Worker Service (Go)

The Booking Service integrates with the **Booking Worker Service** (written in Go) for high-performance, concurrent queue handling:

- **Go-based Queue**: Booking Worker uses Go's goroutines and channels for efficient queue processing.
- **gRPC Communication**: Booking Worker (Go) communicates with Booking Service for ticket reservation and status updates.

### Booking Flow with Queue

1. **Client requests booking** → 2. **Booking Worker queues request** → 3. **Booking Service reserves ticket** → 4. **Client notified to pay** → 5. **On success, ticket issued; on timeout, next client is served**
