import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AiOutlineSearch,
  AiOutlineUser,
  AiOutlineArrowLeft,
  AiOutlineRobot,
} from 'react-icons/ai';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import useAuth from '@/hooks/useAuth';
import ApplicationCard from './ApplicationCard';

interface Candidate {
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  email: string;
  avatar?: string;
}

interface CV {
  id: number;
  title: string;
}

interface Application {
  id: number;
  candidateUserId: number;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  aiScore: number;
  hrRating: number | null;
  candidate: Candidate;
  cv: CV;
  coverLetter?: string;
  portfolioUrl?: string;
  hrNotes?: string;
}

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  shortlistedApplications: number;
  averageAiScore: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ApplicationFilters {
  status: string;
  rating: string;
  aiScore: string;
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const HrApplications: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { tokens } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedApplications, setSelectedApplications] = useState<number[]>(
    []
  );
  const [jobTitle, setJobTitle] = useState<string>('');

  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    rating: '',
    aiScore: '',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'appliedAt',
    sortOrder: 'desc',
  });

  // Fetch applications
  const fetchApplications = async () => {
    if (!jobId) {
      toast.error('Job ID is required');
      return;
    }

    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      if (filters.status !== 'all')
        queryParams.append('status', filters.status);
      if (filters.rating) queryParams.append('rating', filters.rating);
      if (filters.aiScore) queryParams.append('aiScore', filters.aiScore);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(
        `/api/jobs/${jobId}/applications?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          setApplications(responseData.data.applications);
          setStats(responseData.data.stats);
          setPagination(responseData.pagination);

          toast.success(
            `Loaded ${responseData.data.applications.length} applications`
          );
        } else {
          throw new Error(responseData.error || 'Failed to fetch applications');
        }
      } else if (response.status === 401) {
        toast.error('Authentication required. Please login again.');
        navigate('/login');
      } else if (response.status === 403) {
        toast.error('You do not have permission to view these applications.');
        navigate('/job-board/jobs');
      } else if (response.status === 404) {
        toast.error('Job not found.');
        navigate('/job-board/jobs');
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch job details to get job title
  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          setJobTitle(responseData.data.title || 'Job Applications');
        }
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    fetchApplications();
  }, [jobId, filters]);

  // Update application status
  const updateApplicationStatus = async (
    applicationId: number,
    status: string,
    hrRating?: number,
    hrNotes?: string
  ) => {
    const loadingToastId = toast.loading(`Updating application status...`);

    try {
      const response = await fetch(
        `/api/jobs/${jobId}/applications/${applicationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            status,
            hrRating,
            hrNotes,
          }),
        }
      );

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          const statusLabels = {
            reviewing: 'reviewing',
            shortlisted: 'shortlisted',
            rejected: 'rejected',
            hired: 'hired',
          };

          const statusLabel =
            statusLabels[status as keyof typeof statusLabels] || status;
          toast.success(`Application ${statusLabel} successfully!`);

          // Refresh applications
          await fetchApplications();
        } else {
          throw new Error(
            responseData.error || 'Failed to update application status'
          );
        }
      } else {
        throw new Error('Failed to update application status');
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      toast.dismiss(loadingToastId);
      toast.error('Failed to update application status. Please try again.');
    }
  };

  // Bulk update applications
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedApplications.length === 0) {
      toast.warning('Please select applications first');
      return;
    }

    const loadingToastId = toast.loading(
      `Updating ${selectedApplications.length} application${
        selectedApplications.length === 1 ? '' : 's'
      }...`
    );

    try {
      const promises = selectedApplications.map((applicationId) =>
        fetch(`/api/applications/${applicationId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({ status }),
        })
      );

      const responses = await Promise.all(promises);
      const failedRequests = responses.filter((response) => !response.ok);

      toast.dismiss(loadingToastId);

      if (failedRequests.length === 0) {
        toast.success(
          `✅ Successfully updated ${selectedApplications.length} application${
            selectedApplications.length === 1 ? '' : 's'
          }!`
        );
        setSelectedApplications([]);
        await fetchApplications();
      } else {
        const successCount = responses.length - failedRequests.length;
        toast.warning(
          `⚠️ ${successCount} application${
            successCount === 1 ? '' : 's'
          } updated successfully, ${failedRequests.length} failed.`
        );
        await fetchApplications();
      }
    } catch (error) {
      console.error('Failed to bulk update applications:', error);
      toast.dismiss(loadingToastId);
      toast.error('Failed to update applications. Please try again.');
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ApplicationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle application selection
  const handleApplicationSelection = (
    applicationId: number,
    selected: boolean
  ) => {
    if (selected) {
      setSelectedApplications((prev) => [...prev, applicationId]);
    } else {
      setSelectedApplications((prev) =>
        prev.filter((id) => id !== applicationId)
      );
    }
  };

  // Select all applications
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedApplications(applications.map((app) => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get AI score color
  const getAiScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && applications.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/job-board')}
              className="flex items-center gap-2"
            >
              <AiOutlineArrowLeft size={16} />
              Back to Board
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Applications</h1>
              <p className="text-muted-foreground mt-1">
                {jobTitle || 'Job Applications'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.totalApplications}
                  </p>
                </div>
                <AiOutlineUser className="text-primary" size={24} />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingApplications}
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviewing</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.reviewingApplications}
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Shortlisted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.shortlistedApplications}
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg AI Score</p>
                  <p className="text-2xl font-bold">
                    {Math.round(stats.averageAiScore)}
                  </p>
                </div>
                <AiOutlineRobot className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <AiOutlineSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search candidates..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>

            {/* AI Score Filter */}
            <select
              value={filters.aiScore}
              onChange={(e) => handleFilterChange({ aiScore: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All AI Scores</option>
              <option value="80">80+ (Excellent)</option>
              <option value="60">60+ (Good)</option>
              <option value="40">40+ (Fair)</option>
            </select>

            {/* Sort Options */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange({
                  sortBy,
                  sortOrder: sortOrder as 'asc' | 'desc',
                });
              }}
              className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="appliedAt-desc">Latest Applied</option>
              <option value="appliedAt-asc">Earliest Applied</option>
              <option value="aiScore-desc">Highest AI Score</option>
              <option value="aiScore-asc">Lowest AI Score</option>
              <option value="hrRating-desc">Highest HR Rating</option>
              <option value="hrRating-asc">Lowest HR Rating</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">
                {selectedApplications.length} application
                {selectedApplications.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('reviewing')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark as Reviewing
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('shortlisted')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Shortlist
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('rejected')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedApplications([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Applications List */}
        <div className="bg-card border border-border rounded-lg">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineUser
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">
                No Applications Found
              </h3>
              <p className="text-muted-foreground">
                {filters.status !== 'all' || filters.search
                  ? 'No applications match your current filters.'
                  : 'No applications have been submitted for this job yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedApplications.length === applications.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Select All ({applications.length})
                  </span>
                </div>
              </div>

              {/* Applications */}
              <div className="divide-y divide-border">
                {applications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    isSelected={selectedApplications.includes(application.id)}
                    onSelect={(selected) =>
                      handleApplicationSelection(application.id, selected)
                    }
                    onStatusUpdate={updateApplicationStatus}
                    formatDate={formatDate}
                    getStatusBadgeColor={getStatusBadgeColor}
                    getAiScoreColor={getAiScoreColor}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} applications
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum =
                  Math.max(
                    1,
                    Math.min(pagination.pages - 4, pagination.page - 2)
                  ) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default HrApplications;
