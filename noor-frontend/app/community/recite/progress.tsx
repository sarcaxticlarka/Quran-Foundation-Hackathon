import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useStreak } from '../../../src/hooks/useStreak';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const LEVELS: { name: string; icon: IoniconName; color: string; minXp: number; maxXp: number; desc: string }[] = [
  { name: 'Novice',  icon: 'leaf-outline',  color: Colors.teal, minXp: 0,    maxXp: 200,  desc: 'Just starting your recitation journey' },
  { name: 'Learner', icon: 'book-outline',  color: Colors.teal, minXp: 200,  maxXp: 500,  desc: 'Building consistent recitation habits' },
  { name: 'Reciter', icon: 'mic-outline',   color: Colors.gold, minXp: 500,  maxXp: 1000, desc: 'Solid Tajweed foundation' },
  { name: 'Hafiz',   icon: 'star-outline',  color: Colors.gold, minXp: 1000, maxXp: 2000, desc: 'Memorising and mastering rules' },
  { name: 'Qari',    icon: 'trophy-outline',color: Colors.gold, minXp: 2000, maxXp: 9999, desc: 'Expert recitation, teaching others' },
];

export default function FluentProgressScreen() {
  const router = useRouter();
  const { currentStreak, longestStreak, history, todayActivity } = useStreak();

  // Derive XP from streak activity — each verse read = 8 XP, each review = 5 XP
  const totalXp = React.useMemo(() => {
    return Object.values(history).reduce(
      (sum, d) => sum + d.versesRead * 8 + d.reviewsCompleted * 5,
      0,
    );
  }, [history]);

  const currentLevel = LEVELS.find((l) => totalXp >= l.minXp && totalXp < l.maxXp) ?? LEVELS[0];
  const currentIdx   = LEVELS.indexOf(currentLevel);
  const nextLevel    = LEVELS[currentIdx + 1];
  const xpProgress   = nextLevel
    ? ((totalXp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
    : 100;

  // Last 5 active days as "sessions"
  const recentSessions = React.useMemo(() => {
    return Object.values(history)
      .filter((d) => d.versesRead > 0 || d.reviewsCompleted > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((d) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const label = d.date === today ? 'Today' : d.date === yesterday ? 'Yesterday' : d.date;
        const xp = d.versesRead * 8 + d.reviewsCompleted * 5;
        const accuracy = Math.min(95, 70 + Math.floor(d.reviewsCompleted * 2));
        return { date: label, xp, accuracy, versesRead: d.versesRead };
      });
  }, [history]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fluency Progress</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card variant="gold" padding="lg" style={styles.levelCard}>
          <View style={styles.levelIconWrap}>
            <Ionicons name={currentLevel.icon} size={36} color={Colors.gold} />
          </View>
          <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={styles.levelDesc}>{currentLevel.desc}</Text>
          <View style={styles.xpRow}>
            <Text style={styles.xpValue}>{totalXp} XP</Text>
            {nextLevel && (
              <Text style={styles.xpNext}>/ {nextLevel.minXp} to {nextLevel.name}</Text>
            )}
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpBar, { width: `${Math.min(xpProgress, 100)}%` as any }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{currentStreak}</Text>
              <Text style={styles.statLbl}>Day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{longestStreak}</Text>
              <Text style={styles.statLbl}>Best streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{todayActivity?.versesRead ?? 0}</Text>
              <Text style={styles.statLbl}>Today's verses</Text>
            </View>
          </View>
        </Card>

        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Level Ladder</Text>
          {LEVELS.map((level, i) => (
            <View key={level.name} style={[styles.ladderItem, i < LEVELS.length - 1 && styles.ladderItemBorder]}>
              <View style={[
                styles.ladderIconWrap,
                i === currentIdx && styles.ladderIconWrapActive,
                i < currentIdx && styles.ladderIconWrapDone,
              ]}>
                <Ionicons name={level.icon} size={18} color={i <= currentIdx ? Colors.gold : Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ladderName, i === currentIdx && { color: Colors.gold }]}>{level.name}</Text>
                <Text style={styles.ladderXp}>{level.minXp}+ XP</Text>
              </View>
              {i < currentIdx  && <Ionicons name="checkmark-circle" size={18} color={Colors.teal} />}
              {i === currentIdx && <Badge label="Current" variant="gold" />}
              {i > currentIdx  && <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />}
            </View>
          ))}
        </Card>

        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>Start practicing verses to see your history here.</Text>
          ) : (
            recentSessions.map((s, i) => (
              <View key={i} style={[styles.sessionRow, i < recentSessions.length - 1 && styles.sessionDivider]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionSurah}>{s.versesRead} verse{s.versesRead !== 1 ? 's' : ''} read</Text>
                  <Text style={styles.sessionDate}>{s.date}</Text>
                </View>
                <Text style={[styles.sessionAccuracy, {
                  color: s.accuracy >= 90 ? Colors.teal : s.accuracy >= 75 ? Colors.gold : Colors.coral,
                }]}>
                  {s.accuracy}%
                </Text>
                <Text style={styles.sessionXp}>+{s.xp} XP</Text>
              </View>
            ))
          )}
        </Card>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16 },

  levelCard: { alignItems: 'center', gap: 10 },
  levelIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold + '66',
  },
  levelName: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: Colors.goldLight },
  levelDesc: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  xpRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  xpValue: { fontFamily: 'Raleway_700Bold', fontSize: 22, color: Colors.gold },
  xpNext: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  xpTrack: { width: '100%', height: 8, backgroundColor: Colors.darkBg3, borderRadius: 4, overflow: 'hidden' },
  xpBar: { height: 8, backgroundColor: Colors.gold, borderRadius: 4 },

  statsRow: { flexDirection: 'row', width: '100%', marginTop: 6 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontFamily: 'Raleway_700Bold', fontSize: 20, color: Colors.textPrimary },
  statLbl: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  statDivider: { width: 1, backgroundColor: 'rgba(201,164,86,0.2)' },

  sectionTitle: {
    fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted,
    marginBottom: 14, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  ladderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  ladderItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.darkBorder },
  ladderIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.darkBg3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  ladderIconWrapActive: { backgroundColor: Colors.goldMuted, borderColor: Colors.gold },
  ladderIconWrapDone: { backgroundColor: 'rgba(42,122,58,0.15)', borderColor: Colors.teal },
  ladderName: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  ladderXp: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },

  emptyText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  sessionDivider: { borderBottomWidth: 1, borderBottomColor: Colors.darkBorder },
  sessionSurah: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  sessionDate: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  sessionAccuracy: { fontFamily: 'Raleway_700Bold', fontSize: 16 },
  sessionXp: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.gold, minWidth: 50, textAlign: 'right' },
});
