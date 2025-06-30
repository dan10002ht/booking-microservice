# 🚀 Gateway Development Guide

## Quick Start

### Option 1: Development Mode (Recommended)

```bash
# Start development environment
yarn dev:local

# Or manually:
# 1. Start infrastructure
yarn infra:start

# 2. Install dependencies
yarn install

# 3. Start gateway
yarn dev
```

### Option 2: Docker Mode

```bash
# Start gateway in Docker
yarn dev:docker

# Or manually:
docker-compose -f ../deploy/docker-compose.dev.yml up gateway
```

## Development Workflow

### 1. Local Development (Fastest)

**Best for:**

- Active coding and debugging
- Hot reload with nodemon
- Direct IDE integration
- Quick testing

**Setup:**

```bash
# Start only infrastructure services
yarn infra:start

# Install dependencies
yarn install

# Create .env file (auto-created by dev:setup)
# Start development server
yarn dev
```

**Available endpoints:**

- Gateway API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics

### 2. Docker Development

**Best for:**

- Testing production-like environment
- Consistent environment across team
- Integration testing

**Setup:**

```bash
# Start all services including gateway
docker-compose -f ../deploy/docker-compose.dev.yml up

# Or just gateway
yarn dev:docker
```

## Environment Configuration

### Local Development (.env)

```bash
# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev_jwt_secret
JWT_REFRESH_SECRET=dev_refresh_secret

# gRPC Services (point to localhost for other services)
GRPC_AUTH_SERVICE_URL=localhost:50051
GRPC_USER_SERVICE_URL=localhost:50052
# ... other services
```

### Docker Development

Environment variables are configured in `docker-compose.dev.yml`:

```yaml
gateway:
  environment:
    - NODE_ENV=development
    - REDIS_URL=redis://redis:6379
    - GRPC_AUTH_SERVICE_URL=auth-service:50051
    # ... other services
```

## Available Scripts

### Development

```bash
yarn dev              # Start with nodemon
yarn dev:setup        # Full development setup
yarn dev:docker       # Start in Docker
```

### Infrastructure

```bash
yarn infra:start      # Start infrastructure services
yarn infra:stop       # Stop infrastructure services
yarn infra:logs       # View infrastructure logs
```

### Testing

```bash
yarn test                 # Run tests
yarn run test:watch       # Run tests in watch mode
yarn run test:coverage    # Run tests with coverage
```

### Code Quality

```bash
yarn run lint             # Run ESLint
yarn run lint:fix         # Fix ESLint issues
yarn run format           # Format code with Prettier
```

### Docker

```bash
yarn run docker:build     # Build Docker image
yarn run docker:run       # Run Docker container
```

### gRPC

```bash
yarn run grpc:generate    # Generate gRPC code from proto files
```

## Monitoring & Debugging

### Health Checks

```bash
# Check gateway health
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed
```

### Metrics

```bash
# View Prometheus metrics
curl http://localhost:3000/metrics
```

### Logs

```bash
# View gateway logs (Docker)
docker-compose -f ../deploy/docker-compose.dev.yml logs -f gateway

# View infrastructure logs
yarn run infra:logs
```

### Monitoring Tools

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Check what's using port 3000
   lsof -i :3000

   # Kill process
   kill -9 <PID>
   ```

2. **Redis connection failed**

   ```bash
   # Check Redis status
   docker-compose -f ../deploy/docker-compose.dev.yml ps redis

   # Restart Redis
   docker-compose -f ../deploy/docker-compose.dev.yml restart redis
   ```

3. **gRPC connection failed**

   ```bash
   # Check if other services are running
   # Make sure gRPC URLs point to correct addresses
   ```

4. **Dependencies not found**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   yarn install
   ```

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=debug yarn dev

# Or in Docker
docker-compose -f ../deploy/docker-compose.dev.yml up gateway -e LOG_LEVEL=debug
```

## Development Tips

### Hot Reload

- Gateway automatically restarts when you save changes
- Use `nodemon` for development (already configured)

### API Testing

- Use Swagger UI: http://localhost:3000/api/docs
- Use curl or Postman for testing endpoints

### Code Organization

- Routes: `src/routes/`
- Handlers: `src/handlers/`
- Middleware: `src/middlewares/`
- Validation: `src/middlewares/validationMiddleware.js`
- Error mapping: `src/utils/errorMapping.js`
- Swagger docs: `src/swagger/`

### Adding New Endpoints

1. Add route in appropriate route file
2. Add handler in handlers directory
3. Add validation middleware if needed
4. Add Swagger documentation
5. Test the endpoint

### Adding New Services

1. Add gRPC client configuration
2. Add error mapping for the service
3. Update environment variables
4. Test integration

## Performance Tips

### Development Performance

- Use local development for faster iteration
- Use Docker for integration testing
- Monitor memory usage with large payloads

### Debugging Performance

- Check response times in logs
- Monitor gRPC connection status
- Use Prometheus metrics for bottlenecks

## Security Notes

### Development Security

- Use different JWT secrets for development
- Don't commit `.env` files
- Use strong passwords for development databases

### Testing Security

- Test rate limiting
- Test authentication middleware
- Test input validation
- Test error handling
