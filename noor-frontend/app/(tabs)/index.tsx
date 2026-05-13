import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl, ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { useStreak } from '../../src/hooks/useStreak';
import { useVerseOfDay, getFirstTranslation, useSurahs } from '../../src/hooks/useQuran';
import { useReviewStore } from '../../src/stores/reviewStore';

// Goal → destination route when tapped
const GOAL_ROUTES: Record<string, string> = {
  'Verses Read':    '/quran/surah/1',
  'Cards Reviewed': '/profile/review/queue',
  'Dhikr Count':    '/dashboard/session',
};
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { VerseCard } from '../../src/components/quran/VerseCard';
import { StreakTimeline } from '../../src/components/dashboard/StreakTimeline';
import { groqAI } from '../../src/services/groqAI';
import { useGlobalAudio } from '../../src/contexts/AudioContext';
import { audioApi } from '../../src/services/audioApi';
import { useSavedStore } from '../../src/stores/savedStore';
import { useEngagementStore, type FeatureKey } from '../../src/stores/engagementStore';
import { PrayerTimesWidget } from '../../src/components/PrayerTimesWidget';
import { usePrayerTimes } from '../../src/hooks/usePrayerTimes';

// Category config for Today in Islam card
const CATEGORY_CONFIG = {
  history: { icon: 'time-outline' as const,        color: Colors.amber,     label: 'Islamic History'  },
  sunnah:  { icon: 'moon-outline' as const,         color: Colors.teal,      label: 'Sunnah'           },
  dua:     { icon: 'hand-left-outline' as const,    color: Colors.purple,    label: 'Dua of the Day'   },
  wisdom:  { icon: 'star-outline' as const,         color: Colors.gold,      label: 'Islamic Wisdom'   },
};

// ─── Today in Islam card ──────────────────────────────────────────────────────

function TodayInIslamCard() {
  const today = new Date().toISOString().split('T')[0];
  const qc = useQueryClient();

  // Pull dominant theme from cached identity — biases the daily insight toward user's spiritual focus
  const savedVerses = useSavedStore((s) => s.verses);
  const cacheKey = savedVerses.map((v) => v.verseKey).sort().join(',');
  const cachedIdentity = qc.getQueryData<{ dominantTheme: string }>(['quranic-identity', cacheKey]);
  const dominantTheme = cachedIdentity?.dominantTheme;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['daily-islamic-insight', today, dominantTheme ?? ''],
    queryFn: () => groqAI.getDailyIslamicInsight(today, dominantTheme),
    staleTime: Infinity,   // keyed by date — never re-fetch same day
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card variant="bordered" padding="lg" style={insight.loadCard}>
        <ActivityIndicator size="small" color={Colors.gold} />
        <Text style={insight.loadText}>Discovering today in Islam…</Text>
      </Card>
    );
  }

  if (isError || !data) return null;

  const cfg = CATEGORY_CONFIG[data.category] ?? CATEGORY_CONFIG.wisdom;

  return (
    <View style={insight.card}>
      {/* Gradient border effect */}
      <LinearGradient
        colors={[cfg.color + '55', cfg.color + '11', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={insight.gradientBorder}
      />
      <View style={insight.inner}>
        <View style={insight.topRow}>
          <View style={[insight.iconWrap, { backgroundColor: cfg.color + '22' }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          </View>
          <View style={insight.meta}>
            <Text style={[insight.categoryLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={insight.dateLabel}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={[insight.dot, { backgroundColor: cfg.color }]} />
        </View>

        <Text style={insight.title}>{data.title}</Text>
        <Text style={insight.body}>{data.body}</Text>

        {data.arabicText && (
          <View style={[insight.arabicBlock, { borderLeftColor: cfg.color + '66' }]}>
            <Text style={insight.arabic}>{data.arabicText}</Text>
          </View>
        )}

        {(data.source || data.verseKey) && (
          <Text style={insight.source}>
            {[data.source, data.verseKey ? `Quran ${data.verseKey}` : null].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
    </View>
  );
}

const insight = StyleSheet.create({
  card: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.darkBorder,
    backgroundColor: Colors.darkBg2,
  },
  gradientBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  inner: { padding: 18, gap: 10 },
  loadCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20 },
  loadText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1 },
  categoryLabel: { fontFamily: 'Raleway_700Bold', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  dateLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 20, color: Colors.textPrimary, lineHeight: 26 },
  body: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  arabicBlock: { borderLeftWidth: 2, paddingLeft: 12 },
  arabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 20, color: Colors.goldLight, lineHeight: 32, textAlign: 'right', writingDirection: 'rtl' },
  source: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },
});

// ─── Streak break recovery card ──────────────────────────────────────────────

function StreakBreakCard({ longestStreak, onStart }: { longestStreak: number; onStart: () => void }) {
  return (
    <Card variant="bordered" padding="md" style={breakStyle.card}>
      <View style={breakStyle.row}>
        <View style={breakStyle.iconWrap}>
          <Ionicons name="refresh-outline" size={20} color={Colors.coral} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={breakStyle.title}>Your streak broke</Text>
          <Text style={breakStyle.sub}>
            Your best was {longestStreak} day{longestStreak !== 1 ? 's' : ''} — every new streak starts today.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={breakStyle.btn} onPress={onStart} activeOpacity={0.8}>
        <Ionicons name="flame-outline" size={14} color={Colors.coral} />
        <Text style={breakStyle.btnText}>Restart my streak</Text>
      </TouchableOpacity>
    </Card>
  );
}

const breakStyle = StyleSheet.create({
  card: { borderColor: 'rgba(224,85,85,0.3)', backgroundColor: 'rgba(224,85,85,0.05)', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, flexShrink: 0,
    backgroundColor: 'rgba(224,85,85,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.coral },
  sub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(224,85,85,0.4)', borderRadius: 10, paddingVertical: 10,
  },
  btnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.coral },
});

// ─── Streak personality card ──────────────────────────────────────────────────

function StreakPersonalityCard({ streakDays, savedVerses, qc }: {
  streakDays: number;
  savedVerses: Array<{ verseKey: string }>;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const cacheKey = savedVerses.map((v) => v.verseKey).sort().join(',');
  const cachedIdentity = qc.getQueryData<{ dominantTheme: string }>(['quranic-identity', cacheKey]);
  const dominantTheme = cachedIdentity?.dominantTheme ?? 'Mercy';

  const { data } = useQuery({
    queryKey: ['streak-personality', streakDays, dominantTheme],
    queryFn: () => groqAI.getStreakPersonality(streakDays, dominantTheme),
    staleTime: 1000 * 60 * 60 * 12,
    retry: 1,
  });

  if (!data) return null;

  return (
    <Card variant="bordered" padding="md" style={streakPersonStyle.card}>
      <View style={streakPersonStyle.row}>
        <Ionicons name="ribbon-outline" size={18} color={Colors.gold} />
        <Text style={streakPersonStyle.title}>{data.title}</Text>
      </View>
      <Text style={streakPersonStyle.insight}>{data.insight}</Text>
    </Card>
  );
}

const streakPersonStyle = StyleSheet.create({
  card: { borderColor: Colors.gold + '44', backgroundColor: Colors.gold + '08', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 18, color: Colors.gold },
  insight: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
});

type StreakDay = { date: string; completed: boolean };

function StreakDayModal({
  day,
  onClose,
  onStartSession,
  onMarkVerseRead,
}: {
  day: StreakDay | null;
  onClose: () => void;
  onStartSession: () => void;
  onMarkVerseRead: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = day?.date === today;
  const date = day ? new Date(`${day.date}T12:00:00`) : null;
  const dateLabel = date
    ? date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';
  const status = day?.completed
    ? {
        icon: 'checkmark-circle' as const,
        title: 'Streak Secured',
        subtitle: 'This day is already locked into your Noor journey.',
        accent: Colors.teal,
      }
    : isToday
      ? {
          icon: 'flame' as const,
          title: 'Complete Today',
          subtitle: 'Read a verse or start a short session to keep your streak alive.',
          accent: Colors.gold,
        }
      : {
          icon: 'calendar-outline' as const,
          title: 'Past Date',
          subtitle: 'Only today can be completed. Return now and secure the current day.',
          accent: Colors.coral,
        };

  return (
    <Modal transparent visible={!!day} animationType="fade" onRequestClose={onClose}>
      <Pressable style={streakModal.overlay} onPress={onClose}>
        <Pressable style={streakModal.sheet} onPress={(event) => event.stopPropagation()}>
          <LinearGradient
            colors={['#1B4B29', '#102B19', '#0A1D11']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={streakModal.inner}
          >
            <View style={streakModal.topRow}>
              <View style={[streakModal.iconHalo, { borderColor: status.accent + '66', backgroundColor: status.accent + '18' }]}>
                <Ionicons name={status.icon} size={30} color={status.accent} />
              </View>
              <TouchableOpacity onPress={onClose} style={streakModal.closeBtn}>
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={streakModal.kicker}>{dateLabel}</Text>
            <Text style={streakModal.title}>{status.title}</Text>
            <Text style={streakModal.subtitle}>{status.subtitle}</Text>

            <View style={streakModal.statsRow}>
              <View style={streakModal.statPill}>
                <Ionicons name="sparkles-outline" size={14} color={Colors.gold} />
                <Text style={streakModal.statText}>{day?.completed ? 'Completed' : isToday ? 'Due today' : 'Missed'}</Text>
              </View>
              <View style={streakModal.statPill}>
                <Ionicons name="book-outline" size={14} color={Colors.gold} />
                <Text style={streakModal.statText}>Quran habit</Text>
              </View>
            </View>

            {isToday && !day?.completed ? (
              <View style={streakModal.actions}>
                <TouchableOpacity style={streakModal.primaryBtn} onPress={onStartSession} activeOpacity={0.85}>
                  <Ionicons name="play-circle" size={18} color={Colors.darkBg} />
                  <Text style={streakModal.primaryBtnText}>Start Session</Text>
                </TouchableOpacity>
                <TouchableOpacity style={streakModal.secondaryBtn} onPress={onMarkVerseRead} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.gold} />
                  <Text style={streakModal.secondaryBtnText}>Mark Verse Read</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={streakModal.primaryBtn} onPress={onClose} activeOpacity={0.85}>
                <Ionicons name="arrow-back" size={18} color={Colors.darkBg} />
                <Text style={streakModal.primaryBtnText}>Back to Home</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const streakModal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    padding: 22,
  },
  sheet: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    shadowColor: Colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  inner: { padding: 22, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  iconHalo: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.darkBg3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  kicker: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 30, color: Colors.textPrimary, lineHeight: 34 },
  subtitle: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold + '12', borderRadius: 999,
    borderWidth: 1, borderColor: Colors.gold + '2F',
    paddingHorizontal: 11, paddingVertical: 7,
  },
  statText: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.goldLight },
  actions: { gap: 10, marginTop: 2 },
  primaryBtn: {
    minHeight: 50, borderRadius: 15, backgroundColor: Colors.gold,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
  secondaryBtn: {
    minHeight: 50, borderRadius: 15, backgroundColor: Colors.gold + '12',
    borderWidth: 1, borderColor: Colors.gold + '44',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.gold },
});

function getGreetingName(name?: string | null, email?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.includes('@')) {
    return 'Friend';
  }
  return trimmed.split(/\s+/)[0];
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { currentStreak, longestStreak, last7Days, isOnStreak, recordVerseRead, todayActivity } = useStreak();
  const dueCount = useReviewStore((s) => s.getDueCount());
  const { getOrderedFeatures, recordTap } = useEngagementStore();

  const goals = [
    { icon: 'book-outline' as const,   label: 'Verses Read',    current: todayActivity.versesRead,       target: 10  },
    { icon: 'school-outline' as const, label: 'Cards Reviewed', current: todayActivity.reviewsCompleted, target: 20  },
    { icon: 'heart-outline' as const,  label: 'Dhikr Count',    current: todayActivity.dhikrCount,       target: 33  },
  ];

  const ACTION_MAP: Record<FeatureKey, { icon: any; route: string; badge: string | null }> = {
    Recite:   { icon: 'book-outline',     route: '/community/recite',     badge: null },
    Review:   { icon: 'school-outline',   route: '/profile/review/queue', badge: dueCount > 0 ? `${dueCount} due` : null },
    Explore:  { icon: 'compass-outline',  route: '/explore/graph',         badge: null },
    Journal:  { icon: 'create-outline',   route: '/profile/journal',       badge: null },
    Halaqa:   { icon: 'people-outline',   route: '/community/halaqa',      badge: null },
    Settings: { icon: 'settings-outline', route: '/settings',              badge: null },
  };

  const QUICK_ACTIONS = getOrderedFeatures().map((label) => ({
    label,
    ...ACTION_MAP[label],
  }));

  const qc = useQueryClient();
  const savedVerses = useSavedStore((s) => s.verses);
  const { currentInfo: prayerInfo, permissionStatus } = usePrayerTimes();
  const { data: verseOfDay, isLoading: verseLoading, refetch: refetchVerse } = useVerseOfDay();
  const { data: surahs } = useSurahs();
  const audio = useGlobalAudio();
  const vodAudioKey = verseOfDay ? `verse-${verseOfDay.verse_key}` : null;
  const vodIsPlaying = audio.currentKey === vodAudioKey && audio.isPlaying;
  const vodIsLoading = audio.currentKey === vodAudioKey && audio.isLoading;
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedStreakDay, setSelectedStreakDay] = React.useState<StreakDay | null>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8,   useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = async () => { setRefreshing(true); await refetchVerse(); setRefreshing(false); };

  const handleStreakDayPress = (day: { date: string; completed: boolean }) => {
    setSelectedStreakDay(day);
  };

  const { greeting, prayerSlot } = (() => {
    // Use real prayer data when available, fall back to hour-based approximation
    if (prayerInfo) {
      const greetMap: Record<string, string> = {
        Fajr: 'السلام عليكم', Sunrise: 'باركك الله', Dhuhr: 'باركك الله',
        Asr: 'باركك الله', Maghrib: 'مساء الخير', Isha: 'ليلة مباركة',
      };
      return {
        greeting: greetMap[prayerInfo.current] ?? 'السلام عليكم',
        prayerSlot: prayerInfo.timeLabel,
      };
    }
    const h = new Date().getHours();
    if (h >= 4 && h < 7)   return { greeting: 'السلام عليكم',  prayerSlot: 'Fajr time — the best start to the day' };
    if (h >= 7 && h < 12)  return { greeting: 'باركك الله',    prayerSlot: 'Good morning — Duha is a blessed time to read' };
    if (h >= 12 && h < 14) return { greeting: 'باركك الله',    prayerSlot: 'Dhuhr time — a moment of midday remembrance' };
    if (h >= 14 && h < 17) return { greeting: 'باركك الله',    prayerSlot: 'Afternoon — Asr approaches, read before it' };
    if (h >= 17 && h < 20) return { greeting: 'مساء الخير',    prayerSlot: 'Maghrib time — reflect as the day closes' };
    if (h >= 20 && h < 23) return { greeting: 'ليلة مباركة',   prayerSlot: 'Isha time — end your day with the Quran' };
    return { greeting: 'ليلة مباركة', prayerSlot: 'Late night — the hour of the sincere ones' };
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}>

        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{getGreetingName(user?.name, user?.email)}</Text>
            <Text style={styles.prayerSlot}>{prayerSlot}</Text>
          </View>
          <TouchableOpacity style={styles.crisisBtn} onPress={() => router.push('/crisis/entry')} activeOpacity={0.8}>
            <Ionicons name="moon-outline" size={15} color={Colors.gold} />
            <View>
              <Text style={styles.crisisBtnText}>سكينة</Text>
              <Text style={styles.crisisBtnSub}>Solace</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Streak card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity onPress={() => router.push(isOnStreak ? '/dashboard/streak' : '/dashboard/session')} activeOpacity={0.88}>
            <LinearGradient colors={['#1A4A26', '#142E1C', '#0F2418']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.streakCard}>
              <View style={styles.streakRow}>
                <View style={styles.streakInfo}>
                  <View style={styles.streakIconWrap}><Ionicons name="flame" size={22} color={Colors.gold} /></View>
                  <View>
                    <Text style={styles.streakCount}>{currentStreak} Day Streak</Text>
                    <Text style={styles.streakSub}>{isOnStreak ? 'Completed today · Keep it going!' : "Complete today's session"}</Text>
                  </View>
                </View>
                {!isOnStreak && <Badge label="Due" variant="coral" dot />}
              </View>
              {!isOnStreak && (
                <View style={styles.streakHint}>
                  <Ionicons name="hand-left-outline" size={12} color={Colors.gold} />
                  <Text style={styles.streakHintText}>Tap today’s date to complete your streak</Text>
                </View>
              )}
              <StreakTimeline days={last7Days} onDayPress={handleStreakDayPress} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Streak break recovery — shown when streak broke after having one */}
        {currentStreak === 0 && longestStreak > 0 && (
          <StreakBreakCard
            longestStreak={longestStreak}
            onStart={() => router.push('/dashboard/session' as any)}
          />
        )}

        {/* Streak personality — shown after 7+ days */}
        {currentStreak >= 7 && <StreakPersonalityCard streakDays={currentStreak} savedVerses={savedVerses} qc={qc} />}

        {/* Prayer Times — hidden only if explicitly denied and no data */}
        {permissionStatus !== 'denied' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prayer Times</Text>
              {prayerInfo && (
                <View style={styles.nextPrayerChip}>
                  <Ionicons name="time-outline" size={11} color={Colors.gold} />
                  <Text style={styles.nextPrayerChipText}>Next: {prayerInfo.next}</Text>
                </View>
              )}
            </View>
            <PrayerTimesWidget />
          </View>
        )}

        {/* Today in Islam */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today in Islam</Text>
            <Badge label="Daily" variant="gold" />
          </View>
          <TodayInIslamCard />
        </View>

        {/* Verse of the Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verse of the Day</Text>
          </View>
          {verseLoading ? (
            <Card variant="bordered" padding="lg" style={styles.verseLoader}>
              <Text style={styles.verseLoaderText}>Loading verse...</Text>
            </Card>
          ) : verseOfDay ? (
            <VerseCard
              verseKey={verseOfDay.verse_key}
              arabicText={verseOfDay.text_uthmani}
              translation={getFirstTranslation(verseOfDay)}
              surahName={(() => {
                const [surahId] = verseOfDay.verse_key.split(':');
                const surah = surahs?.find((s) => s.id === Number(surahId));
                return surah ? `${surah.name_simple} · ${verseOfDay.verse_key}` : verseOfDay.verse_key;
              })()}
              onPress={() => recordVerseRead()}
              onPlay={async () => {
                if (!verseOfDay || !vodAudioKey) return;
                if (audio.currentKey === vodAudioKey) {
                  await audio.toggle();
                } else {
                  const url = audioApi.buildVerseAudioUrl(verseOfDay.verse_key);
                  const [surahId] = verseOfDay.verse_key.split(':');
                  const surah = surahs?.find((s) => s.id === Number(surahId));
                  const title = surah
                    ? `${surah.name_simple} · ${verseOfDay.verse_key} · Al-Afasy`
                    : `${verseOfDay.verse_key} · Al-Afasy`;
                  await audio.playUrl(url, vodAudioKey, title);
                }
              }}
              isPlaying={vodIsPlaying}
              isAudioLoading={vodIsLoading}
            />
          ) : null}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickCard}
                onPress={() => { recordTap(action.label as FeatureKey); router.push(action.route as any); }}
                activeOpacity={0.75}
              >
                <View style={styles.quickIconWrap}><Ionicons name={action.icon} size={20} color={Colors.gold} /></View>
                <Text style={styles.quickLabel}>{action.label}</Text>
                {action.badge && <Badge label={action.badge} variant="coral" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Goals</Text>
            <TouchableOpacity onPress={() => router.push('/dashboard/goals' as any)} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.gold} />
            </TouchableOpacity>
          </View>
          <Card variant="bordered" padding="md">
            {goals.map((goal, i) => {
              const done  = goal.current >= goal.target;
              const route = GOAL_ROUTES[goal.label];
              const pct   = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <TouchableOpacity
                  key={goal.label}
                  style={[styles.goalRow, i < goals.length - 1 && styles.goalDivider]}
                  onPress={() => !done && route && router.push(route as any)}
                  activeOpacity={done ? 1 : 0.7}
                >
                  <View style={[styles.goalIconWrap, done && styles.goalIconDone]}>
                    <Ionicons
                      name={done ? 'checkmark' : goal.icon}
                      size={15}
                      color={done ? Colors.teal : Colors.gold}
                    />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalProgress}>{goal.current}/{goal.target}</Text>
                  </View>
                  <View style={styles.goalRight}>
                    <View style={styles.goalBarContainer}>
                      <View style={[styles.goalBar, { width: `${pct}%` as any, backgroundColor: done ? Colors.teal : Colors.gold }]} />
                    </View>
                    {!done && <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>

      </ScrollView>
      <StreakDayModal
        day={selectedStreakDay}
        onClose={() => setSelectedStreakDay(null)}
        onStartSession={() => {
          setSelectedStreakDay(null);
          router.push('/dashboard/session' as any);
        }}
        onMarkVerseRead={() => {
          recordVerseRead();
          setSelectedStreakDay(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16 },
  greeting: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 13, letterSpacing: 0.5 },
  userName: { fontFamily: 'CormorantGaramond_700Bold', color: Colors.textPrimary, fontSize: 30, marginTop: 2 },
  prayerSlot: { fontFamily: 'Raleway_400Regular', color: Colors.gold, fontSize: 11, marginTop: 3, opacity: 0.8 },
  crisisBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(201,164,86,0.08)',
  },
  crisisBtnText: { fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.gold, fontSize: 14, lineHeight: 16 },
  crisisBtnSub: { fontFamily: 'Raleway_400Regular', color: Colors.gold, fontSize: 9, opacity: 0.7, letterSpacing: 0.5 },
  streakCard: { borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)', gap: 14 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(201,164,86,0.15)', alignItems: 'center', justifyContent: 'center' },
  streakCount: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.textPrimary },
  streakSub: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  streakHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold + '14', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: Colors.gold + '33' },
  streakHintText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.gold },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: Colors.textPrimary },
  nextPrayerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.gold + '22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold + '44' },
  nextPrayerChipText: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '30%', flex: 1, minWidth: '30%',
    backgroundColor: Colors.darkBg2, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.darkBorder, paddingVertical: 16, alignItems: 'center', gap: 8,
  },
  quickIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.textSecondary },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  goalDivider: { borderBottomWidth: 1, borderBottomColor: Colors.darkBorder },
  goalIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  goalProgress: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  goalRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalBarContainer: { width: 60, height: 3, backgroundColor: Colors.darkBg3, borderRadius: 2, overflow: 'hidden' },
  goalBar: { height: 3, borderRadius: 2 },
  goalIconDone: { backgroundColor: 'rgba(42,122,58,0.15)' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.gold },
  verseLoader: { alignItems: 'center', paddingVertical: 32 },
  verseLoaderText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 13 },
});
