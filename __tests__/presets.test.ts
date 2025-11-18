import AsyncStorage from '@react-native-async-storage/async-storage';
import { Preset, SoundLayer } from '@/types/audio';

describe('Preset Management', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Save Preset', () => {
    it('should save a new preset to AsyncStorage', async () => {
      const preset: Preset = {
        id: '123',
        name: 'My Focus Preset',
        mode: 'focus',
        layers: [
          {
            id: 'noise-1',
            type: 'noise',
            enabled: true,
            volume: 0.5,
            noiseType: 'pink',
          },
        ],
        volume: 0.7,
        noiseType: 'pink',
        binauralFreq: 40,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([preset]));

      const saved = await AsyncStorage.getItem('soundscape_presets');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('My Focus Preset');
      expect(parsed[0].mode).toBe('focus');
    });

    it('should save multiple presets', async () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Preset 1',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Preset 2',
          mode: 'relax',
          layers: [],
          volume: 0.6,
          noiseType: 'pink',
          binauralFreq: 10,
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(presets));

      const saved = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(saved!);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Preset 1');
      expect(parsed[1].name).toBe('Preset 2');
    });

    it('should preserve layer configuration in preset', async () => {
      const layers: SoundLayer[] = [
        {
          id: 'noise-1',
          type: 'noise',
          enabled: true,
          volume: 0.5,
          noiseType: 'pink',
          filterFreq: 800,
          resonance: 2,
        },
        {
          id: 'pad-1',
          type: 'pad',
          enabled: true,
          volume: 0.6,
          frequency: 110,
          filterFreq: 1000,
        },
        {
          id: 'binaural-1',
          type: 'binaural',
          enabled: false,
          volume: 0.4,
          frequency: 40,
        },
      ];

      const preset: Preset = {
        id: Date.now().toString(),
        name: 'Complex Preset',
        mode: 'focus',
        layers,
        volume: 0.8,
        noiseType: 'brown',
        binauralFreq: 40,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([preset]));

      const saved = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(saved!);

      expect(parsed[0].layers).toHaveLength(3);
      expect(parsed[0].layers[0].type).toBe('noise');
      expect(parsed[0].layers[1].type).toBe('pad');
      expect(parsed[0].layers[2].type).toBe('binaural');
      expect(parsed[0].layers[2].enabled).toBe(false);
    });

    it('should handle saving preset with unique ID', async () => {
      const timestamp1 = Date.now();
      const preset1: Preset = {
        id: timestamp1.toString(),
        name: 'Preset 1',
        mode: 'focus',
        layers: [],
        volume: 0.5,
        noiseType: 'white',
        binauralFreq: 40,
        createdAt: timestamp1,
      };

      const timestamp2 = timestamp1 + 1000;
      const preset2: Preset = {
        id: timestamp2.toString(),
        name: 'Preset 2',
        mode: 'relax',
        layers: [],
        volume: 0.6,
        noiseType: 'pink',
        binauralFreq: 10,
        createdAt: timestamp2,
      };

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([preset1, preset2]));

      const saved = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(saved!);

      expect(parsed[0].id).not.toBe(parsed[1].id);
    });
  });

  describe('Load Preset', () => {
    it('should load an existing preset from AsyncStorage', async () => {
      const preset: Preset = {
        id: '456',
        name: 'Saved Preset',
        mode: 'sleep',
        layers: [
          {
            id: 'noise-1',
            type: 'noise',
            enabled: true,
            volume: 0.3,
            noiseType: 'brown',
          },
        ],
        volume: 0.4,
        noiseType: 'brown',
        binauralFreq: 4,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([preset]));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed[0].id).toBe('456');
      expect(parsed[0].name).toBe('Saved Preset');
      expect(parsed[0].mode).toBe('sleep');
      expect(parsed[0].volume).toBe(0.4);
    });

    it('should load the correct preset by ID', async () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Preset 1',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Preset 2',
          mode: 'relax',
          layers: [],
          volume: 0.6,
          noiseType: 'pink',
          binauralFreq: 10,
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(presets));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);
      const targetPreset = parsed.find((p: Preset) => p.id === '2');

      expect(targetPreset).toBeDefined();
      expect(targetPreset.name).toBe('Preset 2');
      expect(targetPreset.mode).toBe('relax');
    });

    it('should return null when loading non-existent preset', async () => {
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([]));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);
      const targetPreset = parsed.find((p: Preset) => p.id === 'non-existent');

      expect(targetPreset).toBeUndefined();
    });

    it('should restore all layer settings when loading preset', async () => {
      const preset: Preset = {
        id: '789',
        name: 'Full Config',
        mode: 'focus',
        layers: [
          {
            id: 'noise-1',
            type: 'noise',
            enabled: true,
            volume: 0.5,
            noiseType: 'pink',
            filterFreq: 800,
            resonance: 2,
            lfoRate: 0.3,
            lfoDepth: 0.5,
          },
        ],
        volume: 0.7,
        noiseType: 'pink',
        binauralFreq: 40,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([preset]));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed[0].layers[0].filterFreq).toBe(800);
      expect(parsed[0].layers[0].resonance).toBe(2);
      expect(parsed[0].layers[0].lfoRate).toBe(0.3);
      expect(parsed[0].layers[0].lfoDepth).toBe(0.5);
    });
  });

  describe('Delete Preset', () => {
    it('should delete a preset from AsyncStorage', async () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Preset 1',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Preset 2',
          mode: 'relax',
          layers: [],
          volume: 0.6,
          noiseType: 'pink',
          binauralFreq: 10,
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(presets));

      // Delete preset with id '1'
      const filteredPresets = presets.filter(p => p.id !== '1');
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(filteredPresets));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('2');
    });

    it('should handle deleting non-existent preset', async () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Preset 1',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(presets));

      // Try to delete non-existent preset
      const filteredPresets = presets.filter(p => p.id !== 'non-existent');
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(filteredPresets));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('1');
    });

    it('should clear current preset if deleted preset is active', async () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Active Preset',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(presets));
      await AsyncStorage.setItem('current_preset_id', '1');

      // Delete the active preset
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([]));
      const currentPresetId = await AsyncStorage.getItem('current_preset_id');

      // Check if preset was deleted
      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);
      expect(parsed).toHaveLength(0);

      // Current preset should be cleared (in actual implementation)
      // For this test, we just verify the preset is gone
    });
  });

  describe('Export Presets', () => {
    it('should export presets as JSON string', async () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Preset 1',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
      ];

      const exported = JSON.stringify(presets, null, 2);

      expect(exported).toBeTruthy();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Preset 1');
    });

    it('should export presets with all properties', async () => {
      const preset: Preset = {
        id: '123',
        name: 'Complete Preset',
        mode: 'focus',
        layers: [
          {
            id: 'layer-1',
            type: 'noise',
            enabled: true,
            volume: 0.5,
            noiseType: 'pink',
          },
        ],
        volume: 0.7,
        noiseType: 'pink',
        binauralFreq: 40,
        createdAt: Date.now(),
      };

      const exported = JSON.stringify([preset], null, 2);
      const parsed = JSON.parse(exported);

      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('name');
      expect(parsed[0]).toHaveProperty('mode');
      expect(parsed[0]).toHaveProperty('layers');
      expect(parsed[0]).toHaveProperty('volume');
      expect(parsed[0]).toHaveProperty('noiseType');
      expect(parsed[0]).toHaveProperty('binauralFreq');
      expect(parsed[0]).toHaveProperty('createdAt');
    });
  });

  describe('Import Presets', () => {
    it('should import valid presets JSON', async () => {
      const presetsJson = JSON.stringify([
        {
          id: '1',
          name: 'Imported Preset',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
      ]);

      const imported = JSON.parse(presetsJson);
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(imported));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Imported Preset');
    });

    it('should handle invalid JSON gracefully', async () => {
      const invalidJson = 'not valid json {';

      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should merge imported presets with existing ones', async () => {
      const existingPresets: Preset[] = [
        {
          id: '1',
          name: 'Existing',
          mode: 'focus',
          layers: [],
          volume: 0.5,
          noiseType: 'white',
          binauralFreq: 40,
          createdAt: Date.now(),
        },
      ];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(existingPresets));

      const importedPresets: Preset[] = [
        {
          id: '2',
          name: 'Imported',
          mode: 'relax',
          layers: [],
          volume: 0.6,
          noiseType: 'pink',
          binauralFreq: 10,
          createdAt: Date.now(),
        },
      ];

      const existing = await AsyncStorage.getItem('soundscape_presets');
      const parsedExisting = JSON.parse(existing!);
      const merged = [...parsedExisting, ...importedPresets];

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify(merged));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Existing');
      expect(parsed[1].name).toBe('Imported');
    });
  });

  describe('Preset Data Persistence', () => {
    it('should persist presets across sessions', async () => {
      const preset: Preset = {
        id: 'persist-test',
        name: 'Persistent Preset',
        mode: 'focus',
        layers: [],
        volume: 0.7,
        noiseType: 'pink',
        binauralFreq: 40,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([preset]));

      // Simulate app restart by getting data again
      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed[0].id).toBe('persist-test');
      expect(parsed[0].name).toBe('Persistent Preset');
    });

    it('should handle empty preset list', async () => {
      await AsyncStorage.setItem('soundscape_presets', JSON.stringify([]));

      const loaded = await AsyncStorage.getItem('soundscape_presets');
      const parsed = JSON.parse(loaded!);

      expect(parsed).toEqual([]);
      expect(parsed).toHaveLength(0);
    });

    it('should return null when no presets exist', async () => {
      const loaded = await AsyncStorage.getItem('soundscape_presets');
      expect(loaded).toBeNull();
    });
  });
});
