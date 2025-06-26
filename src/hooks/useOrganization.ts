import {
    clearCurrentOrganization,
    extractOrganizationsFromToken,
    getCurrentOrganization,
    setCurrentOrganization as setCurrentOrg,
} from '@/services/organization.service';
import { Organization } from '@/model/organization.types';
import { useCallback, useEffect, useState } from 'react';

export const useOrganization = () => {
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize organizations from stored credentials
  const initializeOrganizations = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Get stored credentials
      const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
      if (!storedCredentials) {
        setError('No credentials found. Please log in.');
        setIsLoading(false);
        return;
      }

      const credentials = JSON.parse(storedCredentials);
      const organizations = extractOrganizationsFromToken(credentials.idToken);

      if (organizations.length === 0) {
        setError('No organizations found in user groups.');
        setIsLoading(false);
        return;
      }

      setAvailableOrganizations(organizations);

      // Get current organization from localStorage
      const storedOrg = getCurrentOrganization();

      if (storedOrg) {
        // Verify the stored organization is still available
        const isStillAvailable = organizations.some(org => org.id === storedOrg.id);
        if (isStillAvailable) {
          setCurrentOrganizationState(storedOrg);
        } else {
          // Stored organization is no longer available, clear it
          clearCurrentOrganization();
          setCurrentOrganizationState(null);
        }
      } else {
        // No stored organization, select the first one (lowest precedence)
        const firstOrg = organizations[0];
        setCurrentOrganizationState(firstOrg);
        setCurrentOrg(firstOrg);
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize organizations');
      setIsLoading(false);
    }
  }, []);

  // Set current organization
  const setCurrentOrganization = useCallback((organization: Organization) => {
    setCurrentOrganizationState(organization);
    setCurrentOrg(organization);
  }, []);

  // Clear current organization
  const clearOrganization = useCallback(() => {
    setCurrentOrganizationState(null);
    clearCurrentOrganization();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeOrganizations();
  }, [initializeOrganizations]);

  return {
    currentOrganization,
    availableOrganizations,
    setCurrentOrganization,
    clearOrganization,
    isLoading,
    error,
    refreshOrganizations: initializeOrganizations,
  };
};
