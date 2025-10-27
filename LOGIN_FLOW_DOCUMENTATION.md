# Secure Login Flow Documentation

## Overview

This API implements a highly secure email-verified login system with JWT authentication. The flow includes:
1. Email/password verification
2. Email-based 6-digit code verification
3. Ultra-secure JWT token generation

## Setup

### 1. Generate JWT Secrets

Run the secret generator script:
```bash
node utils/generateJWTSecrets.js
```

### 2. Add to .env File

Add the generated secrets to your `.env` file:
```env
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-refresh-secret>
JWT_ISSUER=myapi
JWT_AUDIENCE=myapi-users
LINK=http://localhost:3000/  # Your frontend URL
```

### 3. Database Migration

The validation model now supports `login_verification` type. If you're using migrations, you may need to update your database schema to include this new ENUM value.

## Login Flow

### Step 1: Initiate Login

**Endpoint:** `POST /login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login verification email sent",
  "data": {
    "validationId": "abc123...",
    "email": "user@example.com",
    "expiresAt": "2025-10-27T10:30:00.000Z",
    "emailSent": true
  }
}
```

**What Happens:**
- Validates email and password
- Checks for existing unused `login_verification` token
  - If exists and not expired → Resends same token
  - If exists but expired → Creates new token
  - If doesn't exist → Creates new token
- Sends email with:
  - Magic link containing validationId
  - 6-digit verification code
  - Login details (IP, device, location)
  - Expiration time (15 minutes)

**Error Responses:**
- `401` - Invalid credentials
- `500` - Server error

---

### Step 2: Click Magic Link (Optional)

**Endpoint:** `GET /login-verify/:validationId`

User clicks the magic link in their email. Frontend displays a page to enter the 6-digit code.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "type": "login_verification",
    "expiresAt": "2025-10-27T10:30:00.000Z",
    "attemptsRemaining": 5
  }
}
```

**Error Responses:**
- `400` - Invalid validation type
- `404` - Token not found
- `410` - Token expired or already used

---

### Step 3: Submit 6-Digit Code

**Endpoint:** `POST /login-verify/:validationId`

**Request:**
```json
{
  "token": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "abc123def456",
      "fullname": "John Doe",
      "email": "user@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

**What Happens:**
- Verifies the 6-digit code
- Marks validation token as used
- Generates JWT token pair:
  - **Access Token**: Short-lived (15 minutes), contains user info
  - **Refresh Token**: Long-lived (7 days), for refreshing access token
- Returns user data and tokens

**Error Responses:**
- `400` - Missing validation ID or token
- `401` - Invalid verification code
- `404` - Token or user not found
- `410` - Token expired or already used
- `429` - Maximum attempts exceeded (5 attempts allowed)

---

## Security Features

### 1. Ultra-Secure JWT Tokens

**Algorithm:** HS512 (strongest HMAC algorithm)

**Access Token (15 minutes):**
- Contains: userId, email, fullname, type, jti (JWT ID), iat (issued at)
- Short expiration for security
- Used for API authentication

**Refresh Token (7 days):**
- Contains: userId, type, jti, iat (minimal data)
- Separate secret from access token
- Used to obtain new access tokens

**Features:**
- Cryptographically secure secrets (128 hex characters)
- JWT ID (jti) for token tracking/revocation
- Issuer and audience validation
- Type checking (access vs refresh)
- Automatic expiration handling

### 2. Email Verification Security

- **Token Type:** 6-digit numeric code
- **Expiration:** 15 minutes
- **Max Attempts:** 5 attempts before lockout
- **One-Time Use:** Token invalidated after successful verification
- **Auto-Regeneration:** Expired tokens automatically regenerated on new login

### 3. Additional Security Measures

- **Password Hashing:** Bcrypt with 12 rounds
- **Device Tracking:** IP, browser, OS, device info logged
- **Rate Limiting:** 5 failed attempts per token
- **Secure Email:** Login details included in email for user awareness
- **Token Reuse Prevention:** Used tokens cannot be reused

---

## Using JWT Tokens

### Making Authenticated Requests

Include the access token in the Authorization header:

```javascript
fetch('https://api.example.com/protected-endpoint', {
  headers: {
    'Authorization': 'Bearer <accessToken>',
    'Content-Type': 'application/json'
  }
})
```

### Token Verification Middleware (Example)

```javascript
import { verifyAccessToken } from './utils/jwtUtils.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: error.message
    });
  }
};

// Use in routes
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is protected data',
    user: req.user
  });
});
```

---

## Email Template

The login email includes:
- 🔐 Secure Login header
- Login details (IP, device, location, timestamp)
- Magic link button
- 6-digit verification code (large, prominent display)
- Expiration warning (15 minutes)
- Security warning if user didn't initiate login

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| `INVALID_CREDENTIALS` | Wrong email/password | User should retry with correct credentials |
| `NOT_FOUND` | Token doesn't exist | Token may have been deleted or never created |
| `INVALID_TYPE` | Wrong validation type | Token is for different purpose (e.g., email verification) |
| `EXPIRED` | Token past expiration | User should request new login |
| `ALREADY_USED` | Token already consumed | User should request new login |
| `MAX_ATTEMPTS_EXCEEDED` | Too many failed attempts | User should request new login |
| `INVALID_TOKEN` | Wrong verification code | User should retry with correct code |
| `USER_NOT_FOUND` | User deleted after token creation | Rare edge case |

---

## Testing the Flow

### 1. Test Login Initiation
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Check Email
Look for the 6-digit code in the email.

### 3. Test Magic Link
```bash
curl http://localhost:3000/login-verify/VALIDATION_ID
```

### 4. Submit Verification Code
```bash
curl -X POST http://localhost:3000/login-verify/VALIDATION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

### 5. Use Access Token
```bash
curl http://localhost:3000/protected-endpoint \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Best Practices

1. **Store Tokens Securely**
   - Use httpOnly cookies for web apps
   - Use secure storage for mobile apps
   - Never store in localStorage (XSS vulnerable)

2. **Handle Token Expiration**
   - Implement token refresh logic
   - Redirect to login when refresh token expires

3. **Monitor for Suspicious Activity**
   - Log all login attempts
   - Alert users of logins from new devices
   - Implement IP-based rate limiting

4. **Environment Variables**
   - Never commit .env to version control
   - Use different secrets for dev/staging/production
   - Rotate secrets periodically

5. **Email Security**
   - Use SPF, DKIM, DMARC for email authentication
   - Monitor email delivery rates
   - Implement fallback mechanisms

---

## Troubleshooting

### "JWT_SECRET must be set" Error
- Run `node utils/generateJWTSecrets.js`
- Add secrets to `.env` file
- Restart your server

### Email Not Sending
- Check email configuration in `config/emailConfig.js`
- Verify SMTP credentials
- Check spam folder
- Review email service logs

### Token Always Expired
- Check server timezone settings
- Verify system clock is correct
- Review token expiration configuration

### "Invalid token type" Error
- Ensure you're using access token for API requests
- Don't use refresh token for authentication
- Check token hasn't been tampered with

---

## Future Enhancements

Possible additions:
- Refresh token rotation
- Token revocation/blacklist
- Remember me functionality
- Biometric authentication
- WebAuthn/FIDO2 support
- Session management
- Multi-device tracking

---

## Support

For issues or questions:
1. Check error codes and messages
2. Review this documentation
3. Check application logs
4. Contact development team
