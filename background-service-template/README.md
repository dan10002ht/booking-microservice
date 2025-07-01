# Background Service Template

A clean, production-ready background service template with best practices for job processing, queue management, and error handling.

## 🎯 Features

- **Fire and forget operations** - Execute tasks immediately in background
- **Queue-based job processing** - Redis-backed job queues with priorities
- **Retry mechanisms** - Exponential backoff with jitter
- **Dead letter queue** - Handle permanently failed jobs
- **Priority-based processing** - High, normal, low priority queues
- **Circuit breaker pattern** - Prevent cascade failures
- **Metrics and monitoring** - Built-in performance tracking
- **Graceful shutdown** - Clean service termination
- **Error handling** - Comprehensive error management
- **Middleware support** - Extensible job processing pipeline

## 🏗️ Architecture

```
Background Service
├── Redis Queue (Priority-based)
├── Worker Processes (Multiple per priority)
├── Job Handlers (Business logic)
├── Circuit Breakers (Failure protection)
├── Dead Letter Queue (Failed jobs)
├── Metrics Collection (Performance monitoring)
└── Graceful Shutdown (Clean termination)
```

## 📦 Installation

```bash
# Clone or copy the template
cd background-service-template

# Install dependencies
npm install

# Start Redis (required)
# Make sure Redis is running on localhost:6379
# Or set REDIS_HOST, REDIS_PORT environment variables
```

## 🚀 Quick Start

### 1. Basic Usage

```javascript
import { getBackgroundService } from "./backgroundService.js";
import { registerExampleHandlers } from "./exampleHandlers.js";

// Initialize the service
const backgroundService = getBackgroundService();
await backgroundService.initialize();

// Register job handlers
registerExampleHandlers(backgroundService);

// Fire and forget operation
await backgroundService.fireAndForget(
  async (data) => {
    console.log("Processing:", data);
    // Your business logic here
  },
  { message: "Hello World!" }
);

// Enqueue a job
const job = await backgroundService.enqueueJob(
  "hello-world",
  {
    message: "Hello from queue!",
  },
  { priority: "high" }
);

console.log("Job enqueued:", job.jobId);
```

### 2. Run the Test

```bash
# Run the comprehensive test
npm test

# Or run directly
node test.js
```

## 📋 Usage Instructions

### 1. **Fire and Forget Operations**

For immediate background execution without queuing:

```javascript
// Simple fire and forget
await backgroundService.fireAndForget(
  async (data) => {
    // Your logic here
    await sendEmail(data.recipient, data.message);
  },
  { recipient: "user@example.com", message: "Welcome!" },
  { priority: "high" }
);
```

### 2. **Queue-based Job Processing**

For reliable, retryable background jobs:

```javascript
// Enqueue a job
const job = await backgroundService.enqueueJob(
  "send-email",
  {
    recipient: "user@example.com",
    template: "welcome",
    data: { name: "John" },
  },
  {
    priority: "normal",
    retries: 3,
    timeout: 30000,
    delay: 5000, // Delay execution by 5 seconds
  }
);

// Check job status
const status = backgroundService.getJobStatus(job.jobId);
console.log("Job status:", status);
```

### 3. **Register Custom Job Handlers**

```javascript
// Define your job handler
async function sendEmailHandler(data, job) {
  logger.info(`Processing email job ${job.id}`, data);

  try {
    // Your email sending logic
    await emailService.send(data.recipient, data.template, data.data);

    return { success: true, messageId: "email_123" };
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error; // Will trigger retry mechanism
  }
}

// Register the handler
backgroundService.registerHandler("send-email", sendEmailHandler);
```

### 4. **Add Middleware**

```javascript
// Logging middleware
backgroundService.use(async (job, data) => {
  logger.info(`Processing job ${job.id} of type ${job.type}`);
  return data;
});

// Validation middleware
backgroundService.use(async (job, data) => {
  if (!data.recipient) {
    throw new Error("Recipient is required");
  }
  return data;
});
```

### 5. **Monitor Service Health**

```javascript
// Get service health
const health = await backgroundService.getHealth();
console.log("Service health:", health);

// Health response includes:
// - Redis connection status
// - Active job count
// - Circuit breaker status
// - Performance metrics
```

## 🔧 Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_BG_DB=6

# Service Configuration
LOG_LEVEL=info
```

### Custom Configuration

```javascript
const config = {
  redis: {
    host: "redis.example.com",
    port: 6379,
    password: "your_password",
    db: 6,
  },
  job: {
    defaultRetries: 5,
    defaultTimeout: 60000,
    retryDelay: 10000,
    maxRetryDelay: 300000,
  },
  circuitBreaker: {
    failureThreshold: 10,
    recoveryTimeout: 120000,
  },
};

const backgroundService = getBackgroundService(config);
```

## 📊 Job Priorities

- **High Priority**: 3 workers, processed first
- **Normal Priority**: 2 workers, processed second
- **Low Priority**: 1 worker, processed last

## 🔄 Retry Mechanism

- **Exponential Backoff**: Delay increases with each retry
- **Jitter**: Random delay variation to prevent thundering herd
- **Max Retries**: Configurable retry limit per job
- **Dead Letter Queue**: Failed jobs moved to DLQ after max retries

## 🛡️ Circuit Breaker

- **Failure Threshold**: Number of failures before opening
- **Recovery Timeout**: Time to wait before attempting recovery
- **Half-Open State**: Test if service has recovered
- **Automatic Reset**: Circuit closes on successful operations

## 📈 Metrics

The service automatically collects:

- Jobs processed per second
- Job failure rate
- Average processing time
- Queue lengths by priority
- Retry counts
- Circuit breaker status

## 🚨 Error Handling

- **Job Failures**: Automatic retry with exponential backoff
- **Timeout Handling**: Jobs timeout after configured duration
- **Circuit Breaker**: Prevents cascade failures
- **Dead Letter Queue**: Captures permanently failed jobs
- **Graceful Degradation**: Service continues operating during partial failures

## 🔍 Monitoring

### Health Check Endpoint

```javascript
const health = await backgroundService.getHealth();
// Returns:
{
  status: 'healthy',
  timestamp: '2024-01-01T12:00:00.000Z',
  redis: 'connected',
  activeJobs: 5,
  circuitBreakers: 2,
  metrics: {
    jobsProcessed: 100,
    jobsFailed: 2,
    jobsRetried: 5,
    averageProcessingTime: 1500,
    queueLengths: { high: 0, normal: 3, low: 2 }
  }
}
```

### Job Status Tracking

```javascript
const status = backgroundService.getJobStatus(jobId);
// Returns:
{
  id: 'job-uuid',
  type: 'send-email',
  status: 'completed', // queued, processing, completed, failed, retrying
  data: { recipient: 'user@example.com' },
  priority: 'normal',
  retries: 0,
  createdAt: '2024-01-01T12:00:00.000Z',
  completedAt: '2024-01-01T12:00:01.500Z',
  processingTime: 1500
}
```

## 🛑 Graceful Shutdown

```javascript
// Handle shutdown signals
process.on("SIGINT", async () => {
  await backgroundService.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await backgroundService.shutdown();
  process.exit(0);
});
```

## 🔧 Integration with Your Services

### 1. **Copy the Template**

```bash
# Copy to your service directory
cp -r background-service-template/ your-service/background/

# Or copy individual files
cp background-service-template/backgroundService.js your-service/
cp background-service-template/logger.js your-service/
```

### 2. **Customize for Your Language**

The template is in JavaScript/Node.js, but the concepts apply to any language:

- **Go**: Use goroutines and channels
- **Python**: Use asyncio or Celery
- **Java**: Use Spring Boot with @Async
- **C#**: Use BackgroundService or Hangfire

### 3. **Add Your Business Logic**

```javascript
// Replace example handlers with your actual handlers
backgroundService.registerHandler("send-email", sendEmailHandler);
backgroundService.registerHandler("process-payment", processPaymentHandler);
backgroundService.registerHandler("generate-report", generateReportHandler);
```

## 🧪 Testing

### Run the Test Suite

```bash
npm test
```

The test demonstrates:

- Fire and forget operations
- Queue-based job processing
- Different job priorities
- Delayed job execution
- Retry mechanisms
- Timeout handling
- Service monitoring
- Graceful shutdown

### Expected Output

```
🚀 Starting background service test...
📝 Test 1: Fire and forget operation
📝 Test 2: Enqueue hello world job
📝 Test 3: Enqueue calculation job
...
✅ Background service test completed successfully!
```

## 📝 Best Practices

### 1. **Job Handler Design**

```javascript
// ✅ Good: Proper error handling and logging
async function goodHandler(data, job) {
  logger.info(`Processing job ${job.id}`, data);

  try {
    const result = await businessLogic(data);
    logger.info(`Job ${job.id} completed successfully`);
    return result;
  } catch (error) {
    logger.error(`Job ${job.id} failed:`, error);
    throw error; // Let retry mechanism handle it
  }
}

// ❌ Bad: No error handling
async function badHandler(data, job) {
  return await businessLogic(data); // No error handling
}
```

### 2. **Resource Management**

```javascript
// ✅ Good: Clean up resources
async function resourceHandler(data, job) {
  const connection = await createConnection();

  try {
    return await processWithConnection(connection, data);
  } finally {
    await connection.close(); // Always clean up
  }
}
```

### 3. **Idempotency**

```javascript
// ✅ Good: Idempotent operation
async function idempotentHandler(data, job) {
  const existing = await checkIfProcessed(data.id);
  if (existing) {
    return existing; // Don't process again
  }

  return await processData(data);
}
```

## 🔗 Integration Examples

### With Express.js

```javascript
import express from "express";
import { getBackgroundService } from "./backgroundService.js";

const app = express();
const backgroundService = getBackgroundService();

// Initialize background service
await backgroundService.initialize();

// API endpoint to enqueue job
app.post("/api/jobs", async (req, res) => {
  try {
    const job = await backgroundService.enqueueJob("process-data", req.body);
    res.json({ success: true, jobId: job.jobId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const health = await backgroundService.getHealth();
  res.json(health);
});
```

### With gRPC

```javascript
// In your gRPC service
async function processRequest(call, callback) {
  try {
    // Fire and forget background operation
    backgroundService.fireAndForget(
      async (data) => {
        await sendNotification(data.userId, data.message);
      },
      { userId: call.request.userId, message: call.request.message }
    );

    // Return immediately
    callback(null, { success: true, message: "Request accepted" });
  } catch (error) {
    callback({ code: 13, message: error.message });
  }
}
```

## 🚀 Performance Tips

1. **Use appropriate priorities** - High priority for critical jobs
2. **Set reasonable timeouts** - Don't set too high or too low
3. **Monitor queue lengths** - Scale workers if needed
4. **Use fire and forget** - For non-critical operations
5. **Implement idempotency** - Handle duplicate job processing
6. **Clean up resources** - Always close connections, files, etc.

## 🔍 Troubleshooting

### Common Issues

1. **Redis Connection Failed**

   - Check Redis is running
   - Verify connection settings
   - Check network connectivity

2. **Jobs Not Processing**

   - Check worker processes are running
   - Verify job handlers are registered
   - Check circuit breaker status

3. **High Memory Usage**

   - Monitor active jobs count
   - Check for memory leaks in handlers
   - Adjust worker count

4. **Jobs Failing Repeatedly**
   - Check dead letter queue
   - Review error logs
   - Verify job handler logic

### Debug Commands

```bash
# Check Redis queues
redis-cli llen jobs:high
redis-cli llen jobs:normal
redis-cli llen jobs:low

# Check dead letter queue
redis-cli llen dead-letter-queue

# Monitor Redis operations
redis-cli monitor
```

## 📚 Further Reading

- [Redis Documentation](https://redis.io/documentation)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Queue Management](<https://en.wikipedia.org/wiki/Queue_(abstract_data_type)>)

## 🤝 Contributing

This is a template - feel free to customize it for your needs:

1. Copy the template to your project
2. Modify configuration for your environment
3. Add your business logic handlers
4. Test thoroughly
5. Deploy and monitor

## 📄 License

MIT License - feel free to use in your projects!
