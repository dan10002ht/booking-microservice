# Service Connections Documentation

## 🔗 Overview

This document describes the inter-service communication setup between `auth-service`, `device-service`, and `security-service` in the booking system microservices architecture.

## 📊 Connection Matrix

| Service              | Auth Service | Device Service | Security Service |
| -------------------- | ------------ | -------------- | ---------------- |
| **Auth Service**     | -            | ✅ Client      | ✅ Client        |
| **Device Service**   | ❌ Client    | -              | ✅ Client        |
| **Security Service** | ✅ Client    | ✅ Client      | -                |

## 🏗️ Architecture

### Service Ports

- **Auth Service**: `localhost:50051`
- **Device Service**: `localhost:50052`
- **Security Service**: `localhost:50053`

### Communication Protocol

- **Protocol**: gRPC (gRPC Remote Procedure Call)
- **Serialization**: Protocol Buffers (protobuf)
- **Transport**: HTTP/2
- **Security**: Insecure (for development)

## 🔧 Implementation Details

### 1. Auth Service Connections

#### Device Service Client

- **File**: `auth-service/src/services/deviceService.js`
- **Proto**: `auth-service/src/proto/device.proto`
- **Methods**:
  - `registerDevice()` - Register new device
  - `createSession()` - Create device session
  - `validateDevice()` - Validate device
  - `getUserSessions()` - Get user sessions
  - `health()` - Health check

#### Security Service Client

- **File**: `auth-service/src/services/securityService.js`
- **Proto**: `auth-service/src/proto/security.proto`
- **Methods**:
  - `submitEvent()` - Submit security event
  - `getUserRiskScore()` - Get user risk score
  - `detectThreat()` - Detect security threat
  - `health()` - Health check

### 2. Device Service Connections

#### Security Service Client

- **File**: `device-service/src/services/securityService.js`
- **Proto**: `device-service/src/proto/security.proto`
- **Methods**:
  - `submitEvent()` - Submit security event
  - `getUserRiskScore()` - Get user risk score
  - `health()` - Health check

### 3. Security Service Connections

#### Auth Service Client

- **File**: `security-service/src/services/authService.js`
- **Proto**: `security-service/src/proto/auth.proto`
- **Methods**:
  - `getUserProfile()` - Get user profile
  - `validateToken()` - Validate JWT token
  - `getUserSessions()` - Get user sessions
  - `health()` - Health check

#### Device Service Client

- **File**: `security-service/src/services/deviceService.js`
- **Proto**: `security-service/src/proto/device.proto`
- **Methods**:
  - `getDeviceList()` - Get user devices
  - `getDeviceAnalytics()` - Get device analytics
  - `updateDeviceTrust()` - Update device trust score
  - `revokeDevice()` - Revoke device access
  - `health()` - Health check

## 📡 gRPC Service Definitions

### Auth Service (auth.proto)

```protobuf
service AuthService {
  // Registration & Login
  rpc register(RegisterRequest) returns (RegisterResponse);
  rpc login(LoginRequest) returns (LoginResponse);
  rpc logout(LogoutRequest) returns (LogoutResponse);

  // Token Management
  rpc refreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
  rpc validateToken(ValidateTokenRequest) returns (ValidateTokenResponse);

  // User Management
  rpc getUserProfile(GetUserProfileRequest) returns (GetUserProfileResponse);
  rpc getUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse);

  // Health Check
  rpc health(HealthCheckRequest) returns (HealthCheckResponse);
}
```

### Device Service (device.proto)

```protobuf
service DeviceService {
  // Device Management
  rpc RegisterDevice(RegisterDeviceRequest) returns (RegisterDeviceResponse);
  rpc GetDeviceList(GetDeviceListRequest) returns (GetDeviceListResponse);
  rpc UpdateDeviceTrust(UpdateDeviceTrustRequest) returns (UpdateDeviceTrustResponse);
  rpc RevokeDevice(RevokeDeviceRequest) returns (RevokeDeviceResponse);

  // Session Management
  rpc GetUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse);
  rpc CreateSession(CreateSessionRequest) returns (CreateSessionResponse);
  rpc ValidateDevice(ValidateDeviceRequest) returns (ValidateDeviceResponse);

  // Analytics
  rpc GetDeviceAnalytics(GetDeviceAnalyticsRequest) returns (GetDeviceAnalyticsResponse);

  // Health Check
  rpc health(HealthCheckRequest) returns (HealthCheckResponse);
}
```

### Security Service (security.proto)

```protobuf
service SecurityService {
  // Event Management
  rpc submitEvent(SubmitEventRequest) returns (SubmitEventResponse);
  rpc getSecurityEvents(GetSecurityEventsRequest) returns (GetSecurityEventsResponse);

  // Risk Assessment
  rpc getUserRiskScore(GetUserRiskScoreRequest) returns (GetUserRiskScoreResponse);
  rpc updateUserRiskScore(UpdateUserRiskScoreRequest) returns (UpdateUserRiskScoreResponse);

  // Threat Detection
  rpc detectThreat(DetectThreatRequest) returns (DetectThreatResponse);
  rpc getThreatPatterns(GetThreatPatternsRequest) returns (GetThreatPatternsResponse);

  // Alert Management
  rpc createAlert(CreateAlertRequest) returns (CreateAlertResponse);
  rpc getAlerts(GetAlertsRequest) returns (GetAlertsResponse);
  rpc updateAlert(UpdateAlertRequest) returns (UpdateAlertResponse);

  // Health Check
  rpc health(HealthCheckRequest) returns (HealthCheckResponse);
}
```

## 🔄 Business Flows

### 1. User Login Flow

```
1. User submits login credentials
2. Auth Service validates credentials
3. Auth Service calls Device Service to register/validate device
4. Auth Service calls Security Service to submit login event
5. Security Service analyzes login for threats
6. Auth Service returns tokens to user
```

### 2. Device Registration Flow

```
1. User logs in from new device
2. Auth Service calls Device Service to register device
3. Device Service generates device fingerprint
4. Device Service calls Security Service to submit device event
5. Security Service assesses device risk
6. Device Service returns device trust score
```

### 3. Security Monitoring Flow

```
1. Security Service receives events from all services
2. Security Service analyzes patterns and detects threats
3. Security Service calls Auth Service to get user context
4. Security Service calls Device Service to get device analytics
5. Security Service creates alerts if threats detected
6. Security Service updates user risk scores
```

## 🧪 Testing

### Test Scripts

1. **Basic Connection Test**: `test-service-connections.js`

   - Tests if services are running and accessible
   - Verifies gRPC client connections

2. **Inter-Service Communication Test**: `test-inter-service-communication.js`
   - Tests actual gRPC calls between services
   - Validates business logic flows

### Running Tests

```bash
# Test basic connections
node test-service-connections.js

# Test inter-service communication
node test-inter-service-communication.js
```

## 🚀 Deployment

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

### Starting Services

```bash
# Start Auth Service
cd auth-service && npm start

# Start Device Service
cd device-service && npm start

# Start Security Service
cd security-service && npm start
```

## 🔒 Security Considerations

### Current Implementation

- **Transport**: Insecure gRPC (for development)
- **Authentication**: None (for development)
- **Authorization**: None (for development)

### Production Recommendations

- **Transport**: TLS/SSL encryption
- **Authentication**: mTLS (mutual TLS)
- **Authorization**: Service-to-service authentication
- **Rate Limiting**: Implement rate limiting
- **Circuit Breaker**: Add circuit breaker patterns
- **Retry Logic**: Implement exponential backoff

## 📈 Monitoring & Observability

### Health Checks

All services implement health check endpoints:

- `auth.health()`
- `device.health()`
- `security.health()`

### Logging

- All inter-service calls are logged
- Error handling with fallback mechanisms
- Performance metrics collection

### Metrics

- Request/response counts
- Latency measurements
- Error rates
- Connection status

## 🐛 Troubleshooting

### Common Issues

1. **Service Not Found**

   - Check if service is running on correct port
   - Verify proto file paths
   - Check service URL configuration

2. **Connection Refused**

   - Ensure service is started
   - Check firewall settings
   - Verify port availability

3. **Proto File Errors**

   - Validate proto file syntax
   - Check proto file paths
   - Ensure proto files are copied to all services

4. **Method Not Found**
   - Verify service method names
   - Check proto service definitions
   - Ensure client/server proto versions match

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

## 📝 Future Enhancements

### Planned Improvements

1. **Service Mesh**: Implement Istio or Linkerd
2. **API Gateway**: Add centralized API gateway
3. **Event Streaming**: Implement Kafka for async communication
4. **Caching**: Add Redis for caching
5. **Load Balancing**: Implement client-side load balancing
6. **Service Discovery**: Add service discovery mechanism

### Missing Connections

- **Device Service → Auth Service**: Optional, for user validation
- **Bidirectional Communication**: Implement streaming for real-time updates
- **Event-Driven Architecture**: Add event sourcing patterns
