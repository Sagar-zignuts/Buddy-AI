# Authentication API Documentation

## Overview
This backend provides two authentication methods:
1. **Email/Password with OTP Verification**
2. **Google OAuth**

## Setup

### 1. Environment Variables
Create a `.env` file in the backend root with the following variables:

```env
# Server
PORT=3175

# MongoDB
MONGODB_URI=mongodb://localhost:27017/buddy

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Gemini API
GEMINI_API_KEY=your-gemini-api-key
```

### 2. MongoDB Setup
- Install MongoDB locally or use MongoDB Atlas
- Update `MONGODB_URI` in `.env`

### 3. Email Setup (Gmail)
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Go to Security > App passwords
4. Generate a new app password for "Mail"
5. Use this app password as `EMAIL_PASSWORD`

### 4. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:3175/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## API Endpoints

### 1. Send OTP
**POST** `/api/auth/send-otp`

Send OTP to user's email for registration or login.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",  // Required for new users
  "name": "User Name"         // Optional, for new users
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

Verify OTP and complete registration/login.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "name": "User Name"  // Optional, for new users
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "isEmailVerified": true
  }
}
```

### 3. Login (Direct)
**POST** `/api/auth/login`

Login with email and password (for already verified users).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "isEmailVerified": true
  }
}
```

### 4. Google OAuth
**GET** `/api/auth/google`

Initiate Google OAuth flow.

**Response:** Redirects to Google login page.

**GET** `/api/auth/google/callback`

OAuth callback (handled automatically).

**Response:** Redirects to frontend with token: `${FRONTEND_URL}/auth/callback?token=...&email=...&name=...`

### 5. Get Current User
**GET** `/api/auth/me`

Get current authenticated user (requires JWT token).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## User Schema

```javascript
{
  email: String (required, unique, lowercase)
  password: String (hashed with bcrypt, required for email auth)
  name: String
  googleId: String (unique, for Google OAuth users)
  isEmailVerified: Boolean (default: false)
  otp: {
    code: String,
    expiresAt: Date
  }
  loginHistory: [{
    loginAt: Date,
    ipAddress: String,
    userAgent: String
  }]
  createdAt: Date
  lastLoginAt: Date
}
```

## Authentication Flow

### Email/Password Flow:
1. User sends email and password → `POST /api/auth/send-otp`
2. OTP sent to email
3. User verifies OTP → `POST /api/auth/verify-otp`
4. JWT token returned
5. Use token in `Authorization: Bearer <token>` header for protected routes

### Google OAuth Flow:
1. User clicks "Login with Google" → `GET /api/auth/google`
2. Redirected to Google login
3. After approval, redirected to callback
4. JWT token returned via redirect URL
5. Frontend extracts token and stores it

## Testing

Run the test script:
```bash
node src/testAuth.js
```

Or use curl:
```bash
# Send OTP
curl -X POST http://localhost:3175/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'

# Verify OTP (replace with actual OTP from email)
curl -X POST http://localhost:3175/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Login
curl -X POST http://localhost:3175/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'

# Get current user
curl -X GET http://localhost:3175/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens for authentication
- ✅ OTP expires in 10 minutes
- ✅ Email verification required
- ✅ Login history tracking
- ✅ Protected routes with middleware
- ✅ Password not returned in API responses

