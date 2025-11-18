import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '@/constants/colors';

const { width } = Dimensions.get('window');
const BAR_COUNT = 32;
const BAR_WIDTH = (width - 80) / BAR_COUNT;
const MAX_HEIGHT = 100;

interface AudioVisualizerProps {
  isActive: boolean;
  intensity?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isActive,
  intensity = 0.5,
}) => {
  const barAnimations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;

  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      startVisualization();
    } else {
      stopVisualization();
    }

    return () => stopVisualization();
  }, [isActive, intensity]);

  const startVisualization = () => {
    const animate = () => {
      // Simulate frequency data with sine waves for smooth animation
      // In a real implementation, this would come from AnalyserNode.getByteFrequencyData()
      barAnimations.forEach((anim, index) => {
        const baseFreq = 0.05 + (index / BAR_COUNT) * 0.1;
        const time = Date.now() / 1000;

        // Create wave patterns with different frequencies
        const wave1 = Math.sin(time * baseFreq * 2 + index * 0.2);
        const wave2 = Math.sin(time * baseFreq * 3 - index * 0.15);
        const wave3 = Math.sin(time * baseFreq * 5 + index * 0.3);

        // Combine waves for complex motion
        const combined = (wave1 + wave2 * 0.5 + wave3 * 0.3) / 2.8;

        // Apply intensity multiplier
        const targetValue = (Math.abs(combined) * intensity) + 0.1;

        Animated.spring(anim, {
          toValue: targetValue,
          friction: 8,
          tension: 40,
          useNativeDriver: false,
        }).start();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Animate all bars down
    barAnimations.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 0.1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {barAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, MAX_HEIGHT],
                }),
                width: BAR_WIDTH - 2,
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.9],
                }),
                backgroundColor: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [
                    COLORS.accent.primary,
                    COLORS.accent.secondary,
                    '#ffffff',
                  ],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: MAX_HEIGHT,
    gap: 2,
  },
  bar: {
    borderRadius: 2,
  },
});
