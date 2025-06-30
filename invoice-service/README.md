# Invoice Service (Java)

**Language:** Java (Spring Boot)

**Why Java?**

- Invoice, PDF, compliance, audit
- Integrates with payment, email, analytics

## Overview

The Invoice Service is responsible for generating, managing, and processing invoices for bookings and payments. It handles invoice creation, PDF generation, tax calculations, and integration with accounting systems. The service ensures compliance with tax regulations and provides detailed financial reporting.

## 🎯 Responsibilities

- **Invoice Generation**: Create invoices for bookings and payments
- **PDF Generation**: Generate professional PDF invoices
- **Tax Calculation**: Calculate taxes based on location and type
- **Invoice Management**: CRUD operations for invoices
- **Payment Integration**: Link invoices with payment transactions
- **Compliance**: Ensure tax compliance and reporting
- **Reporting**: Generate financial reports and analytics
- **gRPC Communication**: Inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (invoice data, tax rules)
- **Cache**: Redis (invoice cache, tax rates)
- **Message Queue**: Kafka (invoice events)
- **gRPC**: grpc-java for inter-service communication
- **PDF Generation**: iText, Apache PDFBox
- **Template Engine**: Thymeleaf, Freemarker
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Invoice Service
├── Invoice Manager
├── PDF Generator
├── Tax Calculator
├── Template Engine
├── Payment Integrator
├── Compliance Checker
├── Report Generator
├── gRPC Server/Client
└── Event Publisher
```

## 🔄 Invoice Processing Flow

### Invoice Creation Flow

```
Booking/Payment Event
    ↓
Invoice Generation Trigger
    ↓
Data Validation
    ↓
Tax Calculation
    ↓
Invoice Creation
    ↓
PDF Generation
    ↓
Storage & Indexing
    ↓
Event Publishing
    ↓
Notification (Email)
```

### Payment Integration Flow

```
Payment Confirmation
    ↓
Invoice Lookup
    ↓
Payment Status Update
    ↓
Invoice Status Update
    ↓
Receipt Generation
    ↓
Event Publishing
```

### Tax Calculation Flow

```
Invoice Data
    ↓
Location Detection
    ↓
Tax Rate Lookup
    ↓
Tax Calculation
    ↓
Compliance Check
    ↓
Tax Breakdown
    ↓
Final Amount
```

## 📡 API Endpoints

### REST API

```http
# Invoice Management
GET    /api/v1/invoices                    # List invoices
GET    /api/v1/invoices/{id}               # Get invoice by ID
POST   /api/v1/invoices                    # Create invoice
PUT    /api/v1/invoices/{id}               # Update invoice
DELETE /api/v1/invoices/{id}               # Delete invoice

# PDF Generation
GET    /api/v1/invoices/{id}/pdf           # Download PDF
POST   /api/v1/invoices/{id}/regenerate    # Regenerate PDF

# Tax Operations
GET    /api/v1/tax/rates                   # Get tax rates
POST   /api/v1/tax/calculate               # Calculate tax
GET    /api/v1/tax/reports                 # Tax reports

# Reporting
GET    /api/v1/reports/sales               # Sales reports
GET    /api/v1/reports/tax                 # Tax reports
GET    /api/v1/reports/revenue             # Revenue reports
```

### gRPC Services

```protobuf
service InvoiceService {
  rpc CreateInvoice(CreateInvoiceRequest) returns (InvoiceResponse);
  rpc GetInvoice(GetInvoiceRequest) returns (InvoiceResponse);
  rpc UpdateInvoice(UpdateInvoiceRequest) returns (InvoiceResponse);
  rpc DeleteInvoice(DeleteInvoiceRequest) returns (DeleteInvoiceResponse);
  rpc ListInvoices(ListInvoicesRequest) returns (ListInvoicesResponse);
  rpc GeneratePDF(GeneratePDFRequest) returns (GeneratePDFResponse);
  rpc CalculateTax(CalculateTaxRequest) returns (CalculateTaxResponse);
  rpc GetTaxRates(GetTaxRatesRequest) returns (GetTaxRatesResponse);
  rpc GenerateReport(GenerateReportRequest) returns (GenerateReportResponse);
}

service InvoiceEventService {
  rpc PublishInvoiceEvent(InvoiceEvent) returns (EventResponse);
  rpc SubscribeToInvoiceEvents(SubscribeRequest) returns (stream InvoiceEvent);
}
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate JWT tokens from Auth Service
- **Role-Based Access**: Different access levels for users
- **Invoice Ownership**: Users can only access their invoices
- **Admin Access**: Admin users have full access

### Data Protection

- **Sensitive Data Encryption**: Encrypt financial data
- **Audit Logging**: Log all invoice operations
- **Data Masking**: Mask sensitive data in logs
- **Compliance**: GDPR and tax compliance

### API Security

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all input data
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

## 📊 Database Schema

### Invoices Table

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft',
    payment_status VARCHAR(20) DEFAULT 'pending',
    due_date TIMESTAMP,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_date TIMESTAMP,
    pdf_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoice Items Table

```sql
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tax Rates Table

```sql
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    state_code VARCHAR(10),
    city_code VARCHAR(10),
    tax_type VARCHAR(50) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoice Events Table

```sql
CREATE TABLE invoice_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES users(id),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8083
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/invoice_service_db
SPRING_DATASOURCE_USERNAME=invoice_service_user
SPRING_DATASOURCE_PASSWORD=invoice_service_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=6

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_INVOICE_EVENTS=invoice-events
KAFKA_TOPIC_PAYMENT_EVENTS=payment-events
KAFKA_GROUP_ID=invoice-service

# gRPC Configuration
GRPC_SERVER_PORT=50054
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_PAYMENT_SERVICE_URL=payment-service:50055
GRPC_USER_SERVICE_URL=user-service:50056
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# PDF Configuration
PDF_TEMPLATE_PATH=/templates/invoice
PDF_OUTPUT_PATH=/tmp/invoices
PDF_FONT_PATH=/fonts
PDF_WATERMARK_ENABLED=true

# Tax Configuration
TAX_API_ENDPOINT=https://api.taxservice.com
TAX_API_KEY=your_tax_api_key
TAX_CACHE_TTL_SECONDS=3600
TAX_DEFAULT_RATE=8.5

# Storage Configuration
STORAGE_TYPE=s3
AWS_S3_BUCKET=invoice-pdfs
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=your_s3_access_key
AWS_S3_SECRET_KEY=your_s3_secret_key

# Email Configuration
EMAIL_SERVICE_URL=http://email-worker:8082
EMAIL_TEMPLATE_INVOICE=invoice-notification

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Tax Rate Caching**: Cache tax rates in Redis
- **Invoice Caching**: Cache frequently accessed invoices
- **PDF Caching**: Cache generated PDFs
- **Template Caching**: Cache invoice templates

### Database Optimization

- **Indexing**: Optimize database indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex queries
- **Partitioning**: Partition large tables

### PDF Generation

- **Async Processing**: Generate PDFs asynchronously
- **Template Caching**: Cache rendered templates
- **Font Optimization**: Optimize font loading
- **Compression**: Compress PDF files

## 📊 Monitoring & Observability

### Metrics

- **Invoice Creation Rate**: Invoices created per minute
- **PDF Generation Time**: Average PDF generation time
- **Tax Calculation Accuracy**: Tax calculation success rate
- **API Response Time**: Average API response time
- **Error Rate**: Error percentage by endpoint
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Invoice Logs**: All invoice operations
- **PDF Logs**: PDF generation activities
- **Tax Logs**: Tax calculation activities
- **Error Logs**: Error details and stack traces
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **PDF Service Health**: PDF generation service
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

### PDF Tests

```bash
./mvnw test -Dtest=PdfTest
```

### Tax Tests

```bash
./mvnw test -Dtest=TaxTest
```

## 🚀 Deployment

### Docker

```dockerfile
FROM openjdk:17-jdk-slim

# Install protobuf compiler and fonts
RUN apt-get update && apt-get install -y \
    protobuf-compiler \
    fonts-liberation \
    fonts-dejavu \
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

EXPOSE 8083 50054

CMD ["java", "-jar", "target/invoice-service.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: invoice-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: invoice-service
  template:
    metadata:
      labels:
        app: invoice-service
    spec:
      containers:
        - name: invoice-service
          image: booking-system/invoice-service:latest
          ports:
            - containerPort: 8083
            - containerPort: 50054
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: invoice-service-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: AWS_S3_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: invoice-service-secrets
                  key: s3-access-key
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          volumeMounts:
            - name: pdf-templates
              mountPath: /templates
            - name: fonts
              mountPath: /fonts
      volumes:
        - name: pdf-templates
          configMap:
            name: pdf-templates
        - name: fonts
          configMap:
            name: fonts
```

## 🔄 Service Implementation

### Invoice Controller

```java
@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable UUID id) {
        InvoiceResponse response = invoiceService.getInvoice(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> downloadPDF(@PathVariable UUID id) {
        Resource pdf = invoiceService.generatePDF(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + id + ".pdf\"")
            .body(pdf);
    }
}
```

### gRPC Server

```java
@GrpcService
public class InvoiceGrpcService extends InvoiceServiceGrpc.InvoiceServiceImplBase {

    @Autowired
    private InvoiceService invoiceService;

    @Override
    public void createInvoice(CreateInvoiceRequest request,
                            StreamObserver<InvoiceResponse> responseObserver) {
        try {
            InvoiceResponse response = invoiceService.createInvoice(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to create invoice: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void getInvoice(GetInvoiceRequest request,
                          StreamObserver<InvoiceResponse> responseObserver) {
        try {
            InvoiceResponse response = invoiceService.getInvoice(request.getId());
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.NOT_FOUND
                .withDescription("Invoice not found: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### PDF Generator

```java
@Service
public class PDFGeneratorService {

    public byte[] generateInvoicePDF(Invoice invoice) {
        try {
            // Load template
            Template template = templateService.getTemplate("invoice");

            // Prepare data
            Map<String, Object> data = prepareInvoiceData(invoice);

            // Render template
            String html = templateEngine.process(template, data);

            // Convert to PDF
            return convertHtmlToPDF(html);

        } catch (Exception e) {
            throw new PDFGenerationException("Failed to generate PDF", e);
        }
    }

    private byte[] convertHtmlToPDF(String html) {
        // Use iText or PDFBox to convert HTML to PDF
        // Implementation details...
    }
}
```

### Tax Calculator

```java
@Service
public class TaxCalculatorService {

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private RedisTemplate<String, TaxRate> redisTemplate;

    public TaxCalculation calculateTax(InvoiceData data) {
        // Get tax rate from cache or database
        TaxRate taxRate = getTaxRate(data.getLocation());

        // Calculate tax
        BigDecimal taxAmount = data.getAmount()
            .multiply(taxRate.getRate())
            .divide(BigDecimal.valueOf(100));

        return TaxCalculation.builder()
            .taxRate(taxRate.getRate())
            .taxAmount(taxAmount)
            .totalAmount(data.getAmount().add(taxAmount))
            .build();
    }

    private TaxRate getTaxRate(Location location) {
        String cacheKey = "tax_rate:" + location.getCountryCode() + ":" + location.getStateCode();

        // Try cache first
        TaxRate cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        // Get from database
        TaxRate taxRate = taxRateRepository.findByLocation(location);

        // Cache for future use
        redisTemplate.opsForValue().set(cacheKey, taxRate, Duration.ofHours(1));

        return taxRate;
    }
}
```

## 🛡️ Security Best Practices

### Data Protection

- **Financial Data Encryption**: Encrypt all financial data
- **PDF Security**: Secure PDF generation and storage
- **Access Control**: Strict access control for invoices
- **Audit Trail**: Complete audit trail for all operations

### Compliance

- **Tax Compliance**: Ensure tax calculation accuracy
- **Data Retention**: Follow data retention policies
- **Privacy Protection**: Protect customer privacy
- **Regulatory Compliance**: Meet local regulations

### API Security

- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Strong authentication mechanisms
- **Authorization**: Role-based access control

## 📞 Troubleshooting

### Common Issues

1. **PDF Generation Failures**: Check template syntax
2. **Tax Calculation Errors**: Verify tax rate data
3. **gRPC Connection Issues**: Check service endpoints
4. **Storage Issues**: Verify S3 configuration
5. **Performance Issues**: Monitor cache hit rates

### Debug Commands

```bash
# Check service health
curl http://invoice-service:8083/actuator/health

# Check gRPC health
grpc_health_probe -addr=invoice-service:50054

# Check database connection
psql -h localhost -U invoice_service_user -d invoice_service_db

# Check Redis cache
redis-cli -h localhost -p 6379 keys "tax_rate:*"

# Monitor Kafka events
kafka-console-consumer --bootstrap-server kafka:9092 --topic invoice-events
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **Booking Service**: Booking information for invoices
- **Payment Service**: Payment status and details
- **User Service**: User profile information

### Infrastructure

- **PostgreSQL**: Invoice and tax data storage
- **Redis**: Caching and session management
- **Kafka**: Event streaming
- **S3**: PDF storage
- **Protocol Buffers**: Message serialization

### External APIs

- **Tax API**: Tax rate calculations
- **Email Service**: Invoice notifications
- **Storage Service**: File storage
