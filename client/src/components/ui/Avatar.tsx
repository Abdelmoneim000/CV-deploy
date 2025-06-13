import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Camera, Upload, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '@/hooks/useAuth';

interface AvatarProps {
  size?: number;
  editable?: boolean;
  onAvatarChange?: (newAvatarUrl: string | null) => void;
  className?: string;
}

// Global cache for avatar management
class AvatarCache {
  private static instance: AvatarCache;
  private cache = new Map<string, string | null>();
  private timestamps = new Map<string, number>();
  private subscribers = new Map<string, Set<(url: string | null) => void>>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly STORAGE_PREFIX = 'avatarCache_';

  static getInstance(): AvatarCache {
    if (!AvatarCache.instance) {
      AvatarCache.instance = new AvatarCache();
    }
    return AvatarCache.instance;
  }

  private getCacheKey(userId: string, role: string): string {
    return `${userId}_${role}`;
  }

  private isValid(key: string): boolean {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  // Subscribe to avatar changes
  subscribe(
    userId: string,
    role: string,
    callback: (url: string | null) => void
  ): () => void {
    const key = this.getCacheKey(userId, role);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notify all subscribers
  private notify(key: string, url: string | null): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach((callback) => callback(url));
    }
  }

  // Get avatar from cache
  get(userId: string, role: string): string | null | undefined {
    const key = this.getCacheKey(userId, role);

    // Check memory cache first
    if (this.isValid(key) && this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (stored) {
        const { url, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          // Restore to memory cache
          this.cache.set(key, url);
          this.timestamps.set(key, timestamp);
          return url;
        } else {
          // Clean expired cache
          localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return undefined; // Cache miss
  }

  // Set avatar in cache
  set(userId: string, role: string, url: string | null): void {
    const key = this.getCacheKey(userId, role);
    const timestamp = Date.now();

    // Update memory cache
    this.cache.set(key, url);
    this.timestamps.set(key, timestamp);

    // Update localStorage
    try {
      localStorage.setItem(
        `${this.STORAGE_PREFIX}${key}`,
        JSON.stringify({
          url,
          timestamp,
        })
      );
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }

    // Notify subscribers
    this.notify(key, url);
  }

  // Clear cache for user
  clear(userId: string, role: string): void {
    const key = this.getCacheKey(userId, role);
    this.cache.delete(key);
    this.timestamps.delete(key);

    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    this.notify(key, null);
  }

  // Check if data is being fetched to prevent duplicate requests
  private fetchingKeys = new Set<string>();

  isFetching(userId: string, role: string): boolean {
    const key = this.getCacheKey(userId, role);
    return this.fetchingKeys.has(key);
  }

  setFetching(userId: string, role: string, fetching: boolean): void {
    const key = this.getCacheKey(userId, role);
    if (fetching) {
      this.fetchingKeys.add(key);
    } else {
      this.fetchingKeys.delete(key);
    }
  }
}

// Hook for using avatar cache
function useAvatarCache(userId?: string, role?: string) {
  const cache = AvatarCache.getInstance();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !role) {
      setIsLoading(false);
      return;
    }

    // Subscribe to cache changes
    const unsubscribe = cache.subscribe(userId, role, (url) => {
      setAvatarUrl(url);
      setIsLoading(false);
    });

    // Check cache first
    const cachedUrl = cache.get(userId, role);
    if (cachedUrl !== undefined) {
      setAvatarUrl(cachedUrl);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    return unsubscribe;
  }, [userId, role, cache]);

  return { avatarUrl, isLoading, cache };
}

const Avatar: React.FC<AvatarProps> = ({
  size = 64,
  editable = false,
  onAvatarChange,
  className = '',
}) => {
  const { user, tokens } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the cache hook
  const {
    avatarUrl,
    isLoading: isCacheLoading,
    cache,
  } = useAvatarCache(user?.id?.toString(), user?.role);

  // Memoize expensive calculations
  const memoizedValues = useMemo(() => {
    const getUserInitials = () => {
      if (!user?.firstName && !user?.lastName) return 'U';
      return `${user?.firstName?.[0] || ''}${
        user?.lastName?.[0] || ''
      }`.toUpperCase();
    };

    const getAltText = () => {
      if (user?.firstName && user?.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return user?.username || 'User Avatar';
    };

    const getAvatarDisplayUrl = (avatarPath: string | null) => {
      if (!avatarPath) return null;
      if (
        avatarPath.startsWith('http://') ||
        avatarPath.startsWith('https://')
      ) {
        return avatarPath;
      }
      const baseUrl = 'http://localhost:8888';
      return `${baseUrl}${avatarPath}`;
    };

    return {
      initials: getUserInitials(),
      altText: getAltText(),
      displayUrl: getAvatarDisplayUrl(avatarUrl),
    };
  }, [user?.firstName, user?.lastName, user?.username, avatarUrl]);

  // Memoize size calculations
  const sizeConfig = useMemo(
    () => ({
      cameraSize: Math.max(12, size * 0.15),
      cameraButtonSize: Math.max(20, size * 0.25),
      userIconSize: Math.max(16, size * 0.5),
      spinnerSize: Math.max(16, size * 0.25),
    }),
    [size]
  );

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

  // Fetch avatar only if not in cache and not already fetching
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id || !user?.role || !tokens?.accessToken) return;

      const userId = user.id.toString();
      const role = user.role;

      // Check if already fetching to prevent duplicate requests
      if (cache.isFetching(userId, role)) return;

      // Check if we have cached data
      const cachedUrl = cache.get(userId, role);
      if (cachedUrl !== undefined) return;

      cache.setFetching(userId, role, true);

      try {
        const endpoint =
          role === 'candidate' ? '/api/profiles/candidate' : '/api/profiles/hr';

        const response = await makeAuthenticatedRequest(endpoint);

        if (response.ok) {
          const data = await response.json();
          const avatarUrl =
            data.success && data.data.profile
              ? data.data.profile.avatar || null
              : null;

          cache.set(userId, role, avatarUrl);
        } else {
          console.error('Failed to fetch user profile');
          cache.set(userId, role, null);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
        cache.set(userId, role, null);
      } finally {
        cache.setFetching(userId, role, false);
      }
    };

    fetchUserAvatar();
  }, [user?.id, user?.role, tokens?.accessToken, cache]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (isUploading || !editable || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setShowAvatarMenu(false);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const endpoint =
        user.role === 'candidate'
          ? '/api/profiles/candidate/avatar'
          : '/api/profiles/hr/avatar';

      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.avatarUrl) {
          const newAvatarUrl = data.data.avatarUrl;

          // Update cache
          cache.set(user.id.toString(), user.role, newAvatarUrl);

          onAvatarChange?.(newAvatarUrl);
          toast.success('Avatar updated successfully');
        } else {
          toast.error('Avatar upload succeeded but no URL returned');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAvatar = async () => {
    if (isUploading || !editable || !user) return;

    setIsUploading(true);
    setShowAvatarMenu(false);

    try {
      const endpoint =
        user.role === 'candidate'
          ? '/api/profiles/candidate/avatar'
          : '/api/profiles/hr/avatar';

      const response = await makeAuthenticatedRequest(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update cache
        cache.set(user.id.toString(), user.role, null);

        onAvatarChange?.(null);
        toast.success('Avatar removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!editable) return;
    setShowAvatarMenu(false);
    fileInputRef.current?.click();
  };

  const handleAvatarClick = () => {
    if (editable) {
      setShowAvatarMenu(!showAvatarMenu);
    }
  };

  const isLoadingState = isCacheLoading || isUploading;

  // Memoize the avatar container to prevent unnecessary re-renders
  const avatarContainer = useMemo(
    () => (
      <div
        className={`bg-primary/10 rounded-full flex items-center justify-center overflow-hidden ${
          editable ? 'cursor-pointer' : ''
        }`}
        style={{ width: size, height: size }}
        onClick={editable ? handleAvatarClick : undefined}
      >
        {isLoadingState ? (
          <div
            className="border-2 border-primary border-t-transparent rounded-full animate-spin"
            style={{
              width: sizeConfig.spinnerSize,
              height: sizeConfig.spinnerSize,
            }}
          />
        ) : memoizedValues.displayUrl ? (
          <img
            src={memoizedValues.displayUrl}
            alt={memoizedValues.altText}
            className="w-full h-full object-cover"
            onError={() => {
              console.error(
                'Avatar failed to load:',
                memoizedValues.displayUrl
              );
              if (user) {
                cache.clear(user.id.toString(), user.role);
              }
              if (editable) {
                toast.error('Failed to load avatar image');
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {memoizedValues.initials !== 'U' ? (
              <span
                className="text-primary font-medium"
                style={{ fontSize: Math.max(12, size * 0.25) }}
              >
                {memoizedValues.initials}
              </span>
            ) : (
              <User className="text-primary" size={sizeConfig.userIconSize} />
            )}
          </div>
        )}
      </div>
    ),
    [
      size,
      editable,
      isLoadingState,
      memoizedValues,
      sizeConfig,
      handleAvatarClick,
      user,
      cache,
    ]
  );

  return (
    <div className={`relative inline-block ${className}`}>
      {avatarContainer}

      {/* Camera Button - Only show when editable */}
      {editable && (
        <button
          onClick={handleAvatarClick}
          disabled={isLoadingState}
          className="absolute bg-primary rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          style={{
            width: sizeConfig.cameraButtonSize,
            height: sizeConfig.cameraButtonSize,
            bottom: -2,
            right: -2,
          }}
          title={
            isUploading
              ? 'Uploading...'
              : isCacheLoading
              ? 'Loading...'
              : 'Change avatar'
          }
        >
          {isUploading ? (
            <div
              className="border-2 border-white border-t-transparent rounded-full animate-spin"
              style={{
                width: sizeConfig.cameraSize * 0.6,
                height: sizeConfig.cameraSize * 0.6,
              }}
            />
          ) : (
            <Camera size={sizeConfig.cameraSize} />
          )}
        </button>
      )}

      {/* Avatar Menu - Only show when editable */}
      {editable && showAvatarMenu && (
        <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[180px]">
          <div className="p-1">
            <button
              onClick={triggerFileInput}
              disabled={isUploading}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{avatarUrl ? 'Change Avatar' : 'Upload Avatar'}</span>
            </button>

            {avatarUrl && (
              <button
                onClick={removeAvatar}
                disabled={isUploading}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Avatar</span>
              </button>
            )}

            <button
              onClick={() => setShowAvatarMenu(false)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input - Only when editable */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {/* Click Outside Handler - Only when editable */}
      {editable && showAvatarMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAvatarMenu(false)}
        />
      )}
    </div>
  );
};

export default React.memo(Avatar);
