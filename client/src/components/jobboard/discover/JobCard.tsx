import React, { useState, useEffect } from 'react';
import {
  AiOutlineHeart,
  AiOutlineEye,
  AiFillHeart,
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineCheck,
} from 'react-icons/ai';
import JobApplicationModal from '../JobApplicationModal';
import { jobApplicationService } from '../../../services/jobApplicationService';

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  description: string;
  skills: string[];
  applications: number;
  views: number;
  saved: boolean;
  hasApplied?: boolean;
  applicationId?: string;
}

interface JobCardProps {
  job: Job;
  onJobClick?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onJobClick }) => {
  const [isSaved, setIsSaved] = useState(job.saved);
  const [hasApplied, setHasApplied] = useState(job.hasApplied || false);
  const [applicationId, setApplicationId] = useState<string | null>(
    job.applicationId || null
  );
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);

  useEffect(() => {
    // Check application status when component mounts if not already applied
    if (!job.hasApplied && !hasApplied) {
      checkApplicationStatus();
    }
  }, [job.id]);

  const checkApplicationStatus = async () => {
    setIsCheckingApplication(true);
    try {
      const response = await jobApplicationService.checkApplicationStatus(
        job.id
      );
      if (response.success) {
        setHasApplied(response.data.hasApplied);
        setApplicationId(response.data.applicationId || null);
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    } finally {
      setIsCheckingApplication(false);
    }
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    // TODO: Implement save/unsave job API call
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasApplied) {
      console.log(
        'Already applied for job:',
        job.id,
        'Application ID:',
        applicationId
      );
      // Optionally show application details or allow withdrawal
      return;
    }

    // Open application modal
    setIsApplicationModalOpen(true);
  };

  const handleApplicationSubmitted = (newApplicationId: string) => {
    setHasApplied(true);
    setApplicationId(newApplicationId);
    setIsApplicationModalOpen(false);

    // Update the job object in parent component if needed
    // This could trigger a refresh of the job list
  };

  const handleCardClick = () => {
    onJobClick?.(job);
  };

  return (
    <>
      <div
        className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer hover:border-primary/20"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
              {job.logo}
            </div>
            <div>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-muted-foreground">{job.company}</p>
            </div>
          </div>
          <button
            onClick={toggleSave}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isSaved ? (
              <AiFillHeart className="text-red-500" size={20} />
            ) : (
              <AiOutlineHeart className="text-muted-foreground" size={20} />
            )}
          </button>
        </div>

        {/* Job Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{job.location}</span>
            <span>•</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded">
              {job.type}
            </span>
          </div>

          {job.salary && (
            <div className="text-lg font-semibold text-green-600">
              {job.salary}
            </div>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        </div>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                +{job.skills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <AiOutlineCalendar size={14} />
              <span>{job.posted}</span>
            </div>
            <div className="flex items-center gap-1">
              <AiOutlineUser size={14} />
              <span>{job.applications} applications</span>
            </div>
            <div className="flex items-center gap-1">
              <AiOutlineEye size={14} />
              <span>{job.views} views</span>
            </div>
          </div>

          <button
            onClick={handleApplyClick}
            disabled={hasApplied || isCheckingApplication}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
              hasApplied
                ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                : isCheckingApplication
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {hasApplied && <AiOutlineCheck size={16} />}
            {isCheckingApplication
              ? 'Checking...'
              : hasApplied
              ? 'Applied'
              : 'Apply Now'}
          </button>
        </div>
      </div>

      {/* Job Application Modal */}
      <JobApplicationModal
        job={job}
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </>
  );
};

export default JobCard;
