import {
  login as authLogin,
  logout as authLogout,
  completeNewPasswordChallenge,
  LoginCredentials,
} from '@/services/authentication.service';
import { getBucketNameFromToken } from '@/utils/jwt.utils';
import { CognitoUser, CognitoUserAttribute, CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

// Token expiration check interval in milliseconds (check every 30 seconds)
const TOKEN_CHECK_INTERVAL = 30000;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  requiresNewPassword: boolean;
  bucketName: string | null;
  bucketNameError: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  completeNewPassword: (email: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [requiresNewPassword, setRequiresNewPassword] = useState(false);
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);
  const [bucketName, setBucketName] = useState<string | null>(null);
  const [bucketNameError, setBucketNameError] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearAuthState = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    setRequiresNewPassword(false);
    setCognitoUser(null);
    setBucketName(null);
    setBucketNameError(null);
    localStorage.removeItem('cognitoCredentialsProvider');
  }, []);

  const updateBucketName = useCallback(() => {
    try {
      const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
      if (!storedCredentials) {
        setBucketName(null);
        setBucketNameError('No credentials found');
        return;
      }

      const credentials = JSON.parse(storedCredentials);
      const bucketNameFromToken = getBucketNameFromToken(credentials.idToken);

      if (!bucketNameFromToken) {
        // Fallback to environment variable if no groups found
        const fallbackBucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
        if (!fallbackBucketName) {
          setBucketName(null);
          setBucketNameError('No bucket name found in user groups and no fallback bucket configured');
          return;
        }
        console.warn('No Cognito groups found, using fallback bucket name');
        setBucketName(fallbackBucketName);
        setBucketNameError(null);
        return;
      }

      setBucketName(bucketNameFromToken);
      setBucketNameError(null);
    } catch (err) {
      setBucketName(null);
      setBucketNameError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const checkTokenExpiration = useCallback(async () => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (!currentUser) {
        await clearAuthState();
        return false;
      }

      const session = await new Promise<CognitoUserSession>((resolve, reject) => {
        currentUser.getSession((err: any, session: any) => {
          if (err) reject(err);
          else resolve(session);
        });
      });

      if (!session.isValid()) {
        await clearAuthState();
        return false;
      }

      // Additional check for token expiration
      const accessToken = session.getAccessToken();
      const expirationTime = accessToken.getExpiration() * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      if (currentTime >= expirationTime) {
        await clearAuthState();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token expiration check failed:', error);
      await clearAuthState();
      return false;
    }
  }, [clearAuthState]);

  const handleTokenExpiration = useCallback(async () => {
    const isValid = await checkTokenExpiration();
    if (!isValid) {
      await logout();
      navigate('/login');
    }
  }, [checkTokenExpiration, navigate]);

  useEffect(() => {
    // Set up interval to check token expiration
    const intervalId = setInterval(handleTokenExpiration, TOKEN_CHECK_INTERVAL);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [handleTokenExpiration]);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
          const session = await new Promise<CognitoUserSession>((resolve, reject) => {
            cognitoUser.getSession((err: any, session: any) => {
              if (err) reject(err);
              else resolve(session);
            });
          });

          if (session.isValid()) {
            // Additional check for token expiration
            const accessToken = session.getAccessToken();
            const expirationTime = accessToken.getExpiration() * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            if (currentTime >= expirationTime) {
              await clearAuthState();
              navigate('/login');
              return;
            }

            const attributes = await new Promise<CognitoUserAttribute[]>((resolve, reject) => {
              cognitoUser.getUserAttributes((err, attributes) => {
                if (err) reject(err);
                else resolve(attributes);
              });
            });

            const name = attributes.find(attr => attr.Name === 'name')?.Value;
            const email = attributes.find(attr => attr.Name === 'email')?.Value;
            setUser({ name, email });
            setIsAuthenticated(true);
            // Update bucket name for existing session
            updateBucketName();
          } else {
            // If session is invalid on mount, clear auth state and redirect
            await clearAuthState();
            navigate('/login');
          }
        } else {
          // No user found, ensure auth state is cleared
          await clearAuthState();
        }
      } catch (error) {
        console.error('Session check failed:', error);
        await clearAuthState();
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [navigate, clearAuthState]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    setRequiresNewPassword(false);
    setCognitoUser(null);

    try {
      const response = await authLogin(credentials);

      if (response.requiresNewPassword) {
        setRequiresNewPassword(true);
        setCognitoUser(response.cognitoUser);
        setError('Please set a new password');
      } else if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user);
        // Update bucket name after successful login
        updateBucketName();
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const completeNewPassword = async (email: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!cognitoUser) {
        throw new Error('No active session found');
      }

      const response = await completeNewPasswordChallenge(cognitoUser, newPassword);

      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user);
        setRequiresNewPassword(false);
        setCognitoUser(null);
        // Update bucket name after successful password completion
        updateBucketName();
      } else {
        setError(response.error || 'Failed to set new password');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await authLogout();
      await clearAuthState();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verify = async () => {
    setIsLoading(true);
    try {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        const session = await new Promise<CognitoUserSession>((resolve, reject) => {
          cognitoUser.getSession((err: any, session: any) => {
            if (err) reject(err);
            else resolve(session);
          });
        });
        if (session.isValid()) {
          setIsAuthenticated(true);
          // Optionally update user info here
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setLoading = (loading: boolean) => setIsLoading(loading);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        user,
        requiresNewPassword,
        bucketName,
        bucketNameError,
        login,
        completeNewPassword,
        logout,
        verify,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
