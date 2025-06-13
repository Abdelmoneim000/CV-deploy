import bcrypt from 'bcryptjs';
import { storage } from '../storage';
import { uploadService, type UploadedFile } from './uploadService';
import type { 
  User,
  CandidateProfile,
  HrProfile,
  UpdateCandidateProfileRequest,
  UpdateHrProfileRequest,
  InsertProfileActivity,
  InsertProfileView,
  ProfileActivity,
} from '@shared/schema';

export interface CandidateProfileStats {
  totalCVs: number;
  profileViews: number;
  lastLogin: Date | null;
  memberSince: Date;
  profileCompleteness: number;
  totalApplications?: number;
  responseRate?: number;
}

export interface HrProfileStats {
  totalJobsPosted: number;
  totalCandidatesContacted: number;
  activeJobPostings?: number;
  lastLogin: Date | null;
  memberSince: Date;
  profileCompleteness: number;
  responseRate?: number;
}

export class ProfileService {
  async getProfileActivities(
    userId: number, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ProfileActivity[]> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await storage.getProfileActivities(userId, limit, offset);
  }
  
  // Get candidate profile with stats
  async getCandidateProfile(userId: number): Promise<{ 
    user: Omit<User, 'password'>; 
    profile: CandidateProfile | null; 
    stats: CandidateProfileStats 
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'candidate') {
      throw new Error('User is not a candidate');
    }

    const profile = await storage.getCandidateProfileByUserId(userId);
    const stats = await this.getCandidateStats(userId, profile || null);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      profile: profile || null,
      stats
    };
  }

  // Get HR profile with stats
  async getHrProfile(userId: number): Promise<{ 
    user: Omit<User, 'password'>; 
    profile: HrProfile | null; 
    stats: HrProfileStats 
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'hr') {
      throw new Error('User is not an HR user');
    }

    const profile = await storage.getHrProfileByUserId(userId);
    const stats = await this.getHrStats(userId, profile || null);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      profile: profile || null,
      stats
    };
  }

  // Create or update candidate profile
  async updateCandidateProfile(
    userId: number, 
    data: UpdateCandidateProfileRequest
  ): Promise<CandidateProfile> {
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'candidate') {
      throw new Error('User not found or not a candidate');
    }

    // Convert string dates to Date objects
    const updateData = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      availabilityDate: data.availabilityDate ? new Date(data.availabilityDate) : undefined,
    };

    const existingProfile = await storage.getCandidateProfileByUserId(userId);
    
    let profile: CandidateProfile;
    if (existingProfile) {
      profile = await storage.updateCandidateProfile(existingProfile.id, updateData);
    } else {
      profile = await storage.createCandidateProfile({
        userId,
        ...updateData,
      });
    }

    // Log activity
    await this.logProfileActivity(userId, 'candidate', 'profile_update', 'Candidate profile updated');

    return profile;
  }

  // Create or update HR profile
  async updateHrProfile(
    userId: number, 
    data: UpdateHrProfileRequest
  ): Promise<HrProfile> {
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'hr') {
      throw new Error('User not found or not an HR user');
    }

    const existingProfile = await storage.getHrProfileByUserId(userId);
    
    let profile: HrProfile;
    if (existingProfile) {
      profile = await storage.updateHrProfile(existingProfile.id, data);
    } else {
      profile = await storage.createHrProfile({
        userId,
        ...data,
      });
    }

    // Log activity
    await this.logProfileActivity(userId, 'hr', 'profile_update', 'HR profile updated');

    return profile;
  }

  // Update privacy settings for candidate
  // Update privacy settings for candidate
  async updateCandidatePrivacySettings(
    userId: number, 
    settings: any // Replace 'any' with z.infer<typeof updatePrivacySettingsSchema> if you want strong typing
  ): Promise<CandidateProfile> {
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'candidate') {
      throw new Error('User not found or not a candidate');
    }

    const profile = await storage.getCandidateProfileByUserId(userId);
    if (!profile) {
      throw new Error('Candidate profile not found');
    }

    const updatedProfile = await storage.updateCandidateProfile(profile.id, settings);

    // Log activity
    await this.logProfileActivity(userId, 'candidate', 'privacy_update', 'Privacy settings updated');

    return updatedProfile;
  }
  // Upload and update avatar for candidate
  async updateCandidateAvatar(userId: number, file: UploadedFile): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'candidate') {
      throw new Error('User not found or not a candidate');
    }

    let profile = await storage.getCandidateProfileByUserId(userId);
    
    // Delete old avatar if exists
    if (profile?.avatar) {
      const oldFilename = profile.avatar.split('/').pop();
      if (oldFilename) {
        await uploadService.deleteAvatar(oldFilename);
      }
    }

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await storage.createCandidateProfile({ userId });
    }

    // Update profile with new avatar
    const updatedProfile = await storage.updateCandidateProfile(profile.id, {
      avatar: file.url,
      avatarFileName: file.originalName,
    });

    // Log activity
    await this.logProfileActivity(userId, 'candidate', 'avatar_update', 'Profile avatar updated');

    return file.url;
  }

  // Upload and update avatar for HR
  async updateHrAvatar(userId: number, file: UploadedFile): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user || user.role !== 'hr') {
      throw new Error('User not found or not an HR user');
    }

    let profile = await storage.getHrProfileByUserId(userId);
    
    // Delete old avatar if exists
    if (profile?.avatar) {
      const oldFilename = profile.avatar.split('/').pop();
      if (oldFilename) {
        await uploadService.deleteAvatar(oldFilename);
      }
    }

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await storage.createHrProfile({ userId });
    }

    // Update profile with new avatar
    const updatedProfile = await storage.updateHrProfile(profile.id, {
      avatar: file.url,
      avatarFileName: file.originalName,
    });

    // Log activity
    await this.logProfileActivity(userId, 'hr', 'avatar_update', 'Profile avatar updated');

    return file.url;
  }

  // Delete candidate avatar
  async deleteCandidateAvatar(userId: number): Promise<void> {
    const profile = await storage.getCandidateProfileByUserId(userId);
    if (!profile || !profile.avatar) {
      throw new Error('No avatar to delete');
    }

    // Delete file
    const filename = profile.avatar.split('/').pop();
    if (filename) {
      await uploadService.deleteAvatar(filename);
    }

    // Update profile
    await storage.updateCandidateProfile(profile.id, {
      avatar: null,
      avatarFileName: null,
    });

    // Log activity
    await this.logProfileActivity(userId, 'candidate', 'avatar_delete', 'Profile avatar removed');
  }

  // Delete HR avatar
  async deleteHrAvatar(userId: number): Promise<void> {
    const profile = await storage.getHrProfileByUserId(userId);
    if (!profile || !profile.avatar) {
      throw new Error('No avatar to delete');
    }

    // Delete file
    const filename = profile.avatar.split('/').pop();
    if (filename) {
      await uploadService.deleteAvatar(filename);
    }

    // Update profile
    await storage.updateHrProfile(profile.id, {
      avatar: null,
      avatarFileName: null,
    });

    // Log activity
    await this.logProfileActivity(userId, 'hr', 'avatar_delete', 'Profile avatar removed');
  }

  // Search candidates (for HR users)
  async searchCandidates(
    searchParams: {
      query?: string;
      location?: string;
      skills?: string[];
      experience?: string;
      salaryRange?: { min?: number; max?: number };
      availability?: string;
      workPreferences?: string[];
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    candidates: (CandidateProfile & { user: Omit<User, 'password'> })[];
    total: number;
    pages: number;
  }> {
    return storage.searchCandidates(searchParams, page, limit);
  }

  // Get public candidate profile (for HR to view)
  async getPublicCandidateProfile(
    profileId: number,
    viewerUserId?: number
  ): Promise<CandidateProfile & { user: Omit<User, 'password'> }> {
    const profile = await storage.getCandidateProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check visibility
    if (profile.profileVisibility === 'private') {
      throw new Error('Profile is private');
    }

    // Log profile view
    if (viewerUserId) {
      const viewer = await storage.getUser(viewerUserId);
      await this.logProfileView(
        profileId,
        'candidate',
        viewerUserId,
        viewer?.role || 'anonymous'
      );

      // Increment view count
      await storage.updateCandidateProfile(profile.id, {
        profileViews: (profile.profileViews || 0) + 1,
      });
    }

    const user = await storage.getUser(profile.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;

    return {
      ...profile,
      user: userWithoutPassword,
    };
  }

  // Get candidate statistics
  private async getCandidateStats(
    userId: number, 
    profile: CandidateProfile | null
  ): Promise<CandidateProfileStats> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const cvs = await storage.getCVsByUserId(userId);
    const profileCompleteness = profile ? this.calculateCandidateProfileCompleteness(profile) : 0;

    return {
      totalCVs: cvs.length,
      profileViews: typeof profile?.profileViews === 'number' ? profile.profileViews : 0,
      lastLogin: user.lastLogin,
      memberSince: user.createdAt,
      profileCompleteness,
      totalApplications: 0, // Would need job applications table
      responseRate: 0, // Would calculate based on applications
    };
  }

  // Get HR statistics
  private async getHrStats(
    userId: number, 
    profile: HrProfile | null
  ): Promise<HrProfileStats> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profileCompleteness = profile ? this.calculateHrProfileCompleteness(profile) : 0;

    return {
      totalJobsPosted: profile?.totalJobsPosted || 0,
      totalCandidatesContacted: profile?.totalCandidatesContacted || 0,
      activeJobPostings: 0, // Would need jobs table
      lastLogin: user.lastLogin,
      memberSince: user.createdAt,
      profileCompleteness,
      responseRate: 0, // Would calculate based on job responses
    };
  }

  // Calculate candidate profile completeness
  private calculateCandidateProfileCompleteness(profile: CandidateProfile): number {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.bio,
      profile.title,
      profile.location,
      profile.avatar,
      profile.phone,
      profile.linkedinUrl,
      profile.skills && (profile.skills as any[]).length > 0,
      profile.preferredRoles && (profile.preferredRoles as any[]).length > 0,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  // Calculate HR profile completeness
  private calculateHrProfileCompleteness(profile: HrProfile): number {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.jobTitle,
      profile.companyName,
      profile.companyWebsite,
      profile.companyIndustry,
      profile.companyLocation,
      profile.companyDescription,
      profile.avatar,
      profile.linkedinUrl,
    ];

    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  // Log profile activity
  private async logProfileActivity(
    userId: number,
    profileType: 'candidate' | 'hr',
    action: string,
    description: string,
    metadata: any = {},
    req?: any
  ): Promise<void> {
    const activityData: InsertProfileActivity = {
      userId,
      profileType,
      action,
      description,
      metadata,
      ipAddress: req?.ip || null,
      userAgent: req?.get('User-Agent') || null,
    };

    await storage.createProfileActivity(activityData);
  }

  // Log profile view
  private async logProfileView(
    profileId: number,
    profileType: 'candidate' | 'hr',
    viewerUserId: number,
    viewerType: string,
    req?: any
  ): Promise<void> {
    const viewData: InsertProfileView = {
      viewedProfileId: profileId,
      viewedProfileType: profileType,
      viewerUserId,
      viewerType,
      ipAddress: req?.ip || null,
      userAgent: req?.get('User-Agent') || null,
      referrer: req?.get('Referrer') || null,
    };

    await storage.createProfileView(viewData);
  }
}

export const profileService = new ProfileService();