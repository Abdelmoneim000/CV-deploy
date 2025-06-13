import { Router, type Request, type Response } from 'express';
import { jobService } from '../services/jobService';
import { jobCategoryService } from '../services/jobCategoryService';
import { authenticateToken } from '../middleware/auth';
import {
  insertJobSchema,
  updateJobSchema,
  User,
  type InsertJob,
  type UpdateJobRequest,
} from '@shared/schema';
import rateLimit from 'express-rate-limit';
import { jobDiscoveryService } from '../services/jobDiscoveryService';
import { savedJobsService } from '../services/savedJobsService';
import { jobApplicationService } from '../services/jobApplicationService';
import { storage } from '../storage';

const router = Router();

// Rate limiting for job operations
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 job creations per hour
  message: { error: 'Too many job creation attempts, please try again later' },
});

const jobUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 updates per minute
  message: { error: 'Too many update attempts, please try again later' },
});

// =============== JOB CATEGORIES ROUTES ===============

// Get all job categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const withStats = req.query.withStats === 'true';

    const categories = withStats
      ? await jobCategoryService.getCategoriesWithStats()
      : await jobCategoryService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch job categories',
    });
  }
});

// =============== PUBLIC JOB DISCOVERY ROUTES ===============

// Browse jobs (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      query,
      location,
      workType,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      categoryId,
      skills,
      benefits,
      companySize,
      posted,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    // Get candidate ID if authenticated
    const candidateUserId =
      (req.user as User)?.role === 'candidate'
        ? (req.user as User)?.id
        : undefined;

    const searchParams = {
      query: query as string,
      location: location as string,
      workType: workType as 'remote' | 'hybrid' | 'onsite',
      employmentType: employmentType as
        | 'full-time'
        | 'part-time'
        | 'contract'
        | 'internship',
      experienceLevel: experienceLevel as
        | 'entry'
        | 'mid'
        | 'senior'
        | 'executive',
      salaryMin: salaryMin ? parseInt(salaryMin as string) : undefined,
      salaryMax: salaryMax ? parseInt(salaryMax as string) : undefined,
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      skills: skills ? (skills as string).split(',') : undefined,
      benefits: benefits ? (benefits as string).split(',') : undefined,
      companySize: companySize as string,
      posted: posted as 'today' | 'week' | 'month',
      sortBy: sortBy as 'relevance' | 'date',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await jobDiscoveryService.searchJobs(
      searchParams,
      candidateUserId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        jobs: result.jobs,
      },
      facets: result.facets,
      recommendations: result.recommendations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to search jobs',
    });
  }
});

// Get job details (public, but enhanced if authenticated)
router.get('/:id/details', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: 'Invalid job ID',
      });
    }

    // Get candidate ID if authenticated
    const candidateUserId =
      (req.user as User)?.role === 'candidate'
        ? (req.user as User)?.id
        : undefined;

    const result = await jobDiscoveryService.getJobDetails(
      jobId,
      candidateUserId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch job details',
    });
  }
});

// Get featured jobs
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const jobs = await jobDiscoveryService.getFeaturedJobs(limit);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch featured jobs',
    });
  }
});

// Get trending jobs
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const jobs = await jobDiscoveryService.getTrendingJobs(limit);

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch trending jobs',
    });
  }
});

// Get jobs by category
router.get('/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category ID',
      });
    }

    const result = await jobDiscoveryService.getJobsByCategory(
      categoryId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.jobs,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch jobs by category',
    });
  }
});

// Get search suggestions
router.get('/search/suggestions', async (req: Request, res: Response) => {
  try {
    const { query, type = 'jobs' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required',
      });
    }

    const suggestions = await jobDiscoveryService.getSearchSuggestions(
      query,
      type as 'jobs' | 'companies' | 'locations'
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch search suggestions',
    });
  }
});

// Get personalized recommendations (requires authentication)
router.get(
  '/recommendations',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      if ((user as User)?.role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can get personalized recommendations',
        });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations =
        await jobDiscoveryService.getPersonalizedRecommendations(
          user.id,
          limit
        );

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to fetch recommendations',
      });
    }
  }
);

// Get all published jobs (public route)
router.get('/published', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Validate pagination parameters
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Invalid page number',
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Invalid limit. Must be between 1 and 100',
      });
    }

    // Get published jobs using storage method
    const result = await storage.getPublishedJobs(pageNum, limitNum);

    // Get candidate ID if authenticated (for saved jobs status)
    const candidateUserId =
      (req.user as User)?.role === 'candidate'
        ? (req.user as User)?.id
        : undefined;

    // Enhance jobs with additional info if candidate is authenticated
    let enhancedJobs = result.jobs;
    if (candidateUserId) {
      // Check which jobs are saved by this candidate
      const savedJobs = await storage.getSavedJobsByUserId(candidateUserId);
      const savedJobIds = new Set(savedJobs.map((saved) => saved.jobId));

      enhancedJobs = result.jobs.map((job) => ({
        ...job,
        isSaved: savedJobIds.has(job.id),
      }));
    }

    res.json({
      success: true,
      data: { jobs: enhancedJobs },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        pages: result.pages,
      },
      meta: {
        totalPublishedJobs: result.total,
        currentPage: pageNum,
        hasNextPage: pageNum < result.pages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching published jobs:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch published jobs',
    });
  }
});

// =============== SAVED JOBS ROUTES (Authenticated Candidates) ===============

// Save a job
router.post(
  '/:id/save',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const jobId = parseInt(req.params.id);
      const { notes } = req.body;

      if ((user as User).role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can save jobs',
        });
      }

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      const savedJob = await savedJobsService.saveJob(user.id, jobId, notes);

      res.status(201).json({
        success: true,
        message: 'Job saved successfully',
        data: savedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('already saved')
        ? 409
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to save job',
      });
    }
  }
);

// Unsave a job
router.delete(
  '/:id/save',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const jobId = parseInt(req.params.id);

      if ((user as User).role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can unsave jobs',
        });
      }

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      const removed = await savedJobsService.unsaveJob(user.id, jobId);

      if (removed) {
        res.json({
          success: true,
          message: 'Job removed from saved jobs',
        });
      } else {
        res.status(500).json({
          error: 'Failed to remove job from saved jobs',
        });
      }
    } catch (error: any) {
      const statusCode = error.message.includes('not saved') ? 404 : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to unsave job',
      });
    }
  }
);

// Get saved jobs
router.get('/saved', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if ((user as User).role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can view saved jobs',
      });
    }

    const {
      search,
      categoryId,
      workType,
      page = '1',
      limit = '10',
    } = req.query;

    const filters = {
      search: search as string,
      categoryId: categoryId ? parseInt(categoryId as string) : undefined,
      workType: workType as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await savedJobsService.getSavedJobs(user.id, filters);

    res.json({
      success: true,
      data: result.savedJobs,
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
      error: error.message || 'Failed to fetch saved jobs',
    });
  }
});

// Update saved job notes
router.put(
  '/:id/save/notes',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const jobId = parseInt(req.params.id);
      const { notes } = req.body;

      if ((user as User).role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can update saved job notes',
        });
      }

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      const updatedSavedJob = await savedJobsService.updateSavedJobNotes(
        user.id,
        jobId,
        notes
      );

      res.json({
        success: true,
        message: 'Notes updated successfully',
        data: updatedSavedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not saved') ? 404 : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to update notes',
      });
    }
  }
);

// Get saved jobs insights
router.get(
  '/saved/insights',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      if ((user as User).role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can view saved jobs insights',
        });
      }

      const insights = await savedJobsService.getSavedJobsInsights(user.id);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to fetch insights',
      });
    }
  }
);

// =============== JOB APPLICATION ROUTES ===============

// Apply to a job
router.post(
  '/:id/apply',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const jobId = parseInt(req.params.id);

      if ((user as User).role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can apply for jobs',
        });
      }

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      const { cvId, coverLetter, additionalInfo } = req.body;

      const applicationData = {
        jobId,
        candidateUserId: user.id,
        cvId: cvId ? parseInt(cvId) : undefined,
        coverLetter: coverLetter || '',
        additionalNotes: additionalInfo || '',
      };

      const application = await jobApplicationService.applyForJob(
        user.id,
        applicationData
      );

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('already applied')
        ? 409
        : error.message.includes('deadline')
        ? 410
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to submit application',
      });
    }
  }
);

// =============== JOB POSTING ROUTES (HR Only) ===============

// Create a new job posting
router.post(
  '/',
  authenticateToken,
  jobCreationLimiter,
  async (req: Request, res: Response) => {
    try {
      const user = req.user! as User;

      // Only HR users can create jobs
      if (user?.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can create job postings',
        });
      }

      const validation = insertJobSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      const job = await jobService.createJob(user.id, validation.data);

      res.status(201).json({
        success: true,
        message: 'Job posting created successfully',
        data: job,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('limit') ? 429 : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to create job posting',
      });
    }
  }
);

// Get HR user's job postings
router.get(
  '/my-jobs',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user! as User;

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can view job postings',
        });
      }

      const {
        status,
        search,
        categoryId,
        page = '1',
        limit = '10',
      } = req.query;

      const filters = {
        status: status as string,
        search: search as string,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await jobService.getHrJobs(user.id, filters);

      res.json({
        success: true,
        data: result.jobs,
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
        error: error.message || 'Failed to fetch job postings',
      });
    }
  }
);

// Get specific job posting
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id);
    const user = req.user! as User;

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: 'Invalid job ID',
      });
    }

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can view job details',
      });
    }

    // This will check ownership automatically
    const result = await jobService.getJobAnalytics(jobId, user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('Access denied')
      ? 403
      : 500;
    res.status(statusCode).json({
      error: error.message || 'Failed to fetch job posting',
    });
  }
});

// Update job posting
router.put(
  '/:id',
  authenticateToken,
  jobUpdateLimiter,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can update job postings',
        });
      }

      const validation = updateJobSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      console.log('Updating job with data:', validation.data);

      const updatedJob = await jobService.updateJob(
        jobId,
        user.id,
        validation.data
      );

      res.json({
        success: true,
        message: 'Job posting updated successfully',
        data: updatedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : error.message.includes('transition')
        ? 400
        : 500;
      res.status(statusCode).json({
        error: error.message || 'Failed to update job posting',
      });
    }
  }
);

// Publish job posting
router.post(
  '/:id/publish',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can publish job postings',
        });
      }

      const publishedJob = await jobService.publishJob(jobId, user.id);

      res.json({
        success: true,
        message: 'Job posting published successfully',
        data: publishedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : error.message.includes('limit')
        ? 429
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to publish job posting',
      });
    }
  }
);

// Pause job posting
router.post(
  '/:id/pause',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can pause job postings',
        });
      }

      const pausedJob = await jobService.pauseJob(jobId, user.id);

      res.json({
        success: true,
        message: 'Job posting paused successfully',
        data: pausedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to pause job posting',
      });
    }
  }
);

// Close job posting
router.post(
  '/:id/close',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can close job postings',
        });
      }

      const closedJob = await jobService.closeJob(jobId, user.id);

      res.json({
        success: true,
        message: 'Job posting closed successfully',
        data: closedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to close job posting',
      });
    }
  }
);

// Duplicate job posting
router.post(
  '/:id/duplicate',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can duplicate job postings',
        });
      }

      const duplicatedJob = await jobService.duplicateJob(jobId, user.id);

      res.status(201).json({
        success: true,
        message: 'Job posting duplicated successfully',
        data: duplicatedJob,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : error.message.includes('limit')
        ? 429
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to duplicate job posting',
      });
    }
  }
);

// Delete job posting
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can delete job postings',
        });
      }

      const deleted = await jobService.deleteJob(jobId, user.id);

      if (deleted) {
        res.json({
          success: true,
          message: 'Job posting deleted successfully',
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete job posting',
        });
      }
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 400;
      res.status(statusCode).json({
        error: error.message || 'Failed to delete job posting',
      });
    }
  }
);

router.get(
  '/check/:jobId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const user = req.user! as User;

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      if (user.role !== 'candidate') {
        return res.status(403).json({
          error: 'Only candidates can check job applications',
        });
      }

      const existingApplication = await storage.checkExistingApplication(
        jobId,
        user.id
      );

      if (existingApplication) {
        res.json({
          success: true,
          data: {
            hasApplied: true,
            applicationId: existingApplication.id,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            hasApplied: false,
            applicationId: null,
          },
        });
      }
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 500;
      res.status(statusCode).json({
        error: error.message || 'Failed to check application status',
      });
    }
  }
);

// Get applications for a specific job (HR only)
router.get(
  '/:id/applications',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user! as User;
      const jobId = parseInt(req.params.id);

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can view job applications',
        });
      }

      if (isNaN(jobId)) {
        return res.status(400).json({
          error: 'Invalid job ID',
        });
      }

      // Verify job ownership
      const job = await storage.getJobById(jobId);
      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
        });
      }

      if (job.hrUserId !== user.id) {
        return res.status(403).json({
          error: 'You can only view applications for your own job postings',
        });
      }

      const {
        status,
        rating,
        aiScore,
        search,
        page = '1',
        limit = '20',
        sortBy = 'appliedAt',
        sortOrder = 'desc',
      } = req.query;

      // Get all applications for this job using storage method
      let applications = await storage.getJobApplicationsByJobId(jobId);

      // Get candidate and CV details for each application
      const enhancedApplications = await Promise.all(
        applications.map(async (app) => {
          // Get candidate profile and user info
          const candidateProfile = await storage.getCandidateProfileByUserId(app.candidateUserId);
          const candidateUser = await storage.getUser(app.candidateUserId);
          
          // Get CV details if cvId exists
          let cv = null;
          if (app.cvId) {
            cv = await storage.getCVById(app.cvId);
          }

          return {
            ...app,
            candidate: {
              firstName: candidateProfile?.firstName || candidateUser?.firstName || '',
              lastName: candidateProfile?.lastName || candidateUser?.lastName || '',
              title: candidateProfile?.title || '',
              location: candidateProfile?.location || '',
              email: candidateUser?.email || '',
              avatar: candidateProfile?.avatar,
            },
            cv: cv ? {
              id: cv.id,
              title: cv.title,
            } : null,
          };
        })
      );

      // Apply filters
      let filteredApplications = enhancedApplications;

      if (status && status !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === status);
      }

      if (rating) {
        const ratingNum = parseInt(rating as string);
        filteredApplications = filteredApplications.filter(app => 
          app.hrRating && app.hrRating >= ratingNum
        );
      }

      if (aiScore) {
        const scoreNum = parseInt(aiScore as string);
        filteredApplications = filteredApplications.filter(app => 
          app.aiScore && app.aiScore >= scoreNum
        );
      }

      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredApplications = filteredApplications.filter(app => 
          app.candidate.firstName.toLowerCase().includes(searchLower) ||
          app.candidate.lastName.toLowerCase().includes(searchLower) ||
          app.candidate.email.toLowerCase().includes(searchLower) ||
          (app.candidate.title && app.candidate.title.toLowerCase().includes(searchLower))
        );
      }

      // Apply sorting
      filteredApplications.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'appliedAt':
            comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
            break;
          case 'aiScore':
            comparison = (a.aiScore || 0) - (b.aiScore || 0);
            break;
          case 'hrRating':
            comparison = (a.hrRating || 0) - (b.hrRating || 0);
            break;
          default:
            comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Calculate pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const total = filteredApplications.length;
      const pages = Math.ceil(total / limitNum);
      const offset = (pageNum - 1) * limitNum;
      const paginatedApplications = filteredApplications.slice(offset, offset + limitNum);

      // Calculate statistics
      const stats = {
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        reviewingApplications: applications.filter(app => app.status === 'reviewing').length,
        shortlistedApplications: applications.filter(app => app.status === 'shortlisted').length,
        rejectedApplications: applications.filter(app => app.status === 'rejected').length,
        hiredApplications: applications.filter(app => app.status === 'hired').length,
        averageAiScore: applications.length > 0 
          ? Math.round(applications.reduce((acc, app) => acc + (app.aiScore || 0), 0) / applications.length)
          : 0,
      };

      res.json({
        success: true,
        data: {
          applications: paginatedApplications,
          stats,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
        },
      });
    } catch (error: any) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch job applications',
      });
    }
  }
);

// Update application status (HR only)
router.put(
  '/:jobId/applications/:applicationId/status',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = req.user! as User;
      const jobId = parseInt(req.params.jobId);
      const applicationId = parseInt(req.params.applicationId);

      if (user.role !== 'hr') {
        return res.status(403).json({
          error: 'Only HR users can update application status',
        });
      }

      if (isNaN(jobId) || isNaN(applicationId)) {
        return res.status(400).json({
          error: 'Invalid job ID or application ID',
        });
      }

      // Verify job ownership
      const job = await storage.getJobById(jobId);
      if (!job || job.hrUserId !== user.id) {
        return res.status(403).json({
          error: 'You can only update applications for your own job postings',
        });
      }

      // Verify application exists and belongs to this job
      const application = await storage.getJobApplicationById(applicationId);
      if (!application || application.jobId !== jobId) {
        return res.status(404).json({
          error: 'Application not found',
        });
      }

      const { status, hrRating, hrNotes } = req.body;

      // Validate status
      const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
        });
      }

      // Update application
      const updateData: any = {};
      if (status) updateData.status = status;
      if (hrRating !== undefined) updateData.hrRating = hrRating;
      if (hrNotes !== undefined) updateData.hrNotes = hrNotes;

      const updatedApplication = await storage.updateJobApplication(applicationId, updateData);

      if (!updatedApplication) {
        return res.status(500).json({
          error: 'Failed to update application',
        });
      }

      res.json({
        success: true,
        message: 'Application status updated successfully',
        data: updatedApplication,
      });
    } catch (error: any) {
      console.error('Error updating application status:', error);
      res.status(500).json({
        error: error.message || 'Failed to update application status',
      });
    }
  }
);

export default router;
