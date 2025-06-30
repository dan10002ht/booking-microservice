# 🔐 Registration Flows Documentation

This document describes the multi-method registration system implemented in the auth-service.

## 📋 Overview

The auth-service now supports **two main registration methods**:

1. **Email/Password Registration** - Traditional registration with email and password
2. **OAuth Registration** - Registration via OAuth providers (Google, Facebook, GitHub)

## 🏗️ Architecture

### Database Schema

- **`users`** table: Stores user information with `auth_type` field
- **`oauth_accounts`** table: Links OAuth providers to users
- **`user_sessions`** table: Manages user sessions and tokens

### Service Layer

- **`authService.js`**: Main authentication logic
- **`oauthService.js`**: OAuth provider integration
- **Repository Factory**: Singleton pattern for database access

## 🚀 API Endpoints

### 1. Email Registration

```protobuf
rpc RegisterWithEmail(RegisterWithEmailRequest) returns (RegisterResponse);
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "role": "user",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "auth_type": "email"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "auth_type": "email"
}
```

### 2. OAuth Registration

```protobuf
rpc RegisterWithOAuth(RegisterWithOAuthRequest) returns (RegisterResponse);
```

**Request:**

```json
{
  "provider": "google",
  "token": "google_oauth_token",
  "access_token": "access_token",
  "refresh_token": "refresh_token",
  "expires_at": 1640995200000,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Google registration successful",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "auth_type": "oauth"
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "auth_type": "oauth",
  "is_new_user": true
}
```

### 3. Legacy Registration (Backward Compatibility)

```protobuf
rpc Register(RegisterRequest) returns (RegisterResponse);
```

## 🔄 Registration Flow Logic

### Email Registration Flow

1. **Validate** input data (email, password, etc.)
2. **Check** if email already exists
3. **Hash** password using bcrypt
4. **Create** user with `auth_type: 'email'`
5. **Generate** JWT tokens
6. **Create** user session
7. **Return** user data and tokens

### OAuth Registration Flow

1. **Verify** OAuth token with provider (Google, Facebook, etc.)
2. **Extract** user info from OAuth provider
3. **Check** if OAuth account already exists
   - If exists: **Login** existing user
   - If not: Continue to step 4
4. **Check** if email from OAuth exists in our system
   - If exists: **Link** OAuth to existing user
   - If not: **Create** new user
5. **Create** OAuth account record
6. **Generate** JWT tokens
7. **Create** user session
8. **Return** user data and tokens

## 🛡️ Security Features

### Email Registration

- Password hashing with bcrypt (12 rounds)
- Email uniqueness validation
- Input sanitization
- Session management

### OAuth Registration

- Token verification with OAuth providers
- Email pre-verification (OAuth emails are verified)
- Secure token storage
- Provider-specific validation

### General Security

- JWT token generation
- Session management
- IP address tracking
- User agent logging
- Rate limiting (via gateway)

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/auth_db
DATABASE_MASTER_URL=postgresql://user:pass@localhost:5432/auth_db_master
DATABASE_SLAVE_URL=postgresql://user:pass@localhost:5432/auth_db_slave

# JWT
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Providers (for production)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## 🧪 Testing

### Run Tests

```bash
# Test registration flows
node test-registration-flows.js

# Run all tests
yarn test
```

### Test Scenarios

1. **Email Registration** - New user with email/password
2. **OAuth Registration** - New user with Google OAuth
3. **Legacy Registration** - Backward compatibility
4. **Duplicate Email** - Error handling
5. **OAuth Linking** - Link OAuth to existing email

## 📊 Database Queries

### Check User Auth Type

```sql
SELECT id, email, auth_type, created_at
FROM users
WHERE email = 'user@example.com';
```

### Get OAuth Accounts

```sql
SELECT oa.provider, oa.provider_user_id, oa.created_at
FROM oauth_accounts oa
JOIN users u ON oa.user_id = u.public_id
WHERE u.email = 'user@example.com';
```

### User Statistics

```sql
SELECT
  auth_type,
  COUNT(*) as user_count,
  COUNT(CASE WHEN email_verified_at IS NOT NULL THEN 1 END) as verified_count
FROM users
GROUP BY auth_type;
```

## 🚨 Error Handling

### Common Errors

- **Email already exists**: `Email is already in use`
- **Invalid OAuth token**: `Invalid Google token`
- **OAuth account exists**: Automatic login
- **Email exists but no OAuth**: Automatic linking

### Error Response Format

```json
{
  "code": 13,
  "message": "Error description"
}
```

## 🔄 Migration Notes

### From Legacy to New System

- Existing users maintain `auth_type: 'email'`
- New OAuth users get `auth_type: 'oauth'`
- Backward compatibility maintained
- No data migration required

### Adding New OAuth Providers

1. Add provider to `verifyOAuthToken()` function
2. Update proto file with new provider
3. Add provider-specific configuration
4. Test with provider's OAuth flow

## 📈 Monitoring

### Key Metrics

- Registration success rate by method
- OAuth provider usage statistics
- Email vs OAuth user distribution
- Session creation rates

### Logs

- Registration attempts (success/failure)
- OAuth token verification results
- User creation events
- Session management events

## 🔗 Integration Examples

### Frontend Integration (JavaScript)

```javascript
// Email Registration
const emailResult = await authClient.registerWithEmail({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
});

// OAuth Registration
const oauthResult = await authClient.registerWithOAuth({
  provider: 'google',
  token: googleOAuthToken,
  access_token: googleAccessToken,
  refresh_token: googleRefreshToken,
});
```

### Gateway Integration

```javascript
// Route registration requests to auth-service
app.post('/auth/register', async (req, res) => {
  const result = await authService.registerWithEmail(req.body);
  res.json(result);
});

app.post('/auth/register/google', async (req, res) => {
  const result = await authService.registerWithOAuth('google', req.body);
  res.json(result);
});
```

---

## 📝 Notes

- **OAuth tokens** are verified server-side for security
- **Email uniqueness** is enforced across all registration methods
- **Session management** is consistent across all auth types
- **Backward compatibility** is maintained for existing integrations
- **Database transactions** ensure data consistency
- **Error handling** provides clear feedback to clients

For more information, see the main [README.md](./README.md) file.
