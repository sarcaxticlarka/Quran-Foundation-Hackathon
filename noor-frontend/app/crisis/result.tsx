import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { useCrisisStore } from '../../src/stores/crisisStore';
import { Card } from '../../src/components/ui/Card';

const STEPS = [
  { key: 'verse',  label: 'Your Verse',         icon: 'book-outline' as const,     color: Colors.teal   },
  { key: 'tafsir', label: 'Scholarly Context',   icon: 'school-outline' as const,   color: Colors.purple },
  { key: 'hadith', label: 'From the Sunnah',     icon: 'heart-outline' as const,    color: Colors.blue   },
  { key: 'dhikr',  label: 'Breathe & Remember',  icon: 'infinite-outline' as const, color: Colors.gold   },
];

export default function CrisisResultScreen() {
  const router = useRouter();
  const { sequence, mood } = useCrisisStore();

  const fadeAnims  = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(STEPS.map(() => new Animated.Value(28))).current;

  useEffect(() => {
    STEPS.forEach((_, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnims[i],  { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(slideAnims[i], { toValue: 0, friction: 8,   useNativeDriver: true }),
        ]).start();
      }, i * 650);
    });
  }, []);

  if (!sequence) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredMsg}>
          <Text style={styles.centeredText}>Loading your verse…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStepContent = (key: string) => {
    switch (key) {
      case 'verse':
        return (
          <View style={styles.verseBlock}>
            {sequence.analysis && (
              <View style={styles.analysisBanner}>
                <Ionicons name="sparkles" size={13} color={Colors.gold} />
                <Text style={styles.analysisText}>{sequence.analysis}</Text>
              </View>
            )}
            <Text style={styles.arabic}>{sequence.verse?.arabic}</Text>
            <Text style={styles.translation}>{sequence.verse?.translation}</Text>
            <Text style={styles.reference}>{sequence.verse?.surahName}</Text>
          </View>
        );
      case 'tafsir':
        return <Text style={styles.bodyText}>{sequence.tafsir}</Text>;
      case 'hadith':
        return (
          <View style={styles.hadithBlock}>
            <View style={styles.hadithQuote}>
              <Text style={styles.quoteChar}>"</Text>
              <Text style={styles.bodyText}>{sequence.hadith}</Text>
            </View>
          </View>
        );
      case 'dhikr':
        return (
          <TouchableOpacity
            style={styles.dhikrBtn}
            onPress={() => router.push('/crisis/dhikr')}
            activeOpacity={0.85}
          >
            <Text style={styles.dhikrText}>{sequence.dhikr}</Text>
            <Text style={styles.dhikrSub}>Tap to open breathing timer →</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Guidance</Text>
        <View style={{ width: 36 }} />
      </View>

      {mood && (
        <View style={styles.moodBanner}>
          <Ionicons name="heart-outline" size={13} color={Colors.teal} />
          <Text style={styles.moodText}>Responding to: "{mood}"</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {STEPS.map((step, i) => (
          <Animated.View
            key={step.key}
            style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}
          >
            <Card variant="bordered" padding="lg" style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: step.color + '22' }]}>
                  <Ionicons name={step.icon} size={20} color={step.color} />
                </View>
                <View style={styles.stepMeta}>
                  <Text style={[styles.stepNum, { color: step.color }]}>Step {i + 1}</Text>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                </View>
              </View>
              <View style={styles.stepContent}>
                {getStepContent(step.key)}
              </View>
            </Card>
          </Animated.View>
        ))}

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeBtnText}>Return Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  centeredMsg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centeredText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  moodBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: Colors.darkBg2, borderRadius: 10,
    padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.teal,
  },
  moodText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },

  stepCard: { gap: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepMeta: { gap: 2 },
  stepNum: { fontFamily: 'Raleway_700Bold', fontSize: 10, letterSpacing: 0.5 },
  stepLabel: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 17, color: Colors.textPrimary },
  stepContent: {},

  verseBlock: { gap: 12 },
  analysisBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(201,164,86,0.08)', borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)',
  },
  analysisText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 20, fontStyle: 'italic', flex: 1 },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 28, color: Colors.goldLight,
    textAlign: 'right', lineHeight: 46, writingDirection: 'rtl',
  },
  translation: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 18, color: Colors.textPrimary, lineHeight: 28, fontStyle: 'italic' },
  reference: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold, letterSpacing: 0.5 },
  bodyText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
  hadithBlock: {},
  hadithQuote: { borderLeftWidth: 2, borderLeftColor: 'rgba(74,143,212,0.4)', paddingLeft: 14 },
  quoteChar: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 40, color: Colors.blue, lineHeight: 36, marginBottom: 4 },
  dhikrBtn: {
    backgroundColor: Colors.goldMuted, borderRadius: 14,
    padding: 18, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)',
  },
  dhikrText: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.gold, textAlign: 'center' },
  dhikrSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  homeBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder, marginTop: 4,
  },
  homeBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textMuted },
});
