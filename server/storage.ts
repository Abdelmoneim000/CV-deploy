import { 
  users, type User, type InsertUser,
  candidateProfiles, type CandidateProfile, type InsertCandidateProfile,
  hrProfiles, type HrProfile, type InsertHrProfile,
  profileActivities, type ProfileActivity, type InsertProfileActivity,
  profileViews, type ProfileView, type InsertProfileView,
  cvs, type CV, type InsertCV, 
  templates, type Template, type InsertTemplate,
  cvVersions, type CVVersion, type InsertCVVersion,
  shares, type Share, type InsertShare,
  jobs, type Job, type InsertJob,
  jobCategories, type JobCategory, type InsertJobCategory,
  jobApplications, type JobApplication, type InsertJobApplication,
  jobAlerts, type JobAlert, type InsertJobAlert,
  savedJobs, type SavedJob, type InsertSavedJob,
  jobViews, type JobView,
  type Change,
  type UpdateJobRequest,
  type UpdateJobApplicationRequest
} from "@shared/schema";
import { db } from './db';
import { eq, desc, and, asc, ilike, or, sql, count, isNull } from 'drizzle-orm';
import { jobCategoryService } from './services/jobCategoryService';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Candidate profile operations
  getCandidateProfileById(id: number): Promise<CandidateProfile | undefined>;
  getCandidateProfileByUserId(userId: number): Promise<CandidateProfile | undefined>;
  createCandidateProfile(profile: Partial<InsertCandidateProfile>): Promise<CandidateProfile>;
  updateCandidateProfile(id: number, data: Partial<Omit<CandidateProfile, 'id'>>): Promise<CandidateProfile>;
  deleteCandidateProfile(id: number): Promise<boolean>;
  
  // HR profile operations
  getHrProfileById(id: number): Promise<HrProfile | undefined>;
  getHrProfileByUserId(userId: number): Promise<HrProfile | undefined>;
  createHrProfile(profile: Partial<InsertHrProfile>): Promise<HrProfile>;
  updateHrProfile(id: number, data: Partial<Omit<HrProfile, 'id'>>): Promise<HrProfile>;
  deleteHrProfile(id: number): Promise<boolean>;
  
  // Profile activity operations
  createProfileActivity(activity: InsertProfileActivity): Promise<ProfileActivity>;
  getProfileActivities(userId: number, limit?: number, offset?: number): Promise<ProfileActivity[]>;
  
  // Profile view operations
  createProfileView(view: InsertProfileView): Promise<ProfileView>;
  getProfileViews(profileId: number, profileType: string, limit?: number): Promise<ProfileView[]>;
  
  // Search operations
  searchCandidates(
    searchParams: any,
    page: number,
    limit: number
  ): Promise<{
    candidates: (CandidateProfile & { user: Omit<User, 'password'> })[];
    total: number;
    pages: number;
  }>;
  
  // CV, Template, and Version operations
  getCVById(id: number): Promise<CV | undefined>;
  getCVsByUserId(userId: number): Promise<CV[]>;
  createCV(insertCV: InsertCV): Promise<CV>;
  updateCV(id: number, data: Partial<InsertCV>): Promise<CV | undefined>;
  deleteCV(id: number): Promise<boolean>;
  createShare(data: InsertShare): Promise<Share>;
  getShareByToken(token: string): Promise<Share | undefined>;
  getSharesByCVId(cvId: number): Promise<Share[]>;
  deleteShare(shareId: number): Promise<boolean>;
  getTemplates(): Promise<Template[]>;
  getTemplateById(id: number): Promise<Template | undefined>;
  createTemplate(insertTemplate: InsertTemplate): Promise<Template>;
  getCVVersions(cvId: number): Promise<CVVersion[]>;
  getCVVersionById(id: number): Promise<CVVersion | undefined>;
  createCVVersion(insertVersion: InsertCVVersion): Promise<CVVersion>;
  restoreCVVersion(cvId: number, versionId: number): Promise<CV | undefined>;

  // Job operations
  getJobById(id: number): Promise<Job | undefined>;
  getJobBySlug(slug: string): Promise<Job | undefined>;
  getJobsByHrUserId(hrUserId: number): Promise<Job[]>;
  getPublishedJobs(page?: number, limit?: number): Promise<{ jobs: Job[]; total: number; pages: number }>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, data: UpdateJobRequest): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  publishJob(id: number): Promise<Job | undefined>;
  pauseJob(id: number): Promise<Job | undefined>;
  closeJob(id: number): Promise<Job | undefined>;
  incrementJobViews(id: number): Promise<void>;
  searchJobs(searchParams: any, page?: number, limit?: number): Promise<{ jobs: Job[]; total: number; pages: number }>;

  // Job categories operations
  getJobCategories(): Promise<JobCategory[]>;
  getJobCategoryById(id: number): Promise<JobCategory | undefined>;
  createJobCategory(category: InsertJobCategory): Promise<JobCategory>;
  updateJobCategory(id: number, data: Partial<JobCategory>): Promise<JobCategory | undefined>;
  deleteJobCategory(id: number): Promise<boolean>;
  
  // Job applications operations
  getJobApplicationById(id: number): Promise<JobApplication | undefined>;
  getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]>;
  getJobApplicationsByCandidateId(candidateId: number): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, data: UpdateJobApplicationRequest): Promise<JobApplication | undefined>;
  withdrawJobApplication(id: number): Promise<JobApplication | undefined>;
  deleteJobApplication(id: number): Promise<boolean>;
  checkExistingApplication(jobId: number, candidateUserId: number): Promise<JobApplication | undefined>;
  
  // Job alerts operations
  getJobAlertsByUserId(userId: number): Promise<JobAlert[]>;
  createJobAlert(alert: InsertJobAlert): Promise<JobAlert>;
  updateJobAlert(id: number, data: Partial<JobAlert>): Promise<JobAlert | undefined>;
  deleteJobAlert(id: number): Promise<boolean>;
  getActiveJobAlerts(): Promise<JobAlert[]>;
  
  // Saved jobs operations
  getSavedJobsByUserId(userId: number): Promise<SavedJob[]>;
  createSavedJob(savedJob: InsertSavedJob): Promise<SavedJob>;
  deleteSavedJob(id: number): Promise<boolean>;
  checkExistingSavedJob(candidateUserId: number, jobId: number): Promise<SavedJob | undefined>;
  
  // Job views operations
  createJobView(jobId: number, userId?: number, ipAddress?: string, userAgent?: string): Promise<JobView>;
  getJobViewsByJobId(jobId: number): Promise<JobView[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return result.length > 0;
  }

  // Candidate profile methods
  async getCandidateProfileById(id: number): Promise<CandidateProfile | undefined> {
    const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, id));
    return profile || undefined;
  }

  async getCandidateProfileByUserId(userId: number): Promise<CandidateProfile | undefined> {
    const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId));
    return profile || undefined;
  }

  async createCandidateProfile(insertProfile: Partial<InsertCandidateProfile>): Promise<CandidateProfile> {
    if (!insertProfile.userId) {
      throw new Error('User ID is required');
    }

    const [profile] = await db
      .insert(candidateProfiles)
      .values({
        ...insertProfile,
        userId: insertProfile.userId,
      } as InsertCandidateProfile)
      .returning();
    return profile;
  }

  async updateCandidateProfile(id: number, data: Partial<Omit<CandidateProfile, 'id'>>): Promise<CandidateProfile> {
    const [profile] = await db
      .update(candidateProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidateProfiles.id, id))
      .returning();
    
    if (!profile) {
      throw new Error('Candidate profile not found');
    }
    return profile;
  }

  async deleteCandidateProfile(id: number): Promise<boolean> {
    const result = await db
      .delete(candidateProfiles)
      .where(eq(candidateProfiles.id, id))
      .returning({ id: candidateProfiles.id });
    return result.length > 0;
  }

  // HR profile methods
  async getHrProfileById(id: number): Promise<HrProfile | undefined> {
    const [profile] = await db.select().from(hrProfiles).where(eq(hrProfiles.id, id));
    return profile || undefined;
  }

  async getHrProfileByUserId(userId: number): Promise<HrProfile | undefined> {
    const [profile] = await db.select().from(hrProfiles).where(eq(hrProfiles.userId, userId));
    return profile || undefined;
  }

  async createHrProfile(insertProfile: Partial<InsertHrProfile>): Promise<HrProfile> {
    if (!insertProfile.userId) {
      throw new Error('User ID is required');
    }

    const [profile] = await db
      .insert(hrProfiles)
      .values({
        ...insertProfile,
        userId: insertProfile.userId,
        companyName: insertProfile.companyName,
      } as InsertHrProfile)
      .returning();
    return profile;
  }

  async updateHrProfile(id: number, data: Partial<Omit<HrProfile, 'id'>>): Promise<HrProfile> {
    const [profile] = await db
      .update(hrProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hrProfiles.id, id))
      .returning();
    
    if (!profile) {
      throw new Error('HR profile not found');
    }
    return profile;
  }

  async deleteHrProfile(id: number): Promise<boolean> {
    const result = await db
      .delete(hrProfiles)
      .where(eq(hrProfiles.id, id))
      .returning({ id: hrProfiles.id });
    return result.length > 0;
  }

  // Profile activity methods
  async createProfileActivity(activity: InsertProfileActivity): Promise<ProfileActivity> {
    const [profileActivity] = await db
      .insert(profileActivities)
      .values(activity)
      .returning();
    return profileActivity;
  }

  async getProfileActivities(userId: number, limit: number = 50, offset: number = 0): Promise<ProfileActivity[]> {
    return await db
      .select()
      .from(profileActivities)
      .where(eq(profileActivities.userId, userId))
      .orderBy(desc(profileActivities.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Profile view methods
  async createProfileView(view: InsertProfileView): Promise<ProfileView> {
    const [profileView] = await db
      .insert(profileViews)
      .values(view)
      .returning();
    return profileView;
  }

  async getProfileViews(profileId: number, profileType: string, limit: number = 50): Promise<ProfileView[]> {
    return await db
      .select()
      .from(profileViews)
      .where(
        and(
          eq(profileViews.viewedProfileId, profileId),
          eq(profileViews.viewedProfileType, profileType)
        )
      )
      .orderBy(desc(profileViews.createdAt))
      .limit(limit);
  }

  // Search candidates
  async searchCandidates(
    searchParams: {
      query?: string;
      location?: string;
      skills?: string[];
      experience?: string;
      salaryRange?: { min?: number; max?: number };
      availability?: string;
      workPreferences?: string[];
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    candidates: (CandidateProfile & { user: Omit<User, 'password'> })[];
    total: number;
    pages: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const conditions: any[] = [
      eq(candidateProfiles.profileVisibility, 'public'),
      eq(users.isActive, true),
      eq(users.role, 'candidate'),
    ];

    // Add search conditions
    if (searchParams.query) {
      conditions.push(
        or(
          ilike(candidateProfiles.firstName, `%${searchParams.query}%`),
          ilike(candidateProfiles.lastName, `%${searchParams.query}%`),
          ilike(candidateProfiles.title, `%${searchParams.query}%`),
          ilike(candidateProfiles.bio, `%${searchParams.query}%`)
        )
      );
    }

    if (searchParams.location) {
      conditions.push(ilike(candidateProfiles.location, `%${searchParams.location}%`));
    }

    if (searchParams.salaryRange) {
      if (searchParams.salaryRange.min) {
        conditions.push(sql`${candidateProfiles.expectedSalary} >= ${searchParams.salaryRange.min}`);
      }
      if (searchParams.salaryRange.max) {
        conditions.push(sql`${candidateProfiles.expectedSalary} <= ${searchParams.salaryRange.max}`);
      }
    }

    // Execute search query
    const candidates = await db
      .select({
        profile: candidateProfiles,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          isVerified: users.isVerified,
          isActive: users.isActive,
          lastLogin: users.lastLogin,
          resetPasswordToken: users.resetPasswordToken,
          resetPasswordExpires: users.resetPasswordExpires,
          verificationToken: users.verificationToken,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(candidateProfiles)
      .innerJoin(users, eq(candidateProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(candidateProfiles.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(candidateProfiles)
      .innerJoin(users, eq(candidateProfiles.userId, users.id))
      .where(and(...conditions));

    const pages = Math.ceil(total / limit);

    return {
      candidates: candidates.map(c => ({ ...c.profile, user: c.user })),
      total,
      pages,
    };
  }

  // CV methods
  async getCVById(id: number): Promise<CV | undefined> {
    const [cv] = await db.select().from(cvs).where(eq(cvs.id, id));
    return cv || undefined;
  }

  async getCVsByUserId(userId: number): Promise<CV[]> {
    return await db.select().from(cvs).where(eq(cvs.userId, userId));
  }

  async createCV(insertCV: InsertCV): Promise<CV> {
    const [cv] = await db
      .insert(cvs)
      .values(insertCV)
      .returning();
    return cv;
  }

  async updateCV(id: number, data: Partial<InsertCV>): Promise<CV | undefined> {
    const [cv] = await db
      .update(cvs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cvs.id, id))
      .returning();
    return cv || undefined;
  }

  async deleteCV(id: number): Promise<boolean> {
    const result = await db
      .delete(cvs)
      .where(eq(cvs.id, id))
      .returning({ id: cvs.id });
    return result.length > 0;
  }

  async createShare(data: InsertShare): Promise<Share> {
    const [share] = await db.insert(shares).values({
      cvId: data.cvId,
      shareToken: data.shareToken,
    }).returning();
    return share;
  }

  async getShareByToken(token: string): Promise<Share | undefined> {
    const [share] = await db.select()
      .from(shares)
      .where(eq(shares.shareToken, token));
    return share || undefined;
  }

  async getSharesByCVId(cvId: number): Promise<Share[]> {
    return await db.select()
      .from(shares)
      .where(eq(shares.cvId, cvId));
  }

  async deleteShare(shareId: number): Promise<boolean> {
    const result = await db.delete(shares)
      .where(eq(shares.id, shareId))
      .returning({ id: shares.id });
    return result.length > 0;
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplateById(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  // CV Version methods
  async getCVVersions(cvId: number): Promise<CVVersion[]> {
    try {
      const versions = await db
        .select()
        .from(cvVersions)
        .where(eq(cvVersions.cvId, cvId))
        .orderBy(desc(cvVersions.createdAt));
      return versions;
    } catch (error) {
      console.error('Error retrieving CV versions:', error);
      throw error;
    }
  }
  async getCVVersionById(id: number): Promise<CVVersion | undefined> {
    try {
      const [version] = await db
        .select()
        .from(cvVersions)
        .where(eq(cvVersions.id, id));
      return version || undefined;
    } catch (error) {
      console.error('Error retrieving CV version:', error);
      throw error;
    }
  }
  async createCVVersion(insertVersion: InsertCVVersion): Promise<CVVersion> {
    try {
      const [newVersion] = await db
        .insert(cvVersions)
        .values(insertVersion)
        .returning();
      return newVersion;
    } catch (error) {
      console.error('Error creating CV version:', error);
      throw error;
    }
  }
  async restoreCVVersion(cvId: number, versionId: number): Promise<CV | undefined> {
    try {
      // Get the version data
      const [version] = await db
        .select()
        .from(cvVersions)
        .where(eq(cvVersions.id, versionId));

      if (!version || version.cvId !== cvId) {
        return undefined;
      }

      // Update the CV with the version data
      const [updatedCV] = await db
        .update(cvs)
        .set({ data: version.data, updatedAt: new Date() })
        .where(eq(cvs.id, cvId))
        .returning();

      // Return the updated CV
      return updatedCV || undefined;
    } catch (error) {
      console.error('Error restoring CV version:', error);
      throw error;
    }
  }
  
  // Initialize default templates if none exist
  async initializeDefaultTemplates(): Promise<void> {
    const existingTemplates = await this.getTemplates();
    if (existingTemplates.length === 0) {
      const defaultTemplates: InsertTemplate[] = [
        {
          name: "Professional",
          description: "A clean, professional template with two columns",
          structure: {
            layout: "two-column",
            sections: ["header", "summary", "experience", "education", "languages", "skills"]
          }
        },
        {
          name: "Modern",
          description: "A modern, single-column layout",
          structure: {
            layout: "single-column",
            sections: ["header", "summary", "skills", "experience", "education", "languages"]
          }
        },
        {
          name: "Creative",
          description: "A creative layout for designers and artists",
          structure: {
            layout: "creative",
            sections: ["header", "skills", "experience", "education", "languages", "summary"]
          }
        },
        {
          name: "Minimal",
          description: "A minimalist design focusing on content",
          structure: {
            layout: "minimal",
            sections: ["header", "experience", "education", "skills", "languages"]
          }
        }
      ];
      
      for (const template of defaultTemplates) {
        await this.createTemplate(template);
      }
    }
  }

  // Job operations
  async getJobById(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobBySlug(slug: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.slug, slug));
    return job || undefined;
  }

  async getJobsByHrUserId(hrUserId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.hrUserId, hrUserId))
      .orderBy(desc(jobs.createdAt));
  }

  async getPublishedJobs(page: number = 1, limit: number = 20): Promise<{ jobs: Job[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;
    
    const jobsList = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'published'))
      .orderBy(desc(jobs.publishedAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.status, 'published'));

    const pages = Math.ceil(total / limit);

    return { jobs: jobsList, total, pages };
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    // Generate slug from title
    const slug = insertJob.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const [job] = await db
      .insert(jobs)
      .values({
        ...insertJob,
        slug: `${slug}-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return job;
  }

  async updateJob(id: number, data: UpdateJobRequest): Promise<Job | undefined> {
    // Update slug if title is changed
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.title) {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      updateData.slug = `${slug}-${Date.now()}`;
    }

    const [job] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db
      .delete(jobs)
      .where(eq(jobs.id, id))
      .returning({ id: jobs.id });
    return result.length > 0;
  }

  async publishJob(id: number): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set({ 
        status: 'published', 
        publishedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async pauseJob(id: number): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set({ 
        status: 'paused',
        updatedAt: new Date() 
      })
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async closeJob(id: number): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set({ 
        status: 'closed',
        updatedAt: new Date() 
      })
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  async incrementJobViews(id: number): Promise<void> {
    await db
      .update(jobs)
      .set({ 
        viewCount: sql`${jobs.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, id));
  }

  async searchJobs(
    searchParams: {
      query?: string;
      location?: string;
      workType?: string;
      employmentType?: string;
      experienceLevel?: string;
      salaryMin?: number;
      salaryMax?: number;
      categoryId?: number;
      skills?: string[];
      status?: string; // e.g., 'published', 'paused', 'closed'
      sortBy?: 'date' | 'relevance'; // e.g., 'publishedAt', 'salaryMin'
      sortOrder?: 'asc' | 'desc';
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ jobs: Job[]; total: number; pages: number }> {
    const offset = (page - 1) * limit;
    
    const conditions: any[] = [
      eq(jobs.status, 'published'),
      or(
        isNull(jobs.expiresAt),
        sql`${jobs.expiresAt} > NOW()`
      )
    ];

    if (searchParams.query) {
      conditions.push(
        or(
          ilike(jobs.title, `%${searchParams.query}%`),
          ilike(jobs.description, `%${searchParams.query}%`),
          ilike(jobs.companyName, `%${searchParams.query}%`)
        )
      );
    }

    if (searchParams.location) {
      conditions.push(ilike(jobs.location, `%${searchParams.location}%`));
    }

    if (searchParams.workType) {
      conditions.push(eq(jobs.workType, searchParams.workType));
    }

    if (searchParams.employmentType) {
      conditions.push(eq(jobs.employmentType, searchParams.employmentType));
    }

    if (searchParams.experienceLevel) {
      conditions.push(eq(jobs.experienceLevel, searchParams.experienceLevel));
    }

    if (searchParams.categoryId) {
      conditions.push(eq(jobs.categoryId, searchParams.categoryId));
    }

    if (searchParams.salaryMin) {
      conditions.push(sql`${jobs.salaryMin} >= ${searchParams.salaryMin}`);
    }

    if (searchParams.salaryMax) {
      conditions.push(sql`${jobs.salaryMax} <= ${searchParams.salaryMax}`);
    }

    const jobsList = await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.publishedAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(jobs)
      .where(and(...conditions));

    const pages = Math.ceil(total / limit);

    return { jobs: jobsList, total, pages };
  }

  // Job categories operations
  async getJobCategories(): Promise<JobCategory[]> {
    return await db
      .select()
      .from(jobCategories)
      .where(eq(jobCategories.isActive, true))
      .orderBy(asc(jobCategories.name));
  }

  async getJobCategoryById(id: number): Promise<JobCategory | undefined> {
    const [category] = await db
      .select()
      .from(jobCategories)
      .where(eq(jobCategories.id, id));
    return category || undefined;
  }

  async createJobCategory(insertCategory: InsertJobCategory): Promise<JobCategory> {
    const result = await db
      .insert(jobCategories)
      .values(insertCategory)
      .returning();
    const [category] = result as JobCategory[];
    return category;
  }

  async updateJobCategory(id: number, data: Partial<JobCategory>): Promise<JobCategory | undefined> {
    const [category] = await db
      .update(jobCategories)
      .set(data)
      .where(eq(jobCategories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteJobCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(jobCategories)
      .where(eq(jobCategories.id, id))
      .returning({ id: jobCategories.id });
    return result.length > 0;
  }

  // Job applications operations
  async getJobApplicationById(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    return application || undefined;
  }

  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async getJobApplicationsByCandidateId(candidateId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.candidateUserId, candidateId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async createJobApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const [application] = await db
      .insert(jobApplications)
      .values(insertApplication)
      .returning();

    // Increment application count for the job
    await db
      .update(jobs)
      .set({ 
        applicationCount: sql`${jobs.applicationCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, insertApplication.jobId));

    return application;
  }

  async updateJobApplication(id: number, data: UpdateJobApplicationRequest): Promise<JobApplication | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    // Convert responseDeadline string to Date if it exists
    if (updateData.responseDeadline && typeof updateData.responseDeadline === 'string') {
      updateData.responseDeadline = new Date(updateData.responseDeadline);
    }
    
    const [application] = await db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, id))
      .returning();
    return application || undefined;
  }

  async withdrawJobApplication(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .update(jobApplications)
      .set({ 
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return application || undefined;
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    const result = await db
      .delete(jobApplications)
      .where(eq(jobApplications.id, id))
      .returning({ id: jobApplications.id });
    return result.length > 0;
  }

  async checkExistingApplication(jobId: number, candidateUserId: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(
        and(
          eq(jobApplications.jobId, jobId),
          eq(jobApplications.candidateUserId, candidateUserId)
        )
      );
    return application || undefined;
  }

  // Job alerts operations
  async getJobAlertsByUserId(userId: number): Promise<JobAlert[]> {
    return await db
      .select()
      .from(jobAlerts)
      .where(eq(jobAlerts.candidateUserId, userId))
      .orderBy(desc(jobAlerts.createdAt));
  }

  async createJobAlert(insertAlert: InsertJobAlert): Promise<JobAlert> {
    const [alert] = await db
      .insert(jobAlerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async deleteJobAlert(id: number): Promise<boolean> {
    const result = await db
      .delete(jobAlerts)
      .where(eq(jobAlerts.id, id))
      .returning({ id: jobAlerts.id });
    return result.length > 0;
  }

  async getActiveJobAlerts(): Promise<JobAlert[]> {
    return await db
      .select()
      .from(jobAlerts)
      .where(eq(jobAlerts.isActive, true));
  }

  // Saved jobs operations
  async getSavedJobsByUserId(userId: number): Promise<SavedJob[]> {
    return await db
      .select()
      .from(savedJobs)
      .where(eq(savedJobs.candidateUserId, userId))
      .orderBy(desc(savedJobs.createdAt));
  }

  async createSavedJob(insertSavedJob: InsertSavedJob): Promise<SavedJob> {
    const [savedJob] = await db
      .insert(savedJobs)
      .values(insertSavedJob)
      .returning();
    return savedJob;
  }

  async deleteSavedJob(id: number): Promise<boolean> {
    const result = await db
      .delete(savedJobs)
      .where(eq(savedJobs.id, id))
      .returning({ id: savedJobs.id });
    return result.length > 0;
  }

  async checkExistingSavedJob(candidateUserId: number, jobId: number): Promise<SavedJob | undefined> {
    const [savedJob] = await db
      .select()
      .from(savedJobs)
      .where(
        and(
          eq(savedJobs.candidateUserId, candidateUserId),
          eq(savedJobs.jobId, jobId)
        )
      );
    return savedJob || undefined;
  }

  // Job views operations
  async createJobView(jobId: number, userId?: number, ipAddress?: string, userAgent?: string): Promise<JobView> {
    const [jobView] = await db
      .insert(jobViews)
      .values({
        jobId,
        userId,
        ipAddress,
        userAgent,
      })
      .returning();

    // Increment view count for the job
    await this.incrementJobViews(jobId);

    return jobView;
  }

  async getJobViewsByJobId(jobId: number): Promise<JobView[]> {
    return await db
      .select()
      .from(jobViews)
      .where(eq(jobViews.jobId, jobId))
      .orderBy(desc(jobViews.createdAt));
  }

  async updateSavedJob(id: number, data: Partial<SavedJob>): Promise<SavedJob | undefined> {
    const [savedJob] = await db
      .update(savedJobs)
      .set(data)
      .where(eq(savedJobs.id, id))
      .returning();
    return savedJob || undefined;
  }

  async updateJobAlert(id: number, data: Partial<JobAlert>): Promise<JobAlert | undefined> {
    const [alert] = await db
      .update(jobAlerts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobAlerts.id, id))
      .returning();
    return alert || undefined;
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();

// Initialize default templates and categories when the server starts
(async () => {
  try {
    await storage.initializeDefaultTemplates();
    console.log('Default templates initialized');
    
    await jobCategoryService.initializeDefaultCategories();
    console.log('Default job categories initialized');
  } catch (error) {
    console.error('Error initializing defaults:', error);
  }
})();
