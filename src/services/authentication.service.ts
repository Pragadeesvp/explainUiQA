import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';

// --- Configuration ---
// TODO: Replace with your actual Cognito User Pool and Client ID from environment variables
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

export const userPool = new CognitoUserPool(poolData);

const cognitoIdentityClient = new CognitoIdentityClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
});

// --- Interfaces ---
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    name: string;
    email: string;
  };
  requiresNewPassword?: boolean;
  cognitoUser?: CognitoUser;
}

interface AuthResult {
  idToken: string;
}

// --- Service Functions ---
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const authenticationDetails = new AuthenticationDetails({
    Username: credentials.email,
    Password: credentials.password,
  });

  const cognitoUser = new CognitoUser({
    Username: credentials.email,
    Pool: userPool,
  });

  return new Promise(resolve => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: async result => {
        const idToken = result.getIdToken().getJwtToken();

        // Store credential provider info for other services to use (match old version)
        localStorage.setItem(
          'cognitoCredentialsProvider',
          JSON.stringify({
            identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
            region: import.meta.env.VITE_AWS_REGION,
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            idToken,
          })
        );

        const attributes = await getUserAttributes(cognitoUser);
        resolve({
          success: true,
          user: {
            name: attributes.find(attr => attr.Name === 'name')?.Value || credentials.email,
            email: attributes.find(attr => attr.Name === 'email')?.Value || credentials.email,
          },
        });
      },
      onFailure: err => {
        resolve({ success: false, error: err.message || 'Authentication failed' });
      },
      newPasswordRequired: () => {
        resolve({ success: false, requiresNewPassword: true, cognitoUser });
      },
    });
  });
};

export const completeNewPasswordChallenge = async (
  cognitoUser: CognitoUser,
  newPassword: string
): Promise<AuthResponse> => {
  return new Promise(resolve => {
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: async result => {
        const idToken = result.getIdToken().getJwtToken();
        // Store credential provider info for other services to use (match old version)
        localStorage.setItem(
          'cognitoCredentialsProvider',
          JSON.stringify({
            identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
            region: import.meta.env.VITE_AWS_REGION,
            userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
            idToken,
          })
        );
        const attributes = await getUserAttributes(cognitoUser);
        const email = attributes.find(attr => attr.Name === 'email')?.Value;
        resolve({
          success: true,
          user: {
            name: attributes.find(attr => attr.Name === 'name')?.Value || email || '',
            email: email || '',
          },
        });
      },
      onFailure: err => {
        resolve({ success: false, error: err.message || 'Failed to set new password' });
      },
    });
  });
};

export const logout = async (): Promise<void> => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('cognitoCredentialsProvider');
};

const getUserAttributes = (cognitoUser: CognitoUser): Promise<CognitoUserAttribute[]> => {
  return new Promise((resolve, reject) => {
    cognitoUser.getUserAttributes((err, attributes) => {
      if (err) {
        reject(err);
      } else {
        resolve(attributes || []);
      }
    });
  });
}; 