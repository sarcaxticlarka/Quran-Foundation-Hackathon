import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useReviewStore } from '../../../src/stores/reviewStore';
import { getDueCards, formatInterval, getCardStrength, getRetentionRate, isDue } from '../../../src/utils/sm2Algorithm';

const STARTER_VERSES = ['2:255', '94:5', '93:5', '1:1', '112:1', '2:286', '3:173', '13:28', '36:1', '67:1'];

const STRENGTH_COLORS: Record<string, 'teal' | 'gold' | 'coral'> = {
  mature: 'teal',
  young: 'gold',
  learning: 'coral',
  new: 'coral',
};

export default function ReviewQueueScreen() {
  const router = useRouter();
  const cards = useReviewStore((s) => s.cards);
  const startSession = useReviewStore((s) => s.startSession);
  const importCards = useReviewStore((s) => s.importCards);
  const totalReviewed = useReviewStore((s) => s.totalReviewed);

  const dueCards = getDueCards(cards);
  const upcomingCards = cards
    .filter((c) => !isDue(c))
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
    .slice(0, 8);

  const masteredCount = cards.filter((c) => c.repetitions >= 3 && c.easeFactor > 2.0).length;
  const retention = getRetentionRate(cards);

  const handleStart = () => {
    startSession();
    router.push('/profile/review/flashcard' as any);
  };

  const handleSeed = () => {
    importCards(STARTER_VERSES);
  };

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Review Queue</Text>
            <Text style={styles.headerSub}>Spaced repetition · SM-2 algorithm</Text>
          </View>
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="library-outline" size={52} color={Colors.gold} />
          <Text style={styles.emptyTitle}>No verses to review yet</Text>
          <Text style={styles.emptyBody}>
            Save verses from the Knowledge Graph or start with a set of essential Quranic verses.
          </Text>
          <TouchableOpacity style={styles.seedBtn} onPress={handleSeed}>
            <Text style={styles.seedBtnText}>Add Starter Verses</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Review Queue</Text>
          <Text style={styles.headerSub}>Spaced repetition · SM-2 algorithm</Text>
        </View>
        {dueCards.length > 0 && (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>Start {dueCards.length} →</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Due now */}
        {dueCards.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Due Now</Text>
              <Badge label={`${dueCards.length}`} variant="coral" />
            </View>

            {dueCards.map((card) => {
              const strength = getCardStrength(card);
              const [surahNum, ayahNum] = card.verseKey.split(':');
              return (
                <Card key={card.verseKey} variant="bordered" padding="md" style={styles.queueCard}>
                  <View style={styles.verseKeyRow}>
                    <Text style={styles.verseKeyNum}>{card.verseKey}</Text>
                    <Text style={styles.verseKeyLabel}>Surah {surahNum} · Ayah {ayahNum}</Text>
                  </View>
                  <View style={styles.cardFooter}>
                    <Badge
                      label={strength}
                      variant={STRENGTH_COLORS[strength] ?? 'gold'}
                    />
                    <View style={styles.dueRow}>
                      <Ionicons name="time-outline" size={13} color={Colors.coral} />
                      <Text style={styles.dueText}>Due now · rep {card.repetitions}</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        ) : (
          <Card variant="bordered" padding="md" style={styles.allDoneCard}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.gold} />
            <Text style={styles.allDoneTitle}>All caught up!</Text>
            <Text style={styles.allDoneBody}>No cards due right now. Come back later.</Text>
          </Card>
        )}

        {/* Upcoming */}
        {upcomingCards.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Upcoming</Text>
            {upcomingCards.map((card) => {
              const [surahNum, ayahNum] = card.verseKey.split(':');
              return (
                <Card key={card.verseKey} variant="bordered" padding="md" style={StyleSheet.flatten([styles.queueCard, styles.upcomingCard])}>
                  <View style={styles.verseKeyRow}>
                    <Text style={styles.verseKeyNum}>{card.verseKey}</Text>
                    <Text style={styles.verseKeyLabel}>Surah {surahNum} · Ayah {ayahNum}</Text>
                  </View>
                  <View style={styles.dueRow}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.dueText}>{formatInterval(card.interval)} · rep {card.repetitions}</Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Stats */}
        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Review Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{cards.length}</Text>
              <Text style={styles.statLabel}>Total saved</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{masteredCount}</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{retention > 0 ? `${retention}%` : '—'}</Text>
              <Text style={styles.statLabel}>Retention</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalReviewed}</Text>
              <Text style={styles.statLabel}>All time</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  startBtn: {
    backgroundColor: Colors.coral, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  scroll: { padding: 20, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  queueCard: { gap: 8 },
  upcomingCard: { opacity: 0.7 },
  verseKeyRow: { gap: 2 },
  verseKeyNum: { fontSize: 18, fontWeight: '800', color: Colors.goldLight },
  verseKeyLabel: { fontSize: 12, color: Colors.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dueText: { fontSize: 12, color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, flexWrap: 'wrap', gap: 8 },
  stat: { alignItems: 'center', gap: 4, minWidth: 60 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.gold },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  seedBtn: {
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 8,
  },
  seedBtnText: { fontSize: 15, fontWeight: '700', color: Colors.darkBg },
  allDoneCard: { alignItems: 'center', gap: 8, paddingVertical: 28, backgroundColor: 'rgba(201,164,86,0.08)', borderColor: 'rgba(201,164,86,0.3)' },
  allDoneTitle: { fontSize: 18, fontWeight: '700', color: Colors.gold },
  allDoneBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
