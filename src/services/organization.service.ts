import { Organization } from '@/model/organization.types';
import { extractCognitoGroups } from '@/utils/jwt.utils';
import { getJWTToken } from '@/utils/auth.utils';
import { MenuConfig, MenuItem } from '@/config/types';
import { UserCircle, LayoutGrid, FolderOpen } from 'lucide-react';

/**
 * Extracts organizations from Cognito groups in the JWT token
 * @param token - The JWT token containing Cognito groups
 * @returns Array of organizations
 */
export const extractOrganizationsFromToken = (token: string): Organization[] => {
  try {
    let groups: string[] = [];
    // Check if token is a JWT (three parts separated by dots)
    if (token.split('.').length === 3) {
      // Use the normal JWT extraction
      groups = extractCognitoGroups(token);
    } else {
      // Try to decode as base64-encoded JSON (simulation mode)
      try {
        const decoded = atob(token);
        const payload = JSON.parse(decoded);
        groups = payload['cognito:groups'] || [];
      } catch (e) {
        console.error('Failed to decode simulated token:', e);
        groups = [];
      }
    }
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
    // const stored = localStorage.getItem('currentOrganization');
    const stored = "explain-staging";
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
    // Trigger menu refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('organizationChanged', { detail: organization }));
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

/**
 * Converts organizations to menu items
 * @param organizations - Array of organizations
 * @returns MenuConfig array
 */
export const convertOrganizationsToMenuItems = (organizations: Organization[]): MenuConfig => {
  return organizations.map((org) => ({
    title: 'Projects',
    icon: UserCircle,
    children: [
      {
        title: 'FY04',
        icon: LayoutGrid,
        path: `/${org.id}/fy04`,
      },
      {
        title: 'Output',
        icon: LayoutGrid,
        path: `/${org.id}/output`,
      },
      {
        title: 'Folders',
        icon: FolderOpen,
        children: [
          {
            title: 'Documents',
            path: `/${org.id}/folders/documents`,
          },
          {
            title: 'Reports',
            path: `/${org.id}/folders/reports`,
          },
          {
            title: 'Analytics',
            path: `/${org.id}/folders/analytics`,
          },
        ],
      },
    ],
  }));
};

/**
 * Gets sidebar menu items from organizations
 * @returns Promise<MenuConfig>
 */
export const getSidebarMenu = async (): Promise<MenuConfig> => {
  try {
    // Get token from localStorage or wherever it's stored
    //  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const token = getJWTToken();
    if (!token) {
      console.warn('No token found, returning empty menu');
      return [];
    }

    // Extract organizations from token
    const organizations = extractOrganizationsFromToken(token);

    // Convert to menu items
    const menuItems = convertOrganizationsToMenuItems(organizations);

    // Add dashboard at the top
    const dashboardMenu: MenuItem = {
      title: 'Dashboard',
      icon: LayoutGrid,
      path: '/dashboard',
    };

    return [dashboardMenu, ...menuItems];
  } catch (error) {
    console.error('Failed to generate sidebar menu from organizations:', error);
    return [];
  }
};

/**
 * Gets mega menu items (simplified version)
 * @returns Promise<MenuConfig>
 */
export const getMegaMenu = async (): Promise<MenuConfig> => {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');

    if (!token) {
      return [];
    }

    const organizations = extractOrganizationsFromToken(token);

    return organizations.slice(0, 5).map((org) => ({
      title: org.displayName,
      icon: UserCircle,
      path: `/${org.id}`,
    }));
  } catch (error) {
    console.error('Failed to generate mega menu from organizations:', error);
    return [];
  }
};

/**
 * Gets root menu items
 * @returns Promise<MenuConfig>
 */
export const getRootMenu = async (): Promise<MenuConfig> => {
  return [
    {
      title: 'Home',
      path: '/',
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
    },
  ];
};

/**
 * Simulates setting organizations for testing (when no JWT token is available)
 * @param orgNames - Array of organization names to simulate
 */
export const simulateOrganizations = (orgNames: string[]): void => {
  const mockToken = btoa(JSON.stringify({
    'cognito:groups': orgNames.map(name => `org-${name.toLowerCase().replace(/\s+/g, '-')}`),
    exp: Date.now() / 1000 + 3600, // 1 hour from now
  }));

  localStorage.setItem('access_token', mockToken);

  // Trigger menu refresh
  window.dispatchEvent(new CustomEvent('organizationChanged', {
    detail: { simulated: true, organizations: orgNames }
  }));
};

// Make simulation function available globally for testing
if (typeof window !== 'undefined') {
  (window as any).simulateOrganizations = simulateOrganizations;
}

// Create a menu service object for compatibility
export const menuService = {
  getSidebarMenu,
  getMegaMenu,
  getRootMenu,
  clearCache: () => {
    // Clear any cached data if needed
    console.log('Menu cache cleared');
  },
};
