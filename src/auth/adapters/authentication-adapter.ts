import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';
import { extractOrganizationsFromToken } from './organization.service';
import { LoginCredentials,AuthResult } from '@/auth/lib/models';

/**
 * Supabase adapter that maintains the same interface as the existing auth flow
 * but uses Supabase under the hood.
 */
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};
const userPool = new CognitoUserPool(poolData);
// Initialize Cognito Identity client
const cognitoIdentityClient = new CognitoIdentityClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
});
export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  requiresNewPassword?: boolean;
  cognitoUser?: CognitoUser;
  organizations?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}
export const AuthenticateAdapter = {
  login : async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const authenticationDetails = new AuthenticationDetails({
      Username: credentials.email,
      Password: credentials.password,
    });
  
    const cognitoUser = new CognitoUser({
      Username: credentials.email,
      Pool: userPool,
    });
  
    try {
      const result = await new Promise<AuthResult | { requiresNewPassword: true }>((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: result => {
            const accessToken = result.getAccessToken().getJwtToken();
            const idToken = result.getIdToken().getJwtToken();
            resolve({ accessToken, idToken });
          },
          onFailure: err => reject(err),
          newPasswordRequired: (userAttributes, requiredAttributes) => {
            // Return a special response indicating new password is required
            resolve({ requiresNewPassword: true });
          },
        });
      });
  
      // If new password is required, return early
      if ('requiresNewPassword' in result) {
        return {
          success: false,
          requiresNewPassword: true,
          cognitoUser,
          error: 'New password required',
        };
      }
  
      // Get user attributes
      const attributes = await new Promise<CognitoUserAttribute[]>((resolve, reject) => {
        cognitoUser.getUserAttributes((err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      });
  
      const name = attributes.find(attr => attr.Name === 'name')?.Value || credentials.email.split('@')[0];
      const email = attributes.find(attr => attr.Name === 'email')?.Value || credentials.email;
  
      // Extract organizations from the ID token
      const organizations = extractOrganizationsFromToken(result.idToken);
  
      // Get temporary credentials using Cognito Identity
      const credentialsProvider = fromCognitoIdentityPool({
        client: cognitoIdentityClient,
        identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`]:
            result.idToken,
        },
      });
  
      // Store the credentials provider in localStorage for later use
      localStorage.setItem(
        'cognitoCredentialsProvider',
        JSON.stringify({
          identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
          region: import.meta.env.VITE_AWS_REGION,
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          idToken: result.idToken,
        })
      );
  
      return {
        success: true,
        user: {
          name,
          email,
          avatarUrl: `https://i.pravatar.cc/40?u=${email}`,
        },
        organizations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  },
  
   completeNewPasswordChallenge : async (
    cognitoUser: CognitoUser,
    newPassword: string
  ): Promise<AuthResponse> => {
    try {
      const result = await new Promise<AuthResult>((resolve, reject) => {
        cognitoUser.completeNewPasswordChallenge(
          newPassword,
          {}, // required attributes
          {
            onSuccess: result => {
              const accessToken = result.getAccessToken().getJwtToken();
              const idToken = result.getIdToken().getJwtToken();
              resolve({ accessToken, idToken });
            },
            onFailure: err => reject(err),
          }
        );
      });
  
      // Get user attributes
      const attributes = await new Promise<CognitoUserAttribute[]>((resolve, reject) => {
        cognitoUser.getUserAttributes((err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        });
      });
  
      const name = attributes.find(attr => attr.Name === 'name')?.Value || cognitoUser.getUsername().split('@')[0];
      const email = attributes.find(attr => attr.Name === 'email')?.Value || cognitoUser.getUsername();
  
      // Extract organizations from the ID token
      const organizations = extractOrganizationsFromToken(result.idToken);
  
      // Get temporary credentials using Cognito Identity
      const credentialsProvider = fromCognitoIdentityPool({
        client: cognitoIdentityClient,
        identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`]:
            result.idToken,
        },
      });
  
      // Store the credentials provider in localStorage for later use
      localStorage.setItem(
        'cognitoCredentialsProvider',
        JSON.stringify({
          identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
          region: import.meta.env.VITE_AWS_REGION,
          userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
          idToken: result.idToken,
        })
      );
  
      return {
        success: true,
        user: {
          name,
          email,
          avatarUrl: `https://i.pravatar.cc/40?u=${email}`,
        },
        organizations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set new password',
      };
    }
  },
  
  logout : async (): Promise<void> => {
    try {
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
        // Clear stored credentials and organization
        localStorage.removeItem('cognitoCredentialsProvider');
        localStorage.removeItem('currentOrganization');
      }
    } catch (error) {
      throw new Error('Logout failed');
    }
  }
}