import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  PanResponder,
  Animated,
  StyleSheet,
  ViewStyle,
  PanResponderInstance,
} from 'react-native';

interface CustomSliderProps {
  style?: ViewStyle;
  minimumValue?: number;
  maximumValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  step?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  disabled?: boolean;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  style,
  minimumValue = 0,
  maximumValue = 1,
  value = 0,
  onValueChange,
  step,
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#C7C7CC',
  thumbTintColor = '#FFFFFF',
  disabled = false,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [, setIsDragging] = useState(false);
  const thumbPosition = useRef(new Animated.Value(0)).current;
  const panResponder = useRef<PanResponderInstance | null>(null);

  const getValueFromPosition = useCallback(
    (position: number) => {
      const ratio = Math.max(0, Math.min(1, position / (sliderWidth - 20)));
      let newValue = minimumValue + ratio * (maximumValue - minimumValue);
      
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }
      
      return Math.max(minimumValue, Math.min(maximumValue, newValue));
    },
    [sliderWidth, minimumValue, maximumValue, step]
  );

  const getPositionFromValue = useCallback(
    (val: number) => {
      const ratio = (val - minimumValue) / (maximumValue - minimumValue);
      return ratio * (sliderWidth - 20);
    },
    [sliderWidth, minimumValue, maximumValue]
  );

  React.useEffect(() => {
    if (sliderWidth > 0) {
      const position = getPositionFromValue(value);
      thumbPosition.setValue(position);
    }
  }, [value, sliderWidth, getPositionFromValue, thumbPosition]);

  React.useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(sliderWidth - 20, gestureState.dx + getPositionFromValue(value))
        );
        thumbPosition.setValue(newPosition);
        
        const newValue = getValueFromPosition(newPosition);
        onValueChange?.(newValue);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
    });
  }, [disabled, sliderWidth, value, getPositionFromValue, getValueFromPosition, onValueChange, thumbPosition]);

  const currentRatio = (value - minimumValue) / (maximumValue - minimumValue);

  return (
    <View
      style={[styles.container, style]}
      onLayout={(event) => {
        setSliderWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.track}>
        <View
          style={[
            styles.minimumTrack,
            {
              backgroundColor: minimumTrackTintColor,
              width: `${currentRatio * 100}%`,
            },
          ]}
        />
        <View
          style={[
            styles.maximumTrack,
            {
              backgroundColor: maximumTrackTintColor,
              width: `${(1 - currentRatio) * 100}%`,
            },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            transform: [{ translateX: thumbPosition }],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        {...(panResponder.current?.panHandlers || {})}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  minimumTrack: {
    height: 4,
    borderRadius: 2,
  },
  maximumTrack: {
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default CustomSlider;