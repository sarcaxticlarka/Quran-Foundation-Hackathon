import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface LanternGlowProps {
  intensity: number; // 0–1
  size?: number;
  showLabel?: boolean;
}

export function LanternGlow({ intensity, size = 120, showLabel = true }: LanternGlowProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(intensity)).current;

  useEffect(() => {
    Animated.timing(glow, {
      toValue: intensity,
      duration: 800,
      useNativeDriver: false,
    }).start();

    if (intensity > 0.5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 1500, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [intensity]);

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.85],
  });

  const center = size / 2;
  const r = center * 0.38;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: glowOpacity,
            transform: [{ scale: pulse }],
          },
        ]}
      />

      {/* SVG Lantern */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="lanternGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.goldLight} stopOpacity={intensity} />
            <Stop offset="60%" stopColor={Colors.gold} stopOpacity={intensity * 0.6} />
            <Stop offset="100%" stopColor={Colors.goldDim} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={center} cy={center} r={r} fill="url(#lanternGrad)" />
      </Svg>

      {/* Core flame */}
      <View style={[styles.core, { opacity: 0.6 + intensity * 0.4 }]}>
        <Text style={{ fontSize: size * 0.22 }}>🕯️</Text>
      </View>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{Math.round(intensity * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: Colors.goldDim,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 8,
  },
  label: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
});
