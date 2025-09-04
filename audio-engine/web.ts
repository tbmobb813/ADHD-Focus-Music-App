import { AudioEngineInterface, SoundLayer, AdaptiveSettings, NoiseType } from '@/types/audio';

export class WebAudioEngine implements AudioEngineInterface {
  private audioContext: AudioContext | null = null;
  private oscillators = new Map<string, OscillatorNode>();
  private gainNodes = new Map<string, GainNode>();
  private filterNodes = new Map<string, BiquadFilterNode>();
  private lfoNodes = new Map<string, OscillatorNode>();
  private reverbNode: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private reverbBuffer: AudioBuffer | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  
  private currentLayers: SoundLayer[] = [];
  private currentSettings: AdaptiveSettings | null = null;
  private currentVolume = 0.7;
  private currentIntensity = 0.5;
  private isInitialized = false;
  private isStarted = false;

  async initialize(): Promise<void> {
    if (this.isInitialized || this.audioContext) {
      return;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain and limiter for safe output
      this.masterGain = this.audioContext.createGain();
      this.limiter = this.audioContext.createDynamicsCompressor();
      
      // Configure limiter for safety
      this.limiter.threshold.setValueAtTime(-6, this.audioContext.currentTime);
      this.limiter.knee.setValueAtTime(5, this.audioContext.currentTime);
      this.limiter.ratio.setValueAtTime(12, this.audioContext.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      this.limiter.release.setValueAtTime(0.25, this.audioContext.currentTime);
      
      // Connect master chain
      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.audioContext.destination);
      
      // Generate buffers
      this.noiseBuffer = this.generateNoiseBuffer('pink');
      this.reverbBuffer = this.generateReverbBuffer(2, 2);
      
      // Create reverb node
      if (this.reverbBuffer) {
        this.reverbNode = this.audioContext.createConvolver();
        this.reverbNode.buffer = this.reverbBuffer;
        this.reverbNode.connect(this.masterGain);
      }
      
      this.isInitialized = true;
      console.log('Web Audio Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Web Audio Engine:', error);
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
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
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
    
    if (!this.audioContext || this.isStarted) {
      return;
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.createAllLayers();
    this.isStarted = true;
    console.log('Web Audio Engine started');
  }

  stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.stopAllOscillators();
    this.clearAllNodes();
    this.isStarted = false;
    console.log('Web Audio Engine stopped');
  }

  cleanup(): void {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    console.log('Web Audio Engine cleaned up');
  }

  private generateNoiseBuffer(type: NoiseType, duration: number = 2): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
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
  }

  private generateReverbBuffer(duration: number = 2, decay: number = 2): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }
    
    return buffer;
  }

  private createAllLayers(): void {
    this.currentLayers.forEach(layer => {
      if (layer.enabled) {
        this.createLayer(layer);
      }
    });
  }

  private recreateLayers(): void {
    this.stopAllOscillators();
    this.clearAllNodes();
    this.createAllLayers();
  }

  private createLayer(layer: SoundLayer): void {
    if (!this.audioContext || !this.masterGain) return;

    switch (layer.type) {
      case 'noise':
        this.createNoiseLayer(layer);
        break;
      case 'pad':
        this.createPadLayer(layer);
        break;
      case 'pulse':
        this.createPulseLayer(layer);
        break;
      case 'binaural':
        this.createBinauralLayer(layer);
        break;
    }
  }

  private createNoiseLayer(layer: SoundLayer): void {
    if (!this.audioContext || !this.noiseBuffer || !this.masterGain) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    source.buffer = this.noiseBuffer;
    source.loop = true;
    
    // Setup filter
    filterNode.type = 'lowpass';
    const cutoffFreq = (layer.filterFreq || 500) + (this.currentIntensity * 2000);
    filterNode.frequency.setValueAtTime(cutoffFreq, this.audioContext.currentTime);
    filterNode.Q.setValueAtTime((layer.resonance || 1) + this.currentIntensity * 3, this.audioContext.currentTime);

    // Setup gain
    const volume = layer.volume * this.currentVolume * (0.5 + this.currentIntensity * 0.5);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);

    // Create LFO if specified
    if (layer.lfoRate && layer.lfoDepth) {
      this.createLFO(layer.id + '_lfo', layer.lfoRate, cutoffFreq * layer.lfoDepth, filterNode.frequency);
    }

    // Connect audio chain
    source.connect(filterNode);
    filterNode.connect(gainNode);
    this.connectToOutput(gainNode, layer.id);

    // Store references
    this.gainNodes.set(layer.id, gainNode);
    this.filterNodes.set(layer.id, filterNode);

    source.start();
  }

  private createPadLayer(layer: SoundLayer): void {
    if (!this.audioContext || !this.masterGain || !layer.frequency) return;

    const baseFreq = layer.frequency;
    const detuneAmounts = [0, 5, -5]; // Slight detuning for richness
    
    detuneAmounts.forEach((detune, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      const filterNode = this.audioContext!.createBiquadFilter();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(baseFreq, this.audioContext!.currentTime);
      oscillator.detune.setValueAtTime(detune, this.audioContext!.currentTime);

      // Setup filter
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(layer.filterFreq || 800, this.audioContext!.currentTime);
      filterNode.Q.setValueAtTime(layer.resonance || 2, this.audioContext!.currentTime);

      // Setup gain with slight variation per oscillator
      const volume = layer.volume * this.currentVolume * (0.3 + index * 0.1);
      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
      gainNode.gain.setTargetAtTime(volume, this.audioContext!.currentTime, 0.1);

      // Create LFO for filter modulation
      if (layer.lfoRate && layer.lfoDepth) {
        this.createLFO(
          `${layer.id}_${index}_lfo`, 
          layer.lfoRate, 
          (layer.filterFreq || 800) * layer.lfoDepth, 
          filterNode.frequency
        );
      }

      // Connect audio chain
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      this.connectToOutput(gainNode, `${layer.id}_${index}`);

      // Store references
      this.oscillators.set(`${layer.id}_${index}`, oscillator);
      this.gainNodes.set(`${layer.id}_${index}`, gainNode);
      this.filterNodes.set(`${layer.id}_${index}`, filterNode);

      oscillator.start();
    });
  }

  private createPulseLayer(layer: SoundLayer): void {
    if (!this.audioContext || !this.masterGain || !layer.frequency) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(layer.frequency, this.audioContext.currentTime);

    // Setup filter
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(layer.filterFreq || 1000, this.audioContext.currentTime);
    filterNode.Q.setValueAtTime(layer.resonance || 1, this.audioContext.currentTime);

    // Setup gain
    const volume = layer.volume * this.currentVolume * (0.3 + this.currentIntensity * 0.4);
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);

    // Create volume LFO for gentle pulsing
    if (layer.lfoRate) {
      this.createLFO(layer.id + '_volume_lfo', layer.lfoRate, volume * 0.3, gainNode.gain);
    }

    // Connect audio chain
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    this.connectToOutput(gainNode, layer.id);

    // Store references
    this.oscillators.set(layer.id, oscillator);
    this.gainNodes.set(layer.id, gainNode);
    this.filterNodes.set(layer.id, filterNode);

    oscillator.start();
  }

  private createBinauralLayer(layer: SoundLayer): void {
    if (!this.audioContext || !this.masterGain || !layer.frequency) return;

    const baseFreq = 200;
    const leftOsc = this.audioContext.createOscillator();
    const rightOsc = this.audioContext.createOscillator();
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();
    const merger = this.audioContext.createChannelMerger(2);

    leftOsc.type = 'sine';
    rightOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    rightOsc.frequency.setValueAtTime(baseFreq + layer.frequency, this.audioContext.currentTime);

    const volume = layer.volume * this.currentVolume;
    leftGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    rightGain.gain.setValueAtTime(volume, this.audioContext.currentTime);

    // Connect for stereo separation
    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    this.connectToOutput(merger as any, layer.id);

    // Store references
    this.oscillators.set(layer.id + '_left', leftOsc);
    this.oscillators.set(layer.id + '_right', rightOsc);
    this.gainNodes.set(layer.id + '_left', leftGain);
    this.gainNodes.set(layer.id + '_right', rightGain);

    leftOsc.start();
    rightOsc.start();
  }

  private createLFO(id: string, rate: number, depth: number, target: AudioParam): void {
    if (!this.audioContext) return;

    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(depth, this.audioContext.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(target);
    lfo.start();

    this.lfoNodes.set(id, lfo);
  }

  private connectToOutput(node: any, layerId: string): void {
    if (!this.masterGain) return;

    // Add reverb send if intensity is high enough
    if (this.reverbNode && this.currentIntensity > 0.3) {
      const reverbSend = this.audioContext!.createGain();
      reverbSend.gain.setValueAtTime(this.currentIntensity * 0.2, this.audioContext!.currentTime);
      node.connect(reverbSend);
      reverbSend.connect(this.reverbNode);
    }

    node.connect(this.masterGain);
  }

  private applyAdaptiveSettings(): void {
    // Implementation for adaptive settings based on time of day
    if (!this.currentSettings) return;
    
    console.log('Applying adaptive settings for:', this.currentSettings.timeOfDay);
    // This would modify existing layers based on time of day
  }

  private applyIntensityChanges(): void {
    // Update filter frequencies and volumes based on intensity
    this.filterNodes.forEach((filter, id) => {
      if (this.audioContext) {
        const baseFreq = id.includes('noise') ? 500 : 800;
        const newFreq = baseFreq + (this.currentIntensity * 2000);
        filter.frequency.setTargetAtTime(newFreq, this.audioContext.currentTime, 0.1);
        filter.Q.setTargetAtTime(1 + this.currentIntensity * 3, this.audioContext.currentTime, 0.1);
      }
    });

    // Update volumes
    this.gainNodes.forEach((gain, id) => {
      if (this.audioContext) {
        const layer = this.currentLayers.find(l => id.startsWith(l.id));
        if (layer) {
          const intensityMultiplier = 0.5 + this.currentIntensity * 0.5;
          const newVolume = layer.volume * this.currentVolume * intensityMultiplier;
          gain.gain.setTargetAtTime(newVolume, this.audioContext.currentTime, 0.1);
        }
      }
    });
  }

  private stopAllOscillators(): void {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Oscillator might already be stopped
      }
    });

    this.lfoNodes.forEach(lfo => {
      try {
        lfo.stop();
      } catch {
        // LFO might already be stopped
      }
    });
  }

  private clearAllNodes(): void {
    this.oscillators.clear();
    this.gainNodes.clear();
    this.filterNodes.clear();
    this.lfoNodes.clear();
  }
}