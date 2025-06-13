import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AiOutlineSearch,
  AiOutlineEye,
  AiOutlineFileText,
  AiOutlineCalendar,
  AiOutlineClockCircle,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineExclamationCircle,
  AiOutlineDelete,
  AiOutlineReload,
  AiOutlineFilter,
  AiOutlineGlobal,
  AiOutlineEnvironment,
  AiOutlineDollar,
  AiOutlineTeam,
  AiOutlineHeart,
} from 'react-icons/ai';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import useAuth from '@/hooks/useAuth';

interface JobApplication {
  id: number;
  jobId: number;
  status:
    | 'pending'
    | 'reviewing'
    | 'shortlisted'
    | 'rejected'
    | 'hired'
    | 'withdrawn';
  appliedAt: string;
  updatedAt: string;
  coverLetter?: string;
  portfolioUrl?: string;
  hrNotes?: string;
  hrRating?: number;
  job: {
    id: number;
    title: string;
    companyName: string;
    companyLogo?: string;
    location: string;
    workType: 'remote' | 'hybrid' | 'onsite';
    employmentType:
      | 'full-time'
      | 'part-time'
      | 'contract'
      | 'freelance'
      | 'internship';
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency: string;
    status: string;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    description: string;
  }>;
}

interface ApplicationStats {
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number;
  shortlistedApplications: number;
  rejectedApplications: number;
  hiredApplications: number;
  responseRate: number;
  averageResponseTime: number;
}

interface ApplicationFilters {
  status: string;
  search: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

const ApplicationManager: React.FC = () => {
  const { tokens } = useAuth();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplications, setSelectedApplications] = useState<number[]>(
    []
  );
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    search: '',
    dateRange: 'all',
    sortBy: 'appliedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Fetch applications
  const fetchApplications = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all')
        queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.dateRange !== 'all')
        queryParams.append('dateRange', filters.dateRange);
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      queryParams.append('sortBy', filters.sortBy);
      queryParams.append('sortOrder', filters.sortOrder);

      const response = await fetch(
        `/api/applications/my-applications?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          setApplications(responseData.data.applications || responseData.data);
          setStats(responseData.data.stats || responseData.stats);
          setPagination(
            responseData.pagination || {
              total: responseData.data.applications?.length || 0,
              pages: 1,
              page: 1,
              limit: filters.limit,
            }
          );
        } else {
          throw new Error(responseData.error || 'Failed to fetch applications');
        }
      } else if (response.status === 401) {
        toast.error('Authentication required. Please login again.');
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

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  // Withdraw application
  const withdrawApplication = async (applicationId: number) => {
    const confirmWithdraw = window.confirm(
      'Are you sure you want to withdraw this application? This action cannot be undone.'
    );

    if (!confirmWithdraw) return;

    const loadingToastId = toast.loading('Withdrawing application...');

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/withdraw`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify({
            reason: 'Withdrawn by candidate',
          }),
        }
      );

      toast.dismiss(loadingToastId);

      if (response.ok) {
        toast.success('Application withdrawn successfully');
        await fetchApplications(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast.dismiss(loadingToastId);
      toast.error('Failed to withdraw application. Please try again.');
    }
  };

  // Bulk withdraw applications
  const bulkWithdrawApplications = async () => {
    if (selectedApplications.length === 0) {
      toast.warning('Please select applications to withdraw');
      return;
    }

    const confirmWithdraw = window.confirm(
      `Are you sure you want to withdraw ${
        selectedApplications.length
      } application${
        selectedApplications.length === 1 ? '' : 's'
      }? This action cannot be undone.`
    );

    if (!confirmWithdraw) return;

    const loadingToastId = toast.loading(
      `Withdrawing ${selectedApplications.length} application${
        selectedApplications.length === 1 ? '' : 's'
      }...`
    );

    try {
      const response = await fetch('/api/applications/bulk/withdraw', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          applicationIds: selectedApplications,
          reason: 'Bulk withdrawal by candidate',
        }),
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        toast.success(
          `Successfully withdrew ${responseData.data.success} application${
            responseData.data.success === 1 ? '' : 's'
          }`
        );
        setSelectedApplications([]);
        await fetchApplications(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw applications');
      }
    } catch (error) {
      console.error('Failed to withdraw applications:', error);
      toast.dismiss(loadingToastId);
      toast.error('Failed to withdraw applications. Please try again.');
    }
  };

  // Handle application selection
  const handleApplicationSelection = (
    applicationId: number,
    selected: boolean
  ) => {
    if (selected) {
      setSelectedApplications([...selectedApplications, applicationId]);
    } else {
      setSelectedApplications(
        selectedApplications.filter((id) => id !== applicationId)
      );
    }
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const selectableApplications = applications
        .filter((app) => ['pending', 'reviewing'].includes(app.status))
        .map((app) => app.id);
      setSelectedApplications(selectableApplications);
    } else {
      setSelectedApplications([]);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ApplicationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
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
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AiOutlineClockCircle size={16} />;
      case 'reviewing':
        return <AiOutlineEye size={16} />;
      case 'shortlisted':
        return <AiOutlineCheckCircle size={16} />;
      case 'rejected':
        return <AiOutlineCloseCircle size={16} />;
      case 'hired':
        return <AiOutlineHeart size={16} />;
      case 'withdrawn':
        return <AiOutlineDelete size={16} />;
      default:
        return <AiOutlineExclamationCircle size={16} />;
    }
  };

  // Format salary
  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return 'Not specified';

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    return formatter.format(min || max || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Container>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">
              Loading your applications...
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Container>
        <div className="space-y-6 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                My Applications
              </h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your job applications
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => fetchApplications()}
                className="flex items-center gap-2"
              >
                <AiOutlineReload size={16} />
                Refresh
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 ${
                  showFilters ? 'bg-primary/10' : ''
                }`}
              >
                <AiOutlineFilter size={16} />
                Filters
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">
                      {stats.totalApplications}
                    </p>
                  </div>
                  <AiOutlineFileText className="text-primary" size={20} />
                </div>
              </div>

              <div className="p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {stats.pendingApplications}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                </div>
              </div>

              <div className="p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Reviewing</p>
                    <p className="text-xl font-bold text-blue-600">
                      {stats.reviewingApplications}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                </div>
              </div>

              <div className="p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Shortlisted</p>
                    <p className="text-xl font-bold text-green-600">
                      {stats.shortlistedApplications}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>

              <div className="p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Hired</p>
                    <p className="text-xl font-bold text-purple-600">
                      {stats.hiredApplications}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                </div>
              </div>

              <div className="p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Response Rate
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {stats.responseRate}%
                    </p>
                  </div>
                  <AiOutlineCheckCircle className="text-primary" size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange({ status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      handleFilterChange({ dateRange: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange({ sortBy: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="appliedAt">Application Date</option>
                    <option value="updatedAt">Last Updated</option>
                    <option value="status">Status</option>
                    <option value="companyName">Company</option>
                    <option value="title">Job Title</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sort Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      handleFilterChange({
                        sortOrder: e.target.value as 'asc' | 'desc',
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-md">
                    <AiOutlineSearch
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Search jobs or companies..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange({ search: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        status: 'all',
                        search: '',
                        dateRange: 'all',
                        sortBy: 'appliedAt',
                        sortOrder: 'desc',
                        page: 1,
                        limit: 12,
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedApplications.length} application
                  {selectedApplications.length === 1 ? '' : 's'} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={bulkWithdrawApplications}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AiOutlineDelete size={14} className="mr-1" />
                    Withdraw Selected
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
            </div>
          )}

          {/* Applications Grid */}
          <div className="space-y-6">
            {applications.length === 0 ? (
              <div className="text-center py-12 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                <AiOutlineFileText
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  No Applications Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {filters.status !== 'all' || filters.search
                    ? 'No applications match your current filters.'
                    : "You haven't applied to any jobs yet."}
                </p>
                <Link to="/job-board/discover">
                  <Button>
                    <AiOutlineSearch size={16} className="mr-2" />
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Bulk Select Header */}
                <div className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
                  <input
                    type="checkbox"
                    checked={
                      selectedApplications.length ===
                        applications.filter((app) =>
                          ['pending', 'reviewing'].includes(app.status)
                        ).length &&
                      applications.filter((app) =>
                        ['pending', 'reviewing'].includes(app.status)
                      ).length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    Select All (
                    {
                      applications.filter((app) =>
                        ['pending', 'reviewing'].includes(app.status)
                      ).length
                    }{' '}
                    selectable)
                  </span>
                </div>

                {/* Applications List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {applications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      isSelected={selectedApplications.includes(application.id)}
                      onSelect={(selected) =>
                        handleApplicationSelection(application.id, selected)
                      }
                      onWithdraw={() => withdrawApplication(application.id)}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                      formatSalary={formatSalary}
                      getStatusBadgeColor={getStatusBadgeColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page =
                  pagination.page <= 3
                    ? i + 1
                    : pagination.page >= pagination.pages - 2
                    ? pagination.pages - 4 + i
                    : pagination.page - 2 + i;

                if (page < 1 || page > pagination.pages) return null;

                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? 'default' : 'outline'}
                    onClick={() => handlePageChange(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

// Application Card Component
interface ApplicationCardProps {
  application: JobApplication;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onWithdraw: () => void;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  formatSalary: (min?: number, max?: number, currency?: string) => string;
  getStatusBadgeColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isSelected,
  onSelect,
  onWithdraw,
  formatDate,
  formatDateTime,
  formatSalary,
  getStatusBadgeColor,
  getStatusIcon,
}) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  const canWithdraw = ['pending', 'reviewing'].includes(application.status);
  const canSelect = canWithdraw;

  return (
    <div className="p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {canSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1 rounded"
          />
        )}

        {/* Company Logo */}
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          {application.job.companyLogo ? (
            <img
              src={application.job.companyLogo}
              alt={application.job.companyName}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <span className="text-primary font-semibold text-lg">
              {application.job.companyName[0]}
            </span>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {application.job.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {application.job.companyName}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadgeColor(
                  application.status
                )}`}
              >
                {getStatusIcon(application.status)}
                {application.status}
              </span>
            </div>
          </div>

          {/* Job Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <AiOutlineEnvironment size={14} />
              {application.job.location}
            </span>
            <span className="flex items-center gap-1">
              <AiOutlineTeam size={14} />
              {application.job.workType}
            </span>
            <span className="flex items-center gap-1">
              <AiOutlineClockCircle size={14} />
              {application.job.employmentType}
            </span>
            {(application.job.salaryMin || application.job.salaryMax) && (
              <span className="flex items-center gap-1">
                <AiOutlineDollar size={14} />
                {formatSalary(
                  application.job.salaryMin,
                  application.job.salaryMax,
                  application.job.salaryCurrency
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground block text-xs">
              Applied:
            </span>
            <p className="font-medium">{formatDate(application.appliedAt)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground block text-xs">
              Last Updated:
            </span>
            <p className="font-medium">{formatDate(application.updatedAt)}</p>
          </div>
        </div>

        {/* HR Rating */}
        {application.hrRating && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground block text-xs mb-1">
              HR Rating:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <AiOutlineHeart
                  key={star}
                  size={16}
                  className={
                    star <= application.hrRating!
                      ? 'text-red-500'
                      : 'text-gray-300'
                  }
                  fill={star <= application.hrRating! ? 'currentColor' : 'none'}
                />
              ))}
              <span className="ml-2 text-sm font-medium">
                {application.hrRating}/5
              </span>
            </div>
          </div>
        )}

        {/* HR Notes */}
        {application.hrNotes && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-600 block text-xs font-medium mb-1">
              HR Feedback:
            </span>
            <p className="text-blue-800 text-sm">{application.hrNotes}</p>
          </div>
        )}
      </div>

      {/* Portfolio Link */}
      {application.portfolioUrl && (
        <div className="mb-4">
          <a
            href={application.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm flex items-center gap-1"
          >
            <AiOutlineGlobal size={14} />
            View Portfolio
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <Link to={`/jobs/${application.job.id}`} target="_blank">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <AiOutlineEye size={14} />
            View Job
          </Button>
        </Link>

        {application.coverLetter && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCoverLetter(!showCoverLetter)}
            className="flex items-center gap-1"
          >
            <AiOutlineFileText size={14} />
            {showCoverLetter ? 'Hide' : 'Show'} Cover Letter
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center gap-1"
        >
          <AiOutlineCalendar size={14} />
          {showTimeline ? 'Hide' : 'Show'} Timeline
        </Button>

        {canWithdraw && (
          <Button
            size="sm"
            variant="outline"
            onClick={onWithdraw}
            className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1 ml-auto"
          >
            <AiOutlineDelete size={14} />
            Withdraw
          </Button>
        )}
      </div>

      {/* Cover Letter */}
      {showCoverLetter && application.coverLetter && (
        <div className="p-4 bg-muted/50 rounded-lg mb-4">
          <h4 className="font-medium text-sm mb-2">Cover Letter:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {application.coverLetter}
          </p>
        </div>
      )}

      {/* Timeline */}
      {showTimeline && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-3">Application Timeline:</h4>
          <div className="space-y-3">
            {application.timeline.map((event, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    getStatusBadgeColor(event.status).includes('yellow')
                      ? 'bg-yellow-500'
                      : getStatusBadgeColor(event.status).includes('blue')
                      ? 'bg-blue-500'
                      : getStatusBadgeColor(event.status).includes('green')
                      ? 'bg-green-500'
                      : getStatusBadgeColor(event.status).includes('red')
                      ? 'bg-red-500'
                      : getStatusBadgeColor(event.status).includes('purple')
                      ? 'bg-purple-500'
                      : 'bg-gray-500'
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {event.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManager;
