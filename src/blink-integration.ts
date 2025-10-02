/**
 * Blink Camera Integration
 * Simple integration with Blink's unofficial API
 */

export class BlinkIntegration {
  private authToken: string | null = null;
  private accountId: string | null = null;
  private region: string = 'us-east';
  private baseUrl: string = '';

  constructor() {
    // Load saved credentials
    const savedToken = localStorage.getItem('blinkAuthToken');
    const savedAccountId = localStorage.getItem('blinkAccountId');
    const savedRegion = localStorage.getItem('blinkRegion');

    if (savedToken && savedAccountId) {
      this.authToken = savedToken;
      this.accountId = savedAccountId;
      this.region = savedRegion || 'us-east';
      this.baseUrl = `https://rest-${this.region}.immedia-semi.com`;

      // Set auth in main process for authenticated image fetching
      if (window.electronAPI && window.electronAPI.setBlinkAuth) {
        window.electronAPI.setBlinkAuth(this.authToken, this.accountId, this.region).catch(err => {
          console.error('Failed to set Blink auth in main process:', err);
        });
      }
    }
  }

  /**
   * Login to Blink account
   */
  async login(email: string, password: string): Promise<{ success: boolean; message: string; requires2FA?: boolean; accountId?: string }> {
    try {
      console.log('🔐 Attempting Blink login...');

      // Check if electronAPI is available
      if (!window.electronAPI || !window.electronAPI.blinkRequest) {
        console.error('❌ Electron API not available');
        return { success: false, message: 'App not ready. Please try again.' };
      }

      const data = await window.electronAPI.blinkRequest(
        'https://rest-prod.immedia-semi.com/api/v5/account/login',
        'POST',
        { 'Content-Type': 'application/json' },
        {
          email,
          password,
          unique_id: 'sleep-app-' + Date.now(),
        }
      );

      // Check if 2FA is required (verification object present)
      if (data.account && data.verification) {
        console.log('📱 2FA verification required');
        console.log('📱 Login response:', data);
        // Store account ID, client ID, and auth token for verification
        const accountId = data.account.account_id.toString();
        const clientId = data.account.client_id.toString();
        const authToken = data.auth?.token || '';
        const region = data.account.tier || 'prod';

        localStorage.setItem('blinkPendingAccountId', accountId);
        localStorage.setItem('blinkPendingClientId', clientId);
        localStorage.setItem('blinkPendingAuthToken', authToken);
        localStorage.setItem('blinkPendingRegion', region);

        // Get phone last 4 digits
        const phoneDigits = data.phone?.last_4_digits || '****';

        return {
          success: false,
          message: `Verification code sent to your phone ending in ${phoneDigits}. Please check your messages.`,
          requires2FA: true,
          accountId: accountId
        };
      }

      if (data.authtoken && data.account) {
        this.authToken = data.authtoken.authtoken;
        this.accountId = data.account.account_id.toString();
        this.region = data.account.tier || 'us-east';
        this.baseUrl = `https://rest-${this.region}.immedia-semi.com`;

        // Save credentials
        localStorage.setItem('blinkAuthToken', this.authToken);
        localStorage.setItem('blinkAccountId', this.accountId);
        localStorage.setItem('blinkRegion', this.region);
        localStorage.removeItem('blinkPendingAccountId');
        localStorage.removeItem('blinkPendingAuthToken');

        // Set auth in main process for authenticated image fetching
        if (window.electronAPI && window.electronAPI.setBlinkAuth) {
          await window.electronAPI.setBlinkAuth(this.authToken, this.accountId, this.region);
        }

        console.log('✅ Blink login successful');
        return { success: true, message: 'Login successful!' };
      } else {
        console.error('❌ Blink login failed:', data);
        return { success: false, message: data.message || 'Login failed. Please check your credentials.' };
      }
    } catch (error) {
      console.error('❌ Blink login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(accountId: string, pin: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📱 Verifying 2FA code...');

      if (!window.electronAPI || !window.electronAPI.blinkRequest) {
        console.error('❌ Electron API not available');
        return { success: false, message: 'App not ready. Please try again.' };
      }

      const pendingAuthToken = localStorage.getItem('blinkPendingAuthToken');
      const clientId = localStorage.getItem('blinkPendingClientId');
      const region = localStorage.getItem('blinkPendingRegion') || 'prod';

      if (!pendingAuthToken) {
        console.error('❌ No pending auth token found');
        return { success: false, message: 'Session expired. Please login again.' };
      }

      if (!clientId) {
        console.error('❌ No client ID found');
        return { success: false, message: 'Session expired. Please login again.' };
      }

      // Build the correct verification URL with region
      const verifyUrl = `https://rest-${region}.immedia-semi.com/api/v4/account/${accountId}/client/${clientId}/pin/verify`;
      console.log('📱 Verification URL:', verifyUrl);

      // Try the verification endpoint
      const data = await window.electronAPI.blinkRequest(
        verifyUrl,
        'POST',
        {
          'Content-Type': 'application/json',
          'TOKEN-AUTH': pendingAuthToken
        },
        { pin }
      );

      console.log('📱 2FA verification response:', data);

      // Check if verification was successful
      if (data.valid === true || data.require_new_pin === false || data.code === 200) {
        // The auth token from login is now valid
        this.authToken = pendingAuthToken;
        this.accountId = accountId;
        this.region = region;
        this.baseUrl = `https://rest-${region}.immedia-semi.com`;

        // Save credentials
        localStorage.setItem('blinkAuthToken', this.authToken);
        localStorage.setItem('blinkAccountId', this.accountId);
        localStorage.setItem('blinkRegion', this.region);
        localStorage.removeItem('blinkPendingAccountId');
        localStorage.removeItem('blinkPendingClientId');
        localStorage.removeItem('blinkPendingAuthToken');
        localStorage.removeItem('blinkPendingRegion');

        // Set auth in main process for authenticated image fetching
        if (window.electronAPI && window.electronAPI.setBlinkAuth) {
          await window.electronAPI.setBlinkAuth(this.authToken, this.accountId, this.region);
        }

        console.log('✅ 2FA verification successful');
        return { success: true, message: 'Verification successful!' };
      } else {
        console.error('❌ 2FA verification failed:', data);
        return { success: false, message: data.message || 'Invalid verification code. Please try again.' };
      }
    } catch (error) {
      console.error('❌ 2FA verification error:', error);
      return { success: false, message: 'Verification failed. Please try again.' };
    }
  }

  /**
   * Logout and clear credentials
   */
  logout(): void {
    this.authToken = null;
    this.accountId = null;
    localStorage.removeItem('blinkAuthToken');
    localStorage.removeItem('blinkAccountId');
    localStorage.removeItem('blinkRegion');
    localStorage.removeItem('blinkPendingAccountId');
    localStorage.removeItem('blinkPendingClientId');
    localStorage.removeItem('blinkPendingAuthToken');
    localStorage.removeItem('blinkPendingRegion');
    console.log('🚪 Logged out of Blink');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.authToken !== null && this.accountId !== null;
  }

  /**
   * Get all networks (Sync Modules)
   */
  async getNetworks(): Promise<any[]> {
    if (!this.isLoggedIn()) {
      throw new Error('Not logged in');
    }

    if (!window.electronAPI || !window.electronAPI.blinkRequest) {
      console.error('❌ Electron API not available');
      return [];
    }

    try {
      console.log('📹 Getting networks from:', `${this.baseUrl}/api/v3/accounts/${this.accountId}/networks`);
      const data = await window.electronAPI.blinkRequest(
        `${this.baseUrl}/api/v3/accounts/${this.accountId}/networks`,
        'GET',
        {
          'TOKEN-AUTH': this.authToken!,
          'account-id': String(this.accountId!),
          'Accept': 'application/json',
          'User-Agent': 'Blink/10.2.0 (iPhone; iOS 16.6)'
        }
      );

      console.log('📹 Networks response:', data);
      return data.networks || [];
    } catch (error) {
      console.error('❌ Error getting networks:', error);
      return [];
    }
  }

  /**
   * Get all cameras
   */
  async getCameras(): Promise<any[]> {
    if (!window.electronAPI || !window.electronAPI.blinkRequest) {
      console.error('❌ Electron API not available');
      return [];
    }

    console.log('📹 Getting cameras using homescreen endpoint...');

    // Use the homescreen endpoint which returns all devices
    try {
      const data = await window.electronAPI.blinkRequest(
        `${this.baseUrl}/api/v3/accounts/${this.accountId}/homescreen`,
        'GET',
        {
          'TOKEN-AUTH': this.authToken!,
          'account-id': String(this.accountId!),
          'Accept': 'application/json',
          'User-Agent': 'Blink/10.2.0 (iPhone; iOS 16.6)'
        }
      );
      console.log('📹 Homescreen full response:', data);
      console.log('📹 Current region/tier:', this.region);
      console.log('📹 Current baseUrl:', this.baseUrl);

      // Check if there's a media server URL in the response
      if (data.media_server) {
        console.log('📹 Media server from response:', data.media_server);
      }

      const allCameras: any[] = [];

      // Check for sync modules (owl structure)
      if (data.owls && Array.isArray(data.owls)) {
        console.log('📹 Found owls (sync modules):', data.owls);
        data.owls.forEach((owl: any) => {
          console.log('📹 Processing owl:', owl);
          console.log('📹 Owl thumbnail field:', owl.thumbnail);
          allCameras.push({
            id: owl.id,
            name: owl.name,
            network_id: owl.network_id,
            type: 'owl',
            enabled: owl.enabled,
            thumbnail: owl.thumbnail
          });
        });
      }

      // Check for cameras
      if (data.cameras && Array.isArray(data.cameras)) {
        console.log('📹 Found cameras:', data.cameras);
        data.cameras.forEach((camera: any) => {
          console.log('📹 Processing camera:', camera);
          allCameras.push({
            id: camera.id,
            name: camera.name,
            network_id: camera.network_id,
            type: 'camera',
            enabled: camera.enabled,
            thumbnail: camera.thumbnail
          });
        });
      }

      // Check for doorbells
      if (data.doorbells && Array.isArray(data.doorbells)) {
        console.log('📹 Found doorbells:', data.doorbells);
        data.doorbells.forEach((doorbell: any) => {
          console.log('📹 Processing doorbell:', doorbell);
          allCameras.push({
            id: doorbell.id,
            name: doorbell.name,
            network_id: doorbell.network_id,
            type: 'doorbell',
            enabled: doorbell.enabled,
            thumbnail: doorbell.thumbnail
          });
        });
      }

      console.log('📹 Total cameras found:', allCameras.length, allCameras);

      // Cache the cameras for thumbnail URL lookup
      localStorage.setItem('blinkCameras', JSON.stringify(allCameras));

      return allCameras;
    } catch (error) {
      console.error('❌ Error getting homescreen:', error);
    }

    return [];
  }

  /**
   * Get thumbnail URL for a camera
   */
  async getThumbnail(networkId: number, cameraId: number): Promise<string | null> {
    if (!this.isLoggedIn()) {
      return null;
    }

    if (!window.electronAPI || !window.electronAPI.blinkRequest) {
      console.error('❌ Electron API not available');
      return null;
    }

    try {
      // Request a new thumbnail
      console.log('📹 Requesting new thumbnail...');
      const data = await window.electronAPI.blinkRequest(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/networks/${networkId}/cameras/${cameraId}/thumbnail`,
        'POST',
        {
          'TOKEN-AUTH': this.authToken!,
          'account-id': String(this.accountId!),
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Blink/10.2.0 (iPhone; iOS 16.6)'
        }
      );
      console.log('📹 Thumbnail request response:', data);

      // Wait a moment for the thumbnail to be generated
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get the thumbnail URL (without auth in query string - will be passed as header)
      const thumbnailPath = data.thumbnail || `/api/v2/accounts/${this.accountId}/networks/${networkId}/cameras/${cameraId}/thumbnail/thumbnail.jpg`;
      console.log('📹 Thumbnail path from response:', thumbnailPath);

      // Build URL and add cache-busting timestamp to avoid CDN/browser cache
      const urlObj = new URL(thumbnailPath, this.baseUrl);
      urlObj.searchParams.set('ts', Date.now().toString());
      const fullUrl = urlObj.toString();
      console.log('📹 Full thumbnail URL:', fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error getting thumbnail:', error);
      return null;
    }
  }

  /**
   * Get latest thumbnail without requesting a new one
   */
  getLatestThumbnailUrl(networkId: number, cameraId: number): string {
    // Find the camera in our cached list to get the correct thumbnail path
    const cameras = JSON.parse(localStorage.getItem('blinkCameras') || '[]');
    const camera = cameras.find((c: any) => c.id === cameraId);

    if (camera && camera.thumbnail) {
      // Use the thumbnail path from the homescreen response
      // Auth will be handled via headers in the main process
      console.log('📹 Using cached thumbnail path:', camera.thumbnail);
      const urlObj = new URL(camera.thumbnail, this.baseUrl);
      urlObj.searchParams.set('ts', Date.now().toString());
      return urlObj.toString();
    }

    // Fallback to constructed URL (may not work for all camera types)
    console.log('📹 No cached thumbnail, using fallback URL');
    const urlObj = new URL(`/api/v2/accounts/${this.accountId}/networks/${networkId}/cameras/${cameraId}/thumbnail/thumbnail.jpg`, this.baseUrl);
    urlObj.searchParams.set('ts', Date.now().toString());
    return urlObj.toString();
  }

  /**
   * Get the auth token for making authenticated requests
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Get the region/tier for making authenticated requests
   */
  getRegion(): string {
    return this.region;
  }
}

