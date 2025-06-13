# CV Builder API Documentation

## Table of Contents
- [Authentication API](#authentication-api)
- [Profile API](#profile-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication API

### Base URL
```
/api/auth
```

### Register User
**POST** `/register`

Creates a new user account with candidate or HR role.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "candidate"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "isVerified": false,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### Login User
**POST** `/login`

Authenticates user and returns access tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "lastLogin": "2024-01-15T14:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### Refresh Token
**POST** `/refresh`

Refreshes expired access token using refresh token.

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
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User
**GET** `/me`

Returns current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate",
    "isVerified": true,
    "lastLogin": "2024-01-15T14:30:00Z"
  }
}
```

---

### Forgot Password
**POST** `/forgot-password`

Initiates password reset process by sending reset token to user's email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

**Rate Limit:** 3 requests per hour

---

### Reset Password
**POST** `/reset-password`

Resets user password using reset token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

---

### Verify Email
**GET** `/verify-email/:token`

Verifies user email address using verification token.

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

---

### Logout
**POST** `/logout`

Logs out user (mainly for client-side token cleanup).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Profile API

### Base URL
```
/api/profiles
```

**All profile endpoints require authentication unless specified otherwise.**

## Candidate Profile

### Get Candidate Profile
**GET** `/candidate`

Returns candidate profile with statistics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "candidate"
    },
    "profile": {
      "id": 1,
      "userId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Experienced software developer",
      "title": "Senior Developer",
      "location": "New York, NY",
      "phone": "+1234567890",
      "avatar": "/uploads/avatars/avatar_1_uuid.jpg",
      "currentSalary": 75000,
      "expectedSalary": 85000,
      "skills": ["JavaScript", "React", "Node.js"],
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "profileVisibility": "public",
      "profileViews": 42
    },
    "stats": {
      "totalCVs": 3,
      "profileViews": 42,
      "lastLogin": "2024-01-15T14:30:00Z",
      "memberSince": "2024-01-01T10:00:00Z",
      "profileCompleteness": 85
    }
  }
}
```

---

### Update Candidate Profile
**PUT** `/candidate`

Updates candidate profile information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Experienced full-stack developer with 5+ years",
  "title": "Senior Full-Stack Developer",
  "location": "San Francisco, CA",
  "phone": "+1234567890",
  "website": "https://johndoe.dev",
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "currentSalary": 75000,
  "expectedSalary": 90000,
  "salaryNegotiable": true,
  "availabilityDate": "2024-03-01T00:00:00Z",
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "languages": ["English", "Spanish"],
  "preferredRoles": ["Frontend Developer", "Full-Stack Developer"],
  "preferredIndustries": ["Technology", "Fintech"],
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.dev"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Candidate profile updated successfully",
  "data": {
    "id": 1,
    "userId": 1,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### Update Candidate Privacy Settings
**PUT** `/candidate/privacy`

Updates candidate privacy and visibility settings.

**Request Body:**
```json
{
  "profileVisibility": "public",
  "showEmail": false,
  "showPhone": true,
  "showSalary": false,
  "allowHrContact": true,
  "emailNotifications": true,
  "jobAlerts": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "data": {
    "id": 1,
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": true
  }
}
```

---

### Upload Candidate Avatar
**POST** `/candidate/avatar`

Uploads and processes candidate profile avatar.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
avatar: <image_file> (JPEG, PNG, WebP - max 5MB)
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "/uploads/avatars/avatar_1_uuid.jpg",
    "filename": "avatar_1_uuid.jpg",
    "size": 245678
  }
}
```

**Rate Limit:** 10 uploads per hour

---

### Delete Candidate Avatar
**DELETE** `/candidate/avatar`

Removes candidate profile avatar.

**Response:**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

---

## HR Profile

### Get HR Profile
**GET** `/hr`

Returns HR profile with statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "username": "hrmanager",
      "email": "hr@company.com",
      "role": "hr"
    },
    "profile": {
      "id": 1,
      "userId": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "jobTitle": "HR Manager",
      "department": "Human Resources",
      "companyName": "Tech Corp",
      "companyWebsite": "https://techcorp.com",
      "companySize": "medium",
      "companyIndustry": "Technology",
      "companyLocation": "Austin, TX",
      "yearsOfExperience": 8,
      "specializations": ["Technical Recruiting", "Talent Acquisition"],
      "canPostJobs": true,
      "monthlyJobPostLimit": 10
    },
    "stats": {
      "totalJobsPosted": 15,
      "totalCandidatesContacted": 47,
      "lastLogin": "2024-01-15T14:30:00Z",
      "memberSince": "2024-01-01T10:00:00Z",
      "profileCompleteness": 92
    }
  }
}
```

---

### Update HR Profile
**PUT** `/hr`

Updates HR profile information.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "jobTitle": "Senior HR Manager",
  "department": "Human Resources",
  "phone": "+1234567890",
  "companyName": "Tech Corp Inc",
  "companyWebsite": "https://techcorp.com",
  "companySize": "large",
  "companyIndustry": "Technology",
  "companyLocation": "Austin, TX",
  "companyDescription": "Leading technology solutions provider",
  "yearsOfExperience": 8,
  "specializations": ["Technical Recruiting", "Talent Acquisition", "Team Building"],
  "hiringSectors": ["Software Development", "Data Science", "DevOps"],
  "preferredContactMethod": "email",
  "linkedinUrl": "https://linkedin.com/in/janesmith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "HR profile updated successfully",
  "data": {
    "id": 1,
    "userId": 2,
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

---

### Upload HR Avatar
**POST** `/hr/avatar`

Uploads HR profile avatar (same format as candidate avatar).

---

### Delete HR Avatar
**DELETE** `/hr/avatar`

Removes HR profile avatar (same format as candidate avatar).

---

## Public Profiles

### Get Public Candidate Profile
**GET** `/candidate/:id/public`

Returns public candidate profile for HR users to view.

**Parameters:**
- `id` (number): Candidate profile ID

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Experienced software developer",
    "title": "Senior Developer",
    "location": "New York, NY",
    "skills": ["JavaScript", "React", "Node.js"],
    "profileViews": 43,
    "user": {
      "username": "johndoe",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

---

## Search

### Search Candidates
**GET** `/search/candidates`

Searches for candidates (HR users only).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Query Parameters:**
```
query=javascript          // General search term
location=new+york         // Location filter
skills=react,node         // Comma-separated skills
experience=senior         // Experience level
minSalary=70000          // Minimum expected salary
maxSalary=100000         // Maximum expected salary
availability=immediate    // Availability status
workPreferences=remote,hybrid // Work preferences
page=1                   // Page number (default: 1)
limit=20                 // Results per page (default: 20, max: 50)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "title": "Senior Developer",
        "location": "New York, NY",
        "skills": ["JavaScript", "React", "Node.js"],
        "expectedSalary": 85000,
        "user": {
          "username": "johndoe"
        }
      }
    ],
    "total": 156,
    "pages": 8
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

**Rate Limit:** 30 searches per minute

---

## Activity Logs

### Get Profile Activity Log
**GET** `/activity`

Returns user's profile activity history.

**Query Parameters:**
```
limit=50     // Number of activities (default: 50)
offset=0     // Offset for pagination (default: 0)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "profileType": "candidate",
      "action": "profile_update",
      "description": "Candidate profile updated",
      "metadata": {},
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-15T14:30:00Z"
    },
    {
      "id": 2,
      "userId": 1,
      "profileType": "candidate",
      "action": "avatar_update",
      "description": "Profile avatar updated",
      "metadata": {},
      "createdAt": "2024-01-15T13:20:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 2
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required or invalid |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Error Types

| Error Type | Description |
|------------|-------------|
| `ValidationError` | Request data validation failed |
| `AuthenticationError` | Invalid or missing authentication |
| `AuthorizationError` | Insufficient permissions |
| `NotFoundError` | Requested resource not found |
| `RateLimitError` | Rate limit exceeded |

---

## Rate Limiting

### Authentication Endpoints
- **Register/Login**: 5 requests per 15 minutes per IP
- **Forgot Password**: 3 requests per hour per IP

### Profile Endpoints
- **Avatar Upload**: 10 uploads per hour per user
- **Search**: 30 searches per minute per user

### Rate Limit Headers
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1642248000
```

---

## Authentication

### JWT Token Structure
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "iat": 1642248000,
  "exp": 1642249800
}
```

### Token Expiry
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days

### Authorization Header
```
Authorization: Bearer <access_token>
```

---

## File Upload Specifications

### Avatar Upload
- **Supported formats**: JPEG, PNG, WebP
- **Maximum size**: 5MB
- **Processing**: Automatically resized to 300x300px
- **Output format**: JPEG with 90% quality

### Upload Security
- File type validation
- Size limits enforced
- Automatic image processing
- Secure file naming with UUIDs

---

## Example Usage

### Complete Authentication Flow

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "candidate"
  }'
```

2. **Login with credentials:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

3. **Access protected profile endpoint:**
```bash
curl -X GET http://localhost:3000/api/profiles/candidate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Profile Management Flow

1. **Update candidate profile:**
```bash
curl -X PUT http://localhost:3000/api/profiles/candidate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Experienced software developer",
    "title": "Senior Developer",
    "location": "New York, NY"
  }'
```

2. **Upload profile avatar:**
```bash
curl -X POST http://localhost:3000/api/profiles/candidate/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "avatar=@profile-photo.jpg"
```

3. **Search candidates (HR only):**
```bash
curl -X GET "http://localhost:3000/api/profiles/search/candidates?query=javascript&location=new+york&skills=react,node" \
  -H "Authorization: Bearer YOUR_HR_ACCESS_TOKEN"
```

---

## Security Best Practices

### Token Management
- Store tokens securely (HttpOnly cookies recommended for web)
- Implement automatic token refresh
- Clear tokens on logout
- Validate tokens on each request

### Password Security
- Minimum 6 characters required
- Passwords are hashed using bcrypt
- Reset tokens expire after use
- Rate limiting on password attempts

### File Upload Security
- File type validation
- Size limits enforced
- Virus scanning recommended
- Secure file storage with unique names

### API Security
- HTTPS required in production
- CORS properly configured
- Rate limiting implemented
- Input validation on all endpoints

---

This documentation provides a comprehensive guide to the Authentication and Profile APIs for the CV Builder application. All endpoints are production-ready with proper validation, error handling, and security measures.