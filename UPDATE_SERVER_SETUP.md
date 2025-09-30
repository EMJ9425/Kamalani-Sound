# Auto-Update Setup Guide

This app includes auto-update functionality using `electron-updater`. Here's how to set it up:

## Option 1: GitHub Releases (Recommended)

This is the easiest way to host updates.

### Setup Steps:

1. **Create a GitHub repository** for your app (if you haven't already)

2. **Update `package.json`** with your GitHub repo URL:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR_USERNAME/sleep-app.git"
   },
   "build": {
     "appId": "com.erikstudio.sleep",
     "productName": "Sleep",
     "publish": [
       {
         "provider": "github",
         "owner": "YOUR_USERNAME",
         "repo": "sleep-app"
       }
     ]
   }
   ```

3. **Build and package your app:**
   ```bash
   npm run make
   ```

4. **Create a GitHub release:**
   - Go to your GitHub repo
   - Click "Releases" → "Create a new release"
   - Tag version (e.g., `v1.0.1`)
   - Upload the built files from `out/make/` directory
   - Publish the release

5. **The app will automatically check for updates** every 24 hours and notify users when a new version is available!

---

## Option 2: Simple Web Server

Host updates on your own server or cloud storage.

### Setup Steps:

1. **Update `package.json`** with your server URL:
   ```json
   "build": {
     "appId": "com.erikstudio.sleep",
     "productName": "Sleep",
     "publish": [
       {
         "provider": "generic",
         "url": "https://your-server.com/updates"
       }
     ]
   }
   ```

2. **Build your app:**
   ```bash
   npm run make
   ```

3. **Create update files structure on your server:**
   ```
   https://your-server.com/updates/
   ├── latest-mac.yml          (for macOS)
   ├── latest.yml              (for Windows)
   ├── Sleep-1.0.1-mac.zip     (macOS build)
   └── Sleep-Setup-1.0.1.exe   (Windows build)
   ```

4. **Create `latest-mac.yml`** (for macOS):
   ```yaml
   version: 1.0.1
   files:
     - url: Sleep-1.0.1-mac.zip
       sha512: [SHA512_HASH_OF_ZIP_FILE]
       size: [FILE_SIZE_IN_BYTES]
   path: Sleep-1.0.1-mac.zip
   sha512: [SHA512_HASH_OF_ZIP_FILE]
   releaseDate: '2025-09-30T12:00:00.000Z'
   ```

5. **Generate SHA512 hash:**
   ```bash
   # macOS/Linux
   shasum -a 512 Sleep-1.0.1-mac.zip | cut -d ' ' -f 1 | xxd -r -p | base64

   # Or use online tools
   ```

6. **Upload files to your server** and ensure they're publicly accessible

---

## Option 3: Local Network Update Server (For Testing)

Perfect for testing updates on your local network.

### Setup Steps:

1. **Create a simple HTTP server:**
   ```bash
   # Create updates directory
   mkdir ~/sleep-updates
   cd ~/sleep-updates

   # Start a simple HTTP server
   python3 -m http.server 8080
   ```

2. **Set environment variable** when running the app:
   ```bash
   UPDATE_SERVER_URL=http://localhost:8080 npm start
   ```

3. **Place your update files** in `~/sleep-updates/` following the structure from Option 2

---

## How Updates Work

1. **Automatic Check**: The app checks for updates every 24 hours after launch
2. **Manual Check**: Users can click "Check for Updates" in Settings
3. **Download**: If an update is found, users are prompted to download it
4. **Install**: After download, users can restart the app to install the update

---

## Testing Updates

1. **Build version 1.0.0:**
   ```bash
   # In package.json, set version to 1.0.0
   npm run make
   ```

2. **Install and run version 1.0.0**

3. **Build version 1.0.1:**
   ```bash
   # In package.json, set version to 1.0.1
   npm run make
   ```

4. **Upload version 1.0.1** to your update server

5. **In the running app**, go to Settings → Click "Check for Updates"

6. **You should see** a notification that version 1.0.1 is available!

---

## Update Frequency

By default, the app checks for updates every 24 hours. To change this, edit `src/index.ts`:

```typescript
updater.startPeriodicCheck(24); // Change 24 to desired hours
```

---

## Disabling Auto-Updates

To disable auto-updates, comment out this line in `src/index.ts`:

```typescript
// updater.startPeriodicCheck(24);
```

Users can still manually check for updates via the Settings page.

---

## Security Notes

- Updates are verified using SHA512 checksums
- Only install updates from trusted sources
- Always use HTTPS for production update servers
- Consider code signing your app for additional security

---

## Troubleshooting

**Updates not working?**
- Check that `package.json` has correct repository/server URL
- Verify update files are publicly accessible
- Check browser console for error messages
- Ensure version numbers follow semantic versioning (e.g., 1.0.1)

**"Update check initiated" but nothing happens?**
- This is normal if you're already on the latest version
- Check the terminal/console for detailed logs

**Want to force an update check?**
- Go to Settings → Click "Check for Updates"
- Or restart the app (it checks on startup)

---

## Example: Deploying to Netlify/Vercel

1. Create a `public/updates/` folder in your repo
2. Add your update files to this folder
3. Deploy to Netlify/Vercel
4. Update `package.json` with your deployment URL:
   ```json
   "publish": [{
     "provider": "generic",
     "url": "https://your-app.netlify.app/updates"
   }]
   ```

---

## Current Configuration

The app is currently configured to use a generic update server. To activate updates:

1. Choose one of the options above
2. Update `package.json` with your server/repo details
3. Build and distribute your app
4. Upload new versions to your update server

That's it! Your app now has automatic updates! 🎉

