import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Raleway_300Light,
  Raleway_400Regular,
  Raleway_600SemiBold,
} from '@expo-google-fonts/raleway';
import { signInWithQuranFoundation } from '../../src/services/quranUserAuth';
import { useAuthStore } from '../../src/stores/authStore';

const { width, height } = Dimensions.get('window');

const VERSES = [
  {
    arabic:      'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: '"Indeed, with hardship comes ease."',
    ref:         '(94:6)',
  },
  {
    arabic:      'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    translation: '"Whoever fears Allah, He will make a way out for him."',
    ref:         '(65:2)',
  },
  {
    arabic:      'فَاذْكُرُونِي أَذْكُرْكُمْ',
    translation: '"Remember Me, and I will remember you."',
    ref:         '(2:152)',
  },
  {
    arabic:      'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: '"Indeed, Allah is with the patient."',
    ref:         '(2:153)',
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const [quranLoading, setQuranLoading] = useState(false);
  const [verseIdx] = useState(() => Math.floor(Math.random() * VERSES.length));
  const verse = VERSES[verseIdx];

  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Raleway_300Light,
    Raleway_400Regular,
    Raleway_600SemiBold,
  });

  // Entrance animations
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const iconAnim  = useRef(new Animated.Value(0)).current;
  const verseAnim = useRef(new Animated.Value(0)).current;
  const btnAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.stagger(180, [
      Animated.spring(logoAnim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(iconAnim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(verseAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(btnAnim,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const fadeUp = (anim: Animated.Value, yOffset = 30) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [yOffset, 0] }) }],
  });

  const handleQuranSignIn = async () => {
    setQuranLoading(true);
    try {
      const result = await signInWithQuranFoundation();
      if (result.success) {
        const onboardingComplete = useAuthStore.getState().onboardingComplete;
        router.replace(onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
      }
    } finally {
      setQuranLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0B2214', '#0D2B18', '#122E1A', '#0A1C10']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle top radial glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Geometric pattern overlay (Islamic lattice feel) */}
      <View style={styles.patternOverlay}>
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <View
              key={`${row}-${col}`}
              style={[styles.diamondCell, {
                left: col * (width / 4.5) - 20,
                top:  row * 90 - 20,
              }]}
            />
          ))
        )}
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>

          {/* Logo word mark */}
          <Animated.View style={[styles.logoWrap, fadeUp(logoAnim, 40)]}>
            <Text style={styles.logoText}>NOOR</Text>
            <View style={styles.logoDividerRow}>
              <View style={styles.logoDivider} />
              <View style={styles.logoDiamond} />
              <View style={styles.logoDivider} />
            </View>
          </Animated.View>

          {/* Mosque icon */}
          <Animated.View style={[styles.iconWrap, fadeUp(iconAnim, 30)]}>
            <Image
              source={require('../../assets/images/mosque-icon.png')}
              style={styles.mosqueIcon}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>The Spiritual OS</Text>
          </Animated.View>

          {/* Verse card */}
          <Animated.View style={[styles.verseCard, fadeUp(verseAnim, 20)]}>
            <View style={styles.verseCardInner}>
              <Text style={styles.arabicText}>{verse.arabic}</Text>
              <View style={styles.verseDivider} />
              <Text style={styles.translationText}>{verse.translation}</Text>
              <Text style={styles.verseRef}>{verse.ref}</Text>
            </View>
          </Animated.View>

          {/* CTAs */}
          <Animated.View style={[styles.btnGroup, fadeUp(btnAnim, 16)]}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/(auth)/signup')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#C9A456', '#A07830', '#C9A456']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>Begin Your Journey</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInLink}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quranLink}
              onPress={handleQuranSignIn}
              disabled={quranLoading}
              activeOpacity={0.75}
            >
              <Ionicons name="book-outline" size={15} color={GOLD} />
              <Text style={styles.quranLinkText}>
                {quranLoading ? 'Opening Quran.Foundation...' : 'Continue with Quran.Foundation'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const GOLD     = '#C9A456';
const GOLD_DIM = '#8A6A2A';
const GREEN_BG = '#0B2214';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GREEN_BG },
  safe: { flex: 1 },

  // Background decoration
  glowTop: {
    position: 'absolute', top: -120, left: width / 2 - 180,
    width: 360, height: 360,
    borderRadius: 180,
    backgroundColor: '#1A5C2A',
    opacity: 0.18,
  },
  glowBottom: {
    position: 'absolute', bottom: -80, right: width / 2 - 150,
    width: 300, height: 300,
    borderRadius: 150,
    backgroundColor: '#C9A456',
    opacity: 0.06,
  },
  patternOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  diamondCell: {
    position: 'absolute',
    width: 18, height: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(201,164,86,0.10)',
    transform: [{ rotate: '45deg' }],
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 28,
  },

  // Logo
  logoWrap: { alignItems: 'center', gap: 10 },
  logoText: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 54,
    color: GOLD,
    letterSpacing: 14,
    textShadowColor: 'rgba(201,164,86,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDivider: { flex: 1, height: 0.5, backgroundColor: GOLD_DIM, opacity: 0.6 },
  logoDiamond: {
    width: 5, height: 5,
    backgroundColor: GOLD,
    transform: [{ rotate: '45deg' }],
  },

  // Mosque icon
  iconWrap: { alignItems: 'center', gap: 14 },
  mosqueIcon: {
    width: width * 0.90,
    height: width * 0.70,
    tintColor: GOLD,
    opacity: 0.92,
  },
  tagline: {
    fontFamily: 'Raleway_300Light',
    fontSize: 14,
    color: 'rgba(201,164,86,0.75)',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  // Verse card
  verseCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(201,164,86,0.20)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  verseCardInner: {
    padding: 22,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  arabicText: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 28,
    color: GOLD,
    textAlign: 'center',
    lineHeight: 48,
    writingDirection: 'rtl',
    textShadowColor: 'rgba(201,164,86,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  verseDivider: {
    width: 40, height: 0.5,
    backgroundColor: GOLD_DIM,
    opacity: 0.5,
    marginVertical: 2,
  },
  translationText: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 13,
    color: 'rgba(230,210,170,0.85)',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  verseRef: {
    fontFamily: 'Raleway_300Light',
    fontSize: 11,
    color: 'rgba(201,164,86,0.5)',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Buttons
  btnGroup: { width: '100%', alignItems: 'center', gap: 14 },
  primaryBtn: {
    width: '100%',
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnGradient: {
    paddingVertical: 17,
    alignItems: 'center',
    borderRadius: 50,
  },
  primaryBtnText: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 18,
    color: '#0B2214',
    letterSpacing: 1,
  },
  signInLink: { paddingVertical: 4 },
  signInText: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14,
    color: 'rgba(201,164,86,0.65)',
    letterSpacing: 0.5,
  },
  quranLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 8 },
  quranLinkText: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 13,
    color: GOLD,
    letterSpacing: 0.2,
  },
});
