import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { fetchReflections } from '../../src/services/db';
import { useAuthStore } from '../../src/stores/authStore';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function JournalScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  const { data: reflections, isLoading } = useQuery({
    queryKey: ['reflections', userId],
    queryFn: () => fetchReflections(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reflection Journal</Text>
          <Text style={styles.headerSub}>
            {isLoading ? '...' : `${reflections?.length ?? 0} reflections`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/profile/reflection/write' as any)}
        >
          <Ionicons name="create-outline" size={16} color={Colors.darkBg} />
          <Text style={styles.newBtnText}>Write</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.gold} />
            <Text style={styles.loadingText}>Loading your reflections…</Text>
          </View>
        ) : reflections && reflections.length > 0 ? (
          reflections.map((r: any) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => router.push(`/profile/reflection/${r.id}` as any)}
              activeOpacity={0.85}
            >
              <Card variant="bordered" padding="md" style={styles.reflectionCard}>
                <View style={styles.cardTop}>
                  {r.verse_key && (
                    <View style={styles.verseKeyBadge}>
                      <Text style={styles.verseKeyText}>{r.verse_key}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.preview} numberOfLines={3}>{r.body}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{formatDate(r.created_at)}</Text>
                  <View style={styles.badges}>
                    {r.ai_enrichment && <Badge label="AI Tafsir" variant="purple" />}
                    {r.is_public && <Badge label="Public" variant="teal" />}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Card variant="bordered" padding="md" style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="create-outline" size={28} color={Colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Start your first reflection</Text>
            <Text style={styles.emptyText}>
              Choose a verse, write your thoughts, and our AI scholar will enrich it with tafsir insights.
            </Text>
            <TouchableOpacity
              style={styles.writeBtn}
              onPress={() => router.push('/profile/reflection/write' as any)}
            >
              <Text style={styles.writeBtnText}>Write Reflection</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Prompt card — always shown below entries */}
        {reflections && reflections.length > 0 && (
          <TouchableOpacity
            style={styles.addMoreBtn}
            onPress={() => router.push('/profile/reflection/write' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.gold} />
            <Text style={styles.addMoreText}>Add another reflection</Text>
          </TouchableOpacity>
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
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.purple, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  newBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.white },
  scroll: { padding: 20, gap: 14 },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },

  reflectionCard: { gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verseKeyBadge: {
    backgroundColor: 'rgba(201,164,86,0.12)', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)',
  },
  verseKeyText: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold },
  preview: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  badges: { flexDirection: 'row', gap: 6 },

  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  emptyTitle: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.textPrimary },
  emptyText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  writeBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  writeBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.white },

  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  addMoreText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.gold },
});
