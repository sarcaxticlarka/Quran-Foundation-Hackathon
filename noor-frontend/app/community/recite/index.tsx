import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { Badge } from '../../../src/components/ui/Badge';
import { useSurahs } from '../../../src/hooks/useQuran';
import type { Surah } from '../../../src/services/quranApi';

const LEVELS = [
  { name: 'Novice',  minXp: 0,    maxXp: 200,  icon: 'leaf-outline'  },
  { name: 'Learner', minXp: 200,  maxXp: 500,  icon: 'book-outline'  },
  { name: 'Reciter', minXp: 500,  maxXp: 1000, icon: 'mic-outline'   },
  { name: 'Hafiz',   minXp: 1000, maxXp: 2000, icon: 'star-outline'  },
  { name: 'Qari',    minXp: 2000, maxXp: 9999, icon: 'trophy-outline'},
];

function getDifficultyForSurah(surah: Surah): { label: string; variant: 'teal' | 'gold' | 'coral' } {
  if (surah.verses_count <= 10) return { label: 'Beginner', variant: 'teal' };
  if (surah.verses_count <= 50) return { label: 'Intermediate', variant: 'gold' };
  return { label: 'Advanced', variant: 'coral' };
}

function getXpForSurah(surah: Surah): number {
  return Math.min(Math.round(surah.verses_count * 8), 500);
}

export default function RecitationIndexScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: surahs, isLoading } = useSurahs();
  const userXp = 320;
  const level = LEVELS.find((l) => userXp >= l.minXp && userXp < l.maxXp) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const xpProgress = nextLevel
    ? ((userXp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100
    : 100;

  const filteredSurahs = (surahs ?? []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name_simple.toLowerCase().includes(q) ||
      s.translated_name.name.toLowerCase().includes(q) ||
      s.name_arabic.includes(search) ||
      String(s.id) === search
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tajweed Coach</Text>
          <Text style={styles.headerSub}>Shadow recitation with AI feedback</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/community/recite/progress' as any)}>
          <Badge label={level.name} variant="gold" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* XP bar */}
        <Card variant="bordered" padding="md">
          <View style={styles.xpHeader}>
            <View style={styles.xpLevelRow}>
              <Ionicons name={level.icon as any} size={14} color={Colors.gold} />
              <Text style={styles.xpLevel}>{level.name}</Text>
            </View>
            <Text style={styles.xpText}>{userXp} XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpBar, { width: `${xpProgress}%` }]} />
          </View>
          {nextLevel && (
            <Text style={styles.xpSub}>{nextLevel.minXp - userXp} XP to {nextLevel.name}</Text>
          )}
        </Card>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surahs..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choose a Surah to Recite</Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.gold} />
            <Text style={styles.loadingText}>Loading Quran...</Text>
          </View>
        ) : (
          filteredSurahs.map((surah) => {
            const diff = getDifficultyForSurah(surah);
            const xp = getXpForSurah(surah);
            return (
              <TouchableOpacity
                key={surah.id}
                onPress={() => router.push(`/community/recite/feedback?surahId=${surah.id}&surahName=${encodeURIComponent(surah.name_simple)}` as any)}
                activeOpacity={0.85}
              >
                <Card variant="bordered" padding="md" style={styles.surahCard}>
                  <View style={styles.surahLeft}>
                    <View style={styles.surahNum}>
                      <Text style={styles.surahNumText}>{surah.id}</Text>
                    </View>
                    <View>
                      <Text style={styles.surahName}>{surah.name_simple}</Text>
                      <Text style={styles.surahArabic}>{surah.name_arabic}</Text>
                      <Text style={styles.surahMeta}>{surah.verses_count} verses · {surah.revelation_place}</Text>
                    </View>
                  </View>
                  <View style={styles.surahRight}>
                    <Badge label={diff.label} variant={diff.variant} />
                    <Text style={styles.xpReward}>+{xp} XP</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
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
  headerTitle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  scroll: { padding: 20, gap: 16 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLevelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpLevel: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary },
  xpText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.gold },
  xpTrack: { height: 8, backgroundColor: Colors.darkBg3, borderRadius: 4, overflow: 'hidden' },
  xpBar: { height: 8, backgroundColor: Colors.coral, borderRadius: 4 },
  xpSub: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.darkBg2, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  searchInput: { flex: 1, fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textPrimary },
  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textSecondary },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  surahCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  surahLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  surahNum: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.coral + '22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.coral,
  },
  surahNumText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.coral },
  surahName: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  surahArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 16, color: Colors.gold, marginTop: 1 },
  surahMeta: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  surahRight: { alignItems: 'flex-end', gap: 6 },
  xpReward: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.coral },
});
