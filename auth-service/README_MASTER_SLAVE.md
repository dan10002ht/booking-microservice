# 🔄 Master-Slave Database Pattern Implementation

## 📋 Tổng quan

Hệ thống auth-service đã được triển khai với **Master-Slave Database Pattern** để tối ưu hiệu suất và khả năng mở rộng. Pattern này tách biệt các operations đọc và ghi, giúp cải thiện đáng kể performance của hệ thống.

## 🏗️ Kiến trúc

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │   Master DB     │    │   Slave DB 1    │
│                 │    │   (Write Only)  │    │   (Read Only)   │
│  ┌───────────┐  │    │                 │    │                 │
│  │Controller │  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │           │  │    │  │   Users   │  │    │  │   Users   │  │
│  └───────────┘  │    │  │  Sessions │  │    │  │  Sessions │  │
│  ┌───────────┐  │    │  │  Profiles │  │    │  │  Profiles │  │
│  │  Service  │  │    │  └───────────┘  │    │  └───────────┘  │
│  └───────────┘  │    └─────────────────┘    └─────────────────┘
│  ┌───────────┐  │
│  │Repository │  │    ┌─────────────────┐
│  └───────────┘  │    │   Slave DB 2    │
└─────────────────┘    │   (Read Only)   │
                       │                 │
                       │  ┌───────────┐  │
                       │  │   Users   │  │
                       │  │  Sessions │  │
                       │  │  Profiles │  │
                       │  └───────────┘  │
                       └─────────────────┘
```

## 🔄 Luồng hoạt động

### Read Operations (Từ Slave)
- **User queries**: Tìm user theo email, username, ID
- **Profile queries**: Lấy thông tin user profile
- **Session queries**: Lấy danh sách sessions
- **Search operations**: Tìm kiếm users
- **Pagination**: Phân trang danh sách users

### Write Operations (Vào Master)
- **User creation**: Tạo user mới
- **User updates**: Cập nhật thông tin user
- **Password changes**: Đổi mật khẩu
- **Session management**: Tạo/xóa sessions
- **Status updates**: Cập nhật trạng thái user

## 📁 Cấu trúc Files

```
src/
├── config/
│   └── databaseConfig.js          # Cấu hình master-slave connections
├── repositories/
│   ├── baseRepository.js          # Base repository với master-slave logic
│   └── userRepository.js          # User repository kế thừa base
├── services/
│   └── authService.js             # Auth service sử dụng repository
├── controllers/
│   └── authController.js          # Controller xử lý gRPC requests
└── index.js                       # Entry point với graceful shutdown
```

## ⚙️ Cấu hình

### Environment Variables

```bash
# Master Database (Write Operations)
DB_MASTER_HOST=localhost
DB_MASTER_PORT=5432
DB_MASTER_NAME=booking_system_auth
DB_MASTER_USER=postgres
DB_MASTER_PASSWORD=password
DB_MASTER_POOL_MIN=2
DB_MASTER_POOL_MAX=10

# Slave Database 1 (Read Operations)
DB_SLAVE1_HOST=localhost
DB_SLAVE1_PORT=5432
DB_SLAVE1_NAME=booking_system_auth
DB_SLAVE1_USER=postgres
DB_SLAVE1_PASSWORD=password
DB_SLAVE_POOL_MIN=2
DB_SLAVE_POOL_MAX=8

# Slave Database 2 (Optional)
DB_SLAVE2_HOST=localhost
DB_SLAVE2_PORT=5432
DB_SLAVE2_NAME=booking_system_auth
DB_SLAVE2_USER=postgres
DB_SLAVE2_PASSWORD=password
```

## 🚀 Tính năng chính

### 1. Automatic Routing
- **Read operations** tự động được route đến slave databases
- **Write operations** tự động được route đến master database
- **Round-robin load balancing** cho multiple slaves

### 2. Connection Pooling
- **Master pool**: 2-10 connections cho write operations
- **Slave pool**: 2-8 connections cho read operations
- **Connection timeout** và **idle timeout** được cấu hình

### 3. Health Monitoring
- **Database health checks** định kỳ
- **Connection status monitoring**
- **Automatic fallback** nếu slave không available

### 4. Graceful Shutdown
- **Close all database connections** khi shutdown
- **Complete pending transactions**
- **Clean resource cleanup**

## 📊 Performance Benefits

### Before (Single Database)
```
┌─────────────┐
│   Client    │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Single    │
│  Database   │
│ (Read/Write)│
└─────────────┘
```

### After (Master-Slave)
```
┌─────────────┐
│   Client    │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│   Master    │    │   Slave 1   │
│ (Write Only)│    │(Read Only)  │
└─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Slave 2   │
                   │(Read Only)  │
                   └─────────────┘
```

## 🔧 Setup Instructions

### 1. Database Setup

```sql
-- Master Database
CREATE DATABASE booking_system_auth;

-- Slave Database 1
CREATE DATABASE booking_system_auth_slave1;

-- Slave Database 2 (Optional)
CREATE DATABASE booking_system_auth_slave2;
```

### 2. Replication Setup

```sql
-- Trên Master
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET max_replication_slots = 3;

-- Trên Slave
-- Cấu hình streaming replication
```

### 3. Environment Configuration

```bash
# Copy environment file
cp env.example .env

# Cấu hình database connections
# Master
DB_MASTER_HOST=your-master-host
DB_MASTER_NAME=booking_system_auth

# Slaves
DB_SLAVE1_HOST=your-slave1-host
DB_SLAVE1_NAME=booking_system_auth_slave1

DB_SLAVE2_HOST=your-slave2-host
DB_SLAVE2_NAME=booking_system_auth_slave2
```

### 4. Run Migrations

```bash
# Run migrations trên master
npm run migrate:latest

# Verify replication
npm run migrate:status
```

## 🧪 Testing

### Health Check
```bash
# Test health check endpoint
grpcurl -plaintext localhost:50051 auth.AuthService/healthCheck
```

### Performance Test
```bash
# Test read performance (slave)
npm run test:performance:read

# Test write performance (master)
npm run test:performance:write
```

## 📈 Monitoring

### Metrics
- **Database connection status**
- **Query performance metrics**
- **Read/Write ratio**
- **Connection pool utilization**

### Logs
```javascript
// Health check logs
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Database health check",
  "master": true,
  "slaves": [
    { "index": 0, "healthy": true },
    { "index": 1, "healthy": true }
  ]
}
```

## 🔒 Security Considerations

### 1. Connection Security
- **SSL/TLS encryption** cho database connections
- **Connection pooling** để tránh connection exhaustion
- **Credential management** an toàn

### 2. Data Consistency
- **Replication lag monitoring**
- **Consistency checks** định kỳ
- **Failover procedures** khi master down

### 3. Access Control
- **Read-only access** cho slave databases
- **Write access** chỉ cho master database
- **User permissions** được quản lý chặt chẽ

## 🚨 Troubleshooting

### Common Issues

#### 1. Slave Connection Failed
```javascript
// Error: Slave database health check failed
// Solution: Check slave database status và network connectivity
```

#### 2. Replication Lag
```javascript
// Error: Data inconsistency between master và slave
// Solution: Monitor replication lag và sync data
```

#### 3. Connection Pool Exhaustion
```javascript
// Error: Too many connections
// Solution: Tăng pool size hoặc optimize queries
```

### Debug Commands

```bash
# Check database connections
npm run db:status

# Test master connection
npm run db:test:master

# Test slave connections
npm run db:test:slaves

# Monitor performance
npm run monitor:performance
```

## 📚 Best Practices

### 1. Database Design
- **Index optimization** cho read queries
- **Partitioning** cho large tables
- **Query optimization** để giảm load

### 2. Application Design
- **Connection pooling** hiệu quả
- **Query caching** cho frequently accessed data
- **Error handling** robust

### 3. Monitoring
- **Real-time monitoring** của database health
- **Performance metrics** tracking
- **Alert system** cho critical issues

## 🔄 Migration Guide

### From Single Database

1. **Setup replication** giữa master và slaves
2. **Update application code** để sử dụng master-slave pattern
3. **Test thoroughly** trong staging environment
4. **Deploy gradually** với feature flags
5. **Monitor performance** và fix issues

### Rollback Plan

1. **Keep single database** as backup
2. **Feature flag** để switch back
3. **Data synchronization** procedures
4. **Performance monitoring** để ensure no degradation

## 📞 Support

Nếu gặp vấn đề với master-slave implementation:

1. **Check logs** trong `logs/` directory
2. **Run health checks** với `npm run health:check`
3. **Review configuration** trong `.env` file
4. **Contact team** với detailed error logs

---

**Lưu ý**: Master-Slave pattern này được thiết kế để tối ưu performance cho hệ thống booking với high read/write ratio. Đảm bảo monitor và maintain replication lag để data consistency. 