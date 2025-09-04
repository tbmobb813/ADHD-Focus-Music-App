import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Pause,
  Play,
  Volume2,
  Timer,
  Wind,
  Settings,
  Clock,
  Waves,
  Zap,
  Brain,
  ChevronDown,
  ChevronUp,
  Sliders,
  Save,
  Download,
  Upload,
} from "lucide-react-native";
import { router } from "expo-router";
import { useSound } from "@/providers/SoundProvider";
import { SOUNDSCAPES } from "@/constants/soundscapes";
import CustomSlider from "@/components/CustomSlider";
import ProgressArc from "@/components/ProgressArc";

const { width, height } = Dimensions.get("window");

export default function SessionScreen() {
  const {
    currentMode,
    isPlaying,
    togglePlayPause,
    volume,
    setVolume,
    sessionDuration,
    setSessionDuration,
    elapsedTime,
    adaptiveSettings,
    setAdaptiveSettings,
    noiseType,
    setNoiseType,
    binauralFreq,
    setBinauralFreq,
    intensity,
    setIntensity,
    updateLayer,
    presets,
    currentPreset,
    savePreset,
    loadPreset,
    deletePreset,
    exportPresets,
    importPresets,
  } = useSound();

  const [showBreathing, setShowBreathing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAdaptive, setShowAdaptive] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const breathAnim = useRef(new Animated.Value(0.3)).current;
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const mode = currentMode ? SOUNDSCAPES[currentMode] : SOUNDSCAPES.focus;

  useEffect(() => {
    if (showBreathing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 0.3,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showBreathing, breathAnim]);

  useEffect(() => {
    if (isPlaying) {
      particleAnims.forEach((anim, index) => {
        const delay = index * 500;
        const duration = 3000 + Math.random() * 2000;
        
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim.opacity, {
                toValue: 0.6,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.x, {
                toValue: (Math.random() - 0.5) * width,
                duration,
                useNativeDriver: true,
              }),
              Animated.timing(anim.y, {
                toValue: -height / 2 + Math.random() * height,
                duration,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }
  }, [isPlaying, particleAnims]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const handleClose = () => {
    router.back();
  };

  const durationOptions = [5, 10, 15, 20, 30, 45, 60];
  const noiseTypes = ['white', 'pink', 'brown'] as const;
  
  const getTimeOfDayDisplay = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return '🌅 Morning';
      case 'afternoon': return '☀️ Afternoon';
      case 'evening': return '🌆 Evening';
      case 'night': return '🌙 Night';
      default: return timeOfDay;
    }
  };
  
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'noise': return <Waves color="rgba(255,255,255,0.8)" size={16} />;
      case 'pad': return <Wind color="rgba(255,255,255,0.8)" size={16} />;
      case 'pulse': return <Zap color="rgba(255,255,255,0.8)" size={16} />;
      case 'binaural': return <Brain color="rgba(255,255,255,0.8)" size={16} />;
      default: return null;
    }
  };
  
  const getLayerName = (type: string) => {
    switch (type) {
      case 'noise': return 'Colored Noise';
      case 'pad': return 'Ambient Pad';
      case 'pulse': return 'Soft Pulse';
      case 'binaural': return 'Binaural Beat';
      default: return type;
    }
  };

  return (
    <LinearGradient colors={mode.gradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.visualizer}>
            {particleAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.x },
                      { translateY: anim.y },
                    ],
                  },
                ]}
              />
            ))}
            
            {showBreathing && (
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: breathAnim }],
                    opacity: breathAnim,
                  },
                ]}
              />
            )}

            <View style={styles.centerIcon}>{mode.icon}</View>
          </View>

          <View style={styles.info}>
            <Text style={styles.modeName}>{mode.name}</Text>
            <View style={styles.timerContainer}>
              <ProgressArc
                size={120}
                strokeWidth={4}
                progress={elapsedTime / sessionDuration}
                color="rgba(255, 255, 255, 0.9)"
                backgroundColor="rgba(255, 255, 255, 0.2)"
              />
              <View style={styles.timerContent}>
                <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.timerTotal}>/ {formatTime(sessionDuration)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.playButton}
            >
              <View style={styles.playButtonInner}>
                {isPlaying ? (
                  <Pause color="#fff" size={32} fill="#fff" />
                ) : (
                  <Play color="#fff" size={32} fill="#fff" />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.sliderContainer}>
              <Volume2 color="rgba(255,255,255,0.8)" size={20} />
              <CustomSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor="rgba(255,255,255,0.8)"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#fff"
              />
              <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
            </View>
            
            {/* Intensity Slider */}
            <View style={styles.sliderContainer}>
              <Sliders color="rgba(255,255,255,0.8)" size={20} />
              <View style={styles.sliderLabelContainer}>
                <Text style={styles.sliderLabel}>Intensity</Text>
                <Text style={styles.sliderDescription}>Controls density, reverb & brightness</Text>
              </View>
              <CustomSlider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={intensity}
                onValueChange={setIntensity}
                minimumTrackTintColor="rgba(255,255,255,0.8)"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#fff"
              />
              <Text style={styles.volumeText}>{Math.round(intensity * 100)}%</Text>
            </View>

            <View style={styles.durationContainer}>
              <Timer color="rgba(255,255,255,0.8)" size={20} />
              <Text style={styles.durationLabel}>Session Duration</Text>
            </View>
            <View style={styles.durationOptions}>
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  onPress={() => setSessionDuration(duration * 60)}
                  style={[
                    styles.durationOption,
                    sessionDuration === duration * 60 &&
                      styles.durationOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      sessionDuration === duration * 60 &&
                        styles.durationOptionTextActive,
                    ]}
                  >
                    {duration}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowBreathing(!showBreathing)}
              style={styles.breathingButton}
            >
              <Wind color="rgba(255,255,255,0.8)" size={20} />
              <Text style={styles.breathingButtonText}>
                {showBreathing ? "Hide" : "Show"} Breathing Guide
              </Text>
            </TouchableOpacity>
            
            {/* Presets Section */}
            <TouchableOpacity
              onPress={() => setShowPresets(!showPresets)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderContent}>
                <Save color="rgba(255,255,255,0.8)" size={20} />
                <Text style={styles.sectionHeaderText}>Presets</Text>
                {currentPreset && (
                  <Text style={styles.currentPresetText}>
                    {presets.find(p => p.id === currentPreset)?.name || 'Custom'}
                  </Text>
                )}
              </View>
              {showPresets ? (
                <ChevronUp color="rgba(255,255,255,0.6)" size={20} />
              ) : (
                <ChevronDown color="rgba(255,255,255,0.6)" size={20} />
              )}
            </TouchableOpacity>
            
            {showPresets && (
              <View style={styles.presetsContainer}>
                <View style={styles.presetActions}>
                  <TouchableOpacity
                    onPress={() => setShowSavePreset(true)}
                    style={styles.presetActionButton}
                  >
                    <Save color="rgba(255,255,255,0.8)" size={16} />
                    <Text style={styles.presetActionText}>Save Current</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      // Simple export - in a real app you'd use share API
                      console.log('Export presets:', exportPresets());
                    }}
                    style={styles.presetActionButton}
                  >
                    <Download color="rgba(255,255,255,0.8)" size={16} />
                    <Text style={styles.presetActionText}>Export</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      // Simple import - in a real app you'd use document picker
                      console.log('Import presets');
                    }}
                    style={styles.presetActionButton}
                  >
                    <Upload color="rgba(255,255,255,0.8)" size={16} />
                    <Text style={styles.presetActionText}>Import</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.presetsList} nestedScrollEnabled>
                  {presets.map((preset) => (
                    <View key={preset.id} style={styles.presetItem}>
                      <TouchableOpacity
                        onPress={() => loadPreset(preset.id)}
                        style={[
                          styles.presetButton,
                          currentPreset === preset.id && styles.presetButtonActive
                        ]}
                      >
                        <Text style={[
                          styles.presetName,
                          currentPreset === preset.id && styles.presetNameActive
                        ]}>
                          {preset.name}
                        </Text>
                        <Text style={styles.presetMode}>{SOUNDSCAPES[preset.mode].name}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => deletePreset(preset.id)}
                        style={styles.deletePresetButton}
                      >
                        <X color="rgba(255,255,255,0.6)" size={16} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {presets.length === 0 && (
                    <Text style={styles.noPresetsText}>
                      No saved presets. Create your first preset by adjusting the settings and tapping &quot;Save Current&quot;.
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            

            
            {/* Adaptive Settings */}
            <TouchableOpacity
              onPress={() => setShowAdaptive(!showAdaptive)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderContent}>
                <Clock color="rgba(255,255,255,0.8)" size={20} />
                <Text style={styles.sectionHeaderText}>Adaptive Settings</Text>
                <Text style={styles.timeOfDayText}>
                  {getTimeOfDayDisplay(adaptiveSettings.timeOfDay)}
                </Text>
              </View>
              {showAdaptive ? (
                <ChevronUp color="rgba(255,255,255,0.6)" size={20} />
              ) : (
                <ChevronDown color="rgba(255,255,255,0.6)" size={20} />
              )}
            </TouchableOpacity>
            
            {showAdaptive && (
              <View style={styles.adaptiveContainer}>
                <View style={styles.adaptiveRow}>
                  <Text style={styles.adaptiveLabel}>Adapt to Time of Day</Text>
                  <Switch
                    value={adaptiveSettings.adaptToTime}
                    onValueChange={(value) => 
                      setAdaptiveSettings(prev => ({ ...prev, adaptToTime: value }))
                    }
                    trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(255,255,255,0.4)" }}
                    thumbColor={adaptiveSettings.adaptToTime ? "#fff" : "rgba(255,255,255,0.6)"}
                  />
                </View>
                
                <Text style={styles.adaptiveDescription}>
                  {adaptiveSettings.adaptToTime 
                    ? "Sound layers automatically adjust based on current time of day"
                    : "Manual control of all sound layers"}
                </Text>
              </View>
            )}
            
            {/* Advanced Sound Controls */}
            <TouchableOpacity
              onPress={() => setShowAdvanced(!showAdvanced)}
              style={styles.sectionHeader}
            >
              <View style={styles.sectionHeaderContent}>
                <Settings color="rgba(255,255,255,0.8)" size={20} />
                <Text style={styles.sectionHeaderText}>Sound Layers</Text>
              </View>
              {showAdvanced ? (
                <ChevronUp color="rgba(255,255,255,0.6)" size={20} />
              ) : (
                <ChevronDown color="rgba(255,255,255,0.6)" size={20} />
              )}
            </TouchableOpacity>
            
            {showAdvanced && (
              <ScrollView style={styles.advancedContainer} nestedScrollEnabled>
                {/* Noise Type Selection */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Noise Type</Text>
                  <View style={styles.noiseTypeContainer}>
                    {noiseTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setNoiseType(type)}
                        style={[
                          styles.noiseTypeOption,
                          noiseType === type && styles.noiseTypeOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.noiseTypeText,
                            noiseType === type && styles.noiseTypeTextActive,
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Binaural Frequency */}
                <View style={styles.controlGroup}>
                  <Text style={styles.controlLabel}>Binaural Beat Frequency: {binauralFreq}Hz</Text>
                  <CustomSlider
                    style={styles.frequencySlider}
                    minimumValue={1}
                    maximumValue={100}
                    value={binauralFreq}
                    onValueChange={setBinauralFreq}
                    step={1}
                    minimumTrackTintColor="rgba(255,255,255,0.8)"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                    thumbTintColor="#fff"
                  />
                  <Text style={styles.frequencyDescription}>
                    {binauralFreq < 8 ? 'Delta (Deep Sleep)' :
                     binauralFreq < 13 ? 'Theta (Meditation)' :
                     binauralFreq < 30 ? 'Alpha (Relaxation)' :
                     binauralFreq < 100 ? 'Beta (Focus)' : 'Gamma (High Focus)'}
                  </Text>
                </View>
                
                {/* Sound Layers */}
                <Text style={styles.layersTitle}>Sound Layers</Text>
                {adaptiveSettings.layers.map((layer) => (
                  <View key={layer.id} style={styles.layerContainer}>
                    <View style={styles.layerHeader}>
                      <View style={styles.layerInfo}>
                        {getLayerIcon(layer.type)}
                        <Text style={styles.layerName}>{getLayerName(layer.type)}</Text>
                      </View>
                      <Switch
                        value={layer.enabled}
                        onValueChange={(enabled) => updateLayer(layer.id, { enabled })}
                        trackColor={{ false: "rgba(255,255,255,0.2)", true: "rgba(255,255,255,0.4)" }}
                        thumbColor={layer.enabled ? "#fff" : "rgba(255,255,255,0.6)"}
                      />
                    </View>
                    
                    {layer.enabled && (
                      <View style={styles.layerControls}>
                        <Text style={styles.layerVolumeLabel}>Volume: {Math.round(layer.volume * 100)}%</Text>
                        <CustomSlider
                          style={styles.layerSlider}
                          minimumValue={0}
                          maximumValue={1}
                          value={layer.volume}
                          onValueChange={(volume) => updateLayer(layer.id, { volume })}
                          minimumTrackTintColor="rgba(255,255,255,0.6)"
                          maximumTrackTintColor="rgba(255,255,255,0.2)"
                          thumbTintColor="rgba(255,255,255,0.8)"
                        />
                        
                        {layer.frequency && (
                          <>
                            <Text style={styles.layerVolumeLabel}>Frequency: {layer.frequency}Hz</Text>
                            <CustomSlider
                              style={styles.layerSlider}
                              minimumValue={layer.type === 'pulse' ? 30 : 1}
                              maximumValue={layer.type === 'pulse' ? 120 : 100}
                              value={layer.frequency}
                              onValueChange={(frequency) => updateLayer(layer.id, { frequency })}
                              step={1}
                              minimumTrackTintColor="rgba(255,255,255,0.6)"
                              maximumTrackTintColor="rgba(255,255,255,0.2)"
                              thumbTintColor="rgba(255,255,255,0.8)"
                            />
                          </>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>
        
        {/* Save Preset Modal */}
        {showSavePreset && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Preset</Text>
              <Text style={styles.modalDescription}>
                Give your current sound configuration a name
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Preset Name</Text>
                <View style={styles.textInputWrapper}>
                  <Text 
                    style={styles.textInput}
                    onPress={() => {
                      // In a real app, you'd use TextInput here
                      const name = `Preset ${presets.length + 1}`;
                      setPresetName(name);
                    }}
                  >
                    {presetName || 'Tap to enter name'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowSavePreset(false);
                    setPresetName('');
                  }}
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    const name = presetName || `Preset ${presets.length + 1}`;
                    savePreset(name);
                    setShowSavePreset(false);
                    setPresetName('');
                  }}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                >
                  <Text style={styles.modalButtonTextPrimary}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  visualizer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 20,
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  breathingCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  centerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    alignItems: "center",
    marginBottom: 32,
  },
  modeName: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 8,
  },
  timerContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  timerContent: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  timer: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.9)",
  },
  timerTotal: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  controls: {
    paddingBottom: 16,
  },
  playButton: {
    alignSelf: "center",
    marginBottom: 32,
  },
  playButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 16,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  volumeText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    minWidth: 40,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  durationLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  durationOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  durationOptionActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  durationOptionText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  durationOptionTextActive: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  breathingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 12,
    borderRadius: 16,
  },
  breathingButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  sliderLabelContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sliderLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  sliderDescription: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  currentPresetText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginLeft: "auto",
    marginRight: 8,
  },
  presetsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  presetActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  presetActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  presetActionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "500" as const,
  },
  presetsList: {
    maxHeight: 200,
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  presetButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  presetName: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  presetNameActive: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  presetMode: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  deletePresetButton: {
    padding: 8,
    marginLeft: 8,
  },
  noPresetsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    padding: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 280,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginBottom: 8,
  },
  textInputWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  textInput: {
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalButtonPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  modalButtonTextSecondary: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500" as const,
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionHeaderText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  timeOfDayText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginLeft: "auto",
    marginRight: 8,
  },
  adaptiveContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  adaptiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  adaptiveLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  adaptiveDescription: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
  advancedContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxHeight: 300,
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 8,
  },
  noiseTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  noiseTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  noiseTypeOptionActive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  noiseTypeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  noiseTypeTextActive: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  frequencySlider: {
    height: 40,
    marginVertical: 8,
  },
  frequencyDescription: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontStyle: "italic" as const,
  },
  layersTitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  layerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  layerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  layerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  layerName: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginLeft: 8,
  },
  layerControls: {
    marginTop: 12,
  },
  layerVolumeLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginBottom: 4,
  },
  layerSlider: {
    height: 30,
    marginBottom: 8,
  },
});