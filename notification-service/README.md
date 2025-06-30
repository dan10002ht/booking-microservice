# Notification Service (Go)

**Language:** Go (Golang)

**Why Go?**

- High performance for concurrent notification delivery
- Goroutines for parallel processing
- Handles retry, queue, and scale efficiently

# 📢 Notification Service

## Overview

The Notification Service handles all notification delivery across multiple channels including email, SMS, push notifications, and in-app notifications. It provides a unified interface for sending notifications and manages notification preferences and delivery status.

## 🎯 Responsibilities

- **Multi-channel Delivery**: Email, SMS, push notifications, in-app
- **Notification Templates**: Dynamic template management
- **Delivery Tracking**: Track notification delivery status
- **User Preferences**: Manage notification preferences
- **Rate Limiting**: Prevent notification spam
- **Retry Logic**: Handle failed deliveries
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js (REST) + gRPC server
- **Database**: PostgreSQL (notification data)
- **Cache**: Redis (templates, preferences)
- **Message Queue**: Redis Queue for async processing
- **gRPC**: @grpc/grpc-js for inter-service communication
- **Email**: Nodemailer, SendGrid
- **SMS**: Twilio, AWS SNS
- **Push**: Firebase Cloud Messaging

### Key Components

```
Notification Service
├── REST API Server
├── gRPC Server
├── Notification Controller
├── Template Manager
├── Channel Adapters
├── Delivery Manager
├── Preference Manager
├── Rate Limiter
├── Retry Handler
└── Health Checker
```

## 🔄 Notification Flow

### Standard Notification Flow

```
Notification Request
    ↓
Template Resolution
    ↓
User Preference Check
    ↓
Channel Selection
    ↓
Message Preparation
    ↓
Delivery Attempt
    ↓
Status Tracking
    ↓
Retry (if needed)
    ↓
Delivery Confirmation
```

### Batch Notification Flow

```
Batch Request
    ↓
User Segmentation
    ↓
Template Personalization
    ↓
Channel Optimization
    ↓
Parallel Delivery
    ↓
Progress Tracking
    ↓
Completion Report
```

## 📡 API Endpoints

### Public Endpoints (REST)

```
POST   /notifications              # Send notification
GET    /notifications/:id          # Get notification status
GET    /notifications/user/:userId # Get user notifications
PUT    /notifications/:id/read     # Mark as read
DELETE /notifications/:id          # Delete notification
```

### Protected Endpoints (REST)

```
POST   /notifications/batch        # Send batch notifications
GET    /templates                  # Get notification templates
POST   /templates                  # Create template
PUT    /templates/:id              # Update template
DELETE /templates/:id              # Delete template
GET    /preferences/:userId        # Get user preferences
PUT    /preferences/:userId        # Update preferences
```

### gRPC Services (Internal)

```
notification.NotificationService
├── SendNotification(SendNotificationRequest) returns (SendNotificationResponse)
├── SendBatchNotification(SendBatchNotificationRequest) returns (SendBatchNotificationResponse)
├── GetNotificationStatus(GetNotificationStatusRequest) returns (GetNotificationStatusResponse)
├── GetUserNotifications(GetUserNotificationsRequest) returns (GetUserNotificationsResponse)
├── MarkAsRead(MarkAsReadRequest) returns (MarkAsReadResponse)
└── DeleteNotification(DeleteNotificationRequest) returns (DeleteNotificationResponse)

notification.TemplateService
├── GetTemplate(GetTemplateRequest) returns (GetTemplateResponse)
├── CreateTemplate(CreateTemplateRequest) returns (CreateTemplateResponse)
├── UpdateTemplate(UpdateTemplateRequest) returns (UpdateTemplateResponse)
└── DeleteTemplate(DeleteTemplateRequest) returns (DeleteTemplateResponse)

notification.PreferenceService
├── GetUserPreferences(GetUserPreferencesRequest) returns (GetUserPreferencesResponse)
├── UpdateUserPreferences(UpdateUserPreferencesRequest) returns (UpdateUserPreferencesResponse)
└── GetDefaultPreferences(GetDefaultPreferencesRequest) returns (GetDefaultPreferencesResponse)

notification.HealthService
└── Check(HealthCheckRequest) returns (HealthCheckResponse)
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate tokens for protected endpoints
- **Service Authentication**: Verify service identity for gRPC calls
- **Rate Limiting**: Prevent notification abuse
- **Input Validation**: Validate all notification content

### Data Protection

- **Content Encryption**: Encrypt sensitive notification content
- **Template Security**: Secure template management
- **User Privacy**: Respect user notification preferences
- **Audit Logging**: Log all notification activities

## 📊 Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL,
    template_id UUID REFERENCES notification_templates(id),
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notification Templates Table

```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Preferences Table

```sql
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'immediate',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, type)
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3004
GRPC_PORT=50055
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/notification_db
DATABASE_SSL=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=4

# gRPC Configuration
GRPC_MAX_RECEIVE_MESSAGE_LENGTH=4194304
GRPC_MAX_SEND_MESSAGE_LENGTH=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000
GRPC_TLS_ENABLED=true
GRPC_TLS_CERT_PATH=/etc/grpc/certs/server.crt
GRPC_TLS_KEY_PATH=/etc/grpc/certs/server.key

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@bookingsystem.com

# SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notification Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Notification Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000
BATCH_SIZE=100
RATE_LIMIT_PER_USER=10
RATE_LIMIT_WINDOW_MS=60000
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Template Cache**: Cache notification templates
- **User Preferences Cache**: Cache user preferences
- **Delivery Status Cache**: Cache delivery status
- **Rate Limit Cache**: Distributed rate limiting

### Delivery Optimization

- **Batch Processing**: Process notifications in batches
- **Channel Optimization**: Optimize delivery channels
- **Retry Logic**: Exponential backoff for retries
- **Queue Management**: Priority-based queuing

## 📊 Monitoring & Observability

### Metrics

- **Delivery Rate**: Successful vs failed deliveries
- **Channel Performance**: Performance per channel
- **Template Usage**: Template usage statistics
- **User Engagement**: Notification engagement rates
- **Error Rates**: Delivery failure rates
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Delivery Logs**: All notification deliveries
- **Error Logs**: Delivery failures and errors
- **Template Logs**: Template usage and errors
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Channel Health**: Email, SMS, push service health
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

### Channel Tests

```bash
npm run test:channels
```

### Load Tests

```bash
npm run test:load
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
EXPOSE 3004 50055
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
        - name: notification
          image: booking-system/notification-service:latest
          ports:
            - containerPort: 3004
            - containerPort: 50055
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: notification-secrets
                  key: database-url
            - name: REDIS_URL
              value: "redis://redis-service:6379"
            - name: SENDGRID_API_KEY
              valueFrom:
                secretKeyRef:
                  name: notification-secrets
                  key: sendgrid-api-key
          volumeMounts:
            - name: grpc-certs
              mountPath: /etc/grpc/certs
              readOnly: true
      volumes:
        - name: grpc-certs
          secret:
            secretName: grpc-tls-certs
```

## 🔄 Channel Implementation

### Email Channel

```javascript
class EmailChannel {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(notification) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: notification.user.email,
        subject: notification.title,
        html: notification.message,
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        channel: "email",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        channel: "email",
      };
    }
  }
}
```

### SMS Channel

```javascript
class SMSChannel {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async send(notification) {
    try {
      const result = await this.client.messages.create({
        body: notification.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.user.phone,
      });

      return {
        success: true,
        messageId: result.sid,
        channel: "sms",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        channel: "sms",
      };
    }
  }
}
```

### Push Notification Channel

```javascript
class PushChannel {
  constructor() {
    this.admin = require("firebase-admin");
    this.admin.initializeApp({
      credential: this.admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  async send(notification) {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        token: notification.user.pushToken,
      };

      const result = await this.admin.messaging().send(message);

      return {
        success: true,
        messageId: result,
        channel: "push",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        channel: "push",
      };
    }
  }
}
```

## 🆕 Integration with Check-in Service

The **Check-in Service** triggers notifications via Notification Service:

- **Check-in Confirmation**: Notifies users or event organizers when a ticket is checked in
- **gRPC Integration**: Receives check-in events and sends push/email/SMS notifications as configured

## 🛡️ Security Best Practices

### Content Security

- **Input Validation**: Validate all notification content
- **Template Security**: Secure template management
- **Content Filtering**: Filter inappropriate content
- **Rate Limiting**: Prevent notification spam

### Channel Security

- **API Key Management**: Secure API keys
- **Encryption**: Encrypt sensitive data
- **Access Control**: Control channel access
- **Audit Logging**: Log all activities

### User Privacy

- **Preference Respect**: Respect user preferences
- **Opt-out Handling**: Handle opt-out requests
- **Data Minimization**: Minimize data collection
- **Consent Management**: Manage user consent

## 📞 Troubleshooting

### Common Issues

1. **Delivery Failures**: Check channel credentials
2. **Template Errors**: Verify template syntax
3. **Rate Limiting**: Check rate limit configuration
4. **Database Connection**: Verify connection settings
5. **gRPC Connection**: Verify service endpoints

### Debug Commands

```bash
# Check service health
curl http://notification-service:3004/health

# Test gRPC connectivity
grpcurl -plaintext notification-service:50055 list

# Check Redis cache
redis-cli keys "*notification*"

# Test email delivery
curl -X POST http://notification-service:3004/test/email

# Monitor delivery queue
redis-cli llen notification_queue
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and validation
- **User Profile Service**: User contact information
- **Email Service**: Email delivery (optional)

### Infrastructure

- **PostgreSQL**: Notification data storage
- **Redis**: Caching and queuing
- **Protocol Buffers**: Message serialization

### External Providers

- **SendGrid**: Email delivery
- **Twilio**: SMS delivery
- **Firebase**: Push notifications
