import React, { createContext, useEffect, useReducer, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'hr';
  isVerified: boolean;
  lastLogin?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: AuthTokens }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
};

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'hr';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'REFRESH_TOKEN':
      return {
        ...state,
        tokens: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage or sessionStorage - SIMPLIFIED
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Only check for access token and user
        const storedAccessToken =
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');
        const storedUser =
          localStorage.getItem('user') || sessionStorage.getItem('user');

        if (storedAccessToken && storedUser) {
          const tokens: AuthTokens = {
            accessToken: storedAccessToken,
            refreshToken: '', // Empty since we don't store it
          };
          const user: User = JSON.parse(storedUser);

          // Simply restore the stored state without API verification
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, tokens },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear corrupted data - including legacy tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken'); // Remove legacy
        localStorage.removeItem('authTokens'); // Remove legacy
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refreshToken'); // Remove legacy
        sessionStorage.removeItem('authTokens'); // Remove legacy
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []); // Empty dependency array to run only once

  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const { user, tokens } = data;

      // Only store access token and user
      if (rememberMe) {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        // Clear sessionStorage to avoid conflicts
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        // Clean up legacy tokens if they exist
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authTokens');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('authTokens');
      } else {
        // Store in sessionStorage for session-only persistence
        sessionStorage.setItem('accessToken', tokens.accessToken);
        sessionStorage.setItem('user', JSON.stringify(user));
        // Clear localStorage to avoid conflicts
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Clean up legacy tokens if they exist
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authTokens');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('authTokens');
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();

      // Auto-login after successful registration
      const { user, tokens } = data;

      // Only store access token and user
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      // Clean up legacy tokens if they exist
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authTokens');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('authTokens');

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint if token exists
      if (state.tokens?.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear storage and state regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      // Clean up legacy tokens if they exist
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authTokens');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('authTokens');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshTokenApi = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const newTokens = data.tokens;

      // Update only the access token in storage
      const isInLocalStorage = localStorage.getItem('accessToken');
      if (isInLocalStorage) {
        localStorage.setItem('accessToken', newTokens.accessToken);
      } else {
        sessionStorage.setItem('accessToken', newTokens.accessToken);
      }

      dispatch({
        type: 'REFRESH_TOKEN',
        payload: newTokens,
      });

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!state.tokens?.refreshToken) {
      return false;
    }

    return await refreshTokenApi(state.tokens.refreshToken);
  };

  const value: AuthContextType = {
    ...state,
    loading: state.isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider, AuthContext };
export type { User, AuthTokens, RegisterData };
