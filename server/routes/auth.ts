import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@shared/schema';
import { authenticateToken } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later',
  },
});

// Register
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    // Register the user first
    const result = await authService.register(validation.data);

    // Create profile based on user role
    try {
      const { firstName, lastName } = validation.data;
      const userId = result.user.id;
      const userRole = result.user.role;

      console.log(`Creating profile for user ${userId} with role ${userRole}`);

      if (userRole === 'candidate') {
        // Create candidate profile with basic information
        await profileService.updateCandidateProfile(userId, {
          firstName: firstName || '',
          lastName: lastName || ''
        });
      } else if (userRole === 'hr') {
        // Create HR profile with basic information
        await profileService.updateHrProfile(userId, {
          firstName: firstName || '',
          lastName: lastName || '',
        });
      }

      console.log(`✅ ${userRole} profile created successfully for user ${userId}`);
    } catch (profileError: any) {
      // Log the error but don't fail the registration
      console.error('Failed to create user profile:', profileError);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      tokens: result.tokens,
      profileCreated: true, // Indicate that profile was created
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Registration failed',
    });
  }
});

// Login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const result = await authService.login(validation.data);

    res.json({
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Login failed',
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      tokens,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Token refresh failed',
    });
  }
});

// Get current user with profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await authService.getCurrentUser(req.user.id);

    // Get user profile based on role
    let profileData = null;
    try {
      if (user.role === 'candidate') {
        profileData = await profileService.getCandidateProfile(user.id);
      } else if (user.role === 'hr') {
        profileData = await profileService.getHrProfile(user.id);
      }
    } catch (profileError) {
      // Profile might not exist yet, that's okay
      console.log('No profile found for user:', user.id);
    }

    res.json({
      user,
      profile: profileData,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to get user information',
    });
  }
});

// Forgot password
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  async (req: Request, res: Response) => {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors,
        });
      }

      await authService.forgotPassword(validation.data.email);

      // Always return success for security (don't reveal if email exists)
      res.json({
        message:
          'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error: any) {
      // Log error but don't reveal details to client
      console.error('Forgot password error:', error);
      res.json({
        message:
          'If an account with that email exists, a password reset link has been sent',
      });
    }
  }
);

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    await authService.resetPassword(
      validation.data.token,
      validation.data.password
    );

    res.json({
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Password reset failed',
    });
  }
});

// Verify email
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    await authService.verifyEmail(token);

    res.json({
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Email verification failed',
    });
  }
});

// Logout (optional - mainly for client-side token cleanup)
router.post(
  '/logout',
  authenticateToken,
  async (req: Request, res: Response) => {
    res.json({
      message: 'Logged out successfully',
    });
  }
);

export default router;
