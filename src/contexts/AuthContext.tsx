import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login as apiLogin,
  logout as apiLogout,
  completeNewPasswordChallenge,
  LoginCredentials,
  AuthResponse,
} from '@/services/authentication.service';
import { CognitoUser, CognitoUserPool, CognitoUserAttribute, CognitoUserSession } from 'amazon-cognito-identity-js';
import { getBucketNameFromToken } from '@/utils/jwt.utils';

// --- Configuration ---
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

const userPool = new CognitoUserPool(poolData);

// Token expiration check interval in milliseconds (check every 30 seconds)
const TOKEN_CHECK_INTERVAL = 30000;

// --- Interfaces ---
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: { name: string; email: string } | null;
  requiresNewPassword: boolean;
  bucketName: string | null;
  bucketNameError: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// --- Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
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
        currentUser.getSession((err, session) => {
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
    return () => clearInterval(intervalId);
  }, [handleTokenExpiration]);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
          const session = await new Promise<CognitoUserSession>((resolve, reject) => {
            cognitoUser.getSession((err, session) => {
              if (err) reject(err);
              else resolve(session);
            });
          });

          if (session.isValid()) {
            // Additional check for token expiration
            const accessToken = session.getAccessToken();
            const expirationTime = accessToken.getExpiration() * 1000;
            const currentTime = Date.now();

            if (currentTime >= expirationTime) {
              await clearAuthState();
              navigate('/login');
              return;
            }

            const attributes = await new Promise<CognitoUserAttribute[]>((resolve, reject) => {
              cognitoUser.getUserAttributes((err, attributes) => {
                if (err) reject(err);
                else resolve(attributes || []);
              });
            });

            const name = attributes.find(attr => attr.Name === 'name')?.Value || '';
            const email = attributes.find(attr => attr.Name === 'email')?.Value || '';
            setUser({ name, email });
            setIsAuthenticated(true);
            updateBucketName();
          } else {
            await clearAuthState();
            navigate('/login');
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Session check failed:', error);
        await clearAuthState();
        setIsLoading(false);
      }
    };
    checkSession();
  }, [clearAuthState, navigate, updateBucketName]);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiLogin(credentials);
      if (response.success) {
        setUser(response.user || null);
        setIsAuthenticated(true);
        updateBucketName();
        navigate('/dashboard');
      } else if (response.requiresNewPassword) {
        setRequiresNewPassword(true);
        setCognitoUser(response.cognitoUser || null);
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const completeNewPassword = async (newPassword: string) => {
    if (!cognitoUser) {
      setError('No user found to update password.');
      return;
    }
    setIsLoading(true);
    const response = await completeNewPasswordChallenge(cognitoUser, newPassword);
    if (response.success && response.user) {
      setUser(response.user);
      setIsAuthenticated(true);
      setRequiresNewPassword(false);
      updateBucketName();
      navigate('/dashboard');
    } else {
      setError(response.error || 'Failed to set new password.');
    }
    setIsLoading(false);
  };

  const logout = async () => {
    await apiLogout();
    await clearAuthState();
    navigate('/login');
  };

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 