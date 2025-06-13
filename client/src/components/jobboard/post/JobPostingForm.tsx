import React, { useState } from 'react';
import { JobFormData } from './PostJob';
import {
  AiOutlinePlus,
  AiOutlineClose,
  AiOutlineArrowRight,
  AiOutlineGlobal,
  AiOutlineHome,
  AiOutlineTeam,
} from 'react-icons/ai';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface JobPostingFormProps {
  jobData: JobFormData;
  setJobData: (data: JobFormData) => void;
  onNext: () => void;
  isLoading: boolean;
}

const JobPostingForm: React.FC<JobPostingFormProps> = ({
  jobData,
  setJobData,
  onNext,
  isLoading,
}) => {
  const [newRequiredSkill, setNewRequiredSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newPerk, setNewPerk] = useState('');
  const [newLanguage, setNewLanguage] = useState({
    language: '',
    level: 'intermediate' as const,
    required: false,
  });

  const updateField = (field: keyof JobFormData, value: any) => {
    setJobData({ ...jobData, [field]: value });
  };

  // Skill management
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

  // Language management
  const addLanguage = () => {
    if (newLanguage.language.trim()) {
      updateField('languages', [
        ...jobData.languages,
        { ...newLanguage, language: newLanguage.language.trim() },
      ]);
      setNewLanguage({ language: '', level: 'intermediate', required: false });
    }
  };

  const removeLanguage = (index: number) => {
    updateField(
      'languages',
      jobData.languages.filter((_, i) => i !== index)
    );
  };

  const isFormValid = () => {
    return !!(
      jobData.title.trim() &&
      jobData.description.trim() &&
      jobData.description.length >= 50 &&
      jobData.companyName.trim() &&
      jobData.location.trim() &&
      jobData.requiredSkills.length > 0
    );
  };

  const workTypeOptions = [
    {
      value: 'remote',
      label: '🏠 Remote',
      icon: <AiOutlineGlobal size={16} />,
      description: 'Work from home',
    },
    {
      value: 'hybrid',
      label: '🔄 Hybrid',
      icon: <AiOutlineTeam size={16} />,
      description: 'Mix of office and remote',
    },
    {
      value: 'onsite',
      label: '🏢 On-site',
      icon: <AiOutlineHome size={16} />,
      description: 'Work from office',
    },
  ];

  return (
    <div className="space-y-8">
      <form className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
              📄
            </div>
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Job Title"
                type="text"
                value={jobData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Senior React Developer"
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>

            <Input
              label="Company Name"
              type="text"
              value={jobData.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="e.g. TechCorp Inc."
              required
            />

            <Input
              label="Company Website"
              type="url"
              value={jobData.companyWebsite}
              onChange={(e) => updateField('companyWebsite', e.target.value)}
              placeholder="https://company.com"
            />

            <Input
              label="Location"
              type="text"
              value={jobData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g. San Francisco, CA"
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Employment Type
              </label>
              <select
                value={jobData.employmentType}
                onChange={(e) => updateField('employmentType', e.target.value)}
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
                onChange={(e) => updateField('experienceLevel', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Short Description"
                type="text"
                value={jobData.shortDescription}
                onChange={(e) =>
                  updateField('shortDescription', e.target.value)
                }
                placeholder="Brief summary for job listings"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {jobData.shortDescription.length}/160 characters
              </p>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-6 p-6 bg-card/50 backdrop-blur border border-border rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold border-b border-border pb-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              📝
            </div>
            Job Description
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Detailed Description *
            </label>
            <textarea
              value={jobData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-vertical transition-all duration-200 focus:shadow-lg ${
                jobData.description.length > 0 &&
                jobData.description.length < 50
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border'
              }`}
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
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={jobData.salaryCurrency}
                onChange={(e) => updateField('salaryCurrency', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
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
                onChange={(e) => updateField('salaryPeriod', e.target.value)}
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
                  onChange={(e) => updateField('showSalary', e.target.checked)}
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Required Skills *
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newRequiredSkill}
                  onChange={(e) => setNewRequiredSkill(e.target.value)}
                  placeholder="Add a required skill..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                  onKeyPress={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addRequiredSkill())
                  }
                />
                <Button
                  type="button"
                  onClick={addRequiredSkill}
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
                Preferred Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPreferredSkill}
                  onChange={(e) => setNewPreferredSkill(e.target.value)}
                  placeholder="Add a preferred skill..."
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Required Education"
              type="text"
              value={jobData.requiredEducation}
              onChange={(e) => updateField('requiredEducation', e.target.value)}
              placeholder="e.g. Bachelor's degree in Computer Science"
            />

            <Input
              label="Years of Experience Required"
              type="number"
              value={jobData.requiredExperience || ''}
              onChange={(e) =>
                updateField(
                  'requiredExperience',
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="e.g. 5"
            />
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Required Languages
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newLanguage.language}
                  onChange={(e) =>
                    setNewLanguage({ ...newLanguage, language: e.target.value })
                  }
                  placeholder="Language (e.g. English)"
                  className="flex-1 min-w-[150px] px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                />
                <select
                  value={newLanguage.level}
                  onChange={(e) =>
                    setNewLanguage({
                      ...newLanguage,
                      level: e.target.value as any,
                    })
                  }
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 focus:shadow-lg"
                >
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="native">Native</option>
                </select>
                <label className="flex items-center gap-1 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={newLanguage.required}
                    onChange={(e) =>
                      setNewLanguage({
                        ...newLanguage,
                        required: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Required</span>
                </label>
                <Button
                  type="button"
                  onClick={addLanguage}
                  variant="outline"
                  className="hover:bg-primary hover:text-white transition-all duration-200 hover:scale-105"
                >
                  <AiOutlinePlus size={16} />
                </Button>
              </div>

              {jobData.languages.length > 0 && (
                <div className="space-y-2">
                  {jobData.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg transition-all duration-200 hover:bg-muted"
                    >
                      <span className="text-sm">
                        <span className="font-medium">{lang.language}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          - {lang.level}
                        </span>
                        {lang.required && (
                          <span className="ml-2 px-1 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            Required
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <AiOutlineClose size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <label className="block text-sm font-medium mb-2">Benefits</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="Add a benefit (e.g. Health Insurance)..."
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
              <div className="space-y-2">
                {jobData.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg transition-all duration-200 hover:bg-green-100"
                  >
                    <span className="text-green-600">✓</span>
                    <span className="flex-1 text-sm text-green-800">
                      {benefit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-green-600 hover:text-destructive transition-colors"
                    >
                      <AiOutlineClose size={14} />
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
                placeholder="Add a perk (e.g. Free Lunch)..."
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
              <div className="space-y-2">
                {jobData.perks.map((perk, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg transition-all duration-200 hover:bg-blue-100"
                  >
                    <span className="text-blue-600">🎉</span>
                    <span className="flex-1 text-sm text-blue-800">{perk}</span>
                    <button
                      type="button"
                      onClick={() => removePerk(index)}
                      className="text-blue-600 hover:text-destructive transition-colors"
                    >
                      <AiOutlineClose size={14} />
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
                onChange={(e) => updateField('isFeatured', e.target.checked)}
                className="rounded transition-all duration-200 group-hover:scale-110"
              />
              <span className="text-sm group-hover:text-primary transition-colors">
                Featured listing
              </span>
            </label>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="button"
            onClick={onNext}
            disabled={!isFormValid() || isLoading}
            className={`flex items-center gap-2 transition-all ${
              isFormValid() && !isLoading
                ? 'bg-primary hover:bg-primary/90 shadow-lg hover:scale-105'
                : 'bg-muted text-muted-foreground'
            }`}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Saving...
              </>
            ) : (
              <>
                Preview Job
                <AiOutlineArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;
