import { Platform } from 'react-native';

export const FontFamilies = {
  // Arabic typography
  arabicRegular: Platform.select({
    ios: 'GeezaPro',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  arabicBold: Platform.select({
    ios: 'GeezaPro-Bold',
    android: 'sans-serif-medium',
    default: 'sans-serif-medium',
  }),

  // Latin / UI
  uiRegular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  uiMedium: Platform.select({
    ios: 'System',
    android: 'Roboto_medium',
    default: 'sans-serif-medium',
  }),
  uiBold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,

  // Arabic-specific
  arabicSm: 18,
  arabicBase: 22,
  arabicLg: 28,
  arabicXl: 36,
  arabicDisplay: 48,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.8,
  arabicNormal: 2.0,
  arabicRelaxed: 2.5,
};

export const Typography = {
  displayArabic: {
    fontSize: FontSizes.arabicDisplay,
    lineHeight: FontSizes.arabicDisplay * LineHeights.arabicRelaxed,
    fontFamily: FontFamilies.arabicBold,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  headingLarge: {
    fontSize: FontSizes['2xl'],
    lineHeight: FontSizes['2xl'] * LineHeights.tight,
    fontWeight: '700' as const,
  },
  headingMedium: {
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl * LineHeights.tight,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};
