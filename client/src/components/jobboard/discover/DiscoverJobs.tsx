import React, { useState, useEffect } from 'react';
import SearchSection from './SearchSection';
import FilterPanel from './FilterPanel';
import JobsList from './JobsList';
import QuickActions from './QuickActions';
import RecommendedJobs from './RecommendedJobs';
import SavedJobs from './SavedJobs';
import { Job } from '@/components/jobboard/discover/JobCard';
import useAuth from '@/hooks/useAuth';
import { toast } from 'react-toastify';

const DiscoverJobs: React.FC = () => {
  const { user, tokens } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSalary, setSelectedSalary] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeSection, setActiveSection] = useState<
    'all' | 'recommended' | 'saved'
  >('all');

  // State for job data
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const accessToken =
      tokens?.accessToken ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  };

  // Fetch all jobs with search and filters
  const fetchAllJobs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy: 'relevance',
        sortOrder: 'desc',
      });

      // Add search parameters
      if (searchQuery.trim()) {
        params.append('query', searchQuery.trim());
      }
      if (selectedLocation) {
        params.append('location', selectedLocation);
      }
      if (selectedType) {
        params.append('employmentType', selectedType);
      }
      if (selectedSalary) {
        // Parse salary range like "80-120" to get min and max
        const [min, max] = selectedSalary.split('-');
        if (min && min !== '') {
          params.append('salaryMin', (parseInt(min) * 1000).toString());
        }
        if (max && max !== '+') {
          params.append('salaryMax', (parseInt(max) * 1000).toString());
        }
      }
      if (selectedSkills.length > 0) {
        params.append('skills', selectedSkills.join(','));
      }

      const response = await makeAuthenticatedRequest(
        `/api/jobs/published?${params}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          if (data.data.jobs.length === 0) {
            setAllJobs([]);
            setCurrentPage(1);
            setTotalPages(1);
            setTotalJobs(0);
            return;
          }

          const transformedJobs: Job[] = data.data.jobs.map((job: any) => ({
            id: job.id.toString(),
            title: job.title,
            company: job.companyName,
            logo: job.companyLogo || '🏢',
            location: job.location,
            salary:
              job.salaryMin && job.salaryMax
                ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(
                    job.salaryMax / 1000
                  ).toFixed(0)}k`
                : job.salaryMin
                ? `From $${(job.salaryMin / 1000).toFixed(0)}k`
                : 'Salary not specified',
            type: job.employmentType,
            posted: formatTimeAgo(job.publishedAt),
            description:
              job.shortDescription ||
              job.description?.substring(0, 150) + '...',
            skills: job.requiredSkills || [],
            applications: job.applicationCount || 0,
            views: job.viewCount || 0,
            saved: job.saved || false,
          }));

          setAllJobs(transformedJobs);
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.pages);
          setTotalJobs(data.pagination.total);
        } else {
          throw new Error(data.error || 'Failed to fetch jobs');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
      toast.error('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommended jobs for candidates
  const fetchRecommendedJobs = async () => {
    if (user?.role !== 'candidate') {
      setRecommendedJobs([]);
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(
        '/api/jobs/recommendations?limit=10'
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.data.length === 0) {
            setRecommendedJobs([]);
            return;
          }
          const transformedJobs: Job[] = data.data.map((rec: any) => ({
            id: rec.job.id.toString(),
            title: rec.job.title,
            company: rec.job.companyName,
            logo: rec.job.companyLogo || '🏢',
            location: rec.job.location,
            salary:
              rec.job.salaryMin && rec.job.salaryMax
                ? `$${(rec.job.salaryMin / 1000).toFixed(0)}k - $${(
                    rec.job.salaryMax / 1000
                  ).toFixed(0)}k`
                : 'Salary not specified',
            type: rec.job.employmentType || 'Full-time',
            posted: formatTimeAgo(rec.job.publishedAt),
            description:
              rec.job.shortDescription ||
              rec.job.description?.substring(0, 150) + '...',
            skills: rec.job.requiredSkills || [],
            applications: rec.job.applicationCount || 0,
            views: rec.job.viewCount || 0,
            saved: rec.job.saved || false,
            matchScore: rec.matchScore, // Additional field for recommendations
          }));

          setRecommendedJobs(transformedJobs);
        }
      }
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
    }
  };

  // Fetch saved jobs
  const fetchSavedJobs = async () => {
    if (user?.role !== 'candidate') {
      setSavedJobs([]);
      return;
    }

    try {
      // Since there's no specific saved jobs endpoint in the API docs,
      // we'll filter from the regular jobs API with a saved parameter
      const response = await makeAuthenticatedRequest(
        '/api/jobs?saved=true&limit=50'
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.data.jobs.length === 0) {
            setSavedJobs([]);
            return;
          }

          const transformedJobs: Job[] = data.data.jobs
            .filter((job: any) => job.saved)
            .map((job: any) => ({
              id: job.id.toString(),
              title: job.title,
              company: job.companyName,
              logo: job.companyLogo || '🏢',
              location: job.location,
              salary:
                job.salaryMin && job.salaryMax
                  ? `$${(job.salaryMin / 1000).toFixed(0)}k - $${(
                      job.salaryMax / 1000
                    ).toFixed(0)}k`
                  : 'Salary not specified',
              type: job.employmentType,
              posted: formatTimeAgo(job.publishedAt),
              description:
                job.shortDescription ||
                job.description?.substring(0, 150) + '...',
              skills: job.requiredSkills || [],
              applications: job.applicationCount || 0,
              views: job.viewCount || 0,
              saved: true,
            }));

          setSavedJobs(transformedJobs);
        }
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

  // Format time ago helper function
  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Recently posted';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2419200)
      return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2419200)} months ago`;
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllJobs();
    fetchRecommendedJobs();
    fetchSavedJobs();
  }, []);

  // Refetch when search parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeSection === 'all') {
        setCurrentPage(1);
        fetchAllJobs(1);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedLocation,
    selectedSalary,
    selectedType,
    selectedSkills,
  ]);

  // Refetch when active section changes
  useEffect(() => {
    if (activeSection === 'recommended') {
      fetchRecommendedJobs();
    } else if (activeSection === 'saved') {
      fetchSavedJobs();
    }
  }, [activeSection]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (activeSection === 'all') {
      fetchAllJobs(page);
    }
  };

  // Get current result count based on active section
  const getResultCount = () => {
    switch (activeSection) {
      case 'all':
        return totalJobs;
      case 'recommended':
        return recommendedJobs.length;
      case 'saved':
        return savedJobs.length;
      default:
        return 0;
    }
  };

  // Get current jobs based on active section
  const getCurrentJobs = () => {
    switch (activeSection) {
      case 'all':
        return allJobs;
      case 'recommended':
        return recommendedJobs;
      case 'saved':
        return savedJobs;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <SearchSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          selectedSalary={selectedSalary}
          setSelectedSalary={setSelectedSalary}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
        />
      )}

      {/* Quick Actions */}
      <QuickActions
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        viewMode={viewMode}
        setViewMode={setViewMode}
        resultCount={getResultCount()}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              if (activeSection === 'all') fetchAllJobs(currentPage);
              else if (activeSection === 'recommended') fetchRecommendedJobs();
              else if (activeSection === 'saved') fetchSavedJobs();
            }}
            className="mt-2 text-sm text-destructive hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading jobs...</span>
          </div>
        </div>
      )}

      {/* Job Lists */}
      {!loading && (
        <>
          {activeSection === 'all' && (
            <div className="space-y-6">
              <JobsList jobs={allJobs} viewMode={viewMode} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border border-border rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'recommended' && (
            <RecommendedJobs jobs={recommendedJobs} viewMode={viewMode} />
          )}

          {activeSection === 'saved' && (
            <SavedJobs jobs={savedJobs} viewMode={viewMode} />
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverJobs;
