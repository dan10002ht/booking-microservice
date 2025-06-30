# 🔄 Migration to Yarn & Opossum

## 📦 Package Manager Migration

### **From npm to Yarn**

This project has been migrated from npm to Yarn for better dependency management and faster installations.

### **Key Changes:**

1. **Package Manager**: `npm` → `yarn`
2. **Lock File**: `package-lock.json` → `yarn.lock`
3. **Install Command**: `npm install` → `yarn install`
4. **Script Commands**: `npm run <script>` → `yarn <script>`

### **New Yarn Scripts:**

```bash
# Development
yarn dev              # Start with nodemon
yarn dev:local        # Setup + start gateway
yarn dev:docker       # Start in Docker

# Infrastructure
yarn infra:start      # Start infrastructure services
yarn infra:stop       # Stop infrastructure services
yarn infra:logs       # View infrastructure logs

# Package Management
yarn install:yarn     # Install dependencies
yarn add <package>    # Add new dependency
yarn add:dev <package> # Add dev dependency
```

### **Benefits of Yarn:**

- ✅ **Faster installations** - Parallel package downloads
- ✅ **Better caching** - Improved dependency resolution
- ✅ **Deterministic builds** - Consistent node_modules
- ✅ **Workspaces support** - Better monorepo management
- ✅ **Security** - Built-in security audits

---

## ⚡ Circuit Breaker Migration

### **From circuit-breaker-js to Opossum**

This project has been migrated from `circuit-breaker-js` to `opossum` for better circuit breaker functionality.

### **Key Changes:**

1. **Library**: `circuit-breaker-js` → `opossum`
2. **Implementation**: Custom wrapper → Full-featured circuit breaker
3. **Features**: Basic → Advanced (timeout, fallback, metrics)

### **Opossum Features:**

```javascript
// Circuit breaker configuration
const breaker = new CircuitBreaker(fn, {
  timeout: 30000, // Timeout in milliseconds
  errorThresholdPercentage: 50, // Error threshold percentage
  resetTimeout: 30000, // Reset timeout
  volumeThreshold: 5, // Minimum number of calls
  rollingCountTimeout: 60000, // Rolling count timeout
  rollingCountBuckets: 10, // Rolling count buckets
});
```

### **Circuit Breaker States:**

1. **Closed** - Normal operation
2. **Open** - Circuit is open, calls fail fast
3. **Half-Open** - Testing if service is back

### **Events:**

```javascript
breaker.on('open', () => {
  // Circuit opened
});

breaker.on('close', () => {
  // Circuit closed
});

breaker.on('halfOpen', () => {
  // Circuit half-opened
});

breaker.on('fallback', (result) => {
  // Fallback executed
});
```

### **Usage in gRPC Clients:**

```javascript
// Each gRPC method is wrapped with circuit breaker
const breaker = circuitBreakerService.createGrpcBreaker('authService', 'login', grpcCallFunction, {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

// Use circuit breaker
const result = await breaker.fire(request);
```

### **Benefits of Opossum:**

- ✅ **Better performance** - Optimized for Node.js
- ✅ **Rich events** - Comprehensive event system
- ✅ **Fallback support** - Automatic fallback execution
- ✅ **Metrics** - Built-in statistics and monitoring
- ✅ **Timeout handling** - Automatic timeout management
- ✅ **Error classification** - Smart error handling

---

## 🚀 Migration Commands

### **For Developers:**

```bash
# Remove old files
rm -rf node_modules package-lock.json

# Install with yarn
yarn install

# Start development
yarn dev:local
```

### **For CI/CD:**

```bash
# Update Dockerfile
# Use yarn instead of npm

# Update deployment scripts
# Use yarn commands
```

### **For Teams:**

```bash
# Install yarn globally (if not installed)
npm install -g yarn

# Verify yarn installation
yarn --version

# Install project dependencies
yarn install
```

---

## 📊 Performance Comparison

### **Installation Speed:**

| Package Manager | Time | Cache    |
| --------------- | ---- | -------- |
| npm             | ~45s | Basic    |
| yarn            | ~21s | Advanced |

### **Circuit Breaker Features:**

| Feature              | circuit-breaker-js | opossum |
| -------------------- | ------------------ | ------- |
| Timeout              | ❌                 | ✅      |
| Fallback             | ❌                 | ✅      |
| Events               | Basic              | Rich    |
| Metrics              | ❌                 | ✅      |
| Error Classification | ❌                 | ✅      |

---

## 🔧 Configuration

### **Yarn Configuration:**

```json
// package.json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "dev:local": "./scripts/dev-local.sh",
    "infra:start": "docker-compose -f ../deploy/docker-compose.dev.yml up -d"
  }
}
```

### **Circuit Breaker Configuration:**

```javascript
// config/index.js
circuitBreaker: {
  timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5
}
```

---

## 🎯 Best Practices

### **Yarn Best Practices:**

1. **Use yarn.lock** - Commit yarn.lock to version control
2. **Use workspaces** - For monorepo management
3. **Use yarn add** - Instead of npm install
4. **Use yarn upgrade** - For dependency updates

### **Circuit Breaker Best Practices:**

1. **Set appropriate timeouts** - Based on service response times
2. **Configure fallbacks** - Provide alternative responses
3. **Monitor metrics** - Track circuit breaker health
4. **Test failure scenarios** - Ensure circuit breaker works
5. **Use meaningful names** - For better debugging

---

## 🐛 Troubleshooting

### **Yarn Issues:**

```bash
# Clear yarn cache
yarn cache clean

# Remove node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install

# Check yarn version
yarn --version
```

### **Circuit Breaker Issues:**

```bash
# Check circuit breaker health
curl http://localhost:3000/health

# Reset circuit breakers
curl -X POST http://localhost:3000/admin/circuit-breakers/reset

# View circuit breaker stats
curl http://localhost:3000/admin/circuit-breakers/stats
```

---

## 📚 Resources

- [Yarn Documentation](https://yarnpkg.com/)
- [Opossum Documentation](https://nodeshift.dev/opossum/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
