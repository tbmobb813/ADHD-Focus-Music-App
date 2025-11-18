import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Home, Play, Settings } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SoundProvider } from "@/providers/SoundProvider";
import { COLORS } from "@/constants/colors";
import { Onboarding } from "@/components/Onboarding";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background.primary,
          borderTopColor: "rgba(255, 255, 255, 0.1)",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: COLORS.accent.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: "Session",
          tabBarIcon: ({ color, size }) => (
            <Play color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('onboarding_completed');
      setShowOnboarding(hasCompletedOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setShowOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setShowOnboarding(false);
      SplashScreen.hideAsync();
    } catch (error) {
      console.error('Error saving onboarding:', error);
      setShowOnboarding(false);
    }
  };

  useEffect(() => {
    if (showOnboarding === false) {
      SplashScreen.hideAsync();
    }
  }, [showOnboarding]);

  // Wait until we know whether to show onboarding
  if (showOnboarding === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SoundProvider>
          {showOnboarding ? (
            <Onboarding onComplete={completeOnboarding} />
          ) : (
            <RootLayoutNav />
          )}
        </SoundProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}