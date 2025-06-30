# Email Worker - Folder Structure

```
email-worker/
├── main.go                    # Application entry point
├── go.mod                     # Go modules
├── go.sum                     # Dependencies checksums
├── Dockerfile                 # Multi-stage Docker build
├── env.example                # Environment variables example
├── README.md                  # Documentation
├── folder-structure.md        # This file
├── build.sh                   # Build script
├── config/                    # Configuration management
│   ├── config.go              # Configuration structs and loading
│   └── env.go                 # Environment variable helpers
├── database/                  # Database connection and models
│   ├── connection.go          # PostgreSQL connection
│   ├── models/                # Database models
│   │   ├── email_job.go       # Email job model
│   │   ├── email_template.go  # Email template model
│   │   └── email_tracking.go  # Email tracking model
│   └── repositories/          # Data access layer
│       ├── email_job_repo.go  # Email job repository
│       ├── template_repo.go   # Template repository
│       └── tracking_repo.go   # Tracking repository
├── queue/                     # Message queue clients
│   ├── kafka.go               # Kafka consumer/producer
│   ├── redis.go               # Redis client
│   └── job_queue.go           # Job queue interface
├── grpcclient/                # gRPC client connections
│   ├── clients.go             # gRPC client manager
│   ├── auth_client.go         # Auth service client
│   ├── user_client.go         # User service client
│   └── booking_client.go      # Booking service client
├── services/                  # Business logic services
│   ├── services.go            # Service container
│   ├── email_service.go       # Email sending logic
│   ├── template_service.go    # Template rendering
│   ├── retry_service.go       # Retry logic
│   └── tracking_service.go    # Email tracking
├── providers/                 # Email provider implementations
│   ├── provider.go            # Provider interface
│   ├── sendgrid_provider.go   # SendGrid implementation
│   ├── ses_provider.go        # AWS SES implementation
│   └── smtp_provider.go       # SMTP implementation
├── processor/                 # Job processing logic
│   ├── processor.go           # Main processor
│   ├── job_consumer.go        # Job consumer
│   ├── job_validator.go       # Job validation
│   └── batch_processor.go     # Batch processing
├── templates/                 # Email templates
│   ├── templates.go           # Template manager
│   ├── renderer.go            # Template renderer
│   └── cache.go               # Template caching
├── metrics/                   # Prometheus metrics
│   ├── metrics.go             # Metrics definitions
│   ├── collector.go           # Metrics collector
│   └── exporter.go            # Metrics exporter
├── logging/                   # Logging configuration
│   ├── logger.go              # Logger setup
│   ├── middleware.go          # Logging middleware
│   └── formatter.go           # Log formatters
├── utils/                     # Utility functions
│   ├── crypto.go              # Cryptographic utilities
│   ├── validation.go          # Validation helpers
│   ├── time.go                # Time utilities
│   └── errors.go              # Error handling
├── models/                    # Domain models
│   ├── email.go               # Email model
│   ├── job.go                 # Job model
│   ├── template.go            # Template model
│   └── tracking.go            # Tracking model
├── types/                     # Type definitions
│   ├── email_types.go         # Email-related types
│   ├── job_types.go           # Job-related types
│   └── common_types.go        # Common types
├── constants/                 # Constants
│   ├── email_constants.go     # Email-related constants
│   ├── job_constants.go       # Job-related constants
│   └── system_constants.go    # System constants
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── benchmarks/            # Benchmark tests
│   └── fixtures/              # Test data
├── scripts/                   # Build and deployment scripts
│   ├── build.sh               # Build script
│   ├── deploy.sh              # Deployment script
│   └── migrate.sh             # Database migration script
└── docs/                      # Documentation
    ├── api.md                 # API documentation
    ├── deployment.md          # Deployment guide
    └── troubleshooting.md     # Troubleshooting guide
```

## 📁 Key Directories Explained

### **config/**

- Configuration management
- Environment variable handling
- Configuration validation

### **database/**

- Database connections
- Data models and repositories
- Database migrations

### **queue/**

- Message queue clients (Kafka, Redis)
- Job queue interfaces
- Queue management

### **grpcclient/**

- gRPC client connections
- Service-to-service communication
- Connection pooling

### **services/**

- Business logic implementation
- Service orchestration
- Core application logic

### **providers/**

- Email provider implementations
- Provider abstraction
- Fallback mechanisms

### **processor/**

- Job processing logic
- Consumer implementations
- Batch processing

### **templates/**

- Email template management
- Template rendering
- Template caching

### **metrics/**

- Prometheus metrics
- Performance monitoring
- Health checks

### **logging/**

- Structured logging
- Log formatting
- Log levels

### **utils/**

- Utility functions
- Helper methods
- Common functionality

### **models/**

- Domain models
- Data structures
- Business entities

### **types/**

- Type definitions
- Custom types
- Type safety

### **constants/**

- Application constants
- Configuration constants
- System constants

## 🎯 Best Practices Followed

1. **Separation of Concerns**: Each directory has a specific responsibility
2. **Dependency Injection**: Services are injected rather than created directly
3. **Interface Segregation**: Clear interfaces for each component
4. **Error Handling**: Centralized error handling and logging
5. **Configuration Management**: Environment-based configuration
6. **Testing Structure**: Organized test files with fixtures
7. **Documentation**: Comprehensive documentation in each directory
8. **Monitoring**: Built-in metrics and health checks
9. **Logging**: Structured logging throughout the application
10. **Security**: Secure handling of sensitive data

## 🚀 Benefits of This Structure

- **Scalability**: Easy to add new features and services
- **Maintainability**: Clear organization and separation of concerns
- **Testability**: Easy to write unit and integration tests
- **Deployment**: Simple deployment and configuration
- **Monitoring**: Built-in observability and monitoring
- **Security**: Secure by design with proper abstractions
