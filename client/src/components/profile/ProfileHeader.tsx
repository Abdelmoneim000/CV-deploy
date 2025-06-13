import useAuth from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';

const ProfileHeader = () => {
  const { user, tokens } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [isLoadingProfileData, setIsLoadingProfileData] = useState(true);

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

  // Calculate profile completion percentage
  const calculateProfileCompleteness = (profile: any, role: string) => {
    if (!profile) return 0;

    let totalFields = 0;
    let completedFields = 0;

    if (role === 'candidate') {
      const candidateFields = [
        'firstName',
        'lastName',
        'bio',
        'title',
        'location',
        'phone',
        'dateOfBirth',
        'linkedinUrl',
        'githubUrl',
        'portfolioUrl',
        'currentSalary',
        'expectedSalary',
      ];

      const arrayFields = ['skills', 'languages'];

      totalFields = candidateFields.length + arrayFields.length;

      // Check regular fields
      candidateFields.forEach((field) => {
        if (profile[field] && profile[field].toString().trim()) {
          completedFields++;
        }
      });

      // Check array fields
      arrayFields.forEach((field) => {
        if (
          profile[field] &&
          Array.isArray(profile[field]) &&
          profile[field].length > 0
        ) {
          completedFields++;
        }
      });
    } else if (role === 'hr') {
      const hrFields = [
        'firstName',
        'lastName',
        'jobTitle',
        'department',
        'phone',
        'companyName',
        'companyWebsite',
        'companySize',
        'companyIndustry',
        'companyLocation',
        'companyDescription',
        'yearsOfExperience',
        'preferredContactMethod',
        'linkedinUrl',
      ];

      const arrayFields = ['specializations', 'hiringSectors'];

      totalFields = hrFields.length + arrayFields.length;

      // Check regular fields
      hrFields.forEach((field) => {
        if (profile[field] && profile[field].toString().trim()) {
          completedFields++;
        }
      });

      // Check array fields
      arrayFields.forEach((field) => {
        if (
          profile[field] &&
          Array.isArray(profile[field]) &&
          profile[field].length > 0
        ) {
          completedFields++;
        }
      });
    }

    return Math.round((completedFields / totalFields) * 100);
  };

  // Fetch profile data for completion calculation (not for avatar)
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !tokens?.accessToken) return;

      try {
        const endpoint =
          user.role === 'candidate'
            ? '/api/profiles/candidate'
            : '/api/profiles/hr';

        const response = await makeAuthenticatedRequest(endpoint);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.profile) {
            setProfileData(data.data.profile);

            // Calculate completion percentage
            const completeness = calculateProfileCompleteness(
              data.data.profile,
              user.role
            );
            setProfileCompleteness(completeness);
          }
        } else {
          console.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoadingProfileData(false);
      }
    };

    fetchProfile();
  }, [user, tokens?.accessToken]);

  // Handle avatar change to recalculate profile completion
  const handleAvatarChange = () => {
    // Refetch profile data to update completion percentage
    const fetchUpdatedProfile = async () => {
      if (!user || !tokens?.accessToken) return;

      try {
        const endpoint =
          user.role === 'candidate'
            ? '/api/profiles/candidate'
            : '/api/profiles/hr';

        const response = await makeAuthenticatedRequest(endpoint);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.profile) {
            setProfileData(data.data.profile);
            const completeness = calculateProfileCompleteness(
              data.data.profile,
              user.role
            );
            setProfileCompleteness(completeness);
          }
        }
      } catch (error) {
        console.error('Error fetching updated profile:', error);
      }
    };

    fetchUpdatedProfile();
  };

  // Get completion status color and message
  const getCompletionStatus = (percentage: number) => {
    if (percentage >= 90) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        message: 'Excellent!',
      };
    } else if (percentage >= 70) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        message: 'Good progress',
      };
    } else if (percentage >= 50) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        message: 'Getting there',
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        message: 'Needs attention',
      };
    }
  };

  const completionStatus = getCompletionStatus(profileCompleteness);

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      {/* Back Button */}
      <div className="mb-4 -mt-2">
        <Link
          to="/job-board"
          className="w-fit flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          title="Back to Job Board"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Back to Job Board</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* Avatar Component - Let it handle its own loading state */}
        <Avatar size={64} editable={true} onAvatarChange={handleAvatarChange} />

        {/* User Information */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-muted-foreground">@{user?.username}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                user?.role === 'candidate'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-accent text-accent-foreground'
              }`}
            >
              {user?.role?.toUpperCase()}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                user?.isVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {user?.isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="text-right min-w-[200px]">
          {isLoadingProfileData ? (
            <div className="flex items-center justify-end space-x-2 mb-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end space-x-2 mb-2">
                <span className="text-sm font-medium text-foreground">
                  Profile Completion
                </span>
                <span className={`text-sm font-bold ${completionStatus.color}`}>
                  {profileCompleteness}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    profileCompleteness >= 90
                      ? 'bg-green-500'
                      : profileCompleteness >= 70
                      ? 'bg-blue-500'
                      : profileCompleteness >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${profileCompleteness}%` }}
                ></div>
              </div>

              {/* Status Message */}
              <div
                className={`text-xs px-2 py-1 rounded ${completionStatus.bgColor} ${completionStatus.color}`}
              >
                {completionStatus.message}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
