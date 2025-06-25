interface JWTPayload {
  sub: string;
  aud: string;
  email_verified: boolean;
  event_id: string;
  token_use: string;
  auth_time: number;
  iss: string;
  'cognito:groups'?: string[];
  'cognito:username': string;
  exp: number;
  iat: number;
  email: string;
  name?: string;
}

/**
 * Decodes a JWT token and returns the payload
 * @param token - The JWT token to decode
 * @returns The decoded payload
 */
export const decodeJWT = (token: string): JWTPayload => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decodedPayload);
  } catch (error) {
    throw new Error(`Failed to decode JWT token: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Extracts the Cognito groups from a JWT token
 * @param token - The JWT token to extract groups from
 * @returns Array of group names or empty array if no groups
 */
export const extractCognitoGroups = (token: string): string[] => {
  try {
    const payload = decodeJWT(token);
    return payload['cognito:groups'] || [];
  } catch (error) {
    console.error('Failed to extract Cognito groups:', error);
    return [];
  }
};

/**
 * Converts a Cognito group name to a bucket name
 * @param groupName - The Cognito group name (e.g., "org-organization-name")
 * @returns The corresponding bucket name (e.g., "organization-name-bucket")
 */
export const groupToBucketName = (groupName: string): string => {
  // Remove "org-" prefix if present
  const nameWithoutPrefix = groupName.startsWith('org-') ? groupName.slice(4) : groupName;
  // Convert to bucket name format
  return `${nameWithoutPrefix}-bucket`;
};

/**
 * Gets the bucket name from a JWT token by extracting the first Cognito group
 * @param token - The JWT token
 * @returns The bucket name or null if no groups found
 */
export const getBucketNameFromToken = (token: string): string | null => {
  const groups = extractCognitoGroups(token);
  if (groups.length === 0) {
    return null;
  }

  // Use the first group to determine the bucket name
  return groupToBucketName(groups[0]);
};

/**
 * Gets the bucket name for a specific organization from a JWT token
 * @param token - The JWT token
 * @param organizationId - The organization ID to get the bucket for
 * @returns The bucket name or null if organization not found
 */
export const getBucketNameForOrganization = (token: string, organizationId: string): string | null => {
  const groups = extractCognitoGroups(token);
  const orgGroup = groups.find(group => group === `org-${organizationId}`);

  if (!orgGroup) {
    return null;
  }

  return groupToBucketName(orgGroup);
};
