# Payment Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Secure transactions, payment gateway integration
- Rollback, audit, compliance

## Overview

The Payment Service handles all payment processing operations including payment gateway integrations, transaction management, refunds, and payment status tracking. It ensures idempotency and implements robust error handling for financial transactions.

## 🎯 Responsibilities

- **Payment Processing**: Handle payments through multiple gateways (Stripe, PayPal, etc.)
- **Transaction Management**: Track payment status and history
- **Refund Processing**: Handle partial and full refunds
- **Idempotency**: Ensure payment operations are idempotent
- **Payment Validation**: Validate payment methods and amounts
- **Webhook Handling**: Process payment gateway webhooks
- **Fraud Detection**: Basic fraud detection and prevention
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (payment data)
- **Cache**: Redis (idempotency keys, payment status)
- **Message Queue**: Kafka (payment events)
- **gRPC**: grpc-java for inter-service communication
- **Payment Gateways**: Stripe, PayPal, local payment methods
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Payment Service
├── REST API Server
├── gRPC Server
├── Payment Controller
├── Payment Service Layer
├── Gateway Adapters
├── Idempotency Manager
├── Webhook Handler
├── Fraud Detection
├── Transaction Manager
└── Health Checker
```

## 🔄 Payment Flow

### Standard Payment Flow

```
Payment Request
    ↓
Idempotency Check
    ↓
Payment Validation
    ↓
Gateway Selection
    ↓
Payment Processing
    ↓
Transaction Recording
    ↓
Event Publishing
    ↓
Response to Client
```

### Refund Flow

```
Refund Request
    ↓
Transaction Lookup
    ↓
Refund Validation
    ↓
Gateway Refund
    ↓
Refund Recording
    ↓
Event Publishing
    ↓
Response to Client
```

### Webhook Processing Flow

```
Gateway Webhook
    ↓
Signature Verification
    ↓
Event Processing
    ↓
Status Update
    ↓
Event Publishing
    ↓
Response to Gateway
```

## 📡 API Endpoints

### Public Endpoints (REST)

```
POST   /payments                  # Process payment
GET    /payments/:id              # Get payment details
POST   /payments/:id/refund       # Process refund
GET    /payments/:id/status       # Get payment status
POST   /webhooks/stripe           # Stripe webhook
POST   /webhooks/paypal           # PayPal webhook
GET    /payments/methods          # Get available payment methods
```

### gRPC Services (Internal)

```
payment.PaymentService
├── ProcessPayment(ProcessPaymentRequest) returns (ProcessPaymentResponse)
├── GetPayment(GetPaymentRequest) returns (GetPaymentResponse)
├── ProcessRefund(ProcessRefundRequest) returns (ProcessRefundResponse)
├── GetPaymentStatus(GetPaymentStatusRequest) returns (GetPaymentStatusResponse)
├── ValidatePaymentMethod(ValidatePaymentMethodRequest) returns (ValidatePaymentMethodResponse)
├── GetPaymentMethods(GetPaymentMethodsRequest) returns (GetPaymentMethodsResponse)
└── CancelPayment(CancelPaymentRequest) returns (CancelPaymentResponse)

payment.WebhookService
├── ProcessStripeWebhook(StripeWebhookRequest) returns (WebhookResponse)
├── ProcessPayPalWebhook(PayPalWebhookRequest) returns (WebhookResponse)
└── ProcessLocalWebhook(LocalWebhookRequest) returns (WebhookResponse)

payment.HealthService
└── Check(HealthCheckRequest) returns (HealthCheckResponse)
```

## 🔐 Security Features

### Payment Security

- **PCI Compliance**: Secure handling of payment data
- **Tokenization**: Store payment tokens instead of raw data
- **Encryption**: Encrypt sensitive payment information
- **Signature Verification**: Verify webhook signatures

### Idempotency

- **Idempotency Keys**: Unique keys for each payment request
- **Request Deduplication**: Prevent duplicate payments
- **State Management**: Track payment state transitions
- **Conflict Resolution**: Handle concurrent payment requests

### Fraud Prevention

- **Amount Validation**: Validate payment amounts
- **Currency Validation**: Ensure correct currency
- **Rate Limiting**: Prevent payment abuse
- **Suspicious Activity Detection**: Flag unusual patterns

## 📊 Database Schema

### Payments Table

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    metadata JSONB,
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Refunds Table

```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    reason VARCHAR(100),
    gateway_refund_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Payment Methods Table

```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    token VARCHAR(255) NOT NULL,
    last_four VARCHAR(4),
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8081
GRPC_PORT=50054
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/payment_db
SPRING_DATASOURCE_USERNAME=payment_user
SPRING_DATASOURCE_PASSWORD=payment_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=1

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_PAYMENT_EVENTS=payment-events
KAFKA_TOPIC_REFUND_EVENTS=refund-events
KAFKA_GROUP_ID=payment-service

# gRPC Configuration
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000
GRPC_TLS_ENABLED=true
GRPC_TLS_CERT_PATH=/etc/grpc/certs/server.crt
GRPC_TLS_KEY_PATH=/etc/grpc/certs/server.key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_MODE=sandbox

# Payment Configuration
PAYMENT_TIMEOUT_SECONDS=300
MAX_PAYMENT_AMOUNT=10000.00
MIN_PAYMENT_AMOUNT=0.01
SUPPORTED_CURRENCIES=USD,EUR,GBP,JPY
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Payment Status Cache**: Cache payment status in Redis
- **Idempotency Cache**: Fast idempotency key lookups
- **Payment Methods Cache**: Cache user payment methods
- **Gateway Status Cache**: Cache gateway health status

### Database Optimization

- **Connection Pooling**: HikariCP connection pool
- **Indexes**: Composite indexes for queries
- **Read Replicas**: For read-heavy operations
- **Partitioning**: Partition by date or user_id

### Payment Gateway Optimization

- **Connection Pooling**: Reuse gateway connections
- **Timeout Management**: Handle slow gateway responses
- **Retry Logic**: Exponential backoff for failures
- **Circuit Breaker**: Prevent cascade failures

## 📊 Monitoring & Observability

### Metrics

- **Payment Success Rate**: Successful vs failed payments
- **Payment Volume**: Total payment amount per time period
- **Gateway Performance**: Response times per gateway
- **Refund Rate**: Refund percentage
- **Error Rates**: Payment failure rates
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Payment Logs**: All payment operations
- **Webhook Logs**: Gateway webhook processing
- **Error Logs**: Payment failures and errors
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **Gateway Health**: Payment gateway connectivity
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

### Payment Gateway Tests

```bash
./mvnw test -Dtest=GatewayTest
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

EXPOSE 8081 50054

CMD ["java", "-jar", "target/payment-service.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
        - name: payment
          image: booking-system/payment-service:latest
          ports:
            - containerPort: 8081
            - containerPort: 50054
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: payment-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: STRIPE_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: payment-secrets
                  key: stripe-secret-key
          volumeMounts:
            - name: grpc-certs
              mountPath: /etc/grpc/certs
              readOnly: true
      volumes:
        - name: grpc-certs
          secret:
            secretName: grpc-tls-certs
```

## 🔄 Payment Gateway Integration

### Stripe Integration

```

```
