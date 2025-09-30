// Preload script for Sound Machine
// Simple preload without Node.js dependencies for now

import { contextBridge, ipcRenderer } from 'electron';

console.log('💡 Preload script loading...');

// Expose simple API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
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
  // Fetch image and convert to data URL
  fetchImage: (url: string, headers?: any) => {
    console.log(`📹 Calling fetch-image from renderer: ${url}`);
    return ipcRenderer.invoke('fetch-image', { url, headers });
  },
  // Auto-updater API
  checkForUpdates: () => {
    console.log('🔄 Calling check-for-updates from renderer');
    return ipcRenderer.invoke('check-for-updates');
  }
});

console.log('💡 Preload script loaded, electronAPI exposed');
