# 🏗️ Microservice Best Practices Implementation Guide

## 📋 Overview

This document outlines the best practices implementation for three core microservices in the Booking System:

- **Auth Service** (Port 50051) - Authentication & Authorization
- **Device Service** (Port 50052) - Device Management & Session Control
- **Security Service** (Port 50053) - Security Monitoring & Threat Detection

## 🎯 Architecture Principles

### 1. **Service Independence**

- Each service has its own database schema
- Independent deployment and scaling
- No direct database dependencies between services

### 2. **gRPC Communication**

- High-performance binary protocol
- Strong typing with Protocol Buffers
- Internal service-to-service communication only

### 3. **Event-Driven Architecture**

- Security events flow from all services to Security Service
- Asynchronous event processing
- Loose coupling between services

### 4. **Functional Programming Approach**

- Pure functions for business logic
- Immutable data structures
- Side effects isolated in controllers

## 🔧 Technology Stack

### Core Technologies

- **Runtime**: Node.js 18+
- **Protocol**: gRPC with Protocol Buffers
- **Database**: PostgreSQL (each service has its own DB)
- **Cache**: Redis (session management, caching)
- **Search**: Elasticsearch (Security Service only)
- **Containerization**: Docker
- **Logging**: Winston

### Service-Specific Technologies

- **Auth Service**: JWT, bcrypt, OAuth2
- **Device Service**: Device fingerprinting, session management
- **Security Service**: Machine learning, threat detection, Elasticsearch

## 📁 Project Structure

```
service-name/
├── src/
│   ├── config/           # Configuration management
│   ├── controllers/      # gRPC request handlers
│   ├── services/         # Business logic layer
│   ├── repositories/     # Data access layer
│   ├── utils/           # Shared utilities
│   ├── proto/           # Protocol Buffer definitions
│   ├── migrations/      # Database migrations
│   ├── seeds/           # Database seed data
│   ├── index.js         # Service entry point
│   └── server.js        # gRPC server setup
├── scripts/             # Development scripts
├── logs/               # Application logs
├── package.json        # Dependencies
├── knexfile.js         # Database configuration
├── Dockerfile          # Container configuration
└── env.example         # Environment variables template
```

## 🔐 Security Best Practices

### 1. **Authentication & Authorization (Auth Service)**

```javascript
// JWT-based authentication
const token = jwt.sign(payload, secret, { expiresIn: "1h" });
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: "7d" });

// Password hashing with bcrypt
const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2. **Device Security (Device Service)**

```javascript
// Device fingerprinting
const fingerprint = await deviceFingerprintingService.generateFingerprint({
  device_hash,
  user_agent,
  screen_resolution,
  timezone,
  language,
  fingerprint_data,
});

// Trust scoring
const trustScore = await deviceFingerprintingService.calculateTrustScore({
  ip_address,
  location_data,
  fingerprint,
  user_id,
});
```

### 3. **Security Monitoring (Security Service)**

```javascript
// Real-time threat detection
const threatLevel = await threatDetectionService.analyzeEvent({
  user_id,
  service_name,
  event_type,
  event_data,
  ip_address,
});

// Risk scoring
const riskScore = await riskAssessmentService.calculateRisk({
  user_id,
  entity_type,
  entity_id,
  factors: ["location", "behavior", "device"],
});
```

## 🗄️ Database Design

### Auth Service Database

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Device Service Database

```sql
-- Devices table
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_hash VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
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
    trust_score INTEGER DEFAULT 50,
    trust_level VARCHAR(20) DEFAULT 'unknown',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device sessions table
CREATE TABLE device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
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

### Security Service Database

```sql
-- Security events table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    service_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    event_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    risk_score INTEGER DEFAULT 0,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Security alerts table
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES security_events(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alert_data JSONB,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Service Communication

### 1. **gRPC Service Definitions**

#### Auth Service (auth.proto)

```protobuf
service AuthService {
  rpc register(RegisterRequest) returns (RegisterResponse);
  rpc login(LoginRequest) returns (LoginResponse);
  rpc logout(LogoutRequest) returns (LogoutResponse);
  rpc refreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
  rpc validateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc changePassword(ChangePasswordRequest) returns (ChangePasswordResponse);
  rpc resetPassword(ResetPasswordRequest) returns (ResetPasswordResponse);
  rpc getUserProfile(GetUserProfileRequest) returns (GetUserProfileResponse);
  rpc updateUserProfile(UpdateUserProfileRequest) returns (UpdateUserProfileResponse);
  rpc getUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse);
  rpc getUsers(GetUsersRequest) returns (GetUsersResponse);
  rpc searchUsers(SearchUsersRequest) returns (SearchUsersResponse);
  rpc updateUserStatus(UpdateUserStatusRequest) returns (UpdateUserStatusResponse);
  rpc health(HealthCheckRequest) returns (HealthCheckResponse);
}
```

#### Device Service (device.proto)

```protobuf
service DeviceService {
  rpc registerDevice(RegisterDeviceRequest) returns (RegisterDeviceResponse);
  rpc getDeviceList(GetDeviceListRequest) returns (GetDeviceListResponse);
  rpc updateDeviceTrust(UpdateDeviceTrustRequest) returns (UpdateDeviceTrustResponse);
  rpc revokeDevice(RevokeDeviceRequest) returns (RevokeDeviceResponse);
  rpc getUserSessions(GetUserSessionsRequest) returns (GetUserSessionsResponse);
  rpc createSession(CreateSessionRequest) returns (CreateSessionResponse);
  rpc revokeSession(RevokeSessionRequest) returns (RevokeSessionResponse);
  rpc validateDevice(ValidateDeviceRequest) returns (ValidateDeviceResponse);
  rpc getDeviceAnalytics(GetDeviceAnalyticsRequest) returns (GetDeviceAnalyticsResponse);
}
```

#### Security Service (security.proto)

```protobuf
service SecurityService {
  rpc submitEvent(SubmitEventRequest) returns (SubmitEventResponse);
  rpc getEvents(GetEventsRequest) returns (GetEventsResponse);
  rpc getAlerts(GetAlertsRequest) returns (GetAlertsResponse);
  rpc acknowledgeAlert(AcknowledgeAlertRequest) returns (AcknowledgeAlertResponse);
  rpc getIncidents(GetIncidentsRequest) returns (GetIncidentsResponse);
  rpc resolveIncident(ResolveIncidentRequest) returns (ResolveIncidentResponse);
  rpc getRiskScore(GetRiskScoreRequest) returns (GetRiskScoreResponse);
  rpc updateRiskScore(UpdateRiskScoreRequest) returns (UpdateRiskScoreResponse);
  rpc getAnalytics(GetAnalyticsRequest) returns (GetAnalyticsResponse);
  rpc getThreatPatterns(GetThreatPatternsRequest) returns (GetThreatPatternsResponse);
}
```

### 2. **Event-Driven Communication**

```javascript
// Security event submission from any service
await securityService.submitEvent({
  user_id,
  service_name: "auth-service",
  event_type: "login_attempt",
  event_category: "authentication",
  severity: "low",
  event_data: {
    success: true,
    ip_address,
    user_agent,
  },
  ip_address,
});
```

## 🚀 Deployment Best Practices

### 1. **Docker Configuration**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN mkdir -p logs
EXPOSE 50051
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('@grpc/grpc-js').credentials.createInsecure(); console.log('Health check passed')" || exit 1
CMD ["yarn", "start"]
```

### 2. **Environment Configuration**

```bash
# Service-specific environment variables
PORT=50051
HOST=0.0.0.0
NODE_ENV=production

# Database configuration
DB_HOST=postgres-service
DB_PORT=5432
DB_NAME=booking_system_auth
DB_USER=postgres
DB_PASSWORD=secure_password

# Redis configuration
REDIS_HOST=redis-service
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Service-specific settings
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 3. **Health Checks**

```javascript
export const health = async (call, callback) => {
  try {
    // Check database health
    await db.raw("SELECT 1");

    // Check Redis health
    await redisClient.ping();

    callback(null, {
      status: "SERVING",
      message: "Service is healthy",
      details: {
        database: "healthy",
        redis: "healthy",
        service: "service-name",
      },
    });
  } catch (error) {
    callback(null, {
      status: "NOT_SERVING",
      message: "Service is unhealthy",
      details: { error: error.message },
    });
  }
};
```

## 📊 Monitoring & Observability

### 1. **Structured Logging**

```javascript
import winston from "winston";

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "service-name" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
```

### 2. **Metrics Collection**

```javascript
// Request metrics
const requestMetrics = {
  total_requests: 0,
  successful_requests: 0,
  failed_requests: 0,
  average_response_time: 0,
};

// Performance monitoring
const startTime = Date.now();
try {
  // Process request
  requestMetrics.successful_requests++;
} catch (error) {
  requestMetrics.failed_requests++;
  throw error;
} finally {
  const responseTime = Date.now() - startTime;
  requestMetrics.average_response_time =
    (requestMetrics.average_response_time + responseTime) / 2;
}
```

## 🔒 Security Considerations

### 1. **Input Validation**

```javascript
import Joi from "joi";

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  device_id: Joi.string().uuid().optional(),
});

const { error, value } = loginSchema.validate(request);
if (error) {
  throw new Error(`Validation error: ${error.details[0].message}`);
}
```

### 2. **Rate Limiting**

```javascript
// Redis-based rate limiting
const rateLimitKey = `rate_limit:${ip_address}:${endpoint}`;
const currentCount = await redisClient.incr(rateLimitKey);
await redisClient.expire(rateLimitKey, 60); // 1 minute window

if (currentCount > MAX_REQUESTS_PER_MINUTE) {
  throw new Error("Rate limit exceeded");
}
```

### 3. **Data Encryption**

```javascript
// Sensitive data encryption
import crypto from "crypto";

const encrypt = (text, secretKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher("aes-256-cbc", secretKey);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text, secretKey) => {
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipher("aes-256-cbc", secretKey);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
```

## 🧪 Testing Strategy

### 1. **Unit Tests**

```javascript
import { jest } from "@jest/globals";
import { login } from "../controllers/authController.js";

describe("Auth Controller", () => {
  test("should login user with valid credentials", async () => {
    const mockCall = {
      request: {
        email: "test@example.com",
        password: "password123",
      },
    };

    const mockCallback = jest.fn();

    await login(mockCall, mockCallback);

    expect(mockCallback).toHaveBeenCalledWith(null, {
      success: true,
      token: expect.any(String),
      refresh_token: expect.any(String),
    });
  });
});
```

### 2. **Integration Tests**

```javascript
import grpc from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";

describe("gRPC Integration Tests", () => {
  let client;

  beforeAll(() => {
    const packageDefinition = loadPackageDefinition("./proto/auth.proto");
    const authProto = grpc.loadPackageDefinition(packageDefinition).auth;
    client = new authProto.AuthService(
      "localhost:50051",
      grpc.credentials.createInsecure()
    );
  });

  test("should register new user", (done) => {
    client.register(
      {
        email: "test@example.com",
        password: "password123",
        first_name: "Test",
        last_name: "User",
      },
      (error, response) => {
        expect(error).toBeNull();
        expect(response.success).toBe(true);
        done();
      }
    );
  });
});
```

## 📈 Performance Optimization

### 1. **Database Optimization**

```javascript
// Connection pooling
const db = knex({
  client: "postgresql",
  connection: {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  },
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
});
```

### 2. **Caching Strategy**

```javascript
// Redis caching for frequently accessed data
const getCachedUser = async (userId) => {
  const cached = await redisClient.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await userRepository.findById(userId);
  if (user) {
    await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user));
  }

  return user;
};
```

### 3. **gRPC Optimization**

```javascript
// Server configuration for high performance
const server = new grpc.Server({
  "grpc.max_send_message_length": 50 * 1024 * 1024,
  "grpc.max_receive_message_length": 50 * 1024 * 1024,
  "grpc.keepalive_time_ms": 30000,
  "grpc.keepalive_timeout_ms": 5000,
  "grpc.keepalive_permit_without_calls": true,
  "grpc.http2.max_pings_without_data": 0,
  "grpc.http2.min_time_between_pings_ms": 10000,
  "grpc.http2.min_ping_interval_without_data_ms": 300000,
});
```

## 🚨 Error Handling

### 1. **Graceful Error Handling**

```javascript
// Global error handler
process.on("uncaughtException", (error) => {
  logger.error("❌ Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  try {
    server.tryShutdown(() => {
      logger.info("✅ gRPC server stopped");
    });

    await closeDatabaseConnections();
    await closeRedisConnection();

    logger.info("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};
```

### 2. **gRPC Error Codes**

```javascript
// Standard gRPC error responses
const handleError = (error, callback) => {
  logger.error("Service error:", error);

  if (error.code === "NOT_FOUND") {
    callback({
      code: 5, // NOT_FOUND
      message: "Resource not found",
    });
  } else if (error.code === "VALIDATION_ERROR") {
    callback({
      code: 3, // INVALID_ARGUMENT
      message: error.message,
    });
  } else {
    callback({
      code: 13, // INTERNAL
      message: "Internal server error",
    });
  }
};
```

## 📋 Implementation Checklist

### ✅ Auth Service

- [x] JWT-based authentication
- [x] Password hashing with bcrypt
- [x] Refresh token mechanism
- [x] User management endpoints
- [x] OAuth2 integration (Google)
- [x] Email verification
- [x] Password reset functionality
- [x] Session management
- [x] Role-based access control

### ✅ Device Service

- [x] Device fingerprinting
- [x] Session management
- [x] Device trust scoring
- [x] Multi-device support
- [x] Device analytics
- [x] Security integration
- [x] Session limits enforcement
- [x] Device revocation

### ✅ Security Service

- [x] Real-time threat detection
- [x] Security event processing
- [x] Alert management
- [x] Incident response
- [x] Risk assessment
- [x] Machine learning integration
- [x] Security analytics
- [x] Threat pattern recognition

## 🎯 Next Steps

1. **Complete Implementation**: Finish remaining controllers, services, and repositories
2. **Database Migrations**: Create and run database migrations
3. **Integration Testing**: Test service-to-service communication
4. **Performance Testing**: Load testing and optimization
5. **Security Audit**: Comprehensive security review
6. **Documentation**: API documentation and deployment guides
7. **Monitoring Setup**: Prometheus, Grafana, and alerting
8. **CI/CD Pipeline**: Automated testing and deployment

## 📚 Additional Resources

- [gRPC Official Documentation](https://grpc.io/docs/)
- [Protocol Buffers Guide](https://developers.google.com/protocol-buffers)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Microservices Patterns](https://microservices.io/patterns/)
- [Security Best Practices](https://owasp.org/www-project-api-security/)
