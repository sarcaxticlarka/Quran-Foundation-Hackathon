import React from 'react';
import { Text, StyleSheet, TextStyle, View } from 'react-native';
import { Colors } from '../../theme/colors';

interface ArabicTextProps {
  text: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | 'display';
  color?: string;
  style?: TextStyle;
  centered?: boolean;
  withBasmala?: boolean;
}

const SIZE_MAP = {
  sm: 20,
  base: 26,
  lg: 32,
  xl: 42,
  display: 52,
};

export function ArabicText({
  text,
  size = 'lg',
  color = Colors.textPrimary,
  style,
  centered = true,
  withBasmala = false,
}: ArabicTextProps) {
  const fontSize = SIZE_MAP[size];
  const lineHeight = fontSize * 2.2;

  return (
    <View>
      {withBasmala && (
        <Text
          style={[
            styles.arabic,
            {
              fontSize: SIZE_MAP['sm'],
              lineHeight: SIZE_MAP['sm'] * 2,
              color: Colors.goldLight,
              textAlign: 'center',
              marginBottom: 8,
            },
          ]}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
      )}
      <Text
        style={[
          styles.arabic,
          {
            fontSize,
            lineHeight,
            color,
            textAlign: centered ? 'center' : 'right',
          },
          style,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  arabic: {
    fontFamily: 'System',
    writingDirection: 'rtl',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
});
