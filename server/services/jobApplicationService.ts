import { storage } from '../storage';
import {
  type JobApplication,
  type InsertJobApplication,
  type UpdateJobApplicationRequest,
  type Job,
  type CV,
  type CandidateProfile,
  insertJobApplicationSchema,
  updateJobApplicationSchema,
} from '@shared/schema';
import { z } from 'zod';

// Extended application validation
const jobApplicationValidationSchema = insertJobApplicationSchema.extend({
  coverLetter: z
    .string()
    .min(50, 'Cover letter must be at least 50 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters')
    .optional(),
  additionalNotes: z
    .string()
    .max(500, 'Additional notes cannot exceed 500 characters')
    .optional(),
  portfolioUrl: z
    .string()
    .url('Invalid portfolio URL')
    .optional()
    .or(z.literal('')),
});

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  shortlistedApplications: number;
  interviewedApplications: number;
  offeredApplications: number;
  hiredApplications: number;
  rejectedApplications: number;
  withdrawnApplications: number;
  responseRate: number;
  averageResponseTime: number;
}

interface ApplicationAnalytics {
  applicationsByMonth: Array<{ month: string; count: number }>;
  applicationsByStatus: Array<{ status: string; count: number }>;
  applicationsByCategory: Array<{ category: string; count: number }>;
  topCompanies: Array<{ company: string; applications: number }>;
  successRate: number;
  averageTimeToResponse: number;
}

export class JobApplicationService {
  // Apply for a job
  async applyForJob(
    candidateUserId: number,
    applicationData: InsertJobApplication
  ): Promise<JobApplication> {
    // Validate application data
    const validation =
      jobApplicationValidationSchema.safeParse(applicationData);
    if (!validation.success) {
      throw new Error(
        `Invalid application data: ${validation.error.errors
          .map((e) => e.message)
          .join(', ')}`
      );
    }

    // Check if job exists and is available
    const job = await storage.getJobById(applicationData.jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'published') {
      throw new Error('Job is no longer available for applications');
    }

    // Check application deadline
    if (
      job.applicationDeadline &&
      new Date(job.applicationDeadline) < new Date()
    ) {
      throw new Error('Application deadline has passed');
    }

    // Check if already applied
    const existingApplication = await storage.checkExistingApplication(
      applicationData.jobId,
      candidateUserId
    );

    if (existingApplication) {
      throw new Error('You have already applied for this job');
    }

    // Validate CV belongs to candidate
    if (applicationData.cvId) {
      const cv = await storage.getCVById(applicationData.cvId);
      if (!cv || cv.userId !== candidateUserId) {
        throw new Error('Invalid CV selected');
      }
    }

    // Validate candidate profile exists
    const candidateProfile = await storage.getCandidateProfileByUserId(
      candidateUserId
    );
    if (!candidateProfile) {
      throw new Error('Please complete your candidate profile before applying');
    }

    // Business validation
    await this.validateApplicationEligibility(candidateProfile, job);

    // Create application
    const application = await storage.createJobApplication({
      ...validation.data,
      candidateUserId,
    });

    // Log application activity
    await this.logApplicationActivity(
      application.id,
      candidateUserId,
      'applied',
      'Applied for job'
    );

    // Send notifications
    await this.notifyApplicationSubmission(application, job, candidateProfile);

    return application;
  }

  // Get candidate's applications
  async getCandidateApplications(
    candidateUserId: number,
    filters: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    applications: Array<JobApplication & { job: Job }>;
    total: number;
    pages: number;
    stats: ApplicationStats;
  }> {
    const { page = 1, limit = 10 } = filters;

    // Get all applications for the candidate
    let applications = await storage.getJobApplicationsByCandidateId(
      candidateUserId
    );

    // Get job details for each application
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        const job = await storage.getJobById(app.jobId);
        return { ...app, job: job! };
      })
    );

    // Apply filters
    let filteredApplications = applicationsWithJobs;

    if (filters.status) {
      filteredApplications = filteredApplications.filter(
        (app) => app.status === filters.status
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredApplications = filteredApplications.filter(
        (app) =>
          app.job.title.toLowerCase().includes(searchLower) ||
          app.job.companyName.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = filteredApplications.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedApplications = filteredApplications.slice(
      offset,
      offset + limit
    );

    // Calculate stats
    const stats = this.calculateApplicationStats(applications);

    return {
      applications: paginatedApplications,
      total,
      pages,
      stats,
    };
  }

  // Get application details
  async getApplicationDetails(
    applicationId: number,
    candidateUserId: number
  ): Promise<{
    application: JobApplication;
    job: Job;
    timeline: Array<{
      status: string;
      date: Date;
      note?: string;
    }>;
  }> {
    const application = await storage.getJobApplicationById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Check ownership
    if (application.candidateUserId !== candidateUserId) {
      throw new Error('Access denied: You can only view your own applications');
    }

    const job = await storage.getJobById(application.jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Generate timeline
    const timeline = this.generateApplicationTimeline(application);

    return {
      application,
      job,
      timeline,
    };
  }

  // Withdraw application
  async withdrawApplication(
    applicationId: number,
    candidateUserId: number
  ): Promise<JobApplication> {
    const application = await storage.getJobApplicationById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Check ownership
    if (application.candidateUserId !== candidateUserId) {
      throw new Error(
        'Access denied: You can only withdraw your own applications'
      );
    }

    // Check if withdrawal is allowed
    if (['hired', 'rejected', 'withdrawn'].includes(application.status)) {
      throw new Error('Cannot withdraw application in current status');
    }

    // Withdraw application
    const withdrawnApplication = await storage.withdrawJobApplication(
      applicationId
    );
    if (!withdrawnApplication) {
      throw new Error('Failed to withdraw application');
    }

    // Log activity
    await this.logApplicationActivity(
      applicationId,
      candidateUserId,
      'withdrawn',
      'Application withdrawn by candidate'
    );

    return withdrawnApplication;
  }

  // Get application analytics
  async getApplicationAnalytics(
    candidateUserId: number
  ): Promise<ApplicationAnalytics> {
    const applications = await storage.getJobApplicationsByCandidateId(
      candidateUserId
    );

    // Get job details for analytics
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        const job = await storage.getJobById(app.jobId);
        return { ...app, job: job! };
      })
    );

    return {
      applicationsByMonth: this.calculateApplicationsByMonth(applications),
      applicationsByStatus: this.calculateApplicationsByStatus(applications),
      applicationsByCategory:
        this.calculateApplicationsByCategory(applicationsWithJobs),
      topCompanies: this.calculateTopCompanies(applicationsWithJobs),
      successRate: this.calculateSuccessRate(applications),
      averageTimeToResponse: this.calculateAverageResponseTime(applications),
    };
  }

  // Get recommended jobs based on application history
  async getRecommendedJobsForCandidate(
    candidateUserId: number,
    limit: number = 10
  ): Promise<Job[]> {
    const applications = await storage.getJobApplicationsByCandidateId(
      candidateUserId
    );
    const appliedJobIds = applications.map((app) => app.jobId);

    // Get applied jobs to understand preferences
    const appliedJobs = await Promise.all(
      appliedJobIds.slice(0, 10).map((id) => storage.getJobById(id))
    );

    // Extract preferences from applied jobs
    const preferredCategories = this.extractPreferredCategories(
      appliedJobs.filter(Boolean) as Job[]
    );
    const preferredSkills = this.extractPreferredSkills(
      appliedJobs.filter(Boolean) as Job[]
    );
    const preferredLocations = this.extractPreferredLocations(
      appliedJobs.filter(Boolean) as Job[]
    );

    // Search for similar jobs
    const searchResult = await storage.searchJobs(
      {
        skills: preferredSkills,
        categoryId: preferredCategories[0]?.id,
      },
      1,
      limit * 2
    );

    // Filter out already applied jobs
    const availableJobs = searchResult.jobs.filter(
      (job) => !appliedJobIds.includes(job.id) && job.status === 'published'
    );

    return availableJobs.slice(0, limit);
  }

  // Bulk operations
  async bulkWithdrawApplications(
    applicationIds: number[],
    candidateUserId: number
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of applicationIds) {
      try {
        await this.withdrawApplication(id, candidateUserId);
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Application ${id}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  // Get application insights
  async getApplicationInsights(candidateUserId: number): Promise<{
    insights: string[];
    recommendations: string[];
    trends: Array<{ metric: string; value: number; change: number }>;
  }> {
    const applications = await storage.getJobApplicationsByCandidateId(
      candidateUserId
    );
    const analytics = await this.getApplicationAnalytics(candidateUserId);

    const insights: string[] = [];
    const recommendations: string[] = [];
    const trends: Array<{ metric: string; value: number; change: number }> = [];

    // Generate insights based on application data
    if (applications.length > 0) {
      const responseRate = analytics.successRate;

      if (responseRate < 10) {
        insights.push('Your application response rate is below average');
        recommendations.push('Consider improving your CV and cover letters');
      } else if (responseRate > 30) {
        insights.push('You have a high application response rate');
      }

      if (analytics.averageTimeToResponse > 14) {
        insights.push('Companies are taking longer than average to respond');
      }

      // Add more insight logic...
    }

    return { insights, recommendations, trends };
  }

  // Private helper methods

  private async validateApplicationEligibility(
    candidateProfile: CandidateProfile,
    job: Job
  ): Promise<void> {
    // Check experience requirements
    if (job.requiredExperience && candidateProfile.yearsOfExperience) {
      const candidateExp = candidateProfile.yearsOfExperience as number;
      if (candidateExp < job.requiredExperience) {
        throw new Error(
          `This position requires ${job.requiredExperience} years of experience`
        );
      }
    }

    // Check if profile is complete enough
    const completeness = this.calculateProfileCompleteness(candidateProfile);
    if (completeness < 60) {
      throw new Error(
        'Please complete at least 60% of your profile before applying'
      );
    }

    // Check location restrictions (if any)
    if (
      job.workType === 'onsite' &&
      job.location &&
      candidateProfile.location
    ) {
      // Add distance/location validation if needed
    }
  }

  private calculateProfileCompleteness(profile: CandidateProfile): number {
    const fields = [
      'firstName',
      'lastName',
      'title',
      'bio',
      'location',
      'phone',
      'skills',
      'linkedinUrl',
      'expectedSalary',
    ];

    const completed = fields.filter((field) => {
      const value = (profile as any)[field];
      return value && value.toString().trim().length > 0;
    }).length;

    return (completed / fields.length) * 100;
  }

  private calculateApplicationStats(
    applications: JobApplication[]
  ): ApplicationStats {
    const stats: ApplicationStats = {
      totalApplications: applications.length,
      pendingApplications: 0,
      reviewingApplications: 0,
      shortlistedApplications: 0,
      interviewedApplications: 0,
      offeredApplications: 0,
      hiredApplications: 0,
      rejectedApplications: 0,
      withdrawnApplications: 0,
      responseRate: 0,
      averageResponseTime: 0,
    };

    applications.forEach((app) => {
      switch (app.status) {
        case 'pending':
          stats.pendingApplications++;
          break;
        case 'reviewing':
          stats.reviewingApplications++;
          break;
        case 'shortlisted':
          stats.shortlistedApplications++;
          break;
        case 'interviewed':
          stats.interviewedApplications++;
          break;
        case 'offered':
          stats.offeredApplications++;
          break;
        case 'hired':
          stats.hiredApplications++;
          break;
        case 'rejected':
          stats.rejectedApplications++;
          break;
        case 'withdrawn':
          stats.withdrawnApplications++;
          break;
      }
    });

    // Calculate response rate (applications that moved beyond pending)
    const respondedApplications = applications.filter(
      (app) => !['pending'].includes(app.status)
    ).length;
    stats.responseRate =
      applications.length > 0
        ? (respondedApplications / applications.length) * 100
        : 0;

    // Calculate average response time
    const responseTimes = applications
      .filter((app) => app.updatedAt && app.appliedAt)
      .map((app) => {
        const applied = new Date(app.appliedAt);
        const updated = new Date(app.updatedAt);
        return (updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24);
      });

    stats.averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    return stats;
  }

  private generateApplicationTimeline(application: JobApplication): Array<{
    status: string;
    date: Date;
    note?: string;
  }> {
    const timeline = [
      {
        status: 'applied',
        date: new Date(application.appliedAt),
        note: 'Application submitted',
      },
    ];

    if (application.status !== 'pending') {
      timeline.push({
        status: application.status,
        date: new Date(application.updatedAt),
        note: this.getStatusNote(application.status),
      });
    }

    if (application.interviewScheduledAt) {
      timeline.push({
        status: 'interview_scheduled',
        date: new Date(application.interviewScheduledAt),
        note: `${application.interviewType} interview scheduled`,
      });
    }

    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getStatusNote(status: string): string {
    const notes: Record<string, string> = {
      reviewing: 'Application is being reviewed',
      shortlisted: 'You have been shortlisted',
      interviewed: 'Interview completed',
      offered: 'Job offer received',
      hired: 'Congratulations! You got the job',
      rejected: 'Application was not successful',
      withdrawn: 'Application withdrawn',
    };
    return notes[status] || 'Status updated';
  }

  private calculateApplicationsByMonth(
    applications: JobApplication[]
  ): Array<{ month: string; count: number }> {
    const monthlyData = new Map<string, number>();

    applications.forEach((app) => {
      const month = new Date(app.appliedAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    return Array.from(monthlyData.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateApplicationsByStatus(
    applications: JobApplication[]
  ): Array<{ status: string; count: number }> {
    const statusData = new Map<string, number>();

    applications.forEach((app) => {
      statusData.set(app.status, (statusData.get(app.status) || 0) + 1);
    });

    return Array.from(statusData.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }

  private calculateApplicationsByCategory(
    applications: Array<JobApplication & { job: Job }>
  ): Array<{ category: string; count: number }> {
    const categoryData = new Map<string, number>();

    applications.forEach((app) => {
      if (app.job.categoryId) {
        const category = app.job.categoryId.toString(); // Would need category name lookup
        categoryData.set(category, (categoryData.get(category) || 0) + 1);
      }
    });

    return Array.from(categoryData.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  private calculateTopCompanies(
    applications: Array<JobApplication & { job: Job }>
  ): Array<{ company: string; applications: number }> {
    const companyData = new Map<string, number>();

    applications.forEach((app) => {
      const company = app.job.companyName;
      companyData.set(company, (companyData.get(company) || 0) + 1);
    });

    return Array.from(companyData.entries())
      .map(([company, applications]) => ({ company, applications }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);
  }

  private calculateSuccessRate(applications: JobApplication[]): number {
    const successfulApplications = applications.filter((app) =>
      ['shortlisted', 'interviewed', 'offered', 'hired'].includes(app.status)
    ).length;

    return applications.length > 0
      ? (successfulApplications / applications.length) * 100
      : 0;
  }

  private calculateAverageResponseTime(applications: JobApplication[]): number {
    const responseTimes = applications
      .filter(
        (app) => app.status !== 'pending' && app.updatedAt && app.appliedAt
      )
      .map((app) => {
        const applied = new Date(app.appliedAt);
        const updated = new Date(app.updatedAt);
        return (updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24);
      });

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
      : 0;
  }

  private extractPreferredCategories(
    jobs: Job[]
  ): Array<{ id: number; count: number }> {
    const categoryMap = new Map<number, number>();

    jobs.forEach((job) => {
      if (job.categoryId) {
        categoryMap.set(
          job.categoryId,
          (categoryMap.get(job.categoryId) || 0) + 1
        );
      }
    });

    return Array.from(categoryMap.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }

  private extractPreferredSkills(jobs: Job[]): string[] {
    const skillsSet = new Set<string>();

    jobs.forEach((job) => {
      const skills = (job.requiredSkills as string[]) || [];
      skills.forEach((skill) => skillsSet.add(skill));
    });

    return Array.from(skillsSet);
  }

  private extractPreferredLocations(jobs: Job[]): string[] {
    const locationsSet = new Set<string>();

    jobs.forEach((job) => {
      if (job.location) {
        locationsSet.add(job.location);
      }
    });

    return Array.from(locationsSet);
  }

  private async logApplicationActivity(
    applicationId: number,
    candidateUserId: number,
    action: string,
    description: string
  ): Promise<void> {
    // Implementation would depend on your activity logging system
    console.log(
      `Application ${applicationId} - ${action}: ${description} by candidate ${candidateUserId}`
    );
  }

  private async notifyApplicationSubmission(
    application: JobApplication,
    job: Job,
    candidateProfile: CandidateProfile
  ): Promise<void> {
    // Implementation for notifications
    // This could include:
    // - Email confirmation to candidate
    // - Notification to HR
    // - Integration with third-party services
    console.log(
      `Application submitted for ${job.title} by ${candidateProfile.firstName} ${candidateProfile.lastName}`
    );
  }
}

// Create and export the service instance
export const jobApplicationService = new JobApplicationService();
