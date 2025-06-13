import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai';
import { toast } from 'react-toastify';
import Button from '@/components/ui/button';
import Container from '@/components/ui/Container';
import useAuth from '@/hooks/useAuth';

import JobStatsCards from './JobStatsCards';
import JobFiltersBar from './JobFiltersBar';
import JobCard from './JobCard';
import JobEmptyState from './JobEmptyState';
import JobPagination from './JobPagination';
import DeleteJobModal from './DeleteJobModal';
import JobDetailsAside from './JobDetailsAside';
import { Job, JobStats, JobFilters, Pagination } from '@/types/JobBoard';

const JobManager: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  // Add state for job details aside
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  const { tokens } = useAuth();

  const [filters, setFilters] = useState<JobFilters>({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    currentPage: 1,
  });

  // Fetch jobs from API with enhanced error handling
  const fetchJobs = async (showLoadingToast = false) => {
    let loadingToastId: any = null;

    try {
      setLoading(true);

      if (showLoadingToast) {
        loadingToastId = toast.loading('Loading jobs...');
      }

      const queryParams = new URLSearchParams();

      if (filters.status !== 'all')
        queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/jobs/my-jobs?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setJobs(data.data.jobs || data.data);
          setStats(data.stats);
          setPagination(
            data.pagination || {
              total: data.data.jobs?.length || 0,
              pages: 1,
              currentPage: 1,
            }
          );

          if (loadingToastId) {
            toast.dismiss(loadingToastId);
            toast.success(`Loaded ${data.data.jobs?.length || 0} jobs`);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch jobs');
        }
      } else if (response.status === 401) {
        toast.error('Authentication required. Please login again.');
      } else if (response.status === 403) {
        toast.error('You do not have permission to view these jobs.');
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);

      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      toast.error('Failed to load jobs. Please try again.', {
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  // Handle job status changes with toast notifications
  const handleStatusChange = async (jobId: number, action: string) => {
    const loadingToastId = toast.loading(`Updating job status...`);

    try {
      const response = await fetch(`/api/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();

        toast.dismiss(loadingToastId);

        // Success message based on action
        const actionMessages = {
          publish: 'Job published successfully! 🚀',
          pause: 'Job paused successfully ⏸️',
          close: 'Job closed successfully 🔒',
          archive: 'Job archived successfully 📁',
          promote: 'Job promoted successfully ⭐',
          boost: 'Job visibility boosted successfully 📈',
        };

        const message =
          actionMessages[action as keyof typeof actionMessages] ||
          `Job ${action}ed successfully!`;

        toast.success(message, {
          autoClose: 3000,
        });

        // Refresh jobs and update selected job if being viewed
        await fetchJobs();

        if (selectedJobForDetails && selectedJobForDetails.id === jobId) {
          const updatedJob = jobs.find((job) => job.id === jobId);
          if (updatedJob) {
            setSelectedJobForDetails(updatedJob);
          }
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} job`);
      }
    } catch (error) {
      console.error('Failed to update job status:', error);

      toast.dismiss(loadingToastId);
      toast.error(`Failed to ${action} job. Please try again.`, {
        autoClose: 5000,
      });
    }
  };

  // Handle job deletion with enhanced feedback
  const handleDeleteJob = async (job: Job) => {
    if (job.status !== 'draft' && job.status !== 'closed') {
      toast.warning('Only draft and closed jobs can be deleted', {
        autoClose: 4000,
      });
      return;
    }
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    const loadingToastId = toast.loading(`Deleting "${jobToDelete.title}"...`);

    try {
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        toast.dismiss(loadingToastId);
        toast.success(`✅ Job "${jobToDelete.title}" deleted successfully!`, {
          autoClose: 4000,
        });

        // Close modal and refresh
        setShowDeleteModal(false);
        setJobToDelete(null);
        await fetchJobs();

        // Close job details if the deleted job was being viewed
        if (
          selectedJobForDetails &&
          selectedJobForDetails.id === jobToDelete.id
        ) {
          setShowJobDetails(false);
          setSelectedJobForDetails(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Failed to delete job:', error);

      toast.dismiss(loadingToastId);
      toast.error(`❌ Failed to delete job. Please try again.`, {
        autoClose: 5000,
      });
    }
  };

  // Enhanced bulk operations with better feedback
  const handleBulkStatusChange = async (action: string) => {
    if (selectedJobs.length === 0) {
      toast.warning('Please select jobs first');
      return;
    }

    // Special handling for bulk delete
    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${selectedJobs.length} job${
          selectedJobs.length === 1 ? '' : 's'
        }? This action cannot be undone.`
      );
      if (!confirmDelete) {
        return;
      }
    }

    const actionLabel = action === 'delete' ? 'Deleting' : 'Updating';
    const loadingToastId = toast.loading(
      `${actionLabel} ${selectedJobs.length} job${
        selectedJobs.length === 1 ? '' : 's'
      }...`
    );

    try {
      const promises = selectedJobs.map((jobId) => {
        if (action === 'delete') {
          return fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${tokens?.accessToken}`,
            },
          });
        } else {
          return fetch(`/api/jobs/${jobId}/${action}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens?.accessToken}`,
            },
          });
        }
      });

      const responses = await Promise.all(promises);
      const failedRequests = responses.filter((response) => !response.ok);

      toast.dismiss(loadingToastId);

      if (failedRequests.length === 0) {
        // All successful
        const actionMessages = {
          publish: 'published',
          pause: 'paused',
          close: 'closed',
          delete: 'deleted',
          archive: 'archived',
        };

        const actionText =
          actionMessages[action as keyof typeof actionMessages] || action;

        toast.success(
          `✅ Successfully ${actionText} ${selectedJobs.length} job${
            selectedJobs.length === 1 ? '' : 's'
          }!`,
          {
            autoClose: 4000,
          }
        );

        setSelectedJobs([]);
        await fetchJobs();
      } else if (failedRequests.length < responses.length) {
        // Partial success
        const successCount = responses.length - failedRequests.length;
        toast.warning(
          `⚠️ ${successCount} job${
            successCount === 1 ? '' : 's'
          } updated successfully, ${failedRequests.length} failed.`,
          {
            autoClose: 5000,
          }
        );

        setSelectedJobs([]);
        await fetchJobs();
      } else {
        // All failed
        throw new Error('All operations failed');
      }
    } catch (error) {
      console.error('Failed to bulk update jobs:', error);

      toast.dismiss(loadingToastId);
      toast.error(`❌ Failed to ${action} jobs. Please try again.`, {
        autoClose: 5000,
      });
    }
  };

  const handleJobSelection = (jobId: number, selected: boolean) => {
    if (selected) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    toast.info(`Loading page ${page}...`, {
      autoClose: 1000,
    });
  };

  // Handle viewing job details
  const handleViewJobDetails = (job: Job) => {
    setSelectedJobForDetails(job);
    setShowJobDetails(true);
  };

  const handleCloseJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJobForDetails(null);
  };

  // Enhanced filters handler
  const handleFiltersChange = (newFilters: JobFilters) => {
    setFilters(newFilters);
  };

  // Clear selection with feedback
  const handleClearSelection = () => {
    setSelectedJobs([]);
    toast.info('Selection cleared', {
      autoClose: 1500,
    });
  };

  if (loading && jobs.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your jobs...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Manager</h1>
            <p className="text-muted-foreground mt-1">
              Manage your job postings and track applications
            </p>
          </div>
          <Link to="/job-board/post">
            <Button className="flex items-center gap-2">
              <AiOutlinePlus size={16} />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && <JobStatsCards stats={stats} />}

        {/* Filters and Search */}
        <JobFiltersBar
          filters={filters}
          setFilters={handleFiltersChange}
          selectedJobs={selectedJobs}
          onBulkAction={handleBulkStatusChange}
          onClearSelection={handleClearSelection}
        />

        {/* Jobs List */}
        <div className="bg-card border border-border rounded-lg">
          {jobs.length === 0 ? (
            <JobEmptyState filters={filters} />
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobs.includes(job.id)}
                  onSelect={(selected) => handleJobSelection(job.id, selected)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteJob}
                  onViewDetails={handleViewJobDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <JobPagination
          pagination={pagination}
          filters={filters}
          onPageChange={handlePageChange}
        />

        {/* Delete Confirmation Modal */}
        <DeleteJobModal
          isOpen={showDeleteModal}
          job={jobToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setJobToDelete(null);
          }}
          onConfirm={confirmDeleteJob}
        />

        {/* Job Details Aside */}
        <JobDetailsAside
          job={selectedJobForDetails}
          isOpen={showJobDetails}
          onClose={handleCloseJobDetails}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteJob}
        />
      </div>
    </Container>
  );
};

export default JobManager;
