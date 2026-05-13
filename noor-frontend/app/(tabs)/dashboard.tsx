import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/theme/colors';
import { useStreak } from '../../src/hooks/useStreak';
import { useReview } from '../../src/hooks/useReview';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { HeatmapChart } from '../../src/components/dashboard/HeatmapChart';
import { GrowthRings } from '../../src/components/dashboard/GrowthRings';
import { StreakTimeline } from '../../src/components/dashboard/StreakTimeline';

const { width } = Dimensions.get('window');

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return h >= 100 ? `${h}h` : `${h}h ${mins % 60}m`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { currentStreak, longestStreak, heatmapData, last7Days, history } = useStreak();
  const { dueCount, retention, totalReviewed } = useReview();

  const totalVersesRead = React.useMemo(
    () => Object.values(history).reduce((sum, d) => sum + d.versesRead, 0),
    [history],
  );
  const totalDhikr = React.useMemo(
    () => Object.values(history).reduce((sum, d) => sum + d.dhikrCount, 0),
    [history],
  );
  const totalMinutes = React.useMemo(
    () => Object.values(history).reduce((sum, d) => sum + d.minutesActive, 0),
    [history],
  );

  const STATS: { icon: IoniconName; value: string; label: string; color: string }[] = [
    { icon: 'book-outline',  value: formatCount(totalVersesRead), label: 'Verses Read', color: Colors.gold      },
    { icon: 'flame',         value: String(longestStreak),        label: 'Best Streak', color: Colors.coral     },
    { icon: 'heart-outline', value: formatCount(totalDhikr),      label: 'Dhikr Done',  color: Colors.purple    },
    { icon: 'time-outline',  value: formatMinutes(totalMinutes),  label: 'Total Time',  color: Colors.tealLight },
  ];

  const growthRings = [
    { label: 'Recitation', value: 72,       color: Colors.gold      },
    { label: 'Review',     value: retention, color: Colors.tealLight },
    { label: 'Dhikr',      value: 55,        color: Colors.purple    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.heading}>My Growth</Text>
          <TouchableOpacity style={styles.goalsBtn} onPress={() => router.push('/dashboard/goals')}>
            <Text style={styles.goalsBtnText}>Goals</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {/* ── Streak Hero ── */}
        <LinearGradient
          colors={['#1C4A28', '#122E1A', '#0D2415']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Left: streak number + labels */}
          <View style={styles.heroLeft}>
            <View style={styles.streakNumRow}>
              <Text style={styles.streakNum}>{currentStreak}</Text>
              <View style={styles.streakFlameWrap}>
                <Ionicons name="flame" size={28} color={Colors.gold} />
              </View>
            </View>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <View style={styles.bestRow}>
              <Ionicons name="trophy-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.streakBest}>Best: {longestStreak} days</Text>
            </View>

            {/* Mini stat pills */}
            <View style={styles.miniStats}>
              <View style={styles.miniPill}>
                <Ionicons name="school-outline" size={11} color={Colors.tealLight} />
                <Text style={styles.miniPillText}>{retention}% retention</Text>
              </View>
              <View style={styles.miniPill}>
                <Ionicons name="layers-outline" size={11} color={Colors.gold} />
                <Text style={styles.miniPillText}>{dueCount} due</Text>
              </View>
            </View>
          </View>

          {/* Right: growth rings */}
          <View style={styles.heroRight}>
            <GrowthRings rings={growthRings} size={140} />
          </View>

          {/* Bottom divider + ring legend */}
          <View style={styles.heroLegend}>
            {growthRings.map((r) => (
              <View key={r.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: r.color }]} />
                <Text style={styles.legendLabel}>{r.label}</Text>
                <Text style={styles.legendVal}>{r.value}%</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── This Week ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <Card variant="bordered" padding="md">
            <StreakTimeline days={last7Days} />
          </Card>
        </View>

        {/* ── Heatmap ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Activity Heatmap</Text>
            <Badge label="1 Year" variant="muted" />
          </View>
          <Card variant="bordered" padding="md">
            <HeatmapChart data={heatmapData} weeks={17} />
          </Card>
        </View>

        {/* ── Key Metrics ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            {STATS.map((stat) => (
              <Card key={stat.label} variant="bordered" padding="md" style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: `${stat.color}18` }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* ── Spiritual Identity ── */}
        <TouchableOpacity onPress={() => router.push('/profile/identity')} activeOpacity={0.85}>
          <Card variant="gold" padding="md">
            <View style={styles.identityRow}>
              <View style={styles.identityIconWrap}>
                <Ionicons name="search-outline" size={26} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.identityTitle}>Your Spiritual Identity</Text>
                <Text style={styles.identitySubtitle}>The Seeker · الطالب</Text>
                <Text style={styles.identityDesc}>
                  Your reflections show a pattern of seeking knowledge and understanding.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.goldDim} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* ── Review CTA ── */}
        {dueCount > 0 && (
          <TouchableOpacity onPress={() => router.push('/profile/review/queue')} style={styles.reviewCta} activeOpacity={0.85}>
            <View style={styles.reviewCtaLeft}>
              <Ionicons name="school" size={16} color={Colors.tealLight} />
              <Text style={styles.reviewCtaText}>
                {dueCount} verse{dueCount !== 1 ? 's' : ''} ready for review
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.tealLight} />
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 },
  heading: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 32, color: Colors.textPrimary },
  goalsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalsBtnText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },

  // Hero card
  heroCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,164,86,0.2)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroLeft: { flex: 1, minWidth: 140, gap: 6 },
  streakNumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  streakNum: {
    fontFamily: 'Raleway_700Bold',
    fontSize: 72,
    color: Colors.gold,
    lineHeight: 76,
    letterSpacing: -2,
  },
  streakFlameWrap: {
    paddingBottom: 12,
  },
  streakLabel: {
    fontFamily: 'Raleway_700Bold',
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakBest: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  miniStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  miniPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  miniPillText: { fontFamily: 'Raleway_600SemiBold', fontSize: 10, color: Colors.textMuted },

  heroRight: { alignItems: 'center', justifyContent: 'center' },

  heroLegend: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,164,86,0.15)',
    paddingTop: 14,
    marginTop: 4,
  },
  legendItem: { alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: 'Raleway_400Regular', fontSize: 10, color: Colors.textMuted },
  legendVal: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textSecondary },

  section: { gap: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.textPrimary },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', flex: 1, minWidth: '47%', alignItems: 'center', gap: 8, paddingVertical: 18 },
  statIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: 'Raleway_700Bold', fontSize: 24, color: Colors.textPrimary },
  statLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  identityTitle: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.gold, marginBottom: 3 },
  identitySubtitle: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 5 },
  identityDesc: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  reviewCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(42,122,58,0.12)', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18,
    borderWidth: 1, borderColor: 'rgba(42,122,58,0.3)',
  },
  reviewCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewCtaText: { fontFamily: 'Raleway_600SemiBold', color: Colors.tealLight, fontSize: 14 },
});
