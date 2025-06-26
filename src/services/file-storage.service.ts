import { getBucketNameForOrganization, getBucketNameFromToken } from '@/utils/jwt.utils';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { logout } from './authentication.service';
import { getCredentialsProvider } from './aws-credentials.service';
import { getCurrentOrganization } from './organization.service';

// Fallback bucket name from environment variable (for backward compatibility)
const FALLBACK_BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME;

/**
 * Gets the bucket name from the stored credentials
 * @returns The bucket name or throws an error if not found
 */
const getBucketName = (): string => {
  const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
  if (!storedCredentials) {
    throw new Error('No credentials found. Please log in.');
  }

  const credentials = JSON.parse(storedCredentials);

  // Get current organization
  const currentOrg = getCurrentOrganization();

  let bucketName: string | null;

  if (currentOrg) {
    // Use the current organization to get the bucket name
    bucketName = getBucketNameForOrganization(credentials.idToken, currentOrg.id);
  } else {
    // Fallback to the first group (backward compatibility)
    bucketName = getBucketNameFromToken(credentials.idToken);
  }

  if (!bucketName) {
    // Fallback to environment variable if no groups found
    if (!FALLBACK_BUCKET_NAME) {
      throw new Error('No bucket name found in user groups and no fallback bucket configured');
    }
    console.warn('No Cognito groups found, using fallback bucket name');
    return FALLBACK_BUCKET_NAME;
  }

  return bucketName;
};

const getS3Client = async () => {
  const credentialsProvider = await getCredentialsProvider();
  return new S3Client({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials: credentialsProvider,
  });
};

const handleAuthError = (error: unknown) => {
  if (
    (error as { name?: string })?.name === 'NotAuthorizedException' ||
    (error as { message?: string })?.message?.includes('Invalid login token') ||
    (error as { message?: string })?.message?.includes('Token expired')
  ) {
    // Clear auth state and redirect to login
    logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }
  throw error;
};

export const listFolders = async (path: string): Promise<{ name: string; fullPath: string }[]> => {
  try {
    console.log('Listing folders for path:', path);
    // Ensure path ends with a slash if it's not empty
    const prefix = path ? (path.endsWith('/') ? path : `${path}/`) : '';

    const s3Client = await getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: prefix,
      Delimiter: '/',
    });

    const response = await s3Client.send(command);
    console.log('S3 Response:', response);

    return (
      response.CommonPrefixes?.map(prefix => ({
        name: prefix.Prefix?.split('/').filter(Boolean).pop() || '',
        fullPath: prefix.Prefix || '',
      })).filter(item => item.name) || []
    );
  } catch (error) {
    console.error('Error listing folders:', error);
    handleAuthError(error);
    throw new Error(`Failed to list folders: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const listFiles = async (path: string): Promise<{ name: string; fullPath: string }[]> => {
  try {
    console.log('Listing files for path:', path);
    const s3Client = await getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: path,
    });

    const response = await s3Client.send(command);
    console.log('S3 Response:', response);
    return (
      response.Contents?.map(item => ({
        name: item.Key?.split('/').pop() || '',
        fullPath: item.Key || '',
      })).filter(item => item.name) || []
    );
  } catch (error) {
    console.error('Error listing files:', error);
    handleAuthError(error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createFolder = async (path: string): Promise<boolean> => {
  try {
    console.log('Creating folder at path:', path);
    // In S3, folders are created by adding a trailing slash
    const folderPath = path.endsWith('/') ? path : `${path}/`;

    const s3Client = await getS3Client();
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: folderPath,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error creating folder:', error);
    handleAuthError(error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const uploadFile = async (path: string, file: File): Promise<boolean> => {
  try {
    console.log('Uploading file:', file.name, 'to path:', path);
    const filePath = path.endsWith('/') ? `${path}${file.name}` : `${path}/${file.name}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    const s3Client = await getS3Client();
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: filePath,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    handleAuthError(error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    console.log('Deleting file from S3:', filePath);
    const s3Client = await getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: filePath,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Failed to delete file:', error);
    handleAuthError(error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteFolder = async (path: string): Promise<boolean> => {
  try {
    console.log('Deleting folder at path:', path);
    // Ensure path ends with a slash
    const folderPath = path.endsWith('/') ? path : `${path}/`;

    const s3Client = await getS3Client();
    // First, list all objects in the folder
    const listCommand = new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: folderPath,
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    if (objects.length === 0) {
      // If no objects found, just delete the folder marker
      const deleteCommand = new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: folderPath,
      });
      await s3Client.send(deleteCommand);
      return true;
    }

    // Delete all objects in the folder
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: getBucketName(),
      Delete: {
        Objects: objects.map(obj => ({ Key: obj.Key || '' })),
      },
    });

    await s3Client.send(deleteCommand);
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    handleAuthError(error);
    throw new Error(`Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`);
  }
};
