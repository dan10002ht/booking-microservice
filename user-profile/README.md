# User Profile Service (Node.js)

**Language:** Node.js

**Why Node.js?**

- CRUD user, preferences, easy frontend integration
- Rapid development, maintainable

# 👤 User Profile Service

## Overview

The User Profile Service is responsible for managing user profiles, preferences, settings, and user-related data. It handles user profile creation, updates, preferences management, and provides comprehensive user data management with privacy controls and data validation.

## 🎯 Responsibilities

- **User Profile Management**: CRUD operations for user profiles
- **Profile Preferences**: Manage user preferences and settings
- **Profile Verification**: Handle profile verification processes
- **Privacy Controls**: Manage user privacy settings
- **Profile Analytics**: Track user profile metrics
- **Data Validation**: Validate user profile data
- **Profile Search**: Search and discover user profiles
- **gRPC Communication**: Inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (user profiles, preferences)
- **Cache**: Redis (profile cache, preferences)
- **Message Queue**: Kafka (profile events, updates)
- **gRPC**: grpc-java for inter-service communication
- **File Storage**: AWS S3, MinIO (profile images)
- **Search**: Elasticsearch (profile search)
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
User Profile Service
├── Profile Manager
├── Preferences Manager
├── Verification Manager
├── Privacy Manager
├── Analytics Engine
├── Search Engine
├── Media Manager
├── gRPC Server/Client
└── Event Publisher
```

## 🔄 Profile Management Flow

### Profile Creation Flow

```
User Registration
    ↓
Profile Data Validation
    ↓
Profile Creation
    ↓
Default Preferences Setup
    ↓
Privacy Settings Setup
    ↓
Profile Indexing
    ↓
Welcome Email
    ↓
Profile Published
```

### Profile Update Flow

```
Update Request
    ↓
Data Validation
    ↓
Change Impact Analysis
    ↓
Profile Update
    ↓
Cache Invalidation
    ↓
Search Re-indexing
    ↓
Event Publishing
    ↓
Notification (if needed)
```

### Profile Verification Flow

```
Verification Request
    ↓
Document Upload
    ↓
Document Validation
    ↓
Manual Review (if needed)
    ↓
Verification Decision
    ↓
Status Update
    ↓
Notification
```

## 📡 API Endpoints

### REST API

```http
# Profile Management
GET    /api/v1/profiles                      # List profiles
GET    /api/v1/profiles/{id}                 # Get profile by ID
POST   /api/v1/profiles                      # Create profile
PUT    /api/v1/profiles/{id}                 # Update profile
DELETE /api/v1/profiles/{id}                 # Delete profile
PATCH  /api/v1/profiles/{id}/status          # Update profile status

# Profile Preferences
GET    /api/v1/profiles/{id}/preferences     # Get user preferences
PUT    /api/v1/profiles/{id}/preferences     # Update preferences
GET    /api/v1/profiles/{id}/settings        # Get user settings
PUT    /api/v1/profiles/{id}/settings        # Update settings

# Profile Verification
POST   /api/v1/profiles/{id}/verify          # Request verification
GET    /api/v1/profiles/{id}/verification    # Get verification status
POST   /api/v1/profiles/{id}/documents       # Upload verification documents

# Profile Search
GET    /api/v1/profiles/search               # Search profiles
GET    /api/v1/profiles/recommendations      # Get profile recommendations
GET    /api/v1/profiles/trending             # Get trending profiles

# Profile Media
POST   /api/v1/profiles/{id}/avatar          # Upload profile avatar
DELETE /api/v1/profiles/{id}/avatar          # Delete profile avatar
POST   /api/v1/profiles/{id}/media           # Upload profile media
GET    /api/v1/profiles/{id}/media           # Get profile media

# Privacy Management
GET    /api/v1/profiles/{id}/privacy         # Get privacy settings
PUT    /api/v1/profiles/{id}/privacy         # Update privacy settings
POST   /api/v1/profiles/{id}/block/{userId}  # Block user
DELETE /api/v1/profiles/{id}/block/{userId}  # Unblock user

# Analytics
GET    /api/v1/profiles/{id}/analytics       # Get profile analytics
GET    /api/v1/profiles/statistics           # Get profile statistics
```

### gRPC Services

```protobuf
service UserProfileService {
  rpc CreateProfile(CreateProfileRequest) returns (ProfileResponse);
  rpc GetProfile(GetProfileRequest) returns (ProfileResponse);
  rpc UpdateProfile(UpdateProfileRequest) returns (ProfileResponse);
  rpc DeleteProfile(DeleteProfileRequest) returns (DeleteProfileResponse);
  rpc ListProfiles(ListProfilesRequest) returns (ListProfilesResponse);
  rpc SearchProfiles(SearchProfilesRequest) returns (SearchProfilesResponse);
  rpc GetProfileAnalytics(GetProfileAnalyticsRequest) returns (ProfileAnalyticsResponse);

  rpc GetPreferences(GetPreferencesRequest) returns (PreferencesResponse);
  rpc UpdatePreferences(UpdatePreferencesRequest) returns (PreferencesResponse);
  rpc GetSettings(GetSettingsRequest) returns (SettingsResponse);
  rpc UpdateSettings(UpdateSettingsRequest) returns (SettingsResponse);

  rpc RequestVerification(VerificationRequest) returns (VerificationResponse);
  rpc GetVerificationStatus(GetVerificationStatusRequest) returns (VerificationStatusResponse);
  rpc UploadDocument(DocumentUploadRequest) returns (DocumentUploadResponse);

  rpc GetPrivacySettings(GetPrivacyRequest) returns (PrivacyResponse);
  rpc UpdatePrivacySettings(UpdatePrivacyRequest) returns (PrivacyResponse);
  rpc BlockUser(BlockUserRequest) returns (BlockUserResponse);
  rpc UnblockUser(UnblockUserRequest) returns (UnblockUserResponse);
}

service ProfileEventService {
  rpc PublishProfileEvent(ProfileEvent) returns (EventResponse);
  rpc SubscribeToProfileEvents(SubscribeRequest) returns (stream ProfileEvent);
}
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate JWT tokens from Auth Service
- **Profile Ownership**: Users can only manage their own profiles
- **Privacy Controls**: Respect user privacy settings
- **Admin Access**: Admin users have limited access

### Data Protection

- **Personal Data Encryption**: Encrypt sensitive personal data
- **Privacy Controls**: Granular privacy settings
- **Data Masking**: Mask sensitive data in logs
- **GDPR Compliance**: Ensure data privacy compliance

### API Security

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all input data
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

## 📊 Database Schema

### User Profiles Table

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    bio TEXT,
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    avatar_url VARCHAR(500),
    cover_url VARCHAR(500),
    verification_status VARCHAR(20) DEFAULT 'unverified',
    profile_status VARCHAR(20) DEFAULT 'active',
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Preferences Table

```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    preference_type VARCHAR(20) DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);
```

### User Settings Table

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);
```

### Profile Verification Table

```sql
CREATE TABLE profile_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Profile Media Table

```sql
CREATE TABLE profile_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Privacy Settings Table

```sql
CREATE TABLE privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);
```

### Blocked Users Table

```sql
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, blocked_user_id)
);
```

### Profile Analytics Table

```sql
CREATE TABLE profile_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8086
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/user_profile_db
SPRING_DATASOURCE_USERNAME=user_profile_user
SPRING_DATASOURCE_PASSWORD=user_profile_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=9

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_PROFILE_EVENTS=profile-events
KAFKA_TOPIC_USER_EVENTS=user-events
KAFKA_GROUP_ID=user-profile

# gRPC Configuration
GRPC_SERVER_PORT=50059
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_ANALYTICS_SERVICE_URL=analytics-service:50057
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# Storage Configuration
STORAGE_TYPE=s3
AWS_S3_BUCKET=user-profiles
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=your_s3_access_key
AWS_S3_SECRET_KEY=your_s3_secret_key
AWS_S3_ENDPOINT=https://s3.amazonaws.com

# Elasticsearch Configuration
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password
ELASTICSEARCH_INDEX_PROFILES=profiles

# Email Configuration
EMAIL_SERVICE_URL=http://email-worker:8082
EMAIL_TEMPLATE_PROFILE_CREATED=profile-created
EMAIL_TEMPLATE_PROFILE_UPDATED=profile-updated
EMAIL_TEMPLATE_VERIFICATION_COMPLETE=verification-complete

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
RATE_LIMIT_REQUESTS_PER_MINUTE=100
FILE_UPLOAD_MAX_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Privacy Configuration
DEFAULT_PRIVACY_LEVEL=public
PRIVACY_OPTIONS=public,private,friends,contacts
DATA_RETENTION_DAYS=2555

# Verification Configuration
VERIFICATION_ENABLED=true
VERIFICATION_REQUIRED_FIELDS=email,phone,identity_document
VERIFICATION_AUTO_APPROVE=false
VERIFICATION_REVIEW_TIMEOUT_HOURS=72
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Profile Cache**: Cache frequently accessed profiles
- **Preferences Cache**: Cache user preferences
- **Search Cache**: Cache search results
- **Privacy Cache**: Cache privacy settings

### Database Optimization

- **Indexing**: Optimize database indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex queries
- **Partitioning**: Partition large tables

### Search Optimization

- **Elasticsearch**: Fast full-text search
- **Index Optimization**: Optimize search indexes
- **Query Caching**: Cache search queries
- **Suggestions**: Fast autocomplete suggestions

## 📊 Monitoring & Observability

### Metrics

- **Profile Creation Rate**: Profiles created per minute
- **Profile Update Rate**: Profile updates per minute
- **Search Performance**: Search query response time
- **Verification Rate**: Verification requests per minute
- **API Response Time**: Average API response time
- **Error Rate**: Error percentage by endpoint
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Profile Logs**: All profile operations
- **Verification Logs**: Verification activities
- **Privacy Logs**: Privacy setting changes
- **Search Logs**: Search query activities
- **Error Logs**: Error details and stack traces
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **Elasticsearch Health**: Search service health
- **S3 Health**: Storage service health
- **gRPC Health**: gRPC service connectivity

## 🧪 Testing

### Unit Tests

```bash
./mvnw test
```

### Integration Tests

```bash
./mvnw test -Dtest=IntegrationTest
```

### gRPC Tests

```bash
./mvnw test -Dtest=GrpcTest
```

### Privacy Tests

```bash
./mvnw test -Dtest=PrivacyTest
```

### Verification Tests

```bash
./mvnw test -Dtest=VerificationTest
```

### Performance Tests

```bash
./mvnw test -Dtest=PerformanceTest
```

## 🚀 Deployment

### Docker

```dockerfile
FROM openjdk:17-jdk-slim

# Install protobuf compiler
RUN apt-get update && apt-get install -y protobuf-compiler

WORKDIR /app

# Copy Maven files
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Copy protobuf definitions
COPY shared-lib/protos ./protos

# Generate gRPC code
RUN ./mvnw grpc:generate

# Copy source code
COPY src ./src

# Build application
RUN ./mvnw clean package -DskipTests

EXPOSE 8086 50059

CMD ["java", "-jar", "target/user-profile.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-profile
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-profile
  template:
    metadata:
      labels:
        app: user-profile
    spec:
      containers:
        - name: user-profile
          image: booking-system/user-profile:latest
          ports:
            - containerPort: 8086
            - containerPort: 50059
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: user-profile-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: ELASTICSEARCH_HOST
              value: "elasticsearch-service"
            - name: AWS_S3_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: user-profile-secrets
                  key: s3-access-key
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          volumeMounts:
            - name: profile-storage
              mountPath: /tmp/profiles
      volumes:
        - name: profile-storage
          emptyDir: {}
```

## 🔄 Service Implementation

### Profile Controller

```java
@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @PostMapping
    public ResponseEntity<ProfileResponse> createProfile(@RequestBody CreateProfileRequest request) {
        ProfileResponse response = profileService.createProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfileResponse> getProfile(@PathVariable UUID id) {
        ProfileResponse response = profileService.getProfile(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<SearchResponse> searchProfiles(@RequestParam String query) {
        SearchResponse response = profileService.searchProfiles(query);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<MediaResponse> uploadAvatar(@PathVariable UUID id,
                                                    @RequestParam("file") MultipartFile file) {
        MediaResponse response = profileService.uploadAvatar(id, file);
        return ResponseEntity.ok(response);
    }
}
```

### gRPC Server

```java
@GrpcService
public class UserProfileGrpcService extends UserProfileServiceGrpc.UserProfileServiceImplBase {

    @Autowired
    private ProfileService profileService;

    @Override
    public void createProfile(CreateProfileRequest request,
                            StreamObserver<ProfileResponse> responseObserver) {
        try {
            ProfileResponse response = profileService.createProfile(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to create profile: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void getProfile(GetProfileRequest request,
                          StreamObserver<ProfileResponse> responseObserver) {
        try {
            ProfileResponse response = profileService.getProfile(request.getId());
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.NOT_FOUND
                .withDescription("Profile not found: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### Privacy Service

```java
@Service
public class PrivacyService {

    @Autowired
    private PrivacySettingsRepository privacySettingsRepository;

    public boolean canViewProfile(UUID viewerId, UUID profileId) {
        // Get privacy settings
        PrivacySettings settings = privacySettingsRepository.findByUserId(profileId);

        // Check if viewer is blocked
        if (isBlocked(viewerId, profileId)) {
            return false;
        }

        // Check privacy level
        switch (settings.getProfileVisibility()) {
            case "public":
                return true;
            case "private":
                return viewerId.equals(profileId);
            case "friends":
                return areFriends(viewerId, profileId);
            case "contacts":
                return areContacts(viewerId, profileId);
            default:
                return false;
        }
    }

    public PrivacyResponse getPrivacySettings(UUID userId) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId);
        return PrivacyResponse.builder()
            .profileVisibility(settings.getProfileVisibility())
            .emailVisibility(settings.getEmailVisibility())
            .phoneVisibility(settings.getPhoneVisibility())
            .locationVisibility(settings.getLocationVisibility())
            .build();
    }

    public void updatePrivacySettings(UUID userId, UpdatePrivacyRequest request) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId);

        if (request.hasProfileVisibility()) {
            settings.setProfileVisibility(request.getProfileVisibility());
        }
        if (request.hasEmailVisibility()) {
            settings.setEmailVisibility(request.getEmailVisibility());
        }
        if (request.hasPhoneVisibility()) {
            settings.setPhoneVisibility(request.getPhoneVisibility());
        }
        if (request.hasLocationVisibility()) {
            settings.setLocationVisibility(request.getLocationVisibility());
        }

        privacySettingsRepository.save(settings);
    }
}
```

### Verification Service

```java
@Service
public class VerificationService {

    @Autowired
    private VerificationRepository verificationRepository;

    public VerificationResponse requestVerification(UUID userId, VerificationRequest request) {
        // Check if verification already exists
        ProfileVerification existing = verificationRepository.findByUserIdAndType(userId, request.getType());
        if (existing != null && existing.getStatus().equals("pending")) {
            throw new VerificationAlreadyExistsException("Verification already pending");
        }

        // Create verification request
        ProfileVerification verification = ProfileVerification.builder()
            .userId(userId)
            .verificationType(request.getType())
            .status("pending")
            .documents(request.getDocumentsList())
            .build();

        verificationRepository.save(verification);

        return VerificationResponse.builder()
            .verificationId(verification.getId())
            .status(verification.getStatus())
            .message("Verification request submitted successfully")
            .build();
    }

    public VerificationStatusResponse getVerificationStatus(UUID userId) {
        List<ProfileVerification> verifications = verificationRepository.findByUserId(userId);

        return VerificationStatusResponse.builder()
            .verifications(verifications.stream()
                .map(this::mapToVerificationStatus)
                .collect(Collectors.toList()))
            .build();
    }

    public void reviewVerification(UUID verificationId, String status, String notes, UUID reviewerId) {
        ProfileVerification verification = verificationRepository.findById(verificationId)
            .orElseThrow(() -> new VerificationNotFoundException("Verification not found"));

        verification.setStatus(status);
        verification.setReviewNotes(notes);
        verification.setReviewedBy(reviewerId);
        verification.setReviewedAt(LocalDateTime.now());

        verificationRepository.save(verification);

        // Update user profile verification status
        updateUserVerificationStatus(verification.getUserId(), status);

        // Send notification
        sendVerificationNotification(verification);
    }
}
```

## 🛡️ Security Best Practices

### Data Security

- **Personal Data Protection**: Secure personal information
- **Privacy Controls**: Granular privacy settings
- **Data Encryption**: Encrypt sensitive data
- **Access Control**: Strict access control for profiles

### Privacy Protection

- **GDPR Compliance**: Ensure data privacy compliance
- **Data Minimization**: Collect only necessary data
- **User Consent**: Respect user consent
- **Data Retention**: Follow data retention policies

### API Security

- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Strong authentication mechanisms
- **Authorization**: Role-based access control

## 📞 Troubleshooting

### Common Issues

1. **Profile Creation Failures**: Check data validation
2. **Privacy Issues**: Verify privacy settings
3. **Verification Failures**: Check document validation
4. **gRPC Connection Issues**: Verify service endpoints
5. **Performance Issues**: Monitor cache hit rates

### Debug Commands

```bash
# Check service health
curl http://user-profile:8086/actuator/health

# Check gRPC health
grpc_health_probe -addr=user-profile:50059

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check S3 connectivity
aws s3 ls s3://user-profiles

# Monitor profile events
kafka-console-consumer --bootstrap-server kafka:9092 --topic profile-events

# Check search index
curl http://localhost:9200/profiles/_search?q=test
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **Booking Service**: Booking history integration
- **Analytics Service**: Profile analytics data

### Infrastructure

- **PostgreSQL**: User profile data storage
- **Redis**: Caching and session management
- **Kafka**: Event streaming
- **Elasticsearch**: Search functionality
- **S3**: Media storage
- **Protocol Buffers**: Message serialization

### External APIs

- **Email Service**: Profile notifications
- **Storage Service**: File storage
- **Search Service**: Advanced search capabilities
