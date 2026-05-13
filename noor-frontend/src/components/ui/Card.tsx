import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'bordered' | 'gold' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, style, variant = 'default', padding = 'md' }: CardProps) {
  return (
    <View style={[styles.card, styles[variant], styles[`padding_${padding}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
  default: {
    backgroundColor: Colors.darkBg2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    backgroundColor: Colors.darkBg3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  bordered: {
    backgroundColor: Colors.darkBg2,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  gold: {
    backgroundColor: Colors.darkBg3,
    borderWidth: 1,
    borderColor: 'rgba(201,164,86,0.35)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glass: {
    backgroundColor: 'rgba(15,42,24,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(201,164,86,0.15)',
  },
  padding_none: { padding: 0 },
  padding_sm:   { padding: 12 },
  padding_md:   { padding: 16 },
  padding_lg:   { padding: 24 },
});
