# Realtime Service (Node.js)

**Language:** Node.js

**Why Node.js?**

- WebSocket, real-time, pub/sub
- Fast push, easy integration with frontend

## Overview

The Realtime Service provides real-time communication capabilities for the booking system using WebSocket connections. It handles live updates for ticket availability, booking confirmations, payment status, and user notifications. The service uses Redis Pub/Sub for scalable message distribution.

## 🎯 Responsibilities

- **WebSocket Management**: Handle WebSocket connections and lifecycle
- **Real-time Updates**: Push live updates to connected clients
- **Event Broadcasting**: Distribute events across multiple instances
- **Connection Scaling**: Scale WebSocket connections horizontally
- **Message Routing**: Route messages to appropriate clients
- **Presence Management**: Track user online status
- **Room Management**: Manage event-specific chat rooms
- **Redis Pub/Sub**: Subscribe to events from other services

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Socket.io for WebSocket management
- **Cache**: Redis (Pub/Sub, session storage)
- **Message Queue**: Redis Pub/Sub for event distribution
- **Load Balancer**: Sticky sessions for WebSocket connections
- **Monitoring**: Prometheus + Grafana
- **Authentication**: JWT token validation

### Key Components

```
Realtime Service
├── WebSocket Server
├── Connection Manager
├── Event Subscriber
├── Message Router
├── Presence Manager
├── Room Manager
├── Authentication Middleware
├── Rate Limiter
└── Health Checker
```

## 🔄 Real-time Flow

### Connection Flow

```
Client WebSocket Connection
    ↓
Authentication (JWT)
    ↓
Connection Establishment
    ↓
User Session Creation
    ↓
Join Default Rooms
    ↓
Send Connection Confirmation
    ↓
Subscribe to User Events
```

### Event Broadcasting Flow

```
Service Event (Redis Pub/Sub)
    ↓
Event Subscriber
    ↓
Message Processing
    ↓
Target Client Identification
    ↓
Message Routing
    ↓
WebSocket Message Send
    ↓
Delivery Confirmation
```

### Room Management Flow

```
User Joins Event Room
    ↓
Room Validation
    ↓
Permission Check
    ↓
Room Join
    ↓
Presence Update
    ↓
Room Notification
    ↓
Event Subscription
```

## 📡 WebSocket Events

### Client to Server Events

```javascript
// Connection events
"socket:connect"; // Client connects
"socket:disconnect"; // Client disconnects
"socket:reconnect"; // Client reconnects

// Authentication events
"auth:login"; // User login
"auth:logout"; // User logout
"auth:token_refresh"; // Token refresh

// Room events
"room:join"; // Join a room
"room:leave"; // Leave a room
"room:message"; // Send room message

// User events
"user:typing"; // User typing indicator
"user:presence"; // Update presence status
"user:preferences"; // Update user preferences
```

### Server to Client Events

```javascript
// System events
"system:connected"; // Connection confirmed
"system:error"; // Error message
"system:maintenance"; // Maintenance notification

// Booking events
"booking:created"; // New booking created
"booking:confirmed"; // Booking confirmed
"booking:cancelled"; // Booking cancelled
"booking:updated"; // Booking updated

// Payment events
"payment:processed"; // Payment processed
"payment:failed"; // Payment failed
"payment:refunded"; // Payment refunded

// Ticket events
"ticket:available"; // Ticket available
"ticket:sold"; // Ticket sold
"ticket:reserved"; // Ticket reserved
"ticket:released"; // Ticket released

// Notification events
"notification:new"; // New notification
"notification:read"; // Notification read
"notification:deleted"; // Notification deleted

// Room events
"room:joined"; // Successfully joined room
"room:left"; // Successfully left room
"room:message"; // Room message received
"room:user_joined"; // User joined room
"room:user_left"; // User left room
"room:typing"; // User typing in room
```

## 🔐 Security Features

### Authentication & Authorization

- **JWT Validation**: Validate tokens on connection
- **Token Refresh**: Automatic token refresh handling
- **Connection Limits**: Limit connections per user
- **Rate Limiting**: Prevent message flooding

### Connection Security

- **CORS Configuration**: Secure cross-origin requests
- **Origin Validation**: Validate connection origins
- **SSL/TLS**: Secure WebSocket connections
- **Session Management**: Secure session handling

### Message Security

- **Input Validation**: Validate all incoming messages
- **Message Size Limits**: Prevent large message attacks
- **Content Filtering**: Filter inappropriate content
- **Spam Prevention**: Prevent message spam

## 📊 Redis Pub/Sub Channels

### Event Channels

```javascript
// Booking events
"booking:created"; // New booking
"booking:confirmed"; // Booking confirmed
"booking:cancelled"; // Booking cancelled
"booking:updated"; // Booking updated

// Payment events
"payment:processed"; // Payment processed
"payment:failed"; // Payment failed
"payment:refunded"; // Payment refunded

// Ticket events
"ticket:available"; // Ticket available
"ticket:sold"; // Ticket sold
"ticket:reserved"; // Ticket reserved
"ticket:released"; // Ticket released

// User events
"user:online"; // User came online
"user:offline"; // User went offline
"user:status_change"; // User status changed

// System events
"system:maintenance"; // System maintenance
"system:announcement"; // System announcement
"system:error"; // System error
```

### Channel Structure

```javascript
// Event channel format
`${service}:${action}` // User-specific channel format
`user:${userId}:${event}` // Event-specific channel format
`event:${eventId}:${action}` // Room-specific channel format
`room:${roomId}:${action}`;
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3003
NODE_ENV=production

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=3

# WebSocket Configuration
WS_PATH=/socket.io
WS_CORS_ORIGIN=https://yourdomain.com
WS_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
WS_MAX_CONNECTIONS=10000
WS_CONNECTION_TIMEOUT=30000
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000

# Authentication Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
TOKEN_REFRESH_THRESHOLD=300000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_MESSAGES=100
RATE_LIMIT_MAX_CONNECTIONS=5

# Room Configuration
MAX_ROOM_MEMBERS=1000
ROOM_MESSAGE_HISTORY=100
ROOM_TYPING_TIMEOUT=3000

# Presence Configuration
PRESENCE_TIMEOUT=300000
PRESENCE_INTERVAL=60000
PRESENCE_CLEANUP_INTERVAL=300000

# Monitoring Configuration
METRICS_PORT=9090
HEALTH_CHECK_PORT=8080
```

## 🚀 Performance Optimizations

### Connection Optimization

- **Connection Pooling**: Reuse Redis connections
- **Message Batching**: Batch multiple messages
- **Compression**: Enable message compression
- **Keep-Alive**: Maintain persistent connections

### Scaling Strategy

- **Horizontal Scaling**: Multiple service instances
- **Load Balancing**: Sticky session load balancing
- **Redis Clustering**: Redis cluster for high availability
- **Message Partitioning**: Partition messages by user/event

### Memory Optimization

- **Connection Limits**: Limit connections per instance
- **Message Cleanup**: Clean up old messages
- **Session Cleanup**: Clean up expired sessions
- **Memory Monitoring**: Monitor memory usage

## 📊 Monitoring & Observability

### Metrics

- **Connection Count**: Active WebSocket connections
- **Message Rate**: Messages per second
- **Event Processing**: Event processing rate
- **Room Activity**: Active rooms and members
- **Error Rates**: Connection and message errors
- **Latency**: Message delivery latency

### Logging

- **Connection Logs**: Connection events
- **Message Logs**: Message processing
- **Error Logs**: Errors and failures
- **Performance Logs**: Slow operations
- **Security Logs**: Authentication and authorization

### Health Checks

- **Service Health**: Service availability
- **Redis Health**: Redis connectivity
- **Connection Health**: WebSocket connection health
- **Memory Health**: Memory usage monitoring

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### WebSocket Tests

```bash
npm run test:websocket
```

### Load Tests

```bash
npm run test:load
```

### Connection Tests

```bash
npm run test:connection
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3003 9090 8080
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: realtime-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: realtime-service
  template:
    metadata:
      labels:
        app: realtime-service
    spec:
      containers:
        - name: realtime
          image: booking-system/realtime-service:latest
          ports:
            - containerPort: 3003
            - containerPort: 9090
            - containerPort: 8080
          env:
            - name: REDIS_URL
              value: "redis://redis-service:6379"
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: auth-secrets
                  key: jwt-secret
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

### Load Balancer Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: realtime-service
spec:
  selector:
    app: realtime-service
  ports:
    - port: 3003
      targetPort: 3003
      protocol: TCP
  type: LoadBalancer
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

## 🔄 WebSocket Implementation

### Connection Management

```javascript
class ConnectionManager {
  constructor() {
    this.io = new Server(server, {
      path: process.env.WS_PATH,
      cors: {
        origin: process.env.WS_ALLOWED_ORIGINS.split(","),
        credentials: true,
      },
      maxHttpBufferSize: 1e6,
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT),
      pingInterval: parseInt(process.env.WS_PING_INTERVAL),
    });

    this.connections = new Map();
    this.rooms = new Map();
    this.presence = new PresenceManager();
  }

  async handleConnection(socket) {
    try {
      // Authenticate connection
      const user = await this.authenticateSocket(socket);
      if (!user) {
        socket.disconnect();
        return;
      }

      // Store connection
      this.connections.set(socket.id, {
        socket,
        user,
        rooms: new Set(),
        connectedAt: Date.now(),
      });

      // Join user to default rooms
      await this.joinDefaultRooms(socket, user);

      // Update presence
      await this.presence.userOnline(user.id);

      // Send connection confirmation
      socket.emit("system:connected", {
        userId: user.id,
        timestamp: Date.now(),
      });

      // Handle disconnection
      socket.on("disconnect", () => this.handleDisconnection(socket));
    } catch (error) {
      console.error("Connection error:", error);
      socket.disconnect();
    }
  }

  async authenticateSocket(socket) {
    const token = socket.handshake.auth.token;
    if (!token) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
```

### Event Broadcasting

```javascript
class EventBroadcaster {
  constructor(redis, connectionManager) {
    this.redis = redis;
    this.connectionManager = connectionManager;
    this.subscribers = new Map();
  }

  async start() {
    // Subscribe to Redis channels
    const channels = [
      "booking:*",
      "payment:*",
      "ticket:*",
      "user:*",
      "system:*",
    ];

    for (const channel of channels) {
      const subscriber = this.redis.duplicate();
      await subscriber.subscribe(channel);

      subscriber.on("message", (channel, message) => {
        this.handleEvent(channel, JSON.parse(message));
      });

      this.subscribers.set(channel, subscriber);
    }
  }

  async handleEvent(channel, event) {
    try {
      const [service, action] = channel.split(":");

      switch (service) {
        case "booking":
          await this.broadcastBookingEvent(action, event);
          break;
        case "payment":
          await this.broadcastPaymentEvent(action, event);
          break;
        case "ticket":
          await this.broadcastTicketEvent(action, event);
          break;
        case "user":
          await this.broadcastUserEvent(action, event);
          break;
        case "system":
          await this.broadcastSystemEvent(action, event);
          break;
      }
    } catch (error) {
      console.error("Event handling error:", error);
    }
  }

  async broadcastBookingEvent(action, event) {
    const eventName = `booking:${action}`;

    // Broadcast to all users
    this.connectionManager.io.emit(eventName, {
      ...event,
      timestamp: Date.now(),
    });

    // Send to specific user if applicable
    if (event.userId) {
      const userSocket = this.connectionManager.getUserSocket(event.userId);
      if (userSocket) {
        userSocket.emit(eventName, {
          ...event,
          timestamp: Date.now(),
        });
      }
    }
  }
}
```

## 🆕 Integration with Booking Worker Service (Go)

The **Booking Worker Service** (written in Go) leverages Go's concurrency for real-time queue updates:

- **Goroutines**: Efficiently handle thousands of concurrent queue updates.
- **gRPC & WebSocket**: Booking Worker (Go) sends queue events to Realtime Service for client notification.

### Real-time Booking Queue Flow

1. **Client joins queue** → 2. **Realtime Service notifies position** → 3. **Booking Worker processes request** → 4. **Realtime Service notifies client to proceed**

---

## 🛡️ Security Best Practices

### Connection Security

- **Authentication**: Validate all connections
- **Origin Validation**: Check connection origins
- **Rate Limiting**: Limit connection attempts
- **Session Management**: Secure session handling

### Message Security

- **Input Validation**: Validate all messages
- **Content Filtering**: Filter inappropriate content
- **Size Limits**: Limit message sizes
- **Spam Prevention**: Prevent message spam

### Infrastructure Security

- **SSL/TLS**: Secure all connections
- **Firewall Rules**: Restrict access
- **Monitoring**: Monitor for attacks
- **Backup**: Regular data backups

## 📞 Troubleshooting

### Common Issues

1. **Connection Drops**: Check network stability
2. **High Memory Usage**: Monitor connection limits
3. **Redis Connectivity**: Verify Redis service health
4. **Authentication Failures**: Check JWT configuration
5. **Load Balancer Issues**: Verify sticky sessions

### Debug Commands

```bash
# Check service health
curl http://realtime-service:8080/health

# Check Redis connectivity
redis-cli ping

# Monitor WebSocket connections
netstat -an | grep :3003

# Check memory usage
docker stats realtime-service

# Monitor Redis Pub/Sub
redis-cli monitor
```

## 🔗 Dependencies

### External Services

- **Auth Service**: User authentication and token validation
- **Redis**: Pub/Sub messaging and session storage
- **Load Balancer**: Connection distribution

### Infrastructure

- **Redis**: Pub/Sub messaging
- **Load Balancer**: WebSocket connection distribution
- **Monitoring**: Prometheus and Grafana
