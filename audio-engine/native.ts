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

  // Static audio files for different layer types
  private readonly audioFiles = {
    noise_white: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    noise_pink: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    noise_brown: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    pad_low: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    pad_mid: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    pad_high: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    pulse_slow: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    pulse_fast: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    binaural_alpha: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    binaural_beta: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    binaural_theta: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    binaural_delta: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
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
      const audioUrl = this.getAudioUrlForLayer(layer);
      if (!audioUrl) {
        console.warn(`No audio file found for layer: ${layer.id}`);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
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

  private getAudioUrlForLayer(layer: SoundLayer): string | null {
    switch (layer.type) {
      case 'noise':
        return this.audioFiles.noise_pink; // Default to pink noise
      case 'pad':
        if (!layer.frequency) return this.audioFiles.pad_mid;
        if (layer.frequency < 100) return this.audioFiles.pad_low;
        if (layer.frequency > 200) return this.audioFiles.pad_high;
        return this.audioFiles.pad_mid;
      case 'pulse':
        if (!layer.frequency) return this.audioFiles.pulse_slow;
        return layer.frequency > 80 ? this.audioFiles.pulse_fast : this.audioFiles.pulse_slow;
      case 'binaural':
        if (!layer.frequency) return this.audioFiles.binaural_alpha;
        if (layer.frequency < 8) return this.audioFiles.binaural_delta;
        if (layer.frequency < 13) return this.audioFiles.binaural_theta;
        if (layer.frequency < 30) return this.audioFiles.binaural_alpha;
        return this.audioFiles.binaural_beta;
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