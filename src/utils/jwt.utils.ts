/**
 * Decodes a JWT token and returns its payload
 * @param token The JWT token to decode
 * @returns The decoded token payload
 */
function decodeToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Retrieves the JWT ID token from the credentials stored in localStorage.
 *
 * @returns The JWT token string.
 * @throws An error if credentials or the token are not found.
 */
export const getJWTToken = (): string => {
  const storedCredentials = localStorage.getItem('cognitoCredentialsProvider');
  if (!storedCredentials) {
    throw new Error('No credentials found in storage. Please ensure you are logged in.');
  }

  const credentials = JSON.parse(storedCredentials);
  if (!credentials.idToken) {
    throw new Error('No ID token found in stored credentials.');
  }

  return credentials.idToken;
};

/**
 * Extracts the bucket name from a JWT token
 * The bucket name is expected to be in the token's 'cognito:groups' claim
 * @param token The JWT token to extract the bucket name from
 * @returns The bucket name or null if not found
 */
export const getBucketNameFromToken = (token: string): string | null => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) return null;

    // Look for bucket name in Cognito groups
    const groups = decoded['cognito:groups'];
    if (!Array.isArray(groups) || groups.length === 0) {
      return null;
    }

    // Assuming the first group is the bucket name
    // You might want to adjust this logic based on your group naming convention
    return groups[0];
  } catch (error) {
    console.error('Failed to extract bucket name from token:', error);
    return null;
  }
}; 