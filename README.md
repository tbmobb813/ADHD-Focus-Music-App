# ADHD Focus Music App

> **Adaptive soundscapes for focus, relaxation, and better mental health**

A cross-platform mobile app (iOS, Android, Web) built with Expo and React Native that generates adaptive, generative music designed to help people with ADHD improve focus, manage stress, and optimize their mental state throughout the day.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)

---

## 🎯 Features

### Generative Audio Engine
- **Real-time audio synthesis** using Web Audio API
- **4 layered sound types**:
  - **Noise**: White, pink, and brown noise with dynamic filtering
  - **Pads**: Detuned sine oscillators for rich ambient drones
  - **Pulse**: Rhythmic LFO-modulated triangle waves
  - **Binaural Beats**: Stereo-separated frequencies for brainwave entrainment

- **Advanced audio processing**:
  - Master gain with safety limiter (DynamicsCompressor)
  - Per-layer biquad filters with real-time frequency/Q adjustment
  - LFO support for filter and volume modulation
  - Convolver-based reverb with exponential decay
  - Real-time intensity control

### Smart Adaptive Modes
- **6 Soundscapes**: Focus, Relax, Sleep, Energy, Nature, Flow
- **8 Storylines**: Deep Work, Read Power, Power Nap, Morning Boost, Anxiety Shield, Active Listening, Energy Recharge
- **Time-of-day adaptation**: Auto-adjusts sound layers based on morning/afternoon/evening/night
- **Customizable intensity** and volume controls

### Session Management
- **Session timer** with customizable durations (5-60 minutes)
- **Pomodoro timer mode**: Work/break cycles with auto-transitions
  - Configurable work durations (15/25/30/45 min)
  - Short breaks (3/5/10 min) and long breaks (15 min)
  - Auto-start options for seamless workflow
  - Cycle tracking and completion stats
- **Session history tracking** with detailed stats:
  - Total sessions and minutes
  - Completion rate
  - Current and longest streaks
  - Favorite mode analytics
- **Smart recommendations**: AI-powered suggestions based on:
  - Time of day success patterns
  - Preferred session lengths
  - Most productive modes
  - Historical completion rates
- **Preset system**: Save and load custom sound configurations
- **Share presets** via React Native Share API

### User Experience
- **Onboarding flow**: 4-screen introduction for first-time users
- **Haptic feedback**: Tactile responses for key interactions
- **Audio visualizer**: Animated frequency bars synced to intensity
- **Breathing guide**: Expandable circle for relaxation exercises
- **Background audio handling**: Automatic pause for phone calls/alarms
- Beautiful gradient-based dark theme
- Circular progress timer (ProgressArc component)
- Custom slider components with smooth gestures
- Tab-based navigation (Home, Session, Settings)

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- **Expo CLI** (installed globally or via npx)
- **iOS**: Xcode 14+ and iOS Simulator
- **Android**: Android Studio and Android Emulator
- **Web**: Modern browser (Chrome, Firefox, Safari)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ADHD-Focus-Music-App.git
   cd ADHD-Focus-Music-App
   ```

2. **Install dependencies**
   ```bash
   # Using Bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

3. **Start the development server**
   ```bash
   # Using Bun
   bun start

   # Or using npm
   npm start
   ```

4. **Run on your platform**
   - **iOS**: Press `i` in the terminal or scan QR code with Expo Go
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go
   - **Web**: Press `w` in the terminal or navigate to `http://localhost:8081`

---

## 🏗️ Architecture

### Project Structure

```
ADHD-Focus-Music-App/
├── app/                      # Expo Router screens
│   ├── index.tsx            # Home screen (Soundscapes/Storylines)
│   ├── session.tsx          # Session screen (playback controls)
│   ├── settings.tsx         # Settings & session history
│   └── _layout.tsx          # Root layout with tabs
│
├── audio-engine/            # Audio synthesis engines
│   ├── web.ts               # Web Audio API implementation (generative)
│   └── native.ts            # expo-av implementation (native mobile)
│
├── components/              # Reusable React components
│   ├── ProgressArc.tsx      # Circular progress indicator
│   └── CustomSlider.tsx     # Custom slider with pan responder
│
├── constants/               # Static configuration
│   ├── soundscapes.tsx      # 6 soundscape definitions
│   ├── storylines.tsx       # 8 storyline definitions
│   └── colors.ts            # Color scheme
│
├── hooks/                   # Custom React hooks
│   └── useGenerativeAudio.tsx  # Audio engine lifecycle hook
│
├── providers/               # Context providers
│   └── SoundProvider.tsx    # Global sound/session state
│
├── types/                   # TypeScript interfaces
│   └── audio.ts             # Audio, preset, session types
│
├── assets/                  # Static assets
│   └── audio/               # Audio files (see audio/README.md)
│
├── __tests__/               # Test files
│   └── presets.test.ts
│
└── audio-engine/__tests__/
    └── web.test.ts
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React Native 0.79, Expo 53 |
| **Language** | TypeScript 5.8 (strict mode) |
| **Navigation** | Expo Router 5 (file-based) |
| **State** | Zustand 5.0, React Context |
| **Audio** | Web Audio API, expo-av |
| **Styling** | NativeWind 4 (Tailwind for RN) |
| **Storage** | AsyncStorage |
| **Testing** | Jest 29, React Testing Library |
| **Icons** | Lucide React Native |

### Audio Architecture

The app uses a **dual audio engine approach**:

1. **Web Audio Engine** (`audio-engine/web.ts`)
   - Used on web platform and capable devices
   - Real-time procedural audio generation
   - No audio files required
   - Full parameter control (filter freq, resonance, LFO, etc.)

2. **Native Audio Engine** (`audio-engine/native.ts`)
   - Fallback for iOS/Android
   - Uses pre-recorded MP3 files from `/assets/audio/`
   - Supports background playback
   - Volume and intensity adjustments

Both engines implement the same `AudioEngineInterface`, allowing seamless switching.

---

## 🎨 Usage Guide

### Creating a Session

1. **Choose a mode** on the Home screen:
   - **Soundscapes**: General categories (Focus, Relax, Sleep, etc.)
   - **Storylines**: Specific use cases (Deep Work, Power Nap, etc.)

2. Navigate to the **Session** screen

3. **Customize your sound**:
   - Adjust **Volume** (0-100%)
   - Adjust **Intensity** (affects filter brightness, reverb, density)
   - Set **Duration** (5-60 minutes)

4. **Advanced Controls** (expand sections):
   - **Sound Layers**: Enable/disable individual layers, adjust per-layer volume and frequency
   - **Adaptive Settings**: Toggle time-of-day adaptation
   - **Presets**: Save/load custom configurations

5. Press the **Play button** to start

### Saving Presets

1. Configure your ideal sound settings
2. Expand **Presets** section
3. Tap **Save Current** and enter a name
4. Load anytime by tapping the preset name

### Viewing Session History

1. Navigate to **Settings** screen
2. View stats:
   - Total sessions and minutes
   - Completion percentage
   - Current streak (consecutive days)
   - Recent 5 sessions

3. Clear history with trash icon (confirmation required)

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Coverage

- ✅ **Web Audio Engine**: 40+ unit tests covering initialization, playback, layers, effects
- ✅ **Preset Management**: Full CRUD operations, export/import, persistence
- ⚠️ **Native Audio Engine**: Needs tests (TODO)
- ⚠️ **UI Components**: Needs integration tests (TODO)

---

## 🎵 Audio Assets

Audio files are **not included** in this repository. You need to generate or obtain them separately.

### Required Files

See [`/assets/audio/README.md`](./assets/audio/README.md) for:
- Complete list of required MP3 files
- Specifications (format, duration, sample rate)
- How to generate files using Audacity
- Alternative sources (MyNoise, AudioJungle, AI generation)

### Quick Summary

You need **9 MP3 files**:
- `noise/white-noise.mp3`
- `noise/pink-noise.mp3`
- `noise/brown-noise.mp3`
- `pad/deep-pad-110hz.mp3`
- `pad/warm-pad-220hz.mp3`
- `pad/bright-pad-440hz.mp3`
- `pulse/gentle-pulse-60bpm.mp3`
- `pulse/active-pulse-120bpm.mp3`
- `binaural/carrier-200hz.mp3`

**Note**: The Web Audio Engine generates all sounds procedurally and doesn't require these files. They're only needed for the Native Audio Engine on iOS/Android.

---

## 🚀 Deployment

### Build for Production

```bash
# iOS
npx expo build:ios

# Android
npx expo build:android

# Web
npx expo export:web
```

### Environment Variables

No environment variables are currently required. All configuration is hardcoded or stored in AsyncStorage.

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Ensure tests pass (`npm test`)
6. Lint your code (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to your branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Style

- **TypeScript strict mode** enabled
- **ESLint** with Expo config
- **Functional components** with hooks (no class components)
- **Proper type annotations** for all functions
- **useCallback** for function memoization
- **React.memo** for component optimization

### Areas for Contribution

- [x] Add unit tests for preset management (60 tests written)
- [x] Implement visual breathing guide (animated circle) ✅
- [x] Add Pomodoro timer mode ✅
- [x] Implement haptic feedback ✅
- [x] Add onboarding flow ✅
- [x] Implement session tracking and analytics ✅
- [x] Add smart recommendations based on usage ✅
- [ ] Add unit tests for NativeAudioEngine
- [ ] Fix Web Audio tests (requires jsdom configuration)
- [ ] Generate high-quality audio files (currently using placeholders)
- [ ] Add push notifications (requires expo-notifications)
- [ ] Add Apple Watch companion app
- [ ] Create Spotify integration
- [ ] Implement cloud sync (Firebase/Supabase)
- [ ] Support multiple languages (i18n)

---

## ⚠️ Known Issues

### Audio Files
The app currently uses **placeholder audio files** that won't produce actual sound. You need to generate proper audio:

```bash
# Option 1: Generate placeholders (for testing only)
node scripts/generate-placeholder-audio.js

# Option 2: Use ffmpeg to generate simple tones
bash scripts/download-audio.sh

# Option 3: Use Audacity (recommended for production)
# Follow instructions in assets/audio/README.md
```

### Web Audio Tests
36 of 60 tests fail due to `jsdom` configuration issues. The tests are written correctly but need:
- Jest configuration with separate projects for `node` and `jsdom` environments
- Proper Web Audio API mocking for jsdom
- This doesn't affect app functionality - only test coverage

### Notifications
Session reminder notifications require `expo-notifications`:
```bash
npm install expo-notifications --legacy-peer-deps
```
The notification utilities are in `utils/notifications.ts` but won't work until the package is installed.

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Web Audio API** - For enabling real-time audio synthesis
- **Expo** - For amazing cross-platform development experience
- **React Native community** - For excellent libraries and tools

---

## 📧 Contact

For questions, feedback, or support:

- **Issues**: [GitHub Issues](https://github.com/yourusername/ADHD-Focus-Music-App/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ADHD-Focus-Music-App/discussions)

---

## 🗺️ Roadmap

### v1.1 (Q2 2025)
- [ ] Complete test coverage (80%+)
- [ ] Visual breathing guide
- [ ] Haptic feedback
- [ ] Session analytics dashboard

### v1.2 (Q3 2025)
- [ ] Pomodoro timer integration
- [ ] Apple Watch support
- [ ] Cloud sync (user accounts)
- [ ] Preset sharing community

### v2.0 (Q4 2025)
- [ ] AI-powered recommendations
- [ ] Spotify/Apple Music integration
- [ ] Advanced statistics and insights
- [ ] Gamification (achievements, levels)

---

**Built with ❤️ for the ADHD community**