# Support Service (Node.js)

**Language:** Node.js

**Why Node.js?**

- Ticket, chat, knowledge base
- Easy WebSocket integration, rapid development

## Overview

The Support Service is responsible for managing customer support tickets, live chat, knowledge base, and customer service operations. It handles ticket creation, escalation, resolution tracking, and provides comprehensive customer support with real-time communication and automated responses.

## 🎯 Responsibilities

- **Ticket Management**: CRUD operations for support tickets
- **Live Chat**: Real-time customer support chat
- **Knowledge Base**: Manage help articles and FAQs
- **Ticket Escalation**: Handle ticket escalation workflows
- **Response Automation**: Automated ticket responses
- **Customer Feedback**: Collect and manage feedback
- **Support Analytics**: Track support metrics
- **gRPC Communication**: Inter-service communication

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Java 17+
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL (tickets, knowledge base)
- **Cache**: Redis (chat sessions, ticket cache)
- **Message Queue**: Kafka (ticket events, notifications)
- **gRPC**: grpc-java for inter-service communication
- **WebSocket**: Real-time chat communication
- **Search**: Elasticsearch (knowledge base search)
- **Monitoring**: Micrometer + Prometheus

### Key Components

```
Support Service
├── Ticket Manager
├── Chat Manager
├── Knowledge Base Manager
├── Escalation Manager
├── Automation Engine
├── Feedback Manager
├── Analytics Engine
├── gRPC Server/Client
└── WebSocket Handler
```

## 🔄 Support Flow

### Ticket Creation Flow

```
Customer Request
    ↓
Ticket Creation
    ↓
Category Assignment
    ↓
Priority Calculation
    ↓
Agent Assignment
    ↓
Initial Response
    ↓
Status Tracking
    ↓
Resolution
    ↓
Feedback Collection
```

### Live Chat Flow

```
Customer Initiation
    ↓
Queue Assignment
    ↓
Agent Matching
    ↓
Chat Session Start
    ↓
Real-time Communication
    ↓
Issue Resolution
    ↓
Session End
    ↓
Transcript Storage
```

### Escalation Flow

```
Escalation Trigger
    ↓
Priority Increase
    ↓
Supervisor Notification
    ↓
Agent Reassignment
    ↓
Enhanced Response
    ↓
Resolution Tracking
    ↓
Escalation Closure
```

## 📡 API Endpoints

### REST API

```http
# Ticket Management
GET    /api/v1/tickets                      # List tickets
GET    /api/v1/tickets/{id}                 # Get ticket by ID
POST   /api/v1/tickets                      # Create ticket
PUT    /api/v1/tickets/{id}                 # Update ticket
DELETE /api/v1/tickets/{id}                 # Delete ticket
PATCH  /api/v1/tickets/{id}/status          # Update ticket status
POST   /api/v1/tickets/{id}/escalate        # Escalate ticket

# Live Chat
GET    /api/v1/chat/sessions                # List chat sessions
GET    /api/v1/chat/sessions/{id}           # Get chat session
POST   /api/v1/chat/sessions                # Create chat session
PUT    /api/v1/chat/sessions/{id}           # Update chat session
POST   /api/v1/chat/sessions/{id}/messages  # Send message
GET    /api/v1/chat/sessions/{id}/messages  # Get messages

# Knowledge Base
GET    /api/v1/kb/articles                  # List articles
GET    /api/v1/kb/articles/{id}             # Get article by ID
POST   /api/v1/kb/articles                  # Create article
PUT    /api/v1/kb/articles/{id}             # Update article
DELETE /api/v1/kb/articles/{id}             # Delete article
GET    /api/v1/kb/search                     # Search articles

# Feedback
GET    /api/v1/feedback                     # List feedback
GET    /api/v1/feedback/{id}                # Get feedback by ID
POST   /api/v1/feedback                     # Create feedback
PUT    /api/v1/feedback/{id}                # Update feedback
GET    /api/v1/feedback/analytics           # Get feedback analytics

# Support Analytics
GET    /api/v1/analytics/tickets            # Get ticket analytics
GET    /api/v1/analytics/chat               # Get chat analytics
GET    /api/v1/analytics/response-time      # Get response time analytics
GET    /api/v1/analytics/satisfaction       # Get satisfaction analytics
```

### gRPC Services

```protobuf
service SupportService {
  rpc CreateTicket(CreateTicketRequest) returns (TicketResponse);
  rpc GetTicket(GetTicketRequest) returns (TicketResponse);
  rpc UpdateTicket(UpdateTicketRequest) returns (TicketResponse);
  rpc DeleteTicket(DeleteTicketRequest) returns (DeleteTicketResponse);
  rpc ListTickets(ListTicketsRequest) returns (ListTicketsResponse);
  rpc EscalateTicket(EscalateTicketRequest) returns (EscalateTicketResponse);

  rpc CreateChatSession(CreateChatSessionRequest) returns (ChatSessionResponse);
  rpc GetChatSession(GetChatSessionRequest) returns (ChatSessionResponse);
  rpc SendMessage(SendMessageRequest) returns (SendMessageResponse);
  rpc GetMessages(GetMessagesRequest) returns (GetMessagesResponse);

  rpc CreateArticle(CreateArticleRequest) returns (ArticleResponse);
  rpc GetArticle(GetArticleRequest) returns (ArticleResponse);
  rpc UpdateArticle(UpdateArticleRequest) returns (ArticleResponse);
  rpc DeleteArticle(DeleteArticleRequest) returns (DeleteArticleResponse);
  rpc SearchArticles(SearchArticlesRequest) returns (SearchArticlesResponse);

  rpc CreateFeedback(CreateFeedbackRequest) returns (FeedbackResponse);
  rpc GetFeedback(GetFeedbackRequest) returns (FeedbackResponse);
  rpc GetFeedbackAnalytics(GetFeedbackAnalyticsRequest) returns (FeedbackAnalyticsResponse);

  rpc GetSupportAnalytics(GetSupportAnalyticsRequest) returns (SupportAnalyticsResponse);
}

service SupportEventService {
  rpc PublishSupportEvent(SupportEvent) returns (EventResponse);
  rpc SubscribeToSupportEvents(SubscribeRequest) returns (stream SupportEvent);
}

service ChatService {
  rpc StreamChat(stream ChatMessage) returns (stream ChatMessage);
}
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate JWT tokens from Auth Service
- **Role-Based Access**: Different access levels for support
- **Agent Permissions**: Agents can only access assigned tickets
- **Customer Access**: Customers can only access their own tickets

### Data Protection

- **Ticket Data Encryption**: Encrypt sensitive ticket data
- **Chat Privacy**: Secure chat communications
- **Audit Logging**: Log all support operations
- **Data Validation**: Validate all support data

### API Security

- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Validate all input data
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize user inputs

## 📊 Database Schema

### Support Tickets Table

```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    escalation_level INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ticket Messages Table

```sql
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    attachments JSONB,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Sessions Table

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    queue_position INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    satisfaction_rating INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Messages Table

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Knowledge Base Articles Table

```sql
CREATE TABLE kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[],
    author_id UUID REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Feedback Table

```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id),
    customer_id UUID REFERENCES users(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    category VARCHAR(50),
    sentiment_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Support Agents Table

```sql
CREATE TABLE support_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    skills TEXT[],
    max_tickets INTEGER DEFAULT 10,
    current_tickets INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    performance_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Escalation Rules Table

```sql
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
SERVER_PORT=8088
SPRING_PROFILES_ACTIVE=production

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/support_service_db
SPRING_DATASOURCE_USERNAME=support_service_user
SPRING_DATASOURCE_PASSWORD=support_service_password
SPRING_JPA_HIBERNATE_DDL_AUTO=validate

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=11

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_SUPPORT_EVENTS=support-events
KAFKA_TOPIC_TICKET_EVENTS=ticket-events
KAFKA_TOPIC_CHAT_EVENTS=chat-events
KAFKA_GROUP_ID=support-service

# gRPC Configuration
GRPC_SERVER_PORT=50061
GRPC_AUTH_SERVICE_URL=auth-service:50051
GRPC_USER_SERVICE_URL=user-service:50056
GRPC_BOOKING_SERVICE_URL=booking-service:50053
GRPC_EMAIL_SERVICE_URL=email-worker:8082
GRPC_MAX_RECEIVE_MESSAGE_SIZE=4194304
GRPC_MAX_SEND_MESSAGE_SIZE=4194304
GRPC_KEEPALIVE_TIME_MS=30000
GRPC_KEEPALIVE_TIMEOUT_MS=5000

# WebSocket Configuration
WEBSOCKET_ENDPOINT=/ws/chat
WEBSOCKET_MAX_SESSIONS=1000
WEBSOCKET_HEARTBEAT_INTERVAL=30000

# Elasticsearch Configuration
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password
ELASTICSEARCH_INDEX_ARTICLES=kb-articles

# Email Configuration
EMAIL_SERVICE_URL=http://email-worker:8082
EMAIL_TEMPLATE_TICKET_CREATED=ticket-created
EMAIL_TEMPLATE_TICKET_UPDATED=ticket-updated
EMAIL_TEMPLATE_TICKET_RESOLVED=ticket-resolved

# Support Configuration
TICKET_AUTO_ASSIGNMENT=true
TICKET_ESCALATION_TIMEOUT_HOURS=24
CHAT_QUEUE_TIMEOUT_MINUTES=5
MAX_TICKETS_PER_AGENT=15
AUTO_RESPONSE_ENABLED=true

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=3600
RATE_LIMIT_REQUESTS_PER_MINUTE=100
CHAT_RATE_LIMIT_MESSAGES_PER_MINUTE=30
```

## 🚀 Performance Optimizations

### gRPC Benefits

- **Protocol Buffers**: 3-10x smaller payload size
- **HTTP/2**: Multiplexing and compression
- **Connection Reuse**: Persistent connections
- **Bidirectional Streaming**: Real-time communication
- **Code Generation**: Type-safe client/server code

### Caching Strategy

- **Ticket Cache**: Cache frequently accessed tickets
- **Chat Cache**: Cache active chat sessions
- **Knowledge Cache**: Cache knowledge base articles
- **Agent Cache**: Cache agent availability

### Database Optimization

- **Indexing**: Optimize database indexes
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimize complex queries
- **Partitioning**: Partition large tables

### WebSocket Optimization

- **Connection Pooling**: Efficient WebSocket connections
- **Message Batching**: Batch chat messages
- **Heartbeat Management**: Efficient heartbeat handling
- **Load Balancing**: Distribute WebSocket connections

## 📊 Monitoring & Observability

### Metrics

- **Ticket Creation Rate**: Tickets created per minute
- **Chat Session Rate**: Chat sessions per minute
- **Response Time**: Average response time
- **Resolution Rate**: Ticket resolution rate
- **Satisfaction Score**: Customer satisfaction metrics
- **API Response Time**: Average API response time
- **Error Rate**: Error percentage by endpoint
- **gRPC Metrics**: Request/response counts, latency

### Logging

- **Ticket Logs**: All ticket operations
- **Chat Logs**: Chat session activities
- **Knowledge Logs**: Knowledge base activities
- **Escalation Logs**: Escalation activities
- **Error Logs**: Error details and stack traces
- **gRPC Logs**: Inter-service communication logs

### Health Checks

- **Database Health**: Connection and query health
- **Redis Health**: Cache connectivity
- **Kafka Health**: Message queue connectivity
- **WebSocket Health**: WebSocket service health
- **Elasticsearch Health**: Search service health
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

### WebSocket Tests

```bash
./mvnw test -Dtest=WebSocketTest
```

### Chat Tests

```bash
./mvnw test -Dtest=ChatTest
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

EXPOSE 8088 50061

CMD ["java", "-jar", "target/support-service.jar"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: support-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: support-service
  template:
    metadata:
      labels:
        app: support-service
    spec:
      containers:
        - name: support-service
          image: booking-system/support-service:latest
          ports:
            - containerPort: 8088
            - containerPort: 50061
          env:
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: support-service-secrets
                  key: database-url
            - name: REDIS_HOST
              value: "redis-service"
            - name: KAFKA_BOOTSTRAP_SERVERS
              value: "kafka-service:9092"
            - name: ELASTICSEARCH_HOST
              value: "elasticsearch-service"
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
```

## 🔄 Service Implementation

### Ticket Controller

```java
@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@RequestBody CreateTicketRequest request) {
        TicketResponse response = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable UUID id) {
        TicketResponse response = ticketService.getTicket(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<EscalateTicketResponse> escalateTicket(@PathVariable UUID id) {
        EscalateTicketResponse response = ticketService.escalateTicket(id);
        return ResponseEntity.ok(response);
    }
}
```

### gRPC Server

```java
@GrpcService
public class SupportGrpcService extends SupportServiceGrpc.SupportServiceImplBase {

    @Autowired
    private TicketService ticketService;

    @Override
    public void createTicket(CreateTicketRequest request,
                           StreamObserver<TicketResponse> responseObserver) {
        try {
            TicketResponse response = ticketService.createTicket(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.INTERNAL
                .withDescription("Failed to create ticket: " + e.getMessage())
                .asRuntimeException());
        }
    }

    @Override
    public void getTicket(GetTicketRequest request,
                         StreamObserver<TicketResponse> responseObserver) {
        try {
            TicketResponse response = ticketService.getTicket(request.getId());
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(Status.NOT_FOUND
                .withDescription("Ticket not found: " + e.getMessage())
                .asRuntimeException());
        }
    }
}
```

### Chat Service

```java
@Service
public class ChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private AgentService agentService;

    public ChatSessionResponse createChatSession(CreateChatSessionRequest request) {
        // Find available agent
        SupportAgent agent = agentService.findAvailableAgent();

        if (agent == null) {
            // No agents available, add to queue
            return createQueuedSession(request);
        }

        // Create active session
        ChatSession session = ChatSession.builder()
            .sessionId(generateSessionId())
            .customerId(request.getCustomerId())
            .agentId(agent.getId())
            .status("active")
            .startedAt(LocalDateTime.now())
            .build();

        chatSessionRepository.save(session);

        // Update agent status
        agentService.assignChatToAgent(agent.getId(), session.getId());

        return ChatSessionResponse.builder()
            .sessionId(session.getSessionId())
            .agentId(agent.getId())
            .status(session.getStatus())
            .build();
    }

    public SendMessageResponse sendMessage(SendMessageRequest request) {
        ChatSession session = chatSessionRepository.findBySessionId(request.getSessionId())
            .orElseThrow(() -> new ChatSessionNotFoundException("Chat session not found"));

        ChatMessage message = ChatMessage.builder()
            .sessionId(session.getId())
            .senderId(request.getSenderId())
            .senderType(request.getSenderType())
            .message(request.getMessage())
            .messageType(request.getMessageType())
            .createdAt(LocalDateTime.now())
            .build();

        chatMessageRepository.save(message);

        // Send real-time message via WebSocket
        webSocketService.sendMessage(session.getSessionId(), message);

        return SendMessageResponse.builder()
            .messageId(message.getId())
            .timestamp(message.getCreatedAt())
            .build();
    }
}
```

### Escalation Service

```java
@Service
public class EscalationService {

    @Autowired
    private EscalationRuleRepository ruleRepository;

    @Autowired
    private AgentService agentService;

    public void checkEscalation(UUID ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));

        // Get applicable escalation rules
        List<EscalationRule> rules = ruleRepository.findByConditions(ticket.getCategory(), ticket.getPriority());

        for (EscalationRule rule : rules) {
            if (shouldEscalate(ticket, rule)) {
                escalateTicket(ticket, rule);
            }
        }
    }

    private boolean shouldEscalate(SupportTicket ticket, EscalationRule rule) {
        // Check if ticket meets escalation conditions
        long hoursSinceCreation = Duration.between(ticket.getCreatedAt(), LocalDateTime.now()).toHours();

        return hoursSinceCreation >= rule.getEscalationTimeoutHours() &&
               ticket.getEscalationLevel() < rule.getMaxEscalationLevel();
    }

    private void escalateTicket(SupportTicket ticket, EscalationRule rule) {
        // Increase escalation level
        ticket.setEscalationLevel(ticket.getEscalationLevel() + 1);
        ticket.setPriority(rule.getNewPriority());

        // Reassign to supervisor or specialized agent
        SupportAgent supervisor = agentService.findSupervisor(ticket.getCategory());
        if (supervisor != null) {
            ticket.setAgentId(supervisor.getId());
        }

        ticketRepository.save(ticket);

        // Send escalation notification
        notificationService.sendEscalationNotification(ticket);
    }
}
```

## 🛡️ Security Best Practices

### Data Security

- **Ticket Data Protection**: Secure ticket information
- **Chat Privacy**: Secure chat communications
- **Access Control**: Strict access control for tickets
- **Audit Trail**: Complete audit trail for all operations

### Privacy Protection

- **Personal Data Protection**: Protect customer data
- **Chat Privacy**: Control chat access permissions
- **Data Retention**: Follow data retention policies
- **Consent Management**: Respect user consent

### API Security

- **Input Validation**: Validate all input parameters
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Strong authentication mechanisms
- **Authorization**: Role-based access control

## 📞 Troubleshooting

### Common Issues

1. **Ticket Creation Failures**: Check agent availability
2. **Chat Issues**: Verify WebSocket connectivity
3. **Escalation Failures**: Check escalation rules
4. **gRPC Connection Issues**: Verify service endpoints
5. **Performance Issues**: Monitor cache hit rates

### Debug Commands

```bash
# Check service health
curl http://support-service:8088/actuator/health

# Check gRPC health
grpc_health_probe -addr=support-service:50061

# Check WebSocket connections
netstat -an | grep :8088

# Monitor support events
kafka-console-consumer --bootstrap-server kafka:9092 --topic support-events

# Check Elasticsearch
curl http://localhost:9200/_cluster/health
```

## 🔗 Dependencies

### External Services (gRPC)

- **Auth Service**: User authentication and authorization
- **User Service**: User profile information
- **Booking Service**: Booking-related support
- **Email Service**: Support notifications

### Infrastructure

- **PostgreSQL**: Support data storage
- **Redis**: Caching and session management
- **Kafka**: Event streaming
- **Elasticsearch**: Knowledge base search
- **WebSocket**: Real-time chat
- **Protocol Buffers**: Message serialization

### External APIs

- **Email Service**: Support notifications
- **Notification Service**: Real-time notifications
- **Analytics Service**: Support analytics
