# FinSathi AI - Security Implementation

## Overview

This document outlines the comprehensive security measures implemented for the FinSathi AI platform.

## Security Architecture

### 1. Authentication & Authorization

**JWT Implementation:**
- Token-based authentication with Bearer scheme
- Access tokens expire in 15 minutes
- Refresh tokens for session management
- Token blacklist for forced logout

```javascript
// Middleware: server/src/middleware/auth.js
- authenticate: Validates JWT token
- authorize: Checks subscription plan
- optionalAuth: Optional authentication
```

**Password Security:**
- PBKDF2 with SHA-512 (100,000 iterations)
- Unique salt per password
- No plaintext storage

### 2. API Rate Limiting

**Existing Implementation:** `server/src/middleware/rateLimit.js`

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General API | 100 | 15 min |
| Auth | 10 | 15 min |
| Strict | 5 | 15 min |
| Free Plan | 50 | 15 min |
| PRO Plan | 1,000 | 15 min |
| Investor | 5,000 | 15 min |

### 3. Input Validation & Sanitization

**Validation:**
- Email format validation
- Phone number validation (Nepal format)
- URL validation
- Credit card validation
- MongoDB ObjectID validation

**Sanitization:**
- HTML entity escaping
- SQL injection pattern detection
- XSS prevention
- Input trimming

### 4. Security Headers

**Helmet Configuration:**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### 5. DDoS Protection

- Request rate limiting per IP
- Automatic IP blocking after threshold
- Cleanup of stale request data

### 6. Database Security

**Prisma ORM Protection:**
- Parameterized queries (built-in)
- No raw SQL from user input
- Connection pooling

**Best Practices:**
```javascript
// ✅ Safe - uses parameterized queries
await prisma.user.findUnique({ where: { id: userId } });

// ❌ Unsafe - avoid raw queries with user input
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

### 7. CORS Configuration

- Whitelisted origins only
- Credentials allowed
- Exposed rate limit headers

### 8. Request Security

- Request size limiting (10MB max)
- IP whitelisting support
- API key authentication for server-to-server

### 9. Audit Logging

All sensitive operations are logged:
- Authentication attempts
- Data modifications
- Admin actions
- Payment operations

## Environment Security Variables

```env
# Required
JWT_SECRET=min_32_characters_long_secure_random_string
ALLOWED_ORIGINS=https://finsathi.ai,https://www.finsathi.ai
API_KEYS=key1,key2,key3

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_...
KHALTI_SECRET_KEY=...
```

## Security Checklist

- [x] JWT authentication
- [x] Rate limiting
- [x] Input sanitization
- [x] Security headers (Helmet)
- [x] SQL injection prevention
- [x] CORS configuration
- [x] DDoS basic protection
- [x] Password hashing
- [x] Audit logging
- [ ] 2FA implementation
- [ ] Web Application Firewall
- [ ] DDoS protection service (Cloudflare)

## Usage Example

```javascript
const security = require('./middleware/security');
const { authenticate } = require('./middleware/auth');
const { generalLimiter, authLimiter } = require('./middleware/rateLimit');

app.use(security.securityHeaders);
app.use(security.ddosProtection.check);
app.use(security.sanitizeInput);
app.use(security.preventSQLInjection);
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// Protected route
app.get('/api/user', authenticate, security.auditLog('USER_VIEW'), userController.get);
```

## External Security Services

For production, consider:

1. **Cloudflare** - DDoS protection, WAF
2. **AWS WAF** - Web application firewall  
3. **Vault** - Secrets management
4. **Snyk** - Dependency scanning

## Incident Response

If security breach detected:
1. Isolate affected systems
2. Revoke all active tokens
3. Rotate API keys and secrets
4. Notify affected users
5. Document incident
6. Apply fixes
