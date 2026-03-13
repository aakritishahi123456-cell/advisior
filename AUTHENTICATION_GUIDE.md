# JWT Authentication System for FinSathi AI

## Overview
This guide documents the complete JWT authentication system implemented for FinSathi AI, including registration, login, token refresh, and middleware for protecting routes.

## Architecture

### Security Features
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Rate Limiting**: Prevents brute force attacks
- **Token Blacklisting**: Optional token invalidation
- **Input Validation**: Zod schemas for all inputs

### Token Types
- **Access Token**: 15 minutes expiry, used for API access
- **Refresh Token**: 7 days expiry, used to get new access tokens

## API Endpoints

### Register
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "FREE",
    "createdAt": "2023-12-10T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "FREE",
    "createdAt": "2023-12-10T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Token
```
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Profile
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "FREE",
    "createdAt": "2023-12-10T10:30:00.000Z",
    "updatedAt": "2023-12-10T10:30:00.000Z",
    "subscriptions": [
      {
        "plan": "FREE",
        "status": "ACTIVE",
        "startDate": "2023-12-10T10:30:00.000Z",
        "endDate": null
      }
    ]
  }
}
```

### Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

## Middleware

### requireAuth
Protects routes that require authentication.

```typescript
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';

router.get('/protected', requireAuth, async (req: AuthRequest, res: Response) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

### requirePro
Protects routes that require PRO subscription.

```typescript
import { requirePro } from '../middleware/auth.middleware';

router.get('/pro-feature', requirePro, async (req: AuthRequest, res: Response) => {
  // User is authenticated and has PRO subscription
  res.json({ message: 'PRO feature accessed' });
});
```

### optionalAuth
Adds user info if token is provided, but doesn't require authentication.

```typescript
import { optionalAuth } from '../middleware/auth.middleware';

router.get('/public-data', optionalAuth, async (req: AuthRequest, res: Response) => {
  if (req.user) {
    // Authenticated user
    res.json({ user: req.user });
  } else {
    // Anonymous user
    res.json({ message: 'Anonymous access' });
  }
});
```

## Rate Limiting

### Limits Applied
- **General API**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes
- **Login**: 3 attempts per 15 minutes
- **Registration**: 3 attempts per hour
- **Token Refresh**: 10 attempts per 15 minutes

### Rate Limit Responses
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Error Handling

### Error Codes
- `NO_TOKEN`: No token provided
- `INVALID_TOKEN_FORMAT`: Token format invalid
- `INVALID_TOKEN`: Token is invalid
- `TOKEN_EXPIRED`: Token has expired
- `TOKEN_BLACKLISTED`: Token has been invalidated
- `USER_NOT_FOUND`: User not found
- `AUTH_REQUIRED`: Authentication required
- `PRO_REQUIRED`: PRO subscription required
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `REGISTER_RATE_LIMIT_EXCEEDED`: Registration rate limit exceeded
- `LOGIN_RATE_LIMIT_EXCEEDED`: Login rate limit exceeded

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Password Security

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not in common passwords list

### Common Passwords Blocked
- password
- 123456
- 123456789
- qwerty
- abc123
- password123
- admin
- letmein
- welcome
- monkey

## Token Structure

### Access Token Payload
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "FREE",
  "type": "access",
  "iat": 1702218000,
  "exp": 1702218900
}
```

### Refresh Token Payload
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "role": "FREE",
  "type": "refresh",
  "iat": 1702218000,
  "exp": 1702822400
}
```

## Security Best Practices

### Client-Side
1. **Store tokens securely**: Use httpOnly cookies or secure storage
2. **Use HTTPS**: Always transmit tokens over HTTPS
3. **Handle token expiry**: Implement automatic token refresh
4. **Clear tokens on logout**: Remove all stored tokens
5. **Validate responses**: Check for authentication errors

### Server-Side
1. **Use environment variables**: Never hardcode secrets
2. **Implement rate limiting**: Prevent brute force attacks
3. **Log security events**: Monitor authentication attempts
4. **Validate all inputs**: Use schema validation
5. **Handle errors gracefully**: Don't leak sensitive information

## Implementation Examples

### Frontend Integration (JavaScript)
```javascript
class AuthAPI {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3001';
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      this.setTokens(data.access_token, data.refresh_token);
      return data;
    } else {
      throw new Error(data.error);
    }
  }

  async refreshAccessToken() {
    const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    const data = await response.json();
    
    if (response.ok) {
      this.token = data.access_token;
      localStorage.setItem('access_token', data.access_token);
      return data.access_token;
    } else {
      // Refresh failed, redirect to login
      this.logout();
      throw new Error('Session expired');
    }
  }

  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`
    };

    let response = await fetch(url, { ...options, headers });

    // Handle token expiry
    if (response.status === 401) {
      try {
        await this.refreshAccessToken();
        // Retry with new token
        headers['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(url, { ...options, headers });
      } catch (refreshError) {
        this.logout();
        window.location.href = '/login';
      }
    }

    return response;
  }
}

// Usage
const auth = new AuthAPI();

// Login
await auth.login('user@example.com', 'password123');

// Authenticated request
const response = await auth.authenticatedFetch('/api/v1/auth/me');
```

## Testing

### Test Cases
1. **Registration**: Valid/invalid emails, weak/strong passwords
2. **Login**: Valid/invalid credentials, rate limiting
3. **Token Refresh**: Valid/invalid refresh tokens, expiry handling
4. **Protected Routes**: With/without valid tokens, expired tokens
5. **Rate Limiting**: Exceed limits, verify reset
6. **Error Handling**: All error codes and edge cases

### Environment Setup
```bash
# Set environment variables
export JWT_SECRET="your-super-secret-jwt-key"
export DATABASE_URL="postgresql://user:password@localhost:5432/finsathi"
export NODE_ENV="development"
export PORT=3001
```

## Troubleshooting

### Common Issues
1. **Token not working**: Check token format and expiry
2. **Rate limiting**: Verify IP and headers
3. **Database errors**: Check connection and migrations
4. **CORS issues**: Verify frontend URL in CORS config

### Debug Commands
```bash
# Check token content (development only)
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('your_token'), null, 2))"

# Test password hashing
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('password123', 12).then(console.log);
"
```

This authentication system provides a secure foundation for FinSathi AI with proper error handling, rate limiting, and security best practices.
