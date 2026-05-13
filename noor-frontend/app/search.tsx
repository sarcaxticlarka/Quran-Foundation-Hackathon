import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { useVerseSearch } from '../src/hooks/useQuran';

const RECENT_SEARCHES = ['patience', 'gratitude', 'mercy', 'Surah Kahf'];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text), 400);
  }, []);

  const { data: searchData, isLoading, isFetching } = useVerseSearch(debouncedQuery);
  const results = searchData?.results ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search verses, Tafsir, notes..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {query.length === 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {RECENT_SEARCHES.map((s) => (
              <TouchableOpacity key={s} style={styles.recentItem} onPress={() => handleSearch(s)}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.recentText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {query.length > 1 && (
          <>
            {isFetching || isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={Colors.gold} />
                <Text style={styles.loadingText}>Searching Quran...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  {results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"
                </Text>
                {results.length === 0 && debouncedQuery.length >= 2 && (
                  <Text style={styles.emptyText}>No verses found. Try different keywords.</Text>
                )}
                {results.map((r, i) => (
                  <Card key={i} variant="bordered" padding="md" style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Badge label="Verse" variant="gold" />
                      <Text style={styles.resultSurah}>{r.verse_key}</Text>
                    </View>
                    {r.text && <Text style={styles.arabic}>{r.text}</Text>}
                    {r.translations?.[0] && (
                      <Text style={styles.resultText}>{r.translations[0].text}</Text>
                    )}
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  cancelBtn: { paddingVertical: 4 },
  cancelText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.darkBg2, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  searchInput: { flex: 1, fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 14 },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  recentText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  emptyText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  resultCard: { gap: 10 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultSurah: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, flex: 1 },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 20, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 32,
  },
  resultText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
});
