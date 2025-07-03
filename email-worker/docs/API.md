# Email Worker API Documentation

## Overview

Email Worker service provides a comprehensive API for managing email jobs, templates, and tracking. The service supports both gRPC and HTTP endpoints for different use cases.

## gRPC API

### Service Definition

```protobuf
service EmailService {
    // Email Job Management
    rpc CreateEmailJob(CreateEmailJobRequest) returns (CreateEmailJobResponse);
    rpc GetEmailJob(GetEmailJobRequest) returns (GetEmailJobResponse);
    rpc ListEmailJobs(ListEmailJobsRequest) returns (ListEmailJobsResponse);
    rpc UpdateEmailJobStatus(UpdateEmailJobStatusRequest) returns (UpdateEmailJobStatusResponse);

    // Email Template Management
    rpc CreateEmailTemplate(CreateEmailTemplateRequest) returns (CreateEmailTemplateResponse);
    rpc GetEmailTemplate(GetEmailTemplateRequest) returns (GetEmailTemplateResponse);
    rpc UpdateEmailTemplate(UpdateEmailTemplateRequest) returns (UpdateEmailTemplateResponse);
    rpc DeleteEmailTemplate(DeleteEmailTemplateRequest) returns (DeleteEmailTemplateResponse);
    rpc ListEmailTemplates(ListEmailTemplatesRequest) returns (ListEmailTemplatesResponse);

    // Email Tracking
    rpc GetEmailTracking(GetEmailTrackingRequest) returns (GetEmailTrackingResponse);

    // Health Check
    rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}
```

### Message Types

#### EmailJob

```protobuf
message EmailJob {
    string id = 1;
    string job_type = 2;
    string recipient_email = 3;
    string subject = 4;
    string template_id = 5;
    map<string, string> template_data = 6;
    string status = 7;
    int32 priority = 8;
    int32 retry_count = 9;
    int32 max_retries = 10;
    google.protobuf.Timestamp scheduled_at = 11;
    google.protobuf.Timestamp created_at = 12;
    google.protobuf.Timestamp updated_at = 13;
}
```

#### EmailTemplate

```protobuf
message EmailTemplate {
    string id = 1;
    string name = 2;
    string subject = 3;
    string html_template = 4;
    string text_template = 5;
    map<string, string> variables = 6;
    bool is_active = 7;
    google.protobuf.Timestamp created_at = 8;
    google.protobuf.Timestamp updated_at = 9;
}
```

#### EmailTracking

```protobuf
message EmailTracking {
    string id = 1;
    string job_id = 2;
    string provider = 3;
    string message_id = 4;
    string status = 5;
    google.protobuf.Timestamp sent_at = 6;
    google.protobuf.Timestamp delivered_at = 7;
    google.protobuf.Timestamp opened_at = 8;
    google.protobuf.Timestamp clicked_at = 9;
    string error_message = 10;
    google.protobuf.Timestamp created_at = 11;
}
```

### Request/Response Messages

#### CreateEmailJob

```protobuf
message CreateEmailJobRequest {
    EmailJob job = 1;
}

message CreateEmailJobResponse {
    string job_id = 1;
    bool success = 2;
    string message = 3;
}
```

#### GetEmailJob

```protobuf
message GetEmailJobRequest {
    string job_id = 1;
}

message GetEmailJobResponse {
    EmailJob job = 1;
    bool success = 2;
    string message = 3;
}
```

#### ListEmailJobs

```protobuf
message ListEmailJobsRequest {
    string status = 1;
    int32 limit = 2;
    int32 offset = 3;
    string job_type = 4;
}

message ListEmailJobsResponse {
    repeated EmailJob jobs = 1;
    int32 total = 2;
    bool success = 3;
    string message = 4;
}
```

## HTTP API

### Health Check

#### GET /health

Returns the health status of the service.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "uptime": "1h30m45s"
}
```

#### GET /ready

Returns the readiness status of the service.

**Response:**

```json
{
  "status": "ready",
  "database": "connected",
  "queue": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Metrics

#### GET /metrics

Returns Prometheus metrics.

**Response:**

```
# HELP email_jobs_processed_total Total number of email jobs processed
# TYPE email_jobs_processed_total counter
email_jobs_processed_total{status="completed",job_type="verification"} 150
email_jobs_processed_total{status="failed",job_type="verification"} 5

# HELP email_job_processing_duration_seconds Time spent processing email jobs
# TYPE email_job_processing_duration_seconds histogram
email_job_processing_duration_seconds_bucket{job_type="verification",le="0.1"} 100
email_job_processing_duration_seconds_bucket{job_type="verification",le="0.5"} 145
email_job_processing_duration_seconds_bucket{job_type="verification",le="1"} 150
```

### Processor Status

#### GET /status

Returns the current status of the email processor.

**Response:**

```json
{
  "processor": {
    "running": true,
    "active_workers": 5,
    "jobs_processed": 150,
    "jobs_failed": 5,
    "jobs_pending": 10
  },
  "queue": {
    "type": "redis",
    "connected": true,
    "pending_jobs": 10
  },
  "database": {
    "connected": true,
    "migrations": "up_to_date"
  }
}
```

## Usage Examples

### gRPC Client Example (Go)

```go
package main

import (
    "context"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    pb "booking-system/email-worker/protos"
)

func main() {
    // Connect to gRPC server
    conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer conn.Close()

    client := pb.NewEmailServiceClient(conn)
    ctx, cancel := context.WithTimeout(context.Background(), time.Second)
    defer cancel()

    // Create email job
    job := &pb.EmailJob{
        JobType:        "verification",
        RecipientEmail: "user@example.com",
        Subject:        "Verify your email",
        TemplateId:     "email_verification",
        TemplateData: map[string]string{
            "Name":            "John Doe",
            "VerificationURL": "https://example.com/verify?token=123",
        },
        Priority: 1,
    }

    resp, err := client.CreateEmailJob(ctx, &pb.CreateEmailJobRequest{Job: job})
    if err != nil {
        log.Fatalf("Failed to create job: %v", err)
    }

    log.Printf("Job created: %s", resp.JobId)
}
```

### HTTP Client Example (cURL)

```bash
# Health check
curl http://localhost:8080/health

# Get processor status
curl http://localhost:8080/status

# Get metrics
curl http://localhost:8080/metrics
```

## Error Handling

### gRPC Error Codes

| Code               | Description                |
| ------------------ | -------------------------- |
| `OK`               | Success                    |
| `INVALID_ARGUMENT` | Invalid request parameters |
| `NOT_FOUND`        | Resource not found         |
| `ALREADY_EXISTS`   | Resource already exists    |
| `INTERNAL`         | Internal server error      |
| `UNAVAILABLE`      | Service unavailable        |

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Invalid email address format",
    "details": [
      {
        "field": "recipient_email",
        "reason": "invalid_format"
      }
    ]
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **gRPC**: 1000 requests per minute per client
- **HTTP**: 500 requests per minute per IP

Rate limit headers are included in HTTP responses:

```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 499
X-RateLimit-Reset: 1640995200
```

## Authentication

### gRPC Authentication

gRPC endpoints require mTLS authentication:

```go
creds, err := credentials.NewClientTLSFromFile("ca.crt", "")
if err != nil {
    log.Fatalf("Failed to load credentials: %v", err)
}

conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(creds))
```

### HTTP Authentication

HTTP endpoints require API key authentication:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:8080/status
```

## Monitoring and Observability

### Metrics

The service exposes the following Prometheus metrics:

- `email_jobs_processed_total`: Total number of processed jobs
- `email_job_processing_duration_seconds`: Job processing duration
- `email_jobs_in_queue`: Number of jobs in queue
- `email_provider_requests_total`: Provider API requests
- `email_provider_errors_total`: Provider API errors

### Logging

Structured logging with the following fields:

```json
{
  "level": "info",
  "timestamp": "2024-01-01T00:00:00Z",
  "service": "email-worker",
  "job_id": "uuid",
  "job_type": "verification",
  "recipient_email": "user@example.com",
  "status": "completed",
  "duration_ms": 150
}
```

### Tracing

Distributed tracing is supported via OpenTelemetry:

```go
// Enable tracing
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

tracer := otel.Tracer("email-worker")
ctx, span := tracer.Start(ctx, "process_email_job")
defer span.End()
```

## Configuration

### Environment Variables

| Variable       | Description         | Default     |
| -------------- | ------------------- | ----------- |
| `GRPC_PORT`    | gRPC server port    | `50051`     |
| `HTTP_PORT`    | HTTP server port    | `8080`      |
| `METRICS_PORT` | Metrics server port | `2112`      |
| `LOG_LEVEL`    | Logging level       | `info`      |
| `DB_HOST`      | Database host       | `localhost` |
| `DB_PORT`      | Database port       | `5432`      |
| `REDIS_HOST`   | Redis host          | `localhost` |
| `REDIS_PORT`   | Redis port          | `6379`      |

### Configuration File

```yaml
server:
  grpc_port: 50051
  http_port: 8080
  metrics_port: 2112

database:
  host: localhost
  port: 5432
  name: email_worker
  user: postgres
  password: password
  ssl_mode: disable

queue:
  type: redis
  host: localhost
  port: 6379
  password: ""
  database: 0
  queue_name: email-jobs

worker:
  worker_count: 5
  batch_size: 10
  poll_interval: 1s
  max_retries: 3
  retry_delay: 5s
  process_timeout: 30s

email:
  default_provider: sendgrid
  providers:
    sendgrid:
      api_key: your_api_key
      from_email: noreply@example.com
      from_name: Booking System
```

## Best Practices

### Job Creation

1. **Use appropriate job types**: Choose the right job type for your use case
2. **Set priorities wisely**: Use higher priorities for critical emails
3. **Provide template data**: Ensure all required template variables are provided
4. **Handle retries**: Set appropriate max_retries for different job types

### Template Management

1. **Use descriptive names**: Choose clear, descriptive template names
2. **Document variables**: Document all template variables and their types
3. **Test templates**: Test templates before deploying to production
4. **Version control**: Use version control for template changes

### Monitoring

1. **Set up alerts**: Configure alerts for failed jobs and high error rates
2. **Monitor queue size**: Watch for queue buildup indicating processing issues
3. **Track delivery rates**: Monitor email delivery success rates
4. **Review logs**: Regularly review logs for patterns and issues

### Security

1. **Use mTLS**: Enable mutual TLS for gRPC connections
2. **API key rotation**: Regularly rotate API keys
3. **Input validation**: Validate all input data
4. **Rate limiting**: Implement appropriate rate limits
5. **Audit logging**: Log all administrative actions
