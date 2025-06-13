# Middleware Architecture

## Overview

CvCraftPro employs a comprehensive middleware system to handle cross-cutting concerns, secure the application, and provide a consistent request/response pipeline. The middleware layer intercepts HTTP requests before they reach route handlers, applying various processing steps.

## Authentication Middleware

Handles user authentication and authorization:

```typescript
// JWT authentication middleware
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### Role-Based Authorization

Restricts access based on user roles:

```typescript
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }
    next();
  };
};
```

## Error Handling Middleware

Centralized error processing:

```typescript
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error(err.stack);
  
  // Handle known error types
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err instanceof AuthenticationError) {
    return res.status(401).json({ error: err.message });
  }
  
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  
  // Default server error
  return res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};
```

## Request Validation

Input validation using libraries like Zod:

```typescript
import { z } from 'zod';

const createCVSchema = z.object({
  title: z.string().min(1).max(100),
  data: z.object({
    personalInfo: z.object({
      fullName: z.string(),
      jobTitle: z.string(),
      // Additional fields
    }),
    // Additional section validation
  })
});

export const validateCreateCV = (req: Request, res: Response, next: NextFunction) => {
  try {
    createCVSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    next(error);
  }
};
```

## Rate Limiting

Protection against abuse:

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' }
});
```

## Request Logging

Detailed logging for monitoring and debugging:

```typescript
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Capture response information
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};
```

## CORS Configuration

Control cross-origin resource sharing:

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

export const corsMiddleware = cors(corsOptions);
```

## Security Middleware

Various security-enhancing middleware:

```typescript
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';

// Set security HTTP headers
export const securityHeaders = helmet();

// Prevent XSS attacks
export const xssProtection = xss();

// Sanitize user-supplied data to prevent MongoDB Operator Injection
export const mongodbSanitization = mongoSanitize();
```

## File Upload Middleware

Handle file uploads securely:

```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
  }
};

export const uploadMiddleware = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
```

## API Response Formatting

Consistent response formatting:

```typescript
export const formatResponse = (req: Request, res: Response, next: NextFunction) => {
  // Extend response object with standard formatting methods
  res.success = function(data: any, message: string = 'Success', statusCode: number = 200) {
    return this.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  res.error = function(message: string, statusCode: number = 400, errors?: any) {
    return this.status(statusCode).json({
      success: false,
      message,
      errors
    });
  };
  
  next();
};
```

## Performance Monitoring

Middleware for performance tracking:

```typescript
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startHrTime = process.hrtime();
  
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1000000;
    
    // Log slow requests
    if (elapsedTimeInMs > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} ${elapsedTimeInMs.toFixed(2)}ms`);
    }
    
    // Record metrics (could send to monitoring service)
    // metricsService.recordRequestDuration(req.method, req.route?.path, elapsedTimeInMs);
  });
  
  next();
};
```

## Middleware Registration

Middleware is registered in the main application file:

```typescript
// Application setup with middleware chain
const app = express();

// Basic middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(corsMiddleware);

// Security middleware
app.use(securityHeaders);
app.use(xssProtection);
app.use(mongodbSanitization);

// Application middleware
app.use(requestLogger);
app.use(formatResponse);
app.use(performanceMonitor);

// Route-specific middleware
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cvs', apiLimiter, authenticateUser, cvRoutes);
app.use('/api/ai', apiLimiter, authenticateUser, aiRoutes);

// Error handling (last middleware)
app.use(errorHandler);
```