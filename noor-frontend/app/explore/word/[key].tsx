import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { groqAI } from '../../../src/services/groqAI';

const RARITY_COLORS: Record<string, string> = {
  Common: Colors.teal,
  Uncommon: Colors.gold,
  Rare: Colors.coral,
  Legendary: '#7856FF',
};

export default function WordDetailScreen() {
  const router = useRouter();
  const { key } = useLocalSearchParams<{ key: string }>();
  const decodedKey = decodeURIComponent(key as string);
  const [collected, setCollected] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['root-detail', decodedKey],
    queryFn: () => groqAI.getRootWordDetail(decodedKey),
    staleTime: 1000 * 60 * 60 * 24, // cache for 24 hours per root
    retry: 1,
  });

  const rarityColor = data ? (RARITY_COLORS[data.rarity] ?? Colors.gold) : Colors.gold;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Word Detail</Text>
        {data && (
          <TouchableOpacity
            style={[styles.collectBtn, collected && styles.collectBtnDone]}
            onPress={() => setCollected(true)}
            disabled={collected}
          >
            <Ionicons name={collected ? 'checkmark' : 'add'} size={14} color={collected ? Colors.darkBg : Colors.amber ?? Colors.gold} />
            <Text style={[styles.collectBtnText, collected && styles.collectBtnTextDone]}>
              {collected ? 'Collected' : 'Collect'}
            </Text>
          </TouchableOpacity>
        )}
        {!data && <View style={{ width: 80 }} />}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.loadingTitle}>Analyzing root...</Text>
          <Text style={styles.loadingBody}>
            Groq AI is exploring the Quranic linguistics of{'\n'}
            <Text style={styles.loadingRoot}>{decodedKey}</Text>
          </Text>
        </View>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <View style={styles.centerWrap}>
          <Ionicons name="warning-outline" size={48} color={Colors.coral} />
          <Text style={styles.errorTitle}>Couldn't load root data</Text>
          <Text style={styles.errorBody}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {data && !isLoading && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Trading card hero */}
          <Card variant="gold" padding="lg" style={StyleSheet.flatten([styles.tradingCard, { borderColor: rarityColor + '66' }])}>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '33' }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>{data.rarity}</Text>
            </View>
            <Text style={[styles.wordArabic, { color: rarityColor }]}>{data.arabic}</Text>
            <Text style={styles.wordTranslit}>{data.transliteration}</Text>
            <View style={styles.rootBadge}>
              <Text style={styles.rootLabel}>Root</Text>
              <Text style={styles.rootText}>{decodedKey}</Text>
            </View>
          </Card>

          <Card variant="bordered" padding="md">
            <Text style={styles.sectionTitle}>Root Meaning</Text>
            <Text style={styles.bodyText}>{data.rootMeaning}</Text>
          </Card>

          <Card variant="bordered" padding="md">
            <Text style={styles.sectionTitle}>Grammatical Form</Text>
            <Text style={styles.bodyText}>{data.grammaticalForm}</Text>
          </Card>

          {data.relatedVerses.length > 0 && (
            <Card variant="bordered" padding="md">
              <View style={styles.occurrenceRow}>
                <Text style={styles.sectionTitle}>Appears in Quran</Text>
                <Badge label={`${data.occurrences}×`} variant="gold" />
              </View>
              {data.relatedVerses.map((v, i) => (
                <View key={v.key} style={[styles.verseRow, i === 0 && styles.verseRowFirst]}>
                  <View style={styles.verseKeyChip}>
                    <Text style={styles.verseKeyText}>{v.key}</Text>
                  </View>
                  <Text style={styles.verseArabic}>{v.arabic}</Text>
                  <Text style={styles.verseTranslation}>{v.translation}</Text>
                  <Text style={styles.verseRef}>{v.surah}</Text>
                </View>
              ))}
            </Card>
          )}

          {data.relatedRoots.length > 0 && (
            <Card variant="bordered" padding="md">
              <Text style={styles.sectionTitle}>Related Roots & Derivatives</Text>
              {data.relatedRoots.map((r) => (
                <View key={r} style={styles.relatedRootRow}>
                  <Ionicons name="git-branch-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.relatedRoot}>{r}</Text>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  collectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: (Colors.amber ?? Colors.gold) + '22', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.amber ?? Colors.gold,
  },
  collectBtnDone: { backgroundColor: Colors.amber ?? Colors.gold, borderColor: Colors.amber ?? Colors.gold },
  collectBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.amber ?? Colors.gold },
  collectBtnTextDone: { color: Colors.darkBg },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  loadingTitle: { fontFamily: 'Raleway_700Bold', fontSize: 18, color: Colors.textPrimary, textAlign: 'center' },
  loadingBody: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  loadingRoot: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 20, color: Colors.gold },
  errorTitle: { fontFamily: 'Raleway_700Bold', fontSize: 18, color: Colors.textPrimary, textAlign: 'center' },
  errorBody: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 4 },
  retryText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },

  scroll: { padding: 20, gap: 16 },
  tradingCard: { alignItems: 'center', gap: 12, borderWidth: 1.5 },
  rarityBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  rarityText: { fontFamily: 'Raleway_700Bold', fontSize: 11 },
  wordArabic: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 56 },
  wordTranslit: { fontFamily: 'Raleway_600SemiBold', fontSize: 20, color: Colors.gold },
  rootBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.darkBg2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  rootLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  rootText: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 18, color: Colors.goldLight },

  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  bodyText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  occurrenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  verseRow: { gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.darkBorder },
  verseRowFirst: { marginTop: 4 },
  verseKeyChip: {
    alignSelf: 'flex-start', backgroundColor: Colors.gold + '22',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  verseKeyText: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold },
  verseArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 18, color: Colors.goldLight, textAlign: 'right', writingDirection: 'rtl', lineHeight: 32 },
  verseTranslation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  verseRef: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },

  relatedRootRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  relatedRoot: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, flex: 1 },
});
