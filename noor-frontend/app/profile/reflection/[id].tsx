import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { fetchReflections } from '../../../src/services/db';
import { useAuthStore } from '../../../src/stores/authStore';
import { useVerse } from '../../../src/hooks/useQuran';
import { getFirstTranslation } from '../../../src/hooks/useQuran';
import { groqAI } from '../../../src/services/groqAI';

export default function ReflectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  const [tafsir, setTafsir] = useState('');
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirLoaded, setTafsirLoaded] = useState(false);

  const { data: reflections, isLoading } = useQuery({
    queryKey: ['reflections', userId],
    queryFn: () => fetchReflections(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const reflection = reflections?.find((r: any) => String(r.id) === String(id));

  const { data: verse } = useVerse(reflection?.verse_key ?? '');
  const translation = verse ? getFirstTranslation(verse) : '';

  const loadTafsir = async () => {
    if (!verse || !reflection) return;
    setTafsirLoading(true);
    try {
      const text = await groqAI.getTafsirSummary(
        verse.verse_key,
        verse.text_uthmani,
        translation,
      );
      setTafsir(text);
      setTafsirLoaded(true);
    } catch {
      setTafsir('Could not load tafsir. Please check your connection.');
      setTafsirLoaded(true);
    } finally {
      setTafsirLoading(false);
    }
  };

  React.useEffect(() => {
    if (reflection?.ai_enrichment?.tafsir) {
      setTafsir(reflection.ai_enrichment.tafsir);
      setTafsirLoaded(true);
    }
  }, [reflection]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!reflection) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.gold} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reflection</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.notFoundText}>Reflection not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = new Date(reflection.created_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reflection</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Verse card */}
        {reflection.verse_key && (
          <Card variant="bordered" padding="lg">
            <View style={styles.verseKeyBadge}>
              <Text style={styles.verseKeyText}>{reflection.verse_key}</Text>
            </View>
            {verse ? (
              <>
                <Text style={styles.arabic}>{verse.text_uthmani}</Text>
                <Text style={styles.verseTranslation}>{translation}</Text>
              </>
            ) : (
              <ActivityIndicator color={Colors.gold} style={{ marginVertical: 12 }} />
            )}
          </Card>
        )}

        {/* Reflection body */}
        <Card variant="bordered" padding="md">
          <View style={styles.reflectionHeader}>
            <Text style={styles.sectionTitle}>Your Reflection</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <Text style={styles.reflectionText}>{reflection.body}</Text>
        </Card>

        {/* Tafsir enrichment */}
        <Card variant="bordered" padding="md" style={styles.tafsirCard}>
          <View style={styles.tafsirHeader}>
            <View style={styles.tafsirIconWrap}>
              <Ionicons name="school-outline" size={18} color={Colors.purple} />
            </View>
            <Text style={styles.sectionTitle}>AI Tafsir Insight</Text>
            {tafsirLoaded && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.teal} />
                <Text style={styles.verifiedText}>AI Scholar</Text>
              </View>
            )}
          </View>

          {tafsirLoaded ? (
            <Text style={styles.tafsirText}>{tafsir}</Text>
          ) : (
            <TouchableOpacity
              style={styles.loadTafsirBtn}
              onPress={loadTafsir}
              disabled={tafsirLoading || !verse}
            >
              {tafsirLoading ? (
                <ActivityIndicator color={Colors.purple} size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={16} color={Colors.purple} />
                  <Text style={styles.loadTafsirText}>Load Tafsir from AI Scholar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Card>
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
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 14 },
  scroll: { padding: 20, gap: 16 },

  verseKeyBadge: {
    backgroundColor: 'rgba(201,164,86,0.12)', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12,
  },
  verseKeyText: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 24, color: Colors.goldLight,
    textAlign: 'right', lineHeight: 40, writingDirection: 'rtl',
  },
  verseTranslation: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, fontStyle: 'italic', marginTop: 10 },

  reflectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  dateText: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  reflectionText: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary, lineHeight: 26 },

  tafsirCard: { borderColor: 'rgba(120,80,200,0.25)' },
  tafsirHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  tafsirIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(120,80,200,0.1)', alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.teal },
  tafsirText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
  loadTafsirBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(120,80,200,0.3)', borderRadius: 12,
    paddingVertical: 12,
  },
  loadTafsirText: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.purple },
});
