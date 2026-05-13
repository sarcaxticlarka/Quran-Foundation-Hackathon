import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';

const COLLECTED_ROOTS = [
  { root: 'ر-ح-م', word: 'رحمة', meaning: 'Mercy & Compassion', count: 114, rarity: 'Common', color: Colors.teal },
  { root: 'ع-ل-م', word: 'علم', meaning: 'Knowledge & Wisdom', count: 96, rarity: 'Common', color: Colors.purple },
  { root: 'ص-ب-ر', word: 'صبر', meaning: 'Patience & Endurance', count: 72, rarity: 'Uncommon', color: Colors.gold },
  { root: 'ق-ل-ب', word: 'قلب', meaning: 'Heart & Soul', count: 58, rarity: 'Uncommon', color: Colors.coral },
  { root: 'ن-و-ر', word: 'نور', meaning: 'Light & Guidance', count: 43, rarity: 'Rare', color: Colors.amber },
];

const RARITY_COLORS = {
  Common: Colors.teal,
  Uncommon: Colors.gold,
  Rare: Colors.coral,
  Legendary: Colors.purple,
};

export default function RootCollectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Root Collection</Text>
          <Text style={styles.headerSub}>{COLLECTED_ROOTS.length} roots collected</Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="layers-outline" size={13} color={Colors.amber} />
          <Text style={styles.xpText}>{COLLECTED_ROOTS.length}/99</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.cardGrid}>
          {COLLECTED_ROOTS.map((root) => (
            <TouchableOpacity
              key={root.root}
              style={[styles.rootCard, { borderColor: root.color + '66' }]}
              onPress={() => router.push(`/explore/word/${encodeURIComponent(root.root)}` as any)}
              activeOpacity={0.85}
            >
              {/* Rarity badge */}
              <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[root.rarity as keyof typeof RARITY_COLORS] + '33' }]}>
                <Text style={[styles.rarityText, { color: RARITY_COLORS[root.rarity as keyof typeof RARITY_COLORS] }]}>
                  {root.rarity}
                </Text>
              </View>

              {/* Arabic word */}
              <Text style={[styles.rootArabic, { color: root.color }]}>{root.word}</Text>

              {/* Root */}
              <Text style={styles.rootLetters}>{root.root}</Text>

              {/* Meaning */}
              <Text style={styles.rootMeaning}>{root.meaning}</Text>

              {/* Occurrences */}
              <View style={styles.rootMeta}>
                <Text style={styles.rootCount}>×{root.count}</Text>
                <Text style={styles.rootCountLabel}>in Quran</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Locked cards placeholder */}
          {Array.from({ length: 3 }, (_, i) => (
            <View key={`locked-${i}`} style={styles.lockedCard}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
              <Text style={styles.lockedText}>Tap Arabic words to collect</Text>
            </View>
          ))}
        </View>

        <Card variant="bordered" padding="md" style={styles.tipCard}>
          <View style={styles.tipTitleRow}>
            <Ionicons name="bulb-outline" size={14} color={Colors.gold} />
            <Text style={styles.tipTitle}>How to Collect Roots</Text>
          </View>
          <Text style={styles.tipText}>
            When reading any verse, tap any Arabic word to see its root. Tap "+ Collect" to add it to your collection. Each root unlocks a trading card!
          </Text>
        </Card>
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.amber + '22', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.amber,
  },
  xpText: { fontSize: 13, fontWeight: '700', color: Colors.amber },
  scroll: { padding: 20 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rootCard: {
    width: '47%', backgroundColor: Colors.darkBg2,
    borderRadius: 16, padding: 16, borderWidth: 1,
    gap: 6, alignItems: 'center',
  },
  rarityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  rarityText: { fontSize: 10, fontWeight: '700' },
  rootArabic: { fontSize: 32, fontFamily: 'serif', marginTop: 4 },
  rootLetters: { fontSize: 14, color: Colors.textMuted, fontFamily: 'serif' },
  rootMeaning: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  rootMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rootCount: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  rootCountLabel: { fontSize: 10, color: Colors.textMuted },
  lockedCard: {
    width: '47%', backgroundColor: Colors.darkBg2,
    borderRadius: 16, padding: 16, borderWidth: 1,
    borderColor: Colors.darkBorder, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 140,
  },

  lockedText: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  tipCard: { marginTop: 16 },
  tipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.gold },
  tipText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
