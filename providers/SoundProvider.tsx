import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { SOUNDSCAPES } from "@/constants/soundscapes";
import { Platform } from "react-native";

type NoiseType = 'white' | 'pink' | 'brown';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

interface SoundLayer {
  id: string;
  type: 'noise' | 'pad' | 'pulse' | 'binaural';
  volume: number;
  frequency?: number;
  enabled: boolean;
  filterFreq?: number;
  resonance?: number;
  lfoRate?: number;
  lfoDepth?: number;
}

interface Preset {
  id: string;
  name: string;
  mode: keyof typeof SOUNDSCAPES;
  layers: SoundLayer[];
  volume: number;
  noiseType: NoiseType;
  binauralFreq: number;
  createdAt: number;
}

interface AdaptiveSettings {
  timeOfDay: TimeOfDay;
  sessionLength: number;
  adaptToTime: boolean;
  layers: SoundLayer[];
}

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
  const audioContext = useRef<AudioContext | null>(null);
  const oscillators = useRef<Map<string, OscillatorNode>>(new Map());
  const gainNodes = useRef<Map<string, GainNode>>(new Map());
  const filterNodes = useRef<Map<string, BiquadFilterNode>>(new Map());
  const lfoNodes = useRef<Map<string, OscillatorNode>>(new Map());
  const reverbNode = useRef<ConvolverNode | null>(null);
  const noiseBuffer = useRef<AudioBuffer | null>(null);
  const reverbBuffer = useRef<AudioBuffer | null>(null);
  
  // Generate reverb impulse response
  const generateReverbBuffer = useCallback((duration: number = 2, decay: number = 2) => {
    if (Platform.OS !== 'web' || !audioContext.current) {
      return null;
    }
    
    const sampleRate = audioContext.current.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContext.current.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }
    
    return buffer;
  }, []);

  // Generate noise buffer
  const generateNoiseBuffer = useCallback((type: NoiseType, duration: number = 2) => {
    if (Platform.OS !== 'web' || !audioContext.current) {
      return null;
    }
    
    const sampleRate = audioContext.current.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioContext.current.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      
      switch (type) {
        case 'white':
          data[i] = white * 0.3;
          break;
        case 'pink':
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
          break;
        case 'brown':
          b0 = (b0 + (0.02 * white)) / 1.02;
          data[i] = b0 * 3.5;
          break;
      }
    }
    
    return buffer;
  }, []);
  
  // Initialize Web Audio API
  const initializeAudioContext = useCallback(async () => {
    if (Platform.OS !== 'web' || audioContext.current) {
      return;
    }
    
    try {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      noiseBuffer.current = generateNoiseBuffer(noiseType);
      reverbBuffer.current = generateReverbBuffer(2, 2);
      
      // Create reverb node
      if (reverbBuffer.current) {
        reverbNode.current = audioContext.current.createConvolver();
        reverbNode.current.buffer = reverbBuffer.current;
      }
    } catch (error) {
      console.log('Web Audio API not supported:', error);
    }
  }, [generateNoiseBuffer, generateReverbBuffer, noiseType]);
  
  // Create oscillator with filter and LFO
  const createOscillator = useCallback((id: string, frequency: number, type: OscillatorType = 'sine', layer?: SoundLayer) => {
    if (Platform.OS !== 'web' || !audioContext.current) {
      return null;
    }
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    const filterNode = audioContext.current.createBiquadFilter();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    
    // Setup filter
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(layer?.filterFreq || 1000, audioContext.current.currentTime);
    filterNode.Q.setValueAtTime(layer?.resonance || 1, audioContext.current.currentTime);
    
    // Create LFO for filter modulation
    if (layer?.lfoRate && layer?.lfoDepth) {
      const lfo = audioContext.current.createOscillator();
      const lfoGain = audioContext.current.createGain();
      
      lfo.frequency.setValueAtTime(layer.lfoRate, audioContext.current.currentTime);
      lfoGain.gain.setValueAtTime((layer.filterFreq || 1000) * layer.lfoDepth, audioContext.current.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
      lfo.start();
      
      lfoNodes.current.set(id + '_lfo', lfo);
    }
    
    // Connect audio chain
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    
    // Add reverb send
    if (reverbNode.current && intensity > 0.3) {
      const reverbSend = audioContext.current.createGain();
      reverbSend.gain.setValueAtTime(intensity * 0.2, audioContext.current.currentTime);
      gainNode.connect(reverbSend);
      reverbSend.connect(reverbNode.current);
      reverbNode.current.connect(audioContext.current.destination);
    }
    
    gainNode.connect(audioContext.current.destination);
    
    oscillators.current.set(id, oscillator);
    gainNodes.current.set(id, gainNode);
    filterNodes.current.set(id, filterNode);
    
    oscillator.start();
    return { oscillator, gainNode, filterNode };
  }, [intensity]);
  
  // Create noise source with filter
  const createNoiseSource = useCallback((layer?: SoundLayer) => {
    if (Platform.OS !== 'web' || !audioContext.current || !noiseBuffer.current) {
      return null;
    }
    
    const source = audioContext.current.createBufferSource();
    const gainNode = audioContext.current.createGain();
    const filterNode = audioContext.current.createBiquadFilter();
    
    source.buffer = noiseBuffer.current;
    source.loop = true;
    gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
    
    // Setup filter based on intensity
    filterNode.type = 'lowpass';
    const cutoffFreq = 500 + (intensity * 2000); // 500Hz to 2500Hz based on intensity
    filterNode.frequency.setValueAtTime(cutoffFreq, audioContext.current.currentTime);
    filterNode.Q.setValueAtTime(1 + intensity * 3, audioContext.current.currentTime);
    
    // Create LFO for filter sweep
    if (layer?.lfoRate) {
      const lfo = audioContext.current.createOscillator();
      const lfoGain = audioContext.current.createGain();
      
      lfo.frequency.setValueAtTime(layer.lfoRate, audioContext.current.currentTime);
      lfoGain.gain.setValueAtTime(cutoffFreq * 0.3, audioContext.current.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
      lfo.start();
      
      lfoNodes.current.set('noise_lfo', lfo);
    }
    
    source.connect(filterNode);
    filterNode.connect(gainNode);
    
    // Add reverb send
    if (reverbNode.current && intensity > 0.4) {
      const reverbSend = audioContext.current.createGain();
      reverbSend.gain.setValueAtTime(intensity * 0.15, audioContext.current.currentTime);
      gainNode.connect(reverbSend);
      reverbSend.connect(reverbNode.current);
      reverbNode.current.connect(audioContext.current.destination);
    }
    
    gainNode.connect(audioContext.current.destination);
    
    gainNodes.current.set('noise', gainNode);
    filterNodes.current.set('noise', filterNode);
    source.start();
    
    return { source, gainNode, filterNode };
  }, [intensity]);
  
  // Update layer volume
  const updateLayerVolume = useCallback((layerId: string, volume: number) => {
    const gainNode = gainNodes.current.get(layerId);
    if (!gainNode || !audioContext.current) {
      return;
    }
    
    gainNode.gain.setTargetAtTime(volume, audioContext.current.currentTime, 0.1);
  }, []);
  
  // Adaptive sound adjustment based on time of day
  const getAdaptiveSettings = useCallback((timeOfDay: TimeOfDay, mode: keyof typeof SOUNDSCAPES) => {
    const baseSettings = { ...adaptiveSettings };
    
    if (!baseSettings.adaptToTime) return baseSettings;
    
    switch (timeOfDay) {
      case 'morning':
        baseSettings.layers = baseSettings.layers.map(layer => {
          if (layer.type === 'pulse') return { ...layer, enabled: true, volume: 0.3, frequency: 80 };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'focus', frequency: 40 };
          if (layer.type === 'noise') return { ...layer, volume: 0.2 };
          return layer;
        });
        break;
      case 'afternoon':
        baseSettings.layers = baseSettings.layers.map(layer => {
          if (layer.type === 'pulse') return { ...layer, enabled: false };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'focus', frequency: 30 };
          if (layer.type === 'pad') return { ...layer, volume: 0.6 };
          return layer;
        });
        break;
      case 'evening':
        baseSettings.layers = baseSettings.layers.map(layer => {
          if (layer.type === 'pulse') return { ...layer, enabled: false };
          if (layer.type === 'binaural') return { ...layer, enabled: mode === 'relax', frequency: 10 };
          if (layer.type === 'noise') return { ...layer, volume: 0.4 };
          return layer;
        });
        break;
      case 'night':
        baseSettings.layers = baseSettings.layers.map(layer => {
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
  
  // Start generative sound layers
  const startGenerativeLayers = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    
    await initializeAudioContext();
    
    const currentSettings = getAdaptiveSettings(adaptiveSettings.timeOfDay, currentMode || 'focus');
    
    // Stop existing oscillators
    oscillators.current.forEach(osc => osc.stop());
    oscillators.current.clear();
    gainNodes.current.clear();
    
    // Create noise layer
    const noiseLayer = currentSettings.layers.find(l => l.type === 'noise');
    if (noiseLayer?.enabled) {
      createNoiseSource(noiseLayer);
      updateLayerVolume('noise', noiseLayer.volume * volume * (0.5 + intensity * 0.5));
    }
    
    // Create pad layer (detuned sines for richness)
    const padLayer = currentSettings.layers.find(l => l.type === 'pad');
    if (padLayer?.enabled) {
      const baseFreq = padLayer.frequency || 80;
      // Create 3 detuned oscillators for rich pad sound
      createOscillator('pad1', baseFreq, 'sine', padLayer);
      createOscillator('pad2', baseFreq * 1.005, 'sine', padLayer); // Slightly detuned
      createOscillator('pad3', baseFreq * 0.995, 'sine', padLayer); // Slightly detuned
      
      updateLayerVolume('pad1', padLayer.volume * volume * 0.4);
      updateLayerVolume('pad2', padLayer.volume * volume * 0.3);
      updateLayerVolume('pad3', padLayer.volume * volume * 0.3);
    }
    
    // Create pulse layer with gentle volume modulation
    const pulseLayer = currentSettings.layers.find(l => l.type === 'pulse');
    if (pulseLayer?.enabled && pulseLayer.frequency) {
      createOscillator('pulse', pulseLayer.frequency, 'triangle', pulseLayer);
      
      // Create gentle volume arc with LFO
      const pulseGain = gainNodes.current.get('pulse');
      if (pulseGain && audioContext.current) {
        const lfo = audioContext.current.createOscillator();
        const lfoGain = audioContext.current.createGain();
        
        lfo.frequency.setValueAtTime(pulseLayer.lfoRate || 0.1, audioContext.current.currentTime);
        lfoGain.gain.setValueAtTime(pulseLayer.volume * volume * 0.3, audioContext.current.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(pulseGain.gain);
        lfo.start();
        
        lfoNodes.current.set('pulse_lfo', lfo);
      }
      
      updateLayerVolume('pulse', pulseLayer.volume * volume * (0.3 + intensity * 0.4));
    }
    
    // Create binaural beats
    const binauralLayer = currentSettings.layers.find(l => l.type === 'binaural');
    if (binauralLayer?.enabled && binauralLayer.frequency) {
      const baseFreq = 200;
      createOscillator('binaural_left', baseFreq, 'sine');
      createOscillator('binaural_right', baseFreq + binauralLayer.frequency, 'sine');
      updateLayerVolume('binaural_left', binauralLayer.volume * volume);
      updateLayerVolume('binaural_right', binauralLayer.volume * volume);
    }
  }, [initializeAudioContext, getAdaptiveSettings, adaptiveSettings.timeOfDay, currentMode, volume, intensity, createNoiseSource, createOscillator, updateLayerVolume]);
  
  // Stop generative layers
  const stopGenerativeLayers = useCallback(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    
    oscillators.current.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Oscillator might already be stopped
      }
    });
    
    lfoNodes.current.forEach(lfo => {
      try {
        lfo.stop();
      } catch {
        // LFO might already be stopped
      }
    });
    
    oscillators.current.clear();
    gainNodes.current.clear();
    filterNodes.current.clear();
    lfoNodes.current.clear();
  }, []);
  
  // Update layer settings
  const updateLayer = useCallback((layerId: string, updates: Partial<SoundLayer>) => {
    setAdaptiveSettings(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
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
    
    setCurrentMode(preset.mode);
    setAdaptiveSettings(prev => ({ ...prev, layers: preset.layers }));
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
    stopGenerativeLayers();
    setIsPlaying(false);
    setElapsedTime(0);
  }, [stopGenerativeLayers]);

  const togglePlayPause = useCallback(async () => {
    if (!currentMode) return;

    if (isPlaying) {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      stopGenerativeLayers();
      setIsPlaying(false);
    } else {
      if (!soundRef.current) {
        await loadSound();
      }
      if (soundRef.current) {
        await soundRef.current.playAsync();
      }
      await startGenerativeLayers();
      setIsPlaying(true);
    }
  }, [currentMode, isPlaying, loadSound, startGenerativeLayers, stopGenerativeLayers]);

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
        setAdaptiveSettings(prev => ({ ...prev, timeOfDay: newTimeOfDay }));
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [adaptiveSettings.timeOfDay]);
  
  // Update generative layers when volume changes
  useEffect(() => {
    if (!isPlaying || Platform.OS !== 'web') {
      return;
    }
    
    adaptiveSettings.layers.forEach(layer => {
      if (layer.enabled) {
        updateLayerVolume(layer.id, layer.volume * volume);
      }
    });
  }, [volume, isPlaying, adaptiveSettings.layers, updateLayerVolume]);
  
  // Regenerate noise buffer when noise type changes
  useEffect(() => {
    if (Platform.OS !== 'web' || !audioContext.current) {
      return;
    }
    
    noiseBuffer.current = generateNoiseBuffer(noiseType);
  }, [noiseType, generateNoiseBuffer]);
  
  // Update sound layers when intensity changes
  useEffect(() => {
    if (!isPlaying || Platform.OS !== 'web') {
      return;
    }
    
    // Update filter frequencies based on intensity
    filterNodes.current.forEach((filter, id) => {
      if (audioContext.current) {
        const baseFreq = id === 'noise' ? 500 : 800;
        const newFreq = baseFreq + (intensity * 2000);
        filter.frequency.setTargetAtTime(newFreq, audioContext.current.currentTime, 0.1);
        filter.Q.setTargetAtTime(1 + intensity * 3, audioContext.current.currentTime, 0.1);
      }
    });
    
    // Update volumes based on intensity
    adaptiveSettings.layers.forEach(layer => {
      if (layer.enabled) {
        const intensityMultiplier = 0.5 + intensity * 0.5;
        updateLayerVolume(layer.id, layer.volume * volume * intensityMultiplier);
      }
    });
  }, [intensity, isPlaying, adaptiveSettings.layers, volume, updateLayerVolume]);

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