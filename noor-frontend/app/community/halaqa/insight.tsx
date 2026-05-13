import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { groqAI } from '../../../src/services/groqAI';

export default function GroupInsightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ surahGoal?: string; focusVerse?: string }>();

  const surahGoal = params.surahGoal ?? 'Weekly Tafsir — Al-Asr';
  const focusVerse = params.focusVerse ?? 'By time. Indeed, mankind is in loss — Surah Al-Asr 103:1-2';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['halaqa-insight', surahGoal],
    queryFn: () => groqAI.getWeeklyInsight(surahGoal, focusVerse, 5),
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const handleShare = () => {
    if (!data) return;
    Share.share({
      message: `Weekly Halaqa Insight:\n\n${data.discussionPrompt}\n\nAction: ${data.actionItem}`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Insight</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.unlockBanner}>
          <View style={styles.unlockIconWrap}>
            <Ionicons name="trophy" size={40} color={Colors.gold} />
          </View>
          <Text style={styles.unlockTitle}>7-Day Streak Unlocked!</Text>
          <Text style={styles.unlockSub}>
            Your circle maintained a 7-day streak. Here is your exclusive scholarly breakdown.
          </Text>
        </View>

        <Card variant="bordered" padding="lg" style={styles.verseCard}>
          <Text style={styles.verseLabel}>This Week's Focus Verse</Text>
          <Text style={styles.arabic}>وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ</Text>
          <Text style={styles.translation}>
            "By time. Indeed, mankind is in loss." — Surah Al-Asr 103:1-2
          </Text>
        </Card>

        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.loadingText}>Generating scholarly insight...</Text>
          </View>
        )}

        {isError && !data && (
          <Card variant="bordered" padding="md">
            <Text style={styles.errorText}>Could not load AI insight. Please try again later.</Text>
          </Card>
        )}

        {data && (
          <>
            <Card variant="bordered" padding="md">
              <View style={styles.sectionTitleRow}>
                <Ionicons name="book-outline" size={16} color={Colors.gold} />
                <Text style={styles.sectionTitle}>Scholarly Commentary</Text>
              </View>
              <Text style={styles.bodyText}>{data.tafsirNote}</Text>
            </Card>

            <Card variant="bordered" padding="md">
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bulb-outline" size={16} color={Colors.gold} />
                <Text style={styles.sectionTitle}>Circle Discussion Prompt</Text>
              </View>
              <Text style={styles.bodyText}>{data.discussionPrompt}</Text>
            </Card>

            <Card variant="bordered" padding="md">
              <View style={styles.sectionTitleRow}>
                <Ionicons name="library-outline" size={16} color={Colors.gold} />
                <Text style={styles.sectionTitle}>Related Hadith</Text>
              </View>
              <Text style={styles.bodyText}>{data.hadith}</Text>
            </Card>

            <Card variant="bordered" padding="md">
              <View style={styles.sectionTitleRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.teal} />
                <Text style={styles.sectionTitle}>Action for This Week</Text>
              </View>
              <Text style={styles.bodyText}>{data.actionItem}</Text>
            </Card>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.darkBg} />
              <Text style={styles.shareBtnText}>Share Insight with Circle</Text>
            </TouchableOpacity>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16 },
  unlockBanner: {
    backgroundColor: Colors.goldMuted, borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.gold + '44',
  },
  unlockIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.darkBg2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold + '66',
  },
  unlockTitle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: Colors.goldLight },
  unlockSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  verseCard: { gap: 12 },
  verseLabel: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  arabic: {
    fontSize: 24, color: Colors.goldLight, textAlign: 'right',
    fontFamily: 'serif', lineHeight: 40, writingDirection: 'rtl',
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary, lineHeight: 24, fontStyle: 'italic' },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  loadingText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  errorText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.coral, textAlign: 'center' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary },
  bodyText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingVertical: 16,
  },
  shareBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.darkBg },
});
