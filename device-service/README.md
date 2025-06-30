# 📱 Device Management Service

**Language:** Node.js

**Why Node.js?**

- Fast I/O for device fingerprinting and session management
- Excellent Redis integration for session caching
- Easy integration with auth-service and security-service
- Real-time device monitoring capabilities

## 🎯 Overview

The Device Management Service handles device recognition, session management, and device trust levels for the booking system. It provides comprehensive device tracking, session control, and security validation to ensure secure multi-device access.

## 🎯 Responsibilities

- **Device Recognition**: Fingerprint devices and track device characteristics
- **Session Management**: Control multiple device sessions per user
- **Device Trust Levels**: Manage trusted vs untrusted devices
- **Session Limits**: Enforce maximum sessions per user
- **Device Analytics**: Track device usage patterns
- **Security Integration**: Work with security-service for threat detection
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: gRPC server only (no REST API)
- **Database**: PostgreSQL (device data, session history)
- **Cache**: Redis (active sessions, device fingerprints)
- **Device Fingerprinting**: Fingerprintjs2, ua-parser-js
- **Validation**: Joi schema validation
- **gRPC**: @grpc/grpc-js for inter-service communication
- **Protocol Buffers**: Efficient binary serialization

### Key Components

```
Device Service
├── gRPC Server
├── Device Controller
├── Session Controller
├── Device Fingerprinting Service
├── Session Manager
├── Device Trust Manager
├── Analytics Service
└── Security Integration
```

## 🔄 Device Management Flow

### Device Registration Flow

```
User Login Request
    ↓
Device Fingerprinting
    ↓
Device Recognition
    ↓
Trust Level Assessment
    ↓
Session Creation
    ↓
Return Device Info
```

### Session Management Flow

```
Session Request
    ↓
Device Validation
    ↓
Session Limit Check
    ↓
Session Creation/Update
    ↓
Return Session Data
```

### Device Trust Flow

```
Device Activity
    ↓
Behavior Analysis
    ↓
Trust Score Update
    ↓
Security Alert (if needed)
    ↓
Update Device Status
```

## 📡 gRPC Services (Internal Only)

### Device Service

```
device.DeviceService
├── RegisterDevice(RegisterDeviceRequest) returns (RegisterDeviceResponse)
├── GetDeviceList(GetDeviceListRequest) returns (GetDeviceListResponse)
├── UpdateDeviceTrust(UpdateDeviceTrustRequest) returns (UpdateDeviceTrustResponse)
├── RevokeDevice(RevokeDeviceRequest) returns (RevokeDeviceResponse)
├── GetUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse)
├── CreateSession(CreateSessionRequest) returns (CreateSessionResponse)
├── RevokeSession(RevokeSessionRequest) returns (RevokeSessionResponse)
├── ValidateDevice(ValidateDeviceRequest) returns (ValidateDeviceResponse)
└── GetDeviceAnalytics(GetDeviceAnalyticsRequest) returns (GetDeviceAnalyticsResponse)
```

### Health Service

```
device.HealthService
└── Check(HealthCheckRequest) returns (HealthCheckResponse)
```

## 🔐 Security Features

### Device Fingerprinting

- **Browser Fingerprinting**: Canvas, WebGL, fonts, plugins
- **Hardware Fingerprinting**: Screen resolution, timezone, language
- **Behavioral Fingerprinting**: Typing patterns, mouse movements
- **Network Fingerprinting**: IP geolocation, ISP information

### Session Security

- **Session Limits**: Maximum 5 active sessions per user
- **Session Expiration**: Automatic cleanup of inactive sessions
- **Concurrent Session Control**: Force logout from other devices
- **Session Invalidation**: Immediate revocation on security events

### Device Trust Management

- **Trust Scoring**: Algorithm-based trust assessment
- **Trust Levels**: Trusted, Suspicious, Blocked
- **Trust Factors**: Login history, location consistency, behavior patterns
- **Trust Updates**: Dynamic trust score adjustments

### Integration with Security Service

- **Threat Detection**: Real-time security event monitoring
- **Suspicious Activity**: Automatic device blocking
- **Security Alerts**: Integration with notification service
- **Audit Logging**: Comprehensive device activity logs

## 📊 Database Schema

### Devices Table

```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_hash VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    os_version VARCHAR(50),
    screen_resolution VARCHAR(50),
    timezone VARCHAR(100),
    language VARCHAR(10),
    ip_address INET,
    location_data JSONB,
    fingerprint_data JSONB,
    trust_score INTEGER DEFAULT 50, -- 0-100
    trust_level VARCHAR(20) DEFAULT 'unknown', -- 'trusted', 'suspicious', 'blocked'
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Device Sessions Table

```sql
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Device Analytics Table

```sql
CREATE TABLE device_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'activity'
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
GRPC_PORT=50052
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/booking_devices
DATABASE_SSL=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Device Management Configuration
MAX_SESSIONS_PER_USER=5
SESSION_EXPIRES_IN=7d
DEVICE_TRUST_THRESHOLD=70
SUSPICIOUS_ACTIVITY_THRESHOLD=30

# Security Integration
SECURITY_SERVICE_URL=grpc://security-service:50053
AUTH_SERVICE_URL=grpc://auth-service:50051

# gRPC Configuration
GRPC_MAX_RECEIVE_MESSAGE_LENGTH=4194304
GRPC_MAX_SEND_MESSAGE_LENGTH=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000
GRPC_TLS_ENABLED=true
GRPC_TLS_CERT_PATH=/etc/grpc/certs/server.crt
GRPC_TLS_KEY_PATH=/etc/grpc/certs/server.key
```

### Protocol Buffer Definitions

```protobuf
// shared-lib/protos/device.proto
syntax = "proto3";

package device;

import "google/protobuf/timestamp.proto";

service DeviceService {
  rpc RegisterDevice(RegisterDeviceRequest) returns (RegisterDeviceResponse);
  rpc GetDeviceList(GetDeviceListRequest) returns (GetDeviceListResponse);
  rpc UpdateDeviceTrust(UpdateDeviceTrustRequest) returns (UpdateDeviceTrustResponse);
  rpc RevokeDevice(RevokeDeviceRequest) returns (RevokeDeviceResponse);
  rpc GetUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse);
  rpc CreateSession(CreateSessionRequest) returns (CreateSessionResponse);
  rpc RevokeSession(RevokeSessionRequest) returns (RevokeSessionResponse);
  rpc ValidateDevice(ValidateDeviceRequest) returns (ValidateDeviceResponse);
  rpc GetDeviceAnalytics(GetDeviceAnalyticsRequest) returns (GetDeviceAnalyticsResponse);
}

message RegisterDeviceRequest {
  string user_id = 1;
  string device_hash = 2;
  string device_name = 3;
  string device_type = 4;
  string browser = 5;
  string os = 6;
  string ip_address = 7;
  bytes fingerprint_data = 8;
}

message RegisterDeviceResponse {
  string device_id = 1;
  string trust_level = 2;
  int32 trust_score = 3;
  bool success = 4;
  string message = 5;
}

message GetDeviceListRequest {
  string user_id = 1;
}

message GetDeviceListResponse {
  repeated DeviceInfo devices = 1;
  bool success = 2;
  string message = 3;
}

message DeviceInfo {
  string id = 1;
  string device_name = 2;
  string device_type = 3;
  string browser = 4;
  string os = 5;
  string trust_level = 6;
  int32 trust_score = 7;
  bool is_active = 8;
  google.protobuf.Timestamp last_used_at = 9;
  google.protobuf.Timestamp created_at = 10;
}

message UpdateDeviceTrustRequest {
  string device_id = 1;
  string trust_level = 2;
  int32 trust_score = 3;
}

message UpdateDeviceTrustResponse {
  bool success = 1;
  string message = 2;
}

message RevokeDeviceRequest {
  string device_id = 1;
  string user_id = 2;
}

message RevokeDeviceResponse {
  bool success = 1;
  string message = 2;
}

message GetUserSessionsRequest {
  string user_id = 1;
}

message GetUserSessionsResponse {
  repeated SessionInfo sessions = 1;
  bool success = 2;
  string message = 3;
}

message SessionInfo {
  string id = 1;
  string device_id = 2;
  string device_name = 3;
  string ip_address = 4;
  bool is_active = 5;
  google.protobuf.Timestamp expires_at = 6;
  google.protobuf.Timestamp created_at = 7;
}

message CreateSessionRequest {
  string user_id = 1;
  string device_id = 2;
  string session_id = 3;
  string refresh_token = 4;
  string ip_address = 5;
  string user_agent = 6;
}

message CreateSessionResponse {
  string session_id = 1;
  bool success = 2;
  string message = 3;
}

message RevokeSessionRequest {
  string session_id = 1;
  string user_id = 2;
}

message RevokeSessionResponse {
  bool success = 1;
  string message = 2;
}

message ValidateDeviceRequest {
  string device_hash = 1;
  string user_id = 2;
}

message ValidateDeviceResponse {
  bool is_valid = 1;
  string trust_level = 2;
  string message = 3;
}

message GetDeviceAnalyticsRequest {
  string user_id = 1;
  string device_id = 2;
  google.protobuf.Timestamp start_date = 3;
  google.protobuf.Timestamp end_date = 4;
}

message GetDeviceAnalyticsResponse {
  repeated AnalyticsEvent events = 1;
  bool success = 2;
  string message = 3;
}

message AnalyticsEvent {
  string event_type = 1;
  bytes event_data = 2;
  string ip_address = 3;
  google.protobuf.Timestamp created_at = 4;
}
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Device Cache**: Cache device fingerprints in Redis
- **Session Cache**: Fast session lookups
- **Trust Score Cache**: Cache device trust levels
- **Analytics Cache**: Cache device usage patterns

### Database Optimization

- **Connection Pooling**: Optimize database connections
- **Indexes**: Index on device_hash, user_id, session_id
- **Query Optimization**: Efficient device lookups
- **Read Replicas**: For read-heavy operations

### Security Optimizations

- **Device Fingerprinting**: Efficient fingerprint generation
- **Session Cleanup**: Periodic cleanup of expired sessions
- **Trust Score Updates**: Batch trust score calculations
- **Analytics Processing**: Background analytics processing

## 📊 Monitoring & Observability

### Metrics

- **Device Registration Rate**: New device registrations per minute
- **Session Creation Rate**: New session creations
- **Trust Score Changes**: Trust level updates
- **Device Revocation Rate**: Device revocations
- **Error Rates**: Device validation failures
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Device Logs**: Device registration and updates
- **Session Logs**: Session creation and revocation
- **Security Logs**: Trust level changes and suspicious activity
- **Error Logs**: Device validation failures and errors
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Security Service**: Integration health
- **Auth Service**: Integration health
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

### Security Tests

```bash
npm run test:security
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
EXPOSE 50052
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: device-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: device-service
  template:
    metadata:
      labels:
        app: device-service
    spec:
      containers:
        - name: device
          image: booking-system/device-service:latest
          ports:
            - containerPort: 50052
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: device-secrets
                  key: database-url
            - name: REDIS_URL
              value: "redis://redis-service:6379"
          volumeMounts:
            - name: grpc-certs
              mountPath: /etc/grpc/certs
              readOnly: true
      volumes:
        - name: grpc-certs
          secret:
            secretName: grpc-tls-certs
```

## 🔄 Integration with Other Services

### Integration with Auth Service

The **Auth Service** relies on Device Service to:

- **Device Validation**: Validate device fingerprints during login
- **Session Management**: Create and manage device sessions
- **Trust Assessment**: Assess device trust levels
- **Session Limits**: Enforce maximum sessions per user

### Integration with Security Service

The **Security Service** relies on Device Service to:

- **Device Monitoring**: Monitor device behavior patterns
- **Trust Score Updates**: Update device trust scores
- **Suspicious Activity**: Detect suspicious device activity
- **Security Alerts**: Trigger security alerts for suspicious devices

### Integration with Notification Service

The **Notification Service** receives events from Device Service:

- **New Device Alerts**: Notify users of new device logins
- **Trust Level Changes**: Notify users of trust level updates
- **Device Revocation**: Notify users of device revocations
- **Security Alerts**: Notify users of security events

## 📞 Troubleshooting

### Common Issues

1. **Device Recognition**: Check device fingerprinting configuration
2. **Session Limits**: Verify session limit settings
3. **Trust Score Issues**: Check trust score calculation logic
4. **Database Connection**: Verify database connectivity
5. **Redis Connection**: Check Redis service health
6. **gRPC Connection**: Check gRPC service endpoints

### Debug Commands

```bash
# Test gRPC connectivity
grpcurl -plaintext device-service:50052 list

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connection
redis-cli ping

# Test gRPC health check
grpcurl -plaintext device-service:50052 device.HealthService/Check
```

## 🔗 Dependencies

### External Services

- **Auth Service**: User authentication and session validation
- **Security Service**: Threat detection and security monitoring
- **Notification Service**: User notifications for device events

### Infrastructure

- **PostgreSQL**: Device and session data storage
- **Redis**: Session and device cache
- **Protocol Buffers**: Message serialization
- **Elasticsearch**: Device analytics and logs (optional)

## 🆕 Future Enhancements

### Planned Features

- **Machine Learning**: Advanced device behavior analysis
- **Biometric Integration**: Fingerprint and face recognition
- **Geolocation Tracking**: Advanced location-based security
- **Real-time Alerts**: Instant security notifications
- **Device Synchronization**: Cross-device data sync
- **Advanced Analytics**: Predictive security analytics
