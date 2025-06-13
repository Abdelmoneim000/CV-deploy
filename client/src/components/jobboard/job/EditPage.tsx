import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AiOutlineArrowLeft,
  AiOutlineSave,
  AiOutlineEye,
  AiOutlinePlus,
  AiOutlineClose,
  AiOutlineLoading3Quarters,
} from 'react-icons/ai';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import useAuth from '@/hooks/useAuth';

// Extended Job interface to include all possible properties
interface ExtendedJob {
  id: number;
  title: string;
  description: string;
  shortDescription?: string;
  companyName: string;
  companyLogo?: string;
  companyWebsite?: string;
  location: string;
  workType: 'onsite' | 'remote' | 'hybrid';
  country?: string;
  city?: string;
  categoryId?: number | null;
  employmentType:
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'freelance'
    | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  status: string;
  createdAt: string;
  updatedAt: string;

  // Salary Information
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: 'hourly' | 'monthly' | 'yearly';
  salaryNegotiable?: boolean;
  showSalary?: boolean;

  // Skills and Requirements
  requiredSkills?: string[];
  preferredSkills?: string[];
  requiredEducation?: string;
  requiredExperience?: number | null;
  languages?: Array<{
    language: string;
    level: 'basic' | 'intermediate' | 'advanced' | 'native';
    required: boolean;
  }>;

  // Benefits and Perks
  benefits?: string[];
  perks?: string[];

  // Application Details
  applicationDeadline?: string;
  startDate?: string;
  applicationInstructions?: string;

  // Job Settings
  isUrgent?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

interface JobFormData {
  // Basic Information
  title: string;
  description: string;
  shortDescription: string;
  companyName: string;
  companyLogo: string;
  companyWebsite: string;
  location: string;
  workType: 'onsite' | 'remote' | 'hybrid';
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
}

const EditPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { tokens } = useAuth();

  const [job, setJob] = useState<ExtendedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for new items
  const [newRequiredSkill, setNewRequiredSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newPerk, setNewPerk] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newLanguage, setNewLanguage] = useState({
    language: '',
    level: 'intermediate' as const,
    required: false,
  });

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
  });

  // Fetch job details
  const fetchJobDetails = async () => {
    if (!jobId) {
      toast.error('Job ID is required');
      navigate('/job-board/jobs');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          const jobData = responseData.data.job || responseData.data;
          setJob(jobData);
          populateFormData(jobData);
          toast.success('Job details loaded successfully');
        } else {
          throw new Error(responseData.error || 'Failed to fetch job details');
        }
      } else if (response.status === 401) {
        toast.error('Authentication required. Please login again.');
        navigate('/login');
      } else if (response.status === 403) {
        toast.error('You do not have permission to edit this job.');
        navigate('/job-board/jobs');
      } else if (response.status === 404) {
        toast.error('Job not found.');
        navigate('/job-board/jobs');
      } else {
        throw new Error('Failed to fetch job details');
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details. Please try again.');
      navigate('/job-board/jobs');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely get experience level
  const getValidExperienceLevel = (
    level: string | undefined
  ): 'entry' | 'mid' | 'senior' | 'lead' | 'executive' => {
    const validLevels: ('entry' | 'mid' | 'senior' | 'lead' | 'executive')[] = [
      'entry',
      'mid',
      'senior',
      'lead',
      'executive',
    ];
    if (level && validLevels.includes(level as any)) {
      return level as 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    }
    return 'mid'; // default fallback
  };

  // Helper function to safely get work type
  const getValidWorkType = (
    type: string | undefined
  ): 'onsite' | 'remote' | 'hybrid' => {
    const validTypes: ('onsite' | 'remote' | 'hybrid')[] = [
      'onsite',
      'remote',
      'hybrid',
    ];
    if (type && validTypes.includes(type as any)) {
      return type as 'onsite' | 'remote' | 'hybrid';
    }
    return 'onsite'; // default fallback
  };

  // Helper function to safely get employment type
  const getValidEmploymentType = (
    type: string | undefined
  ): 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' => {
    const validTypes: (
      | 'full-time'
      | 'part-time'
      | 'contract'
      | 'freelance'
      | 'internship'
    )[] = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];
    if (type && validTypes.includes(type as any)) {
      return type as
        | 'full-time'
        | 'part-time'
        | 'contract'
        | 'freelance'
        | 'internship';
    }
    return 'full-time'; // default fallback
  };

  // Helper function to safely get salary period
  const getValidSalaryPeriod = (
    period: string | undefined
  ): 'hourly' | 'monthly' | 'yearly' => {
    const validPeriods: ('hourly' | 'monthly' | 'yearly')[] = [
      'hourly',
      'monthly',
      'yearly',
    ];
    if (period && validPeriods.includes(period as any)) {
      return period as 'hourly' | 'monthly' | 'yearly';
    }
    return 'yearly'; // default fallback
  };

  // Populate form data from fetched job
  const populateFormData = (job: ExtendedJob) => {
    setJobData({
      title: job.title || '',
      description: job.description || '',
      shortDescription: job.shortDescription || '',
      companyName: job.companyName || '',
      companyLogo: job.companyLogo || '',
      companyWebsite: job.companyWebsite || '',
      location: job.location || '',
      workType: getValidWorkType(job.workType),
      country: job.country || '',
      city: job.city || '',
      categoryId: job.categoryId || null,
      employmentType: getValidEmploymentType(job.employmentType),
      experienceLevel: getValidExperienceLevel(job.experienceLevel),

      salaryMin: job.salaryMin || null,
      salaryMax: job.salaryMax || null,
      salaryCurrency: job.salaryCurrency || 'USD',
      salaryPeriod: getValidSalaryPeriod(job.salaryPeriod),
      salaryNegotiable: job.salaryNegotiable || false,
      showSalary: job.showSalary ?? true,

      requiredSkills: job.requiredSkills || [],
      preferredSkills: job.preferredSkills || [],
      requiredEducation: job.requiredEducation || '',
      requiredExperience: job.requiredExperience || null,
      languages: job.languages || [],

      benefits: job.benefits || [],
      perks: job.perks || [],

      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().slice(0, 16)
        : '',
      startDate: job.startDate
        ? new Date(job.startDate).toISOString().slice(0, 10)
        : '',
      applicationInstructions: job.applicationInstructions || '',

      isUrgent: job.isUrgent || false,
      isFeatured: job.isFeatured || false,
      tags: job.tags || [],
    });
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // Update field and mark as changed
  const updateField = (field: keyof JobFormData, value: any) => {
    setJobData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Skills management
  const addRequiredSkill = () => {
    if (newRequiredSkill.trim()) {
      updateField('requiredSkills', [
        ...jobData.requiredSkills,
        newRequiredSkill.trim(),
      ]);
      setNewRequiredSkill('');
    }
  };

  const removeRequiredSkill = (index: number) => {
    updateField(
      'requiredSkills',
      jobData.requiredSkills.filter((_, i) => i !== index)
    );
  };

  const addPreferredSkill = () => {
    if (newPreferredSkill.trim()) {
      updateField('preferredSkills', [
        ...jobData.preferredSkills,
        newPreferredSkill.trim(),
      ]);
      setNewPreferredSkill('');
    }
  };

  const removePreferredSkill = (index: number) => {
    updateField(
      'preferredSkills',
      jobData.preferredSkills.filter((_, i) => i !== index)
    );
  };

  // Benefits management
  const addBenefit = () => {
    if (newBenefit.trim()) {
      updateField('benefits', [...jobData.benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    updateField(
      'benefits',
      jobData.benefits.filter((_, i) => i !== index)
    );
  };

  // Perks management
  const addPerk = () => {
    if (newPerk.trim()) {
      updateField('perks', [...jobData.perks, newPerk.trim()]);
      setNewPerk('');
    }
  };

  const removePerk = (index: number) => {
    updateField(
      'perks',
      jobData.perks.filter((_, i) => i !== index)
    );
  };

  // Tags management
  const addTag = () => {
    if (newTag.trim()) {
      updateField('tags', [...jobData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    updateField(
      'tags',
      jobData.tags.filter((_, i) => i !== index)
    );
  };

  // Language management
  const addLanguage = () => {
    if (newLanguage.language.trim()) {
      updateField('languages', [...jobData.languages, newLanguage]);
      setNewLanguage({ language: '', level: 'intermediate', required: false });
    }
  };

  const removeLanguage = (index: number) => {
    updateField(
      'languages',
      jobData.languages.filter((_, i) => i !== index)
    );
  };

  // Save job updates
  const handleSave = async () => {
    if (!jobId) return;

    const loadingToastId = toast.loading('Saving job updates...');
    setSaving(true);

    try {
      const updateData = {
        ...jobData,
        applicationDeadline: jobData.applicationDeadline || null,
        startDate: jobData.startDate || null,
      };

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success) {
          toast.success('✅ Job updated successfully!', {
            autoClose: 3000,
          });
          setHasChanges(false);

          // Refresh job data
          await fetchJobDetails();
        } else {
          throw new Error(responseData.error || 'Failed to update job');
        }
      } else if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.details) {
          // Handle validation errors
          const errorMessages = Object.values(errorData.details).join(', ');
          toast.error(`Validation Error: ${errorMessages}`);
        } else {
          toast.error(errorData.error || 'Invalid job data');
        }
      } else if (response.status === 403) {
        toast.error('You do not have permission to edit this job.');
      } else if (response.status === 404) {
        toast.error('Job not found.');
      } else {
        throw new Error('Failed to update job');
      }
    } catch (error) {
      console.error('Failed to update job:', error);
      toast.dismiss(loadingToastId);
      toast.error('❌ Failed to update job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle navigation with unsaved changes
  const handleBack = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }
    navigate('/job-board');
  };

  const workTypeOptions = [
    { value: 'onsite', label: '🏢 On-site', description: 'Work from office' },
    { value: 'remote', label: '🏠 Remote', description: 'Work from home' },
    {
      value: 'hybrid',
      label: '🔄 Hybrid',
      description: 'Mix of office and remote',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Container>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Container>
          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Job Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The job you're trying to edit doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/job-board')}>Back to Jobs</Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2 hover:bg-muted/80"
              >
                <AiOutlineArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Jobs</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                  Edit Job
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Update your job posting details
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className={`flex items-center gap-2 transition-all ${
                  hasChanges
                    ? 'bg-primary hover:bg-primary/90 shadow-lg'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {saving ? (
                  <AiOutlineLoading3Quarters
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <AiOutlineSave size={16} />
                )}
                <span className="hidden sm:inline">
                  {saving ? 'Saving...' : 'Save Changes'}
                </span>
              </Button>
            </div>
          </div>

          {/* Status Indicator - Sticky with header */}
          {hasChanges && (
            <div className="pb-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ You have unsaved changes. Don't forget to save your
                  updates!
                </p>
              </div>
            </div>
          )}
        </Container>
      </div>

      {/* Main Content */}
      <Container>
        <div className="max-w-4xl mx-auto py-8">
          {/* Job Status Info */}
          <div className="mb-8 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Job Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current status:{' '}
                  <span className="capitalize font-medium text-foreground">
                    {job.status}
                  </span>
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Created: {new Date(job.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(job.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <form className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                  📄
                </div>
                Basic Information
              </h3>

              <Input
                label="Job Title"
                value={jobData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g., Senior React Developer"
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company Name"
                  value={jobData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Your company name"
                  required
                />

                <Input
                  label="Company Website"
                  value={jobData.companyWebsite}
                  onChange={(e) =>
                    updateField('companyWebsite', e.target.value)
                  }
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Provide a detailed description of the role, responsibilities, and what you're looking for..."
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-vertical transition-all duration-200 focus:shadow-lg"
                  required
                />
                <p
                  className={`text-xs mt-1 transition-colors ${
                    jobData.description.length < 50 &&
                    jobData.description.length > 0
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {jobData.description.length}/50 characters minimum
                  {jobData.description.length < 50 &&
                    jobData.description.length > 0 &&
                    ` (${50 - jobData.description.length} more needed)`}
                </p>
              </div>

              <Input
                label="Short Description (Optional)"
                value={jobData.shortDescription}
                onChange={(e) =>
                  updateField('shortDescription', e.target.value)
                }
                placeholder="Brief summary for job listings"
                maxLength={200}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Location"
                  value={jobData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g., San Francisco, CA or Remote"
                  required
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Work Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {workTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('workType', option.value)}
                        className={`p-3 border rounded-lg transition-all duration-200 hover:scale-105 ${
                          jobData.workType === option.value
                            ? 'border-primary bg-primary/10 text-primary shadow-md'
                            : 'border-border hover:bg-muted hover:shadow-sm'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-sm sm:text-base mb-1">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Employment Type
                  </label>
                  <select
                    value={jobData.employmentType}
                    onChange={(e) =>
                      updateField('employmentType', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Experience Level
                  </label>
                  <select
                    value={jobData.experienceLevel}
                    onChange={(e) =>
                      updateField('experienceLevel', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  💰
                </div>
                Salary Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Minimum Salary"
                  type="number"
                  value={jobData.salaryMin || ''}
                  onChange={(e) =>
                    updateField(
                      'salaryMin',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="120000"
                />

                <Input
                  label="Maximum Salary"
                  type="number"
                  value={jobData.salaryMax || ''}
                  onChange={(e) =>
                    updateField(
                      'salaryMax',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="180000"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Currency
                  </label>
                  <select
                    value={jobData.salaryCurrency}
                    onChange={(e) =>
                      updateField('salaryCurrency', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Salary Period
                  </label>
                  <select
                    value={jobData.salaryPeriod}
                    onChange={(e) =>
                      updateField('salaryPeriod', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="monthly">Per Month</option>
                    <option value="yearly">Per Year</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center gap-3 md:col-span-2 pt-8">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={jobData.salaryNegotiable}
                      onChange={(e) =>
                        updateField('salaryNegotiable', e.target.checked)
                      }
                      className="rounded transition-all duration-200 group-hover:scale-110"
                    />
                    <span className="text-sm group-hover:text-primary transition-colors">
                      Salary is negotiable
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={jobData.showSalary}
                      onChange={(e) =>
                        updateField('showSalary', e.target.checked)
                      }
                      className="rounded transition-all duration-200 group-hover:scale-110"
                    />
                    <span className="text-sm group-hover:text-primary transition-colors">
                      Show salary on job listing
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Skills & Requirements */}
            <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  🎯
                </div>
                Skills & Requirements
              </h3>

              {/* Required Skills */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRequiredSkill}
                    onChange={(e) => setNewRequiredSkill(e.target.value)}
                    placeholder="Add a required skill"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addRequiredSkill())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addRequiredSkill}
                    variant="outline"
                    className="hover:bg-primary hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <AiOutlinePlus size={16} />
                  </Button>
                </div>
                {jobData.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jobData.requiredSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm transition-all duration-200 hover:bg-primary/20 hover:scale-105"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeRequiredSkill(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <AiOutlineClose size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferred Skills */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preferred Skills (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newPreferredSkill}
                    onChange={(e) => setNewPreferredSkill(e.target.value)}
                    placeholder="Add a preferred skill"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addPreferredSkill())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addPreferredSkill}
                    variant="outline"
                    className="hover:bg-primary hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <AiOutlinePlus size={16} />
                  </Button>
                </div>
                {jobData.preferredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jobData.preferredSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm transition-all duration-200 hover:bg-muted/80 hover:scale-105"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removePreferredSkill(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <AiOutlineClose size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Required Education (Optional)"
                  value={jobData.requiredEducation}
                  onChange={(e) =>
                    updateField('requiredEducation', e.target.value)
                  }
                  placeholder="e.g., Bachelor's degree in Computer Science"
                />

                <Input
                  label="Required Experience (Years)"
                  type="number"
                  value={jobData.requiredExperience || ''}
                  onChange={(e) =>
                    updateField(
                      'requiredExperience',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="3"
                  min="0"
                />
              </div>
            </div>

            {/* Benefits & Perks */}
            <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  🎁
                </div>
                Benefits & Perks
              </h3>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Benefits
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addBenefit())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addBenefit}
                    variant="outline"
                    className="hover:bg-green-500 hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <AiOutlinePlus size={16} />
                  </Button>
                </div>
                {jobData.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jobData.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm transition-all duration-200 hover:bg-green-200 hover:scale-105"
                      >
                        <span>{benefit}</span>
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <AiOutlineClose size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Perks */}
              <div>
                <label className="block text-sm font-medium mb-2">Perks</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newPerk}
                    onChange={(e) => setNewPerk(e.target.value)}
                    placeholder="Add a perk"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addPerk())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addPerk}
                    variant="outline"
                    className="hover:bg-blue-500 hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <AiOutlinePlus size={16} />
                  </Button>
                </div>
                {jobData.perks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jobData.perks.map((perk, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm transition-all duration-200 hover:bg-blue-200 hover:scale-105"
                      >
                        <span>{perk}</span>
                        <button
                          type="button"
                          onClick={() => removePerk(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <AiOutlineClose size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Application Details */}
            <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
                  📅
                </div>
                Application Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Application Deadline"
                  type="datetime-local"
                  value={jobData.applicationDeadline}
                  onChange={(e) =>
                    updateField('applicationDeadline', e.target.value)
                  }
                />

                <Input
                  label="Expected Start Date"
                  type="date"
                  value={jobData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Application Instructions
                </label>
                <textarea
                  value={jobData.applicationInstructions}
                  onChange={(e) =>
                    updateField('applicationInstructions', e.target.value)
                  }
                  placeholder="Any specific instructions for applicants..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                />
              </div>
            </div>

            {/* Job Settings */}
            <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                  ⚙️
                </div>
                Job Settings
              </h3>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={jobData.isUrgent}
                    onChange={(e) => updateField('isUrgent', e.target.checked)}
                    className="rounded transition-all duration-200 group-hover:scale-110"
                  />
                  <span className="text-sm group-hover:text-primary transition-colors">
                    Mark as urgent
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={jobData.isFeatured}
                    onChange={(e) =>
                      updateField('isFeatured', e.target.checked)
                    }
                    className="rounded transition-all duration-200 group-hover:scale-110"
                  />
                  <span className="text-sm group-hover:text-primary transition-colors">
                    Feature this job
                  </span>
                </label>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addTag())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="hover:bg-purple-500 hover:text-white transition-all duration-200 hover:scale-105"
                  >
                    <AiOutlinePlus size={16} />
                  </Button>
                </div>
                {jobData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jobData.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm transition-all duration-200 hover:bg-purple-200 hover:scale-105"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="hover:text-destructive transition-colors"
                        >
                          <AiOutlineClose size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Bottom Spacer to ensure content doesn't get hidden behind sticky header */}
          <div className="h-20"></div>
        </div>
      </Container>
    </div>
  );
};

export default EditPage;
