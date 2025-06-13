import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineTeam,
  AiOutlineEye,
  AiOutlineEnvironment,
  AiOutlineAlipay,
  AiOutlinePause,
  AiOutlineClose,
  AiOutlineMore,
  AiOutlineBarChart,
  AiOutlineCopy,
  AiOutlineShareAlt,
} from 'react-icons/ai';
import Button from '@/components/ui/Button';
import JobStatusBadge from './JobStatusBadge';
import { Job } from '@/types/JobBoard';

interface JobCardProps {
  job: Job;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onStatusChange: (jobId: number, action: string) => void;
  onDelete: (job: Job) => void;
  onViewDetails: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  isSelected,
  onSelect,
  onStatusChange,
  onDelete,
  onViewDetails,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const formatSalary = (
    min: number | null,
    max: number | null,
    currency: string
  ) => {
    if (!min && !max) return 'Not specified';
    if (min && max)
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `From ${currency} ${min.toLocaleString()}`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return 'Not specified';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const handleCopyJobUrl = () => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(jobUrl);
    setShowMoreMenu(false);
    // You might want to show a toast notification here
  };

  const handleDuplicateJob = () => {
    // Navigate to create job page with pre-filled data
    window.location.href = `/job-board/post?duplicate=${job.id}`;
    setShowMoreMenu(false);
  };

  return (
    <div className="p-6 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Checkbox for bulk selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 rounded"
        />

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold truncate">{job.title}</h3>
                {job.isUrgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                    Urgent
                  </span>
                )}
                {job.isFeatured && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <AiOutlineEnvironment size={14} />
                  {job.location}
                </span>
                <span className="capitalize">{job.workType}</span>
                <span className="capitalize">{job.employmentType}</span>
              </div>
            </div>
            <JobStatusBadge status={job.status} />
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Salary</p>
              <p className="font-medium">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Applications</p>
              <p className="font-medium flex items-center gap-1">
                <AiOutlineTeam size={14} />
                {job.applicationCount}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Views</p>
              <p className="font-medium flex items-center gap-1">
                <AiOutlineEye size={14} />
                {job.viewCount}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-3 text-xs text-muted-foreground">
            <span>Created: {formatDate(job.createdAt)}</span>
            {job.publishedAt && (
              <span className="ml-4">
                Published: {formatDate(job.publishedAt)}
              </span>
            )}
            {job.applicationDeadline && (
              <span className="ml-4">
                Deadline: {formatDate(job.applicationDeadline)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* View Applications */}
          <Link to={`/job-board/jobs/applications/${job.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <AiOutlineTeam size={14} />
              <span className="hidden sm:inline">Applications</span>
            </Button>
          </Link>

          {/* Edit */}
          <Link to={`/job-board/jobs/edit/${job.id}`}>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <AiOutlineEdit size={14} />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </Link>

          {/* Status Actions */}
          {job.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => onStatusChange(job.id, 'publish')}
              className="flex items-center gap-1"
            >
              <AiOutlineAlipay size={14} />
              <span className="hidden sm:inline">Publish</span>
            </Button>
          )}

          {job.status === 'published' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(job.id, 'pause')}
              className="flex items-center gap-1"
            >
              <AiOutlinePause size={14} />
              <span className="hidden sm:inline">Pause</span>
            </Button>
          )}

          {job.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => onStatusChange(job.id, 'publish')}
              className="flex items-center gap-1"
            >
              <AiOutlineAlipay size={14} />
              <span className="hidden sm:inline">Resume</span>
            </Button>
          )}

          {(job.status === 'published' || job.status === 'paused') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(job.id, 'close')}
              className="flex items-center gap-1"
            >
              <AiOutlineClose size={14} />
              <span className="hidden sm:inline">Close</span>
            </Button>
          )}

          {/* Delete (only for draft and closed jobs) - Keep this as direct button */}
          {(job.status === 'draft' || job.status === 'closed') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(job)}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <AiOutlineDelete size={14} />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex items-center gap-1"
            >
              <AiOutlineMore size={14} />
            </Button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <>
                {/* Overlay to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMoreMenu(false)}
                />

                {/* Menu Content */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    {/* View Job Details - Now uses aside */}
                    <button
                      onClick={() => {
                        onViewDetails(job);
                        setShowMoreMenu(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors w-full text-left"
                    >
                      <AiOutlineEye size={16} />
                      <span>View Details</span>
                    </button>

                    {/* Job Analytics */}
                    <Link
                      to={`/job-board/jobs/${job.id}/analytics`}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <AiOutlineBarChart size={16} />
                      <span>View Analytics</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
