import { getBucketNameFromToken } from '@/utils/jwt.utils';
import { useEffect, useState } from 'react';

interface UseBucketNameReturn {
  bucketName: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Custom hook to get the bucket name from the user's Cognito groups
 * @returns Object containing bucket name, loading state, error, and refresh function
 */
export const useBucketName = (): UseBucketNameReturn => {
  const [bucketName, setBucketName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getBucketName = () => {
    try {
      const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
      if (!storedCredentials) {
        throw new Error('No credentials found. Please log in.');
      }

      const credentials = JSON.parse(storedCredentials);
      const bucketNameFromToken = getBucketNameFromToken(credentials.idToken);

      if (!bucketNameFromToken) {
        // Fallback to environment variable if no groups found
        const fallbackBucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
        if (!fallbackBucketName) {
          throw new Error('No bucket name found in user groups and no fallback bucket configured');
        }
        console.warn('No Cognito groups found, using fallback bucket name');
        return fallbackBucketName;
      }

      return bucketNameFromToken;
    } catch (err) {
      throw new Error(`Failed to get bucket name: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const refresh = () => {
    setIsLoading(true);
    setError(null);

    try {
      const name = getBucketName();
      setBucketName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBucketName(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    bucketName,
    isLoading,
    error,
    refresh,
  };
};
