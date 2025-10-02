/**
 * Global type declarations for the Sound Machine app
 */

interface Window {
  electronAPI?: {
    platform: string;
    hueDiscover: () => Promise<string | null>;
    hueRequest: (bridgeIP: string, path: string, method: string, body?: any) => Promise<any>;
    blinkRequest: (url: string, method: string, headers?: any, body?: any) => Promise<any>;
    setBlinkAuth: (token: string, accountId: string, region: string) => Promise<{ success: boolean }>;
    fetchBlinkImage: (url: string) => Promise<string>;
    checkForUpdates: () => Promise<any>;
    onUpdateAvailable: (cb: (version: string) => void) => void;
    onUpdateDownloadProgress: (cb: (percent: number) => void) => void;
    onUpdateDownloaded: (cb: (version: string) => void) => void;
    onUpdateError: (cb: (message: string) => void) => void;
    getAppVersion: () => Promise<string>;
  };
}

