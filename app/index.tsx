import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useSound } from "@/providers/SoundProvider";
import { SOUNDSCAPES } from "@/constants/soundscapes";
import { STORYLINES } from "@/constants/storylines";
import { COLORS } from "@/constants/colors";

type ContentType = 'soundscapes' | 'storylines';

interface ModeTabProps {
  mode: typeof SOUNDSCAPES[keyof typeof SOUNDSCAPES] | typeof STORYLINES[keyof typeof STORYLINES];
  onPress: () => void;
  isActive: boolean;
}

interface TopTabProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TopTab = React.memo(function TopTab({ title, isActive, onPress }: TopTabProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.topTab, isActive && styles.activeTopTab]}
    >
      <Text style={[styles.topTabText, isActive && styles.activeTopTabText]}>
        {title}
      </Text>
      {isActive && <View style={styles.topTabIndicator} />}
    </TouchableOpacity>
  );
});

const ModeTab = React.memo(function ModeTab({ mode, onPress, isActive }: ModeTabProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.05 : 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scaleAnim, opacityAnim]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.05 : 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.tabContainer}
    >
      <Animated.View
        style={[
          styles.tab,
          isActive && styles.activeTab,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <LinearGradient
          colors={
            isActive && "gradient" in mode
              ? mode.gradient
              : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
          }
          style={styles.tabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.tabContent}>
            <View style={[styles.tabIconContainer, isActive && styles.activeTabIconContainer]}>
            {React.isValidElement(mode.icon)
                ? React.cloneElement(mode.icon as React.ReactElement<any>, {
                        ...(mode.icon.props || {}),
                        // Use 'color' prop if supported, otherwise fallback to 'sx'
                        color: isActive ? '#fff' : COLORS.text.secondary,
                        sx: [
                            typeof mode.icon.props === 'object' && mode.icon.props !== null && 'style' in mode.icon.props
                              ? (mode.icon.props.style as any)
                              : {},
                            { fontSize: 20 }
                        ]
                    })
                : mode.icon}
            </View>
            <Text style={[styles.tabTitle, isActive && styles.activeTabTitle]}>
              {mode.name}
            </Text>
            {isActive && <View style={styles.activeTabIndicator} />}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const { currentMode, setCurrentMode, isPlaying, adaptiveSettings } = useSound();
  const [activeContent, setActiveContent] = useState<ContentType>('soundscapes');
  const [currentStoryline, setCurrentStoryline] = useState<keyof typeof STORYLINES | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  const handleModeSelect = (modeKey: keyof typeof SOUNDSCAPES) => {
    setCurrentMode(modeKey);
    setCurrentStoryline(null);
  };

  const handleStorylineSelect = (storylineKey: keyof typeof STORYLINES) => {
    setCurrentStoryline(storylineKey);
    setCurrentMode(null);
  };

  const handleContentTypeChange = (contentType: ContentType) => {
    setActiveContent(contentType);
    if (contentType === 'soundscapes') {
      setCurrentStoryline(null);
    } else {
      setCurrentMode(null);
    }
  };

  const getCurrentData = () => {
    if (activeContent === 'soundscapes') {
      return { 
        data: SOUNDSCAPES, 
        current: currentMode, 
        handler: handleModeSelect,
        type: 'soundscapes' as const
      };
    } else {
      return { 
        data: STORYLINES, 
        current: currentStoryline, 
        handler: handleStorylineSelect,
        type: 'storylines' as const
      };
    }
  };

  const { data, current, type } = getCurrentData();
  const currentItem = current && type === 'soundscapes' ? SOUNDSCAPES[current] : 
                     current && type === 'storylines' ? STORYLINES[current] : null;



  return (
    <LinearGradient
      colors={[COLORS.background.primary, COLORS.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.title}>
                Choose your {activeContent === 'soundscapes' ? 'soundscape' : 'storyline'}
              </Text>
              {adaptiveSettings.adaptToTime && (
                <Text style={styles.timeOfDay}>
                  {adaptiveSettings.timeOfDay === 'morning' && '🌅 Morning Mode'}
                  {adaptiveSettings.timeOfDay === 'afternoon' && '☀️ Afternoon Mode'}
                  {adaptiveSettings.timeOfDay === 'evening' && '🌆 Evening Mode'}
                  {adaptiveSettings.timeOfDay === 'night' && '🌙 Night Mode'}
                </Text>
              )}
            </View>
          </View>

          {/* Top Content Type Tabs */}
          <View style={styles.topTabsContainer}>
            <TopTab
              title="Soundscapes"
              isActive={activeContent === 'soundscapes'}
              onPress={() => handleContentTypeChange('soundscapes')}
            />
            <TopTab
              title="Storylines"
              isActive={activeContent === 'storylines'}
              onPress={() => handleContentTypeChange('storylines')}
            />
          </View>

          {/* Horizontal Mode Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            style={styles.tabsContainer}
          >
            {Object.entries(data).map(([key, mode]) => (
              <ModeTab
                key={key}
                mode={mode}
                onPress={() => {
                  if (type === 'soundscapes') {
                    handleModeSelect(key as keyof typeof SOUNDSCAPES);
                  } else {
                    handleStorylineSelect(key as keyof typeof STORYLINES);
                  }
                }}
                isActive={current === key}
              />
            ))}
          </ScrollView>

          {/* Main Content Area */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.mainContent}
          >
            {currentItem ? (
              <View style={styles.selectedModeContent}>
                <LinearGradient
                  colors={
                    "gradient" in currentItem
                      ? currentItem.gradient
                      : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                  }
                  style={styles.selectedModeCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.selectedModeHeader}>
                    <View style={styles.selectedModeIconContainer}>
                      {currentItem.icon}
                    </View>
                    <View style={styles.selectedModeInfo}>
                      <Text style={styles.selectedModeTitle}>
                        {currentItem.name}
                      </Text>
                      <Text style={styles.selectedModeDescription}>
                        {"description" in currentItem ? currentItem.description : ""}
                      </Text>
                      {activeContent === 'storylines' && 'duration' in currentItem && (
                        <Text style={styles.durationText}>
                          Duration: {(currentItem as any).duration}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickActionButton}>
                      <Text style={styles.quickActionText}>Quick Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                      <Text style={styles.quickActionText}>Customize</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                <View style={styles.featuresSection}>
                  <Text style={styles.sectionTitle}>
                    {activeContent === 'soundscapes' ? 'Features' : 'Benefits'}
                  </Text>
                  <View style={styles.featuresList}>
                    {activeContent === 'soundscapes' ? (
                      <>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Adaptive soundscapes</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Binaural beats</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Custom presets</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Session timer</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Scientifically designed</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Activity-specific optimization</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Adaptive intensity</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <View style={styles.featureDot} />
                          <Text style={styles.featureText}>Progress tracking</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.recentSessions}>
                  <Text style={styles.sectionTitle}>Recent Sessions</Text>
                  <Text style={styles.comingSoonText}>Coming soon...</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noSelectionContent}>
                <Text style={styles.noSelectionTitle}>
                  Select a {activeContent === 'soundscapes' ? 'soundscape' : 'storyline'} above
                </Text>
                <Text style={styles.noSelectionSubtitle}>
                  {activeContent === 'soundscapes' 
                    ? 'Choose from Focus, Relax, Sleep, Energy, Nature, or Flow modes'
                    : 'Choose from Deep Work, Read Power, Power Nap, Stress Create, and more'
                  }
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
  },
  timeOfDay: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
    opacity: 0.8,
  },

  // Top Tabs Styles
  topTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  activeTopTab: {
    // Active styles handled by indicator
  },
  topTabText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.text.secondary,
  },
  activeTopTabText: {
    color: COLORS.text.primary,
    fontWeight: '600' as const,
  },
  topTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: COLORS.text.primary,
    borderRadius: 1,
  },

  // Horizontal Tabs Styles
  tabsContainer: {
    maxHeight: 80,
    marginBottom: 20,
  },
  tabsScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 12,
  },
  tabContainer: {
    minWidth: 100,
  },
  tab: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTab: {
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tabGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeTabIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  activeTabTitle: {
    color: "#fff",
    fontWeight: "600" as const,
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -8,
    width: 20,
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },

  // Main Content Styles
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  selectedModeContent: {
    paddingHorizontal: 24,
    gap: 24,
  },
  selectedModeCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  selectedModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  selectedModeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  selectedModeInfo: {
    flex: 1,
  },
  selectedModeTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  selectedModeDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  quickActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  featuresSection: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.text.secondary,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  recentSessions: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: "italic",
    opacity: 0.7,
  },
  noSelectionContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  noSelectionTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  noSelectionSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    opacity: 0.8,
  },
  durationText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    fontStyle: "italic" as const,
  },
});