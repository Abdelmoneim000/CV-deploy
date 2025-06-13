import React, { useState } from 'react';
import JobCard, { Job } from './JobCard';
import JobDetailsAside from './JobDetailsAside';

interface JobsListProps {
  jobs: Job[];
  viewMode: 'grid' | 'list';
}

const JobsList: React.FC<JobsListProps> = ({ jobs, viewMode }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsAsideOpen(true);
  };

  const handleCloseAside = () => {
    setIsAsideOpen(false);
    // Optional: Clear selected job after animation completes
    setTimeout(() => {
      if (!isAsideOpen) {
        setSelectedJob(null);
      }
    }, 300);
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div
          className={`${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}
        >
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onJobClick={handleJobClick} />
          ))}
        </div>
      </div>

      {/* Job Details Aside */}
      <JobDetailsAside
        job={selectedJob}
        isOpen={isAsideOpen}
        onClose={handleCloseAside}
      />
    </>
  );
};

export default JobsList;
