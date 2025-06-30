# Repository Pattern Implementation

## 🏗️ **Architecture Overview**

Auth-service sử dụng Repository Pattern với interface-based design để đảm bảo consistency và maintainability.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Service Layer │    │ Repository Layer │    │  Database Layer │
│                 │    │                  │    │                 │
│  authService    │───▶│  UserRepository  │───▶│   PostgreSQL    │
│  userService    │    │  RoleRepository  │    │   (Master/Slave)│
│  orgService     │    │  OrgRepository   │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Interfaces     │
                       │                  │
                       │  IRepository     │
                       │  IUserRepository │
                       └──────────────────┘
```

## 📁 **File Structure**

```
src/repositories/
├── interfaces/
│   ├── IRepository.js          # Base repository interface
│   └── IUserRepository.js      # User-specific interface
├── validators/
│   └── repositoryValidator.js  # Interface compliance checker
├── baseRepository.js           # Base implementation
├── userRepository.js           # User-specific implementation
├── roleRepository.js           # Role repository
├── organizationRepository.js   # Organization repository
├── repositoryFactory.js        # Factory pattern
└── ... (other repositories)
```

## 🔧 **Core Components**

### 1. **Base Interface (IRepository.js)**

```javascript
export default class IRepository {
  async findById(id) {
    throw new Error('Not implemented');
  }
  async create(data) {
    throw new Error('Not implemented');
  }
  async update(id, data) {
    throw new Error('Not implemented');
  }
  async delete(id) {
    throw new Error('Not implemented');
  }
  // ... other base methods
}
```

### 2. **Specific Interface (IUserRepository.js)**

```javascript
export default class IUserRepository extends IRepository {
  async findByEmail(email) {
    throw new Error('Not implemented');
  }
  async createUser(userData) {
    throw new Error('Not implemented');
  }
  async verifyCredentials(email, password) {
    throw new Error('Not implemented');
  }
  // ... user-specific methods
}
```

### 3. **Base Implementation (BaseRepository.js)**

```javascript
class BaseRepository extends IRepository {
  constructor(tableName) {
    super();
    this.tableName = tableName;
  }

  // Master-Slave pattern
  getMasterDb() {
    return masterDb(this.tableName);
  }
  getSlaveDb() {
    return getSlaveDb()(this.tableName);
  }

  // Implement all base methods
  async findById(id) {
    /* implementation */
  }
  async create(data) {
    /* implementation */
  }
  // ... other implementations
}
```

### 4. **Specific Implementation (UserRepository.js)**

```javascript
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  // Implement user-specific methods
  async findByEmail(email) {
    /* implementation */
  }
  async createUser(userData) {
    /* implementation */
  }
  // ... other user methods
}
```

### 5. **Factory Pattern (repositoryFactory.js)**

```javascript
// Singleton instances
let userRepositoryInstance = null;

export function getUserRepository() {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}
```

## 🎯 **Key Features**

### **1. Master-Slave Pattern**

- **Read operations**: Sử dụng slave database
- **Write operations**: Sử dụng master database
- **Automatic routing**: Dựa trên operation type

### **2. Interface Compliance**

- Tất cả repositories phải implement interface
- Validation script kiểm tra compliance
- Type safety và documentation

### **3. Singleton Pattern**

- Mỗi repository chỉ có 1 instance
- Memory efficient
- Consistent state

### **4. Dependency Injection**

- Services inject repositories qua factory
- Easy testing với mock repositories
- Loose coupling

## 🚀 **Usage Examples**

### **Service Layer Usage**

```javascript
import { getUserRepository } from '../repositories/repositoryFactory.js';

const userRepository = getUserRepository();

// Create user
const newUser = await userRepository.createUser({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
});

// Find user by email
const user = await userRepository.findByEmail('user@example.com');

// Update user
await userRepository.updateUser(user.id, {
  first_name: 'Jane',
});
```

### **Testing with Mock**

```javascript
class MockUserRepository extends IUserRepository {
  async findByEmail(email) {
    return { id: '1', email, name: 'Mock User' };
  }

  async createUser(userData) {
    return { id: '2', ...userData };
  }
}
```

## 🧪 **Validation & Testing**

### **Run Repository Tests**

```bash
npm run test:repositories
```

### **Validation Output**

```
🚀 Starting repository validation...

📋 Found repositories: [user, role, organization, ...]

✅ UserRepository implements all base repository methods
✅ UserRepository implements all user-specific methods
✅ RoleRepository implements all base repository methods
...

🧪 Testing repository methods...
✅ UserRepository basic methods work correctly
✅ RoleRepository basic methods work correctly
...

🎉 All repositories are valid and working correctly!
✅ Interface compliance: PASSED
✅ Method implementation: PASSED
✅ Database connectivity: PASSED
```

## 📊 **Performance Benefits**

### **Before Repository Pattern**

- Direct database queries trong services
- Duplicate code across services
- Hard to test và mock
- No consistency guarantee

### **After Repository Pattern**

- **Centralized data access**: Tất cả DB operations qua repositories
- **Code reusability**: Shared base methods
- **Easy testing**: Mock repositories
- **Type safety**: Interface compliance
- **Performance**: Master-Slave pattern

## 🔄 **Database Operations**

### **Read Operations (Slave)**

```javascript
// Sử dụng slave database
const users = await userRepository.findAll();
const user = await userRepository.findByEmail('user@example.com');
const count = await userRepository.count({ is_active: true });
```

### **Write Operations (Master)**

```javascript
// Sử dụng master database
const newUser = await userRepository.createUser(userData);
await userRepository.updateUser(userId, updateData);
await userRepository.deleteUser(userId);
```

### **Transaction Operations**

```javascript
await userRepository.transaction(async (trx) => {
  await userRepository.createUser(userData, trx);
  await roleRepository.assignRole(userId, roleId, trx);
});
```

## 🛠️ **Best Practices**

### **1. Interface First**

- Luôn define interface trước khi implement
- Đảm bảo tất cả methods được implement
- Use validation script

### **2. Consistent Naming**

```javascript
// ✅ Good
async findByEmail(email)
async createUser(userData)
async updateUserStatus(userId, status)

// ❌ Bad
async getUserByEmail(email)
async addUser(userData)
async changeStatus(userId, status)
```

### **3. Error Handling**

```javascript
async findByEmail(email) {
  try {
    return await this.findOne({ email: email.toLowerCase() });
  } catch (error) {
    logger.error('Error finding user by email:', error);
    throw new Error('Failed to find user');
  }
}
```

### **4. Documentation**

```javascript
/**
 * Tìm user theo email
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} User object or null
 */
async findByEmail(email) {
  // implementation
}
```

## 🔮 **Future Enhancements**

### **1. TypeScript Migration**

- Convert interfaces to TypeScript interfaces
- Better type safety
- IDE support

### **2. Caching Layer**

- Repository-level caching
- Redis integration
- Cache invalidation

### **3. Query Builder**

- Advanced query building
- Dynamic filters
- Performance optimization

### **4. Event System**

- Repository events
- Audit logging
- Change tracking

---

Repository Pattern này đảm bảo code maintainable, testable và scalable cho auth-service! 🎯
