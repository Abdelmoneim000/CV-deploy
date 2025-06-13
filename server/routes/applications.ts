import { Router, type Request, type Response } from 'express';
import { jobApplicationService } from '../services/jobApplicationService';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import { User } from '@shared/schema';

const router = Router();

// Rate limiting for applications
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 applications per hour
  message: { error: 'Too many application attempts, please try again later' },
});

// =============== CANDIDATE APPLICATION ROUTES ===============

// Get my applications
router.get('/my-applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view applications',
      });
    }

    const {
      status,
      search,
      page = '1',
      limit = '10',
    } = req.query;

    const filters = {
      status: status as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await jobApplicationService.getCandidateApplications(user.id, filters);

    res.json({
      success: true,
      data: result.applications,
      stats: result.stats,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch applications',
    });
  }
});

// Get application details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const applicationId = parseInt(req.params.id);

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view application details',
      });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Invalid application ID',
      });
    }

    const result = await jobApplicationService.getApplicationDetails(applicationId, user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch application details',
    });
  }
});

// Withdraw application
router.put('/:id/withdraw', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const applicationId = parseInt(req.params.id);

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can withdraw applications',
      });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Invalid application ID',
      });
    }

    const withdrawnApplication = await jobApplicationService.withdrawApplication(
      applicationId,
      user.id
    );

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: withdrawnApplication,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 400;
    res.status(statusCode).json({
      error: error.message || 'Failed to withdraw application',
    });
  }
});

// Get application analytics
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view application analytics',
      });
    }

    const analytics = await jobApplicationService.getApplicationAnalytics(user.id);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch application analytics',
    });
  }
});

// Get application insights
router.get('/insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view application insights',
      });
    }

    const insights = await jobApplicationService.getApplicationInsights(user.id);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch application insights',
    });
  }
});

// Get recommended jobs based on application history
router.get('/recommendations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view job recommendations',
      });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const recommendations = await jobApplicationService.getRecommendedJobsForCandidate(user.id, limit);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch recommendations',
    });
  }
});

// Bulk withdraw applications
router.put('/bulk/withdraw', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const { applicationIds } = req.body;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can withdraw applications',
      });
    }

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        error: 'Application IDs array is required',
      });
    }

    const result = await jobApplicationService.bulkWithdrawApplications(applicationIds, user.id);

    res.json({
      success: true,
      message: `${result.success} applications withdrawn successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to withdraw applications',
    });
  }
});

export default router;