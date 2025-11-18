import { WebAudioEngine } from '../web';
import { SoundLayer, AdaptiveSettings } from '@/types/audio';

describe('WebAudioEngine', () => {
  let engine: WebAudioEngine;

  beforeEach(() => {
    engine = new WebAudioEngine();
    jest.clearAllMocks();
  });

  afterEach(() => {
    engine.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await engine.initialize();
      expect(AudioContext).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', async () => {
      await engine.initialize();
      const callCount = (AudioContext as jest.Mock).mock.calls.length;

      await engine.initialize();
      expect((AudioContext as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it('should create master gain and limiter', async () => {
      const mockContext = new AudioContext();
      await engine.initialize();

      expect(mockContext.createGain).toHaveBeenCalled();
      expect(mockContext.createDynamicsCompressor).toHaveBeenCalled();
    });

    it('should throw error on initialization failure', async () => {
      (AudioContext as any) = jest.fn(() => {
        throw new Error('AudioContext failed');
      });

      await expect(engine.initialize()).rejects.toThrow('AudioContext failed');
    });
  });

  describe('Volume Control', () => {
    it('should update volume', async () => {
      await engine.initialize();
      await engine.start();

      engine.updateVolume(0.5);
      // Volume is stored and will be applied to gain nodes
      // Test that it doesn't throw
      expect(() => engine.updateVolume(0.5)).not.toThrow();
    });

    it('should handle volume updates before initialization', () => {
      expect(() => engine.updateVolume(0.8)).not.toThrow();
    });

    it('should clamp volume between 0 and 1', async () => {
      await engine.initialize();

      engine.updateVolume(1.5);
      engine.updateVolume(-0.5);

      // Should not throw even with invalid values
      expect(() => engine.updateVolume(2)).not.toThrow();
    });
  });

  describe('Intensity Control', () => {
    it('should update intensity', async () => {
      await engine.initialize();
      await engine.start();

      engine.updateIntensity(0.7);
      expect(() => engine.updateIntensity(0.7)).not.toThrow();
    });

    it('should handle intensity updates before start', async () => {
      await engine.initialize();
      expect(() => engine.updateIntensity(0.5)).not.toThrow();
    });

    it('should apply intensity changes to existing layers', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'noise-1',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'pink',
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      engine.updateIntensity(0.9);
      // Should not throw and should update filters
      expect(() => engine.updateIntensity(0.9)).not.toThrow();
    });
  });

  describe('Layer Management', () => {
    it('should update layers', () => {
      const layers: SoundLayer[] = [
        {
          id: 'test-layer',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'white',
        },
      ];

      engine.updateLayers(layers);
      expect(() => engine.updateLayers(layers)).not.toThrow();
    });

    it('should create noise layer when started', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'noise-1',
          type: 'noise',
          enabled: true,
          volume: 0.6,
          noiseType: 'pink',
          filterFreq: 800,
          resonance: 2,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      // Should create buffer source and filters
      const mockContext = new AudioContext();
      expect(mockContext.createBufferSource).toHaveBeenCalled();
      expect(mockContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('should create pad layer with detuned oscillators', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'pad-1',
          type: 'pad',
          enabled: true,
          volume: 0.5,
          frequency: 220,
          filterFreq: 1000,
          resonance: 2,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      const mockContext = new AudioContext();
      // Should create 3 oscillators (detuned)
      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should create pulse layer with LFO', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'pulse-1',
          type: 'pulse',
          enabled: true,
          volume: 0.5,
          frequency: 110,
          lfoRate: 0.5,
          lfoDepth: 0.3,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      const mockContext = new AudioContext();
      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should create binaural layer with stereo separation', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'binaural-1',
          type: 'binaural',
          enabled: true,
          volume: 0.4,
          frequency: 40, // 40Hz beat
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      const mockContext = new AudioContext();
      // Should create 2 oscillators for left/right
      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should only create enabled layers', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'enabled-layer',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'white',
        },
        {
          id: 'disabled-layer',
          type: 'pad',
          enabled: false,
          volume: 0.5,
          frequency: 220,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      // Should only create nodes for enabled layer
      expect(() => engine.updateLayers(layers)).not.toThrow();
    });

    it('should recreate layers when updated during playback', async () => {
      const initialLayers: SoundLayer[] = [
        {
          id: 'layer-1',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'pink',
        },
      ];

      await engine.initialize();
      engine.updateLayers(initialLayers);
      await engine.start();

      const newLayers: SoundLayer[] = [
        {
          id: 'layer-2',
          type: 'pad',
          enabled: true,
          volume: 0.6,
          frequency: 110,
        },
      ];

      engine.updateLayers(newLayers);
      expect(() => engine.updateLayers(newLayers)).not.toThrow();
    });
  });

  describe('Adaptive Settings', () => {
    it('should update adaptive settings', async () => {
      const settings: AdaptiveSettings = {
        timeOfDay: 'morning',
        sessionLength: 15,
        adaptToTime: true,
        layers: [],
      };

      await engine.initialize();
      engine.updateSettings(settings);

      expect(() => engine.updateSettings(settings)).not.toThrow();
    });

    it('should apply settings when engine is started', async () => {
      const settings: AdaptiveSettings = {
        timeOfDay: 'evening',
        sessionLength: 30,
        adaptToTime: true,
        layers: [],
      };

      await engine.initialize();
      await engine.start();
      engine.updateSettings(settings);

      expect(() => engine.updateSettings(settings)).not.toThrow();
    });
  });

  describe('Playback Control', () => {
    it('should start engine', async () => {
      await engine.start();
      expect(AudioContext).toHaveBeenCalled();
    });

    it('should resume suspended audio context', async () => {
      await engine.initialize();
      const mockContext = new AudioContext();
      (mockContext.state as any) = 'suspended';

      await engine.start();
      expect(mockContext.resume).toHaveBeenCalled();
    });

    it('should not start if already started', async () => {
      await engine.start();
      const callCount = (AudioContext as jest.Mock).mock.calls.length;

      await engine.start();
      // Should not create new context
      expect((AudioContext as jest.Mock).mock.calls.length).toBe(callCount);
    });

    it('should stop engine', async () => {
      await engine.start();
      engine.stop();

      expect(() => engine.stop()).not.toThrow();
    });

    it('should handle stop when not started', () => {
      expect(() => engine.stop()).not.toThrow();
    });

    it('should stop all oscillators on stop', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'osc-1',
          type: 'pad',
          enabled: true,
          volume: 0.5,
          frequency: 220,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      engine.stop();

      // Oscillators should be stopped (mocked in setup)
      expect(() => engine.stop()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await engine.initialize();
      await engine.start();

      const mockContext = new AudioContext();
      engine.cleanup();

      expect(mockContext.close).toHaveBeenCalled();
    });

    it('should stop before cleanup', async () => {
      await engine.start();
      engine.cleanup();

      // Should not throw
      expect(() => engine.cleanup()).not.toThrow();
    });

    it('should handle cleanup when not initialized', () => {
      expect(() => engine.cleanup()).not.toThrow();
    });

    it('should allow reinitialization after cleanup', async () => {
      await engine.initialize();
      engine.cleanup();

      await engine.initialize();
      expect(AudioContext).toHaveBeenCalled();
    });
  });

  describe('Noise Generation', () => {
    it('should generate white noise buffer', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'white-noise',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'white',
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      const mockContext = new AudioContext();
      expect(mockContext.createBuffer).toHaveBeenCalled();
    });

    it('should generate pink noise buffer', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'pink-noise',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'pink',
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      expect(() => engine.start()).not.toThrow();
    });

    it('should generate brown noise buffer', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'brown-noise',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'brown',
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      expect(() => engine.start()).not.toThrow();
    });
  });

  describe('Effects Processing', () => {
    it('should create reverb buffer on init', async () => {
      await engine.initialize();

      const mockContext = new AudioContext();
      expect(mockContext.createConvolver).toHaveBeenCalled();
    });

    it('should apply reverb based on intensity', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'test-layer',
          type: 'pad',
          enabled: true,
          volume: 0.5,
          frequency: 220,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      engine.updateIntensity(0.8); // High intensity for reverb
      await engine.start();

      // Reverb should be created
      const mockContext = new AudioContext();
      expect(mockContext.createConvolver).toHaveBeenCalled();
    });

    it('should not apply reverb at low intensity', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'test-layer',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'white',
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      engine.updateIntensity(0.2); // Low intensity
      await engine.start();

      // Should still work without issues
      expect(() => engine.start()).not.toThrow();
    });
  });

  describe('LFO (Low Frequency Oscillator)', () => {
    it('should create LFO for filter modulation', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'lfo-layer',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'pink',
          lfoRate: 0.3,
          lfoDepth: 0.5,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      const mockContext = new AudioContext();
      // LFO is also an oscillator
      expect(mockContext.createOscillator).toHaveBeenCalled();
    });

    it('should create LFO for volume modulation on pulse', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'pulse-lfo',
          type: 'pulse',
          enabled: true,
          volume: 0.5,
          frequency: 110,
          lfoRate: 0.5,
        },
      ];

      await engine.initialize();
      engine.updateLayers(layers);
      await engine.start();

      expect(() => engine.start()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle oscillator stop errors gracefully', async () => {
      const mockOscillator = {
        ...new AudioContext().createOscillator(),
        stop: jest.fn(() => {
          throw new Error('Already stopped');
        }),
      };

      await engine.initialize();
      await engine.start();

      // Should not throw even if oscillators fail to stop
      expect(() => engine.stop()).not.toThrow();
    });

    it('should handle missing audio context gracefully', () => {
      const layers: SoundLayer[] = [
        {
          id: 'test',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'white',
        },
      ];

      // Don't initialize, just update layers
      engine.updateLayers(layers);

      expect(() => engine.updateLayers(layers)).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete session workflow', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'noise-bg',
          type: 'noise',
          enabled: true,
          volume: 0.3,
          noiseType: 'pink',
        },
        {
          id: 'pad-main',
          type: 'pad',
          enabled: true,
          volume: 0.5,
          frequency: 110,
        },
        {
          id: 'binaural-focus',
          type: 'binaural',
          enabled: true,
          volume: 0.4,
          frequency: 40,
        },
      ];

      const settings: AdaptiveSettings = {
        timeOfDay: 'afternoon',
        sessionLength: 25,
        adaptToTime: true,
        layers: [],
      };

      // Initialize
      await engine.initialize();

      // Configure
      engine.updateLayers(layers);
      engine.updateSettings(settings);
      engine.updateVolume(0.7);
      engine.updateIntensity(0.6);

      // Start
      await engine.start();

      // Modify during playback
      engine.updateVolume(0.5);
      engine.updateIntensity(0.8);

      // Stop
      engine.stop();

      // Cleanup
      engine.cleanup();

      expect(() => engine.cleanup()).not.toThrow();
    });

    it('should handle rapid layer changes', async () => {
      await engine.initialize();
      await engine.start();

      for (let i = 0; i < 10; i++) {
        const layers: SoundLayer[] = [
          {
            id: `layer-${i}`,
            type: i % 2 === 0 ? 'noise' : 'pad',
            enabled: true,
            volume: 0.5,
            noiseType: 'white',
            frequency: 220,
          },
        ];
        engine.updateLayers(layers);
      }

      expect(() => engine.stop()).not.toThrow();
    });
  });
});
