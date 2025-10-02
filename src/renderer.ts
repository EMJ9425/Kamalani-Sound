// Import CSS
import './index.css';
import { HueIntegration } from './hue-integration';
import { BlinkIntegration } from './blink-integration';

class SoundMachine {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private volume = 50;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private hue: HueIntegration;
  private blink: BlinkIntegration;
  private eqFilters: BiquadFilterNode[] = [];

  constructor() {
    this.hue = new HueIntegration();
    this.blink = new BlinkIntegration();
    this.init();
  }

  private async init(): Promise<void> {
    console.log('🎵 Initializing Sound Machine...');

    try {
      this.setupHomeScreen();
      this.updateSoundTitle();
      await this.showAppVersion();

      await this.createAudioElement();
      this.setupControls();
      this.setupHueControls();
      this.setupHomeLightControls();
      this.setupCameraControls();
      this.checkBetaFeatures(); // Check beta features on startup
      console.log('✅ Sound Machine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Sound Machine:', error);
    }
  }

  private updateSoundTitle(): void {
    const soundTitle = document.querySelector('.sound-title');
    if (soundTitle) {
      const name = this.getUserName();
      soundTitle.textContent = `Sleep by ${name}`;
    }
  }

  private getUserName(): string {
    // Get name from localStorage, default to 'Kamalani'
    return localStorage.getItem('userName') || 'Kamalani';
  }

  private showSettingsSavedNotification(): void {
    console.log('💾 Showing settings saved notification');
    const notification = document.getElementById('settingsSavedNotification');
    console.log('💾 Notification element:', notification);
    if (notification) {
      notification.style.display = 'block';
      console.log('💾 Notification displayed');
      // Scroll to top to make sure notification is visible
      const settingsContainer = document.querySelector('.settings-container');
      if (settingsContainer) {
        settingsContainer.scrollTop = 0;
        console.log('💾 Scrolled to top');
      }
      // Hide after 3 seconds
      setTimeout(() => {
        notification.style.display = 'none';
        console.log('💾 Notification hidden');
      }, 3000);
    } else {
      console.error('💾 Notification element not found!');
    }
  }

  private async showAppVersion(): Promise<void> {
    try {
      const badge = document.getElementById('versionBadge');
      // @ts-ignore optional chaining for older TS
      const api = (window as any).electronAPI;
      if (!badge || !api || !api.getAppVersion) return;
      const v = await api.getAppVersion();
      badge.textContent = `Sleep v${v}`;
      (badge as HTMLElement).style.display = 'inline-block';
    } catch (e) {
      console.warn('⚠️ Unable to show app version:', e);
    }
  }

  private updateGreeting(): void {
    const greetingText = document.getElementById('greetingText');
    if (!greetingText) return;

    // Determine greeting based on time of day
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    const name = this.getUserName();
    const pronoun = localStorage.getItem('userPronoun') || 'nonbinary';

    // Time-based greetings
    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good Evening';
    } else {
      greeting = 'Goodnight';
    }

    // Randomly use Hawaiian greetings (20% chance)
    if (Math.random() < 0.2) {
      greeting = Math.random() < 0.5 ? 'Aloha' : 'Mahalo';
    }

    // Get personalized term of endearment based on pronoun
    let addressName = name;

    if (pronoun === 'woman') {
      const womanTerms = ['Beautiful', 'Gorgeous', 'Love', 'Darling', 'Dear', 'Mamacita'];
      if (Math.random() < 0.5) {
        addressName = womanTerms[Math.floor(Math.random() * womanTerms.length)];
      }
    } else if (pronoun === 'man') {
      const manTerms = ['Handsome', 'Feller', 'Partner', 'Papi', 'Papi Chulo', 'Guy'];
      if (Math.random() < 0.5) {
        addressName = manTerms[Math.floor(Math.random() * manTerms.length)];
      }
    } else if (pronoun === 'they') {
      const allTerms = [
        'Beautiful', 'Gorgeous', 'Love', 'Darling', 'Dear', 'Mamacita',
        'Handsome', 'Feller', 'Partner', 'Papi', 'Papi Chulo', 'Guy'
      ];
      if (Math.random() < 0.5) {
        addressName = allTerms[Math.floor(Math.random() * allTerms.length)];
      }
    }
    // Non-binary: always use their name (no change needed)

    greetingText.textContent = `${greeting} ${addressName}`;
  }

  private updateClock(): void {
    const homeClock = document.getElementById('homeClock');
    if (!homeClock) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();

    // Check time format preference (default to 12-hour)
    const use24Hour = localStorage.getItem('timeFormat') === '24';

    let formattedTime: string;
    if (use24Hour) {
      // 24-hour format
      formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // 12-hour format with AM/PM
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    homeClock.textContent = formattedTime;
  }

  private setupHomeScreen(): void {
    const homeScreen = document.getElementById('homeScreen');
    const greetingText = document.getElementById('greetingText');
    const homeClock = document.getElementById('homeClock');
    const app = document.getElementById('app');

    // Update clock
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();

      // Check time format preference (default to 12-hour)
      const use24Hour = localStorage.getItem('timeFormat') === '24';

      let formattedTime: string;
      if (use24Hour) {
        // 24-hour format
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        // 12-hour format with AM/PM
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }

      if (homeClock) {
        homeClock.textContent = formattedTime;
      }
    };

    // Update clock immediately and then every second
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Initialize greeting
    this.updateGreeting();

    // Handle click to dismiss home screen
    if (homeScreen && app) {
      homeScreen.addEventListener('click', () => {
        homeScreen.classList.add('fade-out');
        // Stop the clock interval when leaving home screen
        clearInterval(clockInterval);
        setTimeout(() => {
          homeScreen.style.display = 'none';
          app.style.display = 'flex';
        }, 500);
      });
    }
  }

  private async createAudioElement(): Promise<void> {
    try {
      // Create simple HTML audio element
      this.audio = new Audio();

      // Try different asset paths for Electron Forge
      const possiblePaths = [
        './assets/rain-sounds.mp3',
        '../assets/rain-sounds.mp3',
        './main_window/assets/rain-sounds.mp3',
        './assets/sounds/Perfect Rain Sounds For Sleeping And Relaxing - ASMR, Study, Rain And Thunder Sounds For Deep Sleep.mp3'
      ];

      this.audio.src = possiblePaths[0];
      this.audio.loop = true;
      this.audio.volume = this.volume / 100;
      this.audio.preload = 'auto';

      let pathIndex = 0;

      // Add error handling for audio loading
      this.audio.addEventListener('error', (e) => {
        console.error('Audio loading error for path:', possiblePaths[pathIndex], e);
        pathIndex++;
        if (pathIndex < possiblePaths.length) {
          console.log('Trying alternative audio path:', possiblePaths[pathIndex]);
          this.audio!.src = possiblePaths[pathIndex];
        } else {
          console.error('All audio paths failed to load');
        }
      });

      this.audio.addEventListener('canplaythrough', () => {
        console.log('✅ Audio loaded and ready to play from:', this.audio!.src);
      });

      this.audio.addEventListener('loadstart', () => {
        console.log('🔄 Starting to load audio from:', this.audio!.src);
      });

      // Set up Web Audio API for EQ
      this.setupWebAudio();

      console.log('✅ Audio element created successfully');
    } catch (error) {
      console.error('❌ Failed to create audio element:', error);
    }
  }

  private setupWebAudio(): void {
    try {
      // Create audio context
      this.audioContext = new AudioContext();

      // Create source node from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio!);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume / 100;

      // Create EQ filters (10-band equalizer)
      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

      frequencies.forEach((freq) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        this.eqFilters.push(filter);
      });

      // Connect the audio graph: source -> filters -> gain -> destination
      let previousNode: AudioNode = this.sourceNode;

      this.eqFilters.forEach((filter) => {
        previousNode.connect(filter);
        previousNode = filter;
      });

      previousNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      console.log('✅ Web Audio API setup complete with EQ');
    } catch (error) {
      console.error('❌ Failed to setup Web Audio API:', error);
    }
  }

  private setupControls(): void {
    // Play/Pause button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.togglePlayback();
      });
    }

    // Volume control
    const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider) {
      volumeSlider.value = this.volume.toString();
      if (volumeValue) volumeValue.textContent = `${this.volume}%`;

      volumeSlider.addEventListener('input', (e) => {
        this.volume = parseInt((e.target as HTMLInputElement).value);
        this.updateVolume();
        if (volumeValue) volumeValue.textContent = `${this.volume}%`;
      });
    }

    // EQ page close button
    const eqPage = document.getElementById('eqPage');
    const closeEQBtn = document.getElementById('closeEQ');

    if (closeEQBtn && eqPage) {
      closeEQBtn.addEventListener('click', () => {
        eqPage.style.display = 'none';
      });
    }

    // Menu navigation
    this.setupMenuNavigation();

    // Volume popup
    const volumePage = document.getElementById('volumePage');
    const closeVolume = document.getElementById('closeVolume');

    if (closeVolume && volumePage) {
      closeVolume.addEventListener('click', () => {
        volumePage.style.display = 'none';
      });
    }

    // Dim screen button
    const dimScreenBtn = document.getElementById('dimScreen');
    const screenDimmer = document.getElementById('screenDimmer');

    if (dimScreenBtn && screenDimmer) {
      dimScreenBtn.addEventListener('click', () => {
        screenDimmer.style.display = 'flex';
      });

      screenDimmer.addEventListener('click', () => {
        screenDimmer.style.display = 'none';
      });
    }

    // Settings page controls
    const settingsPage = document.getElementById('settingsPage');
    const closeSettings = document.getElementById('closeSettings');
    const saveNameBtn = document.getElementById('saveName');
    const userNameInput = document.getElementById('userName') as HTMLInputElement;

    if (closeSettings && settingsPage) {
      closeSettings.addEventListener('click', () => {
        settingsPage.style.display = 'none';
      });
    }

    if (saveNameBtn && userNameInput && settingsPage) {
      saveNameBtn.addEventListener('click', () => {
        console.log('💾 Save button clicked');
        const newName = userNameInput.value.trim();
        console.log('💾 New name:', newName);
        if (newName) {
          localStorage.setItem('userName', newName);
          this.updateSoundTitle(); // Update the sound title immediately
          this.showSettingsSavedNotification();
        } else {
          alert('Please enter a name');
        }
      });
    }

    // Check for updates button
    const checkUpdatesBtn = document.getElementById('checkUpdates');
    const updateStatus = document.getElementById('updateStatus');

    if (checkUpdatesBtn) {
      checkUpdatesBtn.addEventListener('click', async () => {
        if (updateStatus) {
          updateStatus.style.display = 'block';
          updateStatus.textContent = 'Checking for updates...';
        }

        try {
          await window.electronAPI.checkForUpdates();
          if (updateStatus) {
            updateStatus.textContent = 'Update check initiated. You will be notified if an update is available.';
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
          if (updateStatus) {
            updateStatus.textContent = 'Error checking for updates. Please try again later.';
          }
        }
      });
    }

    // Auto-updater event hooks for user feedback
    try {
      // @ts-ignore
      const api = (window as any).electronAPI;
      if (api?.onUpdateAvailable) {
        api.onUpdateAvailable((version: string) => {
          if (updateStatus) {
            updateStatus.style.display = 'block';
            updateStatus.textContent = `Update ${version} available. Starting download...`;
          }
        });
      }
      if (api?.onUpdateDownloadProgress) {
        api.onUpdateDownloadProgress((percent: number) => {
          if (updateStatus) {
            updateStatus.style.display = 'block';
            updateStatus.textContent = `Downloading update: ${percent}%`;
          }
        });
      }
      if (api?.onUpdateDownloaded) {
        api.onUpdateDownloaded((version: string) => {
          if (updateStatus) {
            updateStatus.style.display = 'block';
            updateStatus.textContent = `Update ${version} downloaded. The app may restart to install.`;
          }
        });
      }
      if (api?.onUpdateError) {
        api.onUpdateError((message: string) => {
          if (updateStatus) {
            updateStatus.style.display = 'block';
            updateStatus.textContent = `Update error: ${message}`;
          }
        });
      }
    } catch (e) {
      console.warn('Updater event wiring failed', e);
    }


    // Time format toggle buttons
    const time12hrBtn = document.getElementById('time12hr');
    const time24hrBtn = document.getElementById('time24hr');

    // Load saved time format preference
    const savedTimeFormat = localStorage.getItem('timeFormat') || '12';
    if (savedTimeFormat === '24') {
      time12hrBtn?.classList.remove('active');
      time24hrBtn?.classList.add('active');
    }

    if (time12hrBtn) {
      time12hrBtn.addEventListener('click', () => {
        localStorage.setItem('timeFormat', '12');
        time12hrBtn.classList.add('active');
        time24hrBtn?.classList.remove('active');
        this.showSettingsSavedNotification();
      });
    }

    if (time24hrBtn) {
      time24hrBtn.addEventListener('click', () => {
        localStorage.setItem('timeFormat', '24');
        time24hrBtn.classList.add('active');
        time12hrBtn?.classList.remove('active');
        this.showSettingsSavedNotification();
      });
    }

    // Pronoun selection buttons
    const pronounWomanBtn = document.getElementById('pronounWoman');
    const pronounManBtn = document.getElementById('pronounMan');
    const pronounTheyBtn = document.getElementById('pronounThey');
    const pronounNonBinaryBtn = document.getElementById('pronounNonBinary');
    const pronounBtns = [pronounWomanBtn, pronounManBtn, pronounTheyBtn, pronounNonBinaryBtn];

    // Load saved pronoun preference (default to nonbinary)
    const savedPronoun = localStorage.getItem('userPronoun') || 'nonbinary';

    // Set active button based on saved preference
    if (savedPronoun === 'woman') {
      pronounWomanBtn?.classList.add('active');
    } else if (savedPronoun === 'man') {
      pronounManBtn?.classList.add('active');
    } else if (savedPronoun === 'they') {
      pronounTheyBtn?.classList.add('active');
    } else {
      pronounNonBinaryBtn?.classList.add('active');
    }

    // Helper function to set active pronoun button
    const setActivePronoun = (activeBtn: HTMLElement | null, pronoun: string) => {
      pronounBtns.forEach(btn => btn?.classList.remove('active'));
      activeBtn?.classList.add('active');
      localStorage.setItem('userPronoun', pronoun);
      this.showSettingsSavedNotification();
    };

    if (pronounWomanBtn) {
      pronounWomanBtn.addEventListener('click', () => {
        setActivePronoun(pronounWomanBtn, 'woman');
      });
    }

    if (pronounManBtn) {
      pronounManBtn.addEventListener('click', () => {
        setActivePronoun(pronounManBtn, 'man');
      });
    }

    if (pronounTheyBtn) {
      pronounTheyBtn.addEventListener('click', () => {
        setActivePronoun(pronounTheyBtn, 'they');
      });
    }

    if (pronounNonBinaryBtn) {
      pronounNonBinaryBtn.addEventListener('click', () => {
        setActivePronoun(pronounNonBinaryBtn, 'nonbinary');
      });
    }

    // Beta features toggle
    const betaToggle = document.getElementById('betaToggle') as HTMLInputElement;
    const betaStatus = document.getElementById('betaStatus');

    if (betaToggle) {
      // Set initial state
      const betaEnabled = localStorage.getItem('betaEnabled') === 'true';
      betaToggle.checked = betaEnabled;
      if (betaStatus) {
        betaStatus.textContent = betaEnabled ? 'Enabled' : 'Disabled';
      }

      betaToggle.addEventListener('change', () => {
        const isEnabled = betaToggle.checked;
        localStorage.setItem('betaEnabled', isEnabled.toString());
        if (betaStatus) {
          betaStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
        }
        this.showSettingsSavedNotification();
        // Update camera button visibility
        this.checkBetaFeatures();
      });
    }
  }

  private async togglePlayback(): Promise<void> {
    const screenDimmer = document.getElementById('screenDimmer');
    const hueDimOnSleep = document.getElementById('hueDimOnSleep') as HTMLInputElement;

    try {
      if (this.isPlaying) {
        // Stop playback
        if (this.audio) {
          this.audio.pause();
        }
        this.isPlaying = false;
        // Turn screen back on when stopping
        if (screenDimmer) {
          screenDimmer.style.display = 'none';
        }
        // Restore Hue lights to their previous state if enabled
        if (hueDimOnSleep && hueDimOnSleep.checked && this.hue.isConnected()) {
          await this.hue.restoreLightStates();
          // Update light switch state after restoring
          setTimeout(() => {
            this.updateLightSwitchState();
          }, 1500);
        }
      } else {
        // Start playback
        if (this.audio) {
          await this.audio.play();
        }
        this.isPlaying = true;
        // Dim screen when starting to play
        if (screenDimmer) {
          screenDimmer.style.display = 'flex';
        }
        // Dim Hue lights if enabled
        if (hueDimOnSleep && hueDimOnSleep.checked && this.hue.isConnected()) {
          await this.hue.dimLights(2); // Gradually dim over 2 seconds
          // Update light switch state after dimming
          setTimeout(() => {
            this.updateLightSwitchState();
          }, 3000); // Wait for dim + turn off to complete
        }
      }
      this.updatePlayButton();
    } catch (error) {
      console.error('Error toggling playback:', error);
      alert('Error playing audio. Please check if the audio file exists.');
    }
  }

  private updateVolume(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume / 100;
    } else if (this.audio) {
      this.audio.volume = this.volume / 100;
    }
  }

  private updatePlayButton(): void {
    const playBtn = document.getElementById('playBtn');
    const playIcon = playBtn?.querySelector('.play-icon');

    if (playBtn && playIcon) {
      if (this.isPlaying) {
        playBtn.classList.add('playing');
        playIcon.textContent = '⏸️';
      } else {
        playBtn.classList.remove('playing');
        playIcon.textContent = '😴';
      }
    }
  }

  private setupEQControls(): void {
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const frequencyLabels = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];

    frequencies.forEach((freq, index) => {
      const slider = document.getElementById(`eq-${freq}`) as HTMLInputElement;
      const valueDisplay = document.getElementById(`eq-value-${freq}`);

      if (slider && this.eqFilters[index]) {
        // Set initial value
        slider.value = this.eqFilters[index].gain.value.toString();
        if (valueDisplay) {
          valueDisplay.textContent = `${this.eqFilters[index].gain.value > 0 ? '+' : ''}${this.eqFilters[index].gain.value.toFixed(1)}dB`;
        }

        // Add event listener
        slider.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          this.eqFilters[index].gain.value = value;
          if (valueDisplay) {
            valueDisplay.textContent = `${value > 0 ? '+' : ''}${value.toFixed(1)}dB`;
          }
        });
      }
    });

    // Reset button
    const resetBtn = document.getElementById('resetEQFull');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.eqFilters.forEach((filter, index) => {
          filter.gain.value = 0;
          const slider = document.getElementById(`eq-${frequencies[index]}`) as HTMLInputElement;
          const valueDisplay = document.getElementById(`eq-value-${frequencies[index]}`);
          if (slider) slider.value = '0';
          if (valueDisplay) valueDisplay.textContent = '0.0dB';
        });
      });
    }

    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const preset = (e.target as HTMLElement).dataset.preset;
        this.applyEQPreset(preset || 'flat', frequencies);
      });
    });
  }

  private applyEQPreset(preset: string, frequencies: number[]): void {
    const presets: { [key: string]: number[] } = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
      treble: [0, 0, 0, 0, 0, 0, 2, 4, 6, 8],
      vocal: [0, 0, 2, 4, 4, 3, 2, 0, 0, 0]
    };

    const values = presets[preset] || presets.flat;

    this.eqFilters.forEach((filter, index) => {
      filter.gain.value = values[index];
      const slider = document.getElementById(`eq-${frequencies[index]}`) as HTMLInputElement;
      const valueDisplay = document.getElementById(`eq-value-${frequencies[index]}`);
      if (slider) slider.value = values[index].toString();
      if (valueDisplay) {
        valueDisplay.textContent = `${values[index] > 0 ? '+' : ''}${values[index].toFixed(1)}dB`;
      }
    });
  }

  private checkBetaFeatures(): void {
    const betaEnabled = localStorage.getItem('betaEnabled') === 'true';
    const cameraBtn = document.getElementById('menuCamera');

    if (cameraBtn) {
      cameraBtn.style.display = betaEnabled ? 'block' : 'none';
    }
  }

  private setupMenuNavigation(): void {
    const menuHome = document.getElementById('menuHome');
    const menuTimer = document.getElementById('menuTimer');
    const menuVolume = document.getElementById('menuVolume');
    const menuEQ = document.getElementById('menuEQ');
    const menuCamera = document.getElementById('menuCamera');
    const menuSettings = document.getElementById('menuSettings');

    const homePage = document.getElementById('homePage');
    const timerPage = document.getElementById('timerPage');
    const volumePage = document.getElementById('volumePage');
    const eqPage = document.getElementById('eqPage');
    const cameraPage = document.getElementById('cameraPage');
    const settingsPage = document.getElementById('settingsPage');
    const userNameInput = document.getElementById('userName') as HTMLInputElement;

    const menuItems = [menuHome, menuTimer, menuVolume, menuEQ, menuSettings];

    // Store reference to this for use in nested functions
    const self = this;

    const switchPage = (activeIndex: number) => {
      // Home button - show greeting screen
      if (activeIndex === 0) {
        const homeScreen = document.getElementById('homeScreen');
        const app = document.getElementById('app');
        if (homeScreen && app) {
          // Update greeting before showing
          self.updateGreeting();
          // Hide main app, show greeting screen
          app.style.display = 'none';
          homeScreen.style.display = 'flex';
          homeScreen.classList.remove('fade-out');
          // Start clock update
          self.updateClock();
        }
        return;
      }

      // For volume, EQ, camera, and settings - show as modal overlays
      if (activeIndex === 2) {
        // Volume popup
        if (volumePage) volumePage.style.display = 'flex';
        return;
      } else if (activeIndex === 3) {
        // EQ page
        if (eqPage) {
          eqPage.style.display = 'flex';
          this.setupEQControls();
        }
        return;
      } else if (activeIndex === 4) {
        // Camera page
        if (cameraPage) cameraPage.style.display = 'flex';
        return;
      } else if (activeIndex === 5) {
        // Settings page
        if (settingsPage) {
          settingsPage.style.display = 'flex';
          if (userNameInput) {
            userNameInput.value = this.getUserName();
          }
        }
        return;
      }

      // For timer - switch pages normally
      // Hide home and timer pages
      if (homePage) homePage.style.display = 'none';
      if (timerPage) timerPage.style.display = 'none';

      // Remove active class from home and timer menu items
      if (menuHome) menuHome.classList.remove('active');
      if (menuTimer) menuTimer.classList.remove('active');

      // Show selected page and activate menu item
      if (activeIndex === 1 && timerPage) {
        timerPage.style.display = 'flex';
        if (menuTimer) menuTimer.classList.add('active');
      }
    };

    if (menuHome) {
      menuHome.addEventListener('click', () => switchPage(0));
    }

    if (menuTimer) {
      menuTimer.addEventListener('click', () => switchPage(1));
    }

    if (menuVolume) {
      menuVolume.addEventListener('click', () => switchPage(2));
    }

    if (menuEQ) {
      menuEQ.addEventListener('click', () => switchPage(3));
    }

    if (menuCamera) {
      menuCamera.addEventListener('click', () => switchPage(4));
    }

    if (menuSettings) {
      menuSettings.addEventListener('click', () => switchPage(5));
    }

    // Camera page close button
    const closeCamera = document.getElementById('closeCamera');
    if (closeCamera && cameraPage) {
      closeCamera.addEventListener('click', () => {
        cameraPage.style.display = 'none';
      });

      // Also close when clicking outside the modal
      cameraPage.addEventListener('click', (e) => {
        if (e.target === cameraPage) {
          cameraPage.style.display = 'none';
        }
      });
    }
  }

  private setupHueControls(): void {
    const connectHueBtn = document.getElementById('connectHue');
    const hueBridgeIPInput = document.getElementById('hueBridgeIP') as HTMLInputElement;
    const hueStatus = document.getElementById('hueStatus');
    const hueStatusText = document.getElementById('hueStatusText');
    const hueOptions = document.getElementById('hueOptions');
    const refreshLightsBtn = document.getElementById('refreshLights');
    const hueLightsList = document.getElementById('hueLightsList');

    // Load and display rooms/groups
    const loadLights = async () => {
      if (!this.hue.isConnected() || !hueLightsList) return;

      hueLightsList.innerHTML = '<p class="loading-text">Loading rooms...</p>';

      try {
        const groups = await this.hue.getGroups();
        console.log('💡 Groups received:', groups);

        if (!groups || Object.keys(groups).length === 0) {
          hueLightsList.innerHTML = '<p class="loading-text">No rooms found</p>';
          return;
        }

        const selectedGroups = this.hue.getSelectedGroups();
        hueLightsList.innerHTML = '';

        let roomCount = 0;

        // Filter to only show Room and Zone types (not "0" which is all lights)
        Object.entries(groups).forEach(([groupId, group]) => {
          console.log(`💡 Group ${groupId}:`, group.name, group.type);

          // Skip group 0 (all lights) and only show rooms/zones
          if (groupId === '0') return;
          if (!group.type || (group.type !== 'Room' && group.type !== 'Zone')) return;

          roomCount++;

          const lightItem = document.createElement('div');
          lightItem.className = 'light-item';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = `group-${groupId}`;
          checkbox.checked = selectedGroups.includes(groupId);
          checkbox.addEventListener('change', () => {
            updateSelectedGroups();
          });

          const label = document.createElement('label');
          label.htmlFor = `group-${groupId}`;

          // Get room icon based on room class
          const roomIcon = getRoomIcon(group.class || group.type);
          const lightCount = group.lights ? group.lights.length : 0;

          label.innerHTML = `
            <span class="light-icon">${roomIcon}</span>
            <span class="light-name">${group.name}</span>
            <span class="light-status">${lightCount} light${lightCount !== 1 ? 's' : ''}</span>
          `;

          lightItem.appendChild(checkbox);
          lightItem.appendChild(label);
          hueLightsList.appendChild(lightItem);
        });

        console.log(`💡 Total rooms displayed: ${roomCount}`);

        // If no rooms were added, show message
        if (roomCount === 0) {
          hueLightsList.innerHTML = '<p class="loading-text">No rooms found. Create rooms in the Hue app.</p>';
        }
      } catch (error) {
        console.error('💡 Error loading rooms:', error);
        hueLightsList.innerHTML = '<p class="loading-text">Error loading rooms</p>';
      }
    };

    // Get appropriate icon for room type
    const getRoomIcon = (roomClass: string): string => {
      const icons: { [key: string]: string } = {
        'Living room': '🛋️',
        'Bedroom': '🛏️',
        'Bathroom': '🚿',
        'Kitchen': '🍳',
        'Dining': '🍽️',
        'Office': '💼',
        'Kids bedroom': '🧸',
        'Hallway': '🚪',
        'Garage': '🚗',
        'Garden': '🌳',
        'Terrace': '🌿',
        'Other': '🏠',
        'Room': '🏠',
        'Zone': '📍'
      };
      return icons[roomClass] || '🏠';
    };

    // Update selected groups in the integration
    const updateSelectedGroups = () => {
      if (!hueLightsList) return;

      const checkboxes = hueLightsList.querySelectorAll('input[type="checkbox"]');
      const selectedIds: string[] = [];

      checkboxes.forEach((checkbox) => {
        if ((checkbox as HTMLInputElement).checked) {
          const groupId = (checkbox as HTMLInputElement).id.replace('group-', '');
          selectedIds.push(groupId);
        }
      });

      this.hue.setSelectedGroups(selectedIds);
      console.log('Selected rooms:', selectedIds);
    };

    // Update UI based on connection status
    const updateHueUI = async () => {
      if (this.hue.isConnected()) {
        if (hueStatus && hueStatusText) {
          hueStatus.style.display = 'block';
          hueStatusText.textContent = `✅ Connected to Hue Bridge (${this.hue.getBridgeIP()})`;
        }
        if (hueOptions) {
          hueOptions.style.display = 'flex';
        }
        if (connectHueBtn) {
          connectHueBtn.textContent = 'Reconnect';
        }
        if (hueBridgeIPInput) {
          hueBridgeIPInput.value = this.hue.getBridgeIP() || '';
        }
        // Load lights when connected
        await loadLights();
      } else {
        if (hueStatus) {
          hueStatus.style.display = 'none';
        }
        if (hueOptions) {
          hueOptions.style.display = 'none';
        }
        if (connectHueBtn) {
          connectHueBtn.textContent = 'Connect';
        }
      }
    };

    // Initial UI update
    updateHueUI();

    // Refresh lights button handler
    if (refreshLightsBtn) {
      refreshLightsBtn.addEventListener('click', async () => {
        await loadLights();
      });
    }

    // Connect button handler
    if (connectHueBtn && hueBridgeIPInput) {
      connectHueBtn.addEventListener('click', async () => {
        try {
          const manualIP = hueBridgeIPInput.value.trim();

          connectHueBtn.textContent = 'Connecting...';
          connectHueBtn.setAttribute('disabled', 'true');

          let bridgeIP = manualIP;

          // If no manual IP provided, try to discover
          if (!bridgeIP) {
            connectHueBtn.textContent = 'Searching...';
            bridgeIP = await this.hue.discoverBridge() || '';

            if (!bridgeIP) {
              alert('No Philips Hue Bridge found.\n\nPlease enter your bridge IP address manually.\n\nYou can find it in the Philips Hue app:\nSettings → My Hue System → [Your Bridge] → IP Address');
              connectHueBtn.textContent = 'Connect';
              connectHueBtn.removeAttribute('disabled');
              return;
            }

            hueBridgeIPInput.value = bridgeIP;
          } else {
            // Use manual IP
            this.hue.setBridgeIP(bridgeIP);
          }

          // Show instructions
          const proceed = confirm(
            `Connecting to Hue Bridge at ${bridgeIP}\n\n` +
            '1. Press the LINK BUTTON on your Hue Bridge NOW\n' +
            '2. Click OK within 30 seconds\n\n' +
            'The link button is the round button on top of the bridge.'
          );

          if (!proceed) {
            connectHueBtn.textContent = 'Connect';
            connectHueBtn.removeAttribute('disabled');
            return;
          }

          connectHueBtn.textContent = 'Authenticating...';

          // Try to authenticate
          const success = await this.hue.authenticate();

          if (success) {
            alert('✅ Successfully connected to Philips Hue!\n\nYour lights will now automatically dim when you press the sleep button.');
            updateHueUI();
          } else {
            alert('❌ Failed to connect. Please try again and make sure you pressed the link button.');
          }

          connectHueBtn.textContent = 'Connect';
          connectHueBtn.removeAttribute('disabled');
        } catch (error: any) {
          alert('❌ Error: ' + (error.message || 'Could not connect to Hue Bridge'));
          connectHueBtn.textContent = 'Connect';
          connectHueBtn.removeAttribute('disabled');
        }
      });
    }
  }

  private setupHomeLightControls(): void {
    const lightSwitchContainer = document.getElementById('lightSwitchContainer');
    const lightSwitchToggle = document.getElementById('lightSwitchToggle') as HTMLInputElement;

    // Show light switch only if Hue is connected
    if (this.hue.isConnected() && lightSwitchContainer) {
      lightSwitchContainer.style.display = 'block';

      // Set initial state - check if any lights are on
      this.updateLightSwitchState();

      // Poll for light state changes every 5 seconds
      setInterval(() => {
        this.updateLightSwitchState();
      }, 5000);
    }

    // Light switch toggle handler
    if (lightSwitchToggle) {
      lightSwitchToggle.addEventListener('change', async () => {
        if (!this.hue.isConnected()) {
          alert('Please connect to your Hue Bridge in Settings first.');
          lightSwitchToggle.checked = !lightSwitchToggle.checked; // Revert
          return;
        }

        try {
          if (lightSwitchToggle.checked) {
            // Turn on all lights
            await this.hue.turnOnAllLights();
          } else {
            // Turn off all lights
            await this.hue.turnOffAllLightsInHouse();
          }

          // Update the switch state after a short delay to reflect actual state
          setTimeout(() => {
            this.updateLightSwitchState();
          }, 1000);
        } catch (error) {
          console.error('Error toggling lights:', error);
          // Revert the switch on error
          lightSwitchToggle.checked = !lightSwitchToggle.checked;
        }
      });
    }
  }

  private async updateLightSwitchState(): Promise<void> {
    const lightSwitchToggle = document.getElementById('lightSwitchToggle') as HTMLInputElement;
    if (!lightSwitchToggle || !this.hue.isConnected()) return;

    try {
      const lights = await this.hue.getLights();
      if (!lights) return;

      // Check if any lights are on
      const anyLightsOn = Object.values(lights).some((light: any) => light.state.on);
      lightSwitchToggle.checked = anyLightsOn;
    } catch (error) {
      console.error('Error checking light state:', error);
    }
  }

  private setupCameraControls(): void {
    console.log('📹 Setting up camera controls...');

    const blinkLoginForm = document.getElementById('blinkLoginForm');
    const blink2FAForm = document.getElementById('blink2FAForm');
    const cameraView = document.getElementById('cameraView');
    const blinkLoginBtn = document.getElementById('blinkLoginBtn') as HTMLButtonElement;
    const blinkEmail = document.getElementById('blinkEmail') as HTMLInputElement;
    const blinkPassword = document.getElementById('blinkPassword') as HTMLInputElement;
    const blinkLoginStatus = document.getElementById('blinkLoginStatus');
    const blink2FACode = document.getElementById('blink2FACode') as HTMLInputElement;
    const blink2FABtn = document.getElementById('blink2FABtn') as HTMLButtonElement;
    const blink2FACancel = document.getElementById('blink2FACancel') as HTMLButtonElement;
    const blink2FAStatus = document.getElementById('blink2FAStatus');
    const phoneLastDigits = document.getElementById('phoneLastDigits');
    const cameraSelect = document.getElementById('cameraSelect') as HTMLSelectElement;
    const cameraSnapshot = document.getElementById('cameraSnapshot') as HTMLImageElement;
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const refreshCamera = document.getElementById('refreshCamera') as HTMLButtonElement;
    const blinkLogout = document.getElementById('blinkLogout');

    // Check if already logged in
    if (this.blink.isLoggedIn()) {
      console.log('📹 User already logged in to Blink');
      if (blinkLoginForm) blinkLoginForm.style.display = 'none';
      if (blink2FAForm) blink2FAForm.style.display = 'none';
      if (cameraView) cameraView.style.display = 'block';
      this.loadCameras();
    } else {
      console.log('📹 User not logged in to Blink');
    }

    // Login button
    if (blinkLoginBtn) {
      blinkLoginBtn.addEventListener('click', async () => {
        const email = blinkEmail?.value.trim();
        const password = blinkPassword?.value;

        if (!email || !password) {
          if (blinkLoginStatus) {
            blinkLoginStatus.textContent = '❌ Please enter email and password';
            blinkLoginStatus.style.display = 'block';
            blinkLoginStatus.style.color = '#ff6b6b';
          }
          return;
        }

        // Show loading
        blinkLoginBtn.textContent = '⏳ Logging in...';
        blinkLoginBtn.disabled = true;

        const result = await this.blink.login(email, password);

        if (result.success) {
          if (blinkLoginStatus) {
            blinkLoginStatus.textContent = '✅ ' + result.message;
            blinkLoginStatus.style.display = 'block';
            blinkLoginStatus.style.color = '#4ade80';
          }

          // Hide login form, show camera view
          setTimeout(() => {
            if (blinkLoginForm) blinkLoginForm.style.display = 'none';
            if (cameraView) cameraView.style.display = 'block';
            this.loadCameras();
          }, 1000);
        } else if (result.requires2FA) {
          // Show 2FA form
          if (blinkLoginStatus) {
            blinkLoginStatus.textContent = '📱 ' + result.message;
            blinkLoginStatus.style.display = 'block';
            blinkLoginStatus.style.color = '#4ade80';
          }

          setTimeout(() => {
            if (blinkLoginForm) blinkLoginForm.style.display = 'none';
            if (blink2FAForm) blink2FAForm.style.display = 'block';
            if (result.accountId) {
              localStorage.setItem('blinkPendingAccountId', result.accountId);
            }
            // Show last 4 digits of phone if available
            if (phoneLastDigits) {
              phoneLastDigits.textContent = '****';
            }
            if (blink2FACode) blink2FACode.focus();
          }, 1000);
        } else {
          if (blinkLoginStatus) {
            blinkLoginStatus.textContent = '❌ ' + result.message;
            blinkLoginStatus.style.display = 'block';
            blinkLoginStatus.style.color = '#ff6b6b';
          }
          blinkLoginBtn.textContent = '🔐 Login to Blink';
          blinkLoginBtn.disabled = false;
        }
      });
    }

    // 2FA Verify button
    if (blink2FABtn) {
      blink2FABtn.addEventListener('click', async () => {
        const code = blink2FACode?.value.trim();
        const accountId = localStorage.getItem('blinkPendingAccountId');

        if (!code || code.length !== 6) {
          if (blink2FAStatus) {
            blink2FAStatus.textContent = '❌ Please enter a 6-digit code';
            blink2FAStatus.style.display = 'block';
            blink2FAStatus.style.color = '#ff6b6b';
          }
          return;
        }

        if (!accountId) {
          if (blink2FAStatus) {
            blink2FAStatus.textContent = '❌ Session expired. Please login again.';
            blink2FAStatus.style.display = 'block';
            blink2FAStatus.style.color = '#ff6b6b';
          }
          return;
        }

        // Show loading
        blink2FABtn.textContent = '⏳ Verifying...';
        blink2FABtn.disabled = true;

        const result = await this.blink.verify2FA(accountId, code);

        if (result.success) {
          if (blink2FAStatus) {
            blink2FAStatus.textContent = '✅ ' + result.message;
            blink2FAStatus.style.display = 'block';
            blink2FAStatus.style.color = '#4ade80';
          }

          // Hide 2FA form, show camera view
          setTimeout(() => {
            if (blink2FAForm) blink2FAForm.style.display = 'none';
            if (cameraView) cameraView.style.display = 'block';
            this.loadCameras();
          }, 1000);
        } else {
          if (blink2FAStatus) {
            blink2FAStatus.textContent = '❌ ' + result.message;
            blink2FAStatus.style.display = 'block';
            blink2FAStatus.style.color = '#ff6b6b';
          }
          blink2FABtn.textContent = '✅ Verify Code';
          blink2FABtn.disabled = false;
        }
      });
    }

    // 2FA Cancel button
    if (blink2FACancel) {
      blink2FACancel.addEventListener('click', () => {
        if (blink2FAForm) blink2FAForm.style.display = 'none';
        if (blinkLoginForm) blinkLoginForm.style.display = 'block';
        if (blink2FACode) blink2FACode.value = '';
        if (blink2FAStatus) blink2FAStatus.style.display = 'none';
        if (blinkLoginBtn) {
          blinkLoginBtn.textContent = '🔐 Login to Blink';
          blinkLoginBtn.disabled = false;
        }
        localStorage.removeItem('blinkPendingAccountId');
      });
    }

    // Camera selection
    if (cameraSelect) {
      cameraSelect.addEventListener('change', async () => {
        const selectedValue = cameraSelect.value;
        if (!selectedValue) return;

        const [networkId, cameraId] = selectedValue.split('-').map(Number);
        await this.showCameraSnapshot(networkId, cameraId);
      });
    }

    // Refresh button
    if (refreshCamera) {
      refreshCamera.addEventListener('click', async () => {
        const selectedValue = cameraSelect?.value;
        if (!selectedValue) return;

        const [networkId, cameraId] = selectedValue.split('-').map(Number);
        refreshCamera.textContent = '⏳ Refreshing...';
        refreshCamera.disabled = true;

        await this.showCameraSnapshot(networkId, cameraId, true);

        refreshCamera.textContent = '🔄 Refresh Snapshot';
        refreshCamera.disabled = false;
      });
    }

    // Logout button
    if (blinkLogout) {
      blinkLogout.addEventListener('click', () => {
        this.blink.logout();
        if (cameraView) cameraView.style.display = 'none';
        if (blink2FAForm) blink2FAForm.style.display = 'none';
        if (blinkLoginForm) blinkLoginForm.style.display = 'block';
        if (blinkPassword) blinkPassword.value = '';
        if (blink2FACode) blink2FACode.value = '';
        if (blinkLoginStatus) blinkLoginStatus.style.display = 'none';
        if (blink2FAStatus) blink2FAStatus.style.display = 'none';
        if (cameraSnapshot) cameraSnapshot.style.display = 'none';
        if (cameraPlaceholder) cameraPlaceholder.style.display = 'block';
        localStorage.removeItem('blinkPendingAccountId');
      });
    }
  }

  private async loadCameras(): Promise<void> {
    const cameraSelect = document.getElementById('cameraSelect') as HTMLSelectElement;
    if (!cameraSelect) return;

    try {
      cameraSelect.innerHTML = '<option value="">Loading cameras...</option>';
      const cameras = await this.blink.getCameras();

      if (cameras.length === 0) {
        cameraSelect.innerHTML = '<option value="">No cameras found</option>';
        return;
      }

      cameraSelect.innerHTML = '<option value="">Select a camera</option>';
      cameras.forEach((camera: any) => {
        const option = document.createElement('option');
        option.value = `${camera.network_id}-${camera.id}`;
        option.textContent = camera.name || `Camera ${camera.id}`;
        cameraSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading cameras:', error);
      cameraSelect.innerHTML = '<option value="">Error loading cameras</option>';
    }
  }

  private async showCameraSnapshot(networkId: number, cameraId: number, forceRefresh: boolean = false): Promise<void> {
    const cameraSnapshot = document.getElementById('cameraSnapshot') as HTMLImageElement;
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');

    if (!cameraSnapshot) return;

    try {
      let thumbnailUrl: string | null;

      if (forceRefresh) {
        // Request a new thumbnail
        thumbnailUrl = await this.blink.getThumbnail(networkId, cameraId);
      } else {
        // Get the latest thumbnail
        thumbnailUrl = this.blink.getLatestThumbnailUrl(networkId, cameraId);
      }

      if (thumbnailUrl) {
        console.log(`📹 Thumbnail URL: ${thumbnailUrl}`);
        // Fetch the image through the main process with authenticated headers
        if (window.electronAPI && window.electronAPI.fetchBlinkImage) {
          try {
            console.log('📹 Fetching image through main process with auth...');

            // When forcing a refresh, poll a few times with a cache-busting ts param
            const tryFetch = async (url: string) => {
              return await window.electronAPI.fetchBlinkImage(url);
            };

            let dataUrl: string | null = null;
            if (forceRefresh) {
              const maxAttempts = 5;
              for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const u = new URL(thumbnailUrl);
                u.searchParams.set('ts', Date.now().toString());
                console.log(`📹 Attempt ${attempt}/${maxAttempts} fetching refreshed snapshot...`);
                const result = await tryFetch(u.toString());
                // If different from currently displayed image, accept immediately
                if (result && result !== cameraSnapshot.src) {
                  dataUrl = result;
                  break;
                }
                // Otherwise wait a bit and try again
                await new Promise(r => setTimeout(r, 1000));
              }
              // If still null (unchanged), fetch once more and use it anyway
              if (!dataUrl) {
                const u = new URL(thumbnailUrl);
                u.searchParams.set('ts', Date.now().toString());
                dataUrl = await tryFetch(u.toString());
              }
            } else {
              dataUrl = await tryFetch(thumbnailUrl);
            }

            if (dataUrl) {
              console.log(`📹 Received data URL, length: ${dataUrl.length}`);
              cameraSnapshot.src = dataUrl;
              cameraSnapshot.style.display = 'block';
              if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
              console.log('📹 Image loaded successfully');
            }
          } catch (error) {
            console.error('❌ Failed to fetch image:', error);
            if (cameraPlaceholder) {
              // @ts-ignore - error may be string or Error
              const msg = (error && (error.message || error.toString())) || 'Unknown error';
              cameraPlaceholder.textContent = `Failed to load camera snapshot: ${msg}`;
              cameraPlaceholder.style.display = 'block';
            }
            cameraSnapshot.style.display = 'none';
          }
        } else {
          console.error('❌ fetchBlinkImage API not available');
          if (cameraPlaceholder) {
            cameraPlaceholder.textContent = 'Failed to load camera snapshot';
            cameraPlaceholder.style.display = 'block';
          }
          cameraSnapshot.style.display = 'none';
        }
      } else {
        if (cameraPlaceholder) {
          cameraPlaceholder.textContent = 'Failed to load camera snapshot';
          cameraPlaceholder.style.display = 'block';
        }
        cameraSnapshot.style.display = 'none';
      }
    } catch (error) {
      console.error('Error showing camera snapshot:', error);
      if (cameraPlaceholder) {
        cameraPlaceholder.textContent = 'Error loading camera snapshot';
        cameraPlaceholder.style.display = 'block';
      }
      cameraSnapshot.style.display = 'none';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 DOM loaded, initializing Sound Machine...');
  new SoundMachine();
});
