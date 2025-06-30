# Pricing Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Dynamic pricing, rule engine, promotions
- Handles complex business logic

## Overview

The Pricing Service is responsible for managing dynamic pricing, discounts, promotions, and pricing strategies for events and tickets. It handles price calculations, discount applications, promotional campaigns, and provides real-time pricing updates with support for complex pricing rules and market conditions.

## 🎯 Responsibilities

- **Dynamic Pricing**: Calculate prices based on demand and supply
- **Discount Management**: Handle various types of discounts
- **Promotional Campaigns**: Manage promotional pricing
- **Price Rules**: Apply complex pricing rules and conditions
- **Market Analysis**: Analyze market conditions for pricing
- **Price History**: Track price changes over time
- **Revenue Optimization**: Optimize pricing for maximum revenue
- **gRPC Communication**: Inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (pricing data, rules)
- **Cache**: Redis (price cache, rules cache)
- **Message Queue**: Kafka (pricing events, updates)
- **gRPC**: grpc-java for inter-service communication
- **ML Engine**: TensorFlow, Scikit-learn (demand prediction)
- **Time Series DB**: InfluxDB (price history)
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Pricing Service
├── Price Calculator
├── Discount Manager
├── Promotion Engine
├── Rule Engine
├── Market Analyzer
├── ML Predictor
├── Price Optimizer
├── gRPC Server/Client
└── Event Publisher
```

## 🔄 Pricing Flow

### Price Calculation Flow

```
Event/Ticket Request
    ↓
Base Price Lookup
    ↓
Rule Application
    ↓
Market Analysis
    ↓
Demand Prediction
    ↓
Dynamic Pricing
    ↓
Discount Application
    ↓
Promotion Check
    ↓
Final Price Calculation
    ↓
Price Cache Update
    ↓
Price Published
```

### Discount Application Flow

```
Discount Request
    ↓
Discount Validation
    ↓
Eligibility Check
    ↓
Discount Calculation
    ↓
Price Update
    ↓
Inventory Check
    ↓
Discount Applied
    ↓
Event Publishing
```

### Promotion Management Flow

```
Promotion Creation
    ↓
Rule Definition
    ↓
Target Audience
    ↓
Promotion Activation
    ↓
Price Updates
    ↓
Monitoring
    ↓
Performance Analysis
    ↓
Promotion Adjustment
```

## 📡 API Endpoints

### REST API

```http
# Price Management
GET    /api/v1/prices/{eventId}              # Get event prices
POST   /api/v1/prices/calculate              # Calculate price
PUT    /api/v1/prices/{eventId}              # Update prices
GET    /api/v1/prices/{eventId}/history      # Get price history
GET    /api/v1/prices/trends                 # Get price trends

# Discount Management
GET    /api/v1/discounts                     # List discounts
GET    /api/v1/discounts/{id}                # Get discount by ID
POST   /api/v1/discounts                     # Create discount
PUT    /api/v1/discounts/{id}                # Update discount
DELETE /api/v1/discounts/{id}                # Delete discount
POST   /api/v1/discounts/apply               # Apply discount

# Promotion Management
GET    /api/v1/promotions                    # List promotions
GET    /api/v1/promotions/{id}               # Get promotion by ID
POST   /api/v1/promotions                    # Create promotion
PUT    /api/v1/promotions/{id}               # Update promotion
DELETE /api/v1/promotions/{id}               # Delete promotion
POST   /api/v1/promotions/activate           # Activate promotion

# Pricing Rules
GET    /api/v1/rules                         # List pricing rules
GET    /api/v1/rules/{id}                    # Get rule by ID
POST   /api/v1/rules                         # Create rule
PUT    /api/v1/rules/{id}                    # Update rule
DELETE /api/v1/rules/{id}                    # Delete rule
POST   /api/v1/rules/validate                # Validate rule

# Market Analysis
GET    /api/v1/market/analysis               # Get market analysis
GET    /api/v1/market/demand                 # Get demand forecast
GET    /api/v1/market/competition            # Get competition analysis
POST   /api/v1/market/optimize               # Optimize pricing

# Analytics
GET    /api/v1/analytics/revenue             # Get revenue analytics
GET    /api/v1/analytics/performance         # Get performance metrics
GET    /api/v1/analytics/predictions         # Get pricing predictions
```

### gRPC Services

```protobuf
service PricingService {
  rpc CalculatePrice(CalculatePriceRequest) returns (PriceResponse);
  rpc GetPrices(GetPricesRequest) returns (PricesResponse);
  rpc UpdatePrices(UpdatePricesRequest) returns (UpdatePricesResponse);
  rpc GetPriceHistory(GetPriceHistoryRequest) returns (PriceHistoryResponse);
  rpc GetPriceTrends(GetPriceTrendsRequest) returns (PriceTrendsResponse);

  rpc CreateDiscount(CreateDiscountRequest) returns (DiscountResponse);
  rpc GetDiscount(GetDiscountRequest) returns (DiscountResponse);
  rpc UpdateDiscount(UpdateDiscountRequest) returns (DiscountResponse);
  rpc DeleteDiscount(DeleteDiscountRequest) returns (DeleteDiscountResponse);
  rpc ApplyDiscount(ApplyDiscountRequest) returns (ApplyDiscountResponse);

  rpc CreatePromotion(CreatePromotionRequest) returns (PromotionResponse);
  rpc GetPromotion(GetPromotionRequest) returns (PromotionResponse);
  rpc UpdatePromotion(UpdatePromotionRequest) returns (PromotionResponse);
  rpc DeletePromotion(DeletePromotionRequest) returns (DeletePromotionResponse);
  rpc ActivatePromotion(ActivatePromotionRequest) returns (ActivatePromotionResponse);

  rpc CreateRule(CreateRuleRequest) returns (RuleResponse);
  rpc GetRule(GetRuleRequest) returns (RuleResponse);
  rpc UpdateRule(UpdateRuleRequest) returns (RuleResponse);
  rpc DeleteRule(DeleteRuleRequest) returns (DeleteRuleResponse);
  rpc ValidateRule(ValidateRuleRequest) returns (ValidateRuleResponse);

  rpc GetMarketAnalysis(GetMarketAnalysisRequest) returns (MarketAnalysisResponse);
  rpc GetDemandForecast(GetDemandForecastRequest) returns (DemandForecastResponse);
  rpc OptimizePricing(OptimizePricingRequest) returns (OptimizePricingResponse);
}

service PricingEventService {
  rpc PublishPricingEvent(PricingEvent) returns (EventResponse);
  rpc SubscribeToPricingEvents(SubscribeRequest) returns (stream PricingEvent);
}
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate JWT tokens from Auth Service
- **Role-Based Access**: Different access levels for pricing
- **Admin Access**: Admin users have full pricing control
- **Audit Trail**: Track all pricing changes

### Data Protection

- **Pricing Data Encryption**: Encrypt sensitive pricing data
- **Rule Protection**: Secure pricing rules
- **Audit Logging**: Log all pricing operations
- **Data Validation**: Validate all pricing data

### API Security

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all input data
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

## 📊 Database Schema

### Prices Table

```sql
CREATE TABLE prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    ticket_type VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_strategy VARCHAR(50),
    demand_level VARCHAR(20),
    supply_level VARCHAR(20),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Price History Table

```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_id UUID REFERENCES prices(id),
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    change_reason VARCHAR(100),
    change_type VARCHAR(20),
    demand_factor DECIMAL(5,2),
    supply_factor DECIMAL(5,2),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Discounts Table

```sql
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2),
    minimum_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Promotions Table

```sql
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    promotion_type VARCHAR(50) NOT NULL,
    discount_id UUID REFERENCES discounts(id),
    target_audience JSONB,
    conditions JSONB,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    performance_metrics JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Pricing Rules Table

```sql
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    applies_to JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Market Data Table

```sql
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    data_type VARCHAR(50) NOT NULL,
    data_value DECIMAL(15,2) NOT NULL,
    data_date DATE NOT NULL,
    source VARCHAR(100),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Demand Predictions Table

```sql
CREATE TABLE demand_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    prediction_date DATE NOT NULL,
    predicted_demand INTEGER NOT NULL,
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,
    model_version VARCHAR(20),
    factors JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8087
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pricing_service_db
SPRING_DATASOURCE_USERNAME=pricing_service_user
SPRING_DATASOURCE_PASSWORD=pricing_service_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=10

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_PRICING_EVENTS=pricing-events
KAFKA_TOPIC_BOOKING_EVENTS=booking-events
KAFKA_TOPIC_MARKET_EVENTS=market-events
KAFKA_GROUP_ID=pricing-service

# gRPC Configuration
GRPC_SERVER_PORT=50060
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_EVENT_SERVICE_URL=event-management:50058
GRPC_ANALYTICS_SERVICE_URL=analytics-service:50057
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# InfluxDB Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=booking-system
INFLUXDB_BUCKET=pricing-data

# ML Configuration
ML_MODEL_PATH=/models
ML_PREDICTION_BATCH_SIZE=1000
ML_MODEL_UPDATE_INTERVAL=3600000
ML_CONFIDENCE_THRESHOLD=0.8

# Pricing Configuration
PRICING_UPDATE_INTERVAL=300000
PRICING_CACHE_TTL=300
PRICING_MAX_INCREASE_PERCENT=50
PRICING_MAX_DECREASE_PERCENT=30
PRICING_DEMAND_THRESHOLD=0.7
PRICING_SUPPLY_THRESHOLD=0.3

# Discount Configuration
DISCOUNT_MAX_PERCENTAGE=50
DISCOUNT_MIN_AMOUNT=1.00
DISCOUNT_CODE_LENGTH=8
DISCOUNT_EXPIRY_DAYS=30

# Promotion Configuration
PROMOTION_MAX_DURATION_DAYS=90
PROMOTION_MIN_DISCOUNT_PERCENTAGE=5
PROMOTION_MAX_DISCOUNT_PERCENTAGE=80

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

### Caching Strategy

- **Price Cache**: Cache calculated prices
- **Rule Cache**: Cache pricing rules
- **Discount Cache**: Cache discount information
- **Market Cache**: Cache market data

### Database Optimization

- **Indexing**: Optimize database indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex queries
- **Partitioning**: Partition large tables

### ML Optimization

- **Model Caching**: Cache ML models
- **Batch Processing**: Process predictions in batches
- **Async Processing**: Async prediction generation
- **Model Optimization**: Optimize model performance

## 📊 Monitoring & Observability

### Metrics

- **Price Calculation Rate**: Price calculations per minute
- **Discount Application Rate**: Discount applications per minute
- **Promotion Performance**: Promotion effectiveness metrics
- **ML Prediction Accuracy**: Prediction accuracy metrics
- **API Response Time**: Average API response time
- **Error Rate**: Error percentage by endpoint
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Price Logs**: All price calculations
- **Discount Logs**: Discount applications
- **Promotion Logs**: Promotion activities
- **ML Logs**: Machine learning activities
- **Error Logs**: Error details and stack traces
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **InfluxDB Health**: Time series database health
- **ML Service Health**: Machine learning service health
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

### ML Tests

```bash
./mvnw test -Dtest=MLTest
```

### Pricing Tests

```bash
./mvnw test -Dtest=PricingTest
```

### Performance Tests

```bash
./mvnw test -Dtest=PerformanceTest
```

## 🚀 Deployment

### Docker

```dockerfile
FROM openjdk:17-jdk-slim

# Install protobuf compiler and Python for ML
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

EXPOSE 8087 50060

CMD ["java", "-jar", "target/pricing-service.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pricing-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pricing-service
  template:
    metadata:
      labels:
        app: pricing-service
    spec:
      containers:
        - name: pricing-service
          image: booking-system/pricing-service:latest
          ports:
            - containerPort: 8087
            - containerPort: 50060
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: pricing-service-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: INFLUXDB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: pricing-service-secrets
                  key: influxdb-token
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
      volumes:
        - name: ml-models
          persistentVolumeClaim:
            claimName: ml-models-pvc
```

## 🔄 Service Implementation

### Pricing Controller

```java
@RestController
@RequestMapping("/api/v1/prices")
public class PricingController {

    @Autowired
    private PricingService pricingService;

    @PostMapping("/calculate")
    public ResponseEntity<PriceResponse> calculatePrice(@RequestBody CalculatePriceRequest request) {
        PriceResponse response = pricingService.calculatePrice(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<PricesResponse> getPrices(@PathVariable UUID eventId) {
        PricesResponse response = pricingService.getPrices(eventId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventId}/history")
    public ResponseEntity<PriceHistoryResponse> getPriceHistory(@PathVariable UUID eventId) {
        PriceHistoryResponse response = pricingService.getPriceHistory(eventId);
        return ResponseEntity.ok(response);
    }
}
```

### gRPC Server

```java
@GrpcService
public class PricingGrpcService extends PricingServiceGrpc.PricingServiceImplBase {

    @Autowired
    private PricingService pricingService;

    @Override
    public void calculatePrice(CalculatePriceRequest request,
                             StreamObserver<PriceResponse> responseObserver) {
        try {
            PriceResponse response = pricingService.calculatePrice(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to calculate price: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void getPrices(GetPricesRequest request,
                         StreamObserver<PricesResponse> responseObserver) {
        try {
            PricesResponse response = pricingService.getPrices(request.getEventId());
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.NOT_FOUND
                .withDescription("Prices not found: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### Price Calculator

```java
@Service
public class PriceCalculatorService {

    @Autowired
    private PricingRuleEngine ruleEngine;

    @Autowired
    private MarketAnalyzer marketAnalyzer;

    @Autowired
    private DemandPredictor demandPredictor;

    public PriceResponse calculatePrice(CalculatePriceRequest request) {
        // Get base price
        BigDecimal basePrice = getBasePrice(request.getEventId(), request.getTicketType());

        // Apply pricing rules
        BigDecimal ruleAdjustedPrice = ruleEngine.applyRules(basePrice, request);

        // Analyze market conditions
        MarketConditions marketConditions = marketAnalyzer.analyzeMarket(request.getEventId());

        // Predict demand
        DemandPrediction demandPrediction = demandPredictor.predictDemand(request.getEventId());

        // Calculate dynamic price
        BigDecimal dynamicPrice = calculateDynamicPrice(ruleAdjustedPrice, marketConditions, demandPrediction);

        // Apply discounts
        BigDecimal finalPrice = applyDiscounts(dynamicPrice, request.getDiscountCodesList());

        return PriceResponse.builder()
            .eventId(request.getEventId())
            .ticketType(request.getTicketType())
            .basePrice(basePrice)
            .currentPrice(finalPrice)
            .currency("USD")
            .pricingFactors(buildPricingFactors(marketConditions, demandPrediction))
            .build();
    }

    private BigDecimal calculateDynamicPrice(BigDecimal basePrice, MarketConditions conditions, DemandPrediction prediction) {
        // Implement dynamic pricing algorithm
        BigDecimal demandFactor = prediction.getDemandFactor();
        BigDecimal supplyFactor = conditions.getSupplyFactor();

        // Adjust price based on demand and supply
        if (demandFactor.compareTo(BigDecimal.valueOf(0.8)) > 0) {
            // High demand - increase price
            return basePrice.multiply(BigDecimal.valueOf(1.1));
        } else if (supplyFactor.compareTo(BigDecimal.valueOf(0.3)) < 0) {
            // Low supply - increase price
            return basePrice.multiply(BigDecimal.valueOf(1.05));
        } else if (demandFactor.compareTo(BigDecimal.valueOf(0.3)) < 0) {
            // Low demand - decrease price
            return basePrice.multiply(BigDecimal.valueOf(0.95));
        }

        return basePrice;
    }
}
```

### Discount Service

```java
@Service
public class DiscountService {

    @Autowired
    private DiscountRepository discountRepository;

    public ApplyDiscountResponse applyDiscount(ApplyDiscountRequest request) {
        // Validate discount code
        Discount discount = discountRepository.findByCode(request.getDiscountCode())
            .orElseThrow(() -> new DiscountNotFoundException("Discount not found"));

        // Check if discount is valid
        validateDiscount(discount);

        // Calculate discount amount
        BigDecimal discountAmount = calculateDiscountAmount(discount, request.getAmount());

        // Apply discount
        BigDecimal finalAmount = request.getAmount().subtract(discountAmount);

        // Update usage count
        discount.setUsedCount(discount.getUsedCount() + 1);
        discountRepository.save(discount);

        return ApplyDiscountResponse.builder()
            .originalAmount(request.getAmount())
            .discountAmount(discountAmount)
            .finalAmount(finalAmount)
            .discountCode(discount.getCode())
            .build();
    }

    private void validateDiscount(Discount discount) {
        if (!discount.getIsActive()) {
            throw new DiscountExpiredException("Discount is not active");
        }

        if (discount.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new DiscountExpiredException("Discount has expired");
        }

        if (discount.getUsageLimit() != null &&
            discount.getUsedCount() >= discount.getUsageLimit()) {
            throw new DiscountLimitExceededException("Discount usage limit exceeded");
        }
    }

    private BigDecimal calculateDiscountAmount(Discount discount, BigDecimal amount) {
        if ("percentage".equals(discount.getDiscountType())) {
            BigDecimal discountAmount = amount.multiply(discount.getDiscountPercentage())
                .divide(BigDecimal.valueOf(100));

            // Apply maximum discount limit
            if (discount.getMaximumDiscount() != null &&
                discountAmount.compareTo(discount.getMaximumDiscount()) > 0) {
                return discount.getMaximumDiscount();
            }

            return discountAmount;
        } else {
            return discount.getDiscountValue();
        }
    }
}
```

## 🛡️ Security Best Practices

### Data Security

- **Pricing Data Protection**: Secure pricing information
- **Rule Protection**: Secure pricing rules
- **Access Control**: Strict access control for pricing
- **Audit Trail**: Complete audit trail for all operations

### Privacy Protection

- **Personal Data Protection**: Protect customer data
- **Pricing Privacy**: Control pricing information access
- **Data Retention**: Follow data retention policies
- **Consent Management**: Respect user consent

### API Security

- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Strong authentication mechanisms
- **Authorization**: Role-based access control

## 📞 Troubleshooting

### Common Issues

1. **Price Calculation Failures**: Check pricing rules
2. **Discount Issues**: Verify discount validation
3. **ML Prediction Failures**: Check model accuracy
4. **gRPC Connection Issues**: Verify service endpoints
5. **Performance Issues**: Monitor cache hit rates

### Debug Commands

```bash
# Check service health
curl http://pricing-service:8087/actuator/health

# Check gRPC health
grpc_health_probe -addr=pricing-service:50060

# Check InfluxDB
curl http://localhost:8086/health

# Monitor pricing events
kafka-console-consumer --bootstrap-server kafka:9092 --topic pricing-events

# Check ML model status
curl http://pricing-service:8087/actuator/ml-health
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **Booking Service**: Booking data for pricing
- **Event Service**: Event information
- **Analytics Service**: Market analytics data

### Infrastructure

- **PostgreSQL**: Pricing data storage
- **Redis**: Caching and session management
- **Kafka**: Event streaming
- **InfluxDB**: Time series data storage
- **Protocol Buffers**: Message serialization

### External APIs

- **ML Service**: Machine learning predictions
- **Market Data Service**: Market information
- **Analytics Service**: Performance analytics
