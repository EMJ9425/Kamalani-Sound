/**
 * Auto-updater module
 * Handles checking for and installing app updates
 */

import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, dialog } from 'electron';

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

