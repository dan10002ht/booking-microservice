# Auth Service API Documentation

## Overview

Authentication and authorization service providing user registration, login, and token management.

## gRPC Methods

### Registration

#### `RegisterWithEmail`

Register a new user with email and password.

**Request:**

```protobuf
message RegisterWithEmailRequest {
  string email = 1;
  string password = 2;
  string username = 3;
  string first_name = 4;
  string last_name = 5;
  string phone = 6;
  string role = 7; // "user", "organization", "admin"
  OrganizationData organization = 8;
  string ip_address = 9;
  string user_agent = 10;
}
```

**Response:**

```protobuf
message RegisterResponse {
  bool success = 1;
  string message = 2;
  User user = 3;
  string access_token = 4;
  string refresh_token = 5;
  string auth_type = 6; // "email"
  bool is_new_user = 7;
  OrganizationData organization = 8;
}
```

#### `RegisterWithOAuth`

Register a new user with OAuth provider (Google, Facebook, GitHub).

**Request:**

```protobuf
message RegisterWithOAuthRequest {
  string provider = 1; // "google", "facebook", "github"
  string token = 2;
  string access_token = 3;
  string refresh_token = 4;
  int64 expires_at = 5;
  string ip_address = 6;
  string user_agent = 7;
}
```

### Authentication

#### `Login`

User login with email and password.

**Request:**

```protobuf
message LoginRequest {
  string email = 1;
  string password = 2;
}
```

**Response:**

```protobuf
message LoginResponse {
  bool success = 1;
  string message = 2;
  User user = 3;
  string access_token = 4;
  string refresh_token = 5;
}
```

### Token Management

#### `RefreshToken`

Refresh access token using refresh token.

#### `ValidateToken`

Validate JWT access token.

#### `Logout`

Logout user and invalidate refresh token.

## Data Types

### User

```protobuf
message User {
  string id = 1;
  string email = 2;
  string first_name = 3;
  string last_name = 4;
  string phone = 5;
  bool is_active = 6;
  bool is_verified = 7;
  string role = 8;
  repeated string permissions = 9;
}
```

### OrganizationData

```protobuf
message OrganizationData {
  string name = 1;
  string description = 2;
  string website_url = 3;
  string logo_url = 4;
  string tax_id = 5;
  string business_license = 6;
  string contact_person = 7;
  string contact_phone = 8;
  string contact_email = 9;
  string address = 10;
  string city = 11;
  string state = 12;
  string country = 13;
  string postal_code = 14;
}
```

## Error Codes

- `3`: Invalid argument (missing required fields)
- `13`: Internal error (database, validation, etc.)

## Implementation Notes

- **Password Hashing**: Uses bcrypt with 12 rounds
- **JWT Tokens**: Access token (15min), Refresh token (7 days)
- **Session Management**: Tracks IP address and user agent
- **OAuth Support**: Google, Facebook, GitHub integration
- **Organization Support**: Special handling for organization accounts
