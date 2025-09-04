import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { AudioEngineInterface, SoundLayer, AdaptiveSettings } from '@/types/audio';
import { WebAudioEngine } from '@/audio-engine/web';
import { NativeAudioEngine } from '@/audio-engine/native';

const isWeb = Platform.OS === 'web';

export const useGenerativeAudio = (
  layers: SoundLayer[], 
  settings: AdaptiveSettings,
  volume: number,
  intensity: number,
  isPlaying: boolean
) => {
  const engineRef = useRef<AudioEngineInterface | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = isWeb ? new WebAudioEngine() : new NativeAudioEngine();
      console.log(`Initialized ${isWeb ? 'Web' : 'Native'} Audio Engine`);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []);

  // Handle play/stop
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const handleAudio = async () => {
      if (isPlaying) {
        if (!isInitializedRef.current) {
          await engine.initialize();
          isInitializedRef.current = true;
        }
        
        engine.updateLayers(layers);
        engine.updateSettings(settings);
        engine.updateVolume(volume);
        engine.updateIntensity(intensity);
        await engine.start();
      } else {
        engine.stop();
      }
    };

    handleAudio().catch(error => {
      console.error('Error handling audio:', error);
    });
  }, [isPlaying, layers, settings, volume, intensity]);

  // Update layers when they change
  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.updateLayers(layers);
    }
  }, [layers, isPlaying]);

  // Update settings when they change
  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings, isPlaying]);

  // Update volume when it changes
  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.updateVolume(volume);
    }
  }, [volume, isPlaying]);

  // Update intensity when it changes
  useEffect(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.updateIntensity(intensity);
    }
  }, [intensity, isPlaying]);

  return {
    engine: engineRef.current,
    isInitialized: isInitializedRef.current,
  };
};