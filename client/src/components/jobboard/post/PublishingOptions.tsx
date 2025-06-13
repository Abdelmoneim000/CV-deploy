import React, { useState } from 'react';
import { JobFormData } from './PostJob';
import {
  AiOutlineRocket,
  AiOutlineEye,
  AiOutlineGlobal,
  AiOutlineArrowLeft,
} from 'react-icons/ai';
import Button from '@/components/ui/Button';
import useAuth from '@/hooks/useAuth';
import { toast } from 'react-toastify';

interface PublishingOptionsProps {
  jobData: JobFormData;
  setJobData: (data: JobFormData) => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PublishingOptions: React.FC<PublishingOptionsProps> = ({
  jobData,
  setJobData,
  onBack,
  isLoading,
  setIsLoading,
}) => {
  const { user, tokens } = useAuth();
  const [publishError, setPublishError] = useState<string | null>(null);

  const updateField = (field: keyof JobFormData, value: any) => {
    setJobData({ ...jobData, [field]: value });
  };

  const handlePublish = async () => {
    setIsLoading(true);
    setPublishError(null);

    try {
      const jobPayload = {
        hrUserId: user?.id,
        title: jobData.title,
        description: jobData.description,
        shortDescription:
          jobData.shortDescription || jobData.description.substring(0, 160),
        companyName: jobData.companyName,
        companyLogo: jobData.companyLogo,
        companyWebsite: jobData.companyWebsite,
        location: jobData.location,
        workType: jobData.workType,
        country: jobData.country,
        city: jobData.city,
        categoryId: jobData.categoryId,
        employmentType: jobData.employmentType,
        experienceLevel: jobData.experienceLevel,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        salaryCurrency: jobData.salaryCurrency,
        salaryPeriod: jobData.salaryPeriod,
        salaryNegotiable: jobData.salaryNegotiable,
        showSalary: jobData.showSalary,
        requiredSkills: jobData.requiredSkills,
        preferredSkills: jobData.preferredSkills,
        requiredEducation: jobData.requiredEducation,
        requiredExperience: jobData.requiredExperience,
        languages: jobData.languages,
        benefits: jobData.benefits,
        perks: jobData.perks,
        applicationDeadline: jobData.applicationDeadline
          ? new Date(jobData.applicationDeadline).toISOString()
          : undefined,
        startDate: jobData.startDate
          ? new Date(jobData.startDate).toISOString()
          : undefined,
        applicationInstructions: jobData.applicationInstructions,
        isUrgent: jobData.isUrgent,
        isFeatured: jobData.isFeatured,
        tags: jobData.tags,
        // Set status based on visibility selection
        status: jobData.visibility === 'public' ? 'published' : 'draft',
      };

      // Create job posting
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job posting');
      }

      const result = await response.json();

      // If visibility is not draft, publish the job
      if (jobData.visibility !== 'draft' && result.data.id) {
        const publishResponse = await fetch(
          `/api/jobs/${result.data.id}/status`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${tokens?.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'publish',
              reason: 'Job posting completed',
            }),
          }
        );

        if (!publishResponse.ok) {
          console.warn('Job created but failed to publish');
        }
      }

      // Show success message and redirect
      if (jobData.visibility === 'draft') {
        toast.success('Job saved as draft successfully!');
      } else {
        toast.success('Job published successfully!');
      }

      // Redirect to job management page or job listing
      window.location.href = '/job-board/discover';
    } catch (error: any) {
      console.error('Failed to publish job:', error);
      setPublishError(error.message || 'Failed to publish job posting');
    } finally {
      setIsLoading(false);
    }
  };

  const promotionOptions = [
    {
      id: 'standard',
      name: 'Standard',
      price: 'Free',
      features: ['Basic job listing', 'Search visibility', 'Standard support'],
      icon: '📝',
    },
    {
      id: 'featured',
      name: 'Featured',
      price: '$49/month',
      features: [
        'Priority placement',
        'Highlighted listing',
        'Analytics dashboard',
      ],
      icon: '⭐',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$99/month',
      features: [
        'Top placement',
        'Social media promotion',
        'Dedicated support',
        'AI matching',
      ],
      icon: '🚀',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Publishing Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AiOutlineRocket className="text-primary text-2xl" />
          <div>
            <h3 className="text-xl font-bold">Ready to Publish</h3>
            <p className="text-muted-foreground">
              Configure your job posting settings
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {publishError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error Publishing Job</div>
          <div className="text-red-700 text-sm mt-1">{publishError}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publishing Settings */}
        <div className="space-y-6">
          {/* Visibility */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AiOutlineEye size={20} />
              Visibility
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="public"
                  checked={jobData.visibility === 'public'}
                  onChange={(e) =>
                    updateField('visibility', e.target.value as any)
                  }
                  className="text-primary"
                />
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-sm text-muted-foreground">
                    Visible to all job seekers
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="private"
                  checked={jobData.visibility === 'private'}
                  onChange={(e) =>
                    updateField('visibility', e.target.value as any)
                  }
                  className="text-primary"
                />
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-sm text-muted-foreground">
                    Only visible via direct link
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="draft"
                  checked={jobData.visibility === 'draft'}
                  onChange={(e) =>
                    updateField('visibility', e.target.value as any)
                  }
                  className="text-primary"
                />
                <div>
                  <div className="font-medium">Save as Draft</div>
                  <div className="text-sm text-muted-foreground">
                    Save without publishing
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Promotion Options */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Promotion Options</h4>
            <div className="space-y-3">
              {promotionOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    jobData.promotionType === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.id}
                    checked={jobData.promotionType === option.id}
                    onChange={(e) =>
                      updateField('promotionType', e.target.value as any)
                    }
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{option.name}</span>
                        <span className="font-bold text-primary">
                          {option.price}
                        </span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {option.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <span className="text-green-500">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Estimated Reach */}
        <div className="bg-gradient-to-r from-blue-500/10 to-primary/10 border border-blue-500/20 rounded-lg p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <AiOutlineGlobal size={20} />
            Estimated Reach
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">2,500+</div>
              <div className="text-sm text-muted-foreground">
                Potential Views
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">180+</div>
              <div className="text-sm text-muted-foreground">
                Expected Applications
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45+</div>
              <div className="text-sm text-muted-foreground">
                Qualified Candidates
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">12+</div>
              <div className="text-sm text-muted-foreground">
                Perfect Matches
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <AiOutlineArrowLeft size={16} />
          Back to Preview
        </Button>

        <Button
          onClick={handlePublish}
          disabled={isLoading}
          className="flex items-center gap-2 px-8 py-3"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              {jobData.visibility === 'draft' ? 'Saving...' : 'Publishing...'}
            </>
          ) : (
            <>
              <AiOutlineRocket size={20} />
              {jobData.visibility === 'draft' ? 'Save as Draft' : 'Publish Job'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PublishingOptions;
