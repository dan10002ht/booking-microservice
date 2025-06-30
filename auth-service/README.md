# Auth Service (Node.js)

**Language:** Node.js

**Why Node.js?**

- JWT, OAuth2, social login support
- Rapid development, easy integration
- Good for authentication APIs

# 🔐 Authentication Service

## Overview

The Authentication Service handles user authentication, authorization, and session management for the booking system. It provides JWT-based authentication with refresh tokens, user registration, and role-based access control. The service exposes both REST APIs for external clients and gRPC APIs for internal service communication.

## 🎯 Responsibilities

- **User Registration**: Secure user account creation
- **User Authentication**: Login with email/password
- **JWT Management**: Token generation, validation, and refresh
- **Password Management**: Secure password hashing and reset
- **Session Management**: User session tracking
- **Role-based Authorization**: User roles and permissions
- **OAuth Integration**: Social login (Google, Facebook, etc.)
- **Account Security**: Two-factor authentication (2FA)
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js (REST) + gRPC server
- **Database**: PostgreSQL (user data)
- **Cache**: Redis (sessions, tokens)
- **Authentication**: JWT, bcrypt
- **Email**: Nodemailer for password reset
- **Validation**: Joi schema validation
- **gRPC**: @grpc/grpc-js for inter-service communication
- **Protocol Buffers**: Efficient binary serialization

### Key Components

```
Auth Service
├── REST API Server
├── gRPC Server
├── User Controller
├── Authentication Controller
├── JWT Service
├── Password Service
├── Email Service
├── Session Manager
├── Role Manager
└── Security Middleware
```

## 🔄 Authentication Flow

### Registration Flow

```
User Registration Request
    ↓
Input Validation
    ↓
Email Uniqueness Check
    ↓
Password Hashing (bcrypt)
    ↓
User Creation
    ↓
Email Verification
    ↓
Return Success Response
```

### Login Flow

```
User Login Request
    ↓
Input Validation
    ↓
User Lookup
    ↓
Password Verification
    ↓
JWT Token Generation
    ↓
Session Creation
    ↓
Return Tokens
```

### Token Refresh Flow

```
Refresh Token Request
    ↓
Token Validation
    ↓
User Verification
    ↓
New Token Generation
    ↓
Token Rotation
    ↓
Return New Tokens
```

### gRPC Token Validation Flow

```
Service Request with JWT
    ↓
gRPC Interceptor
    ↓
Token Extraction from Metadata
    ↓
Token Validation
    ↓
User Context Injection
    ↓
Service Method Execution
```

## 📡 API Endpoints

### Public Endpoints (REST)

```
POST   /auth/register              # User registration
POST   /auth/login                 # User login
POST   /auth/refresh               # Refresh access token
POST   /auth/forgot-password       # Request password reset
POST   /auth/reset-password        # Reset password with token
POST   /auth/verify-email          # Verify email address
GET    /auth/verify-token          # Verify token validity
```

### Protected Endpoints (REST)

```
GET    /auth/profile               # Get user profile
PUT    /auth/profile               # Update user profile
POST   /auth/change-password       # Change password
POST   /auth/logout                # User logout
POST   /auth/enable-2fa            # Enable 2FA
POST   /auth/verify-2fa            # Verify 2FA code
DELETE /auth/account               # Delete account
```

### OAuth Endpoints (REST)

```
GET    /auth/google                # Google OAuth login
GET    /auth/facebook              # Facebook OAuth login
GET    /auth/oauth/callback        # OAuth callback
```

### gRPC Services (Internal)

```
auth.AuthService
├── Register(RegisterRequest) returns (RegisterResponse)
├── Login(LoginRequest) returns (LoginResponse)
├── RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse)
├── ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse)
├── GetUserProfile(GetUserProfileRequest) returns (GetUserProfileResponse)
├── UpdateUserProfile(UpdateUserProfileRequest) returns (UpdateUserProfileResponse)
├── ChangePassword(ChangePasswordRequest) returns (ChangePasswordResponse)
├── Logout(LogoutRequest) returns (LogoutResponse)
└── Verify2FA(Verify2FARequest) returns (Verify2FAResponse)

auth.HealthService
└── Check(HealthCheckRequest) returns (HealthCheckResponse)
```

## 🔐 Security Features

### Password Security

- **bcrypt Hashing**: 12 rounds of bcrypt hashing
- **Password Policy**: Minimum 8 characters, complexity requirements
- **Password History**: Prevent reuse of recent passwords
- **Brute Force Protection**: Account lockout after failed attempts

### JWT Security

- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration with rotation
- **Token Blacklisting**: Invalidate tokens on logout
- **Secure Storage**: HTTP-only cookies for refresh tokens

### gRPC Security

- **TLS Encryption**: Secure inter-service communication
- **mTLS**: Mutual TLS for service-to-service authentication
- **Token Propagation**: Pass JWT tokens in gRPC metadata
- **Service Authentication**: Verify service identity

### Session Management

- **Redis Sessions**: Distributed session storage
- **Session Expiration**: Automatic session cleanup
- **Concurrent Sessions**: Limit active sessions per user
- **Session Invalidation**: Logout from all devices

### Two-Factor Authentication

- **TOTP**: Time-based one-time passwords
- **QR Code Generation**: Easy setup with authenticator apps
- **Backup Codes**: Recovery codes for account access
- **SMS/Email 2FA**: Alternative 2FA methods

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    device_info JSONB
);
```

### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
GRPC_PORT=50051
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/booking_auth
DATABASE_SSL=true

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=noreply@bookingsystem.com

# Security Configuration
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=15m
SESSION_EXPIRES_IN=24h

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

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
// shared-lib/protos/auth.proto
syntax = "proto3";

package auth;

import "google/protobuf/timestamp.proto";

service AuthService {
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc GetUserProfile(GetUserProfileRequest) returns (GetUserProfileResponse);
  rpc UpdateUserProfile(UpdateUserProfileRequest) returns (UpdateUserProfileResponse);
  rpc ChangePassword(ChangePasswordRequest) returns (ChangePasswordResponse);
  rpc Logout(LogoutRequest) returns (LogoutResponse);
  rpc Verify2FA(Verify2FARequest) returns (Verify2FAResponse);
}

message RegisterRequest {
  string email = 1;
  string password = 2;
  string first_name = 3;
  string last_name = 4;
  string phone = 5;
}

message RegisterResponse {
  string user_id = 1;
  string message = 2;
  bool success = 3;
}

message LoginRequest {
  string email = 1;
  string password = 2;
  string two_factor_code = 3;
}

message LoginResponse {
  string access_token = 1;
  string refresh_token = 2;
  UserProfile user = 3;
  bool success = 4;
  string message = 5;
}

message ValidateTokenRequest {
  string token = 1;
}

message ValidateTokenResponse {
  bool valid = 1;
  UserProfile user = 2;
  string message = 3;
}

message GetUserProfileRequest {
  string user_id = 1;
}

message GetUserProfileResponse {
  UserProfile user = 1;
  bool success = 2;
  string message = 3;
}

message UserProfile {
  string id = 1;
  string email = 2;
  string first_name = 3;
  string last_name = 4;
  string phone = 5;
  string role = 6;
  bool email_verified = 7;
  bool two_factor_enabled = 8;
  google.protobuf.Timestamp created_at = 9;
  google.protobuf.Timestamp updated_at = 10;
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

- **User Profile Cache**: Cache user data in Redis
- **Session Cache**: Fast session lookups
- **Token Cache**: Cache valid tokens
- **Rate Limit Cache**: Distributed rate limiting

### Database Optimization

- **Connection Pooling**: Optimize database connections
- **Indexes**: Index on email, user_id, token_hash
- **Query Optimization**: Efficient user lookups
- **Read Replicas**: For read-heavy operations

### Security Optimizations

- **Token Rotation**: Automatic refresh token rotation
- **Session Cleanup**: Periodic cleanup of expired sessions
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Early validation to prevent processing

## 📊 Monitoring & Observability

### Metrics

- **Authentication Rate**: Successful/failed logins per minute
- **Registration Rate**: New user registrations
- **Token Refresh Rate**: Token refresh operations
- **Session Count**: Active sessions
- **Error Rates**: Authentication failures
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Security Logs**: Login attempts, password changes
- **Audit Logs**: User actions and changes
- **Error Logs**: Authentication failures and errors
- **Performance Logs**: Slow operations
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Email Service**: SMTP connectivity
- **OAuth Providers**: External service health
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
EXPOSE 3001 50051
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth
          image: booking-system/auth-service:latest
          ports:
            - containerPort: 3001
            - containerPort: 50051
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: auth-secrets
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

## 🔄 Token Management

### Access Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "user",
    "iat": 1640995200,
    "exp": 1640996100,
    "jti": "token_id"
  }
}
```

### gRPC Token Propagation

```javascript
// gRPC interceptor for token validation
const authInterceptor = {
  intercept: (call, callback) => {
    const metadata = call.metadata;
    const token = metadata.get("authorization")[0];

    if (!token) {
      callback({
        code: grpc.status.UNAUTHENTICATED,
        message: "No token provided",
      });
      return;
    }

    // Validate token and inject user context
    validateToken(token)
      .then((user) => {
        call.user = user;
        callback();
      })
      .catch((err) => {
        callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Invalid token",
        });
      });
  },
};
```

### Refresh Token Rotation

```javascript
// Generate new refresh token on each use
const newRefreshToken = await generateRefreshToken(userId);
await invalidateRefreshToken(oldRefreshToken);
await storeRefreshToken(newRefreshToken, userId);
```

## 🛡️ Security Best Practices

### Input Validation

- **Email Validation**: Proper email format validation
- **Password Strength**: Complexity requirements
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization

### Token Security

- **Secure Storage**: HTTP-only cookies for refresh tokens
- **Token Rotation**: New refresh token on each use
- **Token Blacklisting**: Invalidate tokens on logout
- **Short Expiration**: Access tokens expire quickly

### gRPC Security

- **TLS Encryption**: Secure all gRPC communications
- **mTLS**: Mutual TLS for service authentication
- **Token Validation**: Validate tokens in gRPC metadata
- **Service Identity**: Verify service certificates

### Account Security

- **Rate Limiting**: Prevent brute force attacks
- **Account Lockout**: Temporary lockout after failed attempts
- **Email Verification**: Verify email ownership
- **Password History**: Prevent password reuse

## 📞 Troubleshooting

### Common Issues

1. **Token Expiration**: Check token expiration times
2. **Database Connection**: Verify database connectivity
3. **Redis Connection**: Check Redis service health
4. **Email Delivery**: Verify SMTP configuration
5. **gRPC Connection**: Check gRPC service endpoints

### Debug Commands

```bash
# Check service health
curl http://auth-service:3001/health

# Test gRPC connectivity
grpcurl -plaintext auth-service:50051 list

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connection
redis-cli ping

# Verify JWT token
jwt decode <token>
```

## 🔗 Dependencies

### External Services

- **Email Service**: Password reset emails
- **SMS Service**: 2FA codes (optional)
- **OAuth Providers**: Google, Facebook, etc.

### Infrastructure

- **PostgreSQL**: User data storage
- **Redis**: Session and token cache
- **SMTP Server**: Email delivery
- **Protocol Buffers**: Message serialization

## 🆕 Integration with Check-in Service

The **Check-in Service** relies on Auth Service to:

- **Authenticate Staff**: Ensure only authorized staff can perform check-in operations
- **Protect APIs**: Secure check-in endpoints with JWT/mTLS
- **Role-based Access**: Enforce permissions for check-in and event management
