import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { z } from 'zod';
import { insertCVSchema, cvDataSchema } from '@shared/schema';
import { authenticateToken, optionalAuth } from './middleware/auth';
import { serveUploads, checkFileAccess } from './middleware/uploads';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import aiRoutes from './routes/ai';
import aiJobRoutes from './routes/aiJobs';
import versionsRoutes from './routes/versions';
import shareRouter from './routes/cvs';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import jobAlertRoutes from './routes/jobAlerts';

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', checkFileAccess, serveUploads);
  
  // Authentication routes (no auth required)
  app.use('/api/auth', authRoutes);
  
  // Profile routes (require authentication)
  app.use('/api/profiles', profileRoutes);
  
  // AI routes (includes both CV and job AI features)
  app.use('/api/ai', aiRoutes);
  
  // AI Job routes (specialized job board AI features)
  app.use('/api/ai', aiJobRoutes);
  
  // Version routes (require authentication)  
  app.use('/api', authenticateToken, versionsRoutes);
  
  // Share routes (optional auth for public shares)
  app.use('/', shareRouter);

  // Job routes (includes both HR and candidate features)
  app.use('/api/jobs', jobRoutes);
  
  // Job application routes (candidate-specific)
  app.use('/api/applications', applicationRoutes);
  
  // Job alerts routes (candidate-specific)
  app.use('/api/job-alerts', jobAlertRoutes);

  // Template routes (public, no auth required)
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const template = await storage.getTemplateById(id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch template' });
    }
  });

  // CV routes (require authentication)
  app.get('/api/cvs', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id; // Get from authenticated user
      const cvs = await storage.getCVsByUserId(userId);
      res.json(cvs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch CVs' });
    }
  });

  app.get('/api/cvs/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid CV ID' });
      }

      const cv = await storage.getCVById(id);
      if (!cv) {
        return res.status(404).json({ message: 'CV not found' });
      }

      // Check if user owns this CV
      if (cv.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(cv);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch CV' });
    }
  });

  app.post('/api/cvs', authenticateToken, async (req, res) => {
    try {
      const cvData = {
        ...req.body,
        userId: req.user!.id, // Set user ID from authenticated user
      };

      const validation = insertCVSchema.safeParse(cvData);
      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid CV data',
          errors: validation.error.errors,
        });
      }

      const cv = await storage.createCV(validation.data);
      res.status(201).json(cv);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create CV' });
    }
  });

  // app.put('/api/cvs/:id', authenticateToken, async (req, res) => {
  //   try {
  //     const id = parseInt(req.params.id);
  //     if (isNaN(id)) {
  //       return res.status(400).json({ message: 'Invalid CV ID' });
  //     }

  //     // Check if CV exists and user owns it
  //     const existingCV = await storage.getCVById(id);
  //     if (!existingCV) {
  //       return res.status(404).json({ message: 'CV not found' });
  //     }

  //     if (existingCV.userId !== req.user!.id) {
  //       return res.status(403).json({ message: 'Access denied' });
  //     }

  //     const updateSchema = insertCVSchema.partial();
  //     const validationResult = updateSchema.safeParse(req.body);
  //     if (!validationResult.success) {
  //       return res.status(400).json({
  //         message: 'Invalid update data',
  //         errors: validationResult.error.errors,
  //       });
  //     }

  //     if (req.body.data) {
  //       const cvDataValidation = cvDataSchema.safeParse(req.body.data);
  //       if (!cvDataValidation.success) {
  //         return res.status(400).json({
  //           message: 'Invalid CV data structure',
  //           errors: cvDataValidation.error.errors,
  //         });
  //       }
  //     }

  //     const updatedCV = await storage.updateCV(id, validationResult.data);
  //     res.json(updatedCV);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to update CV' });
  //   }
  // });

  app.put('/api/cvs/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid CV ID' });
      }

      // Check if CV exists and user owns it
      const existingCV = await storage.getCVById(id);
      if (!existingCV) {
        return res.status(404).json({ message: 'CV not found' });
      }

      if (existingCV.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updateSchema = insertCVSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: 'Invalid CV data',
          errors: validationResult.error.errors,
        });
      }

      // Ensure we're completely replacing the data, not merging
      const updateData = {
        ...validationResult.data,
        data: req.body.data, // Completely replace the data field
        updatedAt: new Date()
      };

      const updatedCV = await storage.updateCV(id, updateData);
      res.json(updatedCV);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update CV' });
    }
  });

  app.delete('/api/cvs/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid CV ID' });
      }

      // Check if CV exists and user owns it
      const existingCV = await storage.getCVById(id);
      if (!existingCV) {
        return res.status(404).json({ message: 'CV not found' });
      }

      if (existingCV.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const deleted = await storage.deleteCV(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete CV' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
