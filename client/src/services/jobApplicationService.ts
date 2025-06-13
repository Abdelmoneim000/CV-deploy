import axios from 'axios';

const API_BASE_URL = 'http://localhost:8888/api';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';
  appliedAt: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export interface CreateJobApplicationRequest {
  jobId: string;
  coverLetter?: string;
  resumeId?: string; // Reference to uploaded CV/resume
}

export interface JobApplicationResponse {
  success: boolean;
  message: string;
  data: JobApplication;
}

export const jobApplicationService = {
  // Apply for a job
  applyForJob: async (
    applicationData: CreateJobApplicationRequest
  ): Promise<JobApplicationResponse> => {
    const response = await apiClient.post('/job-applications', applicationData);
    return response.data;
  },

  // Get user's applications
  getMyApplications: async (): Promise<{
    success: boolean;
    data: JobApplication[];
  }> => {
    const response = await apiClient.get('/job-applications/my-applications');
    return response.data;
  },

  // Get specific application
  getApplication: async (
    applicationId: string
  ): Promise<{ success: boolean; data: JobApplication }> => {
    const response = await apiClient.get(`/job-applications/${applicationId}`);
    return response.data;
  },

  // Withdraw application
  withdrawApplication: async (
    applicationId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(
      `/job-applications/${applicationId}`
    );
    return response.data;
  },

  // Check if user has applied for specific job
  checkApplicationStatus: async (
    jobId: string
  ): Promise<{
    success: boolean;
    data: { hasApplied: boolean; applicationId?: string };
  }> => {
    const response = await apiClient.get(`/jobs/check/${jobId}`);
    return response.data;
  },
};
