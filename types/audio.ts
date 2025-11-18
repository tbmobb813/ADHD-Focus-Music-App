export type NoiseType = 'white' | 'pink' | 'brown';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface SoundLayer {
  id: string;
  type: 'noise' | 'pad' | 'pulse' | 'binaural';
  volume: number;
  frequency?: number;
  enabled: boolean;
  filterFreq?: number;
  resonance?: number;
  lfoRate?: number;
  lfoDepth?: number;
  noiseType?: NoiseType;
}

export interface Preset {
  id: string;
  name: string;
  mode: string;
  layers: SoundLayer[];
  volume: number;
  noiseType: NoiseType;
  binauralFreq: number;
  createdAt: number;
}

export interface AdaptiveSettings {
  timeOfDay: TimeOfDay;
  sessionLength: number;
  adaptToTime: boolean;
  layers: SoundLayer[];
}

export interface AudioEngineInterface {
  initialize(): Promise<void>;
  updateLayers(layers: SoundLayer[]): void;
  updateSettings(settings: AdaptiveSettings): void;
  updateVolume(volume: number): void;
  updateIntensity(intensity: number): void;
  start(): Promise<void>;
  stop(): void;
  cleanup(): void;
}

export interface AudioNode {
  connect(destination: AudioNode): void;
  disconnect(): void;
}

export interface GenerativeAudioParams {
  layers: SoundLayer[];
  settings: AdaptiveSettings;
  volume: number;
  intensity: number;
}

export interface SessionHistory {
  id: string;
  mode: string;
  duration: number; // in seconds
  targetDuration: number; // in seconds
  completed: boolean;
  startedAt: number; // timestamp
  endedAt: number; // timestamp
  volume: number;
  intensity: number;
  noiseType: NoiseType;
  binauralFreq: number;
  presetId?: string;
  presetName?: string;
}

export interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  completedSessions: number;
  averageDuration: number;
  favoriteMode: string;
  currentStreak: number;
  longestStreak: number;
}

export interface SmartRecommendations {
  suggestedMode: string;
  suggestedDuration: number; // in seconds
  suggestedIntensity: number;
  bestTimeOfDay: TimeOfDay;
  confidence: number; // 0-1, how confident we are in these recommendations
  reason: string;
}

export interface PomodoroSettings {
  enabled: boolean;
  workDuration: number; // in seconds (default 25 min = 1500s)
  breakDuration: number; // in seconds (default 5 min = 300s)
  longBreakDuration: number; // in seconds (default 15 min = 900s)
  longBreakInterval: number; // after how many work sessions (default 4)
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export type PomodoroPhase = 'work' | 'break' | 'longBreak';