# Analytics Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Big data, ETL, reporting
- Integrates with Kafka, ClickHouse, analytics pipelines

## Overview

The Analytics Service is responsible for collecting, processing, and analyzing data from across the booking system to provide insights, reports, and business intelligence. It handles real-time analytics, historical data analysis, and predictive modeling to support business decisions and optimize system performance.

## 🎯 Responsibilities

- **Data Collection**: Collect data from all services
- **Real-time Analytics**: Process streaming data in real-time
- **Historical Analysis**: Analyze historical booking data
- **Business Intelligence**: Generate business insights and reports
- **Predictive Analytics**: Forecast trends and patterns
- **Performance Metrics**: Monitor system performance
- **User Behavior Analysis**: Analyze user interactions
- **Revenue Analytics**: Track revenue and financial metrics
- **gRPC Communication**: Inter-service data collection

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (analytics data), ClickHouse (time-series)
- **Cache**: Redis (analytics cache, real-time data)
- **Message Queue**: Kafka (data streams, events)
- **gRPC**: grpc-java for inter-service communication
- **Stream Processing**: Apache Flink, Kafka Streams
- **Data Warehouse**: Apache Druid, ClickHouse
- **Visualization**: Grafana, Apache Superset
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Analytics Service
├── Data Collector
├── Stream Processor
├── Batch Processor
├── Query Engine
├── Report Generator
├── ML Pipeline
├── Dashboard API
├── gRPC Server/Client
└── Event Aggregator
```

## 🔄 Data Processing Flow

### Real-time Data Flow

```
Service Events (Kafka)
    ↓
Data Ingestion
    ↓
Stream Processing
    ↓
Real-time Aggregation
    ↓
Cache Update
    ↓
Dashboard Update
    ↓
Alert Triggering
```

### Batch Processing Flow

```
Historical Data
    ↓
Data Extraction
    ↓
Data Transformation
    ↓
Data Loading (ETL)
    ↓
Aggregation
    ↓
Report Generation
    ↓
Storage & Indexing
```

### Analytics Pipeline

```
Raw Data
    ↓
Data Validation
    ↓
Data Enrichment
    ↓
Feature Engineering
    ↓
Model Training
    ↓
Prediction Generation
    ↓
Result Storage
```

## 📡 API Endpoints

### REST API

```http
# Analytics Data
GET    /api/v1/analytics/realtime              # Real-time metrics
GET    /api/v1/analytics/historical            # Historical data
POST   /api/v1/analytics/query                 # Custom queries

# Reports
GET    /api/v1/reports/sales                   # Sales reports
GET    /api/v1/reports/revenue                 # Revenue reports
GET    /api/v1/reports/users                   # User analytics
GET    /api/v1/reports/events                  # Event analytics
GET    /api/v1/reports/performance             # Performance metrics

# Dashboards
GET    /api/v1/dashboards                      # List dashboards
GET    /api/v1/dashboards/{id}                 # Get dashboard
POST   /api/v1/dashboards                      # Create dashboard
PUT    /api/v1/dashboards/{id}                 # Update dashboard

# Predictions
GET    /api/v1/predictions/demand              # Demand forecasting
GET    /api/v1/predictions/revenue             # Revenue forecasting
GET    /api/v1/predictions/users               # User growth prediction
```

### gRPC Services

```protobuf
service AnalyticsService {
  rpc CollectEvent(AnalyticsEvent) returns (EventResponse);
  rpc GetRealTimeMetrics(RealTimeRequest) returns (RealTimeResponse);
  rpc GetHistoricalData(HistoricalRequest) returns (HistoricalResponse);
  rpc GenerateReport(ReportRequest) returns (ReportResponse);
  rpc GetPredictions(PredictionRequest) returns (PredictionResponse);
  rpc QueryData(QueryRequest) returns (QueryResponse);
}

service AnalyticsEventService {
  rpc PublishAnalyticsEvent(AnalyticsEvent) returns (EventResponse);
  rpc SubscribeToAnalyticsEvents(SubscribeRequest) returns (stream AnalyticsEvent);
}
```

## 🔐 Security Features

### Data Security

- **Data Encryption**: Encrypt sensitive analytics data
- **Access Control**: Role-based access to analytics
- **Data Masking**: Mask sensitive data in reports
- **Audit Logging**: Log all analytics queries

### Privacy Protection

- **GDPR Compliance**: Ensure data privacy compliance
- **Data Anonymization**: Anonymize personal data
- **Consent Management**: Respect user consent
- **Data Retention**: Follow data retention policies

### API Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based authorization
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all queries

## 📊 Database Schema

### Analytics Events Table

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_source VARCHAR(100) NOT NULL,
    user_id UUID,
    session_id VARCHAR(100),
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Metrics Table

```sql
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(20),
    dimension_data JSONB,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reports Table

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_data JSONB NOT NULL,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Dashboards Table

```sql
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL,
    widgets JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Predictions Table

```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_type VARCHAR(50) NOT NULL,
    prediction_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(20),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8084
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/analytics_service_db
SPRING_DATASOURCE_USERNAME=analytics_service_user
SPRING_DATASOURCE_PASSWORD=analytics_service_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# ClickHouse Configuration
CLICKHOUSE_URL=jdbc:clickhouse://localhost:8123/analytics
CLICKHOUSE_USERNAME=analytics_user
CLICKHOUSE_PASSWORD=analytics_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=7

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_ANALYTICS_EVENTS=analytics-events
KAFKA_TOPIC_BOOKING_EVENTS=booking-events
KAFKA_TOPIC_PAYMENT_EVENTS=payment-events
KAFKA_TOPIC_USER_EVENTS=user-events
KAFKA_GROUP_ID=analytics-service

# gRPC Configuration
GRPC_SERVER_PORT=50057
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_PAYMENT_SERVICE_URL=payment-service:50055
GRPC_USER_SERVICE_URL=user-service:50056
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# Flink Configuration
FLINK_JOBMANAGER_HOST=localhost
FLINK_JOBMANAGER_PORT=8081
FLINK_PARALLELISM=4
FLINK_CHECKPOINT_INTERVAL=60000

# Druid Configuration
DRUID_COORDINATOR_URL=http://localhost:8081
DRUID_BROKER_URL=http://localhost:8082
DRUID_INDEXER_URL=http://localhost:8090

# Grafana Configuration
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your_grafana_api_key
GRAFANA_DASHBOARD_TEMPLATE_PATH=/templates/dashboards

# ML Configuration
ML_MODEL_PATH=/models
ML_PREDICTION_BATCH_SIZE=1000
ML_MODEL_UPDATE_INTERVAL=3600000

# Cache Configuration
CACHE_TTL_SECONDS=3600
CACHE_MAX_SIZE=10000
REAL_TIME_CACHE_TTL_SECONDS=60

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
RATE_LIMIT_REQUESTS_PER_MINUTE=200
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Data Processing Optimization

- **Stream Processing**: Real-time data processing
- **Batch Processing**: Efficient batch operations
- **Data Partitioning**: Partition data by time/region
- **Indexing**: Optimize query performance

### Caching Strategy

- **Real-time Cache**: Cache real-time metrics
- **Report Cache**: Cache generated reports
- **Query Cache**: Cache frequent queries
- **Prediction Cache**: Cache ML predictions

### Storage Optimization

- **Time-series Database**: Optimized for time-series data
- **Data Compression**: Compress historical data
- **Data Archiving**: Archive old data
- **Columnar Storage**: Efficient for analytics queries

## 📊 Monitoring & Observability

### Metrics

- **Data Ingestion Rate**: Events processed per second
- **Query Performance**: Average query response time
- **Report Generation Time**: Report generation metrics
- **Prediction Accuracy**: ML model accuracy
- **Cache Hit Rate**: Cache performance metrics
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Data Ingestion Logs**: Event processing logs
- **Query Logs**: Analytics query logs
- **Report Logs**: Report generation logs
- **ML Logs**: Machine learning logs
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **Flink Health**: Stream processing health
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

### Analytics Tests

```bash
./mvnw test -Dtest=AnalyticsTest
```

### ML Tests

```bash
./mvnw test -Dtest=MLTest
```

### Performance Tests

```bash
./mvnw test -Dtest=PerformanceTest
```

## 🚀 Deployment

### Docker

```dockerfile
FROM openjdk:17-jdk-slim

# Install protobuf compiler and ML dependencies
RUN apt-get update && apt-get install -y \
    protobuf-compiler \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

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

EXPOSE 8084 50057

CMD ["java", "-jar", "target/analytics-service.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-service
  template:
    metadata:
      labels:
        app: analytics-service
    spec:
      containers:
        - name: analytics-service
          image: booking-system/analytics-service:latest
          ports:
            - containerPort: 8084
            - containerPort: 50057
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: analytics-service-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: CLICKHOUSE_URL
              valueFrom:
                secretKeyRef:
                  name: analytics-service-secrets
                  key: clickhouse-url
          resources:
            requests:
              memory: "2Gi"
              cpu: "1000m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
          volumeMounts:
            - name: ml-models
              mountPath: /models
            - name: dashboard-templates
              mountPath: /templates
      volumes:
        - name: ml-models
          persistentVolumeClaim:
            claimName: ml-models-pvc
        - name: dashboard-templates
          configMap:
            name: dashboard-templates
```

## 🔄 Service Implementation

### Analytics Controller

```java
@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/realtime")
    public ResponseEntity<RealTimeMetricsResponse> getRealTimeMetrics() {
        RealTimeMetricsResponse response = analyticsService.getRealTimeMetrics();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/historical")
    public ResponseEntity<HistoricalDataResponse> getHistoricalData(
            @RequestParam String metric,
            @RequestParam String timeRange) {
        HistoricalDataResponse response = analyticsService.getHistoricalData(metric, timeRange);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/query")
    public ResponseEntity<QueryResponse> queryData(@RequestBody QueryRequest request) {
        QueryResponse response = analyticsService.queryData(request);
        return ResponseEntity.ok(response);
    }
}
```

### gRPC Server

```java
@GrpcService
public class AnalyticsGrpcService extends AnalyticsServiceGrpc.AnalyticsServiceImplBase {

    @Autowired
    private AnalyticsService analyticsService;

    @Override
    public void collectEvent(AnalyticsEvent event,
                           StreamObserver<EventResponse> responseObserver) {
        try {
            EventResponse response = analyticsService.collectEvent(event);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to collect event: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void getRealTimeMetrics(RealTimeRequest request,
                                 StreamObserver<RealTimeResponse> responseObserver) {
        try {
            RealTimeResponse response = analyticsService.getRealTimeMetrics(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to get metrics: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### Stream Processor

```java
@Service
public class StreamProcessorService {

    @Autowired
    private StreamExecutionEnvironment env;

    public void processAnalyticsStream() {
        // Create Kafka consumer
        FlinkKafkaConsumer<AnalyticsEvent> consumer = new FlinkKafkaConsumer<>(
            "analytics-events",
            new AnalyticsEventDeserializer(),
            kafkaProperties
        );

        // Process stream
        DataStream<AnalyticsEvent> stream = env.addSource(consumer);

        // Apply transformations
        DataStream<ProcessedEvent> processedStream = stream
            .filter(event -> event.getEventType() != null)
            .map(this::enrichEvent)
            .keyBy(ProcessedEvent::getEventType)
            .window(TumblingProcessingTimeWindows.of(Time.minutes(1)))
            .aggregate(new EventAggregator());

        // Sink to database
        processedStream.addSink(new DatabaseSink());

        // Execute
        env.execute("Analytics Stream Processing");
    }

    private ProcessedEvent enrichEvent(AnalyticsEvent event) {
        // Enrich event with additional data
        return ProcessedEvent.builder()
            .eventId(event.getId())
            .eventType(event.getEventType())
            .userId(event.getUserId())
            .timestamp(event.getTimestamp())
            .enrichedData(enrichData(event.getEventData()))
            .build();
    }
}
```

### ML Pipeline

```java
@Service
public class MLPipelineService {

    @Autowired
    private ModelService modelService;

    @Scheduled(fixedRate = 3600000) // Every hour
    public void updatePredictions() {
        // Load latest data
        List<AnalyticsEvent> events = loadRecentEvents();

        // Preprocess data
        List<FeatureVector> features = preprocessData(events);

        // Generate predictions
        List<Prediction> predictions = modelService.predict(features);

        // Store predictions
        storePredictions(predictions);

        // Update dashboards
        updateDashboards(predictions);
    }

    private List<FeatureVector> preprocessData(List<AnalyticsEvent> events) {
        return events.stream()
            .map(this::extractFeatures)
            .collect(Collectors.toList());
    }

    private FeatureVector extractFeatures(AnalyticsEvent event) {
        // Extract features from event data
        return FeatureVector.builder()
            .userId(event.getUserId())
            .eventType(event.getEventType())
            .timestamp(event.getTimestamp())
            .features(extractNumericFeatures(event.getEventData()))
            .build();
    }
}
```

## 🆕 Integration with Check-in Service

The **Check-in Service** sends check-in events to Analytics Service:

- **Attendance Tracking**: Receives check-in events for real-time and historical attendance analytics
- **Event Stats**: Aggregates check-in data for event organizers
- **gRPC/Kafka**: Check-in Service communicates via gRPC or publishes events to Kafka for analytics

## 🛡️ Security Best Practices

### Data Security

- **Data Encryption**: Encrypt sensitive analytics data
- **Access Control**: Role-based access to analytics
- **Data Masking**: Mask sensitive data in reports
- **Audit Logging**: Log all analytics queries

### Privacy Protection

- **GDPR Compliance**: Ensure data privacy compliance
- **Data Anonymization**: Anonymize personal data
- **Consent Management**: Respect user consent
- **Data Retention**: Follow data retention policies

### ML Security

- **Model Security**: Secure ML model access
- **Input Validation**: Validate ML model inputs
- **Output Sanitization**: Sanitize ML predictions
- **Model Monitoring**: Monitor model performance

## 📞 Troubleshooting

### Common Issues

1. **Data Ingestion Failures**: Check Kafka connectivity
2. **Query Performance**: Optimize database queries
3. **ML Model Issues**: Check model accuracy and performance
4. **gRPC Connection Issues**: Verify service endpoints
5. **Cache Issues**: Monitor cache hit rates

### Debug Commands

```bash
# Check service health
curl http://analytics-service:8084/actuator/health

# Check gRPC health
grpc_health_probe -addr=analytics-service:50057

# Check Kafka consumer group
kafka-consumer-groups --bootstrap-server kafka:9092 --group analytics-service --describe

# Check ClickHouse
clickhouse-client --host localhost --port 9000 --query "SELECT count() FROM analytics_events"

# Monitor analytics events
kafka-console-consumer --bootstrap-server kafka:9092 --topic analytics-events

# Check Flink jobs
curl http://localhost:8081/jobs
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **Booking Service**: Booking analytics data
- **Payment Service**: Payment analytics data
- **User Service**: User behavior analytics

### Infrastructure

- **PostgreSQL**: Analytics data storage
- **ClickHouse**: Time-series data storage
- **Redis**: Caching and real-time data
- **Kafka**: Event streaming
- **Flink**: Stream processing
- **Protocol Buffers**: Message serialization

### External Tools

- **Grafana**: Data visualization
- **Apache Superset**: Business intelligence
- **Apache Druid**: Real-time analytics
- **ML Libraries**: TensorFlow, Scikit-learn
