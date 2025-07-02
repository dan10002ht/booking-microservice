# Email Worker Service - Implementation Steps

## Overview

Email Worker là một microservice xử lý email jobs bất đồng bộ trong hệ thống booking. Service này nhận các email jobs từ queue và gửi email thông qua các provider khác nhau (SendGrid, AWS SES, SMTP).

## Step 1: Project Structure Setup

Tạo cấu trúc thư mục cho email-worker service:

```
email-worker/
├── config/          # Cấu hình service
├── database/        # Database models và repositories
├── queue/           # Queue handling (Redis/Kafka)
├── grpcclient/      # gRPC client connections
├── services/        # Business logic services
├── providers/       # Email providers (SendGrid, SES, SMTP)
├── processor/       # Job processor và workers
├── templates/       # Email templates
├── metrics/         # Prometheus metrics
├── logging/         # Logging configuration
├── utils/           # Utility functions
├── models/          # Data models
├── types/           # Type definitions
├── constants/       # Constants
├── tests/           # Unit tests
├── scripts/         # Build/deployment scripts
└── docs/            # Documentation
```

## Step 2: Initialize Go Module

Tạo file `go.mod` với các dependencies cần thiết:

```go
module email-worker

go 1.21

require (
    github.com/aws/aws-sdk-go v1.50.0
    github.com/go-redis/redis/v8 v8.11.5
    github.com/golang/protobuf v1.5.3
    github.com/sendgrid/sendgrid-go v3.14.0
    github.com/spf13/viper v1.18.2
    google.golang.org/grpc v1.60.1
    // ... other dependencies
)
```

## Step 3: Configuration Management

Sử dụng Viper để quản lý configuration từ environment variables và config files:

```go
// config/config.go
type Config struct {
    Server   ServerConfig   `mapstructure:"server"`
    Database DatabaseConfig `mapstructure:"database"`
    Redis    RedisConfig    `mapstructure:"redis"`
    Email    EmailConfig    `mapstructure:"email"`
    // ...
}

func LoadConfig() (*Config, error) {
    viper.SetConfigName("config")
    viper.SetConfigType("yaml")
    viper.AddConfigPath(".")
    viper.AutomaticEnv()

    if err := viper.ReadInConfig(); err != nil {
        return nil, err
    }

    var config Config
    if err := viper.Unmarshal(&config); err != nil {
        return nil, err
    }

    return &config, nil
}
```

## Step 4: Database Schema Design

Thiết kế database schema với 3 bảng chính:

```sql
-- Email Jobs Table
CREATE TABLE email_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_id VARCHAR(100),
    template_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE email_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    html_template TEXT,
    text_template TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Tracking Table
CREATE TABLE email_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES email_jobs(id),
    provider VARCHAR(50),
    message_id VARCHAR(255),
    status VARCHAR(50),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Step 5: Database Models

Tạo Go structs cho database models:

```go
// models/emailJob.go
type EmailJob struct {
    ID             uuid.UUID       `db:"id" json:"id"`
    JobType        string          `db:"job_type" json:"job_type"`
    RecipientEmail string          `db:"recipient_email" json:"recipient_email"`
    Subject        *string         `db:"subject" json:"subject"`
    TemplateID     *string         `db:"template_id" json:"template_id"`
    TemplateData   *map[string]any `db:"template_data" json:"template_data"`
    Status         string          `db:"status" json:"status"`
    Priority       int             `db:"priority" json:"priority"`
    RetryCount     int             `db:"retry_count" json:"retry_count"`
    MaxRetries     int             `db:"max_retries" json:"max_retries"`
    ScheduledAt    *time.Time      `db:"scheduled_at" json:"scheduled_at"`
    CreatedAt      time.Time       `db:"created_at" json:"created_at"`
    UpdatedAt      time.Time       `db:"updated_at" json:"updated_at"`
}
```

## Step 6: gRPC Service Definition

Định nghĩa gRPC service cho email worker:

```protobuf
// shared-lib/protos/email.proto
service EmailService {
    rpc CreateEmailJob(CreateEmailJobRequest) returns (CreateEmailJobResponse);
    rpc GetEmailJob(GetEmailJobRequest) returns (GetEmailJobResponse);
    rpc ListEmailJobs(ListEmailJobsRequest) returns (ListEmailJobsResponse);
    rpc UpdateEmailJobStatus(UpdateEmailJobStatusRequest) returns (UpdateEmailJobStatusResponse);
    rpc CreateEmailTemplate(CreateEmailTemplateRequest) returns (CreateEmailTemplateResponse);
    rpc GetEmailTemplate(GetEmailTemplateRequest) returns (GetEmailTemplateResponse);
    rpc UpdateEmailTemplate(UpdateEmailTemplateRequest) returns (UpdateEmailTemplateResponse);
    rpc DeleteEmailTemplate(DeleteEmailTemplateRequest) returns (DeleteEmailTemplateResponse);
    rpc GetEmailTracking(GetEmailTrackingRequest) returns (GetEmailTrackingResponse);
    rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}
```

## Step 7: Email Providers Implementation

Implement các email providers khác nhau:

```go
// providers/sendgrid.go
type SendGridProvider struct {
    apiKey string
    client *sendgrid.Client
}

func (p *SendGridProvider) SendEmail(job *models.EmailJob, template *models.EmailTemplate) error {
    message := sendgrid.NewMail()
    message.SetFrom("noreply@example.com")
    message.AddTo(job.RecipientEmail)
    message.SetSubject(job.Subject)
    message.SetHTML(template.HTMLTemplate)

    response, err := p.client.Send(message)
    if err != nil {
        return fmt.Errorf("sendgrid send error: %w", err)
    }

    return nil
}
```

## Step 8: Template Rendering

Implement template rendering với Go templates:

```go
// services/templateService.go
func (s *TemplateService) RenderTemplate(template *models.EmailTemplate, data map[string]any) (string, string, error) {
    // Render HTML template
    htmlTmpl, err := template.New("html").Parse(template.HTMLTemplate)
    if err != nil {
        return "", "", fmt.Errorf("parse html template: %w", err)
    }

    var htmlBuffer bytes.Buffer
    if err := htmlTmpl.Execute(&htmlBuffer, data); err != nil {
        return "", "", fmt.Errorf("execute html template: %w", err)
    }

    // Render text template
    textTmpl, err := template.New("text").Parse(template.TextTemplate)
    if err != nil {
        return "", "", fmt.Errorf("parse text template: %w", err)
    }

    var textBuffer bytes.Buffer
    if err := textTmpl.Execute(&textBuffer, data); err != nil {
        return "", "", fmt.Errorf("execute text template: %w", err)
    }

    return htmlBuffer.String(), textBuffer.String(), nil
}
```

## Step 9: Job Processor Implementation

Implement job processor với worker pool pattern:

```go
// processor/processor.go
type Processor struct {
    config     *config.Config
    jobRepo    *database.EmailJobRepository
    emailSvc   *services.EmailService
    logger     *zap.Logger
    workers    int
    stopChan   chan struct{}
    wg         sync.WaitGroup
}

func (p *Processor) Start() error {
    p.logger.Info("Starting email job processor", zap.Int("workers", p.workers))

    for i := 0; i < p.workers; i++ {
        p.wg.Add(1)
        go p.worker(i)
    }

    return nil
}

func (p *Processor) worker(id int) {
    defer p.wg.Done()

    ticker := time.NewTicker(5 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-p.stopChan:
            return
        case <-ticker.C:
            p.processJobs()
        }
    }
}
```

## Step 10: Main Application Entry Point

Tạo main.go để khởi động service:

```go
// main.go
func main() {
    // Load configuration
    cfg, err := config.LoadConfig()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Initialize logger
    logger, err := logging.NewLogger(cfg.Logging)
    if err != nil {
        log.Fatalf("Failed to initialize logger: %v", err)
    }
    defer logger.Sync()

    // Initialize database connection
    db, err := database.NewConnection(cfg.Database)
    if err != nil {
        logger.Fatal("Failed to connect to database", zap.Error(err))
    }
    defer db.Close()

    // Initialize services
    jobRepo := database.NewEmailJobRepository(db)
    emailSvc := services.NewEmailService(cfg, jobRepo, logger)

    // Start processor
    processor := processor.NewProcessor(cfg, jobRepo, emailSvc, logger)
    if err := processor.Start(); err != nil {
        logger.Fatal("Failed to start processor", zap.Error(err))
    }

    // Graceful shutdown
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    <-sigChan
    logger.Info("Shutting down email worker...")

    processor.Stop()
    logger.Info("Email worker stopped")
}
```

## Step 11: Error Handling và Retry Logic

Implement retry logic cho failed jobs:

```go
// services/emailService.go
func (s *EmailService) processJobWithRetry(job *models.EmailJob) error {
    maxRetries := job.MaxRetries
    if maxRetries == 0 {
        maxRetries = 3
    }

    for attempt := 0; attempt <= maxRetries; attempt++ {
        err := s.processJob(job)
        if err == nil {
            return nil
        }

        if attempt < maxRetries {
            s.logger.Warn("Job processing failed, retrying",
                zap.String("job_id", job.ID.String()),
                zap.Int("attempt", attempt+1),
                zap.Error(err))

            // Exponential backoff
            backoff := time.Duration(attempt+1) * time.Second
            time.Sleep(backoff)
        }
    }

    return fmt.Errorf("job failed after %d retries", maxRetries)
}
```

## Step 12: Metrics và Monitoring

Thêm Prometheus metrics:

```go
// metrics/metrics.go
var (
    EmailJobsProcessed = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "email_jobs_processed_total",
            Help: "Total number of email jobs processed",
        },
        []string{"status", "job_type"},
    )

    EmailJobProcessingDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "email_job_processing_duration_seconds",
            Help:    "Time spent processing email jobs",
            Buckets: prometheus.DefBuckets,
        },
        []string{"job_type"},
    )
)
```

## Step 13: Testing

Tạo unit tests cho các components:

```go
// tests/emailService_test.go
func TestEmailService_CreateEmailJob(t *testing.T) {
    // Setup
    mockRepo := &MockEmailJobRepository{}
    logger := zap.NewNop()
    svc := services.NewEmailService(nil, mockRepo, logger)

    // Test data
    job := &models.EmailJob{
        JobType:        "verification",
        RecipientEmail: "test@example.com",
        TemplateID:     stringPtr("email_verification"),
    }

    // Expectations
    mockRepo.On("Create", mock.AnythingOfType("*models.EmailJob")).Return(nil)

    // Execute
    err := svc.CreateEmailJob(job)

    // Assert
    assert.NoError(t, err)
    mockRepo.AssertExpectations(t)
}
```

## Step 14: Docker Configuration

Tạo Dockerfile cho deployment:

```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o email-worker .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/email-worker .
COPY --from=builder /app/config ./config
COPY --from=builder /app/templates ./templates

EXPOSE 8080
CMD ["./email-worker"]
```

## Step 15: Environment Configuration

Tạo file env.example với các biến môi trường:

```bash
# env.example
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=email_worker
DB_USER=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email Providers
SENDGRID_API_KEY=your_sendgrid_api_key
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Service Configuration
WORKER_COUNT=5
JOB_POLL_INTERVAL=5s
MAX_RETRIES=3
```

## Kết luận

Email Worker service đã được implement đầy đủ với:

- ✅ Cấu trúc project rõ ràng
- ✅ Database schema và models
- ✅ gRPC service definition
- ✅ Email providers (SendGrid, SES, SMTP)
- ✅ Template rendering
- ✅ Job processor với worker pool
- ✅ Error handling và retry logic
- ✅ Metrics và monitoring
- ✅ Unit tests
- ✅ Docker configuration
- ✅ Environment configuration

Service này có thể xử lý các loại email jobs khác nhau như verification, password reset, welcome emails, và organization invitations một cách bất đồng bộ và reliable.
