import React from 'react';
import { JobFormData } from './PostJob';
import {
  AiOutlineArrowLeft,
  AiOutlineArrowRight,
  AiOutlineEdit,
  AiOutlineGlobal,
  AiOutlineHome,
  AiOutlineTeam,
  AiOutlineLock,
  AiOutlineCalendar,
  AiOutlineUser,
} from 'react-icons/ai';
import Button from '@/components/ui/Button';

interface JobPreviewProps {
  jobData: JobFormData;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

const JobPreview: React.FC<JobPreviewProps> = ({
  jobData,
  onBack,
  onNext,
  isLoading,
}) => {
  // Helper function to format salary
  const formatSalary = () => {
    if (!jobData.showSalary || (!jobData.salaryMin && !jobData.salaryMax)) {
      return null;
    }

    const currency =
      jobData.salaryCurrency === 'USD'
        ? '$'
        : jobData.salaryCurrency === 'EUR'
        ? '€'
        : jobData.salaryCurrency === 'GBP'
        ? '£'
        : jobData.salaryCurrency;

    const period =
      jobData.salaryPeriod === 'yearly'
        ? '/year'
        : jobData.salaryPeriod === 'monthly'
        ? '/month'
        : '/hour';

    if (jobData.salaryMin && jobData.salaryMax) {
      return `${currency}${jobData.salaryMin.toLocaleString()} - ${currency}${jobData.salaryMax.toLocaleString()}${period}`;
    } else if (jobData.salaryMin) {
      return `From ${currency}${jobData.salaryMin.toLocaleString()}${period}`;
    } else if (jobData.salaryMax) {
      return `Up to ${currency}${jobData.salaryMax.toLocaleString()}${period}`;
    }

    return null;
  };

  // Helper function to get work type icon
  const getWorkTypeIcon = () => {
    switch (jobData.workType) {
      case 'remote':
        return <AiOutlineGlobal size={16} />;
      case 'hybrid':
        return <AiOutlineTeam size={16} />;
      case 'onsite':
        return <AiOutlineHome size={16} />;
      default:
        return <AiOutlineHome size={16} />;
    }
  };

  // Helper function to format work type
  const formatWorkType = () => {
    return jobData.workType.charAt(0).toUpperCase() + jobData.workType.slice(1);
  };

  // Helper function to format employment type
  const formatEmploymentType = () => {
    return jobData.employmentType
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  // Helper function to format experience level
  const formatExperienceLevel = () => {
    return (
      jobData.experienceLevel.charAt(0).toUpperCase() +
      jobData.experienceLevel.slice(1) +
      ' Level'
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Job Preview</h3>
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <AiOutlineEdit size={14} />
            Edit
          </Button>
        </div>
        <p className="text-muted-foreground">
          Review how your job posting will appear to candidates
        </p>
      </div>

      {/* Job Preview Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Job Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {jobData.isUrgent && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    URGENT
                  </span>
                )}
                {jobData.isFeatured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                    FEATURED
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold mb-2">{jobData.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-3">
                <span className="font-medium text-foreground">
                  {jobData.companyName}
                </span>
                <span>•</span>
                <span>{jobData.location}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {getWorkTypeIcon()}
                  <span>{formatWorkType()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {formatEmploymentType()}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                  {formatExperienceLevel()}
                </span>
              </div>
            </div>

            <div className="text-right ml-4">
              {formatSalary() && (
                <div className="text-lg font-semibold text-green-600 mb-1">
                  {formatSalary()}
                  {jobData.salaryNegotiable && (
                    <span className="text-sm text-muted-foreground block">
                      Negotiable
                    </span>
                  )}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Posted just now
              </div>
            </div>
          </div>

          {/* Company Info */}
          {jobData.companyWebsite && (
            <div className="mb-4">
              <a
                href={jobData.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Visit Company Website →
              </a>
            </div>
          )}

          {/* Required Skills */}
          {jobData.requiredSkills.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {jobData.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Skills */}
          {jobData.preferredSkills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Preferred Skills</h4>
              <div className="flex flex-wrap gap-2">
                {jobData.preferredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-muted text-muted-foreground rounded text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold mb-3">Job Description</h3>
          {jobData.shortDescription && (
            <div className="mb-4 p-3 bg-muted/50 rounded border-l-4 border-primary">
              <p className="text-sm font-medium">{jobData.shortDescription}</p>
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            {jobData.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold mb-4">Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education & Experience */}
            <div className="space-y-3">
              {jobData.requiredEducation && (
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-1">🎓</span>
                  <div>
                    <div className="font-medium text-sm">Education</div>
                    <div className="text-sm text-muted-foreground">
                      {jobData.requiredEducation}
                    </div>
                  </div>
                </div>
              )}

              {jobData.requiredExperience !== null && (
                <div className="flex items-start gap-2">
                  <AiOutlineLock className="text-primary mt-1" size={16} />
                  <div>
                    <div className="font-medium text-sm">Experience</div>
                    <div className="text-sm text-muted-foreground">
                      {jobData.requiredExperience} years required
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Languages */}
            {jobData.languages.length > 0 && (
              <div>
                <div className="font-medium text-sm mb-2">Languages</div>
                <div className="space-y-2">
                  {jobData.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{lang.language}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground capitalize">
                          {lang.level}
                        </span>
                        {lang.required && (
                          <span className="px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits & Perks */}
        {(jobData.benefits.length > 0 || jobData.perks.length > 0) && (
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold mb-4">Benefits & Perks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Benefits */}
              {jobData.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Benefits</h4>
                  <ul className="space-y-2">
                    {jobData.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Perks */}
              {jobData.perks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Perks</h4>
                  <ul className="space-y-2">
                    {jobData.perks.map((perk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">🎉</span>
                        <span className="text-sm">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application Details */}
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold mb-4">
            Application Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobData.applicationDeadline && (
              <div className="flex items-start gap-2">
                <AiOutlineCalendar className="text-primary mt-1" size={16} />
                <div>
                  <div className="font-medium text-sm">
                    Application Deadline
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(jobData.applicationDeadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {jobData.startDate && (
              <div className="flex items-start gap-2">
                <AiOutlineUser className="text-primary mt-1" size={16} />
                <div>
                  <div className="font-medium text-sm">Expected Start Date</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(jobData.startDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {jobData.applicationInstructions && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-sm mb-2">
                Application Instructions
              </h4>
              <p className="text-sm text-muted-foreground">
                {jobData.applicationInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Apply Section Preview */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button size="lg" className="px-8">
              Apply Now
            </Button>
            <Button variant="outline" size="lg">
              Save Job
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Candidates will be able to apply directly through our platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <AiOutlineArrowLeft size={16} />
          Back to Form
        </Button>

        <Button
          onClick={onNext}
          disabled={isLoading}
          className="flex items-center gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              Loading...
            </>
          ) : (
            <>
              Continue to Publish
              <AiOutlineArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default JobPreview;
