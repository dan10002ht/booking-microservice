# Event Management Service (Node.js)

**Language:** Node.js

**Why Node.js?**

- Event/venue CRUD, media, search
- Easy to maintain, rapid development

## Overview

The Event Management Service is responsible for managing events, venues, organizers, and event-related operations. It handles event creation, scheduling, venue management, organizer profiles, and provides comprehensive event lifecycle management with real-time updates and analytics.

## 🎯 Responsibilities

- **Event Management**: CRUD operations for events
- **Venue Management**: Manage venues and facilities
- **Organizer Management**: Handle organizer profiles and permissions
- **Event Scheduling**: Manage event schedules and conflicts
- **Capacity Management**: Track venue capacity and availability
- **Event Categories**: Manage event categories and tags
- **Media Management**: Handle event images and media
- **Event Analytics**: Track event performance metrics
- **gRPC Communication**: Inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (event data, venues)
- **Cache**: Redis (event cache, venue availability)
- **Message Queue**: Kafka (event events, notifications)
- **gRPC**: grpc-java for inter-service communication
- **File Storage**: AWS S3, MinIO (event media)
- **Search**: Elasticsearch (event search)
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Event Management Service
├── Event Manager
├── Venue Manager
├── Organizer Manager
├── Schedule Manager
├── Media Manager
├── Search Engine
├── Analytics Engine
├── gRPC Server/Client
└── Event Publisher
```

## 🔄 Event Lifecycle Flow

### Event Creation Flow

```
Organizer Request
    ↓
Event Validation
    ↓
Venue Availability Check
    ↓
Schedule Conflict Check
    ↓
Event Creation
    ↓
Media Upload
    ↓
Search Indexing
    ↓
Event Publishing
    ↓
Notification (Email)
```

### Event Update Flow

```
Update Request
    ↓
Change Validation
    ↓
Impact Analysis
    ↓
Booking Impact Check
    ↓
Event Update
    ↓
Search Re-indexing
    ↓
Notification (Affected Users)
```

### Event Cancellation Flow

```
Cancellation Request
    ↓
Booking Impact Analysis
    ↓
Refund Processing
    ↓
Event Cancellation
    ↓
Notification (All Bookings)
    ↓
Search Update
```

## 📡 API Endpoints

### REST API

```http
# Event Management
GET    /api/v1/events                      # List events
GET    /api/v1/events/{id}                 # Get event by ID
POST   /api/v1/events                      # Create event
PUT    /api/v1/events/{id}                 # Update event
DELETE /api/v1/events/{id}                 # Delete event
PATCH  /api/v1/events/{id}/status          # Update event status

# Venue Management
GET    /api/v1/venues                      # List venues
GET    /api/v1/venues/{id}                 # Get venue by ID
POST   /api/v1/venues                      # Create venue
PUT    /api/v1/venues/{id}                 # Update venue
DELETE /api/v1/venues/{id}                 # Delete venue
GET    /api/v1/venues/{id}/availability    # Check venue availability

# Organizer Management
GET    /api/v1/organizers                  # List organizers
GET    /api/v1/organizers/{id}             # Get organizer by ID
POST   /api/v1/organizers                  # Create organizer
PUT    /api/v1/organizers/{id}             # Update organizer
DELETE /api/v1/organizers/{id}             # Delete organizer

# Event Search
GET    /api/v1/events/search               # Search events
GET    /api/v1/events/categories           # Get event categories
GET    /api/v1/events/trending             # Get trending events
GET    /api/v1/events/recommendations      # Get event recommendations

# Media Management
POST   /api/v1/events/{id}/media           # Upload event media
DELETE /api/v1/events/{id}/media/{mediaId} # Delete event media
GET    /api/v1/events/{id}/media           # Get event media

# Analytics
GET    /api/v1/events/{id}/analytics       # Get event analytics
GET    /api/v1/organizers/{id}/analytics   # Get organizer analytics
```

### gRPC Services

```protobuf
service EventManagementService {
  rpc CreateEvent(CreateEventRequest) returns (EventResponse);
  rpc GetEvent(GetEventRequest) returns (EventResponse);
  rpc UpdateEvent(UpdateEventRequest) returns (EventResponse);
  rpc DeleteEvent(DeleteEventRequest) returns (DeleteEventResponse);
  rpc ListEvents(ListEventsRequest) returns (ListEventsResponse);
  rpc SearchEvents(SearchEventsRequest) returns (SearchEventsResponse);
  rpc GetEventAnalytics(GetEventAnalyticsRequest) returns (EventAnalyticsResponse);

  rpc CreateVenue(CreateVenueRequest) returns (VenueResponse);
  rpc GetVenue(GetVenueRequest) returns (VenueResponse);
  rpc UpdateVenue(UpdateVenueRequest) returns (VenueResponse);
  rpc DeleteVenue(DeleteVenueRequest) returns (DeleteVenueResponse);
  rpc CheckVenueAvailability(CheckAvailabilityRequest) returns (AvailabilityResponse);

  rpc CreateOrganizer(CreateOrganizerRequest) returns (OrganizerResponse);
  rpc GetOrganizer(GetOrganizerRequest) returns (OrganizerResponse);
  rpc UpdateOrganizer(UpdateOrganizerRequest) returns (OrganizerResponse);
  rpc DeleteOrganizer(DeleteOrganizerRequest) returns (DeleteOrganizerResponse);
}

service EventEventService {
  rpc PublishEventEvent(EventEvent) returns (EventResponse);
  rpc SubscribeToEventEvents(SubscribeRequest) returns (stream EventEvent);
}
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate JWT tokens from Auth Service
- **Role-Based Access**: Different access levels for users
- **Organizer Permissions**: Organizers can only manage their events
- **Admin Access**: Admin users have full access

### Data Protection

- **Event Data Encryption**: Encrypt sensitive event data
- **Media Security**: Secure media upload and storage
- **Audit Logging**: Log all event operations
- **Data Validation**: Validate all event data

### API Security

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all input data
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

## 📊 Database Schema

### Events Table

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    organizer_id UUID REFERENCES organizers(id),
    venue_id UUID REFERENCES venues(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    capacity INTEGER NOT NULL,
    available_capacity INTEGER NOT NULL,
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft',
    visibility VARCHAR(20) DEFAULT 'public',
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Venues Table

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    capacity INTEGER NOT NULL,
    facilities TEXT[],
    amenities JSONB,
    contact_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Organizers Table

```sql
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    rating DECIMAL(3,2),
    total_events INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Event Media Table

```sql
CREATE TABLE event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Event Categories Table

```sql
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES event_categories(id),
    icon_url VARCHAR(500),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Event Analytics Table

```sql
CREATE TABLE event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8085
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/event_management_db
SPRING_DATASOURCE_USERNAME=event_management_user
SPRING_DATASOURCE_PASSWORD=event_management_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=8

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_EVENT_EVENTS=event-events
KAFKA_TOPIC_VENUE_EVENTS=venue-events
KAFKA_TOPIC_ORGANIZER_EVENTS=organizer-events
KAFKA_GROUP_ID=event-management

# gRPC Configuration
GRPC_SERVER_PORT=50058
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_USER_SERVICE_URL=user-service:50056
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_ANALYTICS_SERVICE_URL=analytics-service:50057
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# Storage Configuration
STORAGE_TYPE=s3
AWS_S3_BUCKET=event-media
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=your_s3_access_key
AWS_S3_SECRET_KEY=your_s3_secret_key
AWS_S3_ENDPOINT=https://s3.amazonaws.com

# Elasticsearch Configuration
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password
ELASTICSEARCH_INDEX_EVENTS=events
ELASTICSEARCH_INDEX_VENUES=venues

# Email Configuration
EMAIL_SERVICE_URL=http://email-worker:8082
EMAIL_TEMPLATE_EVENT_CREATED=event-created
EMAIL_TEMPLATE_EVENT_UPDATED=event-updated
EMAIL_TEMPLATE_EVENT_CANCELLED=event-cancelled

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
RATE_LIMIT_REQUESTS_PER_MINUTE=100
FILE_UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4

# Search Configuration
SEARCH_INDEX_BATCH_SIZE=100
SEARCH_INDEX_REFRESH_INTERVAL=30000
SEARCH_SUGGESTION_MAX_RESULTS=10
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Event Cache**: Cache frequently accessed events
- **Venue Cache**: Cache venue availability data
- **Search Cache**: Cache search results
- **Media Cache**: Cache media metadata

### Database Optimization

- **Indexing**: Optimize database indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex queries
- **Partitioning**: Partition large tables

### Search Optimization

- **Elasticsearch**: Fast full-text search
- **Index Optimization**: Optimize search indexes
- **Query Caching**: Cache search queries
- **Suggestions**: Fast autocomplete suggestions

## 📊 Monitoring & Observability

### Metrics

- **Event Creation Rate**: Events created per minute
- **Search Performance**: Search query response time
- **Media Upload Rate**: Media uploads per minute
- **API Response Time**: Average API response time
- **Error Rate**: Error percentage by endpoint
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Event Logs**: All event operations
- **Venue Logs**: Venue management activities
- **Media Logs**: Media upload/download activities
- **Search Logs**: Search query activities
- **Error Logs**: Error details and stack traces
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **Elasticsearch Health**: Search service health
- **S3 Health**: Storage service health
- **gRPC Health**: gRPC service connectivity

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

### Search Tests

```bash
./mvnw test -Dtest=SearchTest
```

### Media Tests

```bash
./mvnw test -Dtest=MediaTest
```

### Performance Tests

```bash
./mvnw test -Dtest=PerformanceTest
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

EXPOSE 8085 50058

CMD ["java", "-jar", "target/event-management.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: event-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: event-management
  template:
    metadata:
      labels:
        app: event-management
    spec:
      containers:
        - name: event-management
          image: booking-system/event-management:latest
          ports:
            - containerPort: 8085
            - containerPort: 50058
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: event-management-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: ELASTICSEARCH_HOST
              value: "elasticsearch-service"
            - name: AWS_S3_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: event-management-secrets
                  key: s3-access-key
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          volumeMounts:
            - name: media-storage
              mountPath: /tmp/media
      volumes:
        - name: media-storage
          emptyDir: {}
```

## 🔄 Service Implementation

### Event Controller

```java
@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    @Autowired
    private EventService eventService;

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@RequestBody CreateEventRequest request) {
        EventResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable UUID id) {
        EventResponse response = eventService.getEvent(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<SearchResponse> searchEvents(@RequestParam String query) {
        SearchResponse response = eventService.searchEvents(query);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/media")
    public ResponseEntity<MediaResponse> uploadMedia(@PathVariable UUID id,
                                                   @RequestParam("file") MultipartFile file) {
        MediaResponse response = eventService.uploadMedia(id, file);
        return ResponseEntity.ok(response);
    }
}
```

### gRPC Server

```java
@GrpcService
public class EventManagementGrpcService extends EventManagementServiceGrpc.EventManagementServiceImplBase {

    @Autowired
    private EventService eventService;

    @Override
    public void createEvent(CreateEventRequest request,
                          StreamObserver<EventResponse> responseObserver) {
        try {
            EventResponse response = eventService.createEvent(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to create event: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void searchEvents(SearchEventsRequest request,
                           StreamObserver<SearchEventsResponse> responseObserver) {
        try {
            SearchEventsResponse response = eventService.searchEvents(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to search events: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### Search Service

```java
@Service
public class SearchService {

    @Autowired
    private ElasticsearchTemplate elasticsearchTemplate;

    public SearchResponse searchEvents(String query) {
        // Build search query
        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.multiMatchQuery(query, "title", "description", "category"))
            .withSort(SortBuilders.fieldSort("start_date").order(SortOrder.ASC))
            .withPageable(PageRequest.of(0, 20));

        // Execute search
        SearchHits<Event> searchHits = elasticsearchTemplate.search(queryBuilder.build(), Event.class);

        // Convert to response
        List<Event> events = searchHits.getSearchHits().stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());

        return SearchResponse.builder()
            .events(events)
            .totalHits(searchHits.getTotalHits())
            .build();
    }

    public void indexEvent(Event event) {
        elasticsearchTemplate.save(event);
    }

    public void deleteEvent(UUID eventId) {
        elasticsearchTemplate.delete(eventId.toString(), Event.class);
    }
}
```

### Media Service

```java
@Service
public class MediaService {

    @Autowired
    private S3Client s3Client;

    public MediaResponse uploadMedia(UUID eventId, MultipartFile file) {
        try {
            // Validate file
            validateFile(file);

            // Generate file name
            String fileName = generateFileName(eventId, file.getOriginalFilename());

            // Upload to S3
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket("event-media")
                .key(fileName)
                .contentType(file.getContentType())
                .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(
                file.getInputStream(), file.getSize()));

            // Save metadata to database
            EventMedia media = EventMedia.builder()
                .eventId(eventId)
                .fileName(fileName)
                .fileUrl(generateFileUrl(fileName))
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .build();

            eventMediaRepository.save(media);

            return MediaResponse.builder()
                .mediaId(media.getId())
                .fileUrl(media.getFileUrl())
                .build();

        } catch (Exception e) {
            throw new MediaUploadException("Failed to upload media", e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB
            throw new IllegalArgumentException("File too large");
        }

        String contentType = file.getContentType();
        if (!Arrays.asList("image/jpeg", "image/png", "image/gif", "video/mp4")
                .contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file type");
        }
    }
}
```

## 🛡️ Security Best Practices

### Data Security

- **Event Data Protection**: Secure event information
- **Media Security**: Secure media upload and storage
- **Access Control**: Strict access control for events
- **Audit Trail**: Complete audit trail for all operations

### Privacy Protection

- **Personal Data Protection**: Protect organizer and attendee data
- **Media Privacy**: Control media access permissions
- **Data Retention**: Follow data retention policies
- **Consent Management**: Respect user consent

### API Security

- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Strong authentication mechanisms
- **Authorization**: Role-based access control

## 📞 Troubleshooting

### Common Issues

1. **Event Creation Failures**: Check venue availability
2. **Search Issues**: Verify Elasticsearch connectivity
3. **Media Upload Failures**: Check S3 configuration
4. **gRPC Connection Issues**: Verify service endpoints
5. **Performance Issues**: Monitor cache hit rates

### Debug Commands

```bash
# Check service health
curl http://event-management:8085/actuator/health

# Check gRPC health
grpc_health_probe -addr=event-management:50058

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check S3 connectivity
aws s3 ls s3://event-media

# Monitor event events
kafka-console-consumer --bootstrap-server kafka:9092 --topic event-events

# Check search index
curl http://localhost:9200/events/_search?q=test
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **User Service**: User profile information
- **Booking Service**: Booking integration
- **Analytics Service**: Event analytics data

### Infrastructure

- **PostgreSQL**: Event and venue data storage
- **Redis**: Caching and session management
- **Kafka**: Event streaming
- **Elasticsearch**: Search functionality
- **S3**: Media storage
- **Protocol Buffers**: Message serialization

### External APIs

- **Email Service**: Event notifications
- **Storage Service**: File storage
- **Search Service**: Advanced search capabilities
