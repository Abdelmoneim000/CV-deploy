import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineFileText } from 'react-icons/ai';
import Button from '@/components/ui/Button';
import { JobFilters } from '@/types/JobBoard';

interface JobEmptyStateProps {
  filters: JobFilters;
}

const JobEmptyState: React.FC<JobEmptyStateProps> = ({ filters }) => {
  const hasFilters = filters.search || filters.status !== 'all';

  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
        <AiOutlineFileText size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
      <p className="text-muted-foreground mb-4">
        {hasFilters
          ? 'Try adjusting your filters or search terms'
          : 'Get started by posting your first job'}
      </p>
      {!hasFilters && (
        <Link to="/job-board/post">
          <Button>Post Your First Job</Button>
        </Link>
      )}
    </div>
  );
};

export default JobEmptyState;
