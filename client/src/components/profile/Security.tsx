import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import useAuth from '@/hooks/useAuth';
import { Key } from 'lucide-react';

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

interface PasswordResetData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Security = () => {
  const [passwordData, setPasswordData] = useState<PasswordResetData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<PasswordResetData>
  >({});
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { user: authUser, loading: authLoading, tokens } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);

  const validatePasswordForm = (): boolean => {
    const errors: Partial<PasswordResetData> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {}
  ) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${tokens?.accessToken || ''}`,
      },
    });
  };

  const handlePasswordReset = async () => {
    if (isUpdating || !validatePasswordForm()) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const response = await makeAuthenticatedRequest(
        '/api/auth/change-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (response.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors({});
        setMessage({ type: 'success', text: 'Password updated successfully' });
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.message || 'Failed to update password',
        });
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Security Settings
      </h2>

      {/* Password Change */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-md font-medium text-foreground mb-4">
          Change Password
        </h3>
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => {
              setPasswordData({
                ...passwordData,
                currentPassword: e.target.value,
              });
              if (passwordErrors.currentPassword) {
                setPasswordErrors({
                  ...passwordErrors,
                  currentPassword: undefined,
                });
              }
            }}
            error={passwordErrors.currentPassword}
            disabled={isUpdating}
          />

          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => {
              setPasswordData({
                ...passwordData,
                newPassword: e.target.value,
              });
              if (passwordErrors.newPassword) {
                setPasswordErrors({
                  ...passwordErrors,
                  newPassword: undefined,
                });
              }
            }}
            error={passwordErrors.newPassword}
            helperText="Password must be at least 6 characters long"
            disabled={isUpdating}
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => {
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value,
              });
              if (passwordErrors.confirmPassword) {
                setPasswordErrors({
                  ...passwordErrors,
                  confirmPassword: undefined,
                });
              }
            }}
            error={passwordErrors.confirmPassword}
            disabled={isUpdating}
          />

          <Button
            onClick={handlePasswordReset}
            loading={isUpdating}
            loadingText="Updating..."
            className="mt-4"
          >
            <Key className="w-4 h-4" />
            Update Password
          </Button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-md font-medium text-foreground mb-4">
          Account Information
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Last Login:</strong>{' '}
            {user?.lastLogin
              ? new Date(user.lastLogin).toLocaleString()
              : 'Never'}
          </p>
          <p>
            <strong>Account Status:</strong> Active
          </p>
          <p>
            <strong>Two-Factor Authentication:</strong> Disabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default Security;
