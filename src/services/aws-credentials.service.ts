import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';

interface StoredCredentials {
  identityPoolId: string;
  region: string;
  userPoolId: string;
  idToken: string;
}

export const getCredentialsProvider = async () => {
  const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
  if (!storedCredentials) {
    throw new Error('No credentials found. Please log in.');
  }

  const credentials: StoredCredentials = JSON.parse(storedCredentials);

  const cognitoIdentityClient = new CognitoIdentityClient({
    region: credentials.region,
  });

  return fromCognitoIdentityPool({
    client: cognitoIdentityClient,
    identityPoolId: credentials.identityPoolId,
    logins: {
      [`cognito-idp.${credentials.region}.amazonaws.com/${credentials.userPoolId}`]: credentials.idToken,
    },
  });
};
