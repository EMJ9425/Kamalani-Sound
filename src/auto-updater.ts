/**
 * Auto-updater module
 * Handles checking for and installing app updates
 */

import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, dialog, shell } from 'electron';
import * as path from 'path';
import * as os from 'os';

export class AutoUpdater {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true;


    // Disable differential download to avoid .blockmap 404s when not generated
    process.env.UPDATER_DISABLE_DIFFERENTIAL_DOWNLOAD = 'true';

    // Configure update feed
    // 1) If UPDATE_SERVER_URL is provided, use a Generic provider (local or custom server)
    if (process.env.UPDATE_SERVER_URL) {
      autoUpdater.setFeedURL({ provider: 'generic', url: process.env.UPDATE_SERVER_URL });
    } else {
      // 2) Otherwise default to GitHub Releases for this repo
      // This allows us to test real updates without electron-builder's app-update.yml
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'EMJ9425',
        repo: 'Kamalani-Sound',
      });
    }

    // Ensure updater doesn't depend on app-update.yml inside the app bundle
    try {
      const userConfigDir = app.getPath('userData');
      const cfgPath = path.join(userConfigDir, 'app-update.generated.yml');
      const cfgYml = `provider: github\nowner: EMJ9425\nrepo: Kamalani-Sound\n`;
      try { require('fs').writeFileSync(cfgPath, cfgYml); } catch {}
      // Point electron-updater at our generated config so it never tries to open
      // /Applications/Sleep.app/Contents/Resources/app-update.yml
      // (avoids ENOENT on unsigned builds)
      (autoUpdater as any).updateConfigPath = cfgPath;
    } catch (e) {
      console.warn('⚠️ Could not set updateConfigPath', e);
    }

    // Optional persistent logging (no-op if electron-log isn't installed)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const log = require('electron-log');
      (autoUpdater as any).logger = log;
      if (log?.transports?.file) {
        log.transports.file.level = 'info';
      }
    } catch {}


    // Event: Checking for update
    autoUpdater.on('checking-for-update', () => {
      console.log('🔍 Checking for updates...');
    });

    // Event: Update available
    autoUpdater.on('update-available', (info) => {
      console.log('✨ Update available:', info.version);

      // Notify renderer that an update is available
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-available', info.version);
      }

      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((result) => {
        if (result.response === 0) {
          // User clicked "Download"
          autoUpdater.downloadUpdate();
        }
      });
    });

    // Event: Update not available
    autoUpdater.on('update-not-available', (info) => {
      console.log('✅ App is up to date:', info.version);
    });

    // Event: Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      console.log(`📥 Downloading update: ${percent}%`);

      // Send progress to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-download-progress', percent);
      }
    });

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log('✅ Update downloaded:', info.version);

      // Notify renderer that update has been downloaded
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-downloaded', info.version);
      }

      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully!',
        detail: 'The app will restart to install the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((result) => {
        if (result.response === 0) {
          // User clicked "Restart Now"
          autoUpdater.quitAndInstall();
        }
      });
    });

    // Event: Error
    autoUpdater.on('error', (error) => {
      console.error('❌ Update error:', error);
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('update-error', String(error));
      }

      // Friendly fallback for unsigned builds on macOS:
      // If macOS blocks install due to code signature, offer to reveal the update folder.
      const msg = String(error || '');
      const isCodeSignBlock = msg.includes('SQRLCodeSignatureErrorDomain') || msg.includes('Code signature at URL');
      if (isCodeSignBlock && this.mainWindow && !this.mainWindow.isDestroyed()) {
        // macOS cache path for our app: ~/Library/Caches/Sleep/pending
        const pendingDir = path.join(os.homedir(), 'Library', 'Caches', 'Sleep', 'pending');
        dialog.showMessageBox(this.mainWindow, {
          type: 'warning',
          title: 'Manual Install Required',
          message: 'macOS blocked automatic install because the app is not code-signed.',
          detail: 'Click “Open Update Folder” and drag Sleep.app into /Applications to finish installing.',
          buttons: ['Open Update Folder', 'OK'],
          defaultId: 0,
          cancelId: 1,
        }).then((res) => {
          if (res.response === 0) {
            shell.openPath(pendingDir);
          }
        });
      }
    });
  }

  /**
   * Check for updates manually
   */
  public checkForUpdates(): void {
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    } else {
      console.log('⚠️ Auto-updater is disabled in development mode');
    }
  }

  /**
   * Start checking for updates periodically
   * @param intervalHours How often to check (in hours)
   */
  public startPeriodicCheck(intervalHours: number = 24): void {
    // Check immediately on startup
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000); // Wait 5 seconds after app starts

    // Then check periodically
    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
  }

  /**
   * Stop periodic update checks
   */
  public stopPeriodicCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

