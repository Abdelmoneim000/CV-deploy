import React, { useState } from 'react';
import JobCard, { Job } from '@/components/jobboard/discover/JobCard';
import JobDetailsAside from './JobDetailsAside';
import { AiOutlineStar } from 'react-icons/ai';

interface RecommendedJobsProps {
  jobs: Job[];
  viewMode: 'grid' | 'list';
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({
  jobs,
  viewMode,
}) => {
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
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AiOutlineStar className="text-primary text-xl" />
            <h3 className="text-lg font-semibold">Recommended for You</h3>
          </div>
          <p className="text-muted-foreground">
            Jobs matched to your profile and preferences
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">
              No recommendations yet
            </h3>
            <p className="text-muted-foreground">
              Complete your profile to get personalized job recommendations
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
              <div key={job.id} className="relative">
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full z-10">
                  Recommended
                </div>
                <JobCard job={job} onJobClick={handleJobClick} />
              </div>
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

export default RecommendedJobs;
