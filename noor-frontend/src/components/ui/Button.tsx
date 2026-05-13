import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'gold' ? Colors.darkBg : Colors.white} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: Colors.gold,
  },
  secondary: {
    backgroundColor: Colors.darkBg2,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  gold: {
    backgroundColor: Colors.gold,
  },

  // Sizes
  size_sm: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  size_md: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  size_lg: { paddingHorizontal: 32, paddingVertical: 18, borderRadius: 16 },

  // Text
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.textPrimary },
  text_ghost: { color: Colors.textSecondary },
  text_danger: { color: Colors.white },
  text_gold: { color: Colors.darkBg },

  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 17 },
});
