# Running on exFAT/NTFS Filesystems

## Problem
This project is located on an exFAT filesystem which doesn't support symbolic links. Node.js's `node_modules/.bin` directory relies on symlinks, causing `npm install` and `npm start` to fail.

## Solution

### Installation
Use the `--no-bin-links` flag when installing dependencies:

```bash
npm install --no-bin-links
```

Or use the provided script:
```bash
npm run install:exfat
```

### Running the App

#### Option 1: Use the start script (Recommended)
```bash
./start.sh
```

#### Option 2: Use npm
```bash
npm start
```

#### Option 3: Direct node command
```bash
node node_modules/@electron-forge/cli/dist/electron-forge.js start
```

## Alternative: Move to Native Linux Filesystem

For better performance and full compatibility, consider moving the project to a native Linux filesystem (ext4):

```bash
# Copy project to home directory
cp -r "/media/professoroak/Mainframe/Sound Toys/sound-machine" ~/sound-machine
cd ~/sound-machine

# Install normally
npm install

# Run normally
npm run start:normal
```

## Recent Fixes Applied

1. **Fixed `__dirname` undefined error** - Updated webpack configs to properly handle Node.js globals
2. **Added Content Security Policy** - Improved security and removed CSP warnings
3. **Added sandbox mode** - Enhanced renderer process security
4. **Created convenience scripts** - Easy startup on exFAT filesystems

