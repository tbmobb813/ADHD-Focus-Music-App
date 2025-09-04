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