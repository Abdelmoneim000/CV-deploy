import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage } from '../storage';
import {
  User,
  InsertUser,
  LoginRequest,
  RegisterRequest,
} from '@shared/schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m';
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  private convertTimeToSeconds(time: string): number {
    const match = time.match(/^(\d+)([mhd])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${time}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const insertUser: InsertUser = {
      ...userData,
      password: hashedPassword,
      verificationToken,
    };

    const user = await storage.createUser(insertUser);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      const user = await storage.getUser(decoded.id);

      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('User with this email does not exist');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await storage.updateUser(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires,
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await storage.getUserByResetToken(token);
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await storage.updateUser(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    await storage.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
    });
  }

  private generateTokens(user: User): AuthTokens {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.convertTimeToSeconds(this.JWT_EXPIRES_IN),
    });

    const refreshToken = jwt.sign({ id: user.id }, this.JWT_REFRESH_SECRET, {
      expiresIn: this.convertTimeToSeconds(this.JWT_REFRESH_EXPIRES_IN),
    });

    return { accessToken, refreshToken };
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.JWT_SECRET);
  }

  async getCurrentUser(userId: number): Promise<Omit<User, 'password'>> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const authService = new AuthService();
