/**
 * Gets the JWT token from stored Cognito credentials
 * @returns The JWT token or throws an error if not found
 */
export const getJWTToken = (): string => {
  const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
  console.log('storedCredentials', storedCredentials);
  if (!storedCredentials) {
    throw new Error('No credentials found. Please log in.');
  }

  const credentials = JSON.parse(storedCredentials);
  if (!credentials.idToken) {
    throw new Error('No JWT token found in stored credentials.');
  }

  return credentials.idToken;
};
