import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/theme/colors';
import { quranApi, stripHtml } from '../../../src/services/quranApi';
import { useReviewStore } from '../../../src/stores/reviewStore';
import { useStreakStore } from '../../../src/stores/streakStore';
import { QualityRating, formatInterval } from '../../../src/utils/sm2Algorithm';

const CONFIDENCE_BUTTONS: { label: string; value: QualityRating; color: string; desc: string }[] = [
  { label: 'Again', value: 1, color: Colors.error ?? '#ef4444', desc: 'Forgot completely' },
  { label: 'Hard',  value: 2, color: Colors.coral,              desc: 'Very difficult' },
  { label: 'Good',  value: 3, color: Colors.gold,               desc: 'Correct with effort' },
  { label: 'Easy',  value: 5, color: Colors.teal,               desc: 'Perfect recall' },
];

export default function FlashcardScreen() {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastInterval, setLastInterval] = useState<number | null>(null);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const currentSession   = useReviewStore((s) => s.currentSession);
  const currentCardIndex = useReviewStore((s) => s.currentCardIndex);
  const submitReview     = useReviewStore((s) => s.submitReview);
  const completeSession  = useReviewStore((s) => s.completeSession);
  const getCurrentCard   = useReviewStore((s) => s.getCurrentCard);
  const getSessionCards  = useReviewStore((s) => s.getSessionCards);
  const startSession     = useReviewStore((s) => s.startSession);
  const recordActivity   = useStreakStore((s) => s.recordActivity);

  // Ensure a session is running when this screen mounts
  useEffect(() => {
    if (!currentSession || currentSession.isComplete) {
      startSession();
    }
  }, []);

  const sessionCards = getSessionCards();
  const currentCard  = getCurrentCard();
  const totalCards   = sessionCards.length;
  const isComplete   = !currentCard;

  // Redirect when session finishes
  useEffect(() => {
    if (isComplete && currentSession && !currentSession.isComplete) {
      completeSession();
      router.replace('/profile/review/complete' as any);
    }
  }, [isComplete]);

  const verseKey = currentCard?.verseKey ?? '';

  const { data: verse, isLoading: verseLoading } = useQuery({
    queryKey: ['verse', verseKey],
    queryFn: () => quranApi.getVerse(verseKey),
    enabled: !!verseKey,
    staleTime: Infinity,
  });

  const arabicText  = verse?.text_uthmani ?? '';
  const translation = verse ? stripHtml(verse.translations?.[0]?.text ?? '') : '';

  const handleFlip = () => {
    if (isFlipped) return;
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setIsFlipped(true));
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] });

  const handleRate = (quality: QualityRating) => {
    if (!currentCard) return;
    const nextInterval = currentCard.interval;
    setLastInterval(nextInterval);
    submitReview(quality);
    recordActivity({ reviewsCompleted: 1 });
    setIsFlipped(false);
    flipAnim.setValue(0);
  };

  if (verseLoading && !verse) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.loadingText}>Loading verse...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{Math.min(currentCardIndex + 1, totalCards)} / {totalCards}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${(currentCardIndex / Math.max(totalCards, 1)) * 100}%` }]} />
      </View>

      <View style={styles.body}>
        <TouchableOpacity onPress={handleFlip} activeOpacity={0.95} style={styles.cardTouchable}>
          {/* Front — Arabic */}
          <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
            <Text style={styles.cardLabel}>ARABIC</Text>
            {arabicText ? (
              <>
                <Text style={styles.cardArabic}>{arabicText}</Text>
                <Text style={styles.cardSurah}>{verseKey}</Text>
              </>
            ) : (
              <ActivityIndicator color={Colors.gold} />
            )}
            <Text style={styles.tapHint}>Tap to reveal meaning →</Text>
          </Animated.View>

          {/* Back — Translation */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
            <Text style={styles.cardLabel}>TRANSLATION</Text>
            <Text style={styles.cardTranslation}>{translation || 'Loading...'}</Text>
            <Text style={styles.cardSurah}>{verseKey}</Text>
            {currentCard && (
              <View style={styles.sm2Info}>
                <Text style={styles.sm2Text}>
                  Rep {currentCard.repetitions} · EF {currentCard.easeFactor.toFixed(1)} · {formatInterval(currentCard.interval)}
                </Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {isFlipped ? (
          <View style={styles.ratingRow}>
            {CONFIDENCE_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.value}
                style={[styles.ratingBtn, { borderColor: btn.color }]}
                onPress={() => handleRate(btn.value)}
              >
                <Text style={[styles.ratingLabel, { color: btn.color }]}>{btn.label}</Text>
                <Text style={styles.ratingDesc}>{btn.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.flipBtn} onPress={handleFlip}>
            <Text style={styles.flipBtnText}>Show Answer</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: Colors.textMuted, fontSize: 14 },
  progress: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  progressTrack: { height: 3, backgroundColor: Colors.darkBg2, marginHorizontal: 20 },
  progressBar: { height: 3, backgroundColor: Colors.teal },
  body: { flex: 1, padding: 20, gap: 20, alignItems: 'center', justifyContent: 'center' },
  cardTouchable: { width: '100%' },
  card: {
    backgroundColor: Colors.darkBg2, borderRadius: 24,
    padding: 32, borderWidth: 1, borderColor: Colors.darkBorder,
    minHeight: 280, justifyContent: 'center', alignItems: 'center', gap: 16,
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardBack: { position: 'absolute', top: 0, left: 0, right: 0 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.5 },
  cardArabic: { fontSize: 28, color: Colors.goldLight, textAlign: 'center', lineHeight: 48, writingDirection: 'rtl' },
  cardTranslation: { fontSize: 17, color: Colors.textPrimary, textAlign: 'center', lineHeight: 28, fontStyle: 'italic' },
  cardSurah: { fontSize: 12, color: Colors.textMuted },
  tapHint: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  sm2Info: {
    backgroundColor: Colors.darkBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    marginTop: 4,
  },
  sm2Text: { fontSize: 11, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', gap: 8, width: '100%' },
  ratingBtn: {
    flex: 1, backgroundColor: Colors.darkBg2, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, gap: 3,
  },
  ratingLabel: { fontSize: 14, fontWeight: '700' },
  ratingDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  flipBtn: {
    backgroundColor: Colors.gold, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center',
  },
  flipBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});
