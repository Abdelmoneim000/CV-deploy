export interface Job {
  experienceLevel: string;
  categoryId: null;
  city: string;
  country: string;
  companyLogo: string;
  shortDescription: string;
  id: number;
  title: string;
  description?: string; // Add this property
  status: 'draft' | 'published' | 'paused' | 'closed' | 'expired';
  applicationCount: number;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  companyWebsite?: string; // Add this property
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  employmentType:
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'freelance'
    | 'internship';
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  applicationDeadline: string | null;
  isUrgent: boolean;
  isFeatured: boolean;
  requiredSkills?: string[]; // Add this property
  preferredSkills?: string[]; // Add this property
}

export interface JobStats {
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

export interface JobFilters {
  status: string;
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
}
