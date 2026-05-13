import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  Modal, Animated, ActivityIndicator, TextInput, Share, Keyboard,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { mcpService, MCPVerseResult } from '../../src/services/mcpService';
import { useSavedStore } from '../../src/stores/savedStore';

const { width } = Dimensions.get('window');
const GRAPH_HEIGHT = 320;
const GRAPH_WIDTH  = width - 40;

const CONCEPTS = [
  { id: 'mercy',     label: 'Mercy',     arabic: 'رحمة', color: Colors.teal,      x: 0.5,  y: 0.5,  size: 60, desc: 'Allah\'s all-encompassing mercy (Rahmah) is a central theme — mentioned more than any other attribute.' },
  { id: 'justice',   label: 'Justice',   arabic: 'عدل',  color: Colors.blue,      x: 0.2,  y: 0.3,  size: 48, desc: 'Divine justice (\'Adl) underpins Quranic ethics, from personal conduct to societal law.' },
  { id: 'patience',  label: 'Patience',  arabic: 'صبر',  color: Colors.gold,      x: 0.75, y: 0.25, size: 44, desc: 'Sabr (patient endurance) is promised as the path through every trial and hardship.' },
  { id: 'knowledge', label: 'Knowledge', arabic: 'علم',  color: Colors.purple,    x: 0.8,  y: 0.65, size: 52, desc: '\'Ilm (knowledge) is the first command of revelation — "Read" — and a duty for every believer.' },
  { id: 'gratitude', label: 'Gratitude', arabic: 'شكر',  color: Colors.coral,     x: 0.3,  y: 0.75, size: 40, desc: 'Shukr (gratitude to Allah) is the response to every blessing and the antidote to ingratitude.' },
  { id: 'tawakkul',  label: 'Trust',     arabic: 'توكل', color: Colors.amber,     x: 0.15, y: 0.6,  size: 36, desc: 'Tawakkul — placing full reliance on Allah — brings peace when human effort reaches its limit.' },
];

const CONNECTIONS = [
  ['mercy', 'justice'], ['mercy', 'patience'], ['mercy', 'gratitude'],
  ['justice', 'knowledge'], ['patience', 'tawakkul'], ['knowledge', 'mercy'],
];

// ─── More-options bottom sheet ────────────────────────────────────────────────

interface ActionSheetProps {
  verse: MCPVerseResult | null;
  conceptId: string;
  onClose: () => void;
}

function ActionSheet({ verse, conceptId, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  const { isSaved, save, remove, updateNote, getNote } = useSavedStore();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [noteMode, setNoteMode] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (verse) {
      setNoteText(getNote(verse.verseKey) ?? '');
      setNoteMode(false);
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start();
    }
  }, [verse]);

  if (!verse) return null;

  const saved = isSaved(verse.verseKey);

  const handleSave = () => {
    if (saved) {
      remove(verse.verseKey);
    } else {
      save({
        verseKey: verse.verseKey,
        arabicText: verse.arabicText,
        translation: verse.translation,
        conceptId,
      });
    }
  };

  const handleSaveNote = () => {
    updateNote(verse.verseKey, noteText.trim());
    if (!saved) {
      save({ verseKey: verse.verseKey, arabicText: verse.arabicText, translation: verse.translation, conceptId });
    }
    setNoteMode(false);
    Keyboard.dismiss();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${verse.arabicText}\n\n"${verse.translation}"\n— Quran ${verse.verseKey}\n\nShared via Noor`,
      });
    } catch {}
  };

  return (
    <Modal transparent animationType="fade" visible={!!verse} onRequestClose={onClose}>
      <TouchableOpacity style={sheet.overlay} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>
        <Animated.View style={[sheet.panel, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 12 }]}>
          {/* Drag handle */}
          <View style={sheet.handle} />

          {/* Verse preview */}
          <View style={sheet.versePreview}>
            <Text style={sheet.verseArabic} numberOfLines={2}>{verse.arabicText}</Text>
            <Text style={sheet.verseTranslation} numberOfLines={3}>{verse.translation}</Text>
            <Text style={sheet.verseRef}>{verse.verseKey}</Text>
          </View>

          <View style={sheet.divider} />

          {!noteMode ? (
            <>
              {/* Save / Unsave */}
              <TouchableOpacity style={sheet.option} onPress={handleSave} activeOpacity={0.75}>
                <View style={[sheet.optionIcon, { backgroundColor: saved ? Colors.gold + '22' : Colors.darkBg3 }]}>
                  <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? Colors.gold : Colors.textMuted} />
                </View>
                <View style={sheet.optionText}>
                  <Text style={sheet.optionTitle}>{saved ? 'Saved to Library' : 'Save to Library'}</Text>
                  <Text style={sheet.optionSub}>{saved ? 'Tap to remove' : 'Keep this verse for later'}</Text>
                </View>
                {saved && <Ionicons name="checkmark-circle" size={18} color={Colors.gold} />}
              </TouchableOpacity>

              {/* Add / Edit Note */}
              <TouchableOpacity style={sheet.option} onPress={() => setNoteMode(true)} activeOpacity={0.75}>
                <View style={[sheet.optionIcon, { backgroundColor: Colors.purple + '22' }]}>
                  <Ionicons name="create-outline" size={20} color={Colors.purple} />
                </View>
                <View style={sheet.optionText}>
                  <Text style={sheet.optionTitle}>{getNote(verse.verseKey) ? 'Edit Note' : 'Add a Note'}</Text>
                  <Text style={sheet.optionSub}>
                    {getNote(verse.verseKey) ? `"${getNote(verse.verseKey)}"` : 'Write a personal reflection on this verse'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity style={sheet.option} onPress={handleShare} activeOpacity={0.75}>
                <View style={[sheet.optionIcon, { backgroundColor: Colors.teal + '22' }]}>
                  <Ionicons name="share-outline" size={20} color={Colors.teal} />
                </View>
                <View style={sheet.optionText}>
                  <Text style={sheet.optionTitle}>Share Verse</Text>
                  <Text style={sheet.optionSub}>Send to a friend or post it</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            /* Note input mode */
            <View style={sheet.noteSection}>
              <Text style={sheet.noteLabel}>Your reflection</Text>
              <TextInput
                style={sheet.noteInput}
                placeholder="What does this verse mean to you..."
                placeholderTextColor={Colors.textMuted}
                value={noteText}
                onChangeText={setNoteText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <View style={sheet.noteActions}>
                <TouchableOpacity style={sheet.noteCancelBtn} onPress={() => { setNoteMode(false); Keyboard.dismiss(); }}>
                  <Text style={sheet.noteCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={sheet.noteSaveBtn} onPress={handleSaveNote}>
                  <Text style={sheet.noteSaveText}>Save Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sheet = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.darkBg2, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
    borderTopWidth: 1, borderColor: Colors.darkBorder,
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.darkBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  versePreview: { gap: 6, marginBottom: 14 },
  verseArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 22, color: Colors.goldLight, textAlign: 'right', lineHeight: 34, writingDirection: 'rtl' },
  verseTranslation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  verseRef: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: Colors.darkBorder, marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  optionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  optionSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  noteSection: { gap: 12, paddingTop: 4 },
  noteLabel: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  noteInput: {
    fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textPrimary,
    backgroundColor: Colors.darkBg3, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.darkBorder, minHeight: 100, lineHeight: 22,
  },
  noteActions: { flexDirection: 'row', gap: 10 },
  noteCancelBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.darkBorder },
  noteCancelText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textMuted },
  noteSaveBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.gold },
  noteSaveText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
});

// ─── Verse card with quick-save ───────────────────────────────────────────────

function VerseResultCard({
  verse,
  conceptId,
  onMore,
}: {
  verse: MCPVerseResult;
  conceptId: string;
  onMore: (v: MCPVerseResult) => void;
}) {
  const { isSaved, save, remove } = useSavedStore();
  const saved = isSaved(verse.verseKey);

  const toggleSave = () => {
    if (saved) {
      remove(verse.verseKey);
    } else {
      save({ verseKey: verse.verseKey, arabicText: verse.arabicText, translation: verse.translation, conceptId });
    }
  };

  return (
    <View style={vcard.container}>
      <Text style={vcard.arabic}>{verse.arabicText}</Text>
      <Text style={vcard.translation} numberOfLines={3}>{verse.translation}</Text>
      <View style={vcard.footer}>
        <Text style={vcard.ref}>{verse.verseKey}</Text>
        <View style={vcard.actions}>
          <TouchableOpacity onPress={toggleSave} style={vcard.actionBtn} activeOpacity={0.7}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? Colors.gold : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onMore(verse)} style={vcard.actionBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
      {verse.reasoning && (
        <View style={vcard.reasonBanner}>
          <Ionicons name="sparkles" size={11} color={Colors.purple} />
          <Text style={vcard.reasonText}>{verse.reasoning}</Text>
        </View>
      )}
    </View>
  );
}

const vcard = StyleSheet.create({
  container: {
    backgroundColor: Colors.darkBg3, borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 22, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 36,
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ref: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold, letterSpacing: 0.5 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  reasonBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.purple + '11', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: Colors.purple + '22',
  },
  reasonText: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function KnowledgeGraphScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [actionVerse, setActionVerse] = useState<MCPVerseResult | null>(null);
  const { verses: savedVerses } = useSavedStore();

  const selectedConcept = CONCEPTS.find((c) => c.id === selected);
  const graphQuery = activeQuery || selectedConcept?.label || '';
  const activeColor = selectedConcept?.color ?? Colors.gold;

  // Load real verses for the selected concept/query via Groq semantic search
  const { data: verseResults, isLoading: versesLoading, refetch: refetchVerses, isError: versesError } = useQuery({
    queryKey: ['concept-verses', graphQuery],
    queryFn: () => mcpService.semanticSearch(graphQuery, 3),
    enabled: !!graphQuery,
    staleTime: 1000 * 60 * 20,
    retry: 2,
  });

  const getNode = (id: string) => CONCEPTS.find((c) => c.id === id)!;

  const handleNodePress = (id: string) => {
    setActiveQuery('');
    setSelected((prev) => (prev === id ? null : id));
  };

  const handleSearch = () => {
    const query = customQuery.trim();
    if (!query) return;
    setSelected(null);
    setActiveQuery(query);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Knowledge Graph</Text>
          <Text style={styles.headerSub}>Tap any concept to explore</Text>
        </View>
        <View style={styles.headerRight}>
          {savedVerses.length > 0 && (
            <TouchableOpacity style={styles.savedBadge} onPress={() => router.push('/profile/library' as any)}>
              <Ionicons name="bookmark" size={14} color={Colors.gold} />
              <Text style={styles.savedBadgeText}>{savedVerses.length}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.rootsBtn} onPress={() => router.push('/explore/roots' as any)}>
            <Text style={styles.rootsBtnText}>Root Cards</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Graph canvas */}
        <Card variant="bordered" padding="none" style={styles.graphCard}>
          <View style={[styles.graphCanvas, { height: GRAPH_HEIGHT }]}>
            {/* Connection lines */}
            {CONNECTIONS.map(([a, b], i) => {
              const nA = getNode(a);
              const nB = getNode(b);
              if (!nA || !nB) return null;
              const ax = nA.x * GRAPH_WIDTH, ay = nA.y * GRAPH_HEIGHT;
              const bx = nB.x * GRAPH_WIDTH, by = nB.y * GRAPH_HEIGHT;
              const length = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
              const angle  = Math.atan2(by - ay, bx - ax) * (180 / Math.PI);
              const isActive = selected === a || selected === b;
              return (
                <View
                  key={i}
                  style={[
                    styles.connection,
                    {
                      left: ax, top: ay, width: length,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: '0 50%',
                      backgroundColor: isActive ? Colors.gold + '60' : Colors.darkBorder,
                      height: isActive ? 2 : 1,
                    },
                  ]}
                />
              );
            })}

            {/* Nodes */}
            {CONCEPTS.map((concept) => {
              const isSelected = selected === concept.id;
              return (
                <TouchableOpacity
                  key={concept.id}
                  style={[
                    styles.node,
                    {
                      left: concept.x * GRAPH_WIDTH - concept.size / 2,
                      top:  concept.y * GRAPH_HEIGHT - concept.size / 2,
                      width: concept.size, height: concept.size,
                      borderRadius: concept.size / 2,
                      backgroundColor: concept.color + (isSelected ? 'CC' : '33'),
                      borderColor: concept.color,
                      borderWidth: isSelected ? 2.5 : 1,
                    },
                  ]}
                  onPress={() => handleNodePress(concept.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.nodeArabic, { fontSize: concept.size > 50 ? 14 : 12 }]}>
                    {concept.arabic}
                  </Text>
                  <Text style={[styles.nodeLabel, { fontSize: concept.size > 50 ? 9 : 8 }]}>
                    {concept.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={styles.searchBox}>
          <Ionicons name="sparkles-outline" size={16} color={Colors.gold} />
          <TextInput
            style={styles.searchInput}
            value={customQuery}
            onChangeText={setCustomQuery}
            placeholder="Search a word or theme, e.g. mercy, salah, fear"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchAction} onPress={handleSearch} activeOpacity={0.75}>
            <Text style={styles.searchActionText}>Find</Text>
          </TouchableOpacity>
        </View>

        {/* Selected concept detail */}
        {(selectedConcept || activeQuery) && (
          <Card variant="bordered" padding="lg" style={styles.detailCard}>
            {/* Concept header */}
            <View style={styles.detailHeader}>
              <Text style={[styles.detailArabic, { color: activeColor }]}>
                {selectedConcept?.arabic ?? 'بحث'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailName}>{selectedConcept?.label ?? activeQuery}</Text>
                <Text style={styles.detailDesc}>
                  {selectedConcept?.desc ?? 'Groq searches for related Quranic ideas, then Noor loads the actual surah and verse text.'}
                </Text>
              </View>
            </View>

            {/* Real verse results */}
            <View style={styles.versesSection}>
              <Text style={styles.versesSectionLabel}>
                Related Verses · {versesLoading ? '…' : `${verseResults?.length ?? 0} found`}
              </Text>

              {versesLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={activeColor} />
                  <Text style={[styles.loadingText, { color: activeColor }]}>
                    Searching the Quran…
                  </Text>
                </View>
              ) : verseResults && verseResults.length > 0 ? (
                <View style={styles.verseList}>
                  {verseResults.map((v) => (
                    <VerseResultCard
                      key={v.verseKey}
                      verse={v}
                      conceptId={selectedConcept?.id ?? activeQuery}
                      onMore={(verse) => setActionVerse(verse)}
                    />
                  ))}
                </View>
              ) : (
                <TouchableOpacity style={styles.retryRow} onPress={() => refetchVerses()} activeOpacity={0.7}>
                  <Ionicons name="refresh-outline" size={16} color={activeColor} />
                  <Text style={[styles.retryText, { color: activeColor }]}>
                    {versesError ? 'Error loading — tap to retry' : 'No verses found — tap to retry'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* All concepts list */}
        <Text style={styles.sectionTitle}>All Concepts</Text>
        <View style={styles.conceptGrid}>
          {CONCEPTS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.conceptChip,
                { borderColor: c.color + '66' },
                selected === c.id && { backgroundColor: c.color + '22', borderColor: c.color },
              ]}
              onPress={() => handleNodePress(c.id)}
            >
              <Text style={[styles.conceptArabic, { color: c.color }]}>{c.arabic}</Text>
              <Text style={styles.conceptLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Saved verses count */}
        {savedVerses.length > 0 && (
          <TouchableOpacity
            style={styles.libraryBanner}
            onPress={() => router.push('/profile/library' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.libraryIconWrap}>
              <Ionicons name="library-outline" size={20} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.libraryTitle}>My Saved Library</Text>
              <Text style={styles.librarySub}>{savedVerses.length} verse{savedVerses.length !== 1 ? 's' : ''} saved</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.goldDim} />
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Action sheet */}
      <ActionSheet
        verse={actionVerse}
        conceptId={selected ?? ''}
        onClose={() => setActionVerse(null)}
      />
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
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.goldMuted, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  savedBadgeText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.gold },
  rootsBtn: {
    backgroundColor: Colors.amber + '22', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.amber,
  },
  rootsBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.amber },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  graphCard: { overflow: 'hidden' },
  graphCanvas: { width: '100%', position: 'relative' },
  connection: { position: 'absolute', transformOrigin: '0 50%' },
  node: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', padding: 4,
  },
  nodeArabic: { fontFamily: 'CormorantGaramond_400Regular', color: Colors.white, textAlign: 'center' },
  nodeLabel: { fontFamily: 'Raleway_600SemiBold', color: Colors.white + 'BB', textAlign: 'center' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.darkBg2, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  searchInput: { flex: 1, fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textPrimary, paddingVertical: 2 },
  searchAction: { backgroundColor: Colors.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  searchActionText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.darkBg },

  detailCard: { gap: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  detailArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 42, lineHeight: 50 },
  detailName: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  detailDesc: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  versesSection: { gap: 12 },
  versesSectionLabel: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', fontSize: 13 },
  verseList: { gap: 10 },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  retryText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13 },

  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  conceptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  conceptChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.darkBg2, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 3, minWidth: 80,
  },
  conceptArabic: { fontFamily: 'CormorantGaramond_400Regular', fontSize: 20 },
  conceptLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.textSecondary },

  libraryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.darkBg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.25)',
  },
  libraryIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
  },
  libraryTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary },
  librarySub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
