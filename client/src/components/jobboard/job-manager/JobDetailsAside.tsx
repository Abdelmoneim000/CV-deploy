import React, { useState, useEffect } from 'react';
import {
  AiOutlineClose,
  AiOutlineEye,
  AiOutlineEnvironment,
  AiOutlineDollar,
  AiOutlineClockCircle,
  AiOutlineTeam,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineBarChart,
  AiOutlineFlag,
} from 'react-icons/ai';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import JobStatusBadge from './JobStatusBadge';
import { Job } from '@/types/JobBoard';

interface JobDetailsAsideProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (jobId: number, action: string) => void;
  onDelete: (job: Job) => void;
}

const JobDetailsAside: React.FC<JobDetailsAsideProps> = ({
  job,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  if (!job) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 min-h-screen ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* Aside Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <h2 className="text-lg font-semibold">Job Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <AiOutlineClose size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Job Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">{job.title}</h1>
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
                    <p className="text-lg text-muted-foreground mb-3">
                      {job.companyName}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <AiOutlineEnvironment size={16} />
                        {job.location}
                      </span>
                      <span className="capitalize">{job.workType}</span>
                      <span className="capitalize">{job.employmentType}</span>
                    </div>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>

                {/* Salary */}
                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-center gap-2">
                    <AiOutlineDollar className="text-green-600" size={20} />
                    <span className="text-xl font-semibold text-green-600">
                      {formatSalary(
                        job.salaryMin,
                        job.salaryMax,
                        job.salaryCurrency
                      )}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    to={`/job-board/jobs/${job.id}/edit`}
                    className="flex-1"
                  >
                    <Button className="w-full flex items-center justify-center gap-2">
                      <AiOutlineEdit size={16} />
                      Edit Job
                    </Button>
                  </Link>
                  <Link to={`/job-board/jobs/${job.id}/applications`}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <AiOutlineTeam size={16} />
                      Applications
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Job Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AiOutlineTeam className="text-blue-500" size={18} />
                    <span className="font-medium">Applications</span>
                  </div>
                  <p className="text-2xl font-bold">{job.applicationCount}</p>
                  <p className="text-sm text-muted-foreground">
                    candidates applied
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AiOutlineEye className="text-green-500" size={18} />
                    <span className="font-medium">Views</span>
                  </div>
                  <p className="text-2xl font-bold">{job.viewCount}</p>
                  <p className="text-sm text-muted-foreground">total views</p>
                </div>
              </div>

              {/* Job Dates */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Job Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(job.createdAt)}</span>
                  </div>
                  {job.publishedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Published:</span>
                      <span>{formatDate(job.publishedAt)}</span>
                    </div>
                  )}
                  {job.applicationDeadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{formatDate(job.applicationDeadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{formatDate(job.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h3 className="font-semibold mb-3">Job Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {job.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Required Skills */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              {job.preferredSkills && job.preferredSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Preferred Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold">Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {/* Status Actions */}
                  {job.status === 'draft' && (
                    <Button
                      onClick={() => onStatusChange(job.id, 'publish')}
                      className="w-full justify-start"
                    >
                      <AiOutlineFlag size={16} className="mr-2" />
                      Publish Job
                    </Button>
                  )}

                  {job.status === 'published' && (
                    <Button
                      variant="outline"
                      onClick={() => onStatusChange(job.id, 'pause')}
                      className="w-full justify-start"
                    >
                      <AiOutlineClockCircle size={16} className="mr-2" />
                      Pause Job
                    </Button>
                  )}

                  {job.status === 'paused' && (
                    <Button
                      onClick={() => onStatusChange(job.id, 'publish')}
                      className="w-full justify-start"
                    >
                      <AiOutlineFlag size={16} className="mr-2" />
                      Resume Job
                    </Button>
                  )}

                  {(job.status === 'published' || job.status === 'paused') && (
                    <Button
                      variant="outline"
                      onClick={() => onStatusChange(job.id, 'close')}
                      className="w-full justify-start"
                    >
                      <AiOutlineClose size={16} className="mr-2" />
                      Close Job
                    </Button>
                  )}

                  {/* Analytics */}
                  <Link to={`/job-board/jobs/${job.id}/analytics`}>
                    <Button variant="outline" className="w-full justify-start">
                      <AiOutlineBarChart size={16} className="mr-2" />
                      View Analytics
                    </Button>
                  </Link>

                  {/* Delete (only for draft and closed jobs) */}
                  {(job.status === 'draft' || job.status === 'closed') && (
                    <Button
                      variant="outline"
                      onClick={() => onDelete(job)}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <AiOutlineDelete size={16} className="mr-2" />
                      Delete Job
                    </Button>
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Company Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span>{job.companyName}</span>
                  </div>
                  {job.companyWebsite && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Website:</span>
                      <a
                        href={job.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {job.companyWebsite}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobDetailsAside;
