import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { useSurahs, useVerse, useVerseSearch, getFirstTranslation } from '../../../src/hooks/useQuran';
import { groqAI } from '../../../src/services/groqAI';
import { stripHtml } from '../../../src/services/quranApi';
import { saveReflection } from '../../../src/services/db';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSavedStore } from '../../../src/stores/savedStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function nameVariants(value?: string) {
  const normalized = normalizeSearchText(value ?? '');
  if (!normalized) return [];
  return [normalized, normalized.replace(/^al\s+/, '')].filter(Boolean);
}

export default function ReflectionWriteScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: surahs } = useSurahs();
  const savedVerses = useSavedStore((s) => s.verses);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [verseSearchQuery, setVerseSearchQuery] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiResult, setAiResult] = useState<null | { aligned: boolean; feedback: string }>(null);
  const [isPublic, setIsPublic] = useState(false);

  const hasSavedVerses = savedVerses.length >= 2;
  const { data: promptData, isLoading: promptLoading } = useQuery({
    queryKey: ['reflection-prompt', savedVerses.slice(0, 10).map((v) => v.verseKey).join(',')],
    queryFn: () => groqAI.getPersonalizedReflectionPrompt(
      savedVerses.slice(0, 10).map((v) => v.verseKey),
      savedVerses.slice(0, 10).map((v) => v.translation),
    ),
    enabled: hasSavedVerses,
    staleTime: 1000 * 60 * 30,
  });

  const { data: selectedVerse } = useVerse(selectedVerseKey ?? '');
  const selectedTranslation = selectedVerse ? getFirstTranslation(selectedVerse) : '';
  const cleanSearchQuery = verseSearchQuery.trim();

  const directVerseKey = React.useMemo(() => {
    if (!cleanSearchQuery) return null;
    const normalized = normalizeSearchText(cleanSearchQuery);
    const directMatch = normalized.match(/^(\d{1,3})\s+(\d{1,3})$/);
    if (directMatch) {
      const surahId = Number(directMatch[1]);
      const ayah = Number(directMatch[2]);
      const surah = surahs?.find((s) => s.id === surahId);
      if (!surah || ayah < 1 || ayah > surah.verses_count) return null;
      return `${surahId}:${ayah}`;
    }

    for (const surah of surahs ?? []) {
      const names = [
        ...nameVariants(surah.name_simple),
        ...nameVariants(surah.name_complex),
        ...nameVariants(surah.translated_name?.name),
        ...nameVariants(`surah ${surah.name_simple}`),
        ...nameVariants(`surah ${surah.name_simple.replace(/^Al-/, '')}`),
        ...nameVariants(`surah ${surah.translated_name?.name ?? ''}`),
      ];
      const matchedName = names.find((name) => name && normalized.includes(name));
      if (!matchedName) continue;

      const remaining = normalized.replace(matchedName, '').trim();
      const ayahMatch = remaining.match(/\b(\d{1,3})\b/);
      if (!ayahMatch) continue;

      const ayah = Number(ayahMatch[1]);
      if (ayah >= 1 && ayah <= surah.verses_count) {
        return `${surah.id}:${ayah}`;
      }
    }

    return null;
  }, [cleanSearchQuery, surahs]);

  const shouldRunSearch = cleanSearchQuery.length >= 2 && !directVerseKey;
  const { data: verseSearch, isLoading: isSearching } = useVerseSearch(shouldRunSearch ? cleanSearchQuery : '');

  const searchResults = React.useMemo(() => {
    const seen = new Set<string>();
    return (verseSearch?.results ?? []).filter((result) => {
      if (seen.has(result.verse_key)) return false;
      seen.add(result.verse_key);
      return true;
    }).slice(0, 8);
  }, [verseSearch?.results]);

  const getSurahName = (verseKey: string) => {
    const [surahId] = verseKey.split(':');
    const surah = surahs?.find((s) => s.id === Number(surahId));
    return surah ? `${surah.name_simple} ${verseKey}` : verseKey;
  };

  const selectVerse = (verseKey: string) => {
    setSelectedVerseKey((current) => (current === verseKey ? null : verseKey));
    setAiResult(null);
  };

  const handleAICheck = async () => {
    if (!reflectionText.trim()) return;
    setIsChecking(true);
    setAiResult(null);
    try {
      const verseText = selectedVerse
        ? selectedTranslation
        : 'General Quranic reflection';
      const result = await groqAI.checkReflectionAlignment(
        selectedVerseKey ?? 'general',
        verseText,
        reflectionText.trim(),
      );
      setAiResult(result);
    } catch {
      setAiResult({ aligned: true, feedback: 'Unable to check alignment at this time.' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (!reflectionText.trim() || !user?.id) { router.back(); return; }
    setIsSaving(true);
    try {
      await saveReflection(user.id, {
        verse_key: selectedVerseKey ?? undefined,
        body: reflectionText.trim(),
        is_public: isPublic,
        ai_enrichment: aiResult ? { aligned: aiResult.aligned, feedback: aiResult.feedback } : undefined,
      });
      // Invalidate so the journal list refetches immediately on return
      await qc.invalidateQueries({ queryKey: ['reflections', user.id] });
    } catch { /* silent */ } finally {
      setIsSaving(false);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Reflection</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveBtn}
          disabled={!reflectionText.trim() || isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color={Colors.purple} />
            : <Text style={[styles.saveBtnText, !reflectionText.trim() && { opacity: 0.4 }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Personalized prompt */}
          {hasSavedVerses && (
            <Card variant="bordered" padding="md" style={styles.promptCard}>
              <View style={styles.promptHeader}>
                <Ionicons name="sparkles-outline" size={14} color={Colors.gold} />
                <Text style={styles.promptLabel}>Prompt for you</Text>
                {promptLoading && <ActivityIndicator size="small" color={Colors.gold} style={{ marginLeft: 'auto' }} />}
              </View>
              {promptData && (
                <>
                  <Text style={styles.promptText}>{promptData.prompt}</Text>
                  {promptData.suggestedVerseKey && (
                    <TouchableOpacity
                      style={styles.promptVerseChip}
                      onPress={() => setSelectedVerseKey(promptData.suggestedVerseKey)}
                    >
                      <Text style={styles.promptVerseText}>Use {promptData.suggestedVerseKey} →</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Verse selection */}
          <Text style={styles.label}>Which verse are you reflecting on?</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by topic, surah, or verse key"
              placeholderTextColor={Colors.textMuted}
              value={verseSearchQuery}
              onChangeText={setVerseSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {cleanSearchQuery ? (
              <TouchableOpacity onPress={() => setVerseSearchQuery('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {directVerseKey ? (
            <TouchableOpacity
              style={[styles.verseResult, selectedVerseKey === directVerseKey && styles.verseResultActive]}
              onPress={() => selectVerse(directVerseKey)}
            >
              <View style={styles.verseResultHeader}>
                <Text style={styles.verseChipRef}>{getSurahName(directVerseKey)}</Text>
                <Ionicons name={selectedVerseKey === directVerseKey ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={Colors.gold} />
              </View>
              <Text style={styles.verseResultText}>Use this verse for your reflection.</Text>
            </TouchableOpacity>
          ) : null}

          {shouldRunSearch && isSearching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="small" color={Colors.gold} />
              <Text style={styles.searchLoadingText}>Searching Quran verses...</Text>
            </View>
          ) : null}

          {shouldRunSearch && !isSearching && searchResults.length === 0 ? (
            <Text style={styles.emptySearchText}>No verses found. Try a topic like patience, mercy, prayer, or a reference like 2:255.</Text>
          ) : null}

          {searchResults.map((result) => (
            <TouchableOpacity
              key={result.verse_key}
              style={[styles.verseResult, selectedVerseKey === result.verse_key && styles.verseResultActive]}
              onPress={() => selectVerse(result.verse_key)}
            >
              <View style={styles.verseResultHeader}>
                <Text style={styles.verseChipRef}>{getSurahName(result.verse_key)}</Text>
                <Ionicons name={selectedVerseKey === result.verse_key ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={Colors.gold} />
              </View>
              <Text style={styles.verseResultText} numberOfLines={3}>
                {stripHtml(result.translations?.[0]?.text ?? result.text ?? '')}
              </Text>
            </TouchableOpacity>
          ))}

          {!cleanSearchQuery && savedVerses.length > 0 ? (
            <View style={styles.savedVerseSection}>
              <Text style={styles.savedVerseLabel}>Saved verses</Text>
              {savedVerses.slice(0, 5).map((verse) => (
                <TouchableOpacity
                  key={verse.verseKey}
                  style={[styles.verseChip, selectedVerseKey === verse.verseKey && styles.verseChipActive]}
                  onPress={() => selectVerse(verse.verseKey)}
                >
                  <Text style={styles.verseChipRef}>{getSurahName(verse.verseKey)}</Text>
                  <Text style={styles.savedVerseText} numberOfLines={2}>{verse.translation}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* Show selected verse text */}
          {selectedVerse && selectedTranslation ? (
            <View style={styles.selectedVerseBox}>
              <Text style={styles.selectedVerseArabic}>{selectedVerse.text_uthmani}</Text>
              <Text style={styles.selectedVerseTranslation}>{selectedTranslation}</Text>
            </View>
          ) : null}

          {/* Text area */}
          <Text style={styles.label}>Your reflection</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Write your thoughts, feelings, or insights about this verse..."
            placeholderTextColor={Colors.textMuted}
            value={reflectionText}
            onChangeText={setReflectionText}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          {/* AI check */}
          <TouchableOpacity
            style={[styles.aiBtn, (!reflectionText.trim() || isChecking) && styles.aiBtnDisabled]}
            onPress={handleAICheck}
            disabled={!reflectionText.trim() || isChecking}
          >
            {isChecking ? (
              <View style={styles.aiBtnRow}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={styles.aiBtnText}>Checking alignment...</Text>
              </View>
            ) : (
              <Text style={styles.aiBtnText}>Check with AI + Get Tafsir</Text>
            )}
          </TouchableOpacity>

          {/* AI result */}
          {aiResult && (
            <Card
              variant="bordered"
              padding="md"
              style={aiResult.aligned ? styles.alignedCard : styles.warningCard}
            >
              <View style={styles.aiResultHeader}>
                <Ionicons
                  name={aiResult.aligned ? 'checkmark-circle' : 'warning-outline'}
                  size={16}
                  color={aiResult.aligned ? Colors.teal : Colors.coral}
                />
                <Text style={[styles.aiResultTitle, { color: aiResult.aligned ? Colors.teal : Colors.coral }]}>
                  {aiResult.aligned ? 'Theologically Aligned' : 'Review Suggested'}
                </Text>
              </View>
              <Text style={styles.aiResultText}>{aiResult.feedback}</Text>
            </Card>
          )}

          {/* Privacy toggle */}
          <TouchableOpacity
            style={styles.privacyRow}
            onPress={() => setIsPublic((p) => !p)}
          >
            <Text style={styles.privacyText}>Share with Quran Reflect</Text>
            <View style={[styles.toggle, isPublic && styles.toggleOn]}>
              <View style={[styles.toggleKnob, isPublic && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  headerTitle: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.textPrimary },
  saveBtn: { paddingVertical: 4, minWidth: 40, alignItems: 'flex-end' },
  saveBtnText: { fontFamily: 'Raleway_700Bold', color: Colors.purple, fontSize: 15 },
  scroll: { padding: 20, gap: 16 },
  label: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  promptCard: { gap: 10, borderColor: Colors.gold + '44', backgroundColor: Colors.gold + '08' },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promptLabel: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold, letterSpacing: 1, textTransform: 'uppercase' },
  promptText: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary, lineHeight: 24, fontStyle: 'italic' },
  promptVerseChip: { alignSelf: 'flex-start', backgroundColor: Colors.gold + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.gold + '44' },
  promptVerseText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.gold },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.darkBg2, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.darkBorder,
    paddingHorizontal: 14, minHeight: 50,
  },
  searchInput: {
    flex: 1, fontFamily: 'Raleway_400Regular', fontSize: 14,
    color: Colors.textPrimary, paddingVertical: 12,
  },
  clearSearchBtn: { padding: 2 },
  searchLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  searchLoadingText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  emptySearchText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  verseChip: {
    backgroundColor: Colors.darkBg2, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, gap: 6,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  verseChipActive: { backgroundColor: Colors.purple + '22', borderColor: Colors.purple },
  verseChipRef: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  verseResult: {
    backgroundColor: Colors.darkBg2, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.darkBorder, gap: 8,
  },
  verseResultActive: { backgroundColor: Colors.purple + '22', borderColor: Colors.purple },
  verseResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  verseResultText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  savedVerseSection: { gap: 10 },
  savedVerseLabel: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold, letterSpacing: 1, textTransform: 'uppercase' },
  savedVerseText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  selectedVerseBox: {
    backgroundColor: Colors.darkBg2, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.gold + '33', gap: 8,
  },
  selectedVerseArabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 22,
    color: Colors.goldLight, textAlign: 'right', writingDirection: 'rtl', lineHeight: 34,
  },
  selectedVerseTranslation: {
    fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted,
    fontStyle: 'italic', lineHeight: 20,
  },
  textArea: {
    backgroundColor: Colors.darkBg2, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.darkBorder,
    padding: 16, fontFamily: 'Raleway_400Regular',
    fontSize: 15, color: Colors.textPrimary,
    minHeight: 160, lineHeight: 24,
  },
  aiBtn: {
    backgroundColor: Colors.purple, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  aiBtnDisabled: { opacity: 0.4 },
  aiBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.white },
  alignedCard: { borderColor: Colors.teal + '66', gap: 10 },
  warningCard: { borderColor: Colors.coral + '66', gap: 10 },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiResultTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14 },
  aiResultText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  privacyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.darkBg2, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  privacyText: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary },
  toggle: {
    width: 48, height: 26, borderRadius: 13,
    backgroundColor: Colors.darkBg3, justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: Colors.teal },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white },
  toggleKnobOn: { alignSelf: 'flex-end' },
});
