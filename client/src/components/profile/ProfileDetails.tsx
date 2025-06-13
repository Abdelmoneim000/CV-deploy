import {
  Edit3,
  Save,
  X,
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Building,
  Briefcase,
  DollarSign,
  Code,
  Languages,
  Calendar as CalendarIcon,
} from 'lucide-react';
import Button from '../ui/button';
import useAuth from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import { toast } from 'react-toastify';

interface UserData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'hr';
  isVerified: boolean;
  lastLogin: string;
}

interface CandidateProfileData {
  firstName: string;
  lastName: string;
  bio: string;
  title: string;
  location: string;
  phone: string;
  website: string;
  dateOfBirth: string;
  currentSalary?: number;
  expectedSalary?: number;
  salaryNegotiable?: boolean;
  availabilityDate?: string;
  skills: string[];
  languages: string[];
  preferredRoles: string[];
  preferredIndustries: string[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

interface HRProfileData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  phone: string;
  companyName: string;
  companyWebsite: string;
  companySize: string;
  companyIndustry: string;
  companyLocation: string;
  companyDescription: string;
  yearsOfExperience: number;
  specializations: string[];
  hiringSectors: string[];
  preferredContactMethod: string;
  linkedinUrl: string;
}

const ProfileDetails = () => {
  const { user: authUser, loading: authLoading, tokens } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<
    CandidateProfileData | HRProfileData | any
  >({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize user data from auth context
  useEffect(() => {
    if (authUser && !authLoading) {
      const userData: UserData = {
        ...authUser,
        lastLogin: authUser.lastLogin || '',
      };
      setUser(userData);
      setLoading(false);

      fetchUserProfile();
    }
  }, [authUser, authLoading]);

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const accessToken =
      tokens?.accessToken ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  const fetchUserProfile = async () => {
    if (!authUser) return;

    try {
      const endpoint =
        authUser.role === 'candidate'
          ? '/api/profiles/candidate'
          : '/api/profiles/hr';

      const response = await makeAuthenticatedRequest(endpoint);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.profile) {
          setProfileData(data.data.profile);

          if (authUser.role === 'candidate') {
            setFormData({
              firstName: data.data.profile.firstName || '',
              lastName: data.data.profile.lastName || '',
              bio: data.data.profile.bio || '',
              title: data.data.profile.title || '',
              location: data.data.profile.location || '',
              phone: data.data.profile.phone || '',
              website: data.data.profile.website || '',
              // Fix date fields - use undefined instead of empty string
              dateOfBirth: data.data.profile.dateOfBirth
                ? data.data.profile.dateOfBirth.split('T')[0]
                : undefined,
              // Fix number fields - use undefined instead of empty string
              currentSalary: data.data.profile.currentSalary || undefined,
              expectedSalary: data.data.profile.expectedSalary || undefined,
              salaryNegotiable: data.data.profile.salaryNegotiable || false,
              // Fix date field
              availabilityDate: data.data.profile.availabilityDate
                ? data.data.profile.availabilityDate.split('T')[0]
                : undefined,
              skills: data.data.profile.skills || [],
              languages: data.data.profile.languages || [],
              preferredRoles: data.data.profile.preferredRoles || [],
              preferredIndustries: data.data.profile.preferredIndustries || [],
              linkedinUrl: data.data.profile.linkedinUrl || '',
              githubUrl: data.data.profile.githubUrl || '',
              portfolioUrl: data.data.profile.portfolioUrl || '',
            });
          } else {
            setFormData({
              firstName: data.data.profile.firstName || '',
              lastName: data.data.profile.lastName || '',
              jobTitle: data.data.profile.jobTitle || '',
              department: data.data.profile.department || '',
              phone: data.data.profile.phone || '',
              companyName: data.data.profile.companyName || '',
              companyWebsite: data.data.profile.companyWebsite || '',
              companySize: data.data.profile.companySize || '',
              companyIndustry: data.data.profile.companyIndustry || '',
              companyLocation: data.data.profile.companyLocation || '',
              companyDescription: data.data.profile.companyDescription || '',
              yearsOfExperience: data.data.profile.yearsOfExperience || 0,
              specializations: data.data.profile.specializations || [],
              hiringSectors: data.data.profile.hiringSectors || [],
              preferredContactMethod:
                data.data.profile.preferredContactMethod || 'email',
              linkedinUrl: data.data.profile.linkedinUrl || '',
            });
          }
        }
      } else {
        console.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (user?.role === 'candidate') {
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
      if (
        formData.portfolioUrl &&
        !/^https?:\/\/.+\..+/.test(formData.portfolioUrl)
      ) {
        errors.portfolioUrl = 'Please enter a valid website URL';
      }
      if (
        formData.linkedinUrl &&
        !/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(formData.linkedinUrl)
      ) {
        errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
      }
      if (
        formData.githubUrl &&
        !/^https?:\/\/(www\.)?github\.com\/.+/.test(formData.githubUrl)
      ) {
        errors.githubUrl = 'Please enter a valid GitHub URL';
      }
    } else if (user?.role === 'hr') {
      if (
        formData.companyWebsite &&
        !/^https?:\/\/.+\..+/.test(formData.companyWebsite)
      ) {
        errors.companyWebsite = 'Please enter a valid website URL';
      }
      if (
        formData.linkedinUrl &&
        !/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(formData.linkedinUrl)
      ) {
        errors.linkedinUrl = 'Please enter a valid LinkedIn URL';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const cleanFormData = (formData: any) => {
    const cleaned = { ...formData };

    // Convert empty strings to undefined for optional fields
    Object.keys(cleaned).forEach((key) => {
      if (
        cleaned[key] === '' &&
        [
          'dateOfBirth',
          'availabilityDate',
          'currentSalary',
          'expectedSalary',
          'website',
          'phone',
          'bio',
          'title',
          'location',
          'linkedinUrl',
          'githubUrl',
          'portfolioUrl',
        ].includes(key)
      ) {
        cleaned[key] = undefined;
      }
    });

    return cleaned;
  };

  // Update your handleProfileUpdate function
  const handleProfileUpdate = async () => {
    if (isUpdating || !validateProfileForm() || !user) return;

    setIsUpdating(true);

    try {
      const endpoint =
        user.role === 'candidate'
          ? '/api/profiles/candidate'
          : '/api/profiles/hr';

      // Clean the form data before sending
      const cleanedData = cleanFormData(formData);
      console.log('Sending cleaned profile data:', cleanedData);

      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData), // Send cleaned data
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfileData({ ...profileData, ...cleanedData });
          setIsEditing(false);
          setFormErrors({});
          toast.success('Profile updated successfully');
          fetchUserProfile();
        }
      } else {
        const error = await response.json();
        console.error('Profile update error:', error);
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | string[] | boolean | undefined
  ) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Fix the array input change handler
  const handleArrayInputChange = (field: string, value: string) => {
    const arrayValue = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0); // Changed from item to item.length > 0

    // Send empty array if no valid items, otherwise send the array
    handleInputChange(field, arrayValue.length > 0 ? arrayValue : []);
  };

  // Fix date handling
  const handleDateInputChange = (field: string, value: string) => {
    if (value.trim() === '') {
      handleInputChange(field, undefined); // Send undefined for empty dates
    } else {
      handleInputChange(field, value);
    }
  };

  // Fix the number handler
  const handleNumberInputChange = (field: string, value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue === '') {
      handleInputChange(field, undefined); // Send undefined for empty numbers
      return;
    }

    const numValue = parseInt(trimmedValue);
    handleInputChange(field, isNaN(numValue) ? undefined : numValue);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    fetchUserProfile();
    setFormErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Profile Information
        </h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button
              onClick={handleProfileUpdate}
              loading={isUpdating}
              loadingText="Saving..."
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={cancelEdit}
              disabled={isUpdating}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {isEditing ? (
            <Input
              label="First Name"
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={formErrors.firstName}
              required
              disabled={isUpdating}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name
              </label>
              <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>
                  {profileData?.firstName || user?.firstName || 'Not provided'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          {isEditing ? (
            <Input
              label="Last Name"
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={formErrors.lastName}
              required
              disabled={isUpdating}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name
              </label>
              <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>
                  {profileData?.lastName || user?.lastName || 'Not provided'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{user?.email || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific fields */}
      {user?.role === 'candidate' ? (
        // Candidate-specific fields
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {isEditing ? (
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={formErrors.phone}
                  disabled={isUpdating}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.phone || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Job Title"
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isUpdating}
                  placeholder="e.g., Senior Developer"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Title
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.title || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Location"
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) =>
                    handleInputChange('location', e.target.value)
                  }
                  disabled={isUpdating}
                  placeholder="City, State/Country"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.location || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth || ''} // Convert undefined to empty string for display
                  onChange={(e) => handleDateInputChange('dateOfBirth', e.target.value)}
                  disabled={isUpdating}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {profileData?.dateOfBirth
                        ? new Date(profileData.dateOfBirth).toLocaleDateString()
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Current Salary (USD)"
                  type="number"
                  value={formData.currentSalary?.toString() || ''} // Handle undefined properly
                  onChange={(e) => handleNumberInputChange('currentSalary', e.target.value)}
                  disabled={isUpdating}
                  placeholder="75000"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Salary
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {profileData?.currentSalary
                        ? `$${profileData.currentSalary.toLocaleString()}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Expected Salary (USD)"
                  type="number"
                  value={formData.expectedSalary?.toString() || ''}
                  onChange={(e) => handleNumberInputChange('expectedSalary', e.target.value)}
                  disabled={isUpdating}
                  placeholder="90000"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expected Salary
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {profileData?.expectedSalary
                        ? `$${profileData.expectedSalary.toLocaleString()}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Availability Date"
                  type="date"
                  value={formData.availabilityDate || ''}
                  onChange={(e) =>
                    handleInputChange('availabilityDate', e.target.value)
                  }
                  disabled={isUpdating}
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Availability Date
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {profileData?.availabilityDate
                        ? new Date(
                            profileData.availabilityDate
                          ).toLocaleDateString()
                        : 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="salaryNegotiable"
                    checked={formData.salaryNegotiable || false}
                    onChange={(e) =>
                      handleInputChange('salaryNegotiable', e.target.checked)
                    }
                    disabled={isUpdating}
                    className="rounded border-border"
                  />
                  <label
                    htmlFor="salaryNegotiable"
                    className="text-sm font-medium text-foreground"
                  >
                    Salary is negotiable
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Salary Negotiable
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground">
                    <span>{profileData?.salaryNegotiable ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills and other array fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Skills (comma-separated)
                  </label>
                  <textarea
                    value={
                      Array.isArray(formData.skills)
                        ? formData.skills.join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      handleArrayInputChange('skills', e.target.value)
                    }
                    disabled={isUpdating}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="JavaScript, React, Node.js, Python"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Skills
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-start space-x-2 min-h-[80px]">
                    <Code className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex flex-wrap gap-1">
                      {profileData?.skills && profileData.skills.length > 0 ? (
                        profileData.skills.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <span>No skills provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Languages (comma-separated)
                  </label>
                  <textarea
                    value={
                      Array.isArray(formData.languages)
                        ? formData.languages.join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      handleArrayInputChange('languages', e.target.value)
                    }
                    disabled={isUpdating}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="English, Spanish, French"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Languages
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-start space-x-2 min-h-[80px]">
                    <Languages className="w-4 h-4 text-muted-foreground mt-1" />
                    <div className="flex flex-wrap gap-1">
                      {profileData?.languages &&
                      profileData.languages.length > 0 ? (
                        profileData.languages.map(
                          (language: string, index: number) => (
                            <span
                              key={index}
                              className="bg-secondary/70 text-secondary-foreground px-2 py-1 rounded text-xs"
                            >
                              {language}
                            </span>
                          )
                        )
                      ) : (
                        <span>No languages provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* URLs for candidates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              {isEditing ? (
                <Input
                  label="LinkedIn URL"
                  type="url"
                  value={formData.linkedinUrl || ''}
                  onChange={(e) =>
                    handleInputChange('linkedinUrl', e.target.value)
                  }
                  error={formErrors.linkedinUrl}
                  disabled={isUpdating}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    LinkedIn
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">
                      {profileData?.linkedinUrl || 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="GitHub URL"
                  type="url"
                  value={formData.githubUrl || ''}
                  onChange={(e) =>
                    handleInputChange('githubUrl', e.target.value)
                  }
                  error={formErrors.githubUrl}
                  disabled={isUpdating}
                  placeholder="https://github.com/johndoe"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    GitHub
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">
                      {profileData?.githubUrl || 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Portfolio URL"
                  type="url"
                  value={formData.portfolioUrl || ''}
                  onChange={(e) =>
                    handleInputChange('portfolioUrl', e.target.value)
                  }
                  error={formErrors.portfolioUrl}
                  disabled={isUpdating}
                  placeholder="https://johndoe.dev"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Portfolio
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">
                      {profileData?.portfolioUrl || 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio Section for Candidates */}
          <div>
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={isUpdating}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Tell us about yourself..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bio
                </label>
                <div className="px-3 py-3 bg-muted rounded-lg text-foreground min-h-[100px]">
                  <span>{profileData?.bio || 'No bio provided'}</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // HR-specific fields
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {isEditing ? (
                <Input
                  label="Job Title"
                  type="text"
                  value={formData.jobTitle || ''}
                  onChange={(e) =>
                    handleInputChange('jobTitle', e.target.value)
                  }
                  disabled={isUpdating}
                  placeholder="e.g., HR Manager"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Job Title
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.jobTitle || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Department"
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) =>
                    handleInputChange('department', e.target.value)
                  }
                  disabled={isUpdating}
                  placeholder="e.g., Human Resources"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Department
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.department || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isUpdating}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.phone || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <Input
                  label="Years of Experience"
                  type="number"
                  value={formData.yearsOfExperience?.toString() || ''}
                  onChange={(e) => handleNumberInputChange('yearsOfExperience', e.target.value)}
                  disabled={isUpdating}
                  placeholder="8"
                />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Years of Experience
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{profileData?.yearsOfExperience || 0} years</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-foreground">
              Company Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {isEditing ? (
                  <Input
                    label="Company Name"
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) =>
                      handleInputChange('companyName', e.target.value)
                    }
                    disabled={isUpdating}
                    placeholder="e.g., Tech Corp"
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Name
                    </label>
                    <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{profileData?.companyName || 'Not provided'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isEditing ? (
                  <Input
                    label="Company Website"
                    type="url"
                    value={formData.companyWebsite || ''}
                    onChange={(e) =>
                      handleInputChange('companyWebsite', e.target.value)
                    }
                    error={formErrors.companyWebsite}
                    disabled={isUpdating}
                    placeholder="https://company.com"
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Website
                    </label>
                    <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">
                        {profileData?.companyWebsite || 'Not provided'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Size
                    </label>
                    <select
                      value={formData.companySize || ''}
                      onChange={(e) =>
                        handleInputChange('companySize', e.target.value)
                      }
                      disabled={isUpdating}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select company size</option>
                      <option value="startup">Startup (1-10 employees)</option>
                      <option value="small">Small (11-50 employees)</option>
                      <option value="medium">Medium (51-200 employees)</option>
                      <option value="large">Large (201-1000 employees)</option>
                      <option value="enterprise">
                        Enterprise (1000+ employees)
                      </option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Size
                    </label>
                    <div className="px-3 py-3 bg-muted rounded-lg text-foreground">
                      <span>{profileData?.companySize || 'Not provided'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isEditing ? (
                  <Input
                    label="Company Industry"
                    type="text"
                    value={formData.companyIndustry || ''}
                    onChange={(e) =>
                      handleInputChange('companyIndustry', e.target.value)
                    }
                    disabled={isUpdating}
                    placeholder="e.g., Technology"
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Industry
                    </label>
                    <div className="px-3 py-3 bg-muted rounded-lg text-foreground">
                      <span>
                        {profileData?.companyIndustry || 'Not provided'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isEditing ? (
                  <Input
                    label="Company Location"
                    type="text"
                    value={formData.companyLocation || ''}
                    onChange={(e) =>
                      handleInputChange('companyLocation', e.target.value)
                    }
                    disabled={isUpdating}
                    placeholder="e.g., Austin, TX"
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company Location
                    </label>
                    <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {profileData?.companyLocation || 'Not provided'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Preferred Contact Method
                    </label>
                    <select
                      value={formData.preferredContactMethod || 'email'}
                      onChange={(e) =>
                        handleInputChange(
                          'preferredContactMethod',
                          e.target.value
                        )
                      }
                      disabled={isUpdating}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Preferred Contact Method
                    </label>
                    <div className="px-3 py-3 bg-muted rounded-lg text-foreground">
                      <span className="capitalize">
                        {profileData?.preferredContactMethod || 'Email'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Description */}
            <div>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={formData.companyDescription || ''}
                    onChange={(e) =>
                      handleInputChange('companyDescription', e.target.value)
                    }
                    disabled={isUpdating}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Describe your company..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Description
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground min-h-[100px]">
                    <span>
                      {profileData?.companyDescription ||
                        'No description provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HR Specializations and Hiring Sectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Specializations (comma-separated)
                  </label>
                  <textarea
                    value={
                      Array.isArray(formData.specializations)
                        ? formData.specializations.join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      handleArrayInputChange('specializations', e.target.value)
                    }
                    disabled={isUpdating}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Technical Recruiting, Talent Acquisition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Specializations
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground min-h-[80px]">
                    <div className="flex flex-wrap gap-1">
                      {profileData?.specializations &&
                      profileData.specializations.length > 0 ? (
                        profileData.specializations.map(
                          (spec: string, index: number) => (
                            <span
                              key={index}
                              className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                            >
                              {spec}
                            </span>
                          )
                        )
                      ) : (
                        <span>No specializations provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hiring Sectors (comma-separated)
                  </label>
                  <textarea
                    value={
                      Array.isArray(formData.hiringSectors)
                        ? formData.hiringSectors.join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      handleArrayInputChange('hiringSectors', e.target.value)
                    }
                    disabled={isUpdating}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Software Development, Data Science, DevOps"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hiring Sectors
                  </label>
                  <div className="px-3 py-3 bg-muted rounded-lg text-foreground min-h-[80px]">
                    <div className="flex flex-wrap gap-1">
                      {profileData?.hiringSectors &&
                      profileData.hiringSectors.length > 0 ? (
                        profileData.hiringSectors.map(
                          (sector: string, index: number) => (
                            <span
                              key={index}
                              className="bg-secondary/70 text-secondary-foreground px-2 py-1 rounded text-xs"
                            >
                              {sector}
                            </span>
                          )
                        )
                      ) : (
                        <span>No hiring sectors provided</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LinkedIn for HR */}
          <div>
            {isEditing ? (
              <Input
                label="LinkedIn URL"
                type="url"
                value={formData.linkedinUrl || ''}
                onChange={(e) =>
                  handleInputChange('linkedinUrl', e.target.value)
                }
                error={formErrors.linkedinUrl}
                disabled={isUpdating}
                placeholder="https://linkedin.com/in/janesmith"
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  LinkedIn
                </label>
                <div className="px-3 py-3 bg-muted rounded-lg text-foreground flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">
                    {profileData?.linkedinUrl || 'Not provided'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Email Verification */}
      {!user?.isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Email Verification Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please verify your email address to access all features.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info('Please check your email for verification link')
              }
              className="bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-600"
            >
              Resend Verification
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDetails;
