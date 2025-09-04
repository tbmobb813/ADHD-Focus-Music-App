import React from "react";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
export const STORYLINES = {
  deepWork: {
    name: "Deep Work",
    icon: <Feather name="target" color="#fff" size={28} />,
  },
  readPower: {
    name: "Read Power",
    icon: <Feather name="book-open" color="#fff" size={28} />,
    gradient: ["#f093fb", "#f5576c"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: "30-120 min",
    category: "learning",
  },
  powerNap: {
    name: "Power Nap",
    icon: <Feather name="moon" color="#fff" size={28} />,
    gradient: ["#4facfe", "#00f2fe"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  stressCreate: {
    name: "Stress Create",
    icon: <Feather name="moon" color="#fff" size={28} />,
    gradient: ["#4facfe", "#00f2fe"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  morningBoost: {
    name: "Morning Boost",
    icon: <MaterialCommunityIcons name="coffee" color="#fff" size={28} />,
    gradient: ["#30cfd0", "#330867"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  },
  anxietyShield: {
    name: "Anxiety Shield",
    icon: <MaterialCommunityIcons name="shield" color="#fff" size={28} />,
    gradient: ["#a8edea", "#fed6e3"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    duration: "15-60 min",
  },
  focusAudio: {
    name: "Focus Audio",
    icon: <Feather name="headphones" color="#fff" size={28} />,
    gradient: ["#667eea", "#764ba2"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    duration: "30-120 min",
    category: "communication",
  },
  energyZap: {
    name: "Energy Zap",
    icon: <Feather name="zap" color="#fff" size={28} />,
    gradient: ["#fa709a", "#fee140"] as const,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    duration: "10-30 min",
    category: "energy",
  },
};