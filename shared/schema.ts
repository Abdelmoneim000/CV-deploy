import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  varchar,
  unique,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User model - Basic authentication and role info
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('candidate'), // 'candidate', 'hr', 'admin'
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
  verificationToken: text('verification_token'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Candidate profiles
export const candidateProfiles = pgTable('candidate_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  bio: text('bio'),
  title: text('title'), // Professional title
  location: text('location'),
  website: text('website'),
  phone: text('phone'),
  dateOfBirth: timestamp('date_of_birth'),
  avatar: text('avatar'), // URL to avatar image
  avatarFileName: text('avatar_file_name'),

  // Professional info
  currentSalary: integer('current_salary'),
  expectedSalary: integer('expected_salary'),
  salaryNegotiable: boolean('salary_negotiable').default(true),
  availabilityDate: timestamp('availability_date'),
  workPreferences: jsonb('work_preferences').default('{}'), // remote, hybrid, onsite

  // Social links
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  twitterUrl: text('twitter_url'),
  portfolioUrl: text('portfolio_url'),

  // Skills and interests
  skills: jsonb('skills').default('[]'), // Array of skills
  interests: jsonb('interests').default('[]'), // Array of interests
  languages: jsonb('languages').default('[]'), // Array of languages with proficiency
  yearsOfExperience: integer('years_of_experience').default(0), // Total years of experience

  // Career preferences
  preferredRoles: jsonb('preferred_roles').default('[]'), // Array of role types
  preferredIndustries: jsonb('preferred_industries').default('[]'), // Array of industries
  preferredCompanySize: text('preferred_company_size'), // startup, small, medium, large, enterprise

  // Privacy settings
  profileVisibility: text('profile_visibility').default('private'), // 'public', 'private', 'hr_only'
  showEmail: boolean('show_email').default(false),
  showPhone: boolean('show_phone').default(false),
  showSalary: boolean('show_salary').default(false),
  allowHrContact: boolean('allow_hr_contact').default(true),

  // Notifications preferences
  emailNotifications: boolean('email_notifications').default(true),
  jobAlerts: boolean('job_alerts').default(true),
  profileViews: integer('profile_views').default(0),

  // Premium features
  isPremium: boolean('is_premium').default(false),
  premiumExpiresAt: timestamp('premium_expires_at'),

  // Tracking
  profileViewsCount: integer('profile_views_count').default(0),
  lastActiveAt: timestamp('last_active_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// HR profiles
export const hrProfiles = pgTable('hr_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  jobTitle: text('job_title'), // HR Manager, Recruiter, etc.
  department: text('department'),
  phone: text('phone'),
  avatar: text('avatar'),
  avatarFileName: text('avatar_file_name'),

  // Company information
  companyId: integer('company_id'), // Reference to companies table (to be created)
  companyName: text('company_name'),
  companyWebsite: text('company_website'),
  companySize: text('company_size'), // startup, small, medium, large, enterprise
  companyIndustry: text('company_industry'),
  companyLocation: text('company_location'),
  companyDescription: text('company_description'),
  companyLogo: text('company_logo'),

  // HR specific info
  yearsOfExperience: integer('years_of_experience'),
  specializations: jsonb('specializations').default('[]'), // Areas of recruitment expertise
  hiringSectors: jsonb('hiring_sectors').default('[]'), // Tech, Marketing, Sales, etc.

  // Contact preferences
  preferredContactMethod: text('preferred_contact_method').default('email'), // email, phone, linkedin
  workingHours: jsonb('working_hours').default('{}'), // {start: "09:00", end: "17:00", timezone: "UTC"}

  // Social links
  linkedinUrl: text('linkedin_url'),
  companyLinkedinUrl: text('company_linkedin_url'),

  // Features and permissions
  canPostJobs: boolean('can_post_jobs').default(true),
  canViewCandidates: boolean('can_view_candidates').default(true),
  canContactCandidates: boolean('can_contact_candidates').default(true),
  monthlyJobPostLimit: integer('monthly_job_post_limit').default(5),

  // Premium features
  isPremium: boolean('is_premium').default(false),
  premiumExpiresAt: timestamp('premium_expires_at'),
  subscriptionPlan: text('subscription_plan'), // basic, premium, enterprise

  // Tracking
  totalJobsPosted: integer('total_jobs_posted').default(0),
  totalCandidatesContacted: integer('total_candidates_contacted').default(0),
  lastActiveAt: timestamp('last_active_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Profile views tracking
export const profileViews = pgTable('profile_views', {
  id: serial('id').primaryKey(),
  viewedProfileId: integer('viewed_profile_id').notNull(), // candidate or hr profile id
  viewedProfileType: text('viewed_profile_type').notNull(), // 'candidate' or 'hr'
  viewerUserId: integer('viewer_user_id').references(() => users.id),
  viewerType: text('viewer_type').notNull(), // 'candidate', 'hr', 'anonymous'
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Profile activity log
export const profileActivities = pgTable('profile_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  profileType: text('profile_type').notNull(), // 'candidate' or 'hr'
  action: text('action').notNull(), // 'profile_update', 'avatar_change', 'privacy_update', etc.
  description: text('description'),
  metadata: jsonb('metadata').default('{}'), // Additional data about the action
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// CV model
export const cvs = pgTable('cvs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  title: text('title').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Template model
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  structure: jsonb('structure').notNull(),
});

// CV Version history model
export const cvVersions = pgTable('cv_versions', {
  id: serial('id').primaryKey(),
  cvId: integer('cv_id')
    .references(() => cvs.id)
    .notNull(),
  data: jsonb('data').notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id),
  changes: jsonb('changes').default('{}'),
});

//Shares model
export const shares = pgTable('shares', {
  id: serial('id').primaryKey(),
  cvId: integer('cv_id')
    .references(() => cvVersions.id)
    .notNull(),
  shareToken: text('share_token').notNull(),
});

// Job Categories
export const jobCategories: any = pgTable('job_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id').references(() => jobCategories.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Jobs table
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  hrUserId: integer('hr_user_id')
    .references(() => users.id)
    .notNull(),

  // Basic job info
  title: text('title').notNull(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),

  // Company info (can be different from HR profile company)
  companyName: text('company_name').notNull(),
  companyLogo: text('company_logo'),
  companyWebsite: text('company_website'),

  // Location and work arrangement
  location: text('location').notNull(),
  workType: text('work_type').notNull(), // remote, hybrid, onsite
  country: text('country'),
  city: text('city'),

  // Job details
  categoryId: integer('category_id').references(() => jobCategories.id),
  employmentType: text('employment_type').notNull(), // full-time, part-time, contract, internship
  experienceLevel: text('experience_level').notNull(), // entry, mid, senior, executive

  // Compensation
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: text('salary_currency').default('USD'),
  salaryPeriod: text('salary_period').default('yearly'), // yearly, monthly, hourly
  salaryNegotiable: boolean('salary_negotiable').default(true),
  showSalary: boolean('show_salary').default(true),

  // Requirements
  requiredSkills: jsonb('required_skills').default('[]'), // Array of required skills
  preferredSkills: jsonb('preferred_skills').default('[]'), // Array of preferred skills
  requiredEducation: text('required_education'),
  requiredExperience: integer('required_experience'), // Years of experience
  languages: jsonb('languages').default('[]'), // Array of language requirements

  // Benefits and perks
  benefits: jsonb('benefits').default('[]'), // Array of benefits
  perks: jsonb('perks').default('[]'), // Array of perks

  // Application process
  applicationDeadline: timestamp('application_deadline'),
  startDate: timestamp('start_date'),
  applicationInstructions: text('application_instructions'),
  applicationUrl: text('application_url'), // External application URL if applicable

  // Status and visibility
  status: text('status').notNull().default('draft'), // draft, published, paused, closed, expired
  isUrgent: boolean('is_urgent').default(false),
  isFeatured: boolean('is_featured').default(false),
  isRemote: boolean('is_remote').default(false),

  // SEO and metadata
  slug: text('slug').unique(),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  tags: jsonb('tags').default('[]'), // Array of tags for search

  // Analytics
  viewCount: integer('view_count').default(0),
  applicationCount: integer('application_count').default(0),
  shareCount: integer('share_count').default(0),

  // Timestamps
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Job Applications
export const jobApplications = pgTable(
  'job_applications',
  {
    id: serial('id').primaryKey(),
    jobId: integer('job_id')
      .references(() => jobs.id)
      .notNull(),
    candidateUserId: integer('candidate_user_id')
      .references(() => users.id)
      .notNull(),
    cvId: integer('cv_id').references(() => cvs.id),

    // Application content
    coverLetter: text('cover_letter'),
    additionalNotes: text('additional_notes'),
    portfolioUrl: text('portfolio_url'),

    // Status tracking
    status: text('status').notNull().default('pending'), // pending, reviewing, shortlisted, interviewed, offered, hired, rejected, withdrawn
    hrNotes: text('hr_notes'), // Private notes from HR
    hrRating: integer('hr_rating'), // 1-5 rating from HR

    // AI screening
    aiScore: integer('ai_score'), // AI matching score 0-100
    aiAnalysis: jsonb('ai_analysis').default('{}'), // AI analysis results

    // Communication
    lastContactedAt: timestamp('last_contacted_at'),
    responseDeadline: timestamp('response_deadline'),

    // Interview scheduling
    interviewScheduledAt: timestamp('interview_scheduled_at'),
    interviewType: text('interview_type'), // phone, video, in-person
    interviewNotes: text('interview_notes'),

    // Timestamps
    appliedAt: timestamp('applied_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    withdrawnAt: timestamp('withdrawn_at'),
  },
  (table) => ({
    uniqueApplication: unique().on(table.jobId, table.candidateUserId),
  })
);

// Job Alerts
export const jobAlerts = pgTable(
  'job_alerts',
  {
    id: serial('id').primaryKey(),
    candidateUserId: integer('candidate_user_id')
      .references(() => users.id)
      .notNull(),

    // Alert criteria
    keywords: text('keywords'),
    location: text('location'),
    workType: text('work_type'), // remote, hybrid, onsite
    employmentType: text('employment_type'),
    experienceLevel: text('experience_level'),
    salaryMin: integer('salary_min'),
    categoryId: integer('category_id').references(() => jobCategories.id),
    skills: jsonb('skills').default('[]'),

    // Alert settings
    isActive: boolean('is_active').default(true),
    frequency: text('frequency').default('daily'), // immediate, daily, weekly
    lastSentAt: timestamp('last_sent_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueAlert: unique().on(
      table.candidateUserId,
      table.keywords,
      table.location
    ),
  })
);

// Saved Jobs
export const savedJobs = pgTable(
  'saved_jobs',
  {
    id: serial('id').primaryKey(),
    candidateUserId: integer('candidate_user_id')
      .references(() => users.id)
      .notNull(),
    jobId: integer('job_id')
      .references(() => jobs.id)
      .notNull(),

    notes: text('notes'), // Personal notes about the job

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueSavedJob: unique().on(table.candidateUserId, table.jobId),
  })
);

// Job Views tracking
export const jobViews = pgTable('job_views', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id')
    .references(() => jobs.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id), // null for anonymous views
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  verificationToken: true,
});

export const insertCVSchema = createInsertSchema(cvs).pick({
  userId: true,
  title: true,
  data: true,
});

export const insertShareSchema = createInsertSchema(shares).pick({
  cvId: true,
  shareToken: true,
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  name: true,
  description: true,
  structure: true,
});

export const insertCVVersionSchema = createInsertSchema(cvVersions).pick({
  cvId: true,
  data: true,
  description: true,
  createdBy: true,
  changes: true,
});

export const insertJobCategorySchema = createInsertSchema(jobCategories).pick({
  name: true,
  description: true,
  parentId: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  hrUserId: true,
  title: true,
  description: true,
  shortDescription: true,
  companyName: true,
  companyLogo: true,
  companyWebsite: true,
  location: true,
  workType: true,
  country: true,
  city: true,
  categoryId: true,
  employmentType: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  salaryNegotiable: true,
  showSalary: true,
  requiredSkills: true,
  preferredSkills: true,
  requiredEducation: true,
  requiredExperience: true,
  languages: true,
  benefits: true,
  perks: true,
  applicationDeadline: true,
  startDate: true,
  applicationInstructions: true,
  applicationUrl: true,
  isUrgent: true,
  isFeatured: true,
  isRemote: true,
  tags: true,
  status: true,
}).extend({
  // Override date fields to accept strings and transform them
  applicationDeadline: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
  startDate: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
});

export const insertJobApplicationSchema = createInsertSchema(
  jobApplications
).pick({
  jobId: true,
  candidateUserId: true,
  cvId: true,
  coverLetter: true,
  additionalNotes: true,
  portfolioUrl: true,
});

export const insertJobAlertSchema = createInsertSchema(jobAlerts).pick({
  candidateUserId: true,
  keywords: true,
  location: true,
  workType: true,
  employmentType: true,
  experienceLevel: true,
  salaryMin: true,
  categoryId: true,
  skills: true,
  frequency: true,
});

export const insertSavedJobSchema = createInsertSchema(savedJobs).pick({
  candidateUserId: true,
  jobId: true,
  notes: true,
});

// Define the schema for change tracking
export const changeSchema = z.object({
  type: z.enum(['add', 'update', 'delete']),
  path: z.string(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  timestamp: z.number(),
});

export const cvDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    jobTitle: z.string(),
    contact: z.object({
      phone: z.string().optional(),
      email: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
    }),
  }),
  summary: z.string(),
  experience: z.array(
    z.object({
      position: z.string(),
      company: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean().optional(),
      description: z.array(z.string()).optional(),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  languages: z.array(
    z.object({
      language: z.string(),
      proficiency: z.number().min(1).max(5),
      level: z.string().optional(),
    })
  ),
  skills: z.array(z.string()),
  sections: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        content: z.union([z.string(), z.array(z.any())]),
        order: z.number(),
      })
    )
    .optional(),
  design: z
    .object({
      template: z.string(),
      color: z.string(),
      headingFont: z.string(),
      bodyFont: z.string(),
      spacing: z.number(),
      lineHeight: z.number(),
      showDots: z.boolean(),
      showShadow: z.boolean(),
      layout: z.string(),
    })
    .optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).optional(),
  shortDescription: z.string().max(500).optional(),
  companyName: z.string().min(1).max(200).optional(),
  companyLogo: z.string().url().optional().or(z.literal('')),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  location: z.string().min(1).max(200).optional(),
  workType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  categoryId: z.number().positive().optional(),
  employmentType: z
    .enum(['full-time', 'part-time', 'contract', 'internship'])
    .optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  salaryCurrency: z.string().length(3).optional(),
  salaryPeriod: z.enum(['yearly', 'monthly', 'hourly']).optional(),
  salaryNegotiable: z.boolean().optional(),
  showSalary: z.boolean().optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  requiredEducation: z.string().max(200).optional(),
  requiredExperience: z.number().min(0).max(50).optional(),
  languages: z
    .array(
      z.object({
        language: z.string(),
        level: z.enum(['basic', 'intermediate', 'advanced', 'native']),
        required: z.boolean().default(false),
      })
    )
    .optional(),
  benefits: z.array(z.string()).optional(),
  perks: z.array(z.string()).optional(),
  applicationInstructions: z.string().max(1000).optional(),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  isUrgent: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isRemote: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
}).extend({
  // Override date fields to accept strings and transform them
  applicationDeadline: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
  startDate: z.string().datetime().optional().transform((str) => str ? new Date(str) : undefined),
});

export const updateJobApplicationSchema = z.object({
  status: z
    .enum([
      'pending',
      'reviewing',
      'shortlisted',
      'interviewed',
      'offered',
      'hired',
      'rejected',
      'withdrawn',
    ])
    .optional(),
  hrNotes: z.string().max(2000).optional(),
  hrRating: z.number().min(1).max(5).optional(),
  interviewScheduledAt: z.string().datetime().optional(),
  interviewType: z.enum(['phone', 'video', 'in-person']).optional(),
  interviewNotes: z.string().max(2000).optional(),
  responseDeadline: z.string().datetime().optional(),
});

export const insertCandidateProfileSchema = createInsertSchema(
  candidateProfiles
).pick({
  userId: true,
  firstName: true,
  lastName: true,
  bio: true,
  title: true,
  location: true,
  website: true,
  phone: true,
  dateOfBirth: true,
  currentSalary: true,
  expectedSalary: true,
  salaryNegotiable: true,
  availabilityDate: true,
  workPreferences: true,
  linkedinUrl: true,
  githubUrl: true,
  twitterUrl: true,
  portfolioUrl: true,
  skills: true,
  interests: true,
  languages: true,
  preferredRoles: true,
  preferredIndustries: true,
  preferredCompanySize: true,
});

export const insertHrProfileSchema = createInsertSchema(hrProfiles).pick({
  userId: true,
  firstName: true,
  lastName: true,
  jobTitle: true,
  department: true,
  phone: true,
  companyName: true,
  companyWebsite: true,
  companySize: true,
  companyIndustry: true,
  companyLocation: true,
  companyDescription: true,
  yearsOfExperience: true,
  specializations: true,
  hiringSectors: true,
  preferredContactMethod: true,
  workingHours: true,
  linkedinUrl: true,
  companyLinkedinUrl: true,
});

// Update schemas with proper validation
export const updateCandidateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(1000).optional(),
  title: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  currentSalary: z.number().min(0).optional(),
  expectedSalary: z.number().min(0).optional(),
  salaryNegotiable: z.boolean().optional(),
  availabilityDate: z.string().datetime().optional(),
  workPreferences: z
    .object({
      remote: z.boolean().optional(),
      hybrid: z.boolean().optional(),
      onsite: z.boolean().optional(),
      willingToRelocate: z.boolean().optional(),
    })
    .optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  languages: z
    .array(
      z.object({
        name: z.string(),
        proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'native']),
      })
    )
    .optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
  preferredCompanySize: z
    .enum(['startup', 'small', 'medium', 'large', 'enterprise'])
    .optional(),
});

export const updateHrProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  companyName: z.string().min(1).max(200).optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companySize: z
    .enum(['startup', 'small', 'medium', 'large', 'enterprise'])
    .optional(),
  companyIndustry: z.string().max(100).optional(),
  companyLocation: z.string().max(200).optional(),
  companyDescription: z.string().max(2000).optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  specializations: z.array(z.string()).optional(),
  hiringSectors: z.array(z.string()).optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'linkedin']).optional(),
  workingHours: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  companyLinkedinUrl: z.string().url().optional().or(z.literal('')),
});

export const updatePrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'hr_only']).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showSalary: z.boolean().optional(),
  allowHrContact: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  jobAlerts: z.boolean().optional(),
  profileViews: z.boolean().optional(),
});

export const insertProfileViewSchema = createInsertSchema(profileViews).pick({
  viewedProfileId: true,
  viewedProfileType: true,
  viewerUserId: true,
  viewerType: true,
  ipAddress: true,
  userAgent: true,
  referrer: true,
});

export const insertProfileActivitySchema = createInsertSchema(
  profileActivities
).pick({
  userId: true,
  profileType: true,
  action: true,
  description: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['candidate', 'hr']).default('candidate'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export type CV = typeof cvs.$inferSelect;
export type InsertCV = z.infer<typeof insertCVSchema>;

export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type CVVersion = typeof cvVersions.$inferSelect;
export type InsertCVVersion = z.infer<typeof insertCVVersionSchema>;

export type CVData = z.infer<typeof cvDataSchema>;
export type Change = z.infer<typeof changeSchema>;

export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type InsertCandidateProfile = z.infer<
  typeof insertCandidateProfileSchema
>;
export type UpdateCandidateProfileRequest = z.infer<
  typeof updateCandidateProfileSchema
>;

export type HrProfile = typeof hrProfiles.$inferSelect;
export type InsertHrProfile = z.infer<typeof insertHrProfileSchema>;
export type UpdateHrProfileRequest = z.infer<typeof updateHrProfileSchema>;

export type ProfileView = typeof profileViews.$inferSelect;
export type InsertProfileView = z.infer<typeof insertProfileViewSchema>;

export type ProfileActivity = typeof profileActivities.$inferSelect;
export type InsertProfileActivity = z.infer<typeof insertProfileActivitySchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type UpdateJobRequest = z.infer<typeof updateJobSchema>;

export type JobCategory = typeof jobCategories.$inferSelect;
export type InsertJobCategory = z.infer<typeof insertJobCategorySchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type UpdateJobApplicationRequest = z.infer<
  typeof updateJobApplicationSchema
>;

export type JobAlert = typeof jobAlerts.$inferSelect;
export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;

export type SavedJob = typeof savedJobs.$inferSelect;
export type InsertSavedJob = z.infer<typeof insertSavedJobSchema>;

export type JobView = typeof jobViews.$inferSelect;
