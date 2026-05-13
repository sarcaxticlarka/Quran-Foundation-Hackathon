import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/colors';
import Svg, { Circle } from 'react-native-svg';

interface Ring {
  label: string;
  value: number; // 0–100
  color: string;
}

interface GrowthRingsProps {
  rings: Ring[];
  size?: number;
}

export function GrowthRings({ rings, size = 160 }: GrowthRingsProps) {
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 6;
  const numRings = rings.length;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {rings.map((ring, i) => {
          const ringIndex = numRings - 1 - i;
          const radius = center - strokeWidth / 2 - ringIndex * (strokeWidth + gap);
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference * (1 - ring.value / 100);

          return (
            <React.Fragment key={i}>
              {/* Track */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={`${ring.color}22`}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress */}
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${center}, ${center}`}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Center label */}
      <View style={styles.centerLabel}>
        <Text style={styles.centerPercent}>
          {Math.round(rings.reduce((a, r) => a + r.value, 0) / rings.length)}%
        </Text>
        <Text style={styles.centerText}>Growth</Text>
      </View>

      {/* Legend */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerPercent: {
    fontFamily: 'Raleway_700Bold',
    color: Colors.gold,
    fontSize: 22,
  },
  centerText: {
    fontFamily: 'Raleway_400Regular',
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
