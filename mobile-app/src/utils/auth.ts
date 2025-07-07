import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'convive_auth_token';

// Save token to secure storage
export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
}

// Get token from secure storage
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

// Remove token from secure storage
export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
}

// Check if token exists and is valid
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}