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
