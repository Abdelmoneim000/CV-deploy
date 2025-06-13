import { storage } from '../storage';
import { 
  type SavedJob,
  type InsertSavedJob,
  type Job,
  insertSavedJobSchema
} from '@shared/schema';

interface SavedJobWithDetails extends SavedJob {
  job: Job;
}

interface SavedJobsStats {
  totalSaved: number;
  savedByCategory: Array<{ category: string; count: number }>;
  savedByCompany: Array<{ company: string; count: number }>;
  recentActivity: Array<{ date: string; count: number }>;
}

export class SavedJobsService {
  // Save a job
  async saveJob(candidateUserId: number, jobId: number, notes?: string): Promise<SavedJob> {
    // Check if job exists
    const job = await storage.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Check if already saved
    const existingSavedJob = await storage.checkExistingSavedJob(candidateUserId, jobId);
    if (existingSavedJob) {
      throw new Error('Job is already saved');
    }

    // Validate input
    const validation = insertSavedJobSchema.safeParse({
      candidateUserId,
      jobId,
      notes: notes || '',
    });

    if (!validation.success) {
      throw new Error(`Invalid data: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    // Save the job
    const savedJob = await storage.createSavedJob(validation.data);

    // Log activity
    await this.logSavedJobActivity(candidateUserId, 'saved', `Saved job: ${job.title}`);

    return savedJob;
  }

  // Unsave a job
  async unsaveJob(candidateUserId: number, jobId: number): Promise<boolean> {
    // Check if job is saved
    const savedJob = await storage.checkExistingSavedJob(candidateUserId, jobId);
    if (!savedJob) {
      throw new Error('Job is not saved');
    }

    // Remove from saved jobs
    const deleted = await storage.deleteSavedJob(savedJob.id);

    if (deleted) {
      // Log activity
      await this.logSavedJobActivity(candidateUserId, 'unsaved', `Unsaved job ID: ${jobId}`);
    }

    return deleted;
  }

  // Get candidate's saved jobs
  async getSavedJobs(
    candidateUserId: number,
    filters: {
      search?: string;
      categoryId?: number;
      workType?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    savedJobs: SavedJobWithDetails[];
    total: number;
    pages: number;
    stats: SavedJobsStats;
  }> {
    const { page = 1, limit = 10 } = filters;

    // Get all saved jobs for the candidate
    const savedJobs = await storage.getSavedJobsByUserId(candidateUserId);

    // Get job details for each saved job
    const savedJobsWithDetails = await Promise.all(
      savedJobs.map(async (savedJob) => {
        const job = await storage.getJobById(savedJob.jobId);
        return { ...savedJob, job: job! };
      })
    );

    // Apply filters
    let filteredSavedJobs = savedJobsWithDetails;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSavedJobs = filteredSavedJobs.filter(savedJob => 
        savedJob.job.title.toLowerCase().includes(searchLower) ||
        savedJob.job.companyName.toLowerCase().includes(searchLower) ||
        (savedJob.notes && savedJob.notes.toLowerCase().includes(searchLower))
      );
    }

    if (filters.categoryId) {
      filteredSavedJobs = filteredSavedJobs.filter(savedJob => 
        savedJob.job.categoryId === filters.categoryId
      );
    }

    if (filters.workType) {
      filteredSavedJobs = filteredSavedJobs.filter(savedJob => 
        savedJob.job.workType === filters.workType
      );
    }

    // Sort by saved date (most recent first)
    filteredSavedJobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate pagination
    const total = filteredSavedJobs.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedSavedJobs = filteredSavedJobs.slice(offset, offset + limit);

    // Calculate stats
    const stats = this.calculateSavedJobsStats(savedJobsWithDetails);

    return {
      savedJobs: paginatedSavedJobs,
      total,
      pages,
      stats,
    };
  }

  // Update saved job notes
  async updateSavedJobNotes(
    candidateUserId: number,
    jobId: number,
    notes: string
  ): Promise<SavedJob> {
    // Check if job is saved
    const savedJob = await storage.checkExistingSavedJob(candidateUserId, jobId);
    if (!savedJob) {
      throw new Error('Job is not saved');
    }

    // Update notes (assuming we have an update method in storage)
    // For now, we'll delete and recreate
    await storage.deleteSavedJob(savedJob.id);
    const updatedSavedJob = await storage.createSavedJob({
      candidateUserId,
      jobId,
      notes,
    });

    return updatedSavedJob;
  }

  // Get saved job details
  async getSavedJobDetails(
    candidateUserId: number,
    jobId: number
  ): Promise<SavedJobWithDetails> {
    // Check if job is saved
    const savedJob = await storage.checkExistingSavedJob(candidateUserId, jobId);
    if (!savedJob) {
      throw new Error('Job is not saved');
    }

    // Get job details
    const job = await storage.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    return { ...savedJob, job };
  }

  // Check if a job is saved
  async isJobSaved(candidateUserId: number, jobId: number): Promise<boolean> {
    const savedJob = await storage.checkExistingSavedJob(candidateUserId, jobId);
    return !!savedJob;
  }

  // Bulk operations
  async bulkUnsaveJobs(
    candidateUserId: number,
    jobIds: number[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const jobId of jobIds) {
      try {
        await this.unsaveJob(candidateUserId, jobId);
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Job ${jobId}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  // Get saved jobs insights
  async getSavedJobsInsights(candidateUserId: number): Promise<{
    insights: string[];
    recommendations: string[];
    trends: Array<{ metric: string; value: number; change: number }>;
  }> {
    const { savedJobs, stats } = await this.getSavedJobs(candidateUserId, { limit: 1000 });

    const insights: string[] = [];
    const recommendations: string[] = [];
    const trends: Array<{ metric: string; value: number; change: number }> = [];

    if (savedJobs.length === 0) {
      insights.push('You haven\'t saved any jobs yet');
      recommendations.push('Start saving jobs that interest you to track them easily');
    } else {
      insights.push(`You have saved ${savedJobs.length} jobs`);
      
      // Check for expired jobs
      const expiredJobs = savedJobs.filter(savedJob => {
        const job = savedJob.job;
        return job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
      });

      if (expiredJobs.length > 0) {
        insights.push(`${expiredJobs.length} of your saved jobs have expired`);
        recommendations.push('Consider removing expired jobs or looking for similar opportunities');
      }

      // Check for jobs with upcoming deadlines
      const urgentJobs = savedJobs.filter(savedJob => {
        const job = savedJob.job;
        if (!job.applicationDeadline) return false;
        const deadline = new Date(job.applicationDeadline);
        const now = new Date();
        const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 7;
      });

      if (urgentJobs.length > 0) {
        insights.push(`${urgentJobs.length} saved jobs have application deadlines within 7 days`);
        recommendations.push('Consider applying to jobs with upcoming deadlines');
      }

      // Most saved category
      if (stats.savedByCategory.length > 0) {
        const topCategory = stats.savedByCategory[0];
        insights.push(`Most of your saved jobs are in ${topCategory.category} (${topCategory.count} jobs)`);
      }
    }

    return { insights, recommendations, trends };
  }

  // Export saved jobs
  async exportSavedJobs(
    candidateUserId: number,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const { savedJobs } = await this.getSavedJobs(candidateUserId, { limit: 1000 });

    if (format === 'json') {
      return JSON.stringify(savedJobs.map(savedJob => ({
        jobTitle: savedJob.job.title,
        company: savedJob.job.companyName,
        location: savedJob.job.location,
        workType: savedJob.job.workType,
        employmentType: savedJob.job.employmentType,
        salary: savedJob.job.salaryMin && savedJob.job.salaryMax 
          ? `${savedJob.job.salaryMin} - ${savedJob.job.salaryMax} ${savedJob.job.salaryCurrency}`
          : 'Not specified',
        notes: savedJob.notes || '',
        savedDate: savedJob.createdAt,
        applicationDeadline: savedJob.job.applicationDeadline || 'Not specified',
      })), null, 2);
    }

    // CSV format
    const headers = [
      'Job Title', 'Company', 'Location', 'Work Type', 'Employment Type', 
      'Salary', 'Notes', 'Saved Date', 'Application Deadline'
    ].join(',');

    const rows = savedJobs.map(savedJob => [
      `"${savedJob.job.title}"`,
      `"${savedJob.job.companyName}"`,
      `"${savedJob.job.location}"`,
      `"${savedJob.job.workType}"`,
      `"${savedJob.job.employmentType}"`,
      savedJob.job.salaryMin && savedJob.job.salaryMax 
        ? `"${savedJob.job.salaryMin} - ${savedJob.job.salaryMax} ${savedJob.job.salaryCurrency}"`
        : '"Not specified"',
      `"${(savedJob.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(savedJob.createdAt).toLocaleDateString()}"`,
      `"${savedJob.job.applicationDeadline ? new Date(savedJob.job.applicationDeadline).toLocaleDateString() : 'Not specified'}"`,
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  // Private helper methods

  private async logSavedJobActivity(
    candidateUserId: number,
    action: string,
    description: string
  ): Promise<void> {
    // Implementation would depend on your activity logging system
    console.log(`Saved job activity - User ${candidateUserId}: ${action} - ${description}`);
  }

  private calculateSavedJobsStats(savedJobs: SavedJobWithDetails[]): SavedJobsStats {
    // Calculate stats by category
    const categoryMap = new Map<string, number>();
    savedJobs.forEach(savedJob => {
      const categoryId = savedJob.job.categoryId?.toString() || 'Other';
      categoryMap.set(categoryId, (categoryMap.get(categoryId) || 0) + 1);
    });

    // Calculate stats by company
    const companyMap = new Map<string, number>();
    savedJobs.forEach(savedJob => {
      const company = savedJob.job.companyName;
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    });

    // Calculate recent activity (last 30 days)
    const activityMap = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    savedJobs
      .filter(savedJob => new Date(savedJob.createdAt) >= thirtyDaysAgo)
      .forEach(savedJob => {
        const date = new Date(savedJob.createdAt).toISOString().split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });

    return {
      totalSaved: savedJobs.length,
      savedByCategory: Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      savedByCompany: Array.from(companyMap.entries())
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      recentActivity: Array.from(activityMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}

// Create and export the service instance
export const savedJobsService = new SavedJobsService();