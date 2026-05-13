import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

type BadgeVariant = 'gold' | 'teal' | 'coral' | 'purple' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  dot?: boolean;
}

export function Badge({ label, variant = 'teal', style, dot = false }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      {dot && <View style={[styles.dot, styles[`dot_${variant}`]]} />}
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 5,
  },
  gold:   { backgroundColor: 'rgba(201,164,86,0.15)', borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)' },
  teal:   { backgroundColor: 'rgba(42,122,58,0.2)',   borderWidth: 1, borderColor: 'rgba(42,122,58,0.4)'  },
  coral:  { backgroundColor: 'rgba(208,82,40,0.15)',  borderWidth: 1, borderColor: 'rgba(208,82,40,0.3)'  },
  purple: { backgroundColor: 'rgba(123,104,200,0.15)',borderWidth: 1, borderColor: 'rgba(123,104,200,0.3)'},
  muted:  { backgroundColor: 'rgba(240,232,208,0.08)',borderWidth: 1, borderColor: 'rgba(240,232,208,0.15)'},

  dot: { width: 5, height: 5, borderRadius: 3 },
  dot_gold:   { backgroundColor: Colors.gold },
  dot_teal:   { backgroundColor: Colors.tealLight },
  dot_coral:  { backgroundColor: Colors.coral },
  dot_purple: { backgroundColor: Colors.purple },
  dot_muted:  { backgroundColor: Colors.textMuted },

  text: { fontSize: 10, fontFamily: 'Raleway_700Bold', letterSpacing: 0.5 },
  text_gold:   { color: Colors.gold },
  text_teal:   { color: Colors.tealLight },
  text_coral:  { color: Colors.coralLight },
  text_purple: { color: Colors.purpleLight },
  text_muted:  { color: Colors.textSecondary },
});
