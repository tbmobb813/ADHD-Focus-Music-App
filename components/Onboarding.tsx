import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Music, Timer, TrendingUp, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: () => void;
}

const onboardingScreens = [
  {
    icon: <Brain color="#fff" size={64} />,
    title: 'Welcome to Mindscape',
    description: 'Adaptive soundscapes designed specifically for ADHD, focus, and mental wellness. Let us guide you to better concentration and relaxation.',
    gradient: [COLORS.background.primary, '#4a1d96'],
  },
  {
    icon: <Music color="#fff" size={64} />,
    title: 'Generative Audio',
    description: 'Our Web Audio engine creates unique, procedurally-generated soundscapes in real-time. Each session is a one-of-a-kind experience tailored to your needs.',
    gradient: ['#1e3a8a', '#4338ca'],
  },
  {
    icon: <Timer color="#fff" size={64} />,
    title: 'Pomodoro & Sessions',
    description: 'Built-in Pomodoro timer with customizable work/break cycles. Track your sessions, build streaks, and watch your focus improve over time.',
    gradient: ['#7e22ce', '#a855f7'],
  },
  {
    icon: <TrendingUp color="#fff" size={64} />,
    title: 'Smart Recommendations',
    description: 'Our AI analyzes your session history to provide personalized mode, duration, and time-of-day suggestions for optimal productivity.',
    gradient: ['#0891b2', '#06b6d4'],
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);
      scrollViewRef.current?.scrollTo({ x: width * nextScreen, animated: true });
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  const screen = onboardingScreens[currentScreen];

  return (
    <View style={styles.container}>
      <LinearGradient colors={screen.gradient} style={styles.gradient}>
        {/* Skip button */}
        {currentScreen < onboardingScreens.length - 1 && (
          <TouchableOpacity onPress={skip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>{screen.icon}</View>

          {/* Title */}
          <Text style={styles.title}>{screen.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{screen.description}</Text>
        </Animated.View>

        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {onboardingScreens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                currentScreen === index && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started button */}
        <TouchableOpacity onPress={goToNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentScreen === onboardingScreens.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentScreen < onboardingScreens.length - 1 && (
            <ChevronRight color="#fff" size={20} />
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    marginBottom: 40,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width - 80,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 60,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
