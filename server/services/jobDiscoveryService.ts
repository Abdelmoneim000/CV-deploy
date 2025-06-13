import { storage } from '../storage';
import { 
  type Job, 
  type JobApplication,
  type SavedJob,
  type JobAlert,
  type CandidateProfile,
  type CV,
  insertJobApplicationSchema,
  insertSavedJobSchema,
  insertJobAlertSchema
} from '@shared/schema';
import { z } from 'zod';
import { aiJobMatchingService } from './aiJobMatchingService';

// Enhanced search parameters
interface JobSearchParams {
  query?: string;
  location?: string;
  workType?: 'remote' | 'hybrid' | 'onsite';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  salaryMin?: number;
  salaryMax?: number;
  categoryId?: number;
  skills?: string[];
  benefits?: string[];
  companySize?: string;
  posted?: 'today' | 'week' | 'month';
  sortBy?: 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}

interface JobSearchResult {
  jobs: EnhancedJob[];
  total: number;
  pages: number;
  facets: JobSearchFacets;
  recommendations?: Job[];
}

interface EnhancedJob extends Job {
  matchScore?: number;
  distance?: string;
  isApplied?: boolean;
  isSaved?: boolean;
  similarJobs?: number;
  companyJobs?: number;
}

interface JobSearchFacets {
  locations: Array<{ location: string; count: number }>;
  workTypes: Array<{ type: string; count: number }>;
  experienceLevels: Array<{ level: string; count: number }>;
  salaryRanges: Array<{ range: string; count: number }>;
  categories: Array<{ category: string; count: number }>;
  companies: Array<{ company: string; count: number }>;
}

interface JobRecommendation {
  job: Job;
  score: number;
  reasons: string[];
  matchingSkills: string[];
  salaryMatch: boolean;
  locationMatch: boolean;
}

export class JobDiscoveryService {
  // Advanced job search with personalization
  async searchJobs(
    searchParams: JobSearchParams,
    candidateUserId?: number,
    page: number = 1,
    limit: number = 20
  ): Promise<JobSearchResult> {
    // Get basic search results
    const searchResult = await storage.searchJobs(searchParams, page, limit);
    
    // Enhance jobs with candidate-specific data
    const enhancedJobs = await this.enhanceJobsForCandidate(
      searchResult.jobs,
      candidateUserId
    );

    // Calculate match scores if candidate is provided
    if (candidateUserId) {
      const candidateProfile = await storage.getCandidateProfileByUserId(candidateUserId);
      if (candidateProfile) {
        await this.calculateMatchScores(enhancedJobs, candidateProfile);
      }
    }

    // Generate search facets
    const facets = await this.generateSearchFacets(searchParams);

    // Get recommendations for logged-in candidates
    let recommendations: Job[] = [];
    if (candidateUserId) {
      recommendations = await this.getPersonalizedRecommendations(candidateUserId, 5);
    }

    return {
      jobs: enhancedJobs,
      total: searchResult.total,
      pages: searchResult.pages,
      facets,
      recommendations,
    };
  }

  // Get job details with related information
  async getJobDetails(
    jobId: number,
    candidateUserId?: number
  ): Promise<{
    job: EnhancedJob;
    similarJobs: Job[];
    companyJobs: Job[];
    applicationStatus?: JobApplication;
    isSaved: boolean;
  }> {
    const job = await storage.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Track job view
    if (candidateUserId) {
      await storage.createJobView(jobId, candidateUserId);
    }

    // Get similar jobs
    const similarJobs = await this.findSimilarJobs(job, 5);
    
    // Get other jobs from the same company
    const companyJobs = await this.getJobsByCompany(job.companyName, job.id, 5);

    // Check application status
    let applicationStatus: JobApplication | undefined;
    let isSaved = false;

    if (candidateUserId) {
      applicationStatus = await storage.checkExistingApplication(jobId, candidateUserId);
      const savedJob = await storage.checkExistingSavedJob(candidateUserId, jobId);
      isSaved = !!savedJob;
    }

    // Enhance job with candidate-specific data
    const enhancedJob = (await this.enhanceJobsForCandidate([job], candidateUserId))[0];

    return {
      job: enhancedJob,
      similarJobs,
      companyJobs,
      applicationStatus,
      isSaved,
    };
  }

  // Enhanced personalized recommendations using AI
  async getPersonalizedRecommendations(
    candidateUserId: number,
    limit: number = 10
  ): Promise<Job[]> {
    try {
      // Use AI matching service for better recommendations
      const aiMatches = await aiJobMatchingService.matchCandidateToJobs(
        candidateUserId,
        limit,
        false // Don't include skill gaps for recommendations
      );

      return aiMatches.map(match => match.job);
    } catch (error) {
      console.error('AI matching failed, falling back to basic recommendations:', error);
      
      // Fallback to existing logic
      const candidateProfile = await storage.getCandidateProfileByUserId(candidateUserId);
      if (!candidateProfile) {
        return [];
      }

      // Get candidate's CVs to understand skills and experience
      const cvs = await storage.getCVsByUserId(candidateUserId);
      const extractedSkills = this.extractSkillsFromCVs(cvs);

      // Get candidate's application history to understand preferences
      const applications = await storage.getJobApplicationsByCandidateId(candidateUserId);
      const appliedJobIds = applications.map(app => app.jobId);

      // Build recommendation criteria
      const searchParams: JobSearchParams = {
        skills: [...(candidateProfile.skills as string[] || []), ...extractedSkills],
        location: candidateProfile.location || undefined,
        workType: this.extractWorkTypePreference(candidateProfile),
        salaryMin: candidateProfile.expectedSalary ? Math.floor(candidateProfile.expectedSalary * 0.8) : undefined,
        experienceLevel: this.inferExperienceLevel(candidateProfile, cvs),
        categoryId: this.inferPreferredCategory(candidateProfile, applications),
      };

      // Get recommended jobs
      const searchResult = await storage.searchJobs(searchParams, 1, limit * 2);
      
      // Filter out already applied jobs
      const availableJobs = searchResult.jobs.filter(job => 
        !appliedJobIds.includes(job.id) && job.status === 'published'
      );

      // Score and rank recommendations
      const recommendations = await this.scoreJobRecommendations(
        availableJobs,
        candidateProfile,
        cvs
      );

      return recommendations.slice(0, limit);
    }
  }

  // Get trending jobs
  async getTrendingJobs(limit: number = 10): Promise<Job[]> {
    const searchResult = await storage.searchJobs({
      sortBy: 'date',
      sortOrder: 'desc'
    }, 1, limit * 2);

    // Calculate trending score based on views, applications, and recency
    const trendingJobs = searchResult.jobs
      .filter(job => job.status === 'published')
      .map(job => ({
        ...job,
        trendingScore: this.calculateTrendingScore(job)
      }))
      .sort((a, b) => (b as any).trendingScore - (a as any).trendingScore)
      .slice(0, limit);

    return trendingJobs;
  }

  // Get featured jobs
  async getFeaturedJobs(limit: number = 6): Promise<Job[]> {
    const searchResult = await storage.searchJobs({}, 1, 100);
    
    return searchResult.jobs
      .filter(job => job.isFeatured && job.status === 'published')
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
      .slice(0, limit);
  }

  // Get jobs by category
  async getJobsByCategory(
    categoryId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ jobs: Job[]; total: number; pages: number }> {
    return await storage.searchJobs({ categoryId }, page, limit);
  }

  // Get jobs by location
  async getJobsByLocation(
    location: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ jobs: Job[]; total: number; pages: number }> {
    return await storage.searchJobs({ location }, page, limit);
  }

  // Auto-complete search suggestions
  async getSearchSuggestions(query: string, type: 'jobs' | 'companies' | 'locations' = 'jobs'): Promise<string[]> {
    if (query.length < 2) return [];

    const searchResult = await storage.searchJobs({ query }, 1, 50);
    
    const suggestions = new Set<string>();
    
    searchResult.jobs.forEach(job => {
      switch (type) {
        case 'jobs':
          if (job.title.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(job.title);
          }
          break;
        case 'companies':
          if (job.companyName.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(job.companyName);
          }
          break;
        case 'locations':
          if (job.location.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(job.location);
          }
          break;
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  // Private helper methods

  private async enhanceJobsForCandidate(
    jobs: Job[],
    candidateUserId?: number
  ): Promise<EnhancedJob[]> {
    if (!candidateUserId) {
      return jobs.map(job => ({ ...job }));
    }

    const enhancedJobs: EnhancedJob[] = [];

    for (const job of jobs) {
      const application = await storage.checkExistingApplication(job.id, candidateUserId);
      const savedJob = await storage.checkExistingSavedJob(candidateUserId, job.id);
      
      // Get similar jobs count
      const similarJobsCount = await this.getSimilarJobsCount(job);
      
      // Get company jobs count
      const companyJobsCount = await this.getCompanyJobsCount(job.companyName, job.id);

      enhancedJobs.push({
        ...job,
        isApplied: !!application,
        isSaved: !!savedJob,
        similarJobs: similarJobsCount,
        companyJobs: companyJobsCount,
      });
    }

    return enhancedJobs;
  }

  private async calculateMatchScores(
    jobs: EnhancedJob[],
    candidateProfile: CandidateProfile
  ): Promise<void> {
    const candidateSkills = candidateProfile.skills as string[] || [];
    const candidateLocation = candidateProfile.location;
    const expectedSalary = candidateProfile.expectedSalary;

    for (const job of jobs) {
      let score = 0;
      
      // Skills match (40% weight)
      const jobSkills = job.requiredSkills as string[] || [];
      const skillsMatch = this.calculateSkillsMatch(candidateSkills, jobSkills);
      score += skillsMatch * 0.4;

      // Location match (20% weight)
      const locationMatch = this.calculateLocationMatch(candidateLocation || undefined, job.location);
      score += locationMatch * 0.2;

      // Salary match (20% weight)
      const salaryMatch = this.calculateSalaryMatch(expectedSalary || undefined, job.salaryMin || undefined , job.salaryMax || undefined);
      score += salaryMatch * 0.2;

      // Experience level match (10% weight)
      const experienceMatch = this.calculateExperienceMatch(candidateProfile, job);
      score += experienceMatch * 0.1;

      // Work type preferences (10% weight)
      const workTypeMatch = this.calculateWorkTypeMatch(candidateProfile, job);
      score += workTypeMatch * 0.1;

      job.matchScore = Math.round(score * 100);
    }
  }

  private calculateSkillsMatch(candidateSkills: string[], jobSkills: string[]): number {
    if (jobSkills.length === 0) return 0.5; // Neutral if no skills specified
    
    const matchingSkills = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    return Math.min(matchingSkills.length / jobSkills.length, 1);
  }

  private calculateLocationMatch(candidateLocation?: string, jobLocation?: string): number {
    if (!candidateLocation || !jobLocation) return 0.5;
    
    // Exact match
    if (candidateLocation.toLowerCase() === jobLocation.toLowerCase()) return 1;
    
    // City match
    const candidateCity = candidateLocation.split(',')[0].trim().toLowerCase();
    const jobCity = jobLocation.split(',')[0].trim().toLowerCase();
    if (candidateCity === jobCity) return 0.8;
    
    // State/Country match
    if (candidateLocation.toLowerCase().includes(jobLocation.toLowerCase()) ||
        jobLocation.toLowerCase().includes(candidateLocation.toLowerCase())) {
      return 0.6;
    }
    
    return 0;
  }

  private calculateSalaryMatch(expectedSalary?: number, jobSalaryMin?: number, jobSalaryMax?: number): number {
    if (!expectedSalary || (!jobSalaryMin && !jobSalaryMax)) return 0.5;
    
    const minSalary = jobSalaryMin || 0;
    const maxSalary = jobSalaryMax || jobSalaryMin || 0;
    
    // Perfect match if expected salary is within range
    if (expectedSalary >= minSalary && expectedSalary <= maxSalary) return 1;
    
    // Partial match based on how close it is
    const midSalary = (minSalary + maxSalary) / 2;
    const difference = Math.abs(expectedSalary - midSalary);
    const range = maxSalary - minSalary || maxSalary * 0.2;
    
    return Math.max(0, 1 - (difference / range));
  }

  private calculateExperienceMatch(candidateProfile: CandidateProfile, job: Job): number {
    // This would need more sophisticated logic based on CV analysis
    return 0.7; // Placeholder
  }

  private calculateWorkTypeMatch(candidateProfile: CandidateProfile, job: Job): number {
    const workPreferences = candidateProfile.workPreferences as any;
    if (!workPreferences || !workPreferences.workType) return 0.5;
    
    return workPreferences.workType === job.workType ? 1 : 0;
  }

  private async generateSearchFacets(searchParams: JobSearchParams): Promise<JobSearchFacets> {
    // This would typically use aggregation queries for better performance
    const allJobs = await storage.searchJobs({}, 1, 1000);
    
    const locations = new Map<string, number>();
    const workTypes = new Map<string, number>();
    const experienceLevels = new Map<string, number>();
    const categories = new Map<string, number>();
    const companies = new Map<string, number>();

    allJobs.jobs.forEach(job => {
      // Locations
      locations.set(job.location, (locations.get(job.location) || 0) + 1);
      
      // Work types
      workTypes.set(job.workType, (workTypes.get(job.workType) || 0) + 1);
      
      // Experience levels
      experienceLevels.set(job.experienceLevel, (experienceLevels.get(job.experienceLevel) || 0) + 1);
      
      // Categories (would need to join with categories table)
      if (job.categoryId) {
        categories.set(job.categoryId.toString(), (categories.get(job.categoryId.toString()) || 0) + 1);
      }
      
      // Companies
      companies.set(job.companyName, (companies.get(job.companyName) || 0) + 1);
    });

    return {
      locations: Array.from(locations.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      workTypes: Array.from(workTypes.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      experienceLevels: Array.from(experienceLevels.entries())
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count),
      salaryRanges: this.generateSalaryRangeFacets(allJobs.jobs),
      categories: Array.from(categories.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      companies: Array.from(companies.entries())
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  private generateSalaryRangeFacets(jobs: Job[]): Array<{ range: string; count: number }> {
    const ranges = [
      { range: '0-30k', min: 0, max: 30000 },
      { range: '30k-50k', min: 30000, max: 50000 },
      { range: '50k-75k', min: 50000, max: 75000 },
      { range: '75k-100k', min: 75000, max: 100000 },
      { range: '100k-150k', min: 100000, max: 150000 },
      { range: '150k+', min: 150000, max: Infinity },
    ];

    return ranges.map(range => ({
      range: range.range,
      count: jobs.filter(job => {
        const salary = job.salaryMax || job.salaryMin || 0;
        return salary >= range.min && salary < range.max;
      }).length
    }));
  }

  private async findSimilarJobs(job: Job, limit: number): Promise<Job[]> {
    const validExperienceLevels = ['entry', 'mid', 'senior', 'executive'] as const;
    const experienceLevel = validExperienceLevels.includes(job.experienceLevel as any) 
      ? job.experienceLevel as 'entry' | 'mid' | 'senior' | 'executive'
      : undefined;

    const validWorkTypes = ['remote', 'hybrid', 'onsite'] as const;
    const workType = validWorkTypes.includes(job.workType as any)
      ? job.workType as 'remote' | 'hybrid' | 'onsite'
      : undefined;

    const searchParams: JobSearchParams = {
      categoryId: job.categoryId || undefined,
      skills: job.requiredSkills as string[] || [],
      experienceLevel,
      workType,
    };

    const result = await storage.searchJobs(searchParams, 1, limit + 1);
    return result.jobs.filter(j => j.id !== job.id).slice(0, limit);
  }

  private async getJobsByCompany(companyName: string, excludeJobId: number, limit: number): Promise<Job[]> {
    const result = await storage.searchJobs({ query: companyName }, 1, limit + 10);
    return result.jobs
      .filter(job => job.companyName === companyName && job.id !== excludeJobId)
      .slice(0, limit);
  }

  private async getSimilarJobsCount(job: Job): Promise<number> {
    const validExperienceLevels = ['entry', 'mid', 'senior', 'executive'] as const;
    const experienceLevel = validExperienceLevels.includes(job.experienceLevel as any) 
      ? job.experienceLevel as 'entry' | 'mid' | 'senior' | 'executive'
      : undefined;

    const validWorkTypes = ['remote', 'hybrid', 'onsite'] as const;
    const workType = validWorkTypes.includes(job.workType as any)
      ? job.workType as 'remote' | 'hybrid' | 'onsite'
      : undefined;

    const searchParams: JobSearchParams = {
      categoryId: job.categoryId || undefined,
      experienceLevel,
      workType,
    };

    const result = await storage.searchJobs(searchParams, 1, 1);
    return Math.max(0, result.total - 1); // Exclude the job itself
  }

  private async getCompanyJobsCount(companyName: string, excludeJobId: number): Promise<number> {
    const result = await storage.searchJobs({ query: companyName }, 1, 100);
    return result.jobs.filter(job => job.companyName === companyName && job.id !== excludeJobId).length;
  }

  private extractSkillsFromCVs(cvs: CV[]): string[] {
    const skills = new Set<string>();
    
    cvs.forEach(cv => {
      const data = cv.data as any;
      if (data.skills) {
        data.skills.forEach((skill: string) => skills.add(skill));
      }
      
      // Extract skills from experience descriptions
      if (data.experience) {
        data.experience.forEach((exp: any) => {
          if (exp.description) {
            // Simple skill extraction - in practice, you'd use NLP
            const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS'];
            commonSkills.forEach(skill => {
              if (exp.description.toLowerCase().includes(skill.toLowerCase())) {
                skills.add(skill);
              }
            });
          }
        });
      }
    });

    return Array.from(skills);
  }

  private extractWorkTypePreference(profile: CandidateProfile): 'remote' | 'hybrid' | 'onsite' | undefined {
    const workPreferences = profile.workPreferences as any;
    return workPreferences?.workType;
  }

  private inferExperienceLevel(profile: CandidateProfile, cvs: CV[]): 'entry' | 'mid' | 'senior' | 'executive' | undefined {
    // Simple heuristic based on CV data
    let totalExperience = 0;
    
    cvs.forEach(cv => {
      const data = cv.data as any;
      if (data.experience) {
        data.experience.forEach((exp: any) => {
          if (exp.startDate && exp.endDate) {
            const start = new Date(exp.startDate);
            const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate);
            totalExperience += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          }
        });
      }
    });

    if (totalExperience < 2) return 'entry';
    if (totalExperience < 5) return 'mid';
    if (totalExperience < 10) return 'senior';
    return 'executive';
  }

  private inferPreferredCategory(profile: CandidateProfile, applications: JobApplication[]): number | undefined {
    // Analyze application history to infer preferred category
    if (applications.length === 0) return undefined;

    const categoryMap = new Map<number, number>();
    applications.forEach(app => {
      // Would need to join with jobs to get categoryId
      // For now, return undefined
    });

    return undefined;
  }

  private async scoreJobRecommendations(
    jobs: Job[],
    candidateProfile: CandidateProfile,
    cvs: CV[]
  ): Promise<Job[]> {
    return jobs.map(job => ({
      ...job,
      matchScore: Math.floor(Math.random() * 40) + 60 // Placeholder scoring
    }));
  }

  private calculateTrendingScore(job: Job): number {
    const now = new Date();
    const published = new Date(job.publishedAt || job.createdAt);
    const daysOld = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);
    
    // Trending score based on views, applications, and recency
    const viewScore = (job.viewCount || 0) * 0.3;
    const applicationScore = (job.applicationCount || 0) * 0.5;
    const recencyScore = Math.max(0, 7 - daysOld) * 0.2; // Higher score for newer jobs
    
    return viewScore + applicationScore + recencyScore;
  }
}

// Create and export the service instance
export const jobDiscoveryService = new JobDiscoveryService();