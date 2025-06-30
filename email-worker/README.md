# Email Worker Service (Pure Go Background Worker)

**Language:** Go (Golang) - Pure Background Processing

**Why Pure Go Background Worker?**

- **Max Performance**: High-performance email delivery with goroutines
- **No HTTP Overhead**: Pure background processing without HTTP server
- **Memory Efficient**: Minimal memory footprint for queue processing
- **Fast Startup**: Quick service startup and recovery
- **Built-in Concurrency**: Native goroutines for parallel processing
- **Perfect for Background Jobs**: Optimized for queue processing and retry logic

## Overview

The Email Worker Service is a high-performance background processing service built in pure Go that handles email generation and delivery asynchronously. It processes email jobs from message queues, generates personalized email content using Go templates, and ensures reliable delivery with sophisticated retry mechanisms and dead letter queues.

**Key Difference**: This is a **pure background worker** - no HTTP server, no REST APIs, only queue processing.

## 🎯 Responsibilities

- **Background Email Processing**: Process email jobs asynchronously with goroutines
- **Template Rendering**: Generate personalized email content using Go templates
- **Email Delivery**: Send emails through multiple providers (SendGrid, AWS SES, SMTP)
- **Retry Logic**: Handle failed deliveries with exponential backoff
- **Dead Letter Queue**: Manage undeliverable emails
- **Email Tracking**: Track email delivery and open rates
- **Bulk Email Processing**: Handle large email campaigns efficiently
- **gRPC Client**: Communicate with other services using grpc-go

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Go 1.23+
- **Framework**: Pure Go (no HTTP framework needed)
- **Database**: PostgreSQL (email tracking, templates)
- **Cache**: Redis (template cache, job status)
- **Message Queue**: Redis Queue + Kafka (email jobs)
- **gRPC**: grpc-go for inter-service communication
- **Email Providers**: SendGrid, AWS SES, SMTP
- **Template Engine**: Go templates (html/template, text/template)
- **Monitoring**: Prometheus + Grafana
- **Logging**: Structured logging with zerolog

### Key Components

```
Email Worker Service (Pure Go)
├── Job Consumer (Kafka/Redis)
├── Template Engine (Go templates)
├── Email Renderer
├── Delivery Manager (SendGrid/SES/SMTP)
├── Retry Handler (Exponential backoff)
├── Dead Letter Queue
├── Tracking Manager
├── gRPC Client (grpc-go)
├── Metrics Collector (Prometheus)
└── Graceful Shutdown Handler
```

## 🔄 Email Processing Flow

### Standard Email Flow

```
Email Job (Queue)
    ↓
Job Validation
    ↓
Template Resolution
    ↓
Content Rendering (Go templates)
    ↓
Email Preparation
    ↓
Delivery Attempt (Concurrent)
    ↓
Status Tracking
    ↓
Retry (if needed)
    ↓
Completion/Dead Letter
```

### Bulk Email Flow

```
Bulk Email Job
    ↓
User Segmentation
    ↓
Template Personalization
    ↓
Batch Processing (Goroutines)
    ↓
Parallel Delivery
    ↓
Progress Tracking
    ↓
Completion Report
```

### Retry Flow

```
Failed Delivery
    ↓
Retry Count Check
    ↓
Exponential Backoff
    ↓
Alternative Provider
    ↓
Delivery Attempt
    ↓
Success or Dead Letter
```

## 📡 Job Types

### Email Job Structure

```json
{
  "id": "job-uuid",
  "type": "email",
  "template": "booking-confirmation",
  "recipient": {
    "email": "user@example.com",
    "name": "John Doe"
  },
  "data": {
    "bookingId": "booking-uuid",
    "eventName": "Concert 2024",
    "ticketCount": 2,
    "totalAmount": 150.0
  },
  "priority": "high",
  "scheduledAt": "2024-01-01T10:00:00Z",
  "retryCount": 0,
  "maxRetries": 3
}
```

### Job Types

```go
// Email job types
const (
    // Booking emails
    JobTypeBookingConfirmation = "booking-confirmation"
    JobTypeBookingCancellation = "booking-cancellation"
    JobTypeBookingReminder     = "booking-reminder"

    // Payment emails
    JobTypePaymentConfirmation = "payment-confirmation"
    JobTypePaymentFailed       = "payment-failed"
    JobTypeRefundConfirmation  = "refund-confirmation"

    // User emails
    JobTypeWelcomeEmail        = "welcome-email"
    JobTypePasswordReset       = "password-reset"
    JobTypeEmailVerification   = "email-verification"

    // Marketing emails
    JobTypeEventAnnouncement   = "event-announcement"
    JobTypeSpecialOffer        = "special-offer"
    JobTypeNewsletter          = "newsletter"

    // System emails
    JobTypeMaintenanceNotice   = "maintenance-notice"
    JobTypeSecurityAlert       = "security-alert"
    JobTypeSystemUpdate        = "system-update"
)
```

## 🔐 Security Features

### Email Security

- **Content Validation**: Validate email content and templates
- **Template Security**: Secure template rendering with Go templates
- **Rate Limiting**: Prevent email abuse with rate limiting
- **Spam Prevention**: Follow email best practices and SPF/DKIM

### Data Protection

- **Personal Data Handling**: Secure personal data processing
- **Template Sanitization**: Sanitize template content
- **Audit Logging**: Log all email activities with structured logging
- **Encryption**: Encrypt sensitive data in transit and at rest

### Provider Security

- **API Key Management**: Secure provider credentials management
- **SSL/TLS**: Secure email transmission
- **Authentication**: Verify provider identity
- **Access Control**: Control provider access

## 📊 Database Schema

### Email Jobs Table

```sql
CREATE TABLE email_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    template VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(100),
    subject VARCHAR(255),
    content TEXT,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_at TIMESTAMP,
    processed_at TIMESTAMP,
    sent_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    provider VARCHAR(50),
    message_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Email Templates Table

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Email Tracking Table

```sql
CREATE TABLE email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES email_jobs(id),
    message_id VARCHAR(100),
    provider VARCHAR(50),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Worker Configuration
WORKER_NAME=email-worker-1
ENVIRONMENT=production
LOG_LEVEL=info
WORKER_CONCURRENCY=10
WORKER_BATCH_SIZE=50

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=email_worker_db
DB_USER=email_worker_user
DB_PASSWORD=email_worker_password
DB_SSL_MODE=require

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=5

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_EMAIL_JOBS=email-jobs
KAFKA_TOPIC_EMAIL_EVENTS=email-events
KAFKA_GROUP_ID=email-worker

# gRPC Configuration
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_USER_SERVICE_URL=user-service:50056
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# Email Configuration
EMAIL_PROVIDER_PRIMARY=sendgrid
EMAIL_PROVIDER_FALLBACK=ses
EMAIL_FROM_ADDRESS=noreply@bookingsystem.com
EMAIL_FROM_NAME=Booking System
EMAIL_REPLY_TO=support@bookingsystem.com

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_TEMPLATE_ID=your_template_id

# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_ses_access_key
AWS_SES_SECRET_KEY=your_ses_secret_key

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_ENCRYPTION=starttls

# Job Configuration
EMAIL_JOB_BATCH_SIZE=50
EMAIL_JOB_CONCURRENCY=10
EMAIL_JOB_TIMEOUT_SECONDS=300
EMAIL_RETRY_DELAY_SECONDS=60
EMAIL_MAX_RETRIES=3
EMAIL_DEAD_LETTER_QUEUE=email-dlq
```

## 🚀 Performance Optimizations

### Go Benefits

- **Goroutines**: Lightweight concurrent processing
- **Memory Efficiency**: Low memory footprint
- **Fast Startup**: Quick service startup and recovery
- **Built-in Concurrency**: Native support for parallel operations
- **Garbage Collection**: Efficient memory management

### Processing Optimization

- **Batch Processing**: Process emails in batches with goroutines
- **Parallel Processing**: Concurrent email delivery
- **Connection Pooling**: Reuse provider connections
- **Template Caching**: Cache rendered templates

### Queue Optimization

- **Priority Queuing**: Priority-based job processing
- **Dead Letter Queue**: Handle failed jobs
- **Retry Logic**: Exponential backoff for retries
- **Job Partitioning**: Partition jobs by type

## 📊 Monitoring & Observability

### Metrics

- **Job Processing Rate**: Jobs processed per minute
- **Delivery Success Rate**: Successful vs failed deliveries
- **Provider Performance**: Performance per email provider
- **Template Usage**: Template usage statistics
- **Retry Rate**: Job retry statistics
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Structured Logging**: JSON formatted logs with zerolog
- **Job Logs**: All job processing activities
- **Delivery Logs**: Email delivery attempts
- **Error Logs**: Job failures and errors
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **Provider Health**: Email provider connectivity
- **gRPC Health**: gRPC service connectivity

## 🧪 Testing

### Unit Tests

```bash
go test ./...
```

### Integration Tests

```bash
go test -tags=integration ./...
```

### gRPC Tests

```bash
go test -tags=grpc ./...
```

### Email Tests

```bash
go test -tags=email ./...
```

### Load Tests

```bash
go test -tags=load ./...
```

## 🚀 Deployment

### Docker

```dockerfile
FROM golang:1.23-alpine AS builder

# Install protobuf compiler
RUN apk add --no-cache protobuf

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy protobuf definitions
COPY shared-lib/protos ./protos

# Generate gRPC code
RUN protoc --go_out=. --go-grpc_out=. ./protos/*.proto

# Copy source code
COPY . .

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o email-worker .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/email-worker .

CMD ["./email-worker"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: email-worker
  template:
    metadata:
      labels:
        app: email-worker
    spec:
      containers:
        - name: email-worker
          image: booking-system/email-worker:latest
          env:
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: email-worker-secrets
                  key: database-host
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: SENDGRID_API_KEY
              valueFrom:
                secretKeyRef:
                  name: email-worker-secrets
                  key: sendgrid-api-key
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "300m"
```

## 🔄 Job Processing Implementation

### Job Consumer

```go
type EmailJobConsumer struct {
    kafkaConsumer *kafka.Consumer
    templateService *TemplateService
    emailService *EmailService
    retryHandler *RetryHandler
    logger zerolog.Logger
}

func (c *EmailJobConsumer) ConsumeEmailJob(job *EmailJob) error {
    c.logger.Info().Str("job_id", job.ID).Msg("Processing email job")

    // Validate job
    if err := c.validateJob(job); err != nil {
        return fmt.Errorf("job validation failed: %w", err)
    }

    // Process job
    result, err := c.processEmailJob(job)
    if err != nil {
        c.retryHandler.HandleRetry(job, err)
        return err
    }

    // Update job status
    c.updateJobStatus(job.ID, result)

    // Publish event
    c.publishEmailEvent(job, result)

    return nil
}

func (c *EmailJobConsumer) processEmailJob(job *EmailJob) (*EmailResult, error) {
    // Resolve template
    template, err := c.templateService.GetTemplate(job.Template)
    if err != nil {
        return nil, fmt.Errorf("template not found: %w", err)
    }

    // Render content
    htmlContent, err := c.templateService.RenderHTML(template, job.Data)
    if err != nil {
        return nil, fmt.Errorf("template rendering failed: %w", err)
    }

    textContent, err := c.templateService.RenderText(template, job.Data)
    if err != nil {
        return nil, fmt.Errorf("text template rendering failed: %w", err)
    }

    // Prepare email
    email := &Email{
        To:      job.Recipient.Email,
        Subject: template.Subject,
        HTML:    htmlContent,
        Text:    textContent,
    }

    // Send email
    return c.emailService.SendEmail(email)
}
```

### Retry Handler

```go
type RetryHandler struct {
    scheduler *Scheduler
    logger    zerolog.Logger
}

func (h *RetryHandler) HandleRetry(job *EmailJob, err error) {
    if job.RetryCount < job.MaxRetries {
        // Calculate delay with exponential backoff
        delay := h.calculateRetryDelay(job.RetryCount)

        // Schedule retry
        h.scheduler.ScheduleRetry(job, delay)

        // Update retry count
        h.updateRetryCount(job.ID)

        h.logger.Info().
            Str("job_id", job.ID).
            Int("retry_count", job.RetryCount+1).
            Dur("delay", delay).
            Msg("Scheduled retry for email job")

    } else {
        // Move to dead letter queue
        h.moveToDeadLetterQueue(job, err)

        h.logger.Error().
            Str("job_id", job.ID).
            Int("retry_count", job.RetryCount).
            Err(err).
            Msg("Email job moved to dead letter queue")
    }
}

func (h *RetryHandler) calculateRetryDelay(retryCount int) time.Duration {
    return time.Duration(math.Pow(2, float64(retryCount))) * time.Minute
}
```

### Email Service

```go
type EmailService struct {
    providers map[string]EmailProvider
    logger    zerolog.Logger
}

func (s *EmailService) SendEmail(email *Email) (*EmailResult, error) {
    // Try primary provider
    result, err := s.providers["sendgrid"].SendEmail(email)
    if err == nil {
        return result, nil
    }

    s.logger.Warn().
        Str("provider", "sendgrid").
        Err(err).
        Msg("Primary provider failed, trying fallback")

    // Fallback to secondary provider
    result, err = s.providers["ses"].SendEmail(email)
    if err != nil {
        return nil, fmt.Errorf("all providers failed: %w", err)
    }

    return result, nil
}
```

## 🛡️ Security Best Practices

### Content Security

- **Template Validation**: Validate email templates
- **Content Sanitization**: Sanitize email content
- **Rate Limiting**: Prevent email abuse
- **Spam Prevention**: Follow email best practices

### Data Security

- **Personal Data Protection**: Secure personal data
- **Template Security**: Secure template management
- **Audit Logging**: Log all email activities
- **Encryption**: Encrypt sensitive data

### Provider Security

- **API Key Management**: Secure provider credentials
- **SSL/TLS**: Secure email transmission
- **Authentication**: Verify provider identity
- **Access Control**: Control provider access

## 📞 Troubleshooting

### Common Issues

1. **Job Processing Failures**: Check job validation
2. **Template Errors**: Verify template syntax
3. **Provider Failures**: Check provider credentials
4. **Queue Issues**: Monitor message queue health
5. **gRPC Connection**: Verify service endpoints

### Debug Commands

```bash
# Check Kafka consumer group
kafka-consumer-groups --bootstrap-server kafka:9092 --group email-worker --describe

# Check Redis queue
redis-cli llen email-jobs

# Monitor email jobs
kafka-console-consumer --bootstrap-server kafka:9092 --topic email-jobs

# Check dead letter queue
redis-cli llen email-dlq

# View logs
docker logs email-worker
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and validation
- **User Service**: User profile information
- **Booking Service**: Booking details for emails

### Go Dependencies

```go
require (
    github.com/go-redis/redis/v8 v8.11.5
    github.com/segmentio/kafka-go v0.4.40
    github.com/rs/zerolog v1.30.0
    github.com/lib/pq v1.10.9
    github.com/prometheus/client_golang v1.16.0
    google.golang.org/grpc v1.58.0
    google.golang.org/protobuf v1.31.0
    github.com/sendgrid/sendgrid-go v3.12.0
    github.com/aws/aws-sdk-go v1.44.327
)
```

## 🎯 Performance Benefits

### Go vs Java Comparison

| Metric                | Go                | Java         |
| --------------------- | ----------------- | ------------ |
| Memory Usage          | ~50MB             | ~200MB       |
| Startup Time          | ~100ms            | ~2-5s        |
| Concurrent Processing | Native goroutines | Thread pools |
| Resource Efficiency   | High              | Medium       |
| Deployment Size       | ~10MB             | ~100MB+      |

### Email Processing Performance

- **Concurrent Processing**: 1000+ emails/second with goroutines
- **Memory Efficiency**: Low memory footprint for bulk processing
- **Fast Recovery**: Quick restart after failures
- **Scalability**: Easy horizontal scaling

## 📈 Monitoring Dashboard

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Email Worker Metrics",
    "panels": [
      {
        "title": "Email Processing Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(email_jobs_processed_total[5m])"
          }
        ]
      },
      {
        "title": "Delivery Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "email_delivery_success_rate"
          }
        ]
      },
      {
        "title": "Active Goroutines",
        "type": "graph",
        "targets": [
          {
            "expr": "go_goroutines"
          }
        ]
      }
    ]
  }
}
```

---

**Built with ❤️ using Pure Go for maximum performance and efficiency**
