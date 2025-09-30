# Sleep App - Linux Build Instructions

## 🐧 Building Your Sleep App on Linux

This source package contains everything needed to build the Sleep app natively on your Linux system.

## 📋 Prerequisites

### Install Node.js and npm
```bash
# Ubuntu/Debian:
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL/Fedora:
sudo dnf install nodejs npm

# Arch Linux:
sudo pacman -S nodejs npm
```

### Install Build Dependencies
```bash
# Ubuntu/Debian:
sudo apt install build-essential libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2-dev

# CentOS/RHEL/Fedora:
sudo dnf groupinstall "Development Tools"
sudo dnf install nss-devel atk-devel at-spi2-atk-devel libdrm-devel libXcomposite-devel libXdamage-devel libXrandr-devel mesa-libgbm-devel libXScrnSaver-devel alsa-lib-devel

# Arch Linux:
sudo pacman -S base-devel nss atk at-spi2-atk libdrm libxcomposite libxdamage libxrandr mesa libxss alsa-lib
```

## 🚀 Build Instructions

1. **Extract the source package:**
```bash
tar -xzf sleep-app-source.tar.gz
cd sound-machine
```

2. **Install dependencies:**
```bash
npm install
```

3. **Test the app (optional):**
```bash
npm start
```

4. **Build the Linux package:**
```bash
npm run make
```

5. **Find your built app:**
```bash
# The built app will be in:
./out/Sleep-linux-x64/

# Run it:
cd out/Sleep-linux-x64/
./sleep
```

## 📦 Package Options

The build process creates multiple package formats:

- **Executable**: `./out/Sleep-linux-x64/sleep` - Direct executable
- **DEB Package**: `./out/make/deb/x64/sleep_1.0.0_amd64.deb` - For Ubuntu/Debian
- **RPM Package**: `./out/make/rpm/x64/sleep-1.0.0-1.x86_64.rpm` - For CentOS/Fedora
- **ZIP Package**: `./out/make/zip/linux/x64/Sleep-linux-x64-1.0.0.zip` - Portable

## 🎵 Features

Your Sleep app includes:
- **Black UI theme** - Easy on the eyes for bedside use
- **Your rain sounds MP3** - High-quality audio included
- **Auto sleep mode** - Fades to clock display after 2 seconds
- **Standard 12-hour time** - Shows "9:24 PM" format
- **Touch-friendly interface** - Large buttons for sleepy fingers

## 🛠️ Troubleshooting

### Missing Dependencies
If you get errors about missing libraries, install the development packages:
```bash
sudo apt install libgtk-3-dev libgconf-2-4
```

### Audio Issues
If audio doesn't work, ensure ALSA/PulseAudio is installed:
```bash
sudo apt install pulseaudio alsa-utils
```

### Permission Issues
Make sure the executable has proper permissions:
```bash
chmod +x out/Sleep-linux-x64/sleep
```

## 🌧️ Enjoy Your Sleep App!

Once built, your Sleep app will work perfectly on Linux with all the same features as the macOS version. Sweet dreams! 💤
