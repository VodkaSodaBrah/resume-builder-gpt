# Security Documentation

## Overview

This document describes the security measures implemented in the Resume Builder GPT application following a comprehensive security audit.

## Security Measures Implemented

### 1. Authentication Security

#### JWT Secret Validation (CRITICAL - Fixed)
- **Before**: JWT_SECRET had a weak hardcoded fallback value
- **After**: Application now fails to start if JWT_SECRET is not set or is less than 32 characters
- **Location**: `api/lib/auth.ts:6-13`

```typescript
// Application will not start without a proper secret
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set.');
}
if (JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long.');
}
```

#### Password Requirements (Strengthened)
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- **Location**: `api/lib/auth.ts:17-52`

#### Rate Limiting on Authentication
- Login: 5 attempts per minute per IP
- Signup: 5 attempts per minute per IP
- Automatic lockout with retry-after headers
- **Location**: `api/lib/security.ts:1-100`

### 2. Injection Prevention (CRITICAL - Fixed)

#### NoSQL Injection Prevention
- All user inputs are validated against UUID regex before use in queries
- Query parameters are sanitized using Azure Table Storage OData escaping
- **Location**: `api/lib/auth.ts:54-63`

```typescript
const sanitizeForTableQuery = (input: string): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-...$/i;
  if (!uuidRegex.test(input)) {
    throw new Error('Invalid identifier format');
  }
  return input.replace(/'/g, "''");
};
```

### 3. Data Exposure Prevention (CRITICAL - Fixed)

#### Verification Token Exposure Removed
- **Before**: Verification tokens were logged and returned in development mode
- **After**: Tokens are never exposed in responses or logs
- **Location**: `api/auth/signup.ts:59-68`

#### Secure Blob Container Access
- **Before**: Blob container had public read access
- **After**: Container is private; access requires authentication
- **Location**: `api/lib/storage.ts:49-56`

### 4. Security Headers

#### Content Security Policy
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https://api.openai.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

#### Additional Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Permissions-Policy: accelerometer=(), camera=(), ...`

**Location**: `staticwebapp.config.json:26-34`

### 5. Client-Side Security

#### Secure Token Storage
- **Before**: Tokens stored in localStorage (persistent, XSS vulnerable)
- **After**: Tokens stored in sessionStorage (cleared on tab close)
- Automatic token expiration checking every 60 seconds
- Expiration validation on page load/rehydration
- **Location**: `src/stores/authStore.ts`

### 6. Security Event Logging

All security events are logged for monitoring:
- `AUTH_FAILURE` - Failed login attempts
- `RATE_LIMIT_EXCEEDED` - Rate limit violations
- `INVALID_TOKEN` - Invalid JWT tokens
- `SUSPICIOUS_INPUT` - Malformed input detection
- `UNAUTHORIZED_ACCESS` - Unauthorized resource access
- `CSRF_FAILURE` - CSRF token validation failures

**Location**: `api/lib/security.ts:195-235`

## Configuration Requirements

### Required Environment Variables

```bash
# REQUIRED - Must be at least 32 characters
JWT_SECRET=<generate-a-secure-random-string>

# Recommended
ALLOWED_ORIGINS=https://your-domain.com
```

### Generate a Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

## Security Checklist for Deployment

- [ ] JWT_SECRET is set and at least 32 characters
- [ ] ALLOWED_ORIGINS configured for production domain
- [ ] HTTPS enabled (enforced by Azure Static Web Apps)
- [ ] SendGrid configured for email verification
- [ ] Application Insights or similar monitoring enabled
- [ ] Regular security updates scheduled

## Vulnerability Response

If you discover a security vulnerability:

1. Do NOT open a public issue
2. Email security concerns to the project maintainers
3. Allow time for the issue to be addressed before disclosure

## Security Audit Summary

| Category | Status | Severity Fixed |
|----------|--------|----------------|
| JWT Secret | Fixed | CRITICAL |
| NoSQL Injection | Fixed | CRITICAL |
| Token Exposure | Fixed | CRITICAL |
| Blob Access | Fixed | CRITICAL |
| Rate Limiting | Implemented | CRITICAL |
| Password Strength | Enhanced | HIGH |
| Security Headers | Enhanced | HIGH |
| Token Storage | Improved | HIGH |
| Security Logging | Implemented | MEDIUM |

## Files Modified

- `api/lib/auth.ts` - JWT validation, password strength, query sanitization
- `api/lib/storage.ts` - Private blob container access
- `api/lib/security.ts` - NEW: Rate limiting, CSRF, security utilities
- `api/auth/login.ts` - Rate limiting, security headers, event logging
- `api/auth/signup.ts` - Rate limiting, token exposure fix, password validation
- `api/resume/list.ts` - Input validation, security headers
- `src/stores/authStore.ts` - Secure token storage, expiration checking
- `staticwebapp.config.json` - Enhanced security headers, strict CSP
- `api/local.settings.json` - Updated default values
