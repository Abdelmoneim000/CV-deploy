import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly avatarDir = path.join(this.uploadDir, 'avatars');
  private readonly companyLogosDir = path.join(this.uploadDir, 'company-logos');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor() {
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.avatarDir, { recursive: true });
      await fs.mkdir(this.companyLogosDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  // Multer configuration for image uploads
  getAvatarUpload() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
        }
      },
    });
  }

  // Process and save avatar image
  async processAvatar(
    buffer: Buffer,
    originalName: string,
    userId: number
  ): Promise<UploadedFile> {
    const fileId = uuidv4();
    const extension = '.jpg'; // Always convert to JPEG
    const filename = `avatar_${userId}_${fileId}${extension}`;
    const filepath = path.join(this.avatarDir, filename);

    try {
      // Process image with Sharp - optimize for avatars
      await sharp(buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toFile(filepath);

      const stats = await fs.stat(filepath);
      const url = `/uploads/avatars/${filename}`;

      return {
        id: fileId,
        originalName,
        filename,
        path: filepath,
        url,
        size: stats.size,
        mimetype: 'image/jpeg',
      };
    } catch (error) {
      console.error('Error processing avatar:', error);
      throw new Error('Failed to process avatar image');
    }
  }

  // Process and save company logo
  async processCompanyLogo(
    buffer: Buffer,
    originalName: string,
    companyId: string
  ): Promise<UploadedFile> {
    const fileId = uuidv4();
    const extension = '.jpg';
    const filename = `logo_${companyId}_${fileId}${extension}`;
    const filepath = path.join(this.companyLogosDir, filename);

    try {
      // Process image with Sharp - optimize for logos
      await sharp(buffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 95 })
        .toFile(filepath);

      const stats = await fs.stat(filepath);
      const url = `/uploads/company-logos/${filename}`;

      return {
        id: fileId,
        originalName,
        filename,
        path: filepath,
        url,
        size: stats.size,
        mimetype: 'image/jpeg',
      };
    } catch (error) {
      console.error('Error processing company logo:', error);
      throw new Error('Failed to process company logo');
    }
  }

  // Delete avatar file
  async deleteAvatar(filename: string): Promise<void> {
    if (!filename) return;

    try {
      const filepath = path.join(this.avatarDir, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  }

  // Delete company logo file
  async deleteCompanyLogo(filename: string): Promise<void> {
    if (!filename) return;

    try {
      const filepath = path.join(this.companyLogosDir, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting company logo:', error);
    }
  }

  // Get file info
  async getFileInfo(filename: string, type: 'avatar' | 'logo'): Promise<{ exists: boolean; size?: number }> {
    try {
      const dir = type === 'avatar' ? this.avatarDir : this.companyLogosDir;
      const filepath = path.join(dir, filename);
      const stats = await fs.stat(filepath);
      return { exists: true, size: stats.size };
    } catch (error) {
      return { exists: false };
    }
  }

  // Clean up old files (utility method)
  async cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const directories = [this.avatarDir, this.companyLogosDir];
      const now = Date.now();

      for (const dir of directories) {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filepath = path.join(dir, file);
          const stats = await fs.stat(filepath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filepath);
            console.log(`Cleaned up old file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const uploadService = new UploadService();