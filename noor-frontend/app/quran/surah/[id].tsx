import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/theme/colors';
import { quranApi, Verse } from '../../../src/services/quranApi';
import { audioApi } from '../../../src/services/audioApi';
import { getFirstTranslation, useSurah } from '../../../src/hooks/useQuran';
import { useGlobalAudio } from '../../../src/contexts/AudioContext';

const RECITER_ID = 7; // Mishary Rashid Al-Afasy
const RECITER_NAME = 'Al-Afasy';

export default function SurahDetailScreen() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const surahId = Number(id);
  const [page, setPage]           = useState(1);
  const [allVerses, setAllVerses] = useState<Verse[]>([]);

  const audio = useGlobalAudio();

  const { data: surah, isLoading: surahLoading } = useSurah(surahId);

  const { data: versesData, isLoading: versesLoading, isFetching } = useQuery({
    queryKey: ['verses', surahId, page],
    queryFn: () => quranApi.getVerses(surahId, { page, perPage: 50 }),
    staleTime: Infinity,
    enabled: surahId > 0,
  });

  const { data: chapterAudio } = useQuery({
    queryKey: ['chapter-audio', surahId, RECITER_ID],
    queryFn: () => audioApi.getChapterAudio(surahId, RECITER_ID),
    staleTime: Infinity,
    enabled: surahId > 0,
  });

  React.useEffect(() => {
    if (!versesData?.verses) return;
    setAllVerses((prev) => {
      const existing = new Set(prev.map((v) => v.verse_key));
      const newOnes = versesData.verses.filter((v) => !existing.has(v.verse_key));
      return page === 1 ? versesData.verses : [...prev, ...newOnes];
    });
  }, [versesData, page]);

  const totalPages = versesData?.pagination?.total_pages ?? 1;
  const hasMore    = page < totalPages;

  const loadMore = () => {
    if (!isFetching && hasMore) setPage((p) => p + 1);
  };

  const handlePlayVerse = useCallback(async (verse: Verse) => {
    const key = `verse-${verse.verse_key}`;
    if (audio.currentKey === key) {
      await audio.toggle();
      return;
    }
    // Build URL directly from CDN — no API call needed, always works
    const url = audioApi.buildVerseAudioUrl(verse.verse_key, RECITER_ID);
    const surahName = surah?.name_simple ?? `Surah ${surahId}`;
    await audio.playUrl(url, key, `${surahName} · ${verse.verse_key} · ${RECITER_NAME}`);
  }, [audio, surah, surahId]);

  const handlePlaySurah = useCallback(async () => {
    const key = `surah-${surahId}`;
    if (audio.currentKey === key) {
      await audio.toggle();
      return;
    }
    const url = chapterAudio?.audio_url;
    if (!url) return;
    const surahName = surah?.name_simple ?? `Surah ${surahId}`;
    await audio.playUrl(url, key, `${surahName} · Full Recitation · ${RECITER_NAME}`);
  }, [audio, chapterAudio, surah, surahId]);

  const renderVerse = ({ item }: ListRenderItemInfo<Verse>) => {
    const key           = `verse-${item.verse_key}`;
    const isCurrent     = audio.currentKey === key;
    const isThisPlaying = isCurrent && audio.isPlaying;
    const isThisLoading = isCurrent && audio.isLoading;

    return (
      <View style={[styles.verseRow, isCurrent && styles.verseRowActive]}>
        <View style={styles.verseNumWrap}>
          <Text style={styles.verseNum}>{item.verse_number}</Text>
        </View>
        <View style={styles.verseContent}>
          <Text style={[styles.arabic, isCurrent && styles.arabicActive]}>
            {item.text_uthmani}
          </Text>
          <Text style={styles.translation}>{getFirstTranslation(item)}</Text>
          <TouchableOpacity
            style={styles.versePlayBtn}
            onPress={() => handlePlayVerse(item)}
            activeOpacity={0.7}
          >
            {isThisLoading ? (
              <ActivityIndicator size="small" color={Colors.teal} />
            ) : (
              <Ionicons
                name={isThisPlaying ? 'pause-circle' : 'play-circle'}
                size={20}
                color={isThisPlaying ? Colors.teal : Colors.textMuted}
              />
            )}
            <Text style={[styles.versePlayLabel, isThisPlaying && { color: Colors.teal }]}>
              {isThisPlaying ? 'Pause' : 'Listen'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isSurahKey     = audio.currentKey === `surah-${surahId}`;
  const isSurahPlaying = isSurahKey && audio.isPlaying;
  const isSurahLoading = isSurahKey && audio.isLoading;

  const ListHeader = () => (
    <View style={styles.surahHeader}>
      {surahLoading ? (
        <ActivityIndicator color={Colors.gold} />
      ) : surah ? (
        <>
          <Text style={styles.surahNumber}>{surah.id}</Text>
          <Text style={styles.surahNameArabic}>{surah.name_arabic}</Text>
          <Text style={styles.surahName}>{surah.name_simple}</Text>
          <Text style={styles.surahMeta}>
            {surah.translated_name.name} · {surah.verses_count} verses · {surah.revelation_place}
          </Text>

          <TouchableOpacity
            style={[styles.playSurahBtn, isSurahPlaying && styles.playSurahBtnPaused]}
            onPress={handlePlaySurah}
            activeOpacity={0.8}
            disabled={!chapterAudio?.audio_url && !isSurahKey}
          >
            {isSurahLoading ? (
              <ActivityIndicator size="small" color={Colors.darkBg} />
            ) : (
              <Ionicons name={isSurahPlaying ? 'pause' : 'play'} size={16} color={Colors.darkBg} />
            )}
            <Text style={styles.playSurahText}>
              {isSurahPlaying ? 'Pause Surah' : 'Play Full Surah'}
            </Text>
            <Text style={styles.playSurahReciter}>· {RECITER_NAME}</Text>
          </TouchableOpacity>

          {surah.bismillah_pre && (
            <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          )}
        </>
      ) : null}
    </View>
  );

  const ListFooter = () => {
    if (!hasMore) return <View style={{ height: 40 }} />;
    return (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={isFetching}>
        {isFetching
          ? <ActivityIndicator size="small" color={Colors.gold} />
          : <Text style={styles.loadMoreText}>Load more verses</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {surah ? surah.name_simple : 'Surah'}
        </Text>
        {audio.currentKey ? (
          <TouchableOpacity style={styles.stopBtn} onPress={audio.stop}>
            <Ionicons name="stop-circle-outline" size={24} color={Colors.coral} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {versesLoading && page === 1 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.loadingText}>Loading surah...</Text>
        </View>
      ) : (
        <FlatList
          data={allVerses}
          keyExtractor={(v) => v.verse_key}
          renderItem={renderVerse}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  navHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stopBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: 'Raleway_700Bold', fontSize: 17, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },

  surahHeader: {
    alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder, gap: 8,
    backgroundColor: Colors.darkBg2,
  },
  surahNumber: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold, letterSpacing: 2, textTransform: 'uppercase' },
  surahNameArabic: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 40, color: Colors.goldLight, writingDirection: 'rtl' },
  surahName: { fontFamily: 'Raleway_700Bold', fontSize: 22, color: Colors.textPrimary },
  surahMeta: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textTransform: 'capitalize' },
  bismillah: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, color: Colors.gold,
    writingDirection: 'rtl', textAlign: 'center', marginTop: 12,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.darkBorder, width: '100%',
  },

  playSurahBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 4,
  },
  playSurahBtnPaused: { backgroundColor: Colors.gold },
  playSurahText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
  playSurahReciter: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.darkBg, opacity: 0.7 },

  verseRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 18 },
  verseRowActive: { backgroundColor: 'rgba(42,122,88,0.08)' },
  verseNumWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(201,164,86,0.1)', borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
  },
  verseNum: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold },
  verseContent: { flex: 1, gap: 10 },
  arabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, color: Colors.goldLight, textAlign: 'right', writingDirection: 'rtl', lineHeight: 42 },
  arabicActive: { color: Colors.teal },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
  versePlayBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  versePlayLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: Colors.textMuted },
  separator: { height: 1, backgroundColor: Colors.darkBorder, marginLeft: 62 },
  loadMoreBtn: {
    margin: 20, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder, borderRadius: 12,
  },
  loadMoreText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
});
