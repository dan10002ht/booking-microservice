# Database Design - Auth Service

## Overview

The Auth Service manages user authentication, authorization, and session management for the booking system. This document outlines the database schema and relationships.

## Database Schema

### Hybrid ID Approach

The database uses a **hybrid approach** for optimal performance and security:

- **`internal_id`** (BIGSERIAL): Auto-incrementing primary key for internal operations and performance
- **`public_id`** (UUID): Globally unique identifier for API exposure and security

### Users Table

```sql
CREATE TABLE users (
    internal_id BIGSERIAL PRIMARY KEY,                    -- Internal ID for performance
    public_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- Public ID for API
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    auth_type VARCHAR(20) DEFAULT 'email', -- 'email' or 'oauth'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Organizations Table

```sql
CREATE TABLE organizations (
    internal_id BIGSERIAL PRIMARY KEY,                    -- Internal ID for performance
    public_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- Public ID for API
    user_id UUID NOT NULL REFERENCES users(public_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    tax_id VARCHAR(50),
    business_license VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Organization Roles Table

```sql
CREATE TABLE organization_roles (
    internal_id BIGSERIAL PRIMARY KEY,                    -- Internal ID for performance
    public_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- Public ID for API
    organization_id UUID NOT NULL REFERENCES organizations(public_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'member', 'viewer'
    description TEXT,
    permissions JSONB, -- Organization-specific permissions
    hierarchy_level INTEGER DEFAULT 0, -- 0=highest, 100=lowest
    is_default BOOLEAN DEFAULT false, -- Default role for new members
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);
```

### Organization Members Table

```sql
CREATE TABLE organization_members (
    internal_id BIGSERIAL PRIMARY KEY,                    -- Internal ID for performance
    public_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- Public ID for API
    organization_id UUID NOT NULL REFERENCES organizations(public_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(public_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES organization_roles(public_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'suspended'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP,
    invited_by UUID REFERENCES users(public_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);
```

### Internal Tables (Performance Critical)

For internal tables that don't need API exposure, we use auto-increment IDs for maximum performance:

```sql
-- Refresh Tokens (Internal only)
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,                             -- Auto increment for performance
    user_id UUID NOT NULL REFERENCES users(public_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions (Internal only)
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,                             -- Auto increment for performance
    user_id UUID NOT NULL REFERENCES users(public_id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs (Internal only)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,                             -- Auto increment for performance
    user_id UUID REFERENCES users(public_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Benefits of Hybrid Approach

### Performance Benefits:
- **Internal operations** use fast auto-increment IDs
- **JOIN operations** are optimized with sequential IDs
- **Index size** is smaller for internal operations
- **Cache-friendly** sequential access patterns

### Security Benefits:
- **API exposure** uses unpredictable UUIDs
- **Enumeration attacks** are prevented
- **Global uniqueness** across distributed systems
- **No information leakage** through predictable IDs

### Usage Guidelines:

1. **API Endpoints**: Always use `public_id` for external communication
2. **Internal Queries**: Use `internal_id` for performance-critical operations
3. **Foreign Keys**: Reference `public_id` for data integrity
4. **Indexes**: Create indexes on both `internal_id` and `public_id` as needed

## Entity Relationship Diagram (ERD)

```
Users (1) -------- (1) Organizations
  |                    |
  |                    |
  | (1) -------- (N) OAuthAccounts
  |                    |
  | (1) -------- (N) UserRoles (N) -------- (1) Roles
  |                                                |
  |                                                |
  | (1) -------- (N) RefreshTokens                |
  |                                                |
  | (1) -------- (N) PasswordResetTokens          |
  |                                                |
  | (1) -------- (N) EmailVerificationTokens      |
  |                                                |
  | (1) -------- (N) UserSessions                 |
  |                                                |
  | (1) -------- (N) AuditLogs                    |
  |                                                |
  |                                                |
Roles (1) -------- (N) RolePermissions (N) -------- (1) Permissions

Organizations (1) -------- (N) OrganizationRoles (N) -------- (1) OrganizationMembers (N) -------- (1) Users
```

## Key Relationships

1. **Users to Organizations**: One-to-one relationship (only for organization users)
2. **Users to OAuth Accounts**: One-to-many relationship for multiple OAuth providers
3. **Users to Roles**: Many-to-many relationship through `user_roles` table
4. **Roles to Permissions**: Many-to-many relationship through `role_permissions` table
5. **Users to Tokens**: One-to-many relationships for various token types
6. **Users to Sessions**: One-to-many relationship for session management
7. **Users to Audit Logs**: One-to-many relationship for activity tracking
8. **Organizations to Roles**: One-to-many relationship for organization-specific roles
9. **Organizations to Members**: Many-to-many relationship through `organization_members` table

## Indexes

```sql
-- Performance indexes for hybrid approach
CREATE INDEX idx_users_public_id ON users(public_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_users_auth_type ON users(auth_type);

CREATE INDEX idx_organizations_public_id ON organizations(public_id);
CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_is_verified ON organizations(is_verified);

CREATE INDEX idx_oauth_accounts_public_id ON oauth_accounts(public_id);
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX idx_oauth_accounts_provider_user_id ON oauth_accounts(provider, provider_user_id);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- Organization indexes
CREATE INDEX idx_organization_roles_public_id ON organization_roles(public_id);
CREATE INDEX idx_organization_roles_org_id ON organization_roles(organization_id);
CREATE INDEX idx_organization_roles_hierarchy ON organization_roles(hierarchy_level);
CREATE INDEX idx_organization_members_public_id ON organization_members(public_id);
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_status ON organization_members(status);
CREATE INDEX idx_organization_invitations_public_id ON organization_invitations(public_id);
CREATE INDEX idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX idx_organization_invitations_expires ON organization_invitations(expires_at);
```

## Default Data

### Default Roles

```sql
INSERT INTO roles (public_id, name, description) VALUES
(gen_random_uuid(), 'admin', 'System administrator with full access'),
(gen_random_uuid(), 'organization', 'Event organization with event management permissions'),
(gen_random_uuid(), 'individual', 'Individual user with booking permissions');
```

### Default Permissions

```sql
INSERT INTO permissions (public_id, name, description, resource, action) VALUES
-- User management
(gen_random_uuid(), 'users.read', 'Read user information', 'users', 'read'),
(gen_random_uuid(), 'users.create', 'Create new users', 'users', 'create'),
(gen_random_uuid(), 'users.update', 'Update user information', 'users', 'update'),
(gen_random_uuid(), 'users.delete', 'Delete users', 'users', 'delete'),

-- Organization management
(gen_random_uuid(), 'organizations.read', 'Read organization information', 'organizations', 'read'),
(gen_random_uuid(), 'organizations.create', 'Create new organizations', 'organizations', 'create'),
(gen_random_uuid(), 'organizations.update', 'Update organization information', 'organizations', 'update'),
(gen_random_uuid(), 'organizations.delete', 'Delete organizations', 'organizations', 'delete'),

-- Booking management
(gen_random_uuid(), 'bookings.read', 'Read booking information', 'bookings', 'read'),
(gen_random_uuid(), 'bookings.create', 'Create new bookings', 'bookings', 'create'),
(gen_random_uuid(), 'bookings.update', 'Update booking information', 'bookings', 'update'),
(gen_random_uuid(), 'bookings.delete', 'Delete bookings', 'bookings', 'delete'),

-- Event management
(gen_random_uuid(), 'events.read', 'Read event information', 'events', 'read'),
(gen_random_uuid(), 'events.create', 'Create new events', 'events', 'create'),
(gen_random_uuid(), 'events.update', 'Update event information', 'events', 'update'),
(gen_random_uuid(), 'events.delete', 'Delete events', 'events', 'delete'),

-- Payment management
(gen_random_uuid(), 'payments.read', 'Read payment information', 'payments', 'read'),
(gen_random_uuid(), 'payments.create', 'Create new payments', 'payments', 'create'),
(gen_random_uuid(), 'payments.update', 'Update payment information', 'payments', 'update'),
(gen_random_uuid(), 'payments.delete', 'Delete payments', 'payments', 'delete');
```

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with salt
2. **Token Security**: All tokens are hashed before storage
3. **Session Management**: Sessions have expiration times and can be revoked
4. **Audit Trail**: All user actions are logged for security monitoring
5. **Role-Based Access Control**: Granular permissions based on user roles
6. **Input Validation**: All user inputs are validated and sanitized
7. **SQL Injection Prevention**: Using parameterized queries
8. **Rate Limiting**: Implemented at the API level
9. **OAuth Security**: Secure OAuth token handling and validation
10. **Hybrid ID Security**: Public IDs prevent enumeration attacks

## Migration Strategy

1. **Version Control**: All schema changes are versioned using migration files
2. **Backward Compatibility**: New migrations maintain backward compatibility
3. **Data Migration**: Proper data migration scripts for schema changes
4. **Rollback Support**: Ability to rollback migrations if needed
5. **Testing**: All migrations are tested in development environment first
6. **Hybrid Approach**: Seamless transition between internal and public IDs
