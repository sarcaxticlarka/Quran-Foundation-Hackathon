import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/theme/colors';
import { useStreak } from '../../src/hooks/useStreak';
import { useVerseOfDay, getFirstTranslation } from '../../src/hooks/useQuran';
import { Card } from '../../src/components/ui/Card';

const DHIKR_TARGET = 33;

// ─── Animated checkmark on completion ────────────────────────────────────────

function CompletedHero({ onDone }: { onDone: () => void }) {
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    ]).start();

    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });

  return (
    <Animated.View style={[hero.container, { opacity: fadeAnim }]}>
      <Animated.View style={[hero.glow, { transform: [{ scale: glowScale }] }]} />
      <Animated.View style={[hero.circle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={52} color={Colors.darkBg} />
      </Animated.View>
      <Text style={hero.title}>Session Complete!</Text>
      <Text style={hero.sub}>Streak secured — barakAllahu feek</Text>
    </Animated.View>
  );
}

const hero = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  glow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.gold + '22',
  },
  circle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
  },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 30, color: Colors.textPrimary },
  sub: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textMuted },
});

// ─── Dhikr counter widget ─────────────────────────────────────────────────────

function DhikrCounter({ done, onComplete }: { done: boolean; onComplete: (count: number) => void }) {
  const [count, setCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleTap = () => {
    if (done || count >= DHIKR_TARGET) return;
    const next = count + 1;
    setCount(next);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    if (next >= DHIKR_TARGET) onComplete(DHIKR_TARGET);
  };

  const progress = Math.min(count / DHIKR_TARGET, 1);
  const remaining = DHIKR_TARGET - count;
  const completed = count >= DHIKR_TARGET || done;

  return (
    <View style={dhikr.wrapper}>
      <View style={dhikr.labelRow}>
        <Text style={dhikr.label}>سبحان الله  ·  SubhanAllah</Text>
        {completed && <Ionicons name="checkmark-circle" size={18} color={Colors.teal} />}
      </View>

      <View style={dhikr.trackOuter}>
        <Animated.View style={[dhikr.trackFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <Text style={dhikr.progressText}>
        {completed ? `${DHIKR_TARGET} / ${DHIKR_TARGET} · Done` : `${count} / ${DHIKR_TARGET} · ${remaining} to go`}
      </Text>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[dhikr.btn, completed && dhikr.btnDone]}
          onPress={handleTap}
          disabled={completed}
          activeOpacity={0.8}
        >
          {completed
            ? <Ionicons name="checkmark" size={26} color={Colors.darkBg} />
            : <Text style={dhikr.btnText}>سبحان الله</Text>}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const dhikr = StyleSheet.create({
  wrapper: { gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
  trackOuter: { height: 4, backgroundColor: Colors.darkBg3, borderRadius: 2, overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: Colors.teal, borderRadius: 2 },
  progressText: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  btn: {
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  btnDone: { backgroundColor: Colors.gold + 'AA' },
  btnText: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.darkBg },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SessionScreen() {
  const router = useRouter();
  const { todayActivity, recordVerseRead, recordDhikr, recordSession } = useStreak();
  const { data: verseOfDay } = useVerseOfDay();

  const [verseRead,     setVerseRead]     = useState(todayActivity.versesRead > 0);
  const [dhikrDone,     setDhikrDone]     = useState(todayActivity.dhikrCount >= DHIKR_TARGET);
  const [sessionDone,   setSessionDone]   = useState(false);

  const allDone = verseRead && dhikrDone;
  const doneCount = [verseRead, dhikrDone].filter(Boolean).length;

  const handleVerseRead = () => {
    if (verseRead) return;
    recordVerseRead(1);
    setVerseRead(true);
  };

  const handleDhikrComplete = (count: number) => {
    recordDhikr(count);
    setDhikrDone(true);
  };

  const handleCompleteSession = () => {
    recordSession(5);
    setSessionDone(true);
  };

  if (sessionDone) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <CompletedHero onDone={() => router.replace('/(tabs)')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Session</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Progress header */}
        <LinearGradient
          colors={['#1A4A26', '#142E1C', '#0F2418']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.progressCard}
        >
          <View style={styles.progressRow}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNum}>{doneCount}</Text>
              <Text style={styles.progressDen}>/2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>
                {allDone ? 'All done! Tap below to complete.' : `${2 - doneCount} step${2 - doneCount !== 1 ? 's' : ''} remaining`}
              </Text>
              <Text style={styles.progressSub}>Complete both steps to lock in your streak</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(doneCount / 2) * 100}%` as any }]} />
          </View>
        </LinearGradient>

        {/* Step 1 — Verse of the day */}
        <Card variant="bordered" padding="lg" style={[styles.stepCard, verseRead && styles.stepDone]}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: verseRead ? Colors.gold + '33' : Colors.darkBg3 }]}>
              {verseRead
                ? <Ionicons name="checkmark" size={18} color={Colors.gold} />
                : <Text style={styles.stepNum}>1</Text>}
            </View>
            <Text style={styles.stepTitle}>Read Today's Verse</Text>
          </View>

          {verseOfDay ? (
            <View style={styles.verseBlock}>
              <Text style={styles.arabic}>{verseOfDay.text_uthmani}</Text>
              <Text style={styles.translation}>{getFirstTranslation(verseOfDay)}</Text>
              <Text style={styles.verseRef}>{verseOfDay.verse_key}</Text>
            </View>
          ) : (
            <Text style={styles.loadingText}>Loading verse…</Text>
          )}

          <TouchableOpacity
            style={[styles.stepBtn, verseRead && styles.stepBtnDone]}
            onPress={handleVerseRead}
            disabled={verseRead}
            activeOpacity={0.8}
          >
            <Ionicons
              name={verseRead ? 'checkmark-circle' : 'book-outline'}
              size={17}
              color={verseRead ? Colors.gold : Colors.darkBg}
            />
            <Text style={[styles.stepBtnText, verseRead && styles.stepBtnTextDone]}>
              {verseRead ? 'Verse Read' : 'Mark as Read'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Step 2 — Dhikr */}
        <Card variant="bordered" padding="lg" style={[styles.stepCard, dhikrDone && styles.stepDone]}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: dhikrDone ? Colors.teal + '33' : Colors.darkBg3 }]}>
              {dhikrDone
                ? <Ionicons name="checkmark" size={18} color={Colors.teal} />
                : <Text style={styles.stepNum}>2</Text>}
            </View>
            <Text style={styles.stepTitle}>Dhikr — 33×</Text>
          </View>
          <DhikrCounter done={dhikrDone} onComplete={handleDhikrComplete} />
        </Card>

        {/* Complete button */}
        <TouchableOpacity
          style={[styles.completeBtn, !allDone && styles.completeBtnDisabled]}
          onPress={handleCompleteSession}
          disabled={!allDone}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={allDone ? ['#C9A456', '#B8893E'] : [Colors.darkBg3, Colors.darkBg3]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.completeBtnGrad}
          >
            <Ionicons name="flame" size={20} color={allDone ? Colors.darkBg : Colors.textMuted} />
            <Text style={[styles.completeBtnText, !allDone && styles.completeBtnTextDisabled]}>
              Complete Today's Session
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hint}>
          {allDone
            ? 'You\'re ready — tap above to secure your streak!'
            : 'Finish both steps above to unlock this button.'}
        </Text>

      </ScrollView>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  progressCard: { borderRadius: 18, padding: 18, gap: 14, borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  progressCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(201,164,86,0.15)', borderWidth: 1.5, borderColor: Colors.gold + '66',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 1,
  },
  progressNum: { fontFamily: 'Raleway_700Bold', fontSize: 22, color: Colors.gold },
  progressDen: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, alignSelf: 'flex-end', marginBottom: 3 },
  progressTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  progressSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: Colors.gold, borderRadius: 2 },

  stepCard: { gap: 14 },
  stepDone: { borderColor: Colors.gold + '44', backgroundColor: Colors.darkBg2 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textMuted },
  stepTitle: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.textPrimary },

  verseBlock: { gap: 8 },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 38,
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  verseRef: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold, letterSpacing: 0.5 },
  loadingText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },

  stepBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 13,
  },
  stepBtnDone: { backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.gold + '44' },
  stepBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
  stepBtnTextDone: { color: Colors.gold },

  completeBtn: { borderRadius: 16, overflow: 'hidden' },
  completeBtnDisabled: { opacity: 0.5 },
  completeBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18,
  },
  completeBtnText: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: Colors.darkBg },
  completeBtnTextDisabled: { color: Colors.textMuted },

  hint: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
