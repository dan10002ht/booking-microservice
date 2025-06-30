# Rate Limiter Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Distributed rate limiting, Redis/Kafka
- API protection, high reliability

## Overview

The Rate Limiter Service is responsible for managing API rate limiting, traffic control, and request throttling across the entire booking system. It provides distributed rate limiting with multiple algorithms, real-time monitoring, and adaptive rate limiting based on system load and user behavior.

## 🎯 Responsibilities

- **API Rate Limiting**: Control request rates per user/IP
- **Traffic Management**: Manage traffic flow and distribution
- **Request Throttling**: Throttle requests based on various criteria
- **Load Balancing**: Distribute load across services
- **Real-time Monitoring**: Monitor request patterns and rates
- **Adaptive Limiting**: Adjust limits based on system load
- **Distributed Limiting**: Handle rate limiting across multiple instances
- **gRPC Communication**: Inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: Redis (rate limit counters, tokens)
- **Cache**: Redis (limit cache, configuration)
- **Message Queue**: Kafka (rate limit events, alerts)
- **gRPC**: grpc-java for inter-service communication
- **Algorithm**: Token Bucket, Leaky Bucket, Fixed Window, Sliding Window
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Rate Limiter Service
├── Rate Limit Manager
├── Algorithm Engine
├── Token Bucket Manager
├── Traffic Controller
├── Load Balancer
├── Monitoring Engine
├── Configuration Manager
├── gRPC Server/Client
└── Alert Manager
```

## 🔄 Rate Limiting Flow

### Request Processing Flow

```
Incoming Request
    ↓
Client Identification
    ↓
Rate Limit Check
    ↓
Token Bucket Check
    ↓
Limit Validation
    ↓
Request Processing
    ↓
Token Consumption
    ↓
Response Generation
    ↓
Metrics Update
```

### Token Bucket Flow

```
Token Bucket Initialization
    ↓
Token Refill (Time-based)
    ↓
Request Arrival
    ↓
Token Availability Check
    ↓
Token Consumption
    ↓
Request Processing/Rejection
    ↓
Bucket State Update
```

### Adaptive Limiting Flow

```
System Load Monitoring
    ↓
Performance Analysis
    ↓
Limit Adjustment Calculation
    ↓
Configuration Update
    ↓
Rate Limit Application
    ↓
Performance Monitoring
    ↓
Feedback Loop
```

## 📡 API Endpoints

### REST API

```http
# Rate Limiting
POST   /api/v1/rate-limit/check              # Check rate limit
POST   /api/v1/rate-limit/consume            # Consume rate limit
GET    /api/v1/rate-limit/status             # Get rate limit status
POST   /api/v1/rate-limit/reset              # Reset rate limit

# Configuration
GET    /api/v1/config/rules                  # List rate limit rules
GET    /api/v1/config/rules/{id}             # Get rule by ID
POST   /api/v1/config/rules                  # Create rate limit rule
PUT    /api/v1/config/rules/{id}             # Update rate limit rule
DELETE /api/v1/config/rules/{id}             # Delete rate limit rule

# Monitoring
GET    /api/v1/monitoring/rates              # Get current rates
GET    /api/v1/monitoring/limits             # Get limit statistics
GET    /api/v1/monitoring/alerts             # Get rate limit alerts
GET    /api/v1/monitoring/analytics          # Get rate limiting analytics

# Traffic Management
POST   /api/v1/traffic/throttle              # Throttle traffic
POST   /api/v1/traffic/allow                 # Allow traffic
GET    /api/v1/traffic/status                # Get traffic status
POST   /api/v1/traffic/load-balance          # Load balance traffic
```

### gRPC Services

```protobuf
service RateLimiterService {
  rpc CheckRateLimit(CheckRateLimitRequest) returns (RateLimitResponse);
  rpc ConsumeRateLimit(ConsumeRateLimitRequest) returns (ConsumeRateLimitResponse);
  rpc GetRateLimitStatus(GetRateLimitStatusRequest) returns (RateLimitStatusResponse);
  rpc ResetRateLimit(ResetRateLimitRequest) returns (ResetRateLimitResponse);

  rpc CreateRule(CreateRuleRequest) returns (RuleResponse);
  rpc GetRule(GetRuleRequest) returns (RuleResponse);
  rpc UpdateRule(UpdateRuleRequest) returns (RuleResponse);
  rpc DeleteRule(DeleteRuleRequest) returns (DeleteRuleResponse);
  rpc ListRules(ListRulesRequest) returns (ListRulesResponse);

  rpc GetMonitoringData(GetMonitoringRequest) returns (MonitoringResponse);
  rpc GetAnalytics(GetAnalyticsRequest) returns (AnalyticsResponse);

  rpc ThrottleTraffic(ThrottleTrafficRequest) returns (ThrottleTrafficResponse);
  rpc AllowTraffic(AllowTrafficRequest) returns (AllowTrafficResponse);
  rpc GetTrafficStatus(GetTrafficStatusRequest) returns (TrafficStatusResponse);
}

service RateLimitEventService {
  rpc PublishRateLimitEvent(RateLimitEvent) returns (EventResponse);
  rpc SubscribeToRateLimitEvents(SubscribeRequest) returns (stream RateLimitEvent);
}
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate JWT tokens from Auth Service
- **API Key Management**: Manage API keys for rate limiting
- **IP Whitelisting**: Whitelist trusted IP addresses
- **Admin Access**: Admin users have configuration access

### Data Protection

- **Rate Limit Data Encryption**: Encrypt sensitive rate limit data
- **Configuration Security**: Secure rate limit configurations
- **Audit Logging**: Log all rate limiting operations
- **Data Validation**: Validate all rate limit data

### API Security

- **Rate Limiting**: Self-rate limiting for the service
- **Input Validation**: Validate all input data
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

## 📊 Database Schema

### Rate Limit Rules Table

```sql
CREATE TABLE rate_limit_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    client_type VARCHAR(50) NOT NULL,
    client_identifier VARCHAR(100) NOT NULL,
    endpoint_pattern VARCHAR(255),
    method VARCHAR(10),
    algorithm VARCHAR(50) NOT NULL,
    limit_value INTEGER NOT NULL,
    time_window_seconds INTEGER NOT NULL,
    burst_limit INTEGER,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rate Limit Counters Table

```sql
CREATE TABLE rate_limit_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES rate_limit_rules(id),
    client_identifier VARCHAR(100) NOT NULL,
    current_count INTEGER DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Token Buckets Table

```sql
CREATE TABLE token_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES rate_limit_rules(id),
    client_identifier VARCHAR(100) NOT NULL,
    current_tokens INTEGER NOT NULL,
    max_tokens INTEGER NOT NULL,
    refill_rate DECIMAL(10,2) NOT NULL,
    last_refill TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rate Limit Events Table

```sql
CREATE TABLE rate_limit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES rate_limit_rules(id),
    client_identifier VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    request_count INTEGER DEFAULT 1,
    response_code INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Traffic Management Table

```sql
CREATE TABLE traffic_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    traffic_type VARCHAR(50) NOT NULL,
    throttle_percentage INTEGER DEFAULT 0,
    allow_percentage INTEGER DEFAULT 100,
    load_balance_strategy VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rate Limit Alerts Table

```sql
CREATE TABLE rate_limit_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES rate_limit_rules(id),
    alert_type VARCHAR(50) NOT NULL,
    threshold_value INTEGER NOT NULL,
    current_value INTEGER NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8089
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/rate_limiter_db
SPRING_DATASOURCE_USERNAME=rate_limiter_user
SPRING_DATASOURCE_PASSWORD=rate_limiter_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=12

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_RATE_LIMIT_EVENTS=rate-limit-events
KAFKA_TOPIC_ALERTS=rate-limit-alerts
KAFKA_GROUP_ID=rate-limiter

# gRPC Configuration
GRPC_SERVER_PORT=50062
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_GATEWAY_SERVICE_URL=gateway:50052
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# Rate Limiting Configuration
RATE_LIMIT_DEFAULT_LIMIT=100
RATE_LIMIT_DEFAULT_WINDOW=3600
RATE_LIMIT_BURST_LIMIT=10
RATE_LIMIT_ALGORITHM=token_bucket
RATE_LIMIT_DISTRIBUTED=true
RATE_LIMIT_SYNC_INTERVAL=5000

# Token Bucket Configuration
TOKEN_BUCKET_REFILL_RATE=10
TOKEN_BUCKET_MAX_TOKENS=100
TOKEN_BUCKET_REFILL_INTERVAL=1000

# Traffic Management Configuration
TRAFFIC_THROTTLE_ENABLED=true
TRAFFIC_LOAD_BALANCE_ENABLED=true
TRAFFIC_MONITORING_INTERVAL=5000
TRAFFIC_ALERT_THRESHOLD=80

# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_INTERVAL=10000
ALERT_ENABLED=true
ALERT_THRESHOLD_PERCENTAGE=90
ALERT_COOLDOWN_MINUTES=5

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
IP_WHITELIST_ENABLED=true
API_KEY_REQUIRED=true
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Rate Limit Cache**: Cache rate limit counters
- **Rule Cache**: Cache rate limit rules
- **Token Cache**: Cache token bucket states
- **Configuration Cache**: Cache configurations

### Database Optimization

- **Indexing**: Optimize database indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex queries
- **Partitioning**: Partition large tables

### Redis Optimization

- **Memory Optimization**: Optimize Redis memory usage
- **Connection Pooling**: Efficient Redis connections
- **Pipeline Operations**: Batch Redis operations
- **Key Expiration**: Automatic key expiration

## 📊 Monitoring & Observability

### Metrics

- **Request Rate**: Requests per second
- **Rate Limit Hits**: Rate limit violations per minute
- **Token Consumption**: Token consumption rate
- **Traffic Flow**: Traffic distribution metrics
- **Response Time**: Average response time
- **Error Rate**: Error percentage by endpoint
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Rate Limit Logs**: All rate limiting activities
- **Traffic Logs**: Traffic management activities
- **Alert Logs**: Rate limit alert activities
- **Configuration Logs**: Configuration changes
- **Error Logs**: Error details and stack traces
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **gRPC Health**: gRPC service connectivity
- **Rate Limit Health**: Rate limiting service health

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

### Rate Limit Tests

```bash
./mvnw test -Dtest=RateLimitTest
```

### Load Tests

```bash
./mvnw test -Dtest=LoadTest
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

EXPOSE 8089 50062

CMD ["java", "-jar", "target/rate-limiter.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rate-limiter
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rate-limiter
  template:
    metadata:
      labels:
        app: rate-limiter
    spec:
      containers:
        - name: rate-limiter
          image: booking-system/rate-limiter:latest
          ports:
            - containerPort: 8089
            - containerPort: 50062
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: rate-limiter-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

## 🔄 Service Implementation

### Rate Limiter Controller

```java
@RestController
@RequestMapping("/api/v1/rate-limit")
public class RateLimiterController {

    @Autowired
    private RateLimiterService rateLimiterService;

    @PostMapping("/check")
    public ResponseEntity<RateLimitResponse> checkRateLimit(@RequestBody CheckRateLimitRequest request) {
        RateLimitResponse response = rateLimiterService.checkRateLimit(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/consume")
    public ResponseEntity<ConsumeRateLimitResponse> consumeRateLimit(@RequestBody ConsumeRateLimitRequest request) {
        ConsumeRateLimitResponse response = rateLimiterService.consumeRateLimit(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<RateLimitStatusResponse> getRateLimitStatus(@RequestParam String clientId) {
        RateLimitStatusResponse response = rateLimiterService.getRateLimitStatus(clientId);
        return ResponseEntity.ok(response);
    }
}
```

### gRPC Server

```java
@GrpcService
public class RateLimiterGrpcService extends RateLimiterServiceGrpc.RateLimiterServiceImplBase {

    @Autowired
    private RateLimiterService rateLimiterService;

    @Override
    public void checkRateLimit(CheckRateLimitRequest request,
                             StreamObserver<RateLimitResponse> responseObserver) {
        try {
            RateLimitResponse response = rateLimiterService.checkRateLimit(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to check rate limit: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void consumeRateLimit(ConsumeRateLimitRequest request,
                               StreamObserver<ConsumeRateLimitResponse> responseObserver) {
        try {
            ConsumeRateLimitResponse response = rateLimiterService.consumeRateLimit(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to consume rate limit: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### Token Bucket Service

```java
@Service
public class TokenBucketService {

    @Autowired
    private RedisTemplate<String, TokenBucket> redisTemplate;

    public boolean consumeTokens(String clientId, String ruleId, int tokens) {
        String key = "token_bucket:" + clientId + ":" + ruleId;

        // Use Redis Lua script for atomic operation
        String script = """
            local key = KEYS[1]
            local tokens = tonumber(ARGV[1])
            local maxTokens = tonumber(ARGV[2])
            local refillRate = tonumber(ARGV[3])
            local now = tonumber(ARGV[4])

            local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
            local currentTokens = tonumber(bucket[1]) or maxTokens
            local lastRefill = tonumber(bucket[2]) or now

            -- Calculate refill
            local timePassed = now - lastRefill
            local refillAmount = math.floor(timePassed * refillRate / 1000)
            currentTokens = math.min(maxTokens, currentTokens + refillAmount)

            -- Check if enough tokens
            if currentTokens >= tokens then
                currentTokens = currentTokens - tokens
                redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
                redis.call('EXPIRE', key, 3600)
                return 1
            else
                return 0
            end
            """;

        Long result = redisTemplate.execute(new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(key),
            String.valueOf(tokens),
            String.valueOf(100), // maxTokens
            String.valueOf(10),  // refillRate
            String.valueOf(System.currentTimeMillis() / 1000));

        return result != null && result == 1;
    }

    public TokenBucket getTokenBucket(String clientId, String ruleId) {
        String key = "token_bucket:" + clientId + ":" + ruleId;
        return redisTemplate.opsForValue().get(key);
    }

    public void createTokenBucket(String clientId, String ruleId, TokenBucket bucket) {
        String key = "token_bucket:" + clientId + ":" + ruleId;
        redisTemplate.opsForValue().set(key, bucket, Duration.ofHours(1));
    }
}
```

### Rate Limit Rule Engine

```java
@Service
public class RateLimitRuleEngine {

    @Autowired
    private RateLimitRuleRepository ruleRepository;

    @Autowired
    private TokenBucketService tokenBucketService;

    public RateLimitResponse checkRateLimit(CheckRateLimitRequest request) {
        // Find applicable rules
        List<RateLimitRule> rules = findApplicableRules(request);

        for (RateLimitRule rule : rules) {
            if (!isAllowed(request, rule)) {
                return RateLimitResponse.builder()
                    .allowed(false)
                    .ruleId(rule.getId())
                    .limit(rule.getLimitValue())
                    .remaining(0)
                    .resetTime(calculateResetTime(rule))
                    .build();
            }
        }

        return RateLimitResponse.builder()
            .allowed(true)
            .limit(getTotalLimit(rules))
            .remaining(calculateRemaining(request, rules))
            .resetTime(calculateNextResetTime(rules))
            .build();
    }

    private boolean isAllowed(CheckRateLimitRequest request, RateLimitRule rule) {
        switch (rule.getAlgorithm()) {
            case "token_bucket":
                return tokenBucketService.consumeTokens(request.getClientId(), rule.getId().toString(), 1);
            case "fixed_window":
                return checkFixedWindow(request, rule);
            case "sliding_window":
                return checkSlidingWindow(request, rule);
            default:
                return true;
        }
    }

    private boolean checkFixedWindow(CheckRateLimitRequest request, RateLimitRule rule) {
        String key = "fixed_window:" + request.getClientId() + ":" + rule.getId();

        // Get current window count
        String currentCount = redisTemplate.opsForValue().get(key);
        int count = currentCount != null ? Integer.parseInt(currentCount) : 0;

        if (count >= rule.getLimitValue()) {
            return false;
        }

        // Increment count
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, Duration.ofSeconds(rule.getTimeWindowSeconds()));

        return true;
    }
}
```

## 🛡️ Security Best Practices

### Data Security

- **Rate Limit Data Protection**: Secure rate limit information
- **Configuration Security**: Secure rate limit configurations
- **Access Control**: Strict access control for rate limiting
- **Audit Trail**: Complete audit trail for all operations

### Privacy Protection

- **Client Data Protection**: Protect client identification data
- **IP Privacy**: Handle IP address privacy
- **Data Retention**: Follow data retention policies
- **Consent Management**: Respect user consent

### API Security

- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Self-rate limiting for the service
- **Authentication**: Strong authentication mechanisms
- **Authorization**: Role-based access control

## 📞 Troubleshooting

### Common Issues

1. **Rate Limit Failures**: Check Redis connectivity
2. **Token Bucket Issues**: Verify token bucket configuration
3. **Rule Application Issues**: Check rule configuration
4. **gRPC Connection Issues**: Verify service endpoints
5. **Performance Issues**: Monitor Redis performance

### Debug Commands

```bash
# Check service health
curl http://rate-limiter:8089/actuator/health

# Check gRPC health
grpc_health_probe -addr=rate-limiter:50062

# Check Redis
redis-cli -h localhost -p 6379 ping

# Monitor rate limit events
kafka-console-consumer --bootstrap-server kafka:9092 --topic rate-limit-events

# Check rate limit counters
redis-cli -h localhost -p 6379 keys "rate_limit:*"

# Check token buckets
redis-cli -h localhost -p 6379 keys "token_bucket:*"
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **Gateway Service**: API gateway integration

### Infrastructure

- **PostgreSQL**: Rate limit data storage
- **Redis**: Rate limiting counters and cache
- **Kafka**: Event streaming
- **Protocol Buffers**: Message serialization

### External APIs

- **Monitoring Service**: Rate limit monitoring
- **Alert Service**: Rate limit alerts
- **Analytics Service**: Rate limiting analytics
