import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertCVVersionSchema } from '@shared/schema';
import { z } from 'zod';
import { json } from 'stream/consumers';
import { exit } from 'process';

const versionsRouter = Router();

// Get all versions for a CV
versionsRouter.get('/cvs/:cvId/versions', async (req: Request, res: Response) => {
  try {
    const cvId = parseInt(req.params.cvId);
    if (isNaN(cvId)) {
      return res.status(400).json({ error: 'Invalid CV ID' });
    }

    // Fetch versions for this CV from the database
    const versions = await storage.getCVVersions(cvId);
    
    // Sort versions by created date (newest first)
    const sortedVersions = versions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return res.json(sortedVersions);
  } catch (error) {
    console.error('Error getting versions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific version
versionsRouter.get('/versions/:id', async (req: Request, res: Response) => {
  try {
    const versionId = parseInt(req.params.id);
    if (isNaN(versionId)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    const version = await storage.getCVVersionById(versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    return res.json(version);
  } catch (error) {
    console.error('Error getting version:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new version
versionsRouter.post('/versions', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = insertCVVersionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid version data', details: result.error });
    }
    
    // Create version
    const { cvId, description, data, createdBy, changes } = req.body;
    
    const newVersion = await storage.createCVVersion({
      cvId,
      description,
      data, // This should be cvData.data, not the entire cvData
      createdBy,
      changes: changes || {}
    });
    res.status(201).json(newVersion);
  } catch (error) {
    console.error('Error creating version:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore a version
versionsRouter.post('/cvs/:cvId/restore/:versionId', async (req: Request, res: Response) => {
  try {
    const cvId = parseInt(req.params.cvId);
    const versionId = parseInt(req.params.versionId);
    
    if (isNaN(cvId) || isNaN(versionId)) {
      return res.status(400).json({ error: 'Invalid CV ID or version ID' });
    }

    const restoredCV = await storage.restoreCVVersion(cvId, versionId);
    if (!restoredCV) {
      return res.status(404).json({ error: 'CV or version not found' });
    }

    return res.json(restoredCV);
  } catch (error) {
    console.error('Error restoring version:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default versionsRouter;