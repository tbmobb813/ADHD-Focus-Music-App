import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { SOUNDSCAPES } from "@/constants/soundscapes";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useGenerativeAudio } from "@/hooks/useGenerativeAudio";
import {
  NoiseType,
  TimeOfDay,
  SoundLayer,
  Preset,
  AdaptiveSettings,
  SessionHistory,
  SessionStats,
  SmartRecommendations
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

  // Session tracking
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    totalMinutes: 0,
    completedSessions: 0,
    averageDuration: 0,
    favoriteMode: 'focus',
    currentStreak: 0,
    longestStreak: 0,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSessionRef = useRef<SessionHistory | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  
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

    // Haptic feedback on save
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

    // Haptic feedback on load
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setCurrentMode(preset.mode as keyof typeof SOUNDSCAPES);
    setAdaptiveSettings((prev: AdaptiveSettings) => ({ ...prev, layers: preset.layers }));
    setVolume(preset.volume);
    setNoiseType(preset.noiseType);
    setBinauralFreq(preset.binauralFreq);
    setCurrentPreset(presetId);
  }, [presets]);
  
  const deletePreset = useCallback(async (presetId: string) => {
    // Haptic feedback on delete
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

  // Session tracking functions
  const startSession = useCallback(() => {
    if (!currentMode) return;

    const now = Date.now();
    sessionStartTimeRef.current = now;

    const preset = currentPreset ? presets.find(p => p.id === currentPreset) : null;

    currentSessionRef.current = {
      id: now.toString(),
      mode: currentMode,
      duration: 0,
      targetDuration: sessionDuration,
      completed: false,
      startedAt: now,
      endedAt: now,
      volume,
      intensity,
      noiseType,
      binauralFreq,
      presetId: preset?.id,
      presetName: preset?.name,
    };

    console.log('Session started:', currentSessionRef.current);
  }, [currentMode, sessionDuration, volume, intensity, noiseType, binauralFreq, currentPreset, presets]);

  const endSession = useCallback(async (completed: boolean) => {
    if (!currentSessionRef.current) return;

    // Haptic feedback - heavy if completed, light if stopped early
    if (completed) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const now = Date.now();
    const session: SessionHistory = {
      ...currentSessionRef.current,
      duration: elapsedTime,
      completed,
      endedAt: now,
    };

    // Add to session history
    const updatedHistory = [session, ...sessionHistory].slice(0, 100); // Keep last 100 sessions
    setSessionHistory(updatedHistory);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('session_history', JSON.stringify(updatedHistory));
      console.log('Session saved:', session);
    } catch (error) {
      console.log('Error saving session:', error);
    }

    // Calculate and update stats
    calculateSessionStats(updatedHistory);

    // Clear current session
    currentSessionRef.current = null;
    sessionStartTimeRef.current = 0;
  }, [elapsedTime, sessionHistory]);

  const calculateSessionStats = useCallback((history: SessionHistory[]) => {
    if (history.length === 0) {
      return;
    }

    const totalSessions = history.length;
    const completedSessions = history.filter(s => s.completed).length;
    const totalMinutes = Math.round(
      history.reduce((sum, s) => sum + s.duration, 0) / 60
    );
    const averageDuration = totalMinutes / totalSessions;

    // Find favorite mode
    const modeCounts = history.reduce((acc, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'focus';

    // Calculate streaks (consecutive days with sessions)
    const sortedHistory = [...history].sort((a, b) => b.startedAt - a.startedAt);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = '';

    sortedHistory.forEach(session => {
      const sessionDate = new Date(session.startedAt).toDateString();

      if (lastDate === '') {
        // First session
        tempStreak = 1;
        const today = new Date().toDateString();
        if (sessionDate === today) {
          currentStreak = 1;
        }
      } else {
        const lastDateTime = new Date(lastDate).getTime();
        const sessionDateTime = new Date(sessionDate).getTime();
        const dayDiff = Math.floor((lastDateTime - sessionDateTime) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak++;
          }
        } else if (dayDiff > 1) {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
        // Same day: don't change tempStreak
      }

      lastDate = sessionDate;
    });

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    const stats: SessionStats = {
      totalSessions,
      totalMinutes,
      completedSessions,
      averageDuration,
      favoriteMode,
      currentStreak,
      longestStreak,
    };

    setSessionStats(stats);
  }, []);

  const loadSessionHistory = useCallback(async () => {
    try {
      const historyData = await AsyncStorage.getItem('session_history');
      if (historyData) {
        const history: SessionHistory[] = JSON.parse(historyData);
        setSessionHistory(history);
        calculateSessionStats(history);
      }
    } catch (error) {
      console.log('Error loading session history:', error);
    }
  }, [calculateSessionStats]);

  const clearSessionHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('session_history');
      setSessionHistory([]);
      setSessionStats({
        totalSessions: 0,
        totalMinutes: 0,
        completedSessions: 0,
        averageDuration: 0,
        favoriteMode: 'focus',
        currentStreak: 0,
        longestStreak: 0,
      });
    } catch (error) {
      console.log('Error clearing session history:', error);
    }
  }, []);

  // Smart recommendations based on session history
  const getSmartRecommendations = useCallback((): SmartRecommendations | null => {
    if (sessionHistory.length < 3) {
      // Not enough data for recommendations
      return null;
    }

    // Analyze completed sessions only for better recommendations
    const completedSessions = sessionHistory.filter(s => s.completed);

    if (completedSessions.length === 0) {
      return null;
    }

    // Find best time of day (highest completion rate)
    const timeOfDayStats: Record<TimeOfDay, { completed: number; total: number }> = {
      morning: { completed: 0, total: 0 },
      afternoon: { completed: 0, total: 0 },
      evening: { completed: 0, total: 0 },
      night: { completed: 0, total: 0 },
    };

    sessionHistory.forEach(session => {
      const hour = new Date(session.startedAt).getHours();
      let timeOfDay: TimeOfDay;
      if (hour >= 5 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';

      timeOfDayStats[timeOfDay].total++;
      if (session.completed) timeOfDayStats[timeOfDay].completed++;
    });

    // Find time of day with highest success rate
    let bestTimeOfDay: TimeOfDay = 'morning';
    let highestSuccessRate = 0;
    (Object.keys(timeOfDayStats) as TimeOfDay[]).forEach(time => {
      const stats = timeOfDayStats[time];
      if (stats.total > 0) {
        const successRate = stats.completed / stats.total;
        if (successRate > highestSuccessRate) {
          highestSuccessRate = successRate;
          bestTimeOfDay = time;
        }
      }
    });

    // Calculate average intensity and duration of completed sessions
    const avgIntensity = completedSessions.reduce((sum, s) => sum + s.intensity, 0) / completedSessions.length;
    const avgDuration = Math.round(completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length);

    // Most successful mode
    const modeCounts: Record<string, number> = {};
    completedSessions.forEach(s => {
      modeCounts[s.mode] = (modeCounts[s.mode] || 0) + 1;
    });
    const suggestedMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'focus';

    // Calculate confidence based on sample size
    const confidence = Math.min(completedSessions.length / 10, 1); // Max confidence at 10+ sessions

    // Generate reason
    const successRate = Math.round((completedSessions.length / sessionHistory.length) * 100);
    let reason = `Based on ${completedSessions.length} completed sessions (${successRate}% success rate), `;
    reason += `you focus best during ${bestTimeOfDay} with ${Math.round(avgDuration / 60)}-minute ${suggestedMode} sessions.`;

    return {
      suggestedMode,
      suggestedDuration: avgDuration,
      suggestedIntensity: avgIntensity,
      bestTimeOfDay,
      confidence,
      reason,
    };
  }, [sessionHistory]);

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

      // Load session history
      await loadSessionHistory();
    } catch (error) {
      console.log("Error loading settings:", error);
    }
  }, [loadSessionHistory]);

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
    // End session (not completed if stopped manually)
    if (currentSessionRef.current) {
      const wasCompleted = elapsedTime >= sessionDuration;
      await endSession(wasCompleted);
    }

    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
    setIsPlaying(false);
    setElapsedTime(0);
  }, [elapsedTime, sessionDuration, endSession]);

  const togglePlayPause = useCallback(async () => {
    if (!currentMode) return;

    // Haptic feedback on play/pause
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying) {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } else {
      // Start a new session when play begins
      startSession();

      if (!soundRef.current) {
        await loadSound();
      }
      if (soundRef.current) {
        await soundRef.current.playAsync();
      }
      setIsPlaying(true);
    }
  }, [currentMode, isPlaying, loadSound, startSession]);

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

  // Background audio and interruption handling
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          interruptionModeIOS: 1, // Allow other audio sources to interrupt
          interruptionModeAndroid: 1, // Do not mix with other audio
        });

        // Set up interruption handler
        if (soundRef.current) {
          soundRef.current.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;

            // Handle audio interruptions (phone calls, alarms, etc.)
            if (status.isLoaded && !status.isPlaying && isPlaying) {
              console.log('Audio interrupted - pausing session');
              setIsPlaying(false);
            }
          });
        }
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
  }, [isPlaying]);

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
    // Session tracking
    sessionHistory,
    sessionStats,
    clearSessionHistory,
    getSmartRecommendations,
  };
});