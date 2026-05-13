import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { useReviewStore } from '../../../src/stores/reviewStore';
import { getDueCards } from '../../../src/utils/sm2Algorithm';

export default function ReviewCompleteScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const currentSession = useReviewStore((s) => s.currentSession);
  const cards          = useReviewStore((s) => s.cards);

  const reviewed      = currentSession?.reviewed ?? [];
  const totalReviewed = reviewed.length;
  const correctCount  = reviewed.filter((r) => r.quality >= 3).length;
  const accuracy      = totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0;

  const nextDue   = getDueCards(cards);
  const nextCount = nextDue.length;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View style={[styles.trophyWrap, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="trophy" size={52} color={Colors.gold} />
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>
            {accuracy >= 80 ? 'Mashallah — excellent recall!' : 'Keep going — consistency is the key.'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalReviewed}</Text>
              <Text style={styles.statLabel}>Cards reviewed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalReviewed > 0 ? `${accuracy}%` : '—'}</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{correctCount}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
          </View>

          <View style={styles.nextReview}>
            <Text style={styles.nextTitle}>Next Review</Text>
            <Text style={styles.nextTime}>
              {nextCount > 0 ? `${nextCount} card${nextCount === 1 ? '' : 's'} due now` : 'All caught up · check back tomorrow'}
            </Text>
          </View>

          <Text style={styles.quoteText}>
            "The best deeds are those done regularly, even if they are few." — Bukhari
          </Text>
        </Animated.View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.homeBtnText}>Return Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.queueBtn} onPress={() => router.replace('/profile/review/queue' as any)}>
            <Text style={styles.queueBtnText}>View Queue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  body: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 28 },
  trophyWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold + '66',
  },
  content: { alignItems: 'center', gap: 16, width: '100%' },
  title: { fontSize: 30, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 15, color: Colors.textMuted },
  statsRow: {
    flexDirection: 'row', width: '100%', backgroundColor: Colors.darkBg2,
    borderRadius: 16, padding: 20, justifyContent: 'space-around',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  stat: { alignItems: 'center', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.gold },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  nextReview: {
    backgroundColor: 'rgba(42,122,58,0.12)', borderRadius: 14, padding: 16,
    alignItems: 'center', width: '100%', gap: 4,
    borderWidth: 1, borderColor: Colors.teal,
  },
  nextTitle: { fontSize: 11, fontWeight: '700', color: Colors.teal, letterSpacing: 0.5, textTransform: 'uppercase' },
  nextTime: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  quoteText: {
    fontSize: 13, color: Colors.textMuted, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 22, paddingHorizontal: 10,
  },
  actions: { width: '100%', gap: 12 },
  homeBtn: { backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.darkBg },
  queueBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  queueBtnText: { fontSize: 14, color: Colors.textSecondary },
});
