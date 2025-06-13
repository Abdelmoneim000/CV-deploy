import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from 'server/middleware/auth';
// import mockUser from 'middlewares/mockUser';

const shareRouter = Router();

// Generate shareable link for CV
shareRouter.post(
  '/cvs/:cvId/share',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const cvId = parseInt(req.params.cvId);

      if (isNaN(cvId)) {
        return res.status(400).json({ error: 'Invalid CV ID' });
      }

      // Generate unique share token
      const shareToken = uuidv4();

      // Create share record
      const shareRecord = await storage.createShare({
        cvId,
        shareToken,
      });

      // Construct share URL
      const shareUrl = `http://${process.env.BASE_URL}/share/${shareToken}`;

      return res.status(201).json({
        message: 'CV shared successfully',
        shareUrl,
      });
    } catch (error) {
      console.error('Error sharing CV:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Retrieve shared CV
shareRouter.get('/cvs/share/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const shareRecord = await storage.getShareByToken(token);

    if (!shareRecord) {
      return res.status(404).json({ error: 'Shared CV not found' });
    }

    const cv = await storage.getCVVersionById(shareRecord.cvId);
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    console.log('Retrieved shared CV:', cv);
    return res.json(cv);
  } catch (error) {
    console.error('Error retrieving shared CV:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default shareRouter;
