export interface Organization {
  id: string;
  name: string;
  displayName: string;
}

export interface OrganizationContext {
  currentOrganization: Organization | null;
  availableOrganizations: Organization[];
  setCurrentOrganization: (organization: Organization) => void;
  isLoading: boolean;
  error: string | null;
}
