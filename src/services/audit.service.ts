import { getJWTToken } from '@/utils/auth.utils';
import { getBucketNameForOrganization, getBucketNameFromToken } from '@/utils/jwt.utils';
import { getCurrentOrganization, getOrganizationId } from './organization.service';

// Fallback bucket name from environment variable (for backward compatibility)
const FALLBACK_BUCKET_NAME = import.meta.env.VITE_AWS_S3_BUCKET_NAME;
const BASE_URL = import.meta.env.VITE_EXPLAIN_BACKEND_URL;

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

export interface ParseResponse {
  processed_files: string[];
  failed_files: Array<Record<string, unknown>>;
  total_chunks: number;
}

export interface GeneralLedgerResponse {
  success: boolean;
  processed_files: string[];
  failed_files: Array<Record<string, unknown>>;
  total_transactions: number;
}

export interface AuditResult {
  sourceDocs: ParseResponse;
  generalLedger: GeneralLedgerResponse;
}

export interface DeleteFilesResponse {
  success: boolean;
  deleted_files: string[];
  failed_files: string[];
}

export interface CheckFilesResponse {
  success: boolean;
  processed_files: string[];
  unprocessed_files: string[];
}

export interface SourceDocsStatus {
  status: 'in_progress' | 'success' | 'error';
  current_stage?: string;
  current_file?: string;
  processed_files?: string[];
  failed_files?: Array<Record<string, unknown>>;
  total_files?: number;
  processed_count?: number;
  progress_percentage?: number;
  start_time?: string;
  last_update_time?: string;
  error?: string;
  result?: ParseResponse;
}

export interface GeneralLedgerStatus {
  status: 'in_progress' | 'success' | 'error';
  current_stage?: string;
  current_file?: string;
  processed_files?: string[];
  failed_files?: Array<Record<string, unknown>>;
  total_files?: number;
  processed_count?: number;
  progress_percentage?: number;
  start_time?: string;
  last_update_time?: string;
  error?: string;
  result?: GeneralLedgerResponse;
}

export interface AuditProgress {
  currentFile?: string;
  progressPercentage?: number;
  currentStage?: string;
}

export const parseSourceDocs = async (prefix: string): Promise<{ workflow_key: string }> => {
  try {
    const organizationId = getOrganizationId();
    const jwtToken = getJWTToken();
    const response = await fetch(`${BASE_URL}/api/parse/source-docs/start/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        prefix,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start source documents parsing');
    }

    return await response.json();
  } catch (error) {
    console.error('Start parse source docs error:', error);
    throw new Error(
      `Failed to start source documents parsing: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const checkSourceDocsStatus = async (prefix: string): Promise<SourceDocsStatus> => {
  try {
    const organizationId = getOrganizationId();
    const jwtToken = getJWTToken();
    const response = await fetch(`${BASE_URL}/api/parse/source-docs/status/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        prefix,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check source documents status');
    }

    return await response.json();
  } catch (error) {
    console.error('Check source docs status error:', error);
    throw new Error(
      `Failed to check source documents status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const startGeneralLedger = async (prefix: string): Promise<{ workflow_key: string }> => {
  try {
    const organizationId = getOrganizationId();
    const jwtToken = getJWTToken();
    const response = await fetch(`${BASE_URL}/api/parse/general-ledger/start/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        prefix,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start general ledger parsing');
    }

    return await response.json();
  } catch (error) {
    console.error('Start general ledger error:', error);
    throw new Error(
      `Failed to start general ledger parsing: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const checkGeneralLedgerStatus = async (prefix: string): Promise<GeneralLedgerStatus> => {
  try {
    const organizationId = getOrganizationId();
    const jwtToken = getJWTToken();
    const response = await fetch(`${BASE_URL}/api/parse/general-ledger/status/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        prefix,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check general ledger status');
    }

    return await response.json();
  } catch (error) {
    console.error('Check general ledger status error:', error);
    throw new Error(`Failed to check general ledger status: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteFilesOpenSearch = async (prefix: string): Promise<DeleteFilesResponse> => {
  try {
    const organizationId = getOrganizationId();
    const jwtToken = getJWTToken();
    console.log('Deleting chunks from OpenSearch for prefix:', prefix);
    const response = await fetch(`${BASE_URL}/api/search/delete-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        prefix,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete files');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete files error:', error);
    throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const checkFilesOpenSearch = async (prefix: string): Promise<CheckFilesResponse> => {
  try {
    const organizationId = getOrganizationId();
    const jwtToken = getJWTToken();
    console.log('Found backend URL of ', BASE_URL);
    const response = await fetch(`${BASE_URL}/api/search/check-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify({
        prefix,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check files');
    }

    return await response.json();
  } catch (error) {
    console.error('Check files error:', error);
    throw new Error(`Failed to check files: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const runAudit = async (
  projectPath: string,
  onProgress?: (progress: AuditProgress) => void
): Promise<AuditResult> => {
  // Start both workflows
  await Promise.all([
    parseSourceDocs(`${projectPath}/Source Documents/`),
    startGeneralLedger(`${projectPath}/General Ledger/`),
  ]);

  // Poll for source docs status
  let sourceDocsResult: ParseResponse | null = null;
  while (!sourceDocsResult) {
    const status = await checkSourceDocsStatus(`${projectPath}/Source Documents/`);
    if (status.status === 'error') {
      throw new Error(status.error);
    }
    if (status.status === 'success') {
      sourceDocsResult = status.result ?? null;
      break;
    }
    // Report progress
    onProgress?.({
      currentFile: status.current_file,
      progressPercentage: status.progress_percentage,
      currentStage: status.current_stage,
    });
    // Wait for 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Poll for general ledger status
  let generalLedgerResult: GeneralLedgerResponse | null = null;
  while (!generalLedgerResult) {
    const status = await checkGeneralLedgerStatus(`${projectPath}/General Ledger/`);
    if (status.status === 'error') {
      throw new Error(status.error);
    }
    if (status.status === 'success') {
      generalLedgerResult = status.result ?? null;
      break;
    }
    // Report progress
    onProgress?.({
      currentFile: status.current_file,
      progressPercentage: status.progress_percentage,
      currentStage: status.current_stage,
    });
    // Wait for 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!sourceDocsResult) throw new Error('Source docs result is null');
  if (!generalLedgerResult) throw new Error('General ledger result is null');

  return {
    sourceDocs: sourceDocsResult,
    generalLedger: generalLedgerResult,
  };
};
