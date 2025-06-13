import React from 'react';
import Button from '@/components/ui/Button';
import { Pagination, JobFilters } from '@/types/JobBoard';

interface JobPaginationProps {
  pagination: Pagination;
  filters: JobFilters;
  onPageChange: (page: number) => void;
}

const JobPagination: React.FC<JobPaginationProps> = ({
  pagination,
  filters,
  onPageChange,
}) => {
  if (pagination.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {(pagination.currentPage - 1) * filters.limit + 1} to{' '}
        {Math.min(pagination.currentPage * filters.limit, pagination.total)} of{' '}
        {pagination.total} jobs
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.currentPage === 1}
          onClick={() => onPageChange(pagination.currentPage - 1)}
        >
          Previous
        </Button>
        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
          const page = i + 1;
          return (
            <Button
              key={page}
              variant={page === pagination.currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.currentPage === pagination.pages}
          onClick={() => onPageChange(pagination.currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default JobPagination;
