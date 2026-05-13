import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { quranApi, Verse } from '../../../src/services/quranApi';
import { getFirstTranslation } from '../../../src/hooks/useQuran';
import { groqAI } from '../../../src/services/groqAI';
import { audioApi } from '../../../src/services/audioApi';
import { useGlobalAudio } from '../../../src/contexts/AudioContext';

const RECITER_ID = 7;

type SelfRating = 'hard' | 'okay' | 'good';

const RATING_CONFIG: Record<SelfRating, { label: string; color: string; icon: string; score: number; message: string }> = {
  hard:  { label: 'Hard',  color: Colors.coral,      icon: 'sad-outline',     score: 65, message: "Keep at it — every recitation builds fluency. Review the rules below and try again." },
  okay:  { label: 'Okay',  color: Colors.gold,       icon: 'happy-outline',   score: 78, message: "Good progress! Focus on the highlighted words and you'll nail it next time." },
  good:  { label: 'Good',  color: Colors.tealLight,  icon: 'checkmark-circle-outline', score: 92, message: "Excellent! You're applying the tajweed rules well. Move to the next verse." },
};

export default function TajweedFeedbackScreen() {
  const router = useRouter();
  const { surahId, surahName } = useLocalSearchParams<{ surahId: string; surahName: string }>();
  const id   = Number(surahId) || 1;
  const name = surahName ? decodeURIComponent(surahName) : 'Surah';

  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [phase, setPhase] = useState<'select' | 'guide' | 'recite' | 'done'>('select');
  const [guide, setGuide] = useState<{
    rules: { word: string; transliteration: string; rule: string; tip: string }[];
    difficulty: string;
    overallTip: string;
  } | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [rating, setRating] = useState<SelfRating | null>(null);

  const audio = useGlobalAudio();

  const handleListen = async (verse: Verse) => {
    const key = `verse-${verse.verse_key}`;
    if (audio.currentKey === key) { await audio.toggle(); return; }
    const url = audioApi.buildVerseAudioUrl(verse.verse_key, RECITER_ID);
    await audio.playUrl(url, key, `${name} · ${verse.verse_key} · Al-Afasy`);
  };

  const { data: versesData, isLoading } = useQuery({
    queryKey: ['verses', id, 1],
    queryFn: () => quranApi.getVerses(id, { page: 1, perPage: 10 }),
    staleTime: Infinity,
    enabled: id > 0,
  });

  const verses = versesData?.verses ?? [];

  React.useEffect(() => {
    if (verses.length > 0 && !selectedVerse) setSelectedVerse(verses[0]);
  }, [verses]);

  const loadGuide = async () => {
    if (!selectedVerse) return;
    setGuideLoading(true);
    try {
      const result = await groqAI.getTajweedGuide(
        selectedVerse.verse_key,
        selectedVerse.text_uthmani,
        getFirstTranslation(selectedVerse),
      );
      setGuide(result);
      setPhase('guide');
    } catch {
      setGuide({ rules: [], difficulty: 'Medium', overallTip: 'Recite slowly, paying attention to each letter.' });
      setPhase('guide');
    } finally {
      setGuideLoading(false);
    }
  };

  const selectVerse = (v: Verse) => {
    setSelectedVerse(v);
    setPhase('select');
    setGuide(null);
    setRating(null);
  };

  const translation = selectedVerse ? getFirstTranslation(selectedVerse) : '';
  const ratingData  = rating ? RATING_CONFIG[rating] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Verse selector */}
        <View>
          <Text style={styles.sectionLabel}>SELECT VERSE</Text>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.gold} size="small" />
              <Text style={styles.loadingText}>Loading verses…</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={verses}
              keyExtractor={(v) => v.verse_key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.versePills}
              renderItem={({ item }) => {
                const active = selectedVerse?.verse_key === item.verse_key;
                return (
                  <TouchableOpacity
                    onPress={() => selectVerse(item)}
                    style={[styles.versePill, active && styles.versePillActive]}
                  >
                    <Text style={[styles.versePillText, active && styles.versePillTextActive]}>
                      {item.verse_number}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        {/* Verse display */}
        {selectedVerse && (
          <Card variant="bordered" padding="lg">
            <View style={styles.verseKeyRow}>
              <View style={styles.verseKeyBadge}>
                <Text style={styles.verseKeyText}>{selectedVerse.verse_key}</Text>
              </View>
              {(() => {
                const key = `verse-${selectedVerse.verse_key}`;
                const isCurrent = audio.currentKey === key;
                const isThisPlaying = isCurrent && audio.isPlaying;
                const isThisLoading = isCurrent && audio.isLoading;
                return (
                  <TouchableOpacity
                    onPress={() => handleListen(selectedVerse)}
                    style={styles.listenBtn}
                    activeOpacity={0.75}
                  >
                    {isThisLoading ? (
                      <ActivityIndicator size="small" color={Colors.teal} />
                    ) : (
                      <Ionicons
                        name={isThisPlaying ? 'pause-circle' : 'play-circle'}
                        size={28}
                        color={isThisPlaying ? Colors.teal : Colors.textMuted}
                      />
                    )}
                    <Text style={[styles.listenLabel, isThisPlaying && { color: Colors.teal }]}>
                      {isThisPlaying ? 'Pause' : 'Listen'}
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
            <Text style={styles.arabic}>{selectedVerse.text_uthmani}</Text>
            <View style={styles.divider} />
            <Text style={styles.translation}>{translation}</Text>
          </Card>
        )}

        {/* PHASE: select — load guide button */}
        {selectedVerse && phase === 'select' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={loadGuide}
            disabled={guideLoading}
            activeOpacity={0.85}
          >
            {guideLoading ? (
              <ActivityIndicator color={Colors.darkBg} />
            ) : (
              <>
                <Ionicons name="book-outline" size={18} color={Colors.darkBg} />
                <Text style={styles.primaryBtnText}>Get Tajweed Guide</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* PHASE: guide — show rules, then ready to recite */}
        {guide && (phase === 'guide' || phase === 'recite' || phase === 'done') && (
          <Card variant="bordered" padding="md">
            <View style={styles.guideHeader}>
              <View style={styles.tipIconWrap}>
                <Ionicons name="bulb-outline" size={18} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feedbackTitle}>Tajweed Guide</Text>
                <Text style={styles.difficultyText}>Difficulty: {guide.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.overallTip}>{guide.overallTip}</Text>

            {guide.rules.length > 0 && (
              <View style={styles.rulesList}>
                {guide.rules.map((rule, i) => (
                  <View key={i} style={styles.ruleItem}>
                    <View style={styles.ruleBadge}>
                      <Text style={styles.ruleArabic}>{rule.word}</Text>
                      {rule.transliteration ? <Text style={styles.ruleTranslit}>{rule.transliteration}</Text> : null}
                    </View>
                    <View style={styles.ruleInfo}>
                      <Text style={styles.ruleName}>{rule.rule}</Text>
                      <Text style={styles.ruleTip}>{rule.tip}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* PHASE: guide — listen again + recite yourself button */}
        {phase === 'guide' && selectedVerse && (
          <View style={styles.guideActions}>
            <TouchableOpacity
              style={styles.listenAgainBtn}
              onPress={() => handleListen(selectedVerse)}
              activeOpacity={0.8}
            >
              {(() => {
                const key = `verse-${selectedVerse.verse_key}`;
                const isCurrent = audio.currentKey === key;
                const isThisPlaying = isCurrent && audio.isPlaying;
                const isThisLoading = isCurrent && audio.isLoading;
                return (
                  <>
                    {isThisLoading ? (
                      <ActivityIndicator size="small" color={Colors.teal} />
                    ) : (
                      <Ionicons
                        name={isThisPlaying ? 'pause-circle' : 'volume-medium-outline'}
                        size={20}
                        color={Colors.teal}
                      />
                    )}
                    <Text style={styles.listenAgainText}>
                      {isThisPlaying ? 'Pause' : 'Listen Again'}
                    </Text>
                  </>
                );
              })()}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setPhase('recite')}
              activeOpacity={0.85}
            >
              <Ionicons name="mic-outline" size={20} color={Colors.darkBg} />
              <Text style={styles.primaryBtnText}>I've Recited — Rate Myself</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PHASE: recite — self-rate */}
        {phase === 'recite' && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>How did your recitation go?</Text>
            <Text style={styles.ratingSubtitle}>Be honest — this helps track your real progress</Text>
            <View style={styles.ratingBtns}>
              {(Object.entries(RATING_CONFIG) as [SelfRating, typeof RATING_CONFIG[SelfRating]][]).map(([key, cfg]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.ratingBtn, { borderColor: cfg.color + '60', backgroundColor: cfg.color + '14' }]}
                  onPress={() => { setRating(key); setPhase('done'); }}
                  activeOpacity={0.82}
                >
                  <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                  <Text style={[styles.ratingBtnText, { color: cfg.color }]}>{cfg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* PHASE: done — results */}
        {phase === 'done' && ratingData && (
          <>
            <View style={styles.scoreRow}>
              <View style={[styles.scoreBadge, { backgroundColor: ratingData.color + '18', borderColor: ratingData.color + '60' }]}>
                <Text style={[styles.scoreNum, { color: ratingData.color }]}>{ratingData.score}%</Text>
                <Text style={styles.scoreLabel}>Self-Rated Score</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: 'rgba(201,164,86,0.1)', borderColor: Colors.gold + '60' }]}>
                <Text style={[styles.scoreNum, { color: Colors.gold }]}>+{Math.round(ratingData.score * 0.5)} XP</Text>
                <Text style={styles.scoreLabel}>Earned</Text>
              </View>
            </View>

            <Card variant="bordered" padding="md">
              <View style={styles.guideHeader}>
                <Ionicons name={ratingData.icon as any} size={20} color={ratingData.color} />
                <Text style={[styles.feedbackTitle, { color: ratingData.color }]}>{ratingData.label}</Text>
              </View>
              <Text style={styles.feedbackNote}>{ratingData.message}</Text>
            </Card>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setRating(null); setPhase('guide'); }}>
                <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
                <Text style={styles.retryBtnText}>Practice Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => {
                  const idx = verses.findIndex((v) => v.verse_key === selectedVerse?.verse_key);
                  const next = verses[idx + 1];
                  if (next) selectVerse(next);
                }}
                disabled={!verses.find((v, i) => v.verse_key === selectedVerse?.verse_key && i < verses.length - 1)}
              >
                <Text style={styles.nextBtnText}>Next Verse</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.gold} />
              </TouchableOpacity>
            </View>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, gap: 18 },

  sectionLabel: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  versePills: { gap: 8, paddingRight: 4 },
  versePill: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkBg2, borderWidth: 1, borderColor: Colors.darkBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  versePillActive: { backgroundColor: 'rgba(201,164,86,0.15)', borderColor: Colors.gold },
  versePillText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textMuted },
  versePillTextActive: { color: Colors.gold },

  verseKeyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  verseKeyBadge: { backgroundColor: 'rgba(201,164,86,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  verseKeyText: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold },
  listenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listenLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textMuted },
  guideActions: { flexDirection: 'column', gap: 10 },
  listenAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
    backgroundColor: 'rgba(201,164,86,0.08)',
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  listenAgainText: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.gold },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 26, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 44,
  },
  divider: { height: 1, backgroundColor: Colors.darkBorder, marginVertical: 14 },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.gold, borderRadius: 16, paddingVertical: 16,
  },
  primaryBtnText: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.darkBg },

  guideHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tipIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textSecondary },
  difficultyText: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  overallTip: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 14 },
  rulesList: { gap: 12, borderTopWidth: 1, borderTopColor: Colors.darkBorder, paddingTop: 14 },
  ruleItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ruleBadge: { backgroundColor: Colors.darkBg3, borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 64 },
  ruleArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 20, color: Colors.gold, textAlign: 'center' },
  ruleTranslit: { fontFamily: 'Raleway_400Regular', fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  ruleInfo: { flex: 1, gap: 4 },
  ruleName: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textPrimary },
  ruleTip: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  ratingSection: { alignItems: 'center', gap: 12 },
  ratingTitle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: Colors.textPrimary, textAlign: 'center' },
  ratingSubtitle: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  ratingBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  ratingBtn: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 18, alignItems: 'center', gap: 8 },
  ratingBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14 },

  scoreRow: { flexDirection: 'row', gap: 12 },
  scoreBadge: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, gap: 4 },
  scoreNum: { fontFamily: 'Raleway_700Bold', fontSize: 26 },
  scoreLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  feedbackNote: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  retryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.darkBg2, borderRadius: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  retryBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(201,164,86,0.1)', borderRadius: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)',
  },
  nextBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.gold },
});
