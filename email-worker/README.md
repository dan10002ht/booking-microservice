# Email Worker Service

A high-performance background email processing service built in Go that handles email delivery asynchronously using a hybrid approach: queue-based processing for performance and database tracking for important emails.

## 🚀 Features

- **Queue-based Processing**: Fast email processing using Redis/Kafka queues
- **Database Tracking**: Persistent tracking for important emails (verification, payments, etc.)
- **Multiple Email Providers**: SendGrid, AWS SES, and SMTP support
- **Template Rendering**: Go templates for personalized email content
- **Retry Logic**: Exponential backoff for failed deliveries
- **Email Tracking**: Track sent, delivered, opened, clicked status
- **Priority Queue**: Priority-based job processing
- **Scheduled Emails**: Send emails at specific times
- **Metrics & Monitoring**: Prometheus metrics and structured logging
- **Graceful Shutdown**: Proper cleanup and job completion

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │ Booking Service │    │ Payment Service │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Email Worker          │
                    │  ┌─────────────────────┐  │
                    │  │   Queue Consumer    │  │
                    │  │  (Redis/Kafka)      │  │
                    │  └─────────────────────┘  │
                    │  ┌─────────────────────┐  │
                    │  │   Job Processor     │  │
                    │  │  (Worker Pool)      │  │
                    │  └─────────────────────┘  │
                    │  ┌─────────────────────┐  │
                    │  │   Email Providers   │  │
                    │  │ • SendGrid          │  │
                    │  │ • AWS SES           │  │
                    │  │ • SMTP              │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      PostgreSQL           │
                    │  • email_jobs (tracking)  │
                    │  • email_templates        │
                    │  • email_tracking         │
                    └───────────────────────────┘
```

## 🔄 Processing Flow

### Fast Path (Queue-based)

```
Service → Queue → Email Worker → Email Provider
```

### Tracked Path (Database + Queue)

```
Service → Database (create job) → Queue → Email Worker → Email Provider → Database (update status)
```

## 🗄️ Database Configuration

### Master-Slave Architecture

The email worker supports a master-slave database configuration for optimal performance:

- **Master Database**: Used for all write operations (INSERT, UPDATE, DELETE)
- **Slave Database**: Used for all read operations (SELECT queries)
- **Fallback**: If slave is unavailable, master is used for reads

### Connection Behavior

| Operation         | Database Used | Purpose                            |
| ----------------- | ------------- | ---------------------------------- |
| Create email job  | Master        | Write job to database              |
| Update job status | Master        | Update job status after processing |
| Get job by ID     | Slave         | Read job details                   |
| List jobs         | Slave         | Read job list for monitoring       |
| Get templates     | Slave         | Read email templates               |
| Delete job        | Master        | Remove job from database           |

### Configuration Priority

1. **Master-Slave Configuration** (recommended): Uses `DB_MASTER_*` and `DB_SLAVE_*` variables
2. **Legacy Single Database**: Falls back to `DB_HOST`, `DB_PORT`, etc. for backward compatibility

## 📦 Installation

### Prerequisites

- Go 1.21+
- Redis 6+ (for queue)
- PostgreSQL 12+ (for tracking)
- Docker (optional)

### Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd email-worker
```

2. **Install dependencies**

```bash
go mod download
```

3. **Set up environment variables**

```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start Redis and PostgreSQL**

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine
docker run -d --name postgres -p 5432:5432 -e POSTGRES_DB=email_worker -e POSTGRES_PASSWORD=password postgres:15
```

### Master-Slave Database Setup

For production environments, it's recommended to use a master-slave database configuration for better performance and reliability:

```bash
# Master database
docker run -d --name postgres-master \
  -p 5432:5432 \
  -e POSTGRES_DB=booking_system \
  -e POSTGRES_USER=booking_user \
  -e POSTGRES_PASSWORD=booking_pass \
  postgres:15

# Slave database
docker run -d --name postgres-slave \
  -p 5433:5432 \
  -e POSTGRES_DB=booking_system \
  -e POSTGRES_USER=booking_user \
  -e POSTGRES_PASSWORD=booking_pass \
  postgres:15
```

**Environment Variables for Master-Slave:**

```bash
DB_MASTER_HOST=localhost
DB_MASTER_PORT=5432
DB_MASTER_NAME=booking_system
DB_MASTER_USER=booking_user
DB_MASTER_PASSWORD=booking_pass

DB_SLAVE_HOST=localhost
DB_SLAVE_PORT=5433
DB_SLAVE_NAME=booking_system
DB_SLAVE_USER=booking_user
DB_SLAVE_PASSWORD=booking_pass
```

6. **Run database migrations**

```bash
# Create database
createdb email_worker

# Run migrations
psql -d email_worker -f database/migrations/001_initial_schema.sql
```

7. **Start the service**

```bash
go run main.go
```

### Docker

```bash
# Build the image
docker build -t email-worker .

# Run the container
docker run -d \
  --name email-worker \
  --env-file .env \
  --network host \
  email-worker
```

## ⚙️ Configuration

### Environment Variables

| Variable                | Description                 | Default          |
| ----------------------- | --------------------------- | ---------------- |
| `REDIS_HOST`            | Redis host                  | `localhost`      |
| `REDIS_PORT`            | Redis port                  | `6379`           |
| `REDIS_PASSWORD`        | Redis password              | -                |
| `REDIS_DB`              | Redis database              | `0`              |
| `DB_MASTER_HOST`        | Master database host        | `localhost`      |
| `DB_MASTER_PORT`        | Master database port        | `5432`           |
| `DB_MASTER_NAME`        | Master database name        | `booking_system` |
| `DB_MASTER_USER`        | Master database user        | `postgres`       |
| `DB_MASTER_PASSWORD`    | Master database password    | -                |
| `DB_SLAVE_HOST`         | Slave database host         | `localhost`      |
| `DB_SLAVE_PORT`         | Slave database port         | `5433`           |
| `DB_SLAVE_NAME`         | Slave database name         | `booking_system` |
| `DB_SLAVE_USER`         | Slave database user         | `postgres`       |
| `DB_SLAVE_PASSWORD`     | Slave database password     | -                |
| `DB_SSL_MODE`           | Database SSL mode           | `disable`        |
| `DB_MAX_OPEN_CONNS`     | Max open connections        | `25`             |
| `DB_MAX_IDLE_CONNS`     | Max idle connections        | `5`              |
| `DB_CONN_MAX_LIFETIME`  | Connection max lifetime     | `5m`             |
| `SENDGRID_API_KEY`      | SendGrid API key            | -                |
| `AWS_SES_REGION`        | AWS SES region              | `us-east-1`      |
| `AWS_ACCESS_KEY_ID`     | AWS access key              | -                |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key              | -                |
| `SMTP_HOST`             | SMTP host                   | -                |
| `SMTP_PORT`             | SMTP port                   | `587`            |
| `SMTP_USERNAME`         | SMTP username               | -                |
| `SMTP_PASSWORD`         | SMTP password               | -                |
| `WORKER_COUNT`          | Number of worker goroutines | `5`              |
| `QUEUE_NAME`            | Queue name for email jobs   | `email-jobs`     |
| `MAX_RETRIES`           | Maximum retry attempts      | `3`              |
| `LOG_LEVEL`             | Logging level               | `info`           |

**Note**: For backward compatibility, legacy single database configuration is also supported using `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` variables.

### Configuration File

Create `config.yaml`:

```yaml
queue:
  redis:
    host: localhost
    port: 6379
    password: ""
    db: 0
  queue_name: email-jobs
  batch_size: 10
  poll_interval: 1s

database:
  # Master-slave configuration (recommended)
  master_host: localhost
  master_port: 5432
  master_name: booking_system
  master_user: postgres
  master_password: password
  slave_host: localhost
  slave_port: 5433
  slave_name: booking_system
  slave_user: postgres
  slave_password: password
  ssl_mode: disable
  max_open_conns: 25
  max_idle_conns: 5
  conn_max_lifetime: 5m

  # Legacy single database configuration (for backward compatibility)
  # host: localhost
  # port: 5432
  # name: email_worker
  # user: postgres
  # password: password

email:
  default_provider: sendgrid
  providers:
    sendgrid:
      api_key: your_sendgrid_api_key
      from_email: noreply@example.com
      from_name: Booking System
    ses:
      region: us-east-1
      access_key: your_access_key
      secret_key: your_secret_key
      from_email: noreply@example.com
    smtp:
      host: smtp.gmail.com
      port: 587
      username: your_email@gmail.com
      password: your_app_password
      use_tls: true

worker:
  worker_count: 5
  batch_size: 10
  poll_interval: 1s
  max_retries: 3
  retry_delay: 5s
  process_timeout: 30s
  cleanup_interval: 1h

server:
  port: 8080
  grpc_port: 50060

logging:
  level: info
  format: json
```

## 📊 Database Schema

### Email Jobs Table (for tracking important emails)

```sql
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

CREATE INDEX idx_email_jobs_status ON email_jobs(status);
CREATE INDEX idx_email_jobs_scheduled_at ON email_jobs(scheduled_at);
CREATE INDEX idx_email_jobs_created_at ON email_jobs(created_at);
```

### Email Templates Table

```sql
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
```

### Email Tracking Table

```sql
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

CREATE INDEX idx_email_tracking_job_id ON email_tracking(job_id);
CREATE INDEX idx_email_tracking_status ON email_tracking(status);
```

## 🔧 Usage

### Sending Emails via Queue (Fast Path)

```go
package main

import (
    "context"
    "encoding/json"

    "booking-system/email-worker/queue"
    "booking-system/email-worker/types"
)

func main() {
    // Create email job
    emailJob := &types.EmailJob{
        Type:           "welcome_email",
        RecipientEmail: "user@example.com",
        TemplateID:     "welcome_template",
        TemplateData: map[string]any{
            "user_name": "John Doe",
        },
        Priority: 1,
    }

    // Send to queue (fast)
    queueClient := queue.NewRedisClient("localhost:6379", "", 0)
    err := queueClient.Publish("email-jobs", emailJob)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("Email job queued successfully")
}
```

### Sending Tracked Emails (Database + Queue)

```go
package main

import (
    "context"

    "booking-system/email-worker/constants"
    "booking-system/email-worker/models"
    "booking-system/email-worker/services"
)

func main() {
    // Create tracked email job
    job := models.NewEmailJob(constants.JobTypeEmailVerification, "user@example.com")
    job.SetTemplate("email_verification", map[string]any{
        "user_name":        "John Doe",
        "verification_url": "https://example.com/verify?token=abc123",
    })
    job.SetPriority(constants.PriorityHigh)

    // Save to database for tracking
    emailService := services.NewEmailService(config, jobRepo, logger)
    err := emailService.CreateTrackedEmailJob(context.Background(), job)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Tracked email job created: %s\n", job.ID)
}
```

### Email Templates

```go
template := models.NewEmailTemplate("email_verification", "Email Verification")
template.SetSubject("Verify your email address")
template.SetHTMLTemplate(`
<!DOCTYPE html>
<html>
<body>
    <h1>Hello {{.user_name}}</h1>
    <p>Please verify your email by clicking the link below:</p>
    <a href="{{.verification_url}}">Verify Email</a>
</body>
</html>
`)
template.SetTextTemplate(`
Hello {{.user_name}},

Please verify your email by visiting: {{.verification_url}}
`)
```

## 📈 Monitoring

### Metrics

Service exposes Prometheus metrics:

- `email_jobs_processed_total`: Total number of email jobs processed
- `email_jobs_queued_total`: Total number of jobs added to queue
- `email_jobs_tracked_total`: Total number of tracked jobs
- `email_job_processing_duration_seconds`: Time spent processing email jobs
- `email_provider_requests_total`: Total requests to email providers
- `email_provider_errors_total`: Total errors from email providers
- `queue_size`: Current queue size

### Health Check

```bash
curl http://localhost:8080/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "uptime": "1h30m",
  "queue": "connected",
  "database": "connected",
  "providers": {
    "sendgrid": "healthy",
    "ses": "healthy"
  }
}
```

### Logging

Structured logging with Zap:

```go
logger.Info("Email job processed",
    zap.String("job_id", job.ID.String()),
    zap.String("job_type", job.JobType),
    zap.String("recipient", job.RecipientEmail),
    zap.String("status", "completed"),
    zap.Duration("duration", processingTime),
    zap.Bool("tracked", job.IsTracked()),
)
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test -v ./tests -run TestEmailJob

# Run integration tests (requires Redis and PostgreSQL)
go test -tags=integration ./tests/integration/
```

## 🚀 Deployment

### Docker Compose

```yaml
version: "3.8"

services:
  email-worker:
    build: .
    environment:
      - REDIS_HOST=redis
      - DB_HOST=postgres
      - DB_NAME=email_worker
      - DB_USER=postgres
      - DB_PASSWORD=password
    depends_on:
      - redis
      - postgres
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=email_worker
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
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
          image: email-worker:latest
          env:
            - name: REDIS_HOST
              value: "redis-service"
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: email-worker-secrets
                  key: db-host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: email-worker-secrets
                  key: db-password
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

## 🔒 Security

### Best Practices

1. **Environment Variables**: Use environment variables for sensitive data
2. **API Keys**: Rotate API keys regularly
3. **TLS**: Use TLS for database and email connections
4. **Rate Limiting**: Implement rate limiting for email sending
5. **Input Validation**: Validate all input data
6. **Logging**: Don't log sensitive information

### Email Security

1. **SPF/DKIM**: Configure SPF and DKIM records
2. **DMARC**: Implement DMARC policy
3. **Bounce Handling**: Handle bounced emails properly
4. **Unsubscribe**: Provide unsubscribe links
5. **Content Filtering**: Filter email content for spam

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests and linting
6. Submit a pull request

### Code Style

- Follow Go conventions
- Use meaningful variable names
- Add comments for complex logic
- Write unit tests for new features
- Use structured logging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-org/email-worker/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/email-worker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/email-worker/discussions)

## 🔄 Changelog

### v1.0.0 (2024-01-01)

- Initial release
- Queue-based email processing
- Database tracking for important emails
- Support for SendGrid, AWS SES, and SMTP
- Template rendering
- Retry logic with exponential backoff
- Email tracking and analytics
- Prometheus metrics
- Health checks
