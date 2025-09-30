# GitHub Setup Guide

## Quick Setup to Push to GitHub

### 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the **+** icon → **New repository**
3. Name it: `sleep-app` (or whatever you prefer)
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### 2. Connect Your Local Repository

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/sleep-app.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/sleep-app.git

# Verify the remote
git remote -v
```

### 3. Push to GitHub

```bash
# Push your code
git push -u origin master

# Or if your default branch is 'main':
git branch -M main
git push -u origin main
```

**Note**: The first push might take a while because of the large audio files (440MB). Git LFS will handle them efficiently!

### 4. Verify Git LFS on GitHub

After pushing, check your repository on GitHub:
- Go to your repo → Settings → LFS
- You should see your large files listed there
- The `.mp3` and image files should show as LFS objects

### 5. Update package.json for Auto-Updates

Once your repo is created, update `package.json`:

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

Replace `YOUR_USERNAME` with your actual GitHub username.

### 6. Commit and Push the Update

```bash
git add package.json
git commit -m "Update repository URL for auto-updates"
git push
```

---

## Troubleshooting

### "Permission denied" error?

You need to authenticate with GitHub:

**Option 1: HTTPS (easier)**
```bash
# GitHub will prompt for username and password
# Use a Personal Access Token instead of password
# Create token at: https://github.com/settings/tokens
```

**Option 2: SSH (recommended)**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key
```

### Large file errors?

If you get errors about large files:
```bash
# Make sure Git LFS is installed
git lfs install

# Verify LFS is tracking files
git lfs ls-files

# If files aren't tracked, add them:
git lfs track "*.mp3"
git add .gitattributes
git commit -m "Track large files with LFS"
```

### Push is taking forever?

This is normal for the first push! The 440MB audio files need to upload. Subsequent pushes will be much faster since Git LFS only uploads changed files.

---

## Current Repository Status

✅ Git repository initialized  
✅ Git LFS installed and configured  
✅ Large files tracked (12 files, ~442MB)  
✅ Initial commit created  
✅ README added  
✅ .gitignore configured  
✅ .gitattributes configured  

**Tracked file types with LFS:**
- `*.mp3` - Audio files
- `*.jpg` - Images
- `*.png` - Images
- `*.jpeg` - Images
- `*.gif` - Images
- `*.wav` - Audio files
- `*.aiff` - Audio files

**Next step:** Create GitHub repo and push!

---

## After Pushing to GitHub

### Enable GitHub Releases for Auto-Updates

1. Go to your repo on GitHub
2. Click **Releases** → **Create a new release**
3. Tag version: `v1.0.0`
4. Release title: `Sleep v1.0.0 - Initial Release`
5. Description: Add release notes
6. Upload built files from `out/make/` directory
7. Click **Publish release**

Now your app will automatically check for updates and notify users when new versions are available!

### Clone on Another Computer

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sleep-app.git
cd sleep-app

# Pull LFS files
git lfs pull

# Install dependencies
npm install

# Run the app
npm start
```

---

## Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# View LFS files
git lfs ls-files

# Check remote
git remote -v

# Pull latest changes
git pull

# Create a new branch
git checkout -b feature-name

# Push a branch
git push -u origin feature-name
```

---

## Need Help?

- [Git LFS Documentation](https://git-lfs.github.com/)
- [GitHub Docs](https://docs.github.com/)
- [Electron Forge Publishing](https://www.electronforge.io/config/publishers)

