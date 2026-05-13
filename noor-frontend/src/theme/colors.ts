// Dark forest-green + gold palette — matches the Noor landing screen
export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────
  darkBg:     '#0B2214',   // deep forest green — main page bg
  darkBg2:    '#0F2A18',   // card surface
  darkBg3:    '#142E1C',   // elevated card / sub-surface
  darkCard:   '#0F2A18',   // same as darkBg2 for Card component
  darkBorder: 'rgba(201,164,86,0.18)',  // subtle gold border

  // ── Gold accent ───────────────────────────────────────────
  gold:       '#C9A456',
  goldLight:  '#DDB96A',
  goldDim:    '#8A6A2A',
  goldMuted:  'rgba(201,164,86,0.10)',

  // ── Green accent ──────────────────────────────────────────
  teal:       '#2A7A3A',   // bright green CTA
  tealLight:  '#3A9A4A',
  tealDim:    '#1A4A24',

  // ── Text ──────────────────────────────────────────────────
  textPrimary:   '#F0E8D0',              // warm cream headings
  textSecondary: '#D4C8A8',             // secondary body
  textMuted:     'rgba(240,232,208,0.5)', // captions
  inkMuted:      'rgba(240,232,208,0.35)',

  // ── Semantic ──────────────────────────────────────────────
  coral:       '#D05228',
  coralLight:  '#E8734A',
  purple:      '#7B68C8',
  purpleLight: '#9B8CE8',
  blue:        '#4A8FD4',
  blueLight:   '#6AAFF4',
  amber:       '#C9A456',

  // ── State ─────────────────────────────────────────────────
  error:        '#E05555',
  errorLight:   '#F08080',
  success:      '#3A9A4A',
  successLight: '#5ABA6A',
  warning:      '#C9A456',
  warningLight: '#E0B870',
  info:         '#4A8FD4',

  // ── Utility ───────────────────────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // ── Tab bar ───────────────────────────────────────────────
  tabActive:   '#C9A456',
  tabInactive: 'rgba(240,232,208,0.35)',
};

export type ColorKey = keyof typeof Colors;
