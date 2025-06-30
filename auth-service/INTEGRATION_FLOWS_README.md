# Integration Flows Documentation

## 🔗 Overview

This document describes the integrated business flows between `auth-service`, `device-service`, and `security-service` in the booking system microservices architecture.

## 🏗️ Architecture

### Service Connections

```
Auth Service (Port: 50051)
├── Device Service Client (Port: 50052)
└── Security Service Client (Port: 50053)

Device Service (Port: 50052)
└── Security Service Client (Port: 50053)

Security Service (Port: 50053)
├── Auth Service Client (Port: 50051)
└── Device Service Client (Port: 50052)
```

### Communication Protocol

- **Protocol**: gRPC (gRPC Remote Procedure Call)
- **Serialization**: Protocol Buffers (protobuf)
- **Transport**: HTTP/2
- **Security**: Insecure (for development)

## 🔄 Business Flows

### 1. User Login Flow

**Flow**: `Auth Service → Device Service → Security Service`

```
1. User submits login credentials
2. Auth Service validates credentials
3. Auth Service calls Device Service to register/validate device
4. Auth Service calls Security Service to submit login event
5. Security Service analyzes login for threats
6. Auth Service returns tokens to user
```

**Implementation**: `integrationService.handleUserLogin()`

**API Endpoint**: `POST /integration/login/enhanced`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "device_info": {
    "device_hash": "device-fingerprint-hash",
    "device_name": "My Device",
    "device_type": "desktop",
    "browser": "Chrome",
    "browser_version": "120.0.0.0",
    "os": "Windows",
    "os_version": "10",
    "screen_resolution": "1920x1080",
    "timezone": "UTC",
    "language": "en-US",
    "location_data": {
      "country": "US",
      "city": "New York"
    },
    "fingerprint_data": {
      "canvas": "canvas-fingerprint",
      "webgl": "webgl-fingerprint"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "status": "active"
    },
    "device": {
      "device_id": "device-456",
      "trust_score": 85,
      "trust_level": "trusted"
    },
    "session": {
      "session_id": "session-789",
      "refresh_token": "refresh-token",
      "expires_at": "2024-01-01T12:00:00Z"
    },
    "security": {
      "risk_score": 15,
      "risk_level": "low",
      "threat_detected": false,
      "threat_level": null
    }
  }
}
```

### 2. Device Registration Flow

**Flow**: `Auth Service → Device Service → Security Service`

```
1. User logs in from new device
2. Auth Service calls Device Service to register device
3. Device Service generates device fingerprint
4. Device Service calls Security Service to submit device event
5. Security Service assesses device risk
6. Device Service returns device trust score
```

**Implementation**: `integrationService.handleDeviceRegistration()`

**API Endpoint**: `POST /integration/device/register`

**Request Body**:
```json
{
  "user_id": "user-123",
  "device_info": {
    "device_hash": "new-device-hash",
    "device_name": "New Device",
    "device_type": "mobile",
    "browser": "Safari",
    "browser_version": "17.0.0.0",
    "os": "iOS",
    "os_version": "17.0",
    "screen_resolution": "390x844",
    "timezone": "America/New_York",
    "language": "en-US",
    "location_data": {
      "country": "US",
      "city": "Los Angeles"
    },
    "fingerprint_data": {
      "canvas": "mobile-canvas-fingerprint",
      "webgl": "mobile-webgl-fingerprint"
    }
  }
}
```

### 3. Security Monitoring Flow

**Flow**: `Auth Service → Security Service → Device Service`

```
1. Security Service receives events from all services
2. Security Service analyzes patterns and detects threats
3. Security Service calls Auth Service to get user context
4. Security Service calls Device Service to get device analytics
5. Security Service creates alerts if threats detected
6. Security Service updates user risk scores
```

**Implementation**: `integrationService.handleSecurityMonitoring()`

**API Endpoint**: `POST /integration/security/event`

**Request Body**:
```json
{
  "user_id": "user-123",
  "event_data": {
    "service_name": "auth-service",
    "event_type": "suspicious_activity",
    "event_category": "security",
    "severity": "high",
    "event_data": {
      "activity_type": "multiple_failed_logins",
      "attempts": 5,
      "timeframe": "5_minutes"
    },
    "location_data": {
      "country": "US",
      "city": "New York"
    }
  }
}
```

### 4. Device Validation Flow

**Flow**: `Auth Service → Device Service → Security Service`

```
1. Auth Service calls Device Service to validate device
2. Device Service checks device trust score and status
3. Device Service calls Security Service to submit validation event
4. Security Service analyzes device behavior
5. Security Service creates alerts if suspicious activity detected
```

**Implementation**: `integrationService.handleDeviceValidation()`

**API Endpoint**: `GET /integration/device/validate/:device_id`

**Response**:
```json
{
  "success": true,
  "message": "Device validation completed",
  "data": {
    "is_valid": true,
    "trust_score": 75,
    "trust_level": "trusted"
  }
}
```

### 5. User Logout Flow

**Flow**: `Auth Service → Device Service → Security Service`

```
1. User initiates logout
2. Auth Service calls Device Service to revoke session
3. Auth Service calls Security Service to submit logout event
4. Security Service logs the logout activity
```

**Implementation**: `integrationService.handleUserLogout()`

**API Endpoint**: `POST /integration/logout/enhanced`

**Request Body**:
```json
{
  "user_id": "user-123",
  "session_id": "session-789",
  "device_id": "device-456"
}
```

## 🛠️ Implementation Details

### Service Files

#### Auth Service
- `src/proto/device.proto` - Device service interface
- `src/proto/security.proto` - Security service interface
- `src/services/deviceService.js` - Device service client
- `src/services/securityService.js` - Security service client
- `src/services/integrationService.js` - Business flow orchestration
- `src/controllers/integrationController.js` - HTTP request handlers
- `src/routes/integrationRoutes.js` - API routes

#### Device Service
- `src/proto/security.proto` - Security service interface
- `src/services/securityService.js` - Security service client

#### Security Service
- `src/proto/auth.proto` - Auth service interface
- `src/proto/device.proto` - Device service interface
- `src/services/authService.js` - Auth service client
- `src/services/deviceService.js` - Device service client

### Environment Variables

```bash
# Auth Service
AUTH_SERVICE_URL=localhost:50051
DEVICE_SERVICE_URL=localhost:50052
SECURITY_SERVICE_URL=localhost:50053

# Device Service
AUTH_SERVICE_URL=localhost:50051
SECURITY_SERVICE_URL=localhost:50053

# Security Service
AUTH_SERVICE_URL=localhost:50051
DEVICE_SERVICE_URL=localhost:50052
```

## 🧪 Testing

### Run Integration Tests

```bash
# Test all integration flows
node test-integration-flows.js

# Test individual flows
node -e "
import { testUserLoginFlow, testDeviceRegistrationFlow } from './test-integration-flows.js';
testUserLoginFlow();
testDeviceRegistrationFlow();
"
```

### Test Individual Services

```bash
# Test service connections
node test-service-connections.js

# Test inter-service communication
node test-inter-service-communication.js
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

**API Endpoint**: `GET /integration/health`

**Response**:
```json
{
  "success": true,
  "message": "Service health check completed",
  "data": {
    "auth_service": { "status": "healthy" },
    "device_service": { "status": "healthy" },
    "security_service": { "status": "healthy" },
    "overall_status": "healthy"
  }
}
```

### User Security Status

**API Endpoint**: `GET /integration/security/status/:userId`

**Response**:
```json
{
  "success": true,
  "message": "Security status retrieved successfully",
  "data": {
    "user_id": "user-123",
    "risk_score": 25,
    "risk_level": "low",
    "active_sessions": 2,
    "recent_events": 15,
    "open_alerts": 0
  }
}
```

## 🔒 Security Features

### Risk Assessment

- **User Risk Scoring**: Dynamic risk assessment based on behavior patterns
- **Device Trust Scoring**: Device fingerprinting and trust evaluation
- **Threat Detection**: Real-time threat detection and alerting
- **Session Management**: Secure session creation and validation

### Event Logging

- **Security Events**: Comprehensive logging of all security-related activities
- **Device Events**: Device registration, validation, and analytics
- **Authentication Events**: Login, logout, and session management events

### Alert System

- **Suspicious Activity**: Automatic alerts for suspicious behavior
- **Threat Alerts**: Real-time threat detection and notification
- **Risk Alerts**: High-risk user and device notifications

## 🚀 Deployment

### Starting Services

```bash
# Start Auth Service
cd auth-service && npm start

# Start Device Service
cd device-service && npm start

# Start Security Service
cd security-service && npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d auth-service device-service security-service
```

## 📝 API Documentation

### Integration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/integration/login/enhanced` | Enhanced login with device and security integration |
| POST | `/integration/device/register` | Register new device |
| GET | `/integration/device/validate/:device_id` | Validate device |
| POST | `/integration/security/event` | Submit security event |
| GET | `/integration/security/status/:userId` | Get user security status |
| POST | `/integration/logout/enhanced` | Enhanced logout |
| GET | `/integration/health` | Service health check |

### Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Service Not Found**
   - Check if all services are running on correct ports
   - Verify environment variables are set correctly
   - Check service URLs in configuration

2. **gRPC Connection Errors**
   - Ensure proto files are present in all services
   - Check network connectivity between services
   - Verify gRPC credentials configuration

3. **Integration Flow Failures**
   - Check individual service health
   - Review logs for specific error messages
   - Verify data format and required fields

### Debug Commands

```bash
# Test gRPC connectivity
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:50052 list
grpcurl -plaintext localhost:50053 list

# Test health checks
grpcurl -plaintext localhost:50051 auth.AuthService/health
grpcurl -plaintext localhost:50052 device.DeviceService/health
grpcurl -plaintext localhost:50053 security.SecurityService/health
```

## 📈 Future Enhancements

### Planned Improvements

1. **Service Mesh**: Implement Istio or Linkerd for better service communication
2. **Circuit Breaker**: Add circuit breaker patterns for fault tolerance
3. **Retry Logic**: Implement exponential backoff for failed requests
4. **Caching**: Add Redis caching for frequently accessed data
5. **Metrics**: Enhanced monitoring and metrics collection
6. **TLS**: Implement TLS encryption for production security

### Missing Features

- **Bidirectional Communication**: Real-time updates via WebSocket
- **Event Streaming**: Kafka integration for event-driven architecture
- **Load Balancing**: Client-side load balancing across service instances
- **Rate Limiting**: Service-level rate limiting and throttling 