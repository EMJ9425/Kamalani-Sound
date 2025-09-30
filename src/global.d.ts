/**
 * Global type declarations for the Sound Machine app
 */

interface Window {
  electronAPI?: {
    platform: string;
    hueDiscover: () => Promise<string | null>;
    hueRequest: (bridgeIP: string, path: string, method: string, body?: any) => Promise<any>;
    blinkRequest: (url: string, method: string, headers?: any, body?: any) => Promise<any>;
    fetchImage: (url: string, headers?: any) => Promise<string>;
    checkForUpdates: () => Promise<any>;
  };
}

