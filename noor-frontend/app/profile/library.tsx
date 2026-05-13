import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { useSavedStore, SavedVerse } from '../../src/stores/savedStore';

function SavedVerseCard({ verse, onRemove }: { verse: SavedVerse; onRemove: () => void }) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `${verse.arabicText}\n\n"${verse.translation}"\n— Quran ${verse.verseKey}\n\nShared via Noor`,
      });
    } catch {}
  };

  const confirmRemove = () => {
    Alert.alert(
      'Remove from Library',
      'Remove this verse from your saved library?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ],
    );
  };

  return (
    <Card variant="bordered" padding="md" style={styles.verseCard}>
      <Text style={styles.arabic}>{verse.arabicText}</Text>
      <Text style={styles.translation}>{verse.translation}</Text>

      {verse.note ? (
        <View style={styles.noteBanner}>
          <Ionicons name="create-outline" size={12} color={Colors.purple} />
          <Text style={styles.noteText}>{verse.note}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.ref}>{verse.verseKey}</Text>
          {verse.conceptId && (
            <Text style={styles.conceptTag}>{verse.conceptId}</Text>
          )}
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmRemove} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={Colors.coral} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { verses, remove } = useSavedStore();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Library</Text>
        <View style={{ width: 60 }} />
      </View>

      {verses.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bookmark-outline" size={36} color={Colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>No saved verses yet</Text>
          <Text style={styles.emptySub}>Tap the bookmark icon on any verse in the Knowledge Graph to save it here.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/explore/graph' as any)}>
            <Text style={styles.exploreBtnText}>Open Knowledge Graph</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{verses.length} verse{verses.length !== 1 ? 's' : ''} saved</Text>
          {verses.map((verse) => (
            <SavedVerseCard
              key={verse.verseKey}
              verse={verse}
              onRemove={() => remove(verse.verseKey)}
            />
          ))}
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  countLabel: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },

  verseCard: { gap: 10 },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 22, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 36,
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  noteBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: Colors.purple + '11', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: Colors.purple + '22',
  },
  noteText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ref: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold, letterSpacing: 0.5 },
  conceptTag: {
    fontFamily: 'Raleway_600SemiBold', fontSize: 10, color: Colors.teal,
    backgroundColor: Colors.teal + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    textTransform: 'capitalize',
  },
  footerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  emptyTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.textPrimary },
  emptySub: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  exploreBtn: {
    backgroundColor: Colors.goldMuted, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 13,
    borderWidth: 1, borderColor: Colors.gold + '44', marginTop: 8,
  },
  exploreBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.gold },
});
