import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { SOUNDSCAPES } from "@/constants/soundscapes";
import { Platform } from "react-native";
import { useGenerativeAudio } from "@/hooks/useGenerativeAudio";
import { 
  NoiseType, 
  TimeOfDay, 
  SoundLayer, 
  Preset, 
  AdaptiveSettings 
} from "@/types/audio";

// Get current time of day
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export const [SoundProvider, useSound] = createContextHook(() => {
  const [currentMode, setCurrentMode] = useState<keyof typeof SOUNDSCAPES | null>("focus");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [sessionDuration, setSessionDuration] = useState(15 * 60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  
  // Adaptive and generative sound settings
  const [adaptiveSettings, setAdaptiveSettings] = useState<AdaptiveSettings>({
    timeOfDay: getTimeOfDay(),
    sessionLength: 15,
    adaptToTime: true,
    layers: [
      { id: 'noise', type: 'noise', volume: 0.3, enabled: true, filterFreq: 1000, resonance: 1, lfoRate: 0.1, lfoDepth: 0.1 },
      { id: 'pad', type: 'pad', volume: 0.5, enabled: true, frequency: 80, filterFreq: 800, resonance: 2, lfoRate: 0.05, lfoDepth: 0.2 },
      { id: 'pulse', type: 'pulse', volume: 0.2, frequency: 60, enabled: false, lfoRate: 1, lfoDepth: 0.3 },
      { id: 'binaural', type: 'binaural', volume: 0.1, frequency: 40, enabled: false },
    ],
  });
  const [noiseType, setNoiseType] = useState<NoiseType>('pink');
  const [binauralFreq, setBinauralFreq] = useState(40);
  const [pulseRate, setPulseRate] = useState(60);
  const [intensity, setIntensity] = useState(0.5);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Use the new generative audio hook
  useGenerativeAudio(
    adaptiveSettings.layers,
    adaptiveSettings,
    volume,
    intensity,
    isPlaying
  );
  
  // Adaptive sound adjustment based on time of day
  const getAdaptiveSettings = useCallback((timeOfDay: TimeOfDay, mode: keyof typeof SOUNDSCAPES) => {
    const baseSettings = { ...adaptiveSettings };
    
    if (!baseSettings.adaptToTime) return baseSettings;
    
    switch (timeOfDay) {
      case 'morning':
        baseSettings.layers = baseSettings.layers.map((layer: SoundLayer) => {
          if (layer.type === 'pulse') return { ...layer, enabled: true, volume: 0.3, frequency: 80 };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'focus', frequency: 40 };
          if (layer.type === 'noise') return { ...layer, volume: 0.2 };
          return layer;
        });
        break;
      case 'afternoon':
        baseSettings.layers = baseSettings.layers.map((layer: SoundLayer) => {
          if (layer.type === 'pulse') return { ...layer, enabled: false };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'focus', frequency: 30 };
          if (layer.type === 'pad') return { ...layer, volume: 0.6 };
          return layer;
        });
        break;
      case 'evening':
        baseSettings.layers = baseSettings.layers.map((layer: SoundLayer) => {
          if (layer.type === 'pulse') return { ...layer, enabled: false };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'relax', frequency: 10 };
          if (layer.type === 'noise') return { ...layer, volume: 0.4 };
          return layer;
        });
        break;
      case 'night':
        baseSettings.layers = baseSettings.layers.map((layer: SoundLayer) => {
          if (layer.type === 'pulse') return { ...layer, enabled: false };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'sleep', frequency: 6 };
          if (layer.type === 'pad') return { ...layer, volume: 0.3 };
          if (layer.type === 'noise') return { ...layer, volume: 0.5 };
          return layer;
        });
        break;
    }
    
    return baseSettings;
  }, [adaptiveSettings]);
  
  // Simplified audio control - the engine handles the complexity
  const startGenerativeLayers = useCallback(async () => {
    // The useGenerativeAudio hook handles this automatically
    console.log('Generative layers managed by audio engine');
  }, []);
  
  const stopGenerativeLayers = useCallback(() => {
    // The useGenerativeAudio hook handles this automatically
    console.log('Generative layers stopped by audio engine');
  }, []);
  
  // Update layer settings
  const updateLayer = useCallback((layerId: string, updates: Partial<SoundLayer>) => {
    setAdaptiveSettings((prev: AdaptiveSettings) => ({
      ...prev,
      layers: prev.layers.map((layer: SoundLayer) => 
        layer.id === layerId ? { ...layer, ...updates } : layer
      )
    }));
  }, []);
  
  // Preset management
  const savePreset = useCallback(async (name: string) => {
    if (!currentMode) return;
    
    const preset: Preset = {
      id: Date.now().toString(),
      name,
      mode: currentMode,
      layers: adaptiveSettings.layers,
      volume,
      noiseType,
      binauralFreq,
      createdAt: Date.now(),
    };
    
    const newPresets = [...presets, preset];
    setPresets(newPresets);
    setCurrentPreset(preset.id);
    
    try {
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(newPresets));
    } catch (error) {
      console.log('Error saving preset:', error);
    }
  }, [currentMode, adaptiveSettings.layers, volume, noiseType, binauralFreq, presets]);
  
  const loadPreset = useCallback(async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    setCurrentMode(preset.mode as keyof typeof SOUNDSCAPES);
    setAdaptiveSettings((prev: AdaptiveSettings) => ({ ...prev, layers: preset.layers }));
    setVolume(preset.volume);
    setNoiseType(preset.noiseType);
    setBinauralFreq(preset.binauralFreq);
    setCurrentPreset(presetId);
  }, [presets]);
  
  const deletePreset = useCallback(async (presetId: string) => {
    const newPresets = presets.filter(p => p.id !== presetId);
    setPresets(newPresets);
    
    if (currentPreset === presetId) {
      setCurrentPreset(null);
    }
    
    try {
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(newPresets));
    } catch (error) {
      console.log('Error deleting preset:', error);
    }
  }, [presets, currentPreset]);
  
  const exportPresets = useCallback(() => {
    return JSON.stringify(presets, null, 2);
  }, [presets]);
  
  const importPresets = useCallback(async (presetsJson: string) => {
    try {
      const importedPresets: Preset[] = JSON.parse(presetsJson);
      const newPresets = [...presets, ...importedPresets];
      setPresets(newPresets);
      
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(newPresets));
      return true;
    } catch (error) {
      console.log('Error importing presets:', error);
      return false;
    }
  }, [presets]);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await AsyncStorage.getItem("soundscape_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotifications(parsed.notifications ?? false);
        setDarkMode(parsed.darkMode ?? true);
        setKeepScreenOn(parsed.keepScreenOn ?? false);
        setVolume(parsed.volume ?? 0.7);
        setNoiseType(parsed.noiseType ?? 'pink');
        setBinauralFreq(parsed.binauralFreq ?? 40);
        setPulseRate(parsed.pulseRate ?? 60);
        setIntensity(parsed.intensity ?? 0.5);
        if (parsed.adaptiveSettings) {
          setAdaptiveSettings({
            ...parsed.adaptiveSettings,
            timeOfDay: getTimeOfDay(), // Always use current time
          });
        }
      }
      
      // Load presets
      const presetsData = await AsyncStorage.getItem('soundscape_presets');
      if (presetsData) {
        const loadedPresets = JSON.parse(presetsData);
        setPresets(loadedPresets);
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem(
        "soundscape_settings",
        JSON.stringify({
          notifications,
          darkMode,
          keepScreenOn,
          volume,
          noiseType,
          binauralFreq,
          pulseRate,
          intensity,
          adaptiveSettings,
        })
      );
    } catch (error) {
      console.log("Error saving settings:", error);
    }
  }, [notifications, darkMode, keepScreenOn, volume, noiseType, binauralFreq, pulseRate, intensity, adaptiveSettings]);

  const loadSound = useCallback(async () => {
    if (!currentMode) return;
    
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: SOUNDSCAPES[currentMode].audioUrl },
        { 
          shouldPlay: false,
          isLooping: true,
          volume: volume,
        }
      );
      
      soundRef.current = sound;
    } catch (error) {
      console.log("Error loading sound:", error);
    }
  }, [currentMode, volume]);

  const handleStop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    setIsPlaying(false);
    setElapsedTime(0);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!currentMode) return;

    if (isPlaying) {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } else {
      if (!soundRef.current) {
        await loadSound();
      }
      if (soundRef.current) {
        await soundRef.current.playAsync();
      }
      setIsPlaying(true);
    }
  }, [currentMode, isPlaying, loadSound]);

  useEffect(() => {
    loadSettings();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loadSettings]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }
    
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });
  }, []);

  useEffect(() => {
    if (isPlaying && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= sessionDuration) {
            handleStop();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (!isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isPlaying, sessionDuration, handleStop]);

  useEffect(() => {
    saveSettings();
  }, [notifications, darkMode, keepScreenOn, volume, noiseType, binauralFreq, pulseRate, intensity, adaptiveSettings, saveSettings]);
  
  // Update time of day every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeOfDay = getTimeOfDay();
      if (newTimeOfDay !== adaptiveSettings.timeOfDay) {
        setAdaptiveSettings((prev: AdaptiveSettings) => ({ ...prev, timeOfDay: newTimeOfDay }));
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [adaptiveSettings.timeOfDay]);
  
  // Audio engine handles all the complex audio processing automatically
  // Volume, intensity, and layer changes are managed by useGenerativeAudio hook

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (currentMode && soundRef.current) {
      loadSound();
    }
  }, [currentMode, loadSound]);

  return {
    currentMode,
    setCurrentMode,
    isPlaying,
    togglePlayPause,
    volume,
    setVolume,
    sessionDuration,
    setSessionDuration,
    elapsedTime,
    notifications,
    setNotifications,
    darkMode,
    setDarkMode,
    keepScreenOn,
    setKeepScreenOn,
    // Adaptive and generative features
    adaptiveSettings,
    setAdaptiveSettings,
    noiseType,
    setNoiseType,
    binauralFreq,
    setBinauralFreq,
    pulseRate,
    setPulseRate,
    intensity,
    setIntensity,
    updateLayer,
    startGenerativeLayers,
    stopGenerativeLayers,
    // Preset management
    presets,
    currentPreset,
    savePreset,
    loadPreset,
    deletePreset,
    exportPresets,
    importPresets,
  };
});