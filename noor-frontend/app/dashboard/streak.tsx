import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { useStreak } from '../../src/hooks/useStreak';
import { Card } from '../../src/components/ui/Card';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function cellColor(value: number): string {
  if (value >= 4) return Colors.gold;
  if (value >= 3) return `${Colors.gold}B0`;
  if (value >= 2) return `${Colors.gold}70`;
  if (value >= 1) return `${Colors.gold}40`;
  return Colors.darkBg3;
}

function CalendarHeatmap({ heatmapData }: { heatmapData: { date: string; value: number }[] }) {
  const today = new Date();
  const cells = useMemo(() => {
    const map: Record<string, number> = {};
    for (const { date, value } of heatmapData) map[date] = value;

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (34 - i));
      const key = d.toISOString().split('T')[0];
      return { key, value: map[key] ?? 0 };
    });
  }, [heatmapData]);

  return (
    <View style={heatStyles.grid}>
      {cells.map((cell, i) => (
        <View key={i} style={[heatStyles.cell, { backgroundColor: cellColor(cell.value) }, cell.value > 0 && heatStyles.activeCell]} />
      ))}
    </View>
  );
}

const heatStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: Colors.darkBorder },
  activeCell: { borderColor: `${Colors.gold}66` },
});

export default function StreakDetailScreen() {
  const router = useRouter();
  const { currentStreak, longestStreak, last7Days, history, heatmapData } = useStreak();

  const thisMonthDays = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 7);
    return Object.entries(history).filter(([date, day]) => date.startsWith(prefix) && day.completed).length;
  }, [history]);

  const totalVersesRead = useMemo(
    () => Object.values(history).reduce((sum, d) => sum + d.versesRead, 0),
    [history],
  );

  const totalDhikr = useMemo(
    () => Object.values(history).reduce((sum, d) => sum + d.dhikrCount, 0),
    [history],
  );

  const totalMinutes = useMemo(
    () => Object.values(history).reduce((sum, d) => sum + d.minutesActive, 0),
    [history],
  );

  const STATS = [
    { label: 'Current Streak', value: `${currentStreak}`, unit: 'days',       color: Colors.coral  },
    { label: 'Longest Streak', value: `${longestStreak}`, unit: 'days',       color: Colors.gold   },
    { label: 'This Month',     value: `${thisMonthDays}`, unit: 'days active', color: Colors.teal   },
    { label: 'Verses Read',    value: `${totalVersesRead}`, unit: 'total',    color: Colors.purple },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streak Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card variant="gold" padding="lg" style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="flame" size={44} color={Colors.gold} />
          </View>
          <Text style={styles.heroNumber}>{currentStreak}</Text>
          <Text style={styles.heroLabel}>Day Streak</Text>
          <Text style={styles.heroSub}>Keep reading daily to maintain your streak</Text>
        </Card>

        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <Card key={s.label} variant="bordered" padding="md" style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statUnit}>{s.unit}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Reading Activity — Last 35 Days</Text>
          <CalendarHeatmap heatmapData={heatmapData} />
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {[Colors.darkBg3, `${Colors.gold}40`, `${Colors.gold}70`, `${Colors.gold}B0`, Colors.gold].map((c, i) => (
              <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </Card>

        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          <View style={styles.weekRow}>
            {last7Days.map((day, i) => {
              const dayOfWeek = new Date(day.date + 'T12:00:00').getDay();
              return (
                <View key={i} style={styles.dayCol}>
                  <View style={[styles.dayDot, day.completed && styles.dayDotActive]}>
                    {day.completed && <Ionicons name="checkmark" size={14} color={Colors.darkBg} />}
                  </View>
                  <Text style={styles.dayLabel}>{DAY_LABELS[dayOfWeek]}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Lifetime Stats</Text>
          <View style={styles.lifetimeGrid}>
            <View style={styles.lifetimeStat}>
              <Ionicons name="heart-outline" size={18} color={Colors.purple} />
              <Text style={styles.lifetimeValue}>{totalDhikr > 999 ? `${(totalDhikr / 1000).toFixed(1)}K` : totalDhikr}</Text>
              <Text style={styles.lifetimeLabel}>Dhikr Done</Text>
            </View>
            <View style={styles.lifetimeDivider} />
            <View style={styles.lifetimeStat}>
              <Ionicons name="time-outline" size={18} color={Colors.tealLight} />
              <Text style={styles.lifetimeValue}>
                {totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`}
              </Text>
              <Text style={styles.lifetimeLabel}>Time Spent</Text>
            </View>
            <View style={styles.lifetimeDivider} />
            <View style={styles.lifetimeStat}>
              <Ionicons name="book-outline" size={18} color={Colors.gold} />
              <Text style={styles.lifetimeValue}>{Object.keys(history).length}</Text>
              <Text style={styles.lifetimeLabel}>Days Active</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16 },
  heroCard: { alignItems: 'center', gap: 6 },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold + '66',
  },
  heroNumber: { fontFamily: 'Raleway_700Bold', fontSize: 64, color: Colors.goldLight, lineHeight: 72 },
  heroLabel: { fontFamily: 'Raleway_700Bold', fontSize: 18, color: Colors.gold },
  heroSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'Raleway_700Bold', fontSize: 28 },
  statUnit: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  statLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' },
  legendText: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  dayDotActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  dayLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.textMuted },
  lifetimeGrid: { flexDirection: 'row', alignItems: 'center' },
  lifetimeStat: { flex: 1, alignItems: 'center', gap: 6 },
  lifetimeDivider: { width: 1, height: 50, backgroundColor: Colors.darkBorder },
  lifetimeValue: { fontFamily: 'Raleway_700Bold', fontSize: 20, color: Colors.textPrimary },
  lifetimeLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
});
