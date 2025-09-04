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
import { ArrowLeft, Bell, Moon, Smartphone, Info } from "lucide-react-native";
import { router } from "expo-router";
import { useSound } from "@/providers/SoundProvider";
import { COLORS } from "@/constants/colors";

export default function SettingsScreen() {
  const { 
    notifications, 
    setNotifications,
    darkMode,
    setDarkMode,
    keepScreenOn,
    setKeepScreenOn
  } = useSound();

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
});