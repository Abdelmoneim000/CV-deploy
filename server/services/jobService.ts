import { storage } from '../storage';
import {
  type Job,
  type InsertJob,
  type UpdateJobRequest,
  type JobCategory,
  type HrProfile,
  insertJobSchema,
  updateJobSchema,
} from '@shared/schema';
import { z } from 'zod';

// Extended validation schemas with more business rules
const jobPostingValidationSchema = insertJobSchema
  .extend({
    // Additional validation rules
    applicationDeadline: z
      .union([
        z.string().datetime().transform(str => new Date(str)),
        z.date()
      ])
      .optional()
      .refine(
        (date) => {
          if (!date) return true;
          return new Date(date) > new Date();
        },
        { message: 'Application deadline must be in the future' }
      ),

    startDate: z
      .union([
        z.string().datetime().transform(str => new Date(str)),
        z.date()
      ])
      .optional()
      .refine(
        (date) => {
          if (!date) return true;
          return new Date(date) >= new Date();
        },
        { message: 'Start date cannot be in the past' }
      ),

    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.salaryMin && data.salaryMax) {
        return data.salaryMax >= data.salaryMin;
      }
      return true;
    },
    {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['salaryMax'],
    }
  );

// Job posting limits and business rules
const JOB_POSTING_LIMITS = {
  FREE_PLAN: {
    monthlyLimit: 5,
    featuredJobsLimit: 0,
    urgentJobsLimit: 1,
  },
  PREMIUM_PLAN: {
    monthlyLimit: 50,
    featuredJobsLimit: 10,
    urgentJobsLimit: 20,
  },
  ENTERPRISE_PLAN: {
    monthlyLimit: -1, // Unlimited
    featuredJobsLimit: -1,
    urgentJobsLimit: -1,
  },
};

// Job status transition rules
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['published', 'closed'],
  published: ['paused', 'closed'],
  paused: ['published', 'closed'],
  closed: [], // Terminal state
  expired: ['published'], // Can be republished
};

interface JobPostingStats {
  totalJobs: number;
  publishedJobs: number;
  draftJobs: number;
  pausedJobs: number;
  closedJobs: number;
  expiredJobs: number;
  totalViews: number;
  totalApplications: number;
  thisMonthJobs: number;
}

interface JobValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class JobService {
  // Create a new job posting
  async createJob(hrUserId: number, jobData: InsertJob): Promise<Job> {
    // Validate HR user permissions
    await this.validateHrPermissions(hrUserId, 'post');

    // Check posting limits
    await this.checkPostingLimits(hrUserId, jobData);

    // Validate job data
    const validation = jobPostingValidationSchema.safeParse(jobData);
    if (!validation.success) {
      throw new Error(
        `Invalid job data: ${validation.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // Convert string dates to Date objects for business validation
    const jobDataForValidation = {
      ...validation.data,
      applicationDeadline: validation.data.applicationDeadline
        ? new Date(validation.data.applicationDeadline)
        : undefined,
      startDate: validation.data.startDate
        ? new Date(validation.data.startDate)
        : undefined,
    };

    // Additional business validation
    const businessValidation = await this.validateJobPosting(
      jobDataForValidation
    );
    if (!businessValidation.isValid) {
      throw new Error(
        `Job validation failed: ${businessValidation.errors.join(', ')}`
      );
    }

    // Create the job
    const job = await storage.createJob({
      ...jobDataForValidation,
      hrUserId
    });

    // Update HR profile statistics
    // await this.updateHrJobStats(hrUserId, 'created');

    // Log activity
    await this.logJobActivity(
      job.id,
      hrUserId,
      'created',
      'Job posting created'
    );

    return job;
  }

  // Update an existing job
  async updateJob(
    jobId: number,
    hrUserId: number,
    updateData: UpdateJobRequest
  ): Promise<Job> {
    // Check job ownership
    const existingJob = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    // Validate update data
    const validation = updateJobSchema.safeParse(updateData);
    if (!validation.success) {
      throw new Error(
        `Invalid update data: ${validation.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // Check if status transition is valid
    if (updateData.status && updateData.status !== existingJob.status) {
      await this.validateStatusTransition(
        existingJob.status,
        updateData.status
      );
    }

    // Business rules for published jobs
    if (existingJob.status === 'published') {
      await this.validatePublishedJobUpdate(existingJob, validation.data);
    }

    // Update the job
    const updatedJob = await storage.updateJob(jobId, validation.data);
    if (!updatedJob) {
      throw new Error('Failed to update job');
    }

    // Log activity
    await this.logJobActivity(
      jobId,
      hrUserId,
      'updated',
      'Job posting updated'
    );

    return updatedJob;
  }

  // Publish a job (move from draft to published)
  async publishJob(jobId: number, hrUserId: number): Promise<Job> {
    const job = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    // Validate HR permissions for publishing
    await this.validateHrPermissions(hrUserId, 'publish');

    // Check publishing limits
    await this.checkPublishingLimits(hrUserId, job);

    // Validate job is ready for publishing
    await this.validateJobForPublishing(job);

    // Set expiration date if not set
    let expiresAt = job.expiresAt;
    if (!expiresAt) {
      const defaultExpiration = new Date();
      defaultExpiration.setDate(defaultExpiration.getDate() + 30); // 30 days default
      expiresAt = defaultExpiration;
    }

    // Publish the job
    const publishedJob = await storage.publishJob(jobId);
    if (!publishedJob) {
      throw new Error('Failed to publish job');
    }

    // Update expiration if needed
    if (expiresAt && expiresAt !== job.expiresAt) {
      await storage.updateJob(jobId, { expiresAt: expiresAt.toISOString() });
    }

    // Update HR profile statistics
    await this.updateHrJobStats(hrUserId, 'published');

    // Log activity
    await this.logJobActivity(
      jobId,
      hrUserId,
      'published',
      'Job posting published'
    );

    // Send notifications (if needed)
    await this.notifyJobPublication(publishedJob);

    return publishedJob;
  }

  // Pause a published job
  async pauseJob(jobId: number, hrUserId: number): Promise<Job> {
    const job = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    if (job.status !== 'published') {
      throw new Error('Only published jobs can be paused');
    }

    const pausedJob = await storage.pauseJob(jobId);
    if (!pausedJob) {
      throw new Error('Failed to pause job');
    }

    await this.logJobActivity(jobId, hrUserId, 'paused', 'Job posting paused');
    return pausedJob;
  }

  // Close a job permanently
  async closeJob(jobId: number, hrUserId: number): Promise<Job> {
    const job = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    const closedJob = await storage.closeJob(jobId);
    if (!closedJob) {
      throw new Error('Failed to close job');
    }

    await this.logJobActivity(jobId, hrUserId, 'closed', 'Job posting closed');
    return closedJob;
  }

  // Delete a job (only drafts and closed jobs)
  async deleteJob(jobId: number, hrUserId: number): Promise<boolean> {
    const job = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    if (!['draft', 'closed'].includes(job.status)) {
      throw new Error('Only draft or closed jobs can be deleted');
    }

    // Check if job has applications
    const applications = await storage.getJobApplicationsByJobId(jobId);
    if (applications.length > 0) {
      throw new Error('Cannot delete job with existing applications');
    }

    const deleted = await storage.deleteJob(jobId);
    if (deleted) {
      await this.logJobActivity(
        jobId,
        hrUserId,
        'deleted',
        'Job posting deleted'
      );
    }

    return deleted;
  }

  // Get jobs for an HR user with filtering and pagination
  async getHrJobs(
    hrUserId: number,
    filters: {
      status?: string;
      search?: string;
      categoryId?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    jobs: Job[];
    total: number;
    pages: number;
    stats: JobPostingStats;
  }> {
    await this.validateHrPermissions(hrUserId, 'view');

    const { page = 1, limit = 10 } = filters;

    // Get all jobs for the HR user
    let allJobs = await storage.getJobsByHrUserId(hrUserId);

    // Apply filters
    if (filters.status) {
      allJobs = allJobs.filter((job) => job.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      allJobs = allJobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.categoryId) {
      allJobs = allJobs.filter((job) => job.categoryId === filters.categoryId);
    }

    // Calculate pagination
    const total = allJobs.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const jobs = allJobs.slice(offset, offset + limit);

    // Calculate stats
    const stats = await this.calculateJobStats(hrUserId);

    return { jobs, total, pages, stats };
  }

  // Get detailed job analytics
  async getJobAnalytics(
    jobId: number,
    hrUserId: number
  ): Promise<{
    job: Job;
    analytics: {
      views: number;
      applications: number;
      viewsToday: number;
      applicationsToday: number;
      viewHistory: Array<{ date: string; views: number }>;
      applicationHistory: Array<{ date: string; applications: number }>;
    };
  }> {
    const job = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    // Get view and application data
    const views = await storage.getJobViewsByJobId(jobId);
    const applications = await storage.getJobApplicationsByJobId(jobId);

    // Calculate today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsToday = views.filter(
      (view) => new Date(view.createdAt) >= today
    ).length;

    const applicationsToday = applications.filter(
      (app) => new Date(app.appliedAt) >= today
    ).length;

    // Calculate history (last 30 days)
    const viewHistory = this.calculateDailyHistory(
      views,
      30,
      'views'
    ) as Array<{ date: string; views: number }>;
    const applicationHistory = this.calculateDailyHistory(
      applications,
      30,
      'applications'
    ) as Array<{ date: string; applications: number }>;

    return {
      job,
      analytics: {
        views: job.viewCount || 0,
        applications: job.applicationCount || 0,
        viewsToday,
        applicationsToday,
        viewHistory,
        applicationHistory,
      },
    };
  }

  // Duplicate a job
  async duplicateJob(jobId: number, hrUserId: number): Promise<Job> {
    const originalJob = await this.getJobWithOwnershipCheck(jobId, hrUserId);

    // Create new job data from original
    const newJobData: InsertJob = {
      hrUserId,
      title: `${originalJob.title} (Copy)`,
      description: originalJob.description,
      shortDescription: originalJob.shortDescription,
      companyName: originalJob.companyName,
      companyLogo: originalJob.companyLogo,
      companyWebsite: originalJob.companyWebsite,
      location: originalJob.location,
      workType: originalJob.workType,
      country: originalJob.country,
      city: originalJob.city,
      categoryId: originalJob.categoryId,
      employmentType: originalJob.employmentType,
      experienceLevel: originalJob.experienceLevel,
      salaryMin: originalJob.salaryMin,
      salaryMax: originalJob.salaryMax,
      salaryCurrency: originalJob.salaryCurrency,
      salaryPeriod: originalJob.salaryPeriod,
      salaryNegotiable: originalJob.salaryNegotiable,
      showSalary: originalJob.showSalary,
      requiredSkills: originalJob.requiredSkills as any,
      preferredSkills: originalJob.preferredSkills as any,
      requiredEducation: originalJob.requiredEducation,
      requiredExperience: originalJob.requiredExperience,
      languages: originalJob.languages as any,
      benefits: originalJob.benefits as any,
      perks: originalJob.perks as any,
      applicationInstructions: originalJob.applicationInstructions,
      applicationUrl: originalJob.applicationUrl,
      isUrgent: false, // Reset flags
      isFeatured: false,
      isRemote: originalJob.isRemote,
      tags: originalJob.tags as any,
    };

    return this.createJob(hrUserId, newJobData);
  }

  // Private helper methods

  private async validateHrPermissions(
    hrUserId: number,
    action: string
  ): Promise<void> {
    const hrProfile = await storage.getHrProfileByUserId(hrUserId);
    if (!hrProfile) {
      throw new Error('HR profile not found');
    }

    switch (action) {
      case 'post':
      case 'publish':
        if (!hrProfile.canPostJobs) {
          throw new Error('HR user does not have permission to post jobs');
        }
        break;
      case 'view':
        // All HR users can view their own jobs
        break;
      default:
        throw new Error('Unknown action for permission check');
    }
  }

  private async checkPostingLimits(
    hrUserId: number,
    jobData: InsertJob
  ): Promise<void> {
    const hrProfile = await storage.getHrProfileByUserId(hrUserId);
    if (!hrProfile) {
      throw new Error('HR profile not found');
    }

    // Check monthly posting limit
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyJobs = await this.getMonthlyJobCount(hrUserId, currentMonth);
    const limit =
      hrProfile.monthlyJobPostLimit ||
      JOB_POSTING_LIMITS.FREE_PLAN.monthlyLimit;

    if (limit !== -1 && monthlyJobs >= limit) {
      throw new Error(`Monthly job posting limit (${limit}) exceeded`);
    }

    // Check featured job limits
    if (jobData.isFeatured) {
      const plan = this.getHrPlan(hrProfile);
      const featuredLimit = JOB_POSTING_LIMITS[plan].featuredJobsLimit;

      if (featuredLimit === 0) {
        throw new Error('Featured jobs not available in your plan');
      }

      if (featuredLimit !== -1) {
        const featuredJobs = await this.getFeaturedJobCount(
          hrUserId,
          currentMonth
        );
        if (featuredJobs >= featuredLimit) {
          throw new Error(
            `Featured job limit (${featuredLimit}) exceeded for this month`
          );
        }
      }
    }

    // Check urgent job limits
    if (jobData.isUrgent) {
      const plan = this.getHrPlan(hrProfile);
      const urgentLimit = JOB_POSTING_LIMITS[plan].urgentJobsLimit;

      if (urgentLimit === 0) {
        throw new Error('Urgent jobs not available in your plan');
      }

      if (urgentLimit !== -1) {
        const urgentJobs = await this.getUrgentJobCount(hrUserId, currentMonth);
        if (urgentJobs >= urgentLimit) {
          throw new Error(
            `Urgent job limit (${urgentLimit}) exceeded for this month`
          );
        }
      }
    }
  }

  private async checkPublishingLimits(
    hrUserId: number,
    job: Job
  ): Promise<void> {
    // Additional checks when publishing a job
    if (job.isFeatured || job.isUrgent) {
      // Convert Job to InsertJob-like structure for limits checking
      const jobData: Pick<InsertJob, 'isFeatured' | 'isUrgent'> = {
        isFeatured: job.isFeatured,
        isUrgent: job.isUrgent,
      };
      await this.checkPostingLimits(hrUserId, jobData as InsertJob);
    }
  }

  private async validateJobPosting(
    jobData: InsertJob
  ): Promise<JobValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields based on business rules
    if (!jobData.description || jobData.description.length < 50) {
      errors.push('Job description must be at least 50 characters long');
    }

    if (jobData.description && jobData.description.length > 5000) {
      errors.push('Job description cannot exceed 5000 characters');
    }

    if (!jobData.location || jobData.location.trim().length === 0) {
      errors.push('Job location is required');
    }

    // Validate salary range
    if (jobData.salaryMin && jobData.salaryMin < 0) {
      errors.push('Minimum salary cannot be negative');
    }

    if (jobData.salaryMax && jobData.salaryMax < 0) {
      errors.push('Maximum salary cannot be negative');
    }

    // Check for realistic salary ranges
    if (jobData.salaryMin && jobData.salaryMax) {
      const ratio = jobData.salaryMax / jobData.salaryMin;
      if (ratio > 3) {
        warnings.push(
          'Large salary range detected - consider narrowing the range'
        );
      }
    }

    // Validate skills
    if (jobData.requiredSkills && Array.isArray(jobData.requiredSkills)) {
      if (jobData.requiredSkills.length === 0) {
        warnings.push(
          'Consider adding required skills to attract better candidates'
        );
      }

      if (jobData.requiredSkills.length > 20) {
        warnings.push('Too many required skills might discourage candidates');
      }
    }

    // Validate application deadline
    if (jobData.applicationDeadline) {
      const deadline = new Date(jobData.applicationDeadline);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (deadline < thirtyDaysFromNow) {
        warnings.push(
          'Short application deadline might reduce the number of applications'
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): Promise<void> {
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async validatePublishedJobUpdate(
    currentJob: Job,
    updateData: any
  ): Promise<void> {
    // List of fields that cannot be changed once published
    const immutableFields = ['employmentType', 'workType'];

    for (const field of immutableFields) {
      if (
        updateData[field] &&
        updateData[field] !== currentJob[field as keyof Job]
      ) {
        throw new Error(`Cannot change ${field} of a published job`);
      }
    }

    // Salary changes should be limited
    if (updateData.salaryMin && currentJob.salaryMin) {
      const changePercent =
        Math.abs(
          (updateData.salaryMin - currentJob.salaryMin) / currentJob.salaryMin
        ) * 100;
      if (changePercent > 20) {
        throw new Error(
          'Cannot change minimum salary by more than 20% for published jobs'
        );
      }
    }

    if (updateData.salaryMax && currentJob.salaryMax) {
      const changePercent =
        Math.abs(
          (updateData.salaryMax - currentJob.salaryMax) / currentJob.salaryMax
        ) * 100;
      if (changePercent > 20) {
        throw new Error(
          'Cannot change maximum salary by more than 20% for published jobs'
        );
      }
    }
  }

  private async validateJobForPublishing(job: Job): Promise<void> {
    const errors: string[] = [];

    if (!job.description || job.description.length < 50) {
      errors.push(
        'Job description must be at least 50 characters for publishing'
      );
    }

    if (!job.location) {
      errors.push('Job location is required for publishing');
    }

    if (!job.categoryId) {
      errors.push('Job category is required for publishing');
    }

    if (
      !job.requiredSkills ||
      (Array.isArray(job.requiredSkills) && job.requiredSkills.length === 0)
    ) {
      errors.push(
        'At least one required skill must be specified for publishing'
      );
    }

    if (errors.length > 0) {
      throw new Error(`Job cannot be published: ${errors.join(', ')}`);
    }
  }

  private async getJobWithOwnershipCheck(
    jobId: number,
    hrUserId: number
  ): Promise<Job> {
    const job = await storage.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.hrUserId !== hrUserId) {
      throw new Error(
        'Access denied: You can only manage your own job postings'
      );
    }

    return job;
  }

  private async updateHrJobStats(
    hrUserId: number,
    action: string
  ): Promise<void> {
    const hrProfile = await storage.getHrProfileByUserId(hrUserId);
    if (!hrProfile) return;

    let updateData: any = {};

    switch (action) {
      case 'created':
      case 'published':
        updateData.totalJobsPosted = (hrProfile.totalJobsPosted || 0) + 1;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await storage.updateHrProfile(hrProfile.id, updateData);
    }
  }

  private async logJobActivity(
    jobId: number,
    hrUserId: number,
    action: string,
    description: string
  ): Promise<void> {
    // Implementation would depend on your activity logging system
    console.log(
      `Job ${jobId} - ${action}: ${description} by HR user ${hrUserId}`
    );
  }

  private async notifyJobPublication(job: Job): Promise<void> {
    // Implementation for notifying relevant candidates about new job
    // This could include:
    // - Sending job alerts to matching candidates
    // - Notifying users who saved similar jobs
    // - Integration with external job boards
    console.log(`Job published: ${job.title} (ID: ${job.id})`);
  }

  private async calculateJobStats(hrUserId: number): Promise<JobPostingStats> {
    const allJobs = await storage.getJobsByHrUserId(hrUserId);

    const stats: JobPostingStats = {
      totalJobs: allJobs.length,
      publishedJobs: 0,
      draftJobs: 0,
      pausedJobs: 0,
      closedJobs: 0,
      expiredJobs: 0,
      totalViews: 0,
      totalApplications: 0,
      thisMonthJobs: 0,
    };

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    for (const job of allJobs) {
      // Count by status
      switch (job.status) {
        case 'published':
          stats.publishedJobs++;
          break;
        case 'draft':
          stats.draftJobs++;
          break;
        case 'paused':
          stats.pausedJobs++;
          break;
        case 'closed':
          stats.closedJobs++;
          break;
        case 'expired':
          stats.expiredJobs++;
          break;
      }

      // Accumulate views and applications
      stats.totalViews += job.viewCount || 0;
      stats.totalApplications += job.applicationCount || 0;

      // Count this month's jobs
      if (new Date(job.createdAt) >= currentMonth) {
        stats.thisMonthJobs++;
      }
    }

    return stats;
  }

  private calculateDailyHistory(
    items: any[],
    days: number,
    type: 'views' | 'applications' = 'views'
  ): Array<{ date: string; views?: number; applications?: number }> {
    const history: Array<{
      date: string;
      views?: number;
      applications?: number;
    }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = items.filter((item) => {
        const itemDate = new Date(item.createdAt || item.appliedAt);
        return itemDate >= date && itemDate < nextDate;
      }).length;

      const historyItem: {
        date: string;
        views?: number;
        applications?: number;
      } = {
        date: date.toISOString().split('T')[0],
      };

      if (type === 'views') {
        historyItem.views = count;
      } else {
        historyItem.applications = count;
      }

      history.push(historyItem);
    }

    return history;
  }

  private getHrPlan(
    hrProfile: HrProfile
  ): 'FREE_PLAN' | 'PREMIUM_PLAN' | 'ENTERPRISE_PLAN' {
    if (hrProfile.subscriptionPlan === 'enterprise') return 'ENTERPRISE_PLAN';
    if (hrProfile.isPremium) return 'PREMIUM_PLAN';
    return 'FREE_PLAN';
  }

  private async getMonthlyJobCount(
    hrUserId: number,
    fromDate: Date
  ): Promise<number> {
    const jobs = await storage.getJobsByHrUserId(hrUserId);
    return jobs.filter((job) => new Date(job.createdAt) >= fromDate).length;
  }

  private async getFeaturedJobCount(
    hrUserId: number,
    fromDate: Date
  ): Promise<number> {
    const jobs = await storage.getJobsByHrUserId(hrUserId);
    return jobs.filter(
      (job) => job.isFeatured && new Date(job.createdAt) >= fromDate
    ).length;
  }

  private async getUrgentJobCount(
    hrUserId: number,
    fromDate: Date
  ): Promise<number> {
    const jobs = await storage.getJobsByHrUserId(hrUserId);
    return jobs.filter(
      (job) => job.isUrgent && new Date(job.createdAt) >= fromDate
    ).length;
  }
}

// Create and export the service instance
export const jobService = new JobService();
