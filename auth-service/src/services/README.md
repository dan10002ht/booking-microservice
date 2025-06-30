# Services Architecture

## 📁 Structure Overview

```
src/services/
├── internal/           # Internal business logic services
├── external/           # gRPC clients for other microservices
├── integration/        # Business flow orchestration
└── index.js           # Main exports
```

## 🏗️ Service Categories

### 1. Internal Services (`internal/`)

**Purpose**: Handle internal business logic and operations within the auth-service.

**Services**:
- `authService.js` - Core authentication logic
- `userManagementService.js` - User CRUD operations
- `adminService.js` - Admin-specific operations
- `organizationManagementService.js` - Organization management
- `oauthService.js` - OAuth provider integration
- `emailVerificationService.js` - Email verification
- `permissionService.js` - Permission and role management
- `twoFactorService.js` - 2FA operations

**Characteristics**:
- ✅ Pure business logic
- ✅ No external dependencies (except database)
- ✅ Can be unit tested independently
- ✅ Handle internal data models

### 2. External Services (`external/`)

**Purpose**: gRPC clients for communicating with other microservices.

**Services**:
- `deviceService.js` - gRPC client for device-service
- `securityService.js` - gRPC client for security-service

**Characteristics**:
- 🔗 gRPC client implementations
- 🔗 Protocol buffer definitions
- 🔗 Network communication
- 🔗 Error handling for network failures
- 🔗 Fallback mechanisms

### 3. Integration Services (`integration/`)

**Purpose**: Orchestrate business flows between internal and external services.

**Services**:
- `integrationService.js` - Business flow orchestration

**Characteristics**:
- 🔄 Orchestrates multiple services
- 🔄 Implements business workflows
- 🔄 Handles cross-service transactions
- 🔄 Manages service dependencies
- 🔄 Implements fallback strategies

## 📦 Usage Examples

### Import Internal Services

```javascript
// Import specific internal service
import { authService } from '../services/internal/authService.js';

// Import all internal services
import * as internal from '../services/internal/index.js';
const { authService, userManagementService } = internal;
```

### Import External Services

```javascript
// Import specific external service
import { deviceService } from '../services/external/deviceService.js';

// Import all external services
import * as external from '../services/external/index.js';
const { deviceService, securityService } = external;
```

### Import Integration Services

```javascript
// Import integration service
import { integrationService } from '../services/integration/integrationService.js';

// Import all integration services
import * as integration from '../services/integration/index.js';
const { integrationService } = integration;
```

### Import Everything (Backward Compatibility)

```javascript
// Import from main index (backward compatible)
import { 
  authService, 
  deviceService, 
  integrationService 
} from '../services/index.js';

// Or import by category
import { internal, external, integration } from '../services/index.js';
```

## 🔄 Service Dependencies

### Dependency Flow

```
Controllers
    ↓
Integration Services (orchestration)
    ↓
Internal Services (business logic)
    ↓
External Services (gRPC clients)
    ↓
Other Microservices
```

### Example Flow

```javascript
// Controller
export const enhancedLogin = async (req, res) => {
  // 1. Call integration service
  const result = await integrationService.handleUserLogin(userData, loginData, deviceInfo, requestInfo);
  
  // 2. Integration service orchestrates:
  //    - Internal: authService.validateCredentials()
  //    - External: deviceService.registerDevice()
  //    - External: securityService.submitEvent()
  
  res.json(result);
};
```

## 🧪 Testing Strategy

### Internal Services
- **Unit Tests**: Test business logic independently
- **Mock Dependencies**: Mock database and external calls
- **Fast Execution**: No network calls

### External Services
- **Integration Tests**: Test gRPC communication
- **Mock Services**: Mock other microservices
- **Error Scenarios**: Test network failures

### Integration Services
- **End-to-End Tests**: Test complete workflows
- **Service Mocks**: Mock both internal and external services
- **Business Logic**: Test orchestration logic

## 📋 Best Practices

### 1. Service Separation
- ✅ Keep internal services pure (no external dependencies)
- ✅ Keep external services focused on communication
- ✅ Use integration services for complex workflows

### 2. Error Handling
- ✅ Internal services: Throw business exceptions
- ✅ External services: Return error objects with fallbacks
- ✅ Integration services: Handle and aggregate errors

### 3. Testing
- ✅ Unit test internal services
- ✅ Integration test external services
- ✅ End-to-end test integration services

### 4. Dependencies
- ✅ Internal services: No external dependencies
- ✅ External services: Only gRPC dependencies
- ✅ Integration services: Can depend on both

## 🔧 Migration Guide

### From Old Structure
```javascript
// Old way
import { authService } from '../services/authService.js';
import { deviceService } from '../services/deviceService.js';

// New way (recommended)
import { authService } from '../services/internal/authService.js';
import { deviceService } from '../services/external/deviceService.js';

// Or use backward compatibility
import { authService, deviceService } from '../services/index.js';
```

### Adding New Services

1. **Internal Service**: Add to `internal/` folder
2. **External Service**: Add to `external/` folder  
3. **Integration Service**: Add to `integration/` folder
4. **Update index files**: Add exports to appropriate index.js
5. **Update main index.js**: Add convenience exports if needed

## 🎯 Benefits

### 1. Clear Separation of Concerns
- Internal logic vs external communication
- Business workflows vs individual operations

### 2. Easier Testing
- Mock external dependencies for internal services
- Test network failures for external services
- Test business flows for integration services

### 3. Better Maintainability
- Clear dependencies between services
- Easier to understand service responsibilities
- Simpler to add new services

### 4. Scalability
- Internal services can be optimized independently
- External services can be load balanced
- Integration services can be cached or optimized 