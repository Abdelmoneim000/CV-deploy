import React, { useState } from 'react';
import JobPostingForm from './JobPostingForm';
import JobPreview from './JobPreview';
import PublishingOptions from './PublishingOptions';
import {
  AiOutlineEye,
  AiOutlineEdit,
  AiOutlineRocket,
  AiOutlineArrowLeft,
} from 'react-icons/ai';
import Button from '@/components/ui/Button';

export interface JobFormData {
  // Basic Information
  title: string;
  description: string;
  shortDescription: string;
  companyName: string;
  companyLogo: string;
  companyWebsite: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite';
  country: string;
  city: string;
  categoryId: number | null;
  employmentType:
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'freelance'
    | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

  // Salary Information
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: 'hourly' | 'monthly' | 'yearly';
  salaryNegotiable: boolean;
  showSalary: boolean;

  // Skills and Requirements
  requiredSkills: string[];
  preferredSkills: string[];
  requiredEducation: string;
  requiredExperience: number | null;
  languages: Array<{
    language: string;
    level: 'basic' | 'intermediate' | 'advanced' | 'native';
    required: boolean;
  }>;

  // Benefits and Perks
  benefits: string[];
  perks: string[];

  // Application Details
  applicationDeadline: string;
  startDate: string;
  applicationInstructions: string;

  // Job Settings
  isUrgent: boolean;
  isFeatured: boolean;
  tags: string[];

  // Publishing Options (from PublishingOptions component)
  visibility: 'public' | 'private' | 'draft';
  promotionType: 'standard' | 'featured' | 'premium';
}

const PostJob: React.FC = () => {
  const [step, setStep] = useState<'form' | 'preview' | 'publish'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<JobFormData>({
    // Basic Information
    title: '',
    description: '',
    shortDescription: '',
    companyName: '',
    companyLogo: '',
    companyWebsite: '',
    location: '',
    workType: 'onsite',
    country: '',
    city: '',
    categoryId: null,
    employmentType: 'full-time',
    experienceLevel: 'mid',

    // Salary Information
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'USD',
    salaryPeriod: 'yearly',
    salaryNegotiable: false,
    showSalary: true,

    // Skills and Requirements
    requiredSkills: [],
    preferredSkills: [],
    requiredEducation: '',
    requiredExperience: null,
    languages: [],

    // Benefits and Perks
    benefits: [],
    perks: [],

    // Application Details
    applicationDeadline: '',
    startDate: '',
    applicationInstructions: '',

    // Job Settings
    isUrgent: false,
    isFeatured: false,
    tags: [],

    // Publishing Options
    visibility: 'draft',
    promotionType: 'standard',
  });

  const steps = [
    {
      id: 'form',
      label: 'Create Job',
      icon: <AiOutlineEdit size={16} />,
      description: 'Job details and requirements',
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: <AiOutlineEye size={16} />,
      description: 'Review your job posting',
    },
    {
      id: 'publish',
      label: 'Publish',
      icon: <AiOutlineRocket size={16} />,
      description: 'Choose publishing options',
    },
  ];

  // Handle step navigation
  const handleStepClick = (stepId: 'form' | 'preview' | 'publish') => {
    // Only allow navigation to previous steps or if current step is valid
    const currentStepIndex = steps.findIndex((s) => s.id === step);
    const targetStepIndex = steps.findIndex((s) => s.id === stepId);

    if (targetStepIndex <= currentStepIndex || isStepValid(step)) {
      setStep(stepId);
    }
  };

  // Validate if current step can be progressed
  const isStepValid = (currentStep: string): boolean => {
    switch (currentStep) {
      case 'form':
        return !!(
          jobData.title.trim() &&
          jobData.description.trim() &&
          jobData.companyName.trim() &&
          jobData.location.trim() &&
          jobData.requiredSkills.length > 0
        );
      case 'preview':
        return true; // Preview is always valid if we reached it
      case 'publish':
        return true; // Publish step doesn't need validation to navigate away
      default:
        return false;
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (step === 'form' && isStepValid('form')) {
      setStep('preview');
    } else if (step === 'preview') {
      setStep('publish');
    }
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('form');
    } else if (step === 'publish') {
      setStep('preview');
    }
  };

  // Get step status for styling
  const getStepStatus = (stepId: string) => {
    const currentStepIndex = steps.findIndex((s) => s.id === step);
    const stepIndex = steps.findIndex((s) => s.id === stepId);

    if (stepIndex < currentStepIndex) {
      return 'completed';
    } else if (stepIndex === currentStepIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  // Check if step is clickable
  const isStepClickable = (stepId: string) => {
    const currentStepIndex = steps.findIndex((s) => s.id === step);
    const stepIndex = steps.findIndex((s) => s.id === stepId);

    // Always allow going back to previous steps
    if (stepIndex <= currentStepIndex) {
      return true;
    }

    // Allow going forward only if current step is valid
    return stepIndex === currentStepIndex + 1 && isStepValid(step);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Post a New Job</h2>
            <p className="text-muted-foreground">
              Reach thousands of qualified candidates
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Step Indicator */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          {steps.map((stepItem, index) => {
            const status = getStepStatus(stepItem.id);
            const isClickable = isStepClickable(stepItem.id);

            return (
              <React.Fragment key={stepItem.id}>
                {/* Step */}
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() =>
                      isClickable && handleStepClick(stepItem.id as any)
                    }
                    disabled={!isClickable}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      status === 'current'
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110'
                        : status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white hover:scale-105'
                        : 'bg-muted border-border text-muted-foreground'
                    } ${
                      isClickable
                        ? 'cursor-pointer hover:border-primary'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    {status === 'completed' ? (
                      <span className="text-sm font-bold">✓</span>
                    ) : (
                      stepItem.icon
                    )}
                  </button>

                  <div className="mt-3 text-center">
                    <div
                      className={`text-sm font-medium ${
                        status === 'current'
                          ? 'text-primary'
                          : status === 'completed'
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {stepItem.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {stepItem.description}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-0.5 transition-colors duration-200 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-border'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content with Back Button */}
      <div className="space-y-6">
        {/* Step Back Button (only show if not on first step) */}
        {step !== 'form' && (
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <AiOutlineArrowLeft size={16} />
              Back to {step === 'preview' ? 'Form' : 'Preview'}
            </Button>
          </div>
        )}

        {/* Step Content */}
        {step === 'form' && (
          <JobPostingForm
            jobData={jobData}
            setJobData={setJobData}
            onNext={handleNext}
            isLoading={isLoading}
          />
        )}

        {step === 'preview' && (
          <JobPreview
            jobData={jobData}
            onBack={handleBack}
            onNext={handleNext}
            isLoading={isLoading}
          />
        )}

        {step === 'publish' && (
          <PublishingOptions
            jobData={jobData}
            setJobData={setJobData}
            onBack={handleBack}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-6 right-6 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="text-xs text-muted-foreground mb-1">Progress</div>
        <div className="flex items-center gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= steps.findIndex((s) => s.id === step)
                  ? 'bg-primary'
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {steps.findIndex((s) => s.id === step) + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
};

export default PostJob;
