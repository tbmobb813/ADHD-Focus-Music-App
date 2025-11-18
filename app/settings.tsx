import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Bell, Moon, Smartphone, Info, Clock, Target, TrendingUp, Award, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import { useSound } from "@/providers/SoundProvider";
import { COLORS } from "@/constants/colors";
import { Alert } from "react-native";

export default function SettingsScreen() {
  const {
    notifications,
    setNotifications,
    darkMode,
    setDarkMode,
    keepScreenOn,
    setKeepScreenOn,
    sessionHistory,
    sessionStats,
    clearSessionHistory,
  } = useSound();

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Session History",
      "Are you sure you want to delete all session history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearSessionHistory,
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <LinearGradient
      colors={[COLORS.background.primary, COLORS.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={COLORS.text.primary} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Bell color={COLORS.text.secondary} size={20} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ 
                  false: "rgba(255, 255, 255, 0.2)", 
                  true: COLORS.accent.primary 
                }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Moon color={COLORS.text.secondary} size={20} />
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ 
                  false: "rgba(255, 255, 255, 0.2)", 
                  true: COLORS.accent.primary 
                }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Smartphone color={COLORS.text.secondary} size={20} />
                <Text style={styles.settingLabel}>Keep Screen On</Text>
              </View>
              <Switch
                value={keepScreenOn}
                onValueChange={setKeepScreenOn}
                trackColor={{ 
                  false: "rgba(255, 255, 255, 0.2)", 
                  true: COLORS.accent.primary 
                }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Session History</Text>
              {sessionHistory.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
                  <Trash2 color={COLORS.text.tertiary} size={16} />
                </TouchableOpacity>
              )}
            </View>

            {sessionHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock color={COLORS.text.tertiary} size={32} />
                <Text style={styles.emptyText}>No sessions yet</Text>
                <Text style={styles.emptySubtext}>
                  Start a focus session to track your progress
                </Text>
              </View>
            ) : (
              <>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Target color={COLORS.accent.primary} size={20} />
                    <Text style={styles.statValue}>{sessionStats.totalSessions}</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Clock color={COLORS.accent.secondary} size={20} />
                    <Text style={styles.statValue}>{sessionStats.totalMinutes}</Text>
                    <Text style={styles.statLabel}>Minutes</Text>
                  </View>

                  <View style={styles.statCard}>
                    <TrendingUp color="#10b981" size={20} />
                    <Text style={styles.statValue}>
                      {Math.round((sessionStats.completedSessions / sessionStats.totalSessions) * 100) || 0}%
                    </Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Award color="#f59e0b" size={20} />
                    <Text style={styles.statValue}>{sessionStats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                </View>

                {/* Recent Sessions */}
                <Text style={styles.recentTitle}>Recent Sessions</Text>
                <View style={styles.sessionsList}>
                  {sessionHistory.slice(0, 5).map((session) => (
                    <View key={session.id} style={styles.sessionItem}>
                      <View style={styles.sessionLeft}>
                        <View style={[
                          styles.sessionDot,
                          { backgroundColor: session.completed ? '#10b981' : '#6b7280' }
                        ]} />
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionMode}>
                            {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}
                            {session.presetName && (
                              <Text style={styles.sessionPreset}> • {session.presetName}</Text>
                            )}
                          </Text>
                          <Text style={styles.sessionDate}>{formatDate(session.startedAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={styles.sessionDuration}>
                          {formatDuration(session.duration)}
                        </Text>
                        <Text style={styles.sessionTarget}>
                          / {formatDuration(session.targetDuration)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Additional Stats */}
                <View style={styles.additionalStats}>
                  <View style={styles.additionalStatRow}>
                    <Text style={styles.additionalStatLabel}>Average Duration</Text>
                    <Text style={styles.additionalStatValue}>
                      {Math.round(sessionStats.averageDuration)} min
                    </Text>
                  </View>
                  <View style={styles.additionalStatRow}>
                    <Text style={styles.additionalStatLabel}>Favorite Mode</Text>
                    <Text style={styles.additionalStatValue}>
                      {sessionStats.favoriteMode.charAt(0).toUpperCase() + sessionStats.favoriteMode.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.additionalStatRow}>
                    <Text style={styles.additionalStatLabel}>Longest Streak</Text>
                    <Text style={styles.additionalStatValue}>
                      {sessionStats.longestStreak} days
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <TouchableOpacity style={styles.aboutRow}>
              <Info color={COLORS.text.secondary} size={20} />
              <View style={styles.aboutContent}>
                <Text style={styles.aboutTitle}>Mindscape</Text>
                <Text style={styles.aboutText}>
                  Adaptive soundscapes for focus, relaxation, and better mental health
                </Text>
                <Text style={styles.version}>Version 1.0.0</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for Better Focus</Text>
            <Text style={styles.tipItem}>
              • Use Focus mode during deep work sessions
            </Text>
            <Text style={styles.tipItem}>
              • Try the breathing guide to center yourself
            </Text>
            <Text style={styles.tipItem}>
              • Set a timer to maintain healthy work intervals
            </Text>
            <Text style={styles.tipItem}>
              • Adjust volume to a comfortable background level
            </Text>
          </View>
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.secondary,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  aboutRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  aboutContent: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  version: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  tips: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clearButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    marginTop: 4,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: COLORS.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.secondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sessionsList: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMode: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: COLORS.text.primary,
  },
  sessionPreset: {
    fontSize: 12,
    fontWeight: "400" as const,
    color: COLORS.text.tertiary,
  },
  sessionDate: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  sessionRight: {
    alignItems: "flex-end",
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
  sessionTarget: {
    fontSize: 12,
    color: COLORS.text.tertiary,
  },
  additionalStats: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
  },
  additionalStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  additionalStatLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.text.primary,
  },
});