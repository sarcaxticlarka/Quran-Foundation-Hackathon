export const APP_NAME = 'Noor';
export const APP_TAGLINE = 'The Spiritual Operating System';

function withHttpScheme(value: string) {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

const DEFAULT_PUBLIC_BACKEND_URL = 'https://quran-foundation-hackathon.onrender.com';

// API
export const API_BASE = withHttpScheme(process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_PUBLIC_BACKEND_URL);
export const API_TIMEOUT = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 10000);
export const BACKEND_URL = withHttpScheme(process.env.EXPO_PUBLIC_BACKEND_URL ?? DEFAULT_PUBLIC_BACKEND_URL);
export const BACKEND_API_KEY = process.env.EXPO_PUBLIC_BACKEND_API_KEY ?? '';
export const QURAN_OAUTH_ENDPOINT = process.env.EXPO_PUBLIC_QURAN_OAUTH_ENDPOINT ?? 'https://prelive-oauth2.quran.foundation';
export const QURAN_OAUTH_CLIENT_ID = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ?? '3216689e-2f59-43b1-92e5-425853fb4326';
export const QURAN_OAUTH_REDIRECT_URI = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI ?? `${BACKEND_URL}/oauth/callback`;

// Quran
export const TOTAL_SURAHS = 114;
export const TOTAL_VERSES = 6236;
export const TOTAL_JUZ = 30;

// Review / Spaced Repetition
export const SM2_DEFAULT_EASE = 2.5;
export const SM2_MIN_EASE = 1.3;
export const SM2_MAX_EASE = 4.0;
export const DAILY_REVIEW_TARGET = 20;
export const DAILY_NEW_CARDS = 5;

// Crisis Mode
export const CRISIS_MOOD_OPTIONS = [
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#D85A30' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#185FA5' },
  { id: 'angry', label: 'Angry', emoji: '😤', color: '#E53E3E' },
  { id: 'lonely', label: 'Lonely', emoji: '🌑', color: '#534AB7' },
  { id: 'lost', label: 'Lost', emoji: '🌫️', color: '#8A7D6E' },
  { id: 'grateful', label: 'Grateful', emoji: '🌟', color: '#C9A84C' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊', color: '#1D9E75' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌅', color: '#F0D98A' },
];

// Dhikr
export const DHIKR_PRESETS = [
  { arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'Subhanallah', translation: 'Glory be to Allah', count: 33 },
  { arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', translation: 'All praise is due to Allah', count: 33 },
  { arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest', count: 34 },
  { arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', transliteration: 'La ilaha illallah', translation: 'There is no god but Allah', count: 100 },
  { arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah', count: 100 },
];

// Streak milestones
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

// Halaqa
export const MAX_HALAQA_MEMBERS = 12;
export const LANTERN_GLOW_THRESHOLD = 0.7; // 70% participation

// AsyncStorage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@noor/auth_token',
  USER_PROFILE: '@noor/user_profile',
  ONBOARDING_DONE: '@noor/onboarding_done',
  STREAK_DATA: '@noor/streak_data',
  REVIEW_QUEUE: '@noor/review_queue',
  LAST_SYNC: '@noor/last_sync',
};

// Navigation
export const TAB_NAMES = {
  HOME: 'index',
  DASHBOARD: 'dashboard',
  COMMUNITY: 'community',
  EXPLORE: 'explore',
  PROFILE: 'profile',
} as const;
