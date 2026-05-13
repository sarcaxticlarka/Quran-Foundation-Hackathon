import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { useStreak } from '../../src/hooks/useStreak';
import { useReviewStore } from '../../src/stores/reviewStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Islamic circular progress ────────────────────────────────────────────────

function IslamicProgressRing({ pct }: { pct: number }) {
  const clr = pct >= 100 ? Colors.teal : pct >= 60 ? Colors.gold : Colors.coral;
  const label = pct >= 100 ? 'مكتمل' : pct >= 50 ? 'في التقدم' : 'ابدأ اليوم';
  const subEn = pct >= 100 ? 'Completed' : pct >= 50 ? 'In Progress' : 'Start Today';

  // Ornamental corner stars
  const starPositions = [
    { top: -6, left: -6 }, { top: -6, right: -6 },
    { bottom: -6, left: -6 }, { bottom: -6, right: -6 },
  ];

  return (
    <View style={ring.wrap}>
      {/* Outer ornamental ring */}
      <View style={[ring.outerRing, { borderColor: clr + '33' }]}>
        {/* Ornamental dots at cardinal points */}
        {[0, 90, 180, 270].map((deg) => (
          <View
            key={deg}
            style={[
              ring.cardinalDot,
              {
                backgroundColor: clr,
                transform: [
                  { rotate: `${deg}deg` },
                  { translateY: -78 },
                  { rotate: `-${deg}deg` },
                ],
              },
            ]}
          />
        ))}

        {/* Main progress ring */}
        <View style={[ring.mainRing, { borderColor: clr + '44' }]}>
          {/* Filled arc overlay — simple thick border trick */}
          <View style={[ring.fillArc, { borderColor: clr, opacity: 0.9 }]} />

          {/* Inner content */}
          <View style={ring.innerContent}>
            <Text style={[ring.pctNum, { color: clr }]}>{pct}</Text>
            <Text style={[ring.pctSign, { color: clr }]}>%</Text>
          </View>
        </View>
      </View>

      {/* Arabic + English label below */}
      <Text style={[ring.arabicLabel, { color: clr }]}>{label}</Text>
      <Text style={ring.englishLabel}>{subEn}</Text>

      {/* Geometric star corners */}
      {starPositions.map((pos, i) => (
        <View key={i} style={[ring.starDot, pos as any, { backgroundColor: clr + '66' }]} />
      ))}
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingVertical: 12, position: 'relative' },
  outerRing: {
    width: 168, height: 168, borderRadius: 84,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cardinalDot: {
    position: 'absolute', width: 6, height: 6, borderRadius: 3,
    top: '50%', left: '50%', marginLeft: -3, marginTop: -3,
  },
  mainRing: {
    width: 148, height: 148, borderRadius: 74,
    borderWidth: 7, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.darkBg2,
  },
  fillArc: {
    position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 7,
  },
  innerContent: { alignItems: 'center', gap: 0 },
  pctNum: { fontFamily: 'Raleway_700Bold', fontSize: 44, lineHeight: 48 },
  pctSign: { fontFamily: 'Raleway_400Regular', fontSize: 18, marginTop: -4 },
  arabicLabel: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18 },
  englishLabel: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  starDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
});

// ─── Goal bar ─────────────────────────────────────────────────────────────────

function GoalProgressBar({ current, target, color }: { current: number; target: number; color: string }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const bar = StyleSheet.create({
  track: { height: 5, backgroundColor: Colors.darkBg3, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});

// ─── Individual goal card ─────────────────────────────────────────────────────

interface GoalDef {
  id: string;
  icon: IoniconName;
  arabicLabel: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  actionLabel: string;
  actionRoute: string;
}

function GoalCard({ goal }: { goal: GoalDef }) {
  const router = useRouter();
  const pct      = Math.min(Math.round((goal.current / goal.target) * 100), 100);
  const done     = goal.current >= goal.target;

  return (
    <Card
      variant="bordered"
      padding="md"
      style={[gc.card, done && { borderColor: goal.color + '44' }]}
    >
      <View style={gc.topRow}>
        {/* Icon */}
        <View style={[gc.iconWrap, { backgroundColor: goal.color + '22' }]}>
          {done
            ? <Ionicons name="checkmark-circle" size={22} color={goal.color} />
            : <Ionicons name={goal.icon} size={20} color={goal.color} />}
        </View>

        {/* Labels */}
        <View style={gc.labelBlock}>
          <View style={gc.labelRow}>
            <Text style={gc.arabicLabel}>{goal.arabicLabel}</Text>
            {done && (
              <View style={[gc.donePill, { backgroundColor: goal.color + '22' }]}>
                <Text style={[gc.donePillText, { color: goal.color }]}>مكتمل ✓</Text>
              </View>
            )}
          </View>
          <Text style={gc.label}>{goal.label}</Text>
        </View>

        {/* Percentage */}
        <Text style={[gc.pct, { color: goal.color }]}>{pct}%</Text>
      </View>

      {/* Progress bar */}
      <GoalProgressBar current={goal.current} target={goal.target} color={goal.color} />

      {/* Count row */}
      <View style={gc.bottomRow}>
        <Text style={gc.countText}>
          {goal.current} / {goal.target} {goal.unit}
        </Text>
        {!done ? (
          <TouchableOpacity
            style={[gc.actionBtn, { borderColor: goal.color + '66', backgroundColor: goal.color + '11' }]}
            onPress={() => router.push(goal.actionRoute as any)}
            activeOpacity={0.8}
          >
            <Text style={[gc.actionBtnText, { color: goal.color }]}>{goal.actionLabel}</Text>
            <Ionicons name="arrow-forward" size={12} color={goal.color} />
          </TouchableOpacity>
        ) : (
          <Text style={[gc.completedNote, { color: goal.color }]}>
            {goal.current > goal.target
              ? `+${goal.current - goal.target} bonus`
              : 'Well done!'}
          </Text>
        )}
      </View>
    </Card>
  );
}

const gc = StyleSheet.create({
  card: { gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  labelBlock: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arabicLabel: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 16, color: Colors.gold },
  donePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  donePillText: { fontFamily: 'Raleway_700Bold', fontSize: 10, letterSpacing: 0.5 },
  label: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  pct: { fontFamily: 'Raleway_700Bold', fontSize: 20 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  actionBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 12 },
  completedNote: { fontFamily: 'Raleway_600SemiBold', fontSize: 12 },
});

// ─── Week overview ─────────────────────────────────────────────────────────────

function WeekOverview({ history }: { history: Record<string, { completed: boolean; versesRead: number }> }) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key  = d.toISOString().split('T')[0];
      const day  = history[key];
      const isToday = i === 6;
      return {
        key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        completed: day?.completed ?? false,
        isToday,
        verses: day?.versesRead ?? 0,
      };
    });
  }, [history]);

  return (
    <View style={week.row}>
      {days.map((d) => (
        <View key={d.key} style={week.col}>
          <View style={[
            week.circle,
            d.completed && week.circleDone,
            d.isToday && !d.completed && week.circleToday,
          ]}>
            {d.completed
              ? <Ionicons name="checkmark" size={13} color={Colors.darkBg} />
              : <Text style={week.dash}>{d.isToday ? '·' : '-'}</Text>}
          </View>
          <Text style={[week.label, d.isToday && { color: Colors.gold }]}>{d.label}</Text>
          {d.verses > 0 && <Text style={week.verses}>{d.verses}v</Text>}
        </View>
      ))}
    </View>
  );
}

const week = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 4 },
  circle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  circleDone: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  circleToday: { borderColor: Colors.gold, borderWidth: 2 },
  dash: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  label: { fontFamily: 'Raleway_600SemiBold', fontSize: 10, color: Colors.textMuted },
  verses: { fontFamily: 'Raleway_400Regular', fontSize: 9, color: Colors.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const router = useRouter();
  const { todayActivity, history } = useStreak();
  const dueCount     = useReviewStore((s) => s.getDueCount());
  const todayReviewed = useReviewStore((s) => s.todayReviewed);

  const GOALS: GoalDef[] = [
    {
      id: 'verses',
      icon: 'book-outline',
      arabicLabel: 'تلاوة',
      label: 'Verses Read',
      current: todayActivity.versesRead,
      target: 10,
      unit: 'verses',
      color: Colors.gold,
      actionLabel: 'Read Now',
      actionRoute: '/quran/surah/1',
    },
    {
      id: 'review',
      icon: 'school-outline',
      arabicLabel: 'مراجعة',
      label: 'Cards Reviewed',
      current: todayReviewed,
      target: 10,
      unit: 'cards',
      color: Colors.purple,
      actionLabel: `Review (${dueCount} due)`,
      actionRoute: '/profile/review/queue',
    },
    {
      id: 'dhikr',
      icon: 'heart-outline',
      arabicLabel: 'ذكر',
      label: 'Dhikr Done',
      current: todayActivity.dhikrCount,
      target: 33,
      unit: 'times',
      color: Colors.teal,
      actionLabel: 'Begin Dhikr',
      actionRoute: '/dashboard/session',
    },
    {
      id: 'time',
      icon: 'time-outline',
      arabicLabel: 'وقت',
      label: 'Active Minutes',
      current: todayActivity.minutesActive,
      target: 20,
      unit: 'minutes',
      color: Colors.blue,
      actionLabel: 'Complete Session',
      actionRoute: '/dashboard/session',
    },
  ];

  const totalPct = useMemo(() => {
    const avg = GOALS.reduce((sum, g) => sum + Math.min(g.current / g.target, 1), 0) / GOALS.length;
    return Math.round(avg * 100);
  }, [GOALS]);

  const completedCount = GOALS.filter((g) => g.current >= g.target).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Goals</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero progress card */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Geometric corner ornaments */}
          <View style={[styles.cornerOrnament, { top: 12, left: 12 }]} />
          <View style={[styles.cornerOrnament, { top: 12, right: 12 }]} />
          <View style={[styles.cornerOrnament, { bottom: 12, left: 12 }]} />
          <View style={[styles.cornerOrnament, { bottom: 12, right: 12 }]} />

          <IslamicProgressRing pct={totalPct} />

          {/* Goal summary pills */}
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.teal} />
              <Text style={styles.pillText}>{completedCount}/{GOALS.length} completed</Text>
            </View>
            <View style={styles.pillDivider} />
            <View style={styles.pill}>
              <Ionicons name="flame" size={13} color={Colors.gold} />
              <Text style={styles.pillText}>Today's session</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Goal cards */}
        <Text style={styles.sectionTitle}>أهداف اليوم  ·  Today's Goals</Text>
        {GOALS.map((goal) => <GoalCard key={goal.id} goal={goal} />)}

        {/* Week overview */}
        <Card variant="bordered" padding="md" style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.sectionTitle}>هذا الأسبوع  ·  This Week</Text>
          </View>
          <WeekOverview history={history} />
        </Card>

        {/* Motivational Islamic tip */}
        <Card variant="bordered" padding="md" style={styles.tipCard}>
          <View style={styles.tipIconRow}>
            <View style={styles.tipIconWrap}>
              <Text style={styles.tipStar}>☽</Text>
            </View>
            <Text style={styles.tipTitle}>من السنة</Text>
          </View>
          <Text style={styles.tipArabic}>
            "خير الأعمال أدومها وإن قلّ"
          </Text>
          <Text style={styles.tipTranslation}>
            "The best deeds are those done consistently, even if they are small."
          </Text>
          <Text style={styles.tipSource}>— Bukhari & Muslim</Text>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },

  heroCard: {
    borderRadius: 22, padding: 24, alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)',
    overflow: 'hidden', position: 'relative',
  },
  cornerOrnament: {
    position: 'absolute', width: 18, height: 18,
    borderColor: 'rgba(201,164,86,0.3)',
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderTopLeftRadius: 4,
  },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  pillText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.textMuted },
  pillDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)' },

  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 17, color: Colors.textPrimary },
  weekCard: { gap: 14 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  tipCard: { gap: 10 },
  tipIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  tipStar: { fontSize: 18, color: Colors.gold },
  tipTitle: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.gold },
  tipArabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 20, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 32,
  },
  tipTranslation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  tipSource: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
});
