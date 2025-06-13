import { Router, type Request, type Response } from 'express';
import { profileService } from '../services/profileService';
import { uploadService } from '../services/uploadService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { 
  updateCandidateProfileSchema,
  updateHrProfileSchema,
  updatePrivacySettingsSchema
} from '@shared/schema';
import rateLimit from 'express-rate-limit';
import { storage } from 'server/storage';

const router = Router();

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: { error: 'Too many upload attempts, please try again later' },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: { error: 'Too many search requests, please try again later' },
});

const upload = uploadService.getAvatarUpload();

// =============== CANDIDATE PROFILE ROUTES ===============

// Get candidate profile
router.get('/candidate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await profileService.getCandidateProfile(userId);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(error.message.includes('not a candidate') ? 403 : 500).json({
      error: error.message || 'Failed to fetch candidate profile',
    });
  }
});

// Update candidate profile
router.put('/candidate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log('Profile update request body:', req.body);
    
    const validation = updateCandidateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const profileData = validation.data;

    // Update user names in the users table if they are provided
    if (profileData.firstName || profileData.lastName) {
      try {
        const userUpdateData: any = {};
        if (profileData.firstName) {
          userUpdateData.firstName = profileData.firstName;
        }
        if (profileData.lastName) {
          userUpdateData.lastName = profileData.lastName;
        }

        // Update the user record using storage method
        await storage.updateUser(userId, userUpdateData);
        console.log(`✅ User names updated for userId: ${userId}`);
      } catch (userUpdateError) {
        console.error('Failed to update user names:', userUpdateError);
        // Continue with profile update even if user update fails
      }
    }

    // Update the candidate profile
    const updatedProfile = await profileService.updateCandidateProfile(userId, profileData);
    
    res.json({
      success: true,
      message: 'Candidate profile updated successfully',
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update candidate profile',
    });
  }
});

// Update candidate privacy settings
router.put('/candidate/privacy', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const validation = updatePrivacySettingsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const updatedProfile = await profileService.updateCandidatePrivacySettings(userId, validation.data);
    
    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: updatedProfile,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to update privacy settings',
    });
  }
});

// Upload candidate avatar
router.post('/candidate/avatar', authenticateToken, uploadLimiter, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    const processedFile = await uploadService.processAvatar(
      req.file.buffer,
      req.file.originalname,
      userId
    );

    const avatarUrl = await profileService.updateCandidateAvatar(userId, processedFile);
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
        filename: processedFile.filename,
        size: processedFile.size,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to upload avatar',
    });
  }
});

// Delete candidate avatar
router.delete('/candidate/avatar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    await profileService.deleteCandidateAvatar(userId);
    
    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to delete avatar',
    });
  }
});

// =============== HR PROFILE ROUTES ===============

// Get HR profile
router.get('/hr', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await profileService.getHrProfile(userId);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(error.message.includes('not an HR user') ? 403 : 500).json({
      error: error.message || 'Failed to fetch HR profile',
    });
  }
});

// Update HR profile
router.put('/hr', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    console.log('HR Profile update request body:', req.body);
    
    const validation = updateHrProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const profileData = validation.data;

    // Update user names in the users table if they are provided
    if (profileData.firstName || profileData.lastName) {
      try {
        const userUpdateData: any = {};
        if (profileData.firstName) {
          userUpdateData.firstName = profileData.firstName;
        }
        if (profileData.lastName) {
          userUpdateData.lastName = profileData.lastName;
        }

        // Update the user record using storage method
        await storage.updateUser(userId, userUpdateData);
        console.log(`✅ HR User names updated for userId: ${userId}`);
      } catch (userUpdateError) {
        console.error('Failed to update HR user names:', userUpdateError);
        // Continue with profile update even if user update fails
      }
    }

    // Update the HR profile
    const updatedProfile = await profileService.updateHrProfile(userId, profileData);
    
    res.json({
      success: true,
      message: 'HR profile updated successfully',
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error('HR Profile update error:', error);
    res.status(400).json({
      error: error.message || 'Failed to update HR profile',
    });
  }
});

// Upload HR avatar
router.post('/hr/avatar', authenticateToken, uploadLimiter, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    const processedFile = await uploadService.processAvatar(
      req.file.buffer,
      req.file.originalname,
      userId
    );

    const avatarUrl = await profileService.updateHrAvatar(userId, processedFile);
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
        filename: processedFile.filename,
        size: processedFile.size,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to upload avatar',
    });
  }
});

// Delete HR avatar
router.delete('/hr/avatar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    await profileService.deleteHrAvatar(userId);
    
    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Failed to delete avatar',
    });
  }
});

// =============== PUBLIC PROFILE ROUTES ===============

// Get public candidate profile (for HR to view)
router.get('/candidate/:id/public', authenticateToken, async (req: Request, res: Response) => {
  try {
    const profileId = parseInt(req.params.id);
    const viewerUserId = req.user?.id;
    
    if (isNaN(profileId)) {
      return res.status(400).json({ error: 'Invalid profile ID' });
    }

    const profile = await profileService.getPublicCandidateProfile(profileId, viewerUserId);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(error.message.includes('private') ? 403 : 404).json({
      error: error.message || 'Failed to fetch profile',
    });
  }
});

// =============== SEARCH ROUTES ===============

// Search candidates (for HR users)
router.get('/search/candidates', authenticateToken, searchLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    // Only HR users can search candidates
    if ((user as any).role !== 'hr') {
      return res.status(403).json({
        error: 'Only HR users can search candidates',
      });
    }

    const {
      query,
      location,
      skills,
      experience,
      minSalary,
      maxSalary,
      availability,
      workPreferences,
      page = '1',
      limit = '20',
    } = req.query;

    const searchParams = {
      query: query as string,
      location: location as string,
      skills: skills ? (skills as string).split(',') : undefined,
      experience: experience as string,
      salaryRange: {
        min: minSalary ? parseInt(minSalary as string) : undefined,
        max: maxSalary ? parseInt(maxSalary as string) : undefined,
      },
      availability: availability as string,
      workPreferences: workPreferences ? (workPreferences as string).split(',') : undefined,
    };

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 50); // Max 50 per page

    const results = await profileService.searchCandidates(searchParams, pageNum, limitNum);
    
    res.json({
      success: true,
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: results.total,
        pages: results.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to search candidates',
    });
  }
});

// =============== ACTIVITY ROUTES ===============

// Get profile activity log
router.get('/activity', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const activities = await profileService.getProfileActivities(userId, limit, offset);
    
    res.json({
      success: true,
      data: activities,
      pagination: {
        limit,
        offset,
        total: activities.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to fetch activity log',
    });
  }
});

export default router;