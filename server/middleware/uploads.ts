import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';

export const serveUploads = (req: Request, res: Response, next: NextFunction) => {
  const uploadPath = path.join(process.cwd(), 'uploads');
  
  // Security checks
  if (req.path.includes('..') || req.path.includes('~')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Serve static files with appropriate headers
  express.static(uploadPath, {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    setHeaders: (res, path) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Content type based on file extension
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
    }
  })(req, res, next);
};

// Middleware to check file access permissions (optional)
export const checkFileAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For avatar files, anyone can access them if they have the URL
    // For private files, you might want to check user permissions
    
    const filePath = req.path;
    
    // Allow public access to avatars
    if (filePath.startsWith('/avatars/')) {
      return next();
    }
    
    // For other files, you might want to implement permission checks
    next();
  } catch (error) {
    res.status(403).json({ error: 'Access denied' });
  }
};