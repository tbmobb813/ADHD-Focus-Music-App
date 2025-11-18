#!/usr/bin/env node

/**
 * Generate Placeholder Audio Files
 *
 * This script generates simple placeholder audio files for testing.
 * These are NOT high-quality production files - they're meant for development only.
 *
 * For production, use Audacity to generate proper loopable audio as described
 * in assets/audio/README.md
 */

const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'assets', 'audio');

function createDirectories() {
  const dirs = [
    path.join(AUDIO_DIR, 'noise'),
    path.join(AUDIO_DIR, 'pad'),
    path.join(AUDIO_DIR, 'pulse'),
    path.join(AUDIO_DIR, 'binaural'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

function createPlaceholderFile(filePath, type) {
  // Create a minimal valid MP3 file header (just for file existence)
  // This won't actually play sound - it's just to prevent require() errors
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MPEG 1 Layer 3, 128kbps, 44100Hz
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);

  fs.writeFileSync(filePath, mp3Header);
  console.log(`📄 Created placeholder: ${path.basename(filePath)}`);
}

function generatePlaceholders() {
  console.log('\n🎵 ADHD Focus Music App - Placeholder Audio Generator');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: These are PLACEHOLDER files only!');
  console.log('They will prevent crashes but won\'t produce actual sound.');
  console.log('For real audio, use Audacity as described in assets/audio/README.md\n');

  createDirectories();

  const files = [
    'noise/white-noise.mp3',
    'noise/pink-noise.mp3',
    'noise/brown-noise.mp3',
    'pad/deep-pad-110hz.mp3',
    'pad/mid-pad-220hz.mp3',
    'pad/high-pad-440hz.mp3',
    'pulse/pulse-60bpm.mp3',
    'pulse/pulse-80bpm.mp3',
    'binaural/binaural-40hz-left.mp3',
    'binaural/binaural-40hz-right.mp3',
  ];

  console.log('\n📦 Generating placeholder files...\n');

  files.forEach(file => {
    const filePath = path.join(AUDIO_DIR, file);
    createPlaceholderFile(filePath, path.basename(file));
  });

  console.log('\n✅ Placeholder generation complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Open Audacity');
  console.log('2. Follow instructions in assets/audio/README.md');
  console.log('3. Generate proper loopable audio files');
  console.log('4. Replace these placeholders with real audio');
  console.log('\nOr use ffmpeg commands from download-audio.sh for quick testing.\n');
}

// Run the script
try {
  generatePlaceholders();
} catch (error) {
  console.error('❌ Error generating placeholders:', error.message);
  process.exit(1);
}
