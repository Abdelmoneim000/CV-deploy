import React, { useState, useEffect } from 'react';
import {
  AiOutlineClose,
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineEye,
  AiOutlineUser,
  AiOutlineCalendar,
  AiOutlineEnvironment,
  AiOutlineDollar,
  AiOutlineClockCircle,
  AiOutlineTeam,
  AiOutlineFlag,
  AiOutlineCheck,
} from 'react-icons/ai';
import { Job } from './JobCard';
import JobApplicationModal from '../JobApplicationModal';
import { jobApplicationService } from '../../../services/jobApplicationService';

interface JobDetailsAsideProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

const JobDetailsAside: React.FC<JobDetailsAsideProps> = ({
  job,
  isOpen,
  onClose,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);

  useEffect(() => {
    if (job) {
      setIsSaved(job.saved);
      setHasApplied(job.hasApplied || false);
      setApplicationId(job.applicationId || null);

      // Check application status if not already set
      if (!job.hasApplied) {
        checkApplicationStatus();
      }
    }
  }, [job]);

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

  const checkApplicationStatus = async () => {
    if (!job) return;

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

  const toggleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleApply = () => {
    if (hasApplied) {
      // Optionally show application details or allow withdrawal
      console.log('Already applied with ID:', applicationId);
      return;
    }
    setIsApplicationModalOpen(true);
  };

  const handleApplicationSubmitted = (newApplicationId: string) => {
    setHasApplied(true);
    setApplicationId(newApplicationId);
    // Optionally update the job object or refresh data
  };

  const handleWithdrawApplication = async () => {
    if (!applicationId) return;

    try {
      const response = await jobApplicationService.withdrawApplication(
        applicationId
      );
      if (response.success) {
        setHasApplied(false);
        setApplicationId(null);
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error);
    }
  };

  if (!job) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 h-screen ${
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
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold mb-2 leading-tight">
                      {job.title}
                    </h1>
                    <p className="text-lg text-muted-foreground mb-1">
                      {job.company}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AiOutlineEnvironment size={16} />
                      <span>{job.location}</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                        {job.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Salary and Stats */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {job.salary && (
                      <div className="flex items-center gap-2">
                        <AiOutlineDollar className="text-green-600" size={20} />
                        <span className="text-xl font-semibold text-green-600">
                          {job.salary}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <AiOutlineCalendar size={16} />
                      <span>{job.posted}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AiOutlineEye size={16} />
                      <span>{job.views}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {hasApplied ? (
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 px-6 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-center gap-2 font-medium">
                        <AiOutlineCheck size={20} />
                        Applied
                      </div>
                      <button
                        onClick={handleWithdrawApplication}
                        className="px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                      >
                        Withdraw
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isCheckingApplication}
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                    >
                      {isCheckingApplication ? 'Checking...' : 'Apply Now'}
                    </button>
                  )}
                  <button
                    onClick={toggleSave}
                    className={`px-4 py-3 border rounded-lg transition-colors ${
                      isSaved
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {isSaved ? (
                      <AiFillHeart size={20} />
                    ) : (
                      <AiOutlineHeart size={20} />
                    )}
                  </button>
                  <button className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors">
                    <AiOutlineFlag size={20} />
                  </button>
                </div>
              </div>

              {/* Job Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AiOutlineUser className="text-blue-500" size={18} />
                    <span className="font-medium">Applications</span>
                  </div>
                  <p className="text-2xl font-bold">{job.applications}</p>
                  <p className="text-sm text-muted-foreground">
                    candidates applied
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AiOutlineClockCircle
                      className="text-green-500"
                      size={18}
                    />
                    <span className="font-medium">Response Time</span>
                  </div>
                  <p className="text-2xl font-bold">2-3</p>
                  <p className="text-sm text-muted-foreground">days average</p>
                </div>
              </div>

              {/* Skills */}
              {job.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
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

              {/* Job Description */}
              <div>
                <h3 className="font-semibold mb-3">Job Description</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {job.description}
                  </p>

                  {/* Extended Description */}
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">What You'll Do:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • Develop and maintain high-quality web applications
                        </li>
                        <li>
                          • Collaborate with cross-functional teams to deliver
                          features
                        </li>
                        <li>
                          • Write clean, maintainable, and well-documented code
                        </li>
                        <li>
                          • Participate in code reviews and technical
                          discussions
                        </li>
                        <li>
                          • Stay up-to-date with the latest industry trends
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Requirements:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • 5+ years of experience in frontend development
                        </li>
                        <li>• Strong proficiency in React and TypeScript</li>
                        <li>• Experience with modern development tools</li>
                        <li>• Excellent problem-solving skills</li>
                        <li>• Strong communication and teamwork abilities</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Benefits:</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Competitive salary and equity package</li>
                        <li>• Health, dental, and vision insurance</li>
                        <li>• Flexible work arrangements</li>
                        <li>• Professional development opportunities</li>
                        <li>• Modern office space with great amenities</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-3">About {job.company}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-xl">
                      {job.logo}
                    </div>
                    <div>
                      <p className="font-medium">{job.company}</p>
                      <p className="text-sm text-muted-foreground">
                        Technology • 50-200 employees
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We're a fast-growing technology company focused on building
                    innovative solutions that help businesses scale. Our team is
                    passionate about creating products that make a real
                    difference in people's lives.
                  </p>
                  <div className="flex gap-2">
                    <button className="text-sm text-primary hover:underline">
                      View Company Profile
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button className="text-sm text-primary hover:underline">
                      See All Jobs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

export default JobDetailsAside;
