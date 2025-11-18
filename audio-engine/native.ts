import { Audio } from 'expo-av';
import { AudioEngineInterface, SoundLayer, AdaptiveSettings } from '@/types/audio';

export class NativeAudioEngine implements AudioEngineInterface {
  private sounds = new Map<string, Audio.Sound>();
  private currentLayers: SoundLayer[] = [];
  private currentSettings: AdaptiveSettings | null = null;
  private currentVolume = 0.7;
  private currentIntensity = 0.5;
  private isInitialized = false;
  private isStarted = false;

  // Local audio asset files for different layer types
  // NOTE: These require() paths reference assets that need to be added to /assets/audio/
  // See /assets/audio/README.md for specifications and how to generate these files
  private readonly audioFiles = {
    // Noise layers
    noise_white: require('@/assets/audio/noise/white-noise.mp3'),
    noise_pink: require('@/assets/audio/noise/pink-noise.mp3'),
    noise_brown: require('@/assets/audio/noise/brown-noise.mp3'),

    // Ambient pad layers (different frequencies)
    pad_low: require('@/assets/audio/pad/deep-pad-110hz.mp3'),
    pad_mid: require('@/assets/audio/pad/warm-pad-220hz.mp3'),
    pad_high: require('@/assets/audio/pad/bright-pad-440hz.mp3'),

    // Pulse/rhythm layers
    pulse_slow: require('@/assets/audio/pulse/gentle-pulse-60bpm.mp3'),
    pulse_fast: require('@/assets/audio/pulse/active-pulse-120bpm.mp3'),

    // Binaural beat carrier tones
    binaural_carrier: require('@/assets/audio/binaural/carrier-200hz.mp3'),
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure audio session for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      this.isInitialized = true;
      console.log('Native Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Native Audio Engine:', error);
      throw error;
    }
  }

  updateLayers(layers: SoundLayer[]): void {
    this.currentLayers = [...layers];
    if (this.isStarted) {
      this.recreateLayers();
    }
  }

  updateSettings(settings: AdaptiveSettings): void {
    this.currentSettings = { ...settings };
    if (this.isStarted) {
      this.applyAdaptiveSettings();
    }
  }

  updateVolume(volume: number): void {
    this.currentVolume = volume;
    if (this.isStarted) {
      this.applyVolumeChanges();
    }
  }

  updateIntensity(intensity: number): void {
    this.currentIntensity = intensity;
    if (this.isStarted) {
      this.applyIntensityChanges();
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isStarted) {
      return;
    }

    await this.createAllLayers();
    this.isStarted = true;
    console.log('Native Audio Engine started');
  }

  stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.stopAllSounds();
    this.isStarted = false;
    console.log('Native Audio Engine stopped');
  }

  cleanup(): void {
    this.stop();
    this.unloadAllSounds();
    this.isInitialized = false;
    console.log('Native Audio Engine cleaned up');
  }

  private async createAllLayers(): Promise<void> {
    for (const layer of this.currentLayers) {
      if (layer.enabled) {
        await this.createLayer(layer);
      }
    }
  }

  private async recreateLayers(): Promise<void> {
    this.stopAllSounds();
    this.unloadAllSounds();
    await this.createAllLayers();
  }

  private async createLayer(layer: SoundLayer): Promise<void> {
    try {
      const audioSource = this.getAudioSourceForLayer(layer);
      if (!audioSource) {
        console.warn(`No audio file found for layer: ${layer.id}`);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        audioSource,
        {
          shouldPlay: true,
          isLooping: true,
          volume: this.calculateLayerVolume(layer),
        }
      );

      this.sounds.set(layer.id, sound);
      console.log(`Created native audio layer: ${layer.id}`);
    } catch (error) {
      console.error(`Failed to create layer ${layer.id}:`, error);
    }
  }

  private getAudioSourceForLayer(layer: SoundLayer): any {
    switch (layer.type) {
      case 'noise':
        // Use the specific noise type if provided
        switch (layer.noiseType) {
          case 'white':
            return this.audioFiles.noise_white;
          case 'brown':
            return this.audioFiles.noise_brown;
          case 'pink':
          default:
            return this.audioFiles.noise_pink;
        }

      case 'pad':
        // Select pad based on frequency range
        if (!layer.frequency) return this.audioFiles.pad_mid;
        if (layer.frequency < 150) return this.audioFiles.pad_low;
        if (layer.frequency > 300) return this.audioFiles.pad_high;
        return this.audioFiles.pad_mid;

      case 'pulse':
        // Select pulse speed based on frequency (BPM)
        if (!layer.frequency) return this.audioFiles.pulse_slow;
        return layer.frequency > 90 ? this.audioFiles.pulse_fast : this.audioFiles.pulse_slow;

      case 'binaural':
        // For binaural, we always use the carrier tone
        // The actual binaural beat frequency is created by playing in stereo
        // with slight frequency offset (handled in Web Audio or future enhancement)
        return this.audioFiles.binaural_carrier;

      default:
        return null;
    }
  }

  private calculateLayerVolume(layer: SoundLayer): number {
    const intensityMultiplier = 0.5 + this.currentIntensity * 0.5;
    return layer.volume * this.currentVolume * intensityMultiplier;
  }

  private applyAdaptiveSettings(): void {
    if (!this.currentSettings) return;
    
    console.log('Applying adaptive settings for:', this.currentSettings.timeOfDay);
    // For native, we would switch to different audio files or adjust volumes
    // based on time of day preferences
  }

  private async applyVolumeChanges(): Promise<void> {
    for (const [layerId, sound] of this.sounds) {
      const layer = this.currentLayers.find(l => l.id === layerId);
      if (layer) {
        try {
          await sound.setVolumeAsync(this.calculateLayerVolume(layer));
        } catch (error) {
          console.error(`Failed to update volume for layer ${layerId}:`, error);
        }
      }
    }
  }

  private async applyIntensityChanges(): Promise<void> {
    // For native implementation, intensity changes would affect volume
    // and potentially switch to different audio files with more/less intensity
    await this.applyVolumeChanges();
  }

  private stopAllSounds(): void {
    this.sounds.forEach(async (sound, id) => {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error(`Failed to stop sound ${id}:`, error);
      }
    });
  }

  private unloadAllSounds(): void {
    this.sounds.forEach(async (sound, id) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Failed to unload sound ${id}:`, error);
      }
    });
    this.sounds.clear();
  }
}