import { storage } from '../storage';
import { 
  type JobAlert,
  type InsertJobAlert,
  type Job,
  insertJobAlertSchema
} from '@shared/schema';
import { jobDiscoveryService } from './jobDiscoveryService';

interface JobAlertWithMatches extends JobAlert {
  newJobsCount: number;
  lastTriggered?: Date;
}

export class JobAlertsService {
  // Create a job alert
  async createJobAlert(candidateUserId: number, alertData: InsertJobAlert): Promise<JobAlert> {
    // Validate alert data
    const validation = insertJobAlertSchema.safeParse(alertData);
    if (!validation.success) {
      throw new Error(`Invalid alert data: ${validation.error.errors.map(e => e.message).join(', ')}`);
    }

    // Check for duplicate alerts
    const existingAlerts = await storage.getJobAlertsByUserId(candidateUserId);
    const isDuplicate = existingAlerts.some(alert => 
      alert.keywords === alertData.keywords &&
      alert.location === alertData.location &&
      alert.categoryId === alertData.categoryId
    );

    if (isDuplicate) {
      throw new Error('A similar job alert already exists');
    }

    // Create the alert
    const alert = await storage.createJobAlert({
      ...validation.data,
      candidateUserId,
    });

    return alert;
  }

  // Get user's job alerts
  async getUserJobAlerts(candidateUserId: number): Promise<JobAlertWithMatches[]> {
    const alerts = await storage.getJobAlertsByUserId(candidateUserId);
    
    // Add matching jobs count for each alert
    const alertsWithMatches = await Promise.all(
      alerts.map(async (alert) => {
        const newJobsCount = await this.getNewJobsCount(alert);
        return {
          ...alert,
          newJobsCount,
          lastTriggered: alert.lastSentAt ? new Date(alert.lastSentAt) : undefined,
        };
      })
    );

    return alertsWithMatches;
  }

  // Update job alert
  async updateJobAlert(alertId: number, candidateUserId: number, updateData: Partial<JobAlert>): Promise<JobAlert> {
    const alert = await storage.getJobAlertsByUserId(candidateUserId);
    const existingAlert = alert.find(a => a.id === alertId);
    
    if (!existingAlert) {
      throw new Error('Job alert not found');
    }

    const updatedAlert = await storage.updateJobAlert(alertId, updateData);
    if (!updatedAlert) {
      throw new Error('Failed to update job alert');
    }

    return updatedAlert;
  }

  // Delete job alert
  async deleteJobAlert(alertId: number, candidateUserId: number): Promise<boolean> {
    const alerts = await storage.getJobAlertsByUserId(candidateUserId);
    const existingAlert = alerts.find(a => a.id === alertId);
    
    if (!existingAlert) {
      throw new Error('Job alert not found');
    }

    return await storage.deleteJobAlert(alertId);
  }

  // Toggle job alert active status
  async toggleJobAlert(alertId: number, candidateUserId: number): Promise<JobAlert> {
    const alerts = await storage.getJobAlertsByUserId(candidateUserId);
    const existingAlert = alerts.find(a => a.id === alertId);
    
    if (!existingAlert) {
      throw new Error('Job alert not found');
    }

    const updatedAlert = await storage.updateJobAlert(alertId, {
      isActive: !existingAlert.isActive,
    });

    if (!updatedAlert) {
      throw new Error('Failed to toggle job alert');
    }

    return updatedAlert;
  }

  // Get jobs matching an alert
  async getJobsForAlert(alertId: number, candidateUserId: number, limit: number = 20): Promise<Job[]> {
    const alerts = await storage.getJobAlertsByUserId(candidateUserId);
    const alert = alerts.find(a => a.id === alertId);
    
    if (!alert) {
      throw new Error('Job alert not found');
    }

    const searchParams = {
      query: alert.keywords || undefined,
      location: alert.location || undefined,
      categoryId: alert.categoryId || undefined,
      workType: alert.workType as 'remote' | 'hybrid' | 'onsite' | undefined,
      employmentType: alert.employmentType as 'full-time' | 'part-time' | 'contract' | 'internship' | undefined,
      experienceLevel: alert.experienceLevel as 'entry' | 'mid' | 'senior' | 'executive' | undefined,
      salaryMin: alert.salaryMin || undefined,
      posted: 'week' as const, // Only recent jobs for alerts
    };

    const result = await jobDiscoveryService.searchJobs(searchParams, candidateUserId, 1, limit);
    return result.jobs.map(job => ({
      id: job.id,
      hrUserId: job.hrUserId,
      title: job.title,
      description: job.description,
      shortDescription: job.shortDescription,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      companyWebsite: job.companyWebsite,
      location: job.location,
      workType: job.workType,
      country: job.country,
      city: job.city,
      categoryId: job.categoryId,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      salaryPeriod: job.salaryPeriod,
      salaryNegotiable: job.salaryNegotiable,
      showSalary: job.showSalary,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      requiredEducation: job.requiredEducation,
      requiredExperience: job.requiredExperience,
      languages: job.languages,
      benefits: job.benefits,
      perks: job.perks,
      applicationInstructions: job.applicationInstructions,
      applicationUrl: job.applicationUrl,
      applicationDeadline: job.applicationDeadline,
      startDate: job.startDate,
      isUrgent: job.isUrgent,
      isFeatured: job.isFeatured,
      isRemote: job.isRemote,
      tags: job.tags,
      status: job.status,
      viewCount: job.viewCount,
      applicationCount: job.applicationCount,
      slug: job.slug,
      publishedAt: job.publishedAt,
      expiresAt: job.expiresAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      metaTitle: job.metaTitle,
      metaDescription: job.metaDescription,
      shareCount: job.shareCount
    }));
  }

  // Process job alerts (called by cron job or background service)
  async processJobAlerts(): Promise<void> {
    const activeAlerts = await storage.getActiveJobAlerts();
    
    for (const alert of activeAlerts) {
      try {
        const matchingJobs = await this.getJobsForAlert(alert.id, alert.candidateUserId, 10);
        
        if (matchingJobs.length > 0) {
          // Send notification (email, push, etc.)
          await this.sendAlertNotification(alert, matchingJobs);
          
          // Update last triggered timestamp
          await storage.updateJobAlert(alert.id, {
            lastSentAt: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }
  }

  // Private helper methods

  private async getNewJobsCount(alert: JobAlert): Promise<number> {
    const searchParams = {
      query: alert.keywords || undefined,
      location: alert.location || undefined,
      categoryId: alert.categoryId || undefined,
      workType: alert.workType as 'remote' | 'hybrid' | 'onsite' | undefined,
      employmentType: alert.employmentType as 'full-time' | 'part-time' | 'contract' | 'internship' | undefined,
      experienceLevel: alert.experienceLevel as 'entry' | 'mid' | 'senior' | 'executive' | undefined,
      salaryMin: alert.salaryMin || undefined,
      posted: 'week' as const,
    };

    const result = await jobDiscoveryService.searchJobs(searchParams, alert.candidateUserId, 1, 1);
    return result.total;
  }

  private async sendAlertNotification(alert: JobAlert, jobs: Job[]): Promise<void> {
    // Implementation for sending notifications
    // This could include:
    // - Email notifications
    // - Push notifications
    // - In-app notifications
    console.log(`Alert triggered for user ${alert.candidateUserId}: ${jobs.length} new jobs found`);
  }
}

// Create and export the service instance
export const jobAlertsService = new JobAlertsService();