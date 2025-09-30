# Sleep - Kamalani's Rain Sounds App 🌧️💤

A beautiful Electron-based sleep and relaxation app featuring ambient rain sounds, Philips Hue integration, and automatic updates.

![Version](https://img.shields.io/badge/version-1.0.0-pink)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

## Features ✨

### 🎵 Audio Features
- **High-quality rain sounds** - Perfect for sleeping, studying, or relaxation
- **10-band equalizer** - Customize the sound to your preference
- **Volume control** - Fine-tune the audio level
- **Seamless looping** - Continuous playback without interruptions

### 💡 Philips Hue Integration
- **Automatic light control** - Lights dim when you start sleeping
- **Room-based control** - Select which rooms to control
- **Light switch toggle** - Quick on/off for all house lights
- **State restoration** - Lights return to previous brightness when you wake up
- **Smart detection** - Light switch reflects actual state of your lights

### ⏰ Timer & Alarm
- **Sleep timer** - Automatically stop playback after a set time
- **Alarm** - Wake up to gentle sounds
- **Customizable durations** - Set your preferred times

### 🎨 Beautiful UI
- **Time-based greetings** - Good Morning/Afternoon/Evening/Goodnight
- **Personalized** - Customize with your name
- **Stargazing background** - Relaxing visual atmosphere
- **Pink theme** - Soothing color scheme
- **Minimal design** - Clean and distraction-free

### 🔄 Auto-Updates
- **Automatic update checks** - Every 24 hours
- **Manual check** - Update anytime from Settings
- **Seamless installation** - Updates install on restart
- **Secure** - SHA512 checksum verification

## Installation 📦

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- Git LFS (for large audio files)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sleep-app.git
   cd sleep-app
   ```

2. **Install Git LFS** (if not already installed):
   ```bash
   # macOS
   brew install git-lfs
   
   # Windows
   # Download from https://git-lfs.github.com/
   
   # Linux
   sudo apt-get install git-lfs
   ```

3. **Pull LFS files:**
   ```bash
   git lfs pull
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Run the app:**
   ```bash
   npm start
   ```

## Development 🛠️

### Available Scripts

- `npm start` - Start the app in development mode
- `npm run package` - Package the app for distribution
- `npm run make` - Build distributable packages
- `npm run publish` - Publish the app (requires configuration)
- `npm run lint` - Run ESLint

### Project Structure

```
sound-machine/
├── src/
│   ├── index.ts           # Main process
│   ├── renderer.ts        # Renderer process
│   ├── preload.ts         # Preload script
│   ├── auto-updater.ts    # Auto-update logic
│   ├── hue-integration.ts # Philips Hue integration
│   ├── index.html         # Main HTML
│   ├── index.css          # Styles
│   └── assets/            # Images and sounds
├── public/                # Public assets
├── forge.config.ts        # Electron Forge configuration
├── package.json           # Dependencies and scripts
└── webpack.*.ts           # Webpack configurations
```

## Philips Hue Setup 🔌

1. **Connect to your Hue Bridge:**
   - Go to Settings in the app
   - Click "Discover Hue Bridge"
   - Press the button on your Hue Bridge
   - Click "Connect to Bridge"

2. **Select rooms to control:**
   - In Settings, choose which rooms should dim when you sleep
   - Click "Save Settings"

3. **Use the light switch:**
   - Toggle in the bottom right corner controls all house lights
   - Automatically updates to reflect current state

## Auto-Update Setup 🔄

See the detailed guides:
- **Quick Start**: `QUICK_UPDATE_GUIDE.md`
- **Detailed Setup**: `UPDATE_SERVER_SETUP.md`

### Quick Setup with GitHub Releases

1. Create a GitHub repository
2. Update `package.json` with your repo URL
3. Build the app: `npm run make`
4. Create a GitHub Release and upload the built files
5. Done! The app will auto-update

## Building for Distribution 📦

### macOS
```bash
npm run make
# Output: out/make/
```

### Windows
```bash
npm run make
# Output: out/make/
```

### Linux
See `LINUX-BUILD.md` for detailed instructions.

## Technologies Used 🔧

- **Electron** - Desktop app framework
- **Electron Forge** - Build tooling
- **TypeScript** - Type-safe JavaScript
- **Webpack** - Module bundler
- **Web Audio API** - Audio processing and EQ
- **Philips Hue API** - Smart light control
- **electron-updater** - Auto-update functionality
- **Git LFS** - Large file storage

## File Sizes 📊

This project uses Git LFS to handle large files:
- Audio files: ~440MB each
- Background images: Tracked with LFS
- All media files are stored efficiently

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

## Credits 👏

- **Rain sounds**: Perfect Rain Sounds For Sleeping And Relaxing
- **Background**: Stargazing image
- **Developer**: Erik Jones
- **For**: Kamalani

## Support 💬

If you encounter any issues or have questions:
1. Check the documentation files in this repository
2. Review the console logs in the app (View → Toggle Developer Tools)
3. Create an issue on GitHub

## Roadmap 🗺️

Future features planned:
- [ ] Multiple sound options
- [ ] Custom sound uploads
- [ ] More Hue scenes and effects
- [ ] Sleep tracking
- [ ] Cloud sync for settings
- [ ] Mobile companion app

---

Made with 💖 for better sleep and relaxation

