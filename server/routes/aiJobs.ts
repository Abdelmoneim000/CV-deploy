import { Router, type Request, type Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiJobMatchingService } from '../services/aiJobMatchingService';
import { aiJobEnhancementService } from '../services/aiJobEnhancementService';
import { storage } from '../storage';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { User } from '@shared/schema';

const router = Router();

// Rate limiting for AI operations
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI requests per hour
  message: { error: 'Too many AI requests, please try again later' },
});

// Validation schemas
const enhanceJobSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().min(1),
  description: z.string().min(50),
  location: z.string().optional(),
  workType: z.enum(['remote', 'hybrid', 'onsite']),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
  requiredSkills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

const salaryAnalysisSchema = z.object({
  jobTitle: z.string().min(1),
  location: z.string().min(1),
  experienceLevel: z.string(),
  skills: z.array(z.string()),
  companySize: z.string().optional(),
});

const screenApplicationSchema = z.object({
  jobId: z.number(),
  applicationId: z.number(),
});

const generateJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  workType: z.string(),
  experienceLevel: z.string(),
  keyRequirements: z.array(z.string()),
});

// =============== JOB MATCHING ROUTES ===============

// Get AI-powered job recommendations for candidate
router.get('/job-matches/:candidateId', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const candidateId = parseInt(req.params.candidateId);
    const limit = parseInt(req.query.limit as string) || 10;
    const includeSkillGaps = req.query.includeSkillGaps === 'true';

    // Check permissions
    if (user.role === 'candidate' && user.id !== candidateId) {
      return res.status(403).json({
        error: 'You can only view your own job matches',
      });
    }

    if (user.role === 'hr') {
      return res.status(403).json({
        error: 'HR users cannot access candidate job matches',
      });
    }

    if (isNaN(candidateId)) {
      return res.status(400).json({
        error: 'Invalid candidate ID',
      });
    }

    const jobMatches = await aiJobMatchingService.matchCandidateToJobs(
      candidateId,
      limit,
      includeSkillGaps
    );

    res.json({
      success: true,
      data: jobMatches,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to get job matches',
    });
  }
});

// Get skill gap analysis
router.post('/skill-gap-analysis', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const { targetJobIds } = req.body;

    if (user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidates can get skill gap analysis',
      });
    }

    if (!Array.isArray(targetJobIds) || targetJobIds.length === 0) {
      return res.status(400).json({
        error: 'Target job IDs are required',
      });
    }

    const analysis = await aiJobMatchingService.getSkillGapAnalysis(
      user.id,
      targetJobIds
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to analyze skill gaps',
    });
  }
});

// =============== JOB ENHANCEMENT ROUTES ===============

// Enhance job description with AI
router.post('/enhance-job-description', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can enhance job descriptions',
      });
    }

    const validation = enhanceJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const suggestions = await aiJobEnhancementService.enhanceJobDescription(validation.data);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to enhance job description',
    });
  }
});

// Get salary suggestions
router.post('/suggest-salary', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can get salary suggestions',
      });
    }

    const validation = salaryAnalysisSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { jobTitle, location, experienceLevel, skills, companySize } = validation.data;

    const analysis = await aiJobEnhancementService.suggestSalary(
      jobTitle,
      location,
      experienceLevel,
      skills,
      companySize
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to analyze salary',
    });
  }
});

// Screen application with AI
router.post('/screen-applications', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can screen applications',
      });
    }

    const validation = screenApplicationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const { jobId, applicationId } = validation.data;

    // Get application data
    const application = await storage.getJobApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({
        error: 'Application not found',
      });
    }

    // Get candidate profile and CV
    const candidateProfile = await storage.getCandidateProfileByUserId(application.candidateUserId);
    const cv = application.cvId ? await storage.getCVById(application.cvId) : null;

    // Verify job ownership
    const job = await storage.getJobById(jobId);
    if (!job || job.hrUserId !== user.id) {
      return res.status(403).json({
        error: 'You can only screen applications for your own jobs',
      });
    }

    const screeningResult = await aiJobEnhancementService.screenApplication(
      jobId,
      candidateProfile,
      cv,
      application.coverLetter || undefined
    );

    res.json({
      success: true,
      data: screeningResult,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to screen application',
    });
  }
});

// Analyze job performance
router.get('/job-performance/:jobId', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const jobId = parseInt(req.params.jobId);

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can analyze job performance',
      });
    }

    if (isNaN(jobId)) {
      return res.status(400).json({
        error: 'Invalid job ID',
      });
    }

    // Verify job ownership
    const job = await storage.getJobById(jobId);
    if (!job || job.hrUserId !== user.id) {
      return res.status(403).json({
        error: 'You can only analyze your own jobs',
      });
    }

    const analysis = await aiJobEnhancementService.analyzeJobPerformance(jobId);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to analyze job performance',
    });
  }
});

// Generate job posting from requirements
router.post('/generate-job-posting', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can generate job postings',
      });
    }

    const validation = generateJobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const jobPosting = await aiJobEnhancementService.generateJobPosting(validation.data);

    res.json({
      success: true,
      data: jobPosting,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to generate job posting',
    });
  }
});

// =============== BATCH OPERATIONS ===============

// Batch screen multiple applications
router.post('/batch-screen-applications', authenticateToken, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user! as User;
    const { jobId, applicationIds } = req.body;

    if (user.role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can screen applications',
      });
    }

    if (!jobId || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        error: 'Job ID and application IDs are required',
      });
    }

    // Verify job ownership
    const job = await storage.getJobById(jobId);
    if (!job || job.hrUserId !== user.id) {
      return res.status(403).json({
        error: 'You can only screen applications for your own jobs',
      });
    }

    const results = [];
    const errors = [];

    for (const applicationId of applicationIds) {
      try {
        const application = await storage.getJobApplicationById(applicationId);
        if (!application) {
          errors.push(`Application ${applicationId} not found`);
          continue;
        }

        const candidateProfile = await storage.getCandidateProfileByUserId(application.candidateUserId);
        const cv = application.cvId ? await storage.getCVById(application.cvId) : null;

        const screeningResult = await aiJobEnhancementService.screenApplication(
          jobId,
          candidateProfile,
          cv,
          application.coverLetter || undefined
        );

        results.push({
          applicationId,
          ...screeningResult
        });
      } catch (error: any) {
        errors.push(`Failed to screen application ${applicationId}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        screened: results.length,
        failed: errors.length
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to batch screen applications',
    });
  }
});

export default router;