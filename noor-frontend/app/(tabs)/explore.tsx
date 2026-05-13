import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { useSurahs } from '../../src/hooks/useQuran';
import type { Surah } from '../../src/services/quranApi';

const CONCEPT_NODES = [
  { id: 'taqwa',    label: 'Taqwa',    arabic: 'تقوى', category: 'Spiritual',  connections: 14 },
  { id: 'sabr',     label: 'Sabr',     arabic: 'صبر',  category: 'Character',  connections: 22 },
  { id: 'tawakkul', label: 'Tawakkul', arabic: 'توكل', category: 'Spiritual',  connections: 9  },
  { id: 'ihsan',    label: 'Ihsan',    arabic: 'إحسان',category: 'Ethics',     connections: 18 },
  { id: 'iman',     label: 'Iman',     arabic: 'إيمان',category: 'Aqeedah',   connections: 31 },
  { id: 'zuhd',     label: 'Zuhd',     arabic: 'زهد',  category: 'Character',  connections: 7  },
];
const WORD_ROOTS = [
  { root: 'ك-ت-ب', meaning: 'Write, prescribe', occurrences: 238, words: ['كتاب', 'كاتب', 'مكتوب'] },
  { root: 'ع-ل-م', meaning: 'Know, knowledge',  occurrences: 854, words: ['عالم', 'علم', 'معلوم'] },
  { root: 'ر-ح-م', meaning: 'Mercy, compassion',occurrences: 341, words: ['رحمة', 'رحيم', 'رحمن'] },
  { root: 'ق-ر-أ', meaning: 'Read, recite',     occurrences: 89,  words: ['قرآن', 'قارئ', 'قراءة'] },
];
const CAT_COLOR: Record<string, string> = {
  Spiritual: Colors.gold, Character: Colors.tealLight,
  Ethics: Colors.purple,  Aqeedah: Colors.blue, Default: Colors.coral,
};

function SurahRow({ surah, onPress }: { surah: Surah; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
      <View style={styles.surahRow}>
        <View style={styles.surahNumWrap}>
          <Text style={styles.surahNumText}>{surah.id}</Text>
        </View>
        <View style={styles.surahInfo}>
          <Text style={styles.surahName}>{surah.name_simple}</Text>
          <Text style={styles.surahMeta}>
            {surah.translated_name.name} · {surah.verses_count} verses · {surah.revelation_place}
          </Text>
        </View>
        <Text style={styles.surahArabic}>{surah.name_arabic}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'surahs' | 'graph' | 'roots'>('surahs');
  const { data: surahs, isLoading: surahsLoading } = useSurahs();

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

  const filteredConcepts = CONCEPT_NODES.filter(
    (c) => !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.arabic.includes(search),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Explore</Text>
          <TouchableOpacity style={styles.searchBtn} onPress={() => router.push('/search')} activeOpacity={0.8}>
            <Ionicons name="search-outline" size={16} color={Colors.gold} />
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['surahs', 'graph', 'roots'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'surahs' ? 'Surahs' : t === 'graph' ? 'Concepts' : 'Roots'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'surahs' ? 'Search surahs...' :
              activeTab === 'graph' ? 'Search concepts...' : 'Search roots...'
            }
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Surahs tab */}
        {activeTab === 'surahs' && (
          <View style={styles.section}>
            {surahsLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={Colors.gold} />
                <Text style={styles.loadingText}>Loading Quran...</Text>
              </View>
            ) : (
              <Card variant="bordered" padding="none">
                {filteredSurahs.map((surah, i) => (
                  <View key={surah.id}>
                    <SurahRow
                      surah={surah}
                      onPress={() => router.push(`/quran/surah/${surah.id}` as any)}
                    />
                    {i < filteredSurahs.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </Card>
            )}
          </View>
        )}

        {/* Concepts / Knowledge Graph tab */}
        {activeTab === 'graph' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => router.push('/explore/graph')} activeOpacity={0.85}>
              <Card variant="gold" padding="lg" style={styles.graphCta}>
                <View style={styles.graphCtaRow}>
                  <View style={styles.graphCtaIconWrap}>
                    <Ionicons name="git-network-outline" size={24} color={Colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.graphCtaTitle}>Open Full Knowledge Graph</Text>
                    <Text style={styles.graphCtaSub}>Explore interconnected Quranic concepts in an interactive network</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.goldDim} />
                </View>
              </Card>
            </TouchableOpacity>

            <View style={styles.conceptGrid}>
              {filteredConcepts.map((node) => (
                <TouchableOpacity
                  key={node.id}
                  onPress={() => router.push(`/explore/concept/${node.id}` as any)}
                  style={[styles.conceptCard, { borderColor: `${CAT_COLOR[node.category] ?? Colors.coral}40` }]}
                  activeOpacity={0.75}
                >
                  <View style={[styles.conceptDot, { backgroundColor: CAT_COLOR[node.category] ?? Colors.coral }]} />
                  <Text style={styles.conceptArabic}>{node.arabic}</Text>
                  <Text style={styles.conceptLabel}>{node.label}</Text>
                  <Text style={styles.conceptMeta}>{node.connections} connections</Text>
                  <Badge label={node.category} variant="muted" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Roots tab */}
        {activeTab === 'roots' && (
          <View style={styles.section}>
            {WORD_ROOTS.filter((r) => !search || r.root.includes(search) || r.meaning.toLowerCase().includes(search.toLowerCase())).map((root) => (
              <TouchableOpacity key={root.root} onPress={() => router.push(`/explore/word/${encodeURIComponent(root.root)}` as any)} activeOpacity={0.82}>
                <Card variant="bordered" padding="md" style={styles.rootCard}>
                  <View style={styles.rootHeader}>
                    <Text style={styles.rootScript}>{root.root}</Text>
                    <Badge label={`${root.occurrences}×`} variant="gold" />
                  </View>
                  <Text style={styles.rootMeaning}>{root.meaning}</Text>
                  <View style={styles.rootWords}>
                    {root.words.map((w) => (
                      <View key={w} style={styles.rootWordChip}><Text style={styles.rootWordText}>{w}</Text></View>
                    ))}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 },
  heading: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 30, color: Colors.textPrimary },
  searchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(201,164,86,0.08)' },
  searchBtnText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 13 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.darkBg2, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.darkBorder },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder },
  tabText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textMuted },
  tabTextActive: { color: Colors.gold },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.darkBg2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: Colors.darkBorder },
  searchInput: { flex: 1, fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textPrimary },
  section: { gap: 12 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  surahRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  surahNumWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(201,164,86,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  surahNumText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.gold },
  surahInfo: { flex: 1 },
  surahName: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary },
  surahMeta: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  surahArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 20, color: Colors.gold },
  divider: { height: 1, backgroundColor: Colors.darkBorder, marginHorizontal: 16 },
  graphCta: {},
  graphCtaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  graphCtaIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  graphCtaTitle: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  graphCtaSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  conceptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  conceptCard: { width: '47%', flex: 1, minWidth: '47%', backgroundColor: Colors.darkBg2, borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  conceptDot: { width: 6, height: 6, borderRadius: 3 },
  conceptArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 22, color: Colors.gold },
  conceptLabel: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textPrimary },
  conceptMeta: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  rootCard: { gap: 10 },
  rootHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rootScript: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: Colors.gold },
  rootMeaning: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  rootWords: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rootWordChip: { backgroundColor: Colors.darkBg3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.darkBorder },
  rootWordText: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 16, color: Colors.textSecondary },
});
