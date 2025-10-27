# myAPI - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Security Features](#security-features)
6. [Testing Guide](#testing-guide)

---

## Overview

myAPI is a secure Node.js/Express REST API with email-based authentication, JWT tokens, and comprehensive user management. The API follows a passwordless login approach with magic links and verification codes for enhanced security.

### Architecture

```
Request Flow:
Browser → Route → Controller → Service → Model → Database
                                      ↓
                                   Utils (JWT, Email, Device Info)
```

### Key Features

- **Passwordless Authentication**: Magic links + 6-digit verification codes
- **JWT Tokens**: Ultra-secure HS512 algorithm with access & refresh tokens
- **Email Verification**: Account activation via email
- **Password Reset**: Secure password recovery flow
- **Device Tracking**: IP, browser, OS, and location logging
- **Token Refresh**: Automatic token rotation for security

---

## Authentication Flow

### Registration Flow

1. User submits registration details
2. System creates account and validation token
3. Email sent with magic link + verification code
4. User clicks link and enters code
5. Account activated

### Login Flow

1. User submits email/password
2. System validates credentials
3. Email sent with magic link + verification code
4. User clicks link (auto-login) OR enters code manually
5. System returns JWT tokens (access + refresh)
6. User makes authenticated requests

### Token Refresh Flow

1. Access token expires (15 minutes)
2. Client sends refresh token to `/refresh-token`
3. System validates refresh token
4. New token pair returned
5. Client updates stored tokens

---

## API Endpoints

### Base URL

```
http://localhost:3000/api/users
```

---

### 1. User Registration

**POST** `/saveUser`

Register a new user account and send verification email.

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "registration Successful",
  "data": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-10-27T10:00:00.000Z",
    "usertoken": "abc123def456",
    "valToken": "validation-id-here"
  }
}
```

**Error Responses:**
- `400` - Validation error or duplicate email
- `500` - Server error

**What Happens:**
- Password hashed with bcrypt (12 rounds)
- Validation token created (expires in 24 hours)
- Verification email sent with magic link
- Device info captured (IP, browser, OS, country)

---

### 2. Verify Email (Magic Link)

**GET** `/magic_link/:id`

Verify the magic link status when user clicks email link.

**URL Parameters:**
- `id` - Validation ID from email

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "type": "email_verification",
    "expiresAt": "2025-10-28T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation ID missing
- `404` - Token not found
- `410` - Token expired or already used

---

### 3. Login (Send Verification Email)

**POST** `/login`

Initiate login process - validates credentials and sends verification email.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login verification email sent",
  "data": {
    "validationId": "login-validation-id",
    "email": "john@example.com",
    "expiresAt": "2025-10-27T10:15:00.000Z",
    "emailSent": true
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

**What Happens:**
- Credentials validated
- Login verification token created (expires in 15 minutes)
- Email sent with magic link + 6-digit code
- Device and location info included in email

---

### 4. Verify Login Link (Auto-Login)

**GET** `/login-verify/:id`

Auto-login via magic link - returns JWT tokens immediately.

**URL Parameters:**
- `id` - Validation ID from email

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "abc123def456",
      "createdAt": "2025-10-27T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzUxMi...",
    "refreshToken": "eyJhbGciOiJIUzUxMi...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses:**
- `400` - Invalid validation type
- `404` - Token or user not found
- `410` - Token expired or already used

**What Happens:**
- Validation link verified
- Token marked as used
- JWT token pair generated
- User logged in automatically

---

### 5. Refresh Access Token

**POST** `/refresh-token`

Get a new access token using refresh token when the old one expires.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzUxMi..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMi...",
    "refreshToken": "eyJhbGciOiJIUzUxMi...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**Error Responses:**
- `400` - Refresh token missing
- `401` - Invalid or expired refresh token
- `404` - User not found
- `500` - Server error

**What Happens:**
- Refresh token validated
- New access token generated (15 min expiry)
- New refresh token generated (7 day expiry)
- Token rotation for security

**Important:**
- Always update BOTH tokens in client storage
- Old refresh token becomes invalid after use
- Prevents token reuse attacks

---

### 6. Forgot Password

**POST** `/forgot-password`

Request password reset link via email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent",
  "data": {
    "emailSent": true
  }
}
```

**Error Responses:**
- `400` - Email missing
- `500` - Server error

**What Happens:**
- System checks if user exists (doesn't reveal if email exists)
- Password reset token created (expires in 1 hour)
- Email sent with magic link
- Always returns success (prevents email enumeration)

---

### 7. Verify Password Reset Link

**GET** `/reset-password/:id`

Verify the password reset link is valid.

**URL Parameters:**
- `id` - Validation ID from email

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "validationId": "reset-validation-id",
    "expiresAt": "2025-10-27T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid validation type
- `404` - Token not found
- `410` - Token expired or already used

---

### 8. Reset Password

**POST** `/reset-password/:id`

Submit new password after verifying reset link.

**URL Parameters:**
- `id` - Validation ID from email

**Request Body:**
```json
{
  "password": "NewSecurePass456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error Responses:**
- `400` - Missing validation ID or password
- `404` - Token or user not found
- `410` - Token expired or already used

**What Happens:**
- Reset link verified
- Password updated (automatically hashed)
- Token marked as used
- User can login with new password

---

### 9. Get Current User (Protected)

**GET** `/`

Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "abc123def456",
    "fullname": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-10-27T10:00:00.000Z",
    "updatedAt": "2025-10-27T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - No token provided, invalid token, or expired token
- `404` - User not found
- `500` - Server error

**Authentication:**
- Requires valid access token in Authorization header
- Token must be prefixed with "Bearer "
- Example: `Authorization: Bearer eyJhbGciOiJIUzUxMi...`

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

| Code | HTTP Status | Meaning | Action |
|------|-------------|---------|--------|
| `NO_TOKEN` | 401 | No authorization token provided | Include Authorization header |
| `INVALID_FORMAT` | 401 | Invalid authorization format | Use "Bearer <token>" format |
| `EMPTY_TOKEN` | 401 | Token is empty | Provide valid token |
| `INVALID_TOKEN` | 401 | Token is invalid or malformed | Login again |
| `AUTH_FAILED` | 401 | Authentication failed | Check token validity |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password | Verify credentials |
| `NOT_FOUND` | 404 | Resource not found | Check ID or URL |
| `INVALID_TYPE` | 400 | Wrong validation type | Use correct endpoint |
| `EXPIRED` | 410 | Token/link expired | Request new token/link |
| `ALREADY_USED` | 410 | Token already used | Request new token |
| `MAX_ATTEMPTS_EXCEEDED` | 429 | Too many failed attempts | Request new verification |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid | Login again |
| `USER_NOT_FOUND` | 404 | User doesn't exist | Check user ID |

---

## Security Features

### 1. JWT Tokens

**Algorithm:** HS512 (strongest HMAC)

**Access Token:**
- **Lifespan:** 15 minutes
- **Contains:** userId, email, fullname, type, jti, iat
- **Purpose:** API authentication
- **Secret:** JWT_SECRET (128 hex chars)

**Refresh Token:**
- **Lifespan:** 7 days
- **Contains:** userId, type, jti, iat (minimal data)
- **Purpose:** Obtain new access tokens
- **Secret:** JWT_REFRESH_SECRET (separate from access secret)

**Features:**
- Automatic token rotation (refresh tokens change on each use)
- JWT ID (jti) for tracking/revocation
- Issuer and audience validation
- Type checking (access vs refresh)
- Expiration handling

### 2. Password Security

- **Algorithm:** bcrypt
- **Rounds:** 12 (configurable)
- **Salt:** Automatically generated per password
- **Storage:** Never stored in plain text
- **Validation:** Constant-time comparison

### 3. Email Verification

- **Token Type:** 6-digit numeric code + magic link
- **Expiration:** Configurable (15 min - 24 hours)
- **Max Attempts:** 5 attempts before lockout
- **One-Time Use:** Tokens invalidated after use
- **Auto-Regeneration:** Expired tokens can be regenerated

### 4. Device Tracking

Captured on every login/registration:
- IP address
- User agent
- Browser type
- Operating system
- Device type
- Country (via GeoIP)

### 5. Additional Security

- **Rate Limiting:** 5 failed attempts per token
- **Email Enumeration Protection:** Doesn't reveal if email exists
- **Token Reuse Prevention:** Used tokens cannot be reused
- **Secure Email:** Login details in email for awareness
- **HTTPS Recommended:** Always use HTTPS in production

---

## Testing Guide

### Using cURL

#### 1. Register User
```bash
curl -X POST http://localhost:3000/api/users/saveUser \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "phone": "+1234567890"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

#### 3. Verify Login Link (Copy validationId from email)
```bash
curl http://localhost:3000/api/users/login-verify/VALIDATION_ID
```

#### 4. Get User Profile (Use accessToken from step 3)
```bash
curl http://localhost:3000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Refresh Token (Use refreshToken from step 3)
```bash
curl -X POST http://localhost:3000/api/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### 6. Forgot Password
```bash
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### 7. Reset Password (Copy validationId from email)
```bash
curl -X POST http://localhost:3000/api/users/reset-password/VALIDATION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewPassword123!"
  }'
```

### Using JavaScript/Fetch

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!'
  })
});
const loginData = await loginResponse.json();

// 2. Verify login link (after clicking email)
const verifyResponse = await fetch(`http://localhost:3000/api/users/login-verify/${validationId}`);
const { data } = await verifyResponse.json();

// 3. Store tokens
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// 4. Make authenticated request
const userResponse = await fetch('http://localhost:3000/api/users/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
const userData = await userResponse.json();

// 5. Refresh token when expired
const refreshResponse = await fetch('http://localhost:3000/api/users/refresh-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refreshToken')
  })
});
const newTokens = await refreshResponse.json();

// Update stored tokens
localStorage.setItem('accessToken', newTokens.data.accessToken);
localStorage.setItem('refreshToken', newTokens.data.refreshToken);
```

### Testing with Postman

1. **Import Collection:**
   - Create a new collection "myAPI"
   - Add environment variables:
     - `baseUrl`: `http://localhost:3000/api/users`
     - `accessToken`: (will be set automatically)
     - `refreshToken`: (will be set automatically)

2. **Test Endpoints:**
   - Use `{{baseUrl}}/login` with POST method
   - Save response tokens to environment variables
   - Use `{{accessToken}}` in Authorization header

3. **Automatic Token Refresh:**
   - Add pre-request script to check token expiration
   - Auto-refresh if needed before each request

---

## Best Practices

### Client-Side Implementation

1. **Token Storage:**
   - Use httpOnly cookies (most secure)
   - Avoid localStorage (XSS vulnerable)
   - Use secure storage on mobile

2. **Token Refresh:**
   - Implement automatic refresh before expiration
   - Handle 401 errors gracefully
   - Redirect to login when refresh fails

3. **Error Handling:**
   - Check `success` field in all responses
   - Display user-friendly error messages
   - Log errors for debugging

### Server-Side Implementation

1. **Environment Variables:**
   - Never commit `.env` to version control
   - Use different secrets for dev/staging/production
   - Rotate secrets periodically

2. **Database:**
   - Use connection pooling
   - Implement database backups
   - Monitor query performance

3. **Email:**
   - Configure SPF, DKIM, DMARC
   - Monitor delivery rates
   - Handle bounce emails

4. **Monitoring:**
   - Log all authentication attempts
   - Alert on suspicious activity
   - Track API usage

---

## Environment Variables

Required environment variables in `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306

# JWT Secrets (Generate with: node utils/generateJWTSecrets.js)
JWT_SECRET=your_64_char_hex_secret
JWT_REFRESH_SECRET=your_64_char_hex_secret
JWT_ISSUER=myapi
JWT_AUDIENCE=myapi-users

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@myapi.com

# Application
PORT=3000
NODE_ENV=development
LINK=http://localhost:3000/  # Frontend URL for magic links
```

---

## Troubleshooting

### "JWT_SECRET must be set" Error
- Run: `node utils/generateJWTSecrets.js`
- Copy secrets to `.env`
- Restart server

### "Token has expired" Error
- Use `/refresh-token` endpoint with refresh token
- If refresh token also expired, login again

### Email Not Sending
- Verify SMTP credentials in `.env`
- Check firewall/port blocking
- Review email service logs
- Check spam folder

### Database Connection Error
- Verify database is running
- Check credentials in `.env`
- Ensure database exists
- Check network connectivity

### 401 Unauthorized
- Verify token is included in header
- Check token format: `Bearer <token>`
- Ensure token hasn't expired
- Verify JWT secrets match

---

## Support & Contributing

### Getting Help
1. Check this documentation
2. Review error codes and messages
3. Check application logs
4. Consult LOGIN_FLOW_DOCUMENTATION.md

### Reporting Issues
- GitHub Issues: [apiforSiteManagent/issues](https://github.com/EHenryRichard/apiforSiteManagent/issues)
- Include error messages and steps to reproduce
- Provide relevant logs (remove sensitive data)

### Contributing
- Fork the repository
- Create feature branch
- Submit pull request
- Follow existing code style

---

## License

ISC

---

## Changelog

### Version 1.0.0 (Current)
- User registration with email verification
- Email/password login with verification
- JWT access and refresh tokens
- Password reset flow
- Device tracking
- Token refresh with rotation
- Protected routes with authentication middleware

---

**Last Updated:** 2025-10-27
