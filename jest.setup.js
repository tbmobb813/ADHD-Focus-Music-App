// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            setVolumeAsync: jest.fn(() => Promise.resolve()),
            setIsLoopingAsync: jest.fn(() => Promise.resolve()),
            playAsync: jest.fn(() => Promise.resolve()),
            pauseAsync: jest.fn(() => Promise.resolve()),
            stopAsync: jest.fn(() => Promise.resolve()),
            unloadAsync: jest.fn(() => Promise.resolve()),
          },
          status: {},
        })
      ),
    },
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    frequency: { value: 440, setValueAtTime: jest.fn() },
    type: 'sine',
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: { value: 1, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
    connect: jest.fn(),
  })),
  createBiquadFilter: jest.fn(() => ({
    type: 'lowpass',
    frequency: { value: 1000, setValueAtTime: jest.fn() },
    Q: { value: 1, setValueAtTime: jest.fn() },
    connect: jest.fn(),
  })),
  createDynamicsCompressor: jest.fn(() => ({
    threshold: { value: -50 },
    knee: { value: 40 },
    ratio: { value: 12 },
    attack: { value: 0 },
    release: { value: 0.25 },
    connect: jest.fn(),
  })),
  createConvolver: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
  })),
  createBuffer: jest.fn(),
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
  state: 'running',
  resume: jest.fn(() => Promise.resolve()),
  suspend: jest.fn(() => Promise.resolve()),
  close: jest.fn(() => Promise.resolve()),
}));

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
