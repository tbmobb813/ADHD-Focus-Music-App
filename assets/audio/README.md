# Audio Assets for ADHD Focus Music App

This directory contains audio files used by the Native Audio Engine for iOS and Android platforms.

## Directory Structure

```
assets/audio/
├── noise/          # Noise layer audio files
├── pad/            # Ambient pad layer audio files
├── pulse/          # Pulse/rhythm layer audio files
└── binaural/       # Binaural beat carrier tones
```

## Required Audio Files

### Noise Layers (`/noise`)
- **white-noise.mp3** - White noise (flat frequency spectrum)
- **pink-noise.mp3** - Pink noise (1/f frequency spectrum, more pleasant)
- **brown-noise.mp3** - Brown noise (deeper, rumbling sound)

**Specifications:**
- Format: MP3, 320kbps
- Duration: 60+ seconds (looped)
- Sample Rate: 44.1kHz or 48kHz
- Mono or Stereo

### Pad Layers (`/pad`)
- **deep-pad-110hz.mp3** - Deep ambient drone at ~110Hz (A2)
- **warm-pad-220hz.mp3** - Warm ambient pad at ~220Hz (A3)
- **bright-pad-440hz.mp3** - Bright ambient pad at ~440Hz (A4)

**Specifications:**
- Format: MP3, 320kbps
- Duration: 60+ seconds (seamless loop)
- Sample Rate: 44.1kHz or 48kHz
- Stereo (with subtle stereo width)
- Soft attack/release for smooth looping

### Pulse Layers (`/pulse`)
- **gentle-pulse-60bpm.mp3** - Gentle rhythmic pulse at 60 BPM (1 Hz)
- **moderate-pulse-90bpm.mp3** - Moderate pulse at 90 BPM (1.5 Hz)
- **active-pulse-120bpm.mp3** - Active pulse at 120 BPM (2 Hz)

**Specifications:**
- Format: MP3, 320kbps
- Duration: 60+ seconds (rhythmically aligned)
- Sample Rate: 44.1kHz or 48kHz
- Mono or Stereo
- Soft pulsing sound (sine/triangle wave or filtered noise bursts)

### Binaural Layers (`/binaural`)
- **carrier-200hz.mp3** - Pure sine wave at 200Hz (binaural carrier tone)

**Specifications:**
- Format: MP3, 320kbps
- Duration: 60+ seconds
- Sample Rate: 44.1kHz or 48kHz
- **Must be mono** (stereo separation is handled in code)
- Pure sine wave with no harmonics

## How to Generate Audio Files

### Option 1: Use Audacity (Free, Open Source)

1. **For Noise:**
   - Generate → Noise → Select type (White/Pink/Brownian)
   - Set duration to 60 seconds
   - Normalize to -3dB
   - Export as MP3 (320kbps)

2. **For Pads:**
   - Generate → Tone → Sine wave at desired frequency
   - Add 2-3 more sine waves slightly detuned (±5-10 cents)
   - Apply: Effect → Reverb (Wet: 30%, Room Size: 50%)
   - Apply: Effect → Filter Curve (gentle low-pass at 2kHz)
   - Normalize to -6dB
   - Export as MP3 (320kbps)

3. **For Pulse:**
   - Generate → Tone Generator → Triangle wave
   - Effect → Tremolo (frequency = BPM/60, depth = 80%)
   - OR use Generate → Rhythm Track and filter heavily
   - Export as MP3 (320kbps)

4. **For Binaural:**
   - Generate → Tone → Sine wave at 200Hz
   - Set duration to 60 seconds
   - Normalize to -6dB
   - Convert to mono: Tracks → Mix → Mix Stereo to Mono
   - Export as MP3 (320kbps)

### Option 2: Use Online Services

- **MyNoise.net** - Download custom noise generators
- **AudioJungle** / **Epidemic Sound** - Licensed ambient loops
- **Freesound.org** - Free Creative Commons audio (check licenses)

### Option 3: Use AI Audio Generation

- **Stability Audio** / **MusicGen** - Generate custom ambient sounds
- Specify prompts like "60 second seamless ambient drone at 110Hz"

## Audio File Specifications Checklist

- [ ] All files are MP3 format, 320kbps
- [ ] All files are 60+ seconds in duration
- [ ] All files loop seamlessly (no clicks/pops)
- [ ] Binaural carrier is mono
- [ ] All files are normalized (prevent clipping)
- [ ] Sample rate is 44.1kHz or 48kHz
- [ ] File names match exactly as listed above

## Testing Your Audio Files

After adding files, run the app on iOS/Android and:

1. Navigate to Session screen
2. Enable different sound layers in "Advanced" → "Sound Layers"
3. Play and listen for:
   - Smooth looping (no clicks at loop point)
   - Proper volume levels (not too quiet or clipping)
   - Correct frequency/tone

## Legal Considerations

- Ensure you have rights to use all audio files
- For commercial distribution, use:
  - Self-generated content
  - Royalty-free libraries with commercial licenses
  - Licensed music from providers like Epidemic Sound
- Avoid copyrighted music or samples

## Questions?

If you need help generating audio files or have questions about specifications, please open an issue on GitHub.
