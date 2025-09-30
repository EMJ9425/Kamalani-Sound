# Quick Update Guide - TL;DR

## Easiest Way: GitHub Releases

1. **Create a GitHub repo** for your app

2. **Edit `package.json`** - Replace these lines:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR_USERNAME/YOUR_REPO.git"
   },
   "build": {
     "appId": "com.erikstudio.sleep",
     "productName": "Sleep",
     "publish": [
       {
         "provider": "github",
         "owner": "YOUR_USERNAME",
         "repo": "YOUR_REPO"
       }
     ]
   }
   ```

3. **Build your app:**
   ```bash
   npm run make
   ```

4. **Create a GitHub Release:**
   - Go to your repo → Releases → New Release
   - Tag: `v1.0.1` (or whatever version)
   - Upload files from `out/make/` folder
   - Publish!

5. **Done!** The app will auto-check for updates every 24 hours.

---

## How Users Update:

1. App automatically checks for updates every 24 hours
2. Or users can go to **Settings → Check for Updates**
3. If update available, they click "Download"
4. After download, click "Restart Now" to install

---

## What You Added:

✅ Auto-updater that checks every 24 hours  
✅ "Check for Updates" button in Settings  
✅ Download progress notifications  
✅ Automatic installation on restart  

---

## Testing:

1. Build version 1.0.0, install it
2. Build version 1.0.1, upload to GitHub Release
3. In running app: Settings → Check for Updates
4. Should see "Update available!" notification

---

See `UPDATE_SERVER_SETUP.md` for detailed instructions and other hosting options.

