# 🛡️ Security Monitoring Service

**Language:** Node.js

**Why Node.js?**

- Fast I/O for real-time threat detection and monitoring
- Excellent integration with Elasticsearch for log analysis
- Easy integration with other services via gRPC
- Real-time event processing capabilities

## 🎯 Overview

The Security Monitoring Service provides comprehensive threat detection, security monitoring, and real-time security alerts for the booking system. It analyzes security events from all services, detects suspicious activities, and triggers appropriate security responses.

## 🎯 Responsibilities

- **Threat Detection**: Real-time analysis of security events and patterns
- **Security Monitoring**: Monitor all services for security events
- **Suspicious Activity Detection**: Identify and flag suspicious behavior
- **Security Alerts**: Generate and send security notifications
- **Audit Logging**: Comprehensive security event logging
- **Risk Assessment**: Calculate security risk scores
- **Incident Response**: Automated security incident handling
- **gRPC Server**: High-performance inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: gRPC server only (no REST API)
- **Database**: PostgreSQL (security events, risk scores)
- **Search Engine**: Elasticsearch (log analysis, threat detection)
- **Cache**: Redis (threat patterns, alert rules)
- **Machine Learning**: TensorFlow.js (anomaly detection)
- **Validation**: Joi schema validation
- **gRPC**: @grpc/grpc-js for inter-service communication
- **Protocol Buffers**: Efficient binary serialization

### Key Components

```
Security Service
├── gRPC Server
├── Security Controller
├── Threat Detection Engine
├── Security Monitoring Service
├── Alert Manager
├── Risk Assessment Service
├── Incident Response Handler
├── Machine Learning Engine
└── Audit Logger
```

## 🔄 Security Monitoring Flow

### Threat Detection Flow

```
Security Event
    ↓
Event Collection
    ↓
Pattern Analysis
    ↓
Risk Assessment
    ↓
Threat Classification
    ↓
Alert Generation
    ↓
Response Action
```

### Security Alert Flow

```
Security Alert
    ↓
Alert Classification
    ↓
Priority Assessment
    ↓
Notification Routing
    ↓
Response Execution
    ↓
Alert Resolution
```

### Incident Response Flow

```
Security Incident
    ↓
Incident Classification
    ↓
Response Plan Selection
    ↓
Automated Actions
    ↓
Manual Intervention (if needed)
    ↓
Incident Resolution
```

## 📡 gRPC Services (Internal Only)

### Security Service

```
security.SecurityService
├── SubmitEvent(SubmitEventRequest) returns (SubmitEventResponse)
├── GetEvents(GetEventsRequest) returns (GetEventsResponse)
├── GetAlerts(GetAlertsRequest) returns (GetAlertsResponse)
├── AcknowledgeAlert(AcknowledgeAlertRequest) returns (AcknowledgeAlertResponse)
├── GetIncidents(GetIncidentsRequest) returns (GetIncidentsResponse)
├── ResolveIncident(ResolveIncidentRequest) returns (ResolveIncidentResponse)
├── GetRiskScore(GetRiskScoreRequest) returns (GetRiskScoreResponse)
├── UpdateRiskScore(UpdateRiskScoreRequest) returns (UpdateRiskScoreResponse)
├── GetAnalytics(GetAnalyticsRequest) returns (GetAnalyticsResponse)
└── GetThreatPatterns(GetThreatPatternsRequest) returns (GetThreatPatternsResponse)
```

### Health Service

```
security.HealthService
└── Check(HealthCheckRequest) returns (HealthCheckResponse)
```

## 🔐 Security Features

### Threat Detection

- **Real-time Monitoring**: Continuous monitoring of all security events
- **Pattern Recognition**: Machine learning-based threat pattern detection
- **Anomaly Detection**: Identify unusual behavior patterns
- **Risk Scoring**: Dynamic risk assessment for users and activities

### Security Alerts

- **Alert Classification**: Categorize alerts by severity and type
- **Alert Prioritization**: Automatic priority assignment based on risk
- **Alert Routing**: Route alerts to appropriate teams or systems
- **Alert Escalation**: Automatic escalation for high-priority alerts

### Incident Response

- **Automated Response**: Immediate automated actions for common threats
- **Response Playbooks**: Predefined response procedures for different incidents
- **Manual Intervention**: Support for manual security operations
- **Incident Tracking**: Complete incident lifecycle management

### Risk Assessment

- **User Risk Scoring**: Calculate risk scores for individual users
- **Activity Risk Scoring**: Assess risk of specific activities
- **Device Risk Scoring**: Evaluate risk associated with devices
- **Dynamic Risk Updates**: Real-time risk score adjustments

### Machine Learning Integration

- **Behavioral Analysis**: Learn normal user behavior patterns
- **Threat Prediction**: Predict potential security threats
- **False Positive Reduction**: Minimize false security alerts
- **Adaptive Learning**: Continuously improve threat detection

## 📊 Database Schema

### Security Events Table

```sql
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    service_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'authentication', 'authorization', 'data_access', 'system'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    event_data JSONB NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    risk_score INTEGER DEFAULT 0, -- 0-100
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
```

### Security Alerts Table

```sql
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES security_events(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'closed'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alert_data JSONB,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Security Incidents Table

```sql
CREATE TABLE security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(100) NOT NULL,
    incident_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'contained', 'resolved', 'closed'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    incident_data JSONB,
    affected_users INTEGER DEFAULT 0,
    affected_services TEXT[],
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);
```

### Risk Scores Table

```sql
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_type VARCHAR(50) NOT NULL, -- 'user', 'device', 'activity'
    risk_score INTEGER NOT NULL, -- 0-100
    risk_factors JSONB,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, risk_type)
);
```

### Threat Patterns Table

```sql
CREATE TABLE threat_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 0.00-1.00
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
GRPC_PORT=50053
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/booking_security
DATABASE_SSL=true

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Security Configuration
SECURITY_ALERT_THRESHOLD=70
SUSPICIOUS_ACTIVITY_THRESHOLD=50
RISK_SCORE_UPDATE_INTERVAL=300000 # 5 minutes
THREAT_DETECTION_INTERVAL=60000 # 1 minute

# Machine Learning Configuration
ML_MODEL_PATH=/app/models/threat_detection_model
ML_CONFIDENCE_THRESHOLD=0.8
ML_TRAINING_INTERVAL=86400000 # 24 hours

# Integration Configuration
AUTH_SERVICE_URL=grpc://auth-service:50051
DEVICE_SERVICE_URL=grpc://device-service:50052
NOTIFICATION_SERVICE_URL=grpc://notification-service:50054

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
// shared-lib/protos/security.proto
syntax = "proto3";

package security;

import "google/protobuf/timestamp.proto";

service SecurityService {
  rpc SubmitEvent(SubmitEventRequest) returns (SubmitEventResponse);
  rpc GetEvents(GetEventsRequest) returns (GetEventsResponse);
  rpc GetAlerts(GetAlertsRequest) returns (GetAlertsResponse);
  rpc AcknowledgeAlert(AcknowledgeAlertRequest) returns (AcknowledgeAlertResponse);
  rpc GetIncidents(GetIncidentsRequest) returns (GetIncidentsResponse);
  rpc ResolveIncident(ResolveIncidentRequest) returns (ResolveIncidentResponse);
  rpc GetRiskScore(GetRiskScoreRequest) returns (GetRiskScoreResponse);
  rpc UpdateRiskScore(UpdateRiskScoreRequest) returns (UpdateRiskScoreResponse);
  rpc GetAnalytics(GetAnalyticsRequest) returns (GetAnalyticsResponse);
  rpc GetThreatPatterns(GetThreatPatternsRequest) returns (GetThreatPatternsResponse);
}

message SubmitEventRequest {
  string user_id = 1;
  string service_name = 2;
  string event_type = 3;
  string event_category = 4;
  string severity = 5;
  bytes event_data = 6;
  string ip_address = 7;
  string user_agent = 8;
  bytes location_data = 9;
}

message SubmitEventResponse {
  string event_id = 1;
  bool success = 2;
  string message = 3;
}

message GetEventsRequest {
  string user_id = 1;
  string service_name = 2;
  string event_type = 3;
  string severity = 4;
  google.protobuf.Timestamp start_date = 5;
  google.protobuf.Timestamp end_date = 6;
  int32 limit = 7;
  int32 offset = 8;
}

message GetEventsResponse {
  repeated SecurityEvent events = 1;
  int32 total_count = 2;
  bool success = 3;
  string message = 4;
}

message SecurityEvent {
  string id = 1;
  string user_id = 2;
  string service_name = 3;
  string event_type = 4;
  string event_category = 5;
  string severity = 6;
  bytes event_data = 7;
  string ip_address = 8;
  string user_agent = 9;
  int32 risk_score = 10;
  google.protobuf.Timestamp created_at = 11;
}

message GetAlertsRequest {
  string status = 1;
  string severity = 2;
  string alert_type = 3;
  int32 limit = 4;
  int32 offset = 5;
}

message GetAlertsResponse {
  repeated SecurityAlert alerts = 1;
  int32 total_count = 2;
  bool success = 3;
  string message = 4;
}

message SecurityAlert {
  string id = 1;
  string event_id = 2;
  string alert_type = 3;
  string alert_category = 4;
  string severity = 5;
  string status = 6;
  string title = 7;
  string description = 8;
  string assigned_to = 9;
  google.protobuf.Timestamp created_at = 10;
  google.protobuf.Timestamp acknowledged_at = 11;
  google.protobuf.Timestamp resolved_at = 12;
}

message AcknowledgeAlertRequest {
  string alert_id = 1;
  string user_id = 2;
}

message AcknowledgeAlertResponse {
  bool success = 1;
  string message = 2;
}

message GetIncidentsRequest {
  string status = 1;
  string severity = 2;
  string incident_type = 3;
  int32 limit = 4;
  int32 offset = 5;
}

message GetIncidentsResponse {
  repeated SecurityIncident incidents = 1;
  int32 total_count = 2;
  bool success = 3;
  string message = 4;
}

message SecurityIncident {
  string id = 1;
  string incident_type = 2;
  string incident_category = 3;
  string severity = 4;
  string status = 5;
  string title = 6;
  string description = 7;
  int32 affected_users = 8;
  repeated string affected_services = 9;
  string assigned_to = 10;
  google.protobuf.Timestamp created_at = 11;
  google.protobuf.Timestamp resolved_at = 12;
}

message ResolveIncidentRequest {
  string incident_id = 1;
  string user_id = 2;
  string resolution_notes = 3;
}

message ResolveIncidentResponse {
  bool success = 1;
  string message = 2;
}

message GetRiskScoreRequest {
  string user_id = 1;
  string risk_type = 2;
}

message GetRiskScoreResponse {
  int32 risk_score = 1;
  string risk_level = 2; // 'low', 'medium', 'high', 'critical'
  bytes risk_factors = 3;
  bool success = 4;
  string message = 5;
}

message UpdateRiskScoreRequest {
  string user_id = 1;
  string risk_type = 2;
  int32 risk_score = 3;
  bytes risk_factors = 4;
}

message UpdateRiskScoreResponse {
  bool success = 1;
  string message = 2;
}

message GetAnalyticsRequest {
  google.protobuf.Timestamp start_date = 1;
  google.protobuf.Timestamp end_date = 2;
  string service_name = 3;
  string event_type = 4;
}

message GetAnalyticsResponse {
  bytes analytics_data = 1;
  bool success = 2;
  string message = 3;
}

message GetThreatPatternsRequest {
  string pattern_type = 1;
  bool active_only = 2;
}

message GetThreatPatternsResponse {
  repeated ThreatPattern patterns = 1;
  bool success = 2;
  string message = 3;
}

message ThreatPattern {
  string id = 1;
  string pattern_name = 2;
  string pattern_type = 3;
  bytes pattern_data = 4;
  double confidence_score = 5;
  bool is_active = 6;
  google.protobuf.Timestamp created_at = 7;
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

- **Threat Patterns Cache**: Cache threat patterns in Redis
- **Risk Scores Cache**: Cache user risk scores
- **Alert Rules Cache**: Cache alert generation rules
- **Analytics Cache**: Cache security analytics data

### Database Optimization

- **Connection Pooling**: Optimize database connections
- **Indexes**: Index on user_id, event_type, severity, created_at
- **Query Optimization**: Efficient event lookups
- **Read Replicas**: For read-heavy operations

### Elasticsearch Optimization

- **Index Management**: Optimize index settings for security logs
- **Query Optimization**: Efficient search queries
- **Aggregation Caching**: Cache aggregation results
- **Shard Management**: Optimize shard allocation

### Machine Learning Optimization

- **Model Caching**: Cache trained models in memory
- **Batch Processing**: Process events in batches
- **Async Processing**: Non-blocking ML inference
- **Model Updates**: Incremental model updates

## 📊 Monitoring & Observability

### Metrics

- **Event Processing Rate**: Security events processed per minute
- **Alert Generation Rate**: Security alerts generated
- **Incident Resolution Time**: Time to resolve security incidents
- **Risk Score Updates**: Risk score calculation frequency
- **ML Model Performance**: Threat detection accuracy
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Security Logs**: All security events and alerts
- **ML Logs**: Machine learning model performance
- **Error Logs**: Security service errors and failures
- **Performance Logs**: Slow operations and bottlenecks
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Elasticsearch Health**: Search engine connectivity
- **Redis Health**: Cache connectivity
- **ML Model Health**: Machine learning model status
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

### ML Tests

```bash
npm run test:ml
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

# Install protobuf compiler and Python for ML
RUN apk add --no-cache protobuf python3 py3-pip

COPY package*.json ./
RUN npm ci --only=production

# Install Python dependencies for ML
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy protobuf definitions
COPY shared-lib/protos ./protos

# Generate gRPC code
RUN npm run grpc:generate

# Copy ML models
COPY models ./models

COPY . .
EXPOSE 50053
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: security-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: security-service
  template:
    metadata:
      labels:
        app: security-service
    spec:
      containers:
        - name: security
          image: booking-system/security-service:latest
          ports:
            - containerPort: 50053
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: security-secrets
                  key: database-url
            - name: ELASTICSEARCH_URL
              value: "http://elasticsearch-service:9200"
            - name: REDIS_URL
              value: "redis://redis-service:6379"
          volumeMounts:
            - name: grpc-certs
              mountPath: /etc/grpc/certs
              readOnly: true
            - name: ml-models
              mountPath: /app/models
              readOnly: true
      volumes:
        - name: grpc-certs
          secret:
            secretName: grpc-tls-certs
        - name: ml-models
          persistentVolumeClaim:
            claimName: ml-models-pvc
```

## 🔄 Integration with Other Services

### Integration with Auth Service

The **Auth Service** sends events to Security Service:

- **Login Attempts**: Successful and failed login events
- **Password Changes**: Password modification events
- **Account Updates**: Profile and security setting changes
- **Session Events**: Session creation and termination

### Integration with Device Service

The **Device Service** sends events to Security Service:

- **Device Registration**: New device registration events
- **Device Trust Changes**: Trust level updates
- **Suspicious Device Activity**: Suspicious device behavior
- **Device Revocation**: Device access revocation events

### Integration with All Services

All services send security events to Security Service:

- **API Access**: All API access attempts
- **Data Access**: Sensitive data access events
- **System Events**: System configuration changes
- **Error Events**: Security-related errors

### Integration with Notification Service

The **Security Service** sends alerts to Notification Service:

- **Security Alerts**: High-priority security notifications
- **Incident Notifications**: Security incident updates
- **Risk Score Alerts**: User risk score changes
- **Threat Notifications**: New threat pattern detections

## 📞 Troubleshooting

### Common Issues

1. **Event Processing**: Check event processing pipeline
2. **Alert Generation**: Verify alert generation rules
3. **ML Model Performance**: Check machine learning model status
4. **Database Connection**: Verify database connectivity
5. **Elasticsearch Connection**: Check Elasticsearch service health
6. **Redis Connection**: Check Redis service health
7. **gRPC Connection**: Check gRPC service endpoints

### Debug Commands

```bash
# Test gRPC connectivity
grpcurl -plaintext security-service:50053 list

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Test Elasticsearch connection
curl -X GET "elasticsearch-service:9200/_cluster/health"

# Check Redis connection
redis-cli ping

# Test gRPC health check
grpcurl -plaintext security-service:50053 security.HealthService/Check

# Submit test security event via gRPC
grpcurl -plaintext -d '{"service_name": "test", "event_type": "test_event", "severity": "low"}' security-service:50053 security.SecurityService/SubmitEvent
```

## 🔗 Dependencies

### External Services

- **Auth Service**: Authentication and user events
- **Device Service**: Device-related security events
- **Notification Service**: Security alert notifications
- **All Other Services**: Security event collection

### Infrastructure

- **PostgreSQL**: Security events and incident data storage
- **Elasticsearch**: Security log analysis and search
- **Redis**: Threat patterns and risk score cache
- **Protocol Buffers**: Message serialization
- **TensorFlow.js**: Machine learning for threat detection

## 🆕 Future Enhancements

### Planned Features

- **Advanced ML Models**: Deep learning for threat detection
- **Behavioral Biometrics**: Advanced user behavior analysis
- **Threat Intelligence**: Integration with external threat feeds
- **Automated Response**: Advanced automated incident response
- **Security Orchestration**: SOAR (Security Orchestration, Automation, and Response)
- **Zero Trust Architecture**: Advanced zero trust implementation
- **Compliance Monitoring**: GDPR, SOC2, PCI DSS compliance
- **Forensic Analysis**: Advanced security forensics capabilities
