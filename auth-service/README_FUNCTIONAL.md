# 🔧 Functional Programming Approach - Auth Service

## 📋 Overview

Auth Service has been refactored to use **Functional Programming** approach instead of Class-based approach, while maintaining the **Master-Slave Database Pattern** at the Repository layer.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Services     │    │  Repositories   │    │     Utils       │
│   (Functional)  │───▶│   (Functional)  │───▶│   (Class-based) │    │  (Functional)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔄 Functional Approach

- **Controllers**: Export functions instead of class methods
- **Services**: Export functions instead of class methods  
- **Repositories**: Still use classes to manage master-slave pattern
- **Utils**: Organized utility functions by category

## 📁 File Structure

```
src/
├── controllers/
│   └── authController.js     # Functional controllers
├── services/
│   └── authService.js        # Functional services
├── repositories/
│   ├── baseRepository.js     # Class-based (Master-Slave)
│   └── userRepository.js     # Class-based (Master-Slave)
├── utils/
│   ├── index.js              # Centralized exports
│   ├── validations.js        # Input validation functions
│   ├── sanitizers.js         # Input sanitization functions
│   ├── tokenUtils.js         # Token management functions
│   └── logger.js             # Logging utility
└── index.js                  # Functional entry point
```

## 🚀 Functional Controllers

### Before (Class-based)
```javascript
class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async register(call, callback) {
    const result = await this.authService.register(userData);
    // ...
  }
}

export default AuthController;
```

### After (Functional)
```javascript
import { validateRegistration } from '../utils/validations.js';
import { sanitizePagination } from '../utils/sanitizers.js';

export async function register(call, callback) {
  const result = await authService.register(userData);
  // ...
}

export async function login(call, callback) {
  const result = await authService.login(email, password);
  // ...
}
```

## ⚡ Functional Services

### Before (Class-based)
```javascript
class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData) {
    const newUser = await this.userRepository.createUser(userData);
    // ...
  }
}
```

### After (Functional)
```javascript
import { generateTokens } from '../utils/tokenUtils.js';
import { validateRegistration } from '../utils/validations.js';
import { sanitizeUserInput } from '../utils/sanitizers.js';

// Singleton pattern for repository
const userRepository = new UserRepository();

export async function register(userData) {
  // Validate input
  const validation = validateRegistration(userData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // Sanitize input
  const sanitizedData = sanitizeUserInput(userData);
  
  const newUser = await userRepository.createUser(sanitizedData);
  // ...
}
```

## 🗄️ Repository Layer (Class-based)

Repository layer still uses classes to manage master-slave pattern:

```javascript
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    // Automatically route to slave for read operations
    return this.findOne({ email });
  }

  async createUser(userData) {
    // Automatically route to master for write operations
    return this.create(userData);
  }
}
```

## 🛠️ Utility Functions Organization

### 1. Validation Functions (`utils/validations.js`)
```javascript
import { validateEmail, validatePassword, validateRegistration } from '../utils/validations.js';

// Validate user input
const validation = validateRegistration(userData);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}
```

### 2. Sanitization Functions (`utils/sanitizers.js`)
```javascript
import { sanitizeUserInput, sanitizePagination } from '../utils/sanitizers.js';

// Sanitize user input
const sanitizedData = sanitizeUserInput(userData);

// Sanitize pagination
const { page, pageSize } = sanitizePagination(page, pageSize);
```

### 3. Token Functions (`utils/tokenUtils.js`)
```javascript
import { generateTokens, verifyAccessToken } from '../utils/tokenUtils.js';

// Generate tokens
const tokens = await generateTokens(userId, { email, role });

// Verify token
const decoded = verifyAccessToken(token);
```

### 4. Centralized Imports (`utils/index.js`)
```javascript
import { 
  validateEmail, 
  sanitizeUserInput, 
  generateTokens,
  logger 
} from '../utils/index.js';
```

## 🎯 Benefits of Functional Approach

### ✅ Advantages

1. **Easy Testing**: Pure functions, no side effects
2. **Easy Maintenance**: Concise, clear code
3. **Performance**: No need to instantiate classes
4. **Tree Shaking**: Smaller bundle size
5. **Immutability**: Reduce bugs from mutable state
6. **Modularity**: Organized utility functions by category

### 🔧 Easy to Use

```javascript
// Import specific functions
import { register, login, verifyToken } from '../services/authService.js';
import { validateEmail, sanitizeUserInput } from '../utils/index.js';

// Use directly
const result = await register(userData);
const tokens = await login(email, password);
const user = await verifyToken(token);
```

### 🧪 Easy to Test

```javascript
// Test individual functions
import { validatePassword, sanitizeUserInput } from '../utils/index.js';

describe('Validation Utils', () => {
  test('should validate strong password', () => {
    const result = validatePassword('StrongPass123!');
    expect(result.isValid).toBe(true);
  });
});

describe('Sanitization Utils', () => {
  test('should sanitize user input', () => {
    const result = sanitizeUserInput({ email: '  TEST@EMAIL.COM  ' });
    expect(result.email).toBe('test@email.com');
  });
});
```

## 🔄 Migration Guide

### 1. Controller Migration

```javascript
// Before
const controller = new AuthController();
server.addService(authProto.AuthService.service, {
  register: controller.register.bind(controller),
  login: controller.login.bind(controller)
});

// After
import * as authController from './controllers/authController.js';
server.addService(authProto.AuthService.service, {
  register: authController.register,
  login: authController.login
});
```

### 2. Service Migration

```javascript
// Before
const authService = new AuthService();
const result = await authService.register(userData);

// After
import { register } from '../services/authService.js';
import { validateRegistration } from '../utils/validations.js';

const validation = validateRegistration(userData);
const result = await register(userData);
```

### 3. Utility Functions Migration

```javascript
// Before - All utilities in service file
class AuthService {
  validateEmail(email) { /* ... */ }
  sanitizeInput(input) { /* ... */ }
  generateTokens(userId) { /* ... */ }
}

// After - Organized utility functions
import { validateEmail } from '../utils/validations.js';
import { sanitizeUserInput } from '../utils/sanitizers.js';
import { generateTokens } from '../utils/tokenUtils.js';
```

## 🛠️ Best Practices

### 1. Singleton Pattern for Repositories

```javascript
// ✅ Good - Singleton
const userRepository = new UserRepository();

export async function register(userData) {
  return await userRepository.createUser(userData);
}

// ❌ Bad - Create new instance each time
export async function register(userData) {
  const userRepository = new UserRepository();
  return await userRepository.createUser(userData);
}
```

### 2. Utility Function Organization

```javascript
// ✅ Good - Organized by category
import { validateEmail } from '../utils/validations.js';
import { sanitizeUserInput } from '../utils/sanitizers.js';
import { generateTokens } from '../utils/tokenUtils.js';

// ❌ Bad - Mixed utilities
import { validateEmail, sanitizeInput, generateTokens } from '../utils/mixed.js';
```

### 3. Error Handling

```javascript
export async function login(email, password) {
  try {
    const user = await userRepository.verifyCredentials(email, password);
    // ...
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}
```

### 4. Input Validation

```javascript
// Use validation utilities
import { validateRegistration } from '../utils/validations.js';

export async function register(userData) {
  const validation = validateRegistration(userData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  // ...
}
```

## 📊 Performance Benefits

### 1. Memory Usage
- **Class-based**: Create instance for each request
- **Functional**: Share singleton instances

### 2. Bundle Size
- **Class-based**: Include entire class
- **Functional**: Tree shaking, only include used functions

### 3. Execution Speed
- **Class-based**: Constructor overhead
- **Functional**: Direct function calls

### 4. Code Organization
- **Class-based**: Mixed responsibilities
- **Functional**: Separated concerns, organized utilities

## 🔍 Monitoring & Debugging

### 1. Function-level Logging

```javascript
import { logger } from '../utils/index.js';

export async function register(userData) {
  logger.info('Starting user registration', { email: userData.email });
  
  try {
    const result = await userRepository.createUser(userData);
    logger.info('User registration successful', { userId: result.id });
    return result;
  } catch (error) {
    logger.error('User registration failed', { error: error.message });
    throw error;
  }
}
```

### 2. Performance Metrics

```javascript
export async function login(email, password) {
  const startTime = Date.now();
  
  try {
    const result = await userRepository.verifyCredentials(email, password);
    const duration = Date.now() - startTime;
    
    logger.info('Login performance', { 
      email, 
      duration, 
      success: true 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Login performance', { 
      email, 
      duration, 
      success: false,
      error: error.message 
    });
    throw error;
  }
}
```

## 🚀 Deployment

### Environment Variables

```bash
# Functional approach doesn't require env vars changes
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Master-Slave Database
DB_MASTER_HOST=master-db.example.com
DB_SLAVE_HOSTS=slave1.example.com,slave2.example.com
```

### Docker

```dockerfile
# No need to change Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 50051
CMD ["npm", "start"]
```

## 📈 Future Enhancements

### 1. Middleware Functions

```javascript
// Auth middleware function
export function requireAuth(handler) {
  return async (call, callback) => {
    try {
      const token = call.metadata.get('authorization')[0];
      const user = await verifyToken(token);
      call.user = user;
      return handler(call, callback);
    } catch (error) {
      callback({
        code: 16, // UNAUTHENTICATED
        message: 'Authentication required'
      });
    }
  };
}
```

### 2. Validation Functions

```javascript
// Input validation functions
export const validateRegistration = (data) => {
  const errors = [];
  
  if (!data.email) errors.push('Email is required');
  if (!data.password) errors.push('Password is required');
  
  return { isValid: errors.length === 0, errors };
};
```

### 3. Composition Functions

```javascript
// Function composition
export const registerWithValidation = async (userData) => {
  const validation = validateRegistration(userData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const sanitizedData = sanitizeUserInput(userData);
  return await register(sanitizedData);
};
```

---

**Functional Programming** approach makes code easier to read, test and maintain, while still leveraging the benefits of **Master-Slave Database Pattern** at the Repository layer. The organized utility functions provide better code structure and reusability. 