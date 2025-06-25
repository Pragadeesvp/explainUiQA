import { Organization } from '@/auth/lib/models';
import { extractCognitoGroups } from '../lib/jwt.utils';

/**
 * Extracts organizations from Cognito groups in the JWT token
 * @param token - The JWT token containing Cognito groups
 * @returns Array of organizations
 */
export const extractOrganizationsFromToken = (token: string): Organization[] => {
  try {
    const groups = extractCognitoGroups(token);
    return groups
      .filter(group => group.startsWith('org-'))
      .map(group => {
        const orgId = group.slice(4); // Remove 'org-' prefix
        return {
          id: orgId,
          name: orgId,
          displayName: orgId.charAt(0).toUpperCase() + orgId.slice(1).replace(/-/g, ' '),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  } catch (error) {
    console.error('Failed to extract organizations from token:', error);
    return [];
  }
};

/**
 * Gets the current organization from localStorage
 * @returns The current organization or null if not set
 */
export const getCurrentOrganization = (): Organization | null => {
  try {
    const stored = localStorage.getItem('currentOrganization');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get current organization from localStorage:', error);
    return null;
  }
};

/**
 * Sets the current organization in localStorage
 * @param organization - The organization to set as current
 */
export const setCurrentOrganization = (organization: Organization): void => {
  try {
    localStorage.setItem('currentOrganization', JSON.stringify(organization));
  } catch (error) {
    console.error('Failed to set current organization in localStorage:', error);
  }
};

/**
 * Clears the current organization from localStorage
 */
export const clearCurrentOrganization = (): void => {
  try {
    localStorage.removeItem('currentOrganization');
  } catch (error) {
    console.error('Failed to clear current organization from localStorage:', error);
  }
};

/**
 * Gets the organization ID for API requests
 * @returns The current organization ID or throws an error if not set
 */
export const getOrganizationId = (): string => {
  const currentOrg = getCurrentOrganization();
  if (!currentOrg) {
    throw new Error('No organization selected. Please select an organization.');
  }
  return currentOrg.id;
};

export interface JWTPayload {
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
