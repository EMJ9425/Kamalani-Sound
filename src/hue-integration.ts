/**
 * Philips Hue Integration
 * Handles connection and control of Philips Hue lights
 */

// Declare the Electron API
declare global {
  interface Window {
    electronAPI: {
      platform: string;
      hueDiscover: () => Promise<string | null>;
      hueRequest: (bridgeIP: string, path: string, method: string, body?: any) => Promise<any>;
      checkForUpdates: () => Promise<void>;
    };
  }
}

interface HueBridge {
  id: string;
  internalipaddress: string;
}

interface HueLight {
  name: string;
  state: {
    on: boolean;
    bri: number;
    hue?: number;
    sat?: number;
  };
}

export class HueIntegration {
  private bridgeIP: string | null = null;
  private username: string | null = null;
  private connected: boolean = false;
  private selectedGroupIds: string[] = [];
  private savedLightStates: Map<string, { on: boolean; bri: number }> = new Map();

  constructor() {
    this.loadSettings();
  }

  /**
   * Load saved Hue settings from localStorage
   */
  private loadSettings(): void {
    this.bridgeIP = localStorage.getItem('hueBridgeIP');
    this.username = localStorage.getItem('hueUsername');
    this.connected = !!(this.bridgeIP && this.username);

    const savedGroups = localStorage.getItem('hueSelectedGroups');
    if (savedGroups) {
      try {
        this.selectedGroupIds = JSON.parse(savedGroups);
      } catch (e) {
        this.selectedGroupIds = [];
      }
    }
  }

  /**
   * Save Hue settings to localStorage
   */
  private saveSettings(): void {
    if (this.bridgeIP) {
      localStorage.setItem('hueBridgeIP', this.bridgeIP);
    }
    if (this.username) {
      localStorage.setItem('hueUsername', this.username);
    }
    localStorage.setItem('hueSelectedGroups', JSON.stringify(this.selectedGroupIds));
  }

  /**
   * Discover Hue Bridge on the local network
   */
  async discoverBridge(): Promise<string | null> {
    try {
      const bridgeIP = await window.electronAPI.hueDiscover();
      if (bridgeIP) {
        this.bridgeIP = bridgeIP;
        return this.bridgeIP;
      }
      return null;
    } catch (error) {
      console.error('Error discovering Hue Bridge:', error);
      return null;
    }
  }

  /**
   * Set bridge IP manually
   */
  setBridgeIP(ip: string): void {
    this.bridgeIP = ip;
  }

  /**
   * Create a new user on the Hue Bridge
   * User must press the link button on the bridge before calling this
   */
  async authenticate(): Promise<boolean> {
    if (!this.bridgeIP) {
      const bridge = await this.discoverBridge();
      if (!bridge) {
        throw new Error('No Hue Bridge found on network');
      }
    }

    try {
      const data = await window.electronAPI.hueRequest(
        this.bridgeIP,
        '/api',
        'POST',
        { devicetype: 'sleep_app#electron' }
      );

      if (data[0]?.error) {
        if (data[0].error.type === 101) {
          throw new Error('Please press the link button on your Hue Bridge and try again');
        }
        throw new Error(data[0].error.description);
      }

      if (data[0]?.success) {
        this.username = data[0].success.username;
        this.connected = true;
        this.saveSettings();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error authenticating with Hue Bridge:', error);
      throw error;
    }
  }

  /**
   * Get all lights from the Hue Bridge
   */
  async getLights(): Promise<{ [key: string]: HueLight } | null> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return null;
    }

    try {
      const lights = await window.electronAPI.hueRequest(
        this.bridgeIP,
        `/api/${this.username}/lights`,
        'GET'
      );
      return lights;
    } catch (error) {
      console.error('Error getting lights:', error);
      return null;
    }
  }

  /**
   * Get all groups/rooms from the Hue Bridge
   */
  async getGroups(): Promise<{ [key: string]: any } | null> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return null;
    }

    try {
      const groups = await window.electronAPI.hueRequest(
        this.bridgeIP,
        `/api/${this.username}/groups`,
        'GET'
      );
      return groups;
    } catch (error) {
      console.error('Error getting groups:', error);
      return null;
    }
  }

  /**
   * Set selected group IDs
   */
  setSelectedGroups(groupIds: string[]): void {
    this.selectedGroupIds = groupIds;
    this.saveSettings();
  }

  /**
   * Get selected group IDs
   */
  getSelectedGroups(): string[] {
    return this.selectedGroupIds;
  }

  /**
   * Get all light IDs from selected groups
   */
  private async getLightIdsFromSelectedGroups(): Promise<string[]> {
    if (this.selectedGroupIds.length === 0) {
      return [];
    }

    try {
      const groups = await this.getGroups();
      if (!groups) return [];

      const lightIds = new Set<string>();

      this.selectedGroupIds.forEach(groupId => {
        const group = groups[groupId];
        if (group && group.lights) {
          group.lights.forEach((lightId: string) => lightIds.add(lightId));
        }
      });

      return Array.from(lightIds);
    } catch (error) {
      console.error('Error getting light IDs from groups:', error);
      return [];
    }
  }

  /**
   * Turn off selected rooms/groups (or all lights if none selected)
   */
  async turnOffAllLights(): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      // If groups are selected, use group API (more efficient)
      if (this.selectedGroupIds.length > 0) {
        const promises = this.selectedGroupIds.map(groupId =>
          window.electronAPI.hueRequest(
            this.bridgeIP!,
            `/api/${this.username}/groups/${groupId}/action`,
            'PUT',
            { on: false }
          )
        );
        await Promise.all(promises);
      } else {
        // No groups selected, turn off all lights
        const lights = await this.getLights();
        if (!lights) return;

        const promises = Object.keys(lights).map(lightId =>
          window.electronAPI.hueRequest(
            this.bridgeIP!,
            `/api/${this.username}/lights/${lightId}/state`,
            'PUT',
            { on: false }
          )
        );
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error turning off lights:', error);
    }
  }

  /**
   * Turn on all lights in the house (group 0)
   */
  async turnOnAllLights(): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      // Use group 0 which is "all lights"
      await window.electronAPI.hueRequest(
        this.bridgeIP,
        `/api/${this.username}/groups/0/action`,
        'PUT',
        { on: true }
      );
    } catch (error) {
      console.error('Error turning on all lights:', error);
    }
  }

  /**
   * Turn off all lights in the house (group 0)
   */
  async turnOffAllLightsInHouse(): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      // Use group 0 which is "all lights"
      await window.electronAPI.hueRequest(
        this.bridgeIP,
        `/api/${this.username}/groups/0/action`,
        'PUT',
        { on: false }
      );
    } catch (error) {
      console.error('Error turning off all lights:', error);
    }
  }

  /**
   * Gradually dim selected rooms/groups over a period of time
   * Saves the current state before dimming so it can be restored later
   */
  async dimLights(durationSeconds: number = 2): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      // First, save the current state of all lights
      await this.saveLightStates();

      // Set transition time (in deciseconds, so multiply by 10)
      const transitionTime = durationSeconds * 10;

      // If groups are selected, use group API
      if (this.selectedGroupIds.length > 0) {
        const promises = this.selectedGroupIds.map(groupId =>
          window.electronAPI.hueRequest(
            this.bridgeIP!,
            `/api/${this.username}/groups/${groupId}/action`,
            'PUT',
            {
              on: true,
              bri: 1, // Minimum brightness
              transitiontime: transitionTime,
            }
          )
        );
        await Promise.all(promises);
      } else {
        // No groups selected, dim all lights
        const lights = await this.getLights();
        if (!lights) return;

        const promises = Object.keys(lights).map(lightId =>
          window.electronAPI.hueRequest(
            this.bridgeIP!,
            `/api/${this.username}/lights/${lightId}/state`,
            'PUT',
            {
              on: true,
              bri: 1,
              transitiontime: transitionTime,
            }
          )
        );
        await Promise.all(promises);
      }

      // After the transition, turn off the lights
      setTimeout(() => {
        this.turnOffAllLights();
      }, durationSeconds * 1000);
    } catch (error) {
      console.error('Error dimming lights:', error);
    }
  }

  /**
   * Save the current state of all lights (for restoring later)
   */
  private async saveLightStates(): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      const lights = await this.getLights();
      if (!lights) return;

      this.savedLightStates.clear();

      Object.entries(lights).forEach(([lightId, light]: [string, any]) => {
        this.savedLightStates.set(lightId, {
          on: light.state.on,
          bri: light.state.bri || 254,
        });
      });

      console.log('💡 Saved states for', this.savedLightStates.size, 'lights');
    } catch (error) {
      console.error('Error saving light states:', error);
    }
  }

  /**
   * Restore lights to their previously saved state
   */
  async restoreLightStates(): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    if (this.savedLightStates.size === 0) {
      console.log('💡 No saved states to restore');
      return;
    }

    try {
      console.log('💡 Restoring states for', this.savedLightStates.size, 'lights');

      const promises = Array.from(this.savedLightStates.entries()).map(([lightId, state]) =>
        window.electronAPI.hueRequest(
          this.bridgeIP!,
          `/api/${this.username}/lights/${lightId}/state`,
          'PUT',
          {
            on: state.on,
            bri: state.bri,
            transitiontime: 10, // 1 second transition
          }
        )
      );

      await Promise.all(promises);
      console.log('💡 Light states restored successfully');
    } catch (error) {
      console.error('Error restoring light states:', error);
    }
  }

  /**
   * Gradually brighten selected rooms/groups (wake-up effect)
   */
  async brightenLights(durationSeconds: number = 60): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      // If groups are selected, use group API
      if (this.selectedGroupIds.length > 0) {
        // First, turn on lights at minimum brightness
        const turnOnPromises = this.selectedGroupIds.map(groupId =>
          window.electronAPI.hueRequest(
            this.bridgeIP!,
            `/api/${this.username}/groups/${groupId}/action`,
            'PUT',
            {
              on: true,
              bri: 1,
            }
          )
        );
        await Promise.all(turnOnPromises);

        // Wait a moment, then gradually brighten
        setTimeout(async () => {
          const transitionTime = durationSeconds * 10;
          const brightenPromises = this.selectedGroupIds.map(groupId =>
            window.electronAPI.hueRequest(
              this.bridgeIP!,
              `/api/${this.username}/groups/${groupId}/action`,
              'PUT',
              {
                bri: 254, // Maximum brightness
                transitiontime: transitionTime,
              }
            )
          );
          await Promise.all(brightenPromises);
        }, 500);
      } else {
        // No groups selected, brighten all lights
        const lights = await this.getLights();
        if (!lights) return;

        const lightIds = Object.keys(lights);

        const turnOnPromises = lightIds.map(lightId =>
          window.electronAPI.hueRequest(
            this.bridgeIP!,
            `/api/${this.username}/lights/${lightId}/state`,
            'PUT',
            {
              on: true,
              bri: 1,
            }
          )
        );
        await Promise.all(turnOnPromises);

        setTimeout(async () => {
          const transitionTime = durationSeconds * 10;
          const brightenPromises = lightIds.map(lightId =>
            window.electronAPI.hueRequest(
              this.bridgeIP!,
              `/api/${this.username}/lights/${lightId}/state`,
              'PUT',
              {
                bri: 254,
                transitiontime: transitionTime,
              }
            )
          );
          await Promise.all(brightenPromises);
        }, 500);
      }
    } catch (error) {
      console.error('Error brightening lights:', error);
    }
  }

  /**
   * Set lights to warm color for relaxation
   */
  async setWarmColor(): Promise<void> {
    if (!this.connected || !this.bridgeIP || !this.username) {
      return;
    }

    try {
      const lights = await this.getLights();
      if (!lights) return;

      // Warm orange/amber color
      const promises = Object.keys(lights).map(lightId =>
        window.electronAPI.hueRequest(
          this.bridgeIP!,
          `/api/${this.username}/lights/${lightId}/state`,
          'PUT',
          {
            on: true,
            hue: 8000, // Warm orange
            sat: 200,
            bri: 150,
            transitiontime: 20, // 2 seconds
          }
        )
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error setting warm color:', error);
    }
  }

  /**
   * Check if connected to Hue Bridge
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get bridge IP address
   */
  getBridgeIP(): string | null {
    return this.bridgeIP;
  }
}

