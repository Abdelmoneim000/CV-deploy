import React, { useState } from 'react';
import JobCard, { Job } from '@/components/jobboard/discover/JobCard';
import JobDetailsAside from './JobDetailsAside';
import { AiOutlineHeart } from 'react-icons/ai';

interface SavedJobsProps {
  jobs: Job[];
  viewMode: 'grid' | 'list';
}

const SavedJobs: React.FC<SavedJobsProps> = ({ jobs, viewMode }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsAsideOpen(true);
  };

  const handleCloseAside = () => {
    setIsAsideOpen(false);
    setTimeout(() => {
      if (!isAsideOpen) {
        setSelectedJob(null);
      }
    }, 300);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AiOutlineHeart className="text-red-500 text-xl" />
            <h3 className="text-lg font-semibold">Saved Jobs</h3>
          </div>
          <p className="text-muted-foreground">
            Jobs you've saved for later review
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💝</div>
            <h3 className="text-xl font-semibold mb-2">No saved jobs yet</h3>
            <p className="text-muted-foreground">
              Save jobs you're interested in to review them later
            </p>
          </div>
        ) : (
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
        )}
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

export default SavedJobs;
