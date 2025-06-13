import { Router, type Request, type Response } from 'express';
import { jobAlertsService } from '../services/jobAlertsService';
import { authenticateToken } from '../middleware/auth';
import { insertJobAlertSchema, User } from '@shared/schema';

const router = Router();

// =============== JOB ALERTS ROUTES ===============

// Create job alert
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can create job alerts',
      });
    }

    const validation = insertJobAlertSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const alert = await jobAlertsService.createJobAlert(user.id, validation.data);

    res.status(201).json({
      success: true,
      message: 'Job alert created successfully',
      data: alert,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({
      error: error.message || 'Failed to create job alert',
    });
  }
});

// Get user's job alerts
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view job alerts',
      });
    }

    const alerts = await jobAlertsService.getUserJobAlerts(user.id);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch job alerts',
    });
  }
});

// Update job alert
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const alertId = parseInt(req.params.id);

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can update job alerts',
      });
    }

    if (isNaN(alertId)) {
      return res.status(400).json({
        error: 'Invalid alert ID',
      });
    }

    const updatedAlert = await jobAlertsService.updateJobAlert(alertId, user.id, req.body);

    res.json({
      success: true,
      message: 'Job alert updated successfully',
      data: updatedAlert,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      error: error.message || 'Failed to update job alert',
    });
  }
});

// Delete job alert
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const alertId = parseInt(req.params.id);

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can delete job alerts',
      });
    }

    if (isNaN(alertId)) {
      return res.status(400).json({
        error: 'Invalid alert ID',
      });
    }

    const deleted = await jobAlertsService.deleteJobAlert(alertId, user.id);

    if (deleted) {
      res.json({
        success: true,
        message: 'Job alert deleted successfully',
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete job alert',
      });
    }
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      error: error.message || 'Failed to delete job alert',
    });
  }
});

// Toggle job alert
router.post('/:id/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const alertId = parseInt(req.params.id);

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can toggle job alerts',
      });
    }

    if (isNaN(alertId)) {
      return res.status(400).json({
        error: 'Invalid alert ID',
      });
    }

    const toggledAlert = await jobAlertsService.toggleJobAlert(alertId, user.id);

    res.json({
      success: true,
      message: `Job alert ${toggledAlert.isActive ? 'activated' : 'deactivated'} successfully`,
      data: toggledAlert,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      error: error.message || 'Failed to toggle job alert',
    });
  }
});

// Get jobs matching an alert
router.get('/:id/jobs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const alertId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 20;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view alert jobs',
      });
    }

    if (isNaN(alertId)) {
      return res.status(400).json({
        error: 'Invalid alert ID',
      });
    }

    const jobs = await jobAlertsService.getJobsForAlert(alertId, user.id, limit);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch jobs for alert',
    });
  }
});

export default router;