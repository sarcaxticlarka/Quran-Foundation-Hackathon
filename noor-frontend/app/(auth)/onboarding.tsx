import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const MADHABS = ['Hanafi', 'Maliki', "Shafi'i", 'Hanbali', 'Not specified'];
const LEVELS: { id: string; label: string; desc: string; icon: IoniconName }[] = [
  { id: 'beginner',     label: 'Beginner',     desc: 'New to Quranic study',         icon: 'leaf-outline'      },
  { id: 'intermediate', label: 'Intermediate', desc: 'Some experience with Arabic',   icon: 'book-outline'      },
  { id: 'advanced',     label: 'Advanced',     desc: 'Fluent in Arabic recitation',   icon: 'school-outline'    },
];
const DAILY_GOALS = [5, 10, 15, 20, 30, 45];

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [step, setStep]           = useState(0);
  const [madhab, setMadhab]       = useState('');
  const [level, setLevel]         = useState('');
  const [dailyGoal, setDailyGoal] = useState(15);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTo = (targetStep: number) => {
    Animated.spring(slideAnim, {
      toValue: -targetStep * width,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
    setStep(targetStep);
  };

  const canProceed = [madhab !== '', level !== '', dailyGoal > 0][step];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepCounter}>{step + 1} of 3</Text>
      </View>

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <Animated.View style={[styles.slidesTrack, { transform: [{ translateX: slideAnim }] }]}>

          {/* ── Step 1: Madhab ── */}
          <View style={[styles.slide, { width }]}>
            <Text style={styles.stepTag}>YOUR MADHAB</Text>
            <Text style={styles.heading}>School of{'\n'}Thought</Text>
            <Text style={styles.subheading}>Helps us surface relevant rulings and tafsir for you.</Text>
            <View style={styles.optionList}>
              {MADHABS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMadhab(m)}
                  style={[styles.optionRow, madhab === m && styles.optionRowSelected]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionRadio, madhab === m && styles.optionRadioFilled]}>
                    {madhab === m && <View style={styles.optionRadioDot} />}
                  </View>
                  <Text style={[styles.optionText, madhab === m && styles.optionTextSelected]}>
                    {m}
                  </Text>
                  {madhab === m && (
                    <Ionicons name="checkmark" size={16} color={Colors.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Step 2: Reading Level ── */}
          <View style={[styles.slide, { width }]}>
            <Text style={styles.stepTag}>YOUR LEVEL</Text>
            <Text style={styles.heading}>Reading{'\n'}Ability</Text>
            <Text style={styles.subheading}>We'll personalise word-level breakdowns to match your knowledge.</Text>
            <View style={styles.levelList}>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setLevel(l.id)}
                  style={[styles.levelCard, level === l.id && styles.levelCardSelected]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.levelIconWrap, level === l.id && styles.levelIconWrapActive]}>
                    <Ionicons
                      name={l.icon}
                      size={22}
                      color={level === l.id ? Colors.gold : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.levelText}>
                    <Text style={[styles.levelLabel, level === l.id && styles.levelLabelSelected]}>
                      {l.label}
                    </Text>
                    <Text style={styles.levelDesc}>{l.desc}</Text>
                  </View>
                  {level === l.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Step 3: Daily Goal ── */}
          <View style={[styles.slide, { width }]}>
            <Text style={styles.stepTag}>DAILY GOAL</Text>
            <Text style={styles.heading}>Time{'\n'}Commitment</Text>
            <Text style={styles.subheading}>How many minutes will you dedicate each day?</Text>
            <View style={styles.goalGrid}>
              {DAILY_GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setDailyGoal(g)}
                  style={[styles.goalTile, dailyGoal === g && styles.goalTileSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.goalNumber, dailyGoal === g && styles.goalNumberSelected]}>
                    {g}
                  </Text>
                  <Text style={[styles.goalUnit, dailyGoal === g && styles.goalUnitSelected]}>
                    min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.duaCard}>
              <Text style={styles.duaArabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
              <Text style={styles.duaTrans}>Begin every session in the name of Allah</Text>
            </View>
          </View>

        </Animated.View>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {step > 0 ? (
          <TouchableOpacity onPress={() => animateTo(step - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <TouchableOpacity
          onPress={() => (step === 2 ? completeOnboarding({ madhab, level, dailyGoal }) : animateTo(step + 1))}
          disabled={!canProceed}
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {step === 2 ? 'Begin My Journey' : 'Continue'}
          </Text>
          {step < 2 && <Ionicons name="arrow-forward" size={18} color={Colors.darkBg} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },

  header: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: {
    height: 4, width: 24, borderRadius: 2,
    backgroundColor: Colors.darkBorder,
  },
  dotActive: { backgroundColor: Colors.gold, width: 36 },
  stepCounter: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: Colors.textMuted },

  slidesContainer: { flex: 1, overflow: 'hidden' },
  slidesTrack: { flexDirection: 'row' },

  slide: { paddingHorizontal: 28, paddingTop: 28, gap: 14 },

  stepTag: {
    fontFamily: 'Raleway_700Bold', fontSize: 11,
    fontWeight: '700', letterSpacing: 2, color: Colors.gold,
  },
  heading: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 38, color: Colors.textPrimary, lineHeight: 46,
  },
  subheading: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 15, color: Colors.textMuted, lineHeight: 22,
  },

  optionList: { gap: 10, marginTop: 6 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.darkCard,
    borderWidth: 1.5, borderColor: Colors.darkBorder,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18,
  },
  optionRowSelected: { borderColor: Colors.gold, backgroundColor: Colors.goldMuted },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.darkBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  optionRadioFilled: { borderColor: Colors.gold },
  optionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
  optionText: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textSecondary, flex: 1 },
  optionTextSelected: { fontFamily: 'Raleway_700Bold', color: Colors.gold },

  levelList: { gap: 12, marginTop: 6 },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.darkCard,
    borderWidth: 1.5, borderColor: Colors.darkBorder,
    borderRadius: 16, padding: 18,
  },
  levelCardSelected: { borderColor: Colors.gold, backgroundColor: Colors.goldMuted },
  levelIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.darkBg3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  levelIconWrapActive: { backgroundColor: Colors.goldMuted, borderColor: Colors.gold },
  levelText: { flex: 1, gap: 2 },
  levelLabel: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.textSecondary },
  levelLabelSelected: { color: Colors.gold },
  levelDesc: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  goalTile: {
    width: (width - 56 - 20) / 3,
    backgroundColor: Colors.darkCard,
    borderWidth: 1.5, borderColor: Colors.darkBorder,
    borderRadius: 16, paddingVertical: 20,
    alignItems: 'center', gap: 2,
  },
  goalTileSelected: { borderColor: Colors.gold, backgroundColor: Colors.goldMuted },
  goalNumber: { fontFamily: 'Raleway_700Bold', fontSize: 26, color: Colors.textSecondary },
  goalNumberSelected: { color: Colors.gold },
  goalUnit: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.textMuted },
  goalUnitSelected: { color: Colors.gold },

  duaCard: {
    backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.goldDim,
    borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 8, marginTop: 4,
  },
  duaArabic: { fontSize: 20, color: Colors.goldLight, lineHeight: 36, fontFamily: 'serif' },
  duaTrans: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center' },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingVertical: 20, gap: 16,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 4, minWidth: 60 },
  backBtnText: { fontFamily: 'Raleway_600SemiBold', color: Colors.textMuted, fontSize: 15 },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingVertical: 16,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { fontFamily: 'Raleway_700Bold', color: Colors.darkBg, fontSize: 16 },
});
