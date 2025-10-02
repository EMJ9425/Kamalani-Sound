// Preload script for Sound Machine
// Simple preload without Node.js dependencies for now

import { contextBridge, ipcRenderer } from 'electron';

console.log('💡 Preload script loading...');

async function invokeWithRetry<T = any>(channel: string, args: any, retries = 25, delayMs = 400): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // @ts-ignore
      return await ipcRenderer.invoke(channel, args);
    } catch (err: any) {
      const msg = String((err && err.message) || err);
      if (msg.includes("No handler registered")) {
        if (attempt < retries - 1) {
          console.warn(`IPC '${channel}' not ready yet (attempt ${attempt + 1}/${retries}). Retrying in ${delayMs}ms...`);
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
      }
      throw err;
    }
  }
  // Should never reach here
  // @ts-ignore
  return await ipcRenderer.invoke(channel, args);
}

// Expose simple API to the renderer process (supports both isolated and non-isolated contexts)
const api = {
  platform: 'electron',
  // Hue Bridge API
  hueDiscover: () => {
    console.log('💡 Calling hue-discover from renderer');
    return ipcRenderer.invoke('hue-discover');
  },
  hueRequest: (bridgeIP: string, path: string, method: string, body?: any) => {
    console.log(`💡 Calling hue-request from renderer: ${method} ${path}`);
    return ipcRenderer.invoke('hue-request', { bridgeIP, path, method, body });
  },
  // Blink Camera API
  blinkRequest: (url: string, method: string, headers?: any, body?: any) => {
    console.log(`📹 Calling blink-request from renderer: ${method} ${url}`);
    return ipcRenderer.invoke('blink-request', { url, method, headers, body });
  },
  // Set Blink authentication in main process (with retry if main is still booting)
  setBlinkAuth: (token: string, accountId: string, region: string) => {
    console.log(`📹 Calling set-blink-auth from renderer`);
    return invokeWithRetry('set-blink-auth', { token, accountId, region });
  },
  // Fetch Blink image with authenticated headers (with retry for initial boot race)
  fetchBlinkImage: (url: string) => {
    console.log(`📹 Calling fetch-blink-image from renderer: ${url}`);
    return invokeWithRetry('fetch-blink-image', { url });
  },
  // Auto-updater API
  checkForUpdates: () => {
    console.log('🔄 Calling check-for-updates from renderer');
    return ipcRenderer.invoke('check-for-updates');
  },
  onUpdateAvailable: (cb: (version: string) => void) => ipcRenderer.on('update-available', (_e, v) => cb(v)),
  onUpdateDownloadProgress: (cb: (percent: number) => void) => ipcRenderer.on('update-download-progress', (_e, p) => cb(p)),
  onUpdateDownloaded: (cb: (version: string) => void) => ipcRenderer.on('update-downloaded', (_e, v) => cb(v)),
  onUpdateError: (cb: (message: string) => void) => ipcRenderer.on('update-error', (_e, m) => cb(m)),
  // App version
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
};

try {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld('electronAPI', api);
  } else {
    // @ts-ignore
    (window as any).electronAPI = api;
  }
  console.log('💡 Preload script loaded, electronAPI exposed');
} catch (err) {
  // Fallback if contextBridge API is not available
  // @ts-ignore
  (window as any).electronAPI = api;
  console.warn('💡 contextBridge not available; electronAPI attached directly to window');
}
