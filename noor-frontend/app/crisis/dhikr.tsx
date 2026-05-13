import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';

const TOTAL_SECONDS = 120;
const DHIKR_PHRASES = [
  { arabic: 'سُبْحَانَ اللَّه', transliteration: 'SubhanAllah', translation: 'Glory be to Allah', count: 33 },
  { arabic: 'الْحَمْدُ لِلَّه', transliteration: 'Alhamdulillah', translation: 'All praise is due to Allah', count: 33 },
  { arabic: 'اللَّهُ أَكْبَر', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest', count: 33 },
];

export default function DhikrTimerScreen() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDhikr, setCurrentDhikr] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = (TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS;
  const circumference = 2 * Math.PI * 90;

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(breatheAnim, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(breatheAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0.3, duration: 4000, useNativeDriver: true }),
          ]),
        ])
      ).start();

      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      breatheAnim.stopAnimation();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const handleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= DHIKR_PHRASES[currentDhikr].count) {
      setTapCount(0);
      setCurrentDhikr((d) => Math.min(d + 1, DHIKR_PHRASES.length - 1));
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const dhikr = DHIKR_PHRASES[currentDhikr];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Breathing Dhikr</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        {/* Breathing circle */}
        <Animated.View style={[styles.outerCircle, { opacity: glowAnim }]}>
          <Animated.View style={[styles.innerCircle, { transform: [{ scale: breatheAnim }] }]}>
            <Text style={styles.circleText}>
              {isRunning ? (secondsLeft % 8 < 4 ? 'Breathe In' : 'Breathe Out') : 'Tap to Begin'}
            </Text>
            <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
          </Animated.View>
        </Animated.View>

        {/* Dhikr phrase */}
        <View style={styles.dhikrSection}>
          <Text style={styles.dhikrArabic}>{dhikr.arabic}</Text>
          <Text style={styles.dhikrTranslit}>{dhikr.transliteration}</Text>
          <Text style={styles.dhikrTranslation}>{dhikr.translation}</Text>
          <Text style={styles.dhikrProgress}>{tapCount} / {dhikr.count}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => setIsRunning((r) => !r)}
          >
            <Text style={styles.startBtnText}>{isRunning ? '⏸ Pause' : '▶ Start'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tapBtn, { opacity: isRunning ? 1 : 0.5 }]}
            onPress={handleTap}
            disabled={!isRunning}
            activeOpacity={0.7}
          >
            <Text style={styles.tapBtnText}>Tap to Count</Text>
            <Text style={styles.tapBtnSub}>{tapCount} taps</Text>
          </TouchableOpacity>
        </View>

        {secondsLeft === 0 && (
          <View style={styles.completeBanner}>
            <View style={styles.completeRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.teal} />
              <Text style={styles.completeText}>Mashallah! Session Complete</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.completeLink}>Return Home →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: Colors.teal, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  body: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: 24 },
  outerCircle: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.tealDim + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  innerCircle: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.tealDim,
    borderWidth: 2, borderColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  circleText: { fontSize: 14, color: Colors.teal, fontWeight: '600' },
  timerText: { fontSize: 32, fontWeight: '700', color: Colors.goldLight },
  dhikrSection: { alignItems: 'center', gap: 6 },
  dhikrArabic: {
    fontSize: 32, color: Colors.goldLight, fontFamily: 'serif', textAlign: 'center',
  },
  dhikrTranslit: { fontSize: 18, color: Colors.gold, fontWeight: '600' },
  dhikrTranslation: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  dhikrProgress: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  controls: { width: '100%', gap: 12 },
  startBtn: {
    backgroundColor: Colors.gold, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  tapBtn: {
    backgroundColor: Colors.darkBg2, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder, gap: 4,
  },
  tapBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  tapBtnSub: { fontSize: 12, color: Colors.textMuted },
  completeBanner: {
    backgroundColor: Colors.tealDim, borderRadius: 14,
    padding: 20, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.teal,
  },
  completeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completeText: { fontSize: 16, fontWeight: '700', color: Colors.teal },
  completeLink: { fontSize: 14, color: Colors.gold, fontWeight: '600' },
});
