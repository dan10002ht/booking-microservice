# 🎟️ Ticket Service

## Overview

The Ticket Service manages event information, ticket types, pricing, and availability. It provides public APIs for event discovery and ticket browsing, with comprehensive caching for high-performance read operations. The service implements CQRS pattern for optimal read/write performance.

## 🎯 Responsibilities

- **Event Management**: Event information and metadata
- **Ticket Types**: Different ticket categories and pricing
- **Availability Management**: Real-time seat availability
- **Pricing**: Dynamic pricing and discounts
- **Search & Filtering**: Event search and filtering capabilities
- **Caching**: High-performance caching for read operations
- **Inventory Tracking**: Track ticket inventory levels
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js (REST) + gRPC server
- **Database**: PostgreSQL (event and ticket data)
- **Cache**: Redis (event cache, availability cache)
- **Search**: Elasticsearch (event search)
- **gRPC**: @grpc/grpc-js for inter-service communication
- **Protocol Buffers**: Efficient binary serialization
- **Monitoring**: Prometheus + Grafana

### Key Components

```
Ticket Service
├── REST API Server
├── gRPC Server
├── Event Controller
├── Ticket Controller
├── Search Service
├── Cache Manager
├── Inventory Manager
├── Pricing Engine
├── Availability Tracker
└── Health Checker
```

## 🔄 Ticket Flow

### Event Discovery Flow

```
User Search Request
    ↓
Query Processing
    ↓
Cache Check
    ↓
Database Query (if needed)
    ↓
Search Enhancement
    ↓
Response Formatting
    ↓
Cache Update
    ↓
Return Results
```

### Availability Check Flow

```
Availability Request
    ↓
Cache Check
    ↓
Real-time Inventory Check
    ↓
Pricing Calculation
    ↓
Availability Response
    ↓
Cache Update
    ↓
Return Availability
```

### gRPC Service Flow

```
Service Request
    ↓
gRPC Interceptor (Auth)
    ↓
Business Logic Execution
    ↓
Cache/Database Query
    ↓
Response Formatting
    ↓
gRPC Response
```

## 📡 API Endpoints

### Public Endpoints (REST)

```
GET    /events                    # List events with filtering
GET    /events/:id                # Get event details
GET    /events/:id/tickets        # Get available tickets
GET    /events/search             # Search events
GET    /events/categories         # Get event categories
GET    /events/featured           # Get featured events
GET    /tickets/:id               # Get ticket details
GET    /tickets/types             # Get ticket types
```

### Protected Endpoints (REST)

```
POST   /events                    # Create event (admin)
PUT    /events/:id                # Update event (admin)
DELETE /events/:id                # Delete event (admin)
POST   /events/:id/tickets        # Add ticket types (admin)
PUT    /events/:id/tickets/:type  # Update ticket type (admin)
DELETE /events/:id/tickets/:type  # Delete ticket type (admin)
```

### gRPC Services (Internal)

```
ticket.TicketService
├── GetEvents(GetEventsRequest) returns (GetEventsResponse)
├── GetEventById(GetEventByIdRequest) returns (GetEventByIdResponse)
├── GetAvailableTickets(GetAvailableTicketsRequest) returns (GetAvailableTicketsResponse)
├── SearchEvents(SearchEventsRequest) returns (SearchEventsResponse)
├── GetEventCategories(GetEventCategoriesRequest) returns (GetEventCategoriesResponse)
├── GetFeaturedEvents(GetFeaturedEventsRequest) returns (GetFeaturedEventsResponse)
├── ReserveTickets(ReserveTicketsRequest) returns (ReserveTicketsResponse)
└── ReleaseTickets(ReleaseTicketsRequest) returns (ReleaseTicketsResponse)

ticket.InventoryService
├── CheckAvailability(CheckAvailabilityRequest) returns (CheckAvailabilityResponse)
├── UpdateInventory(UpdateInventoryRequest) returns (UpdateInventoryResponse)
├── GetInventoryLevels(GetInventoryLevelsRequest) returns (GetInventoryLevelsResponse)
└── LockInventory(LockInventoryRequest) returns (LockInventoryResponse)

ticket.PricingService
├── CalculatePrice(CalculatePriceRequest) returns (CalculatePriceResponse)
├── GetPricingRules(GetPricingRulesRequest) returns (GetPricingRulesResponse)
├── ApplyDiscount(ApplyDiscountRequest) returns (ApplyDiscountResponse)
└── GetDynamicPricing(GetDynamicPricingRequest) returns (GetDynamicPricingResponse)
```

## 🔐 Security Features

### Access Control

- **Public Read Access**: Event and ticket information
- **Admin Write Access**: Event and ticket management
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all input parameters

### Data Protection

- **Caching Security**: Secure cache keys and data
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Sanitize user inputs
- **Data Encryption**: Encrypt sensitive data

### Performance Security

- **Cache Poisoning Prevention**: Validate cached data
- **DoS Protection**: Rate limiting and request validation
- **Resource Limits**: Prevent resource exhaustion

## 📊 Database Schema

### Events Table

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    venue_id UUID REFERENCES venues(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500),
    max_capacity INTEGER,
    current_capacity INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ticket Types Table

```sql
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    max_per_purchase INTEGER DEFAULT 10,
    min_per_purchase INTEGER DEFAULT 1,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Venues Table

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    capacity INTEGER,
    amenities JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3002
GRPC_PORT=50052
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/ticket_db
DATABASE_SSL=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=2

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=events
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elastic_password

# gRPC Configuration
GRPC_MAX_RECEIVE_MESSAGE_LENGTH=4194304
GRPC_MAX_SEND_MESSAGE_LENGTH=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000
GRPC_TLS_ENABLED=true
GRPC_TLS_CERT_PATH=/etc/grpc/certs/server.crt
GRPC_TLS_KEY_PATH=/etc/grpc/certs/server.key

# Cache Configuration
CACHE_TTL_EVENTS=3600
CACHE_TTL_AVAILABILITY=300
CACHE_TTL_SEARCH=1800
CACHE_MAX_SIZE=1000

# Search Configuration
SEARCH_MAX_RESULTS=100
SEARCH_SUGGESTION_LIMIT=10
SEARCH_FUZZY_MATCH=true

# Pricing Configuration
DYNAMIC_PRICING_ENABLED=true
PRICE_UPDATE_INTERVAL=300
DISCOUNT_RULES_ENABLED=true
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Event Cache**: Cache event details with TTL
- **Availability Cache**: Cache ticket availability
- **Search Cache**: Cache search results
- **Pricing Cache**: Cache calculated prices

### Database Optimization

- **Connection Pooling**: Optimize database connections
- **Indexes**: Composite indexes for queries
- **Read Replicas**: For read-heavy operations
- **Partitioning**: Partition by date or category

### Search Optimization

- **Elasticsearch**: Fast full-text search
- **Index Optimization**: Optimize search indexes
- **Query Caching**: Cache search queries
- **Aggregation Caching**: Cache search aggregations

## 📊 Monitoring & Observability

### Metrics

- **Request Rate**: API requests per second
- **Cache Hit Rate**: Cache performance metrics
- **Search Performance**: Search query response times
- **Availability Updates**: Real-time availability changes
- **Error Rates**: API error rates
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Access Logs**: All API requests
- **Search Logs**: Search query logs
- **Cache Logs**: Cache hit/miss logs
- **Error Logs**: API errors and failures
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Elasticsearch Health**: Search service health
- **gRPC Health**: gRPC health check protocol

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### gRPC Tests

```bash
npm run test:grpc
```

### Search Tests

```bash
npm run test:search
```

### Load Tests

```bash
npm run test:load
```

### Cache Tests

```bash
npm run test:cache
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install protobuf compiler
RUN apk add --no-cache protobuf

COPY package*.json ./
RUN npm ci --only=production

# Copy protobuf definitions
COPY shared-lib/protos ./protos

# Generate gRPC code
RUN npm run grpc:generate

COPY . .
EXPOSE 3002 50052
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ticket-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ticket-service
  template:
    metadata:
      labels:
        app: ticket-service
    spec:
      containers:
        - name: ticket
          image: booking-system/ticket-service:latest
          ports:
            - containerPort: 3002
            - containerPort: 50052
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: ticket-secrets
                  key: database-url
            - name: REDIS_URL
              value: "redis://redis-service:6379"
            - name: ELASTICSEARCH_URL
              value: "http://elasticsearch-service:9200"
          volumeMounts:
            - name: grpc-certs
              mountPath: /etc/grpc/certs
              readOnly: true
      volumes:
        - name: grpc-certs
          secret:
            secretName: grpc-tls-certs
```

## 🔄 Caching Implementation

### Redis Cache Strategy

```javascript
class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async getEvent(eventId) {
    const cacheKey = `event:${eventId}`;
    let event = await this.redis.get(cacheKey);

    if (!event) {
      event = await this.fetchEventFromDatabase(eventId);
      if (event) {
        await this.redis.setex(cacheKey, 3600, JSON.stringify(event));
      }
    } else {
      event = JSON.parse(event);
    }

    return event;
  }

  async getAvailability(eventId) {
    const cacheKey = `availability:${eventId}`;
    let availability = await this.redis.get(cacheKey);

    if (!availability) {
      availability = await this.fetchAvailabilityFromDatabase(eventId);
      if (availability) {
        await this.redis.setex(cacheKey, 300, JSON.stringify(availability));
      }
    } else {
      availability = JSON.parse(availability);
    }

    return availability;
  }

  async invalidateEventCache(eventId) {
    const cacheKey = `event:${eventId}`;
    await this.redis.del(cacheKey);
  }

  async invalidateAvailabilityCache(eventId) {
    const cacheKey = `availability:${eventId}`;
    await this.redis.del(cacheKey);
  }
}
```

## 🛡️ Security Best Practices

### Input Validation

- **Request Validation**: Validate all input parameters
- **Search Sanitization**: Sanitize search queries
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

### Cache Security

- **Cache Key Validation**: Validate cache keys
- **Data Sanitization**: Sanitize cached data
- **Access Control**: Control cache access
- **TTL Management**: Set appropriate cache TTL

### Search Security

- **Query Validation**: Validate search queries
- **Result Filtering**: Filter sensitive data
- **Rate Limiting**: Limit search requests
- **Access Control**: Control search access

## 📞 Troubleshooting

### Common Issues

1. **Cache Misses**: Check cache configuration and TTL
2. **Search Failures**: Verify Elasticsearch connectivity
3. **Slow Queries**: Check database indexes and queries
4. **Memory Issues**: Monitor cache memory usage
5. **gRPC Connection**: Verify service endpoints

### Debug Commands

```bash
# Check service health
curl http://ticket-service:3002/health

# Test gRPC connectivity
grpcurl -plaintext ticket-service:50052 list

# Check Redis cache
redis-cli keys "*event*"

# Test Elasticsearch
curl -X GET "elasticsearch:9200/events/_search?q=test"

# Monitor cache performance
redis-cli info memory
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication for admin operations
- **Booking Service**: Ticket reservation and availability updates
- **Pricing Service**: Dynamic pricing calculations

### Infrastructure

- **PostgreSQL**: Event and ticket data storage
- **Redis**: Caching and session storage
- **Elasticsearch**: Full-text search and indexing
- **Protocol Buffers**: Message serialization

## 🆕 Integration with Booking Worker Service (Go)

The **Booking Worker Service** (written in Go) ensures ticket inventory is managed safely under high concurrency:

- **Go Concurrency**: Uses goroutines and channels for sequential, atomic ticket reservation.
- **gRPC Communication**: Booking Worker (Go) communicates with Ticket Service for inventory updates.

### Ticket Reservation Flow

1. **Booking Worker dequeues request** → 2. **Ticket Service reserves ticket** → 3. **On payment, ticket is issued; on timeout, ticket is released**

## 🆕 Integration with Check-in Service

The **Check-in Service** interacts with Ticket Service to:

- **Validate Tickets**: Check ticket status (valid/used/invalid) via gRPC
- **Update Status**: Mark tickets as used upon successful check-in
- **Prevent Double Check-in**: Ensure a ticket cannot be checked in more than once
- **Check-in Event Flow**:
  1. Check-in Service receives scan request
  2. Calls Ticket Service to validate and update ticket
  3. On success, records check-in and notifies analytics/notification

# Ticket Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Inventory, concurrency, atomic updates
- Integrates with check-in, booking, analytics
