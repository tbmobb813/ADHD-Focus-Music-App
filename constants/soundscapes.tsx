import React from "react";
import { Brain, Moon, Zap, Heart, TreePine, Waves } from "lucide-react-native";

export const SOUNDSCAPES = {
  focus: {
    name: "Focus",
    description: "Enhance concentration and productivity",
    gradient: ["#667eea", "#764ba2"] as const,
    icon: <Brain color="#fff" size={28} />,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  relax: {
    name: "Relax",
    description: "Calm your mind and reduce stress",
    gradient: ["#f093fb", "#f5576c"] as const,
    icon: <Heart color="#fff" size={28} />,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  sleep: {
    name: "Sleep",
    description: "Drift into peaceful, restorative sleep",
    gradient: ["#4facfe", "#00f2fe"] as const,
    icon: <Moon color="#fff" size={28} />,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  energy: {
    name: "Energy",
    description: "Boost motivation and alertness",
    gradient: ["#fa709a", "#fee140"] as const,
    icon: <Zap color="#fff" size={28} />,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  nature: {
    name: "Nature",
    description: "Connect with calming natural sounds",
    gradient: ["#30cfd0", "#330867"] as const,
    icon: <TreePine color="#fff" size={28} />,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  flow: {
    name: "Flow",
    description: "Enter a state of effortless focus",
    gradient: ["#a8edea", "#fed6e3"] as const,
    icon: <Waves color="#fff" size={28} />,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
};