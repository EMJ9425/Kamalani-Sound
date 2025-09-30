/**
 * Blink Authentication Manager
 * Centralize token, region, and refresh logic
 */

export type BlinkAuth = {
  token: string;          // access token
  accountId: string;      // e.g., "365139"
  region: string;         // e.g., "u012"
  headerMode: "bearer" | "token-auth"; // prefer "bearer" initially
};

let auth: BlinkAuth | null = null;

export function setBlinkAuth(next: BlinkAuth) {
  console.log(`📹 Setting Blink auth: accountId=${next.accountId}, region=${next.region}, mode=${next.headerMode}, token=***${next.token.slice(-4)}`);
  auth = next;
}

export function getBlinkAuth(): BlinkAuth {
  if (!auth) {
    throw new Error('Blink auth not initialized');
  }
  return auth;
}

export function hasBlinkAuth(): boolean {
  return auth !== null;
}

/**
 * Refresh Blink authentication token
 * This should be called when we get 401/403 errors
 */
export async function refreshBlinkAuth(): Promise<BlinkAuth> {
  console.log('📹 Refreshing Blink auth token...');
  
  if (!auth) {
    throw new Error('Cannot refresh: no existing auth');
  }

  // For now, we'll just return the existing auth
  // In a real implementation, you would call the Blink API to refresh the token
  // This would involve calling the login endpoint again or using a refresh token
  
  // TODO: Implement actual token refresh logic
  // For now, we'll just keep the existing token and switch to bearer mode
  const refreshed: BlinkAuth = {
    ...auth,
    headerMode: 'bearer'
  };
  
  setBlinkAuth(refreshed);
  return refreshed;
}

/**
 * Clear Blink authentication (logout)
 */
export function clearBlinkAuth() {
  console.log('📹 Clearing Blink auth');
  auth = null;
}

