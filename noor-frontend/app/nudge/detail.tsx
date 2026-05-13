import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { useVerseOfDay, getFirstTranslation } from '../../src/hooks/useQuran';
import { groqAI } from '../../src/services/groqAI';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TIME_CONTEXTS: Record<string, { label: string; icon: IoniconName; color: string; description: string }> = {
  fajr:      { label: 'Fajr Reminder',      icon: 'sunny-outline',        color: Colors.gold,  description: 'Begin your day with the remembrance of Allah' },
  midday:    { label: 'Midday Reflection',   icon: 'partly-sunny-outline', color: Colors.coral, description: 'Pause your work and reconnect with your Lord' },
  afternoon: { label: 'Afternoon Pause',     icon: 'cloud-outline',        color: Colors.gold,  description: 'The Quran speaks to your heart in moments of stillness' },
  maghrib:   { label: 'Maghrib Moment',      icon: 'partly-sunny-outline', color: Colors.teal,  description: 'Gratitude at the close of day brings peace' },
  isha:      { label: 'Night Contemplation', icon: 'moon-outline',         color: Colors.gold,  description: 'End your day reflecting on the words of Allah' },
};

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6)  return 'fajr';
  if (h < 12) return 'midday';
  if (h < 16) return 'afternoon';
  if (h < 20) return 'maghrib';
  return 'isha';
}

export default function NudgeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const timeOfDay = id ?? getTimeOfDay();
  const ctx = TIME_CONTEXTS[timeOfDay] ?? TIME_CONTEXTS.isha;
  const { data: verse, isLoading: verseLoading } = useVerseOfDay();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8,  useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!verse) return;
    const translation = getFirstTranslation(verse);
    if (!translation) return;
    setAiLoading(true);
    groqAI.getNudgeInsight(ctx.label, verse.verse_key, verse.text_uthmani, translation)
      .then(setAiInsight)
      .catch(() => setAiInsight(null))
      .finally(() => setAiLoading(false));
  }, [verse?.verse_key]);

  const translation = verse ? getFirstTranslation(verse) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name={ctx.icon} size={16} color={ctx.color} />
          <Text style={styles.headerTitle}>{ctx.label}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.contextBanner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.contextIconWrap, { borderColor: ctx.color + '55' }]}>
            <Ionicons name={ctx.icon} size={36} color={ctx.color} />
          </View>
          <Text style={styles.contextDesc}>{ctx.description}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {verseLoading ? (
            <Card variant="gold" padding="lg" style={styles.verseLoader}>
              <ActivityIndicator color={Colors.gold} />
            </Card>
          ) : verse ? (
            <Card variant="gold" padding="lg" style={styles.verseCard}>
              <Text style={styles.verseLabel}>Your Verse</Text>
              <Text style={styles.arabic}>{verse.text_uthmani}</Text>
              <Text style={styles.translation}>{translation}</Text>
              <Text style={styles.reference}>{verse.verse_key}</Text>
            </Card>
          ) : null}
        </Animated.View>

        <Card variant="bordered" padding="md" style={styles.tafsirCard}>
          <View style={styles.tafsirTitleRow}>
            <Ionicons name="book-outline" size={14} color={Colors.gold} />
            <Text style={styles.tafsirLabel}>AI Spiritual Insight</Text>
            {aiLoading && <ActivityIndicator size="small" color={Colors.gold} style={{ marginLeft: 8 }} />}
          </View>
          {aiInsight ? (
            <Text style={styles.tafsirText}>{aiInsight}</Text>
          ) : aiLoading ? (
            <Text style={styles.tafsirText}>Generating insight...</Text>
          ) : (
            <Text style={styles.tafsirText}>Reflect on how this verse speaks to your current moment.</Text>
          )}
        </Card>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.journalBtn}
            onPress={() => router.push('/profile/reflection/write' as any)}
          >
            <Ionicons name="create-outline" size={18} color={Colors.gold} />
            <Text style={styles.journalBtnText}>Write a Reflection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.crisisBtn}
            onPress={() => router.push('/crisis/entry' as any)}
          >
            <Ionicons name="moon-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.crisisBtnText}>Need Comfort?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Nudges are scheduled based on your time windows in Settings → Notifications
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.darkBg2, alignItems: 'center', justifyContent: 'center',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16 },
  contextBanner: {
    backgroundColor: Colors.darkBg2, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  contextIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  contextDesc: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  verseLoader: { alignItems: 'center', paddingVertical: 32 },
  verseCard: { gap: 14 },
  verseLabel: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.goldDim, letterSpacing: 1, textTransform: 'uppercase' },
  arabic: {
    fontSize: 26, color: Colors.goldLight, textAlign: 'right',
    fontFamily: 'serif', writingDirection: 'rtl', lineHeight: 42,
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textSecondary, lineHeight: 24, fontStyle: 'italic' },
  reference: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  tafsirCard: { gap: 10 },
  tafsirTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tafsirLabel: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.gold },
  tafsirText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  actions: { gap: 12 },
  journalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.goldMuted, borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.gold + '44',
  },
  journalBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.gold },
  crisisBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  crisisBtnText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  hint: {
    fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 18, paddingHorizontal: 20,
  },
});
