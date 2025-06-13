# Backend Architecture

## Overview

The CvCraftPro backend is built on Node.js with Express, providing APIs for CV data management, user authentication, AI services integration, and file operations. It employs a modular architecture to separate concerns and facilitate feature expansion.

## Core Modules

### User Management

Handles user accounts, authentication, and profiles:

- **Registration**: New user account creation
- **Authentication**: JWT-based login and session management
- **Profile Management**: User information and preferences
- **Subscription**: Paid plan management (if applicable)

### CV Management

Manages CV data storage, retrieval, and manipulation:

- **CRUD Operations**: Create, read, update, and delete CVs
- **Version History**: Track changes and maintain version history
- **Section Management**: Add, remove, and organize CV sections
- **Template Storage**: Access to template configurations

### AI Services

Integrates with multiple AI providers for content enhancement:

- **OpenAI Integration**: Using GPT-4o for advanced text generation
- **Claude Integration**: Using Claude 3.5 Sonnet for alternative content suggestions
- **Gemini Integration**: Using Google's Gemini models for additional capabilities
- **Content Enhancement**: AI-powered improvement of CV sections
- **CV Analysis**: Overall resume quality scoring and suggestions
- **Job Matching**: Adapting CV content for specific job descriptions

### Export Services

Handles generation of output files:

- **PDF Generation**: Converting CV data to PDF format
- **File Storage**: Temporary storage of generated files
- **Download Management**: Secure file delivery to clients

## API Structure

### Authentication API

```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Authenticate user
POST /api/auth/refresh      - Refresh access token
GET  /api/auth/me           - Get current user info
```

### CV API

```
GET    /api/cvs                 - List user's CVs
POST   /api/cvs                 - Create new CV
GET    /api/cvs/:id             - Get specific CV
PUT    /api/cvs/:id             - Update CV
DELETE /api/cvs/:id             - Delete CV
POST   /api/cvs/:id/export      - Export CV to format
GET    /api/cvs/:id/versions    - Get CV versions
POST   /api/cvs/:id/versions    - Create new version
PUT    /api/cvs/:id/restore/:vid - Restore version
```

### AI API

```
POST /api/ai/improve            - Improve section text
POST /api/ai/analyze            - Analyze full CV
POST /api/ai/adapt              - Adapt CV to job description
POST /api/ai/translate          - Translate CV content
```

## Database Schema

### Users Table

```
id          INTEGER PRIMARY KEY
username    TEXT NOT NULL UNIQUE
password    TEXT NOT NULL (hashed)
email       TEXT NOT NULL UNIQUE
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### CVs Table

```
id          INTEGER PRIMARY KEY
user_id     INTEGER REFERENCES users(id)
title       TEXT NOT NULL
data        JSONB NOT NULL (CV content)
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

### Versions Table

```
id          INTEGER PRIMARY KEY
cv_id       INTEGER REFERENCES cvs(id)
description TEXT
data        JSONB NOT NULL (CV snapshot)
changes     JSONB (Change tracking)
created_at  TIMESTAMP DEFAULT NOW()
```

## Architecture Patterns

### Middleware Approach

The application uses a series of middleware functions for cross-cutting concerns:

1. **Authentication Middleware**: Validates JWT tokens and attaches user to request
2. **Error Handling Middleware**: Centralizes error response handling
3. **Request Validation**: Validates incoming request data
4. **Rate Limiting**: Prevents abuse of API endpoints
5. **Logging**: Records API activity for monitoring and debugging

### Service Layer

Business logic is encapsulated in service modules:

1. **UserService**: Handles user operations
2. **CVService**: Manages CV operations
3. **AIService**: Orchestrates AI provider interactions
4. **ExportService**: Handles file generation

### Repository Pattern

Data access is abstracted through repositories:

1. **UserRepository**: User data persistence
2. **CVRepository**: CV data persistence
3. **VersionRepository**: Version history management

## Security Measures

1. **Authentication**: JWT-based authentication with refresh tokens
2. **Password Security**: Bcrypt hashing with salt
3. **Input Validation**: Thorough validation of all incoming data
4. **Rate Limiting**: Protection against brute force attacks
5. **HTTPS**: Secure communication
6. **CORS Configuration**: Controlled cross-origin resource sharing
7. **Content Security Policy**: Protection against XSS attacks
8. **API Key Management**: Secure handling of third-party API keys