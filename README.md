# 🎟️ Event Ticket Booking System - Microservices Architecture

## 🎯 System Overview

A high-performance event ticket booking system built with microservices architecture designed for scalability, consistency, and high availability. The system supports:

- **100,000+ concurrent users** with response time < 200ms
- **Real-time updates** for users about ticket availability
- **Eventual consistency** with strong consistency for critical operations
- **Horizontal scaling** for all services
- **Fault tolerance** with circuit breakers and retry mechanisms
- **Advanced security** with device management and threat detection

## 🏗️ Architecture Overview

### Core Principles

- **Event-Driven Architecture** with Redis Pub/Sub and Kafka
- **CQRS Pattern** for booking and ticket services
- **Saga Pattern** for distributed transactions
- **Circuit Breaker Pattern** for inter-service communication
- **gRPC Communication** for high-performance inter-service calls
- **Rate Limiting** and **Load Balancing** at gateway level
- **Security-First Design** with comprehensive threat detection

### Technology Stack

- **API Gateway**: Node.js (Express) + Redis + gRPC client
- **Authentication**: Node.js + JWT + Redis + gRPC server
- **Device Management**: Node.js + Redis + PostgreSQL + gRPC server (internal only)
- **Security Monitoring**: Node.js + Elasticsearch + Redis + gRPC server (internal only)
- **Booking Engine**: Java (Spring Boot) + Redis + PostgreSQL + gRPC
- **Payment Processing**: Java + Stripe/PayPal integration + gRPC
- **Real-time**: Node.js + WebSocket + Redis Pub/Sub
- **Message Queue**: Redis Queue + Kafka (for high throughput)
- **Database**: PostgreSQL (primary) + Redis (cache) + Elasticsearch (logs)
- **Inter-Service Communication**: gRPC (high performance) + REST (external APIs)
- **Monitoring**: Prometheus + Grafana + ELK Stack

## 🔄 System Flow

### 1. User Authentication Flow

```
User → Gateway → Auth Service (gRPC) → Device Service (gRPC) → Security Service (gRPC) → JWT Token → User Session
```

### 2. Security Monitoring Flow

```
All Services → Security Service (gRPC) → Threat Detection → Alert System → Notification Service
```

### 3. Device Management Flow

```
User Login → Device Service (gRPC) → Device Recognition → Session Management → Security Validation
```

### 4. Ticket Booking Flow (Critical Path)

```
User → Gateway → Rate Limiter → Ticket Service (gRPC) → Booking Service (gRPC) → Payment Service (gRPC) → Notification Service (gRPC)
```

### 5. Real-time Updates Flow

```
Booking Service → Redis Pub/Sub → Realtime Service → WebSocket → User Browser
```

### 6. Background Processing Flow

```
Booking Service → Kafka → Email Worker → Invoice Service (gRPC) → Notification Service (gRPC)
```

## 📁 Service Architecture

### Core Services (Critical Path)

- **gateway/**: API Gateway with rate limiting, load balancing, and gRPC client
- **auth-service/**: Authentication and authorization with gRPC server
- **device-service/**: Device management and session control with gRPC server
- **security-service/**: Threat detection and security monitoring with gRPC server
- **ticket-service/**: Public ticket APIs with caching and gRPC server
- **booking-service/**: Core booking logic with Redis locking and gRPC server
- **payment-service/**: Payment processing with idempotency and gRPC server

### Supporting Services

- **realtime-service/**: WebSocket server for real-time updates
- **notification-service/**: Multi-channel notifications with gRPC server
- **email-worker/**: Background email processing with gRPC client
- **invoice-service/**: PDF invoice generation with gRPC server
- **analytics-service/**: User behavior tracking with gRPC server
- **event-management/**: Admin CRUD operations with gRPC server
- **user-profile/**: User account management with gRPC server
- **pricing-service/**: Dynamic pricing algorithms with gRPC server
- **support-service/**: Customer support system with gRPC server
- **rate-limiter/**: Distributed rate limiting

### Infrastructure

- **shared-lib/**: Shared DTOs, schemas, utilities, and gRPC protobuf definitions
- **deploy/**: Docker, Kubernetes, CI/CD configs

## 🔐 Security & Consistency Patterns

### Data Consistency

- **Strong Consistency**: Booking operations, payment processing, security events
- **Eventual Consistency**: Analytics, notifications, user preferences
- **Saga Pattern**: Distributed transactions across services
- **Outbox Pattern**: Reliable event publishing

### Security Measures

- **JWT Authentication** with refresh tokens
- **Device Management** with device fingerprinting and trust levels
- **Threat Detection** with real-time security monitoring
- **Session Control** with granular device management
- **Rate Limiting** per user/IP/device
- **Input Validation** and sanitization
- **HTTPS/TLS** encryption
- **gRPC TLS** for inter-service communication
- **Database Encryption** at rest
- **Audit Logging** for sensitive operations
- **Suspicious Activity Detection** with machine learning

### Scalability Patterns

- **Horizontal Scaling**: All services can scale independently
- **Load Balancing**: Round-robin with health checks
- **gRPC Load Balancing**: Client-side load balancing
- **Caching Strategy**: Redis cache with TTL
- **Database Sharding**: By event ID or user ID
- **CDN**: Static content delivery

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: Efficient binary serialization
- **HTTP/2**: Multiplexing and compression
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code
- **Connection Reuse**: Persistent connections

### Caching Strategy

- **L1 Cache**: In-memory cache within each service
- **L2 Cache**: Redis distributed cache
- **CDN**: Static assets and event images

### Database Optimization

- **Read Replicas**: For read-heavy operations
- **Connection Pooling**: Optimized database connections
- **Indexing Strategy**: Composite indexes for queries
- **Partitioning**: Large tables by time/event

### Queue Management

- **Priority Queues**: Critical operations (booking, payment)
- **Dead Letter Queues**: Failed message handling
- **Batch Processing**: Analytics and reporting

## 📊 Monitoring & Observability

### Metrics Collection

- **Application Metrics**: Response time, error rates, throughput
- **gRPC Metrics**: Request/response counts, latency
- **Business Metrics**: Booking success rate, revenue, user engagement
- **Infrastructure Metrics**: CPU, memory, disk, network

### Logging Strategy

- **Structured Logging**: JSON format with correlation IDs
- **Centralized Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL

### Tracing

- **Distributed Tracing**: Jaeger for request tracing
- **gRPC Tracing**: Automatic tracing for gRPC calls
- **Correlation IDs**: Track requests across services
- **Performance Profiling**: Identify bottlenecks

## 🔧 Development & Deployment

### Local Development

```bash
# Start infrastructure services
docker-compose -f deploy/docker-compose.dev.yml up -d

# Generate gRPC code
npm run grpc:generate

# Start all services
npm run dev:all

# Run tests
npm run test:all
```

### Production Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f deploy/k8s/

# Monitor deployment
kubectl get pods -n booking-system
```

### CI/CD Pipeline

- **Build**: Docker image building with multi-stage builds
- **gRPC Code Generation**: Generate protobuf code
- **Test**: Unit tests, integration tests, E2E tests
- **Security**: Vulnerability scanning, dependency checks
- **Deploy**: Blue-green deployment with rollback capability

## 📈 Scaling Strategy

### Horizontal Scaling

- **Auto-scaling**: Kubernetes HPA based on CPU/memory
- **Load Distribution**: Round-robin with health checks
- **gRPC Load Balancing**: Client-side load balancing
- **Database Scaling**: Read replicas and sharding

### Vertical Scaling

- **Resource Optimization**: Memory and CPU tuning
- **Database Optimization**: Query optimization, indexing
- **Caching**: Multi-level caching strategy

## 🛡️ Disaster Recovery

### Backup Strategy

- **Database Backups**: Daily automated backups
- **Configuration Backups**: Infrastructure as Code
- **Data Replication**: Cross-region replication

### Failover Strategy

- **Multi-region Deployment**: Active-active setup
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Core functionality preservation

## 📋 Service Status

| Service              | Status      | Language | Database   | Cache | gRPC   |
| -------------------- | ----------- | -------- | ---------- | ----- | ------ |
| Gateway              | 🟡 Planning | Node.js  | -          | Redis | Client |
| Auth Service         | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Device Service       | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Security Service     | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Ticket Service       | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Booking Service      | 🟡 Planning | Java     | PostgreSQL | Redis | Server |
| Payment Service      | 🟡 Planning | Java     | PostgreSQL | Redis | Server |
| Realtime Service     | 🟡 Planning | Node.js  | -          | Redis | -      |
| Notification Service | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Email Worker         | 🟡 Planning | Java     | PostgreSQL | Redis | Client |
| Invoice Service      | 🟡 Planning | Java     | PostgreSQL | -     | Server |
| Analytics Service    | 🟡 Planning | Java     | PostgreSQL | Redis | Server |
| Event Management     | 🟡 Planning | Java     | PostgreSQL | Redis | Server |
| User Profile         | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Pricing Service      | 🟡 Planning | Java     | PostgreSQL | Redis | Server |
| Support Service      | 🟡 Planning | Node.js  | PostgreSQL | Redis | Server |
| Rate Limiter         | 🟡 Planning | Node.js  | -          | Redis | -      |

## 🎯 Next Steps

1. **Phase 1**: Setup infrastructure and core services (Gateway, Auth, Ticket)
2. **Phase 2**: Implement booking engine and payment processing
3. **Phase 3**: Add real-time features and background processing
4. **Phase 4**: Implement analytics and monitoring
5. **Phase 5**: Performance optimization and scaling

## 📞 Support

- **Documentation**: Each service has its own README
- **API Documentation**: OpenAPI/Swagger specs for external APIs
- **gRPC Documentation**: Protocol buffer definitions
- **Troubleshooting**: Service-specific troubleshooting guides

## 🆕 Booking Worker Service (Go)

### Overview

The **Booking Worker Service** is implemented in **Go (Golang)** for maximum concurrency and performance. Go's goroutines and channels make it ideal for handling high-throughput booking queues, ensuring fairness and efficiency for 100,000+ clients.

### Key Features (Go-specific)

- **Goroutines**: Lightweight concurrency for processing thousands of queue jobs in parallel
- **Channels**: Safe communication between worker routines
- **High Performance**: Minimal latency and high throughput
- **Go Libraries**: go-redis, segmentio/kafka-go, grpc-go, gorilla/websocket

### Booking Flow with Queue

1. **Client Request**: Client requests to book a ticket.
2. **Queue Placement**: Client is placed in a distributed queue (e.g., Redis List, Kafka Topic).
3. **Queue Notification**: Client receives their queue position and estimated wait time.
4. **Worker Processing**: Booking Worker dequeues requests and processes them one by one:
   - Checks ticket availability
   - Reserves ticket
   - Notifies client to proceed with payment
5. **Timeout/Failure Handling**: If client does not complete payment in time, ticket is released and next client is notified.
6. **Completion**: Successful bookings are confirmed and tickets are issued.

### Technologies

- **Redis**: For fast, distributed queue management
- **Kafka**: For event-driven queueing and scaling
- **gRPC**: For inter-service communication
- **WebSocket**: For real-time queue updates to clients
- **Spring Boot**: Service implementation

### Related Services

- **Booking Service**: Handles booking logic and ticket reservation
- **Ticket Service**: Manages ticket inventory
- **Realtime Service**: Sends real-time updates to clients

## 🆕 Check-in Service

### Overview

The **Check-in Service** is responsible for validating tickets and processing check-in events when users attend events. It ensures that only valid tickets are used, prevents double check-in, and integrates with analytics and notification services for real-time updates and reporting.

### Key Features

- **Ticket Validation**: Verifies ticket authenticity and status (used/unused, valid/invalid)
- **Check-in Event**: Records check-in time, location, and staff
- **Integration**: Communicates with Ticket Service (for ticket status), Analytics Service (for attendance data), and Notification Service (for check-in confirmations)
- **Security**: Authenticates staff and protects check-in APIs
- **Real-time Updates**: Optionally notifies event organizers or users upon check-in

### Typical Flow

1. **Staff scans ticket** (QR/barcode)
2. **Check-in Service** validates ticket via Ticket Service
3. **If valid**: marks ticket as used, records check-in event, notifies analytics/notification
4. **If invalid**: returns error (already used, invalid, etc.)

### Related Services

- **Ticket Service**: Ticket status and updates
- **Analytics Service**: Attendance and event stats
- **Notification Service**: Check-in confirmations
- **Auth Service**: Staff authentication

## 🗂️ Service Language Mapping & Flow

| Service              | Language | Rationale/Strengths                                              |
| -------------------- | -------- | ---------------------------------------------------------------- |
| gateway              | Node.js  | Fast I/O, API Gateway, easy middleware, real-time integration    |
| auth-service         | Node.js  | JWT, OAuth2, rapid development, easy integration                 |
| device-service       | Node.js  | Device management, session control, security integration         |
| security-service     | Node.js  | Threat detection, security monitoring, real-time alerts          |
| user-profile         | Node.js  | CRUD, preferences, easy frontend integration                     |
| event-management     | Node.js  | Event/venue CRUD, media, search                                  |
| realtime-service     | Node.js  | WebSocket, real-time, pub/sub, fast push                         |
| notification-service | Go       | High performance, concurrent notification delivery, retry, scale |
| email-worker         | Go       | Max performance for bulk email, goroutines, queue, retry         |
| support-service      | Node.js  | Ticket, chat, knowledge base, easy WebSocket integration         |
| checkin-service      | Go       | Real-time check-in, validate tickets, scale for large events     |
| booking-worker       | Go       | High-concurrency queue, 100k+ clients, goroutines, scale         |
| booking-service      | Java     | Transaction, business logic, consistency                         |
| ticket-service       | Java     | Inventory, concurrency, atomic updates                           |
| payment-service      | Java     | Secure transactions, payment gateway integration                 |
| pricing-service      | Java     | Dynamic pricing, rule engine, promotions                         |
| invoice-service      | Java     | Invoice, PDF, compliance, audit                                  |
| analytics-service    | Java     | Big data, ETL, reporting, Kafka, ClickHouse                      |
| rate-limiter         | Java     | Distributed rate limiting, Redis/Kafka, API protection           |

### Booking Flow (with language)

1. **gateway (Node.js)** → 2. **booking-worker (Go)** → 3. **booking-service (Java)** → 4. **ticket-service (Java)** → 5. **payment-service (Java)** → 6. **notification-service (Go)** + **email-worker (Go)**

### Check-in Flow (with language)

1. **checkin-service (Go)** → 2. **ticket-service (Java)** → 3. **analytics-service (Java)** → 4. **notification-service (Go)**

## 🏗️ Infrastructure Setup (Local Development)

### 1. Start Core Infrastructure

```bash
cd deploy
# Start all core infrastructure services
# (PostgreSQL, Redis, Kafka, Prometheus, Grafana, Elasticsearch, Kibana)
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Included Services

| Service       | Port(s) | Description                              |
| ------------- | ------- | ---------------------------------------- |
| PostgreSQL    | 5432    | Main relational database                 |
| Redis         | 6379    | Cache, pub/sub, queue, rate limiting     |
| Zookeeper     | 2181    | Kafka coordination                       |
| Kafka         | 9092    | Event/message queue for async processing |
| Prometheus    | 9090    | Metrics collection                       |
| Grafana       | 3000    | Metrics dashboard/visualization          |
| Elasticsearch | 9200    | Centralized log storage                  |
| Kibana        | 5601    | Log visualization and search             |

### 3. Health Check & Management

- **Check running containers:**
  ```bash
  docker ps
  ```
- **Check logs:**
  ```bash
  docker-compose -f docker-compose.dev.yml logs <service>
  ```
- **Stop all infrastructure:**
  ```bash
  docker-compose -f docker-compose.dev.yml down
  ```

### 4. Service Roles

- **PostgreSQL**: Primary database for all business data (users, bookings, payments, etc.)
- **Redis**: Distributed cache, pub/sub for real-time, queue for async jobs, rate limiting
- **Kafka**: High-throughput event streaming for background jobs, analytics, notifications
- **Prometheus**: Collects metrics from all services for monitoring
- **Grafana**: Visualizes metrics and dashboards
- **Elasticsearch**: Stores and indexes logs from all services
- **Kibana**: UI for searching and analyzing logs

### 5. Next Steps

- Generate and run your microservices (see below)
- Each service should connect to the above infrastructure using the provided ports
- For production, use Kubernetes manifests in `deploy/k8s/`
