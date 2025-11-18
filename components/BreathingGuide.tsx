import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@/constants/colors';

interface BreathingGuideProps {
  isActive: boolean;
  cycleDuration?: number; // in seconds, default 8 (4 in, 4 out)
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({
  isActive,
  cycleDuration = 8
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const phaseRef = useRef<'in' | 'out'>('in');

  useEffect(() => {
    if (!isActive) {
      // Reset to initial state when inactive
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0.3);
      phaseRef.current = 'in';
      return;
    }

    const halfCycle = (cycleDuration * 1000) / 2;

    const breatheIn = () => {
      phaseRef.current = 'in';
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: halfCycle,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: halfCycle,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isActive) breatheOut();
      });
    };

    const breatheOut = () => {
      phaseRef.current = 'out';
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: halfCycle,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: halfCycle,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isActive) breatheIn();
      });
    };

    // Start the breathing cycle
    breatheIn();

    return () => {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [isActive, cycleDuration, scaleAnim, opacityAnim]);

  if (!isActive) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.innerCircle} />
      </Animated.View>

      <Animated.Text
        style={[
          styles.text,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        {phaseRef.current === 'in' ? 'Breathe In' : 'Breathe Out'}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 20,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  text: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 160,
  },
});
