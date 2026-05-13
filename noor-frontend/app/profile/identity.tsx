import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { useSavedStore } from '../../src/stores/savedStore';
import { useReviewStore } from '../../src/stores/reviewStore';
import { groqAI } from '../../src/services/groqAI';

const COLOR_MAP: Record<string, string> = {
  teal:  Colors.teal,
  gold:  Colors.gold,
  coral: Colors.coral,
};

const THEME_ICONS: Record<string, string> = {
  Mercy:       'heart-outline',
  Knowledge:   'book-outline',
  Patience:    'hourglass-outline',
  Gratitude:   'sunny-outline',
  Trust:       'shield-checkmark-outline',
  Hope:        'star-outline',
  Worship:     'home-outline',
  Justice:     'ribbon-outline',
  Remembrance: 'infinite-outline',
  Guidance:    'compass-outline',
};

const MIN_VERSES = 3;

export default function IdentityDetailScreen() {
  const router    = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  const savedVerses = useSavedStore((s) => s.verses);
  const reviewCards = useReviewStore((s) => s.cards);

  // Merge saved verses + review cards into a unified verse list
  const verseEntries = useMemo(() => {
    const map = new Map<string, { verseKey: string; translation: string; repetitions: number }>();

    for (const v of savedVerses) {
      if (v.translation) {
        map.set(v.verseKey, { verseKey: v.verseKey, translation: v.translation, repetitions: 1 });
      }
    }
    for (const c of reviewCards) {
      const existing = map.get(c.verseKey);
      if (existing) {
        existing.repetitions += c.repetitions;
      } else {
        map.set(c.verseKey, { verseKey: c.verseKey, translation: '', repetitions: c.repetitions });
      }
    }

    // Only include entries where we have a translation
    return Array.from(map.values()).filter((e) => e.translation.length > 0);
  }, [savedVerses, reviewCards]);

  const hasEnoughData = verseEntries.length >= MIN_VERSES;

  // Stable cache key — changes only when the set of verse keys changes
  const cacheKey = verseEntries.map((e) => e.verseKey).sort().join(',');

  const { data: identity, isLoading, isError } = useQuery({
    queryKey: ['quranic-identity', cacheKey],
    queryFn: () => groqAI.getQuranicIdentity(verseEntries),
    enabled: hasEnoughData,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    retry: 1,
  });

  useEffect(() => {
    if (identity) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    }
  }, [identity]);

  const primaryColor = identity ? (COLOR_MAP[identity.colorKey] ?? Colors.teal) : Colors.teal;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quranic Identity</Text>
        {identity && (
          <TouchableOpacity onPress={() => router.push('/profile/share' as any)} style={styles.shareHeaderBtn}>
            <Ionicons name="share-outline" size={18} color={Colors.gold} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        )}
        {!identity && <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={styles.loadingTitle}>Analyzing your Quranic journey...</Text>
            <Text style={styles.loadingBody}>
              Groq AI is studying {verseEntries.length} verses you've engaged with to reveal your spiritual identity.
            </Text>
          </View>
        )}

        {/* Not enough data */}
        {!isLoading && !hasEnoughData && (
          <View style={styles.emptyWrap}>
            <Ionicons name="leaf-outline" size={52} color={Colors.teal} />
            <Text style={styles.emptyTitle}>Your identity is forming</Text>
            <Text style={styles.emptyBody}>
              Save at least {MIN_VERSES} verses from the Knowledge Graph or Review Queue to unlock your Quranic Identity profile.
            </Text>
            <View style={styles.progressChip}>
              <Text style={styles.progressChipText}>{verseEntries.length} / {MIN_VERSES} verses saved</Text>
            </View>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/explore/graph' as any)}
            >
              <Text style={styles.exploreBtnText}>Explore Knowledge Graph →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {isError && hasEnoughData && (
          <View style={styles.emptyWrap}>
            <Ionicons name="warning-outline" size={48} color={Colors.coral} />
            <Text style={styles.emptyTitle}>Couldn't analyze right now</Text>
            <Text style={styles.emptyBody}>Check your connection and try again.</Text>
          </View>
        )}

        {/* Identity loaded */}
        {identity && !isLoading && (
          <>
            {/* Primary badge */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <View style={[styles.primaryBadge, { borderColor: primaryColor }]}>
                <View style={[styles.primaryIconWrap, { borderColor: primaryColor + '55', backgroundColor: primaryColor + '22' }]}>
                  <Ionicons
                    name={(THEME_ICONS[identity.dominantTheme] ?? 'sparkles-outline') as any}
                    size={30}
                    color={primaryColor}
                  />
                </View>
                <Text style={[styles.primaryArabic, { color: primaryColor }]}>{identity.arabicName}</Text>
                <Text style={styles.primaryLabel}>{identity.badgeLabel}</Text>
                <Text style={styles.primaryDesc}>{identity.narrative}</Text>
              </View>
            </Animated.View>

            {/* Verse count chip */}
            <View style={styles.dataSourceRow}>
              <Ionicons name="analytics-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.dataSourceText}>
                Based on {verseEntries.length} verse{verseEntries.length === 1 ? '' : 's'} you've saved & reviewed
              </Text>
            </View>

            {/* Theme breakdown */}
            <Text style={styles.sectionTitle}>Your Engagement Profile</Text>
            {identity.themes.map((theme) => {
              const color = COLOR_MAP[theme.colorKey] ?? Colors.gold;
              return (
                <Card key={theme.name} variant="bordered" padding="md" style={styles.badgeCard}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badgeIcon, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.badgeArabic, { color }]}>{theme.arabic}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.badgeLabel}>{theme.name}</Text>
                      <Text style={styles.badgeSub}>{theme.pct}% of your reading</Text>
                    </View>
                    <Text style={[styles.badgePct, { color }]}>{theme.pct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { width: `${theme.pct}%` as any, backgroundColor: color }]} />
                  </View>
                </Card>
              );
            })}

            {/* Hadith */}
            <Card variant="bordered" padding="md" style={styles.hadithCard}>
              <Text style={styles.hadithLabel}>A HADITH FOR YOUR PATH</Text>
              <Text style={styles.hadithText}>{identity.hadith}</Text>
            </Card>

            {/* How it's calculated */}
            <Card variant="bordered" padding="md">
              <Text style={styles.sectionTitle}>How Identity is Calculated</Text>
              <Text style={styles.bodyText}>
                Noor uses Groq AI to analyze the Quranic themes present in your saved verses and review cards. Your identity updates whenever you save new verses, deepening the analysis as your engagement grows.
              </Text>
            </Card>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => router.push('/profile/share' as any)}
            >
              <Ionicons name="share-outline" size={18} color={Colors.darkBg} />
              <Text style={styles.shareBtnText}>Generate Share Card</Text>
            </TouchableOpacity>
          </>
        )}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, minWidth: 60 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  shareHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60, justifyContent: 'flex-end' },
  shareText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  scroll: { padding: 20, gap: 16, flexGrow: 1 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 60 },
  loadingTitle: { fontFamily: 'Raleway_700Bold', fontSize: 18, color: Colors.textPrimary, textAlign: 'center' },
  loadingBody: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  emptyTitle: { fontFamily: 'Raleway_700Bold', fontSize: 20, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  progressChip: {
    backgroundColor: Colors.darkBg2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  progressChipText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  exploreBtn: {
    backgroundColor: Colors.gold, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 4,
  },
  exploreBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },

  // Primary badge
  primaryBadge: {
    backgroundColor: Colors.darkBg2, borderRadius: 20,
    padding: 28, alignItems: 'center', borderWidth: 2, gap: 8,
  },
  primaryIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  primaryArabic: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28 },
  primaryLabel: { fontFamily: 'Raleway_700Bold', fontSize: 20, color: Colors.textPrimary },
  primaryDesc: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: 4 },

  // Data source row
  dataSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  dataSourceText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },

  // Section
  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },

  // Theme cards
  badgeCard: { gap: 10 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeIcon: { borderRadius: 12, padding: 10 },
  badgeArabic: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18 },
  badgeLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  badgeSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  badgePct: { fontFamily: 'Raleway_700Bold', fontSize: 18 },
  barTrack: { height: 4, backgroundColor: Colors.darkBg3 ?? Colors.darkBorder, borderRadius: 2, overflow: 'hidden' },
  bar: { height: 4, borderRadius: 2 },

  // Hadith
  hadithCard: { gap: 8 },
  hadithLabel: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  hadithText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  // Body text
  bodyText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Share button
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 16,
  },
  shareBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.darkBg },
});
