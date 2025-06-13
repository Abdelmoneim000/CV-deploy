import React, { useState, useCallback } from 'react';
import {
  AiOutlineSearch,
  AiOutlineFilter,
  AiOutlineClose,
} from 'react-icons/ai';
import Button from '@/components/ui/Button';
import { JobFilters } from '@/types/JobBoard';

interface JobFiltersBarProps {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
  selectedJobs: number[];
  onBulkAction: (action: string) => void;
  onClearSelection: () => void;
}

const JobFiltersBar: React.FC<JobFiltersBarProps> = ({
  filters,
  setFilters,
  selectedJobs,
  onBulkAction,
  onClearSelection,
}) => {
  // Local state for search input
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isSearching, setIsSearching] = useState(false);

  // Handle search button click
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      setFilters({ ...filters, search: searchInput.trim(), page: 1 });
    } finally {
      // Add small delay to show loading state
      setTimeout(() => setIsSearching(false), 300);
    }
  }, [filters, searchInput, setFilters]);

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({ ...filters, search: '', page: 1 });
  };

  // Handle filter changes and auto-search
  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  // Check if search has changed from applied filters
  const hasSearchChanged = searchInput.trim() !== filters.search;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Enhanced Search */}
        <div className="flex-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <AiOutlineSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search jobs by title, company, location, skills..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AiOutlineClose size={16} />
                </button>
              )}
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchInput.trim()}
              className="flex items-center gap-2 px-4"
              variant={hasSearchChanged ? 'default' : 'outline'}
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <AiOutlineSearch size={16} />
              )}
              <span className="hidden sm:inline">
                {isSearching ? 'Searching...' : 'Search'}
              </span>
            </Button>
          </div>

          {/* Search suggestions/hints */}
          {searchInput && hasSearchChanged && (
            <div className="mt-2 text-xs text-muted-foreground">
              Press Enter or click Search to apply filters
            </div>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <AiOutlineFilter size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Filters:
            </span>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft </option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden lg:inline">
            Sort by:
          </span>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange({
                sortBy,
                sortOrder: sortOrder as 'asc' | 'desc',
              });
            }}
            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="createdAt-desc">📅 Newest First</option>
            <option value="createdAt-asc">📅 Oldest First</option>
            <option value="title-asc">🔤 Title A-Z</option>
            <option value="title-desc">🔤 Title Z-A</option>
            <option value="applicationCount-desc">👥 Most Applications</option>
            <option value="applicationCount-asc">👥 Least Applications</option>
            <option value="viewCount-desc">👁️ Most Views</option>
            <option value="viewCount-asc">👁️ Least Views</option>
            <option value="updatedAt-desc">⏰ Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.search || filters.status !== 'all') && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange({ search: '' })}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <AiOutlineClose size={12} />
              </button>
            </span>
          )}

          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange({ status: 'all' })}
                className="hover:bg-primary/20 rounded-full p-0.5"
              >
                <AiOutlineClose size={12} />
              </button>
            </span>
          )}

          {(filters.search || filters.status !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchInput('');
                setFilters({
                  ...filters,
                  search: '',
                  status: 'all',
                  page: 1,
                });
              }}
              className="text-xs"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedJobs.length > 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
          <span className="text-sm font-medium">
            {selectedJobs.length} job
            {selectedJobs.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('publish')}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              📤 Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('pause')}
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              ⏸️ Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('close')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🔒 Close
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction('delete')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              🗑️ Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="text-muted-foreground"
            >
              ✕ Clear Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFiltersBar;
