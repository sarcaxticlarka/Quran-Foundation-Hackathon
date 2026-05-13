import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { useCrisisStore } from '../../src/stores/crisisStore';
import { useVerse } from '../../src/hooks/useQuran';
import { getFirstTranslation } from '../../src/hooks/useQuran';

const MOOD_VERSE_KEYS: Record<string, string> = {
  overwhelmed: '2:286',
  anxious:     '13:28',
  sad:         '94:5',
  lonely:      '59:23',
  grateful:    '14:7',
  lost:        '2:269',
  angry:       '3:134',
  hopeful:     '39:53',
};

function MoodVersePreview({ mood }: { mood: string }) {
  const verseKey = MOOD_VERSE_KEYS[mood];
  const { data: verse, isLoading } = useVerse(verseKey ?? '');
  if (!verseKey) return null;
  return (
    <View style={previewStyles.card}>
      <Text style={previewStyles.label}>A verse for you</Text>
      {isLoading ? (
        <ActivityIndicator color={Colors.gold} size="small" />
      ) : verse ? (
        <>
          <Text style={previewStyles.arabic}>{verse.text_uthmani}</Text>
          <Text style={previewStyles.translation}>{getFirstTranslation(verse)}</Text>
          <Text style={previewStyles.ref}>{verseKey}</Text>
        </>
      ) : null}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkBg2, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.2)', gap: 8,
  },
  label: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold, letterSpacing: 1.2, textTransform: 'uppercase' },
  arabic: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 22, color: Colors.goldLight,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 36,
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  ref: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted },
});

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const MOOD_PRESETS: { label: string; icon: IoniconName; value: string; color: string }[] = [
  { label: 'Overwhelmed', icon: 'cloudy-night-outline', value: 'overwhelmed', color: Colors.purple    },
  { label: 'Anxious',     icon: 'pulse-outline',        value: 'anxious',     color: Colors.coral     },
  { label: 'Sad',         icon: 'rainy-outline',        value: 'sad',         color: Colors.blue      },
  { label: 'Lonely',      icon: 'moon-outline',         value: 'lonely',      color: Colors.textMuted },
  { label: 'Grateful',    icon: 'heart-outline',        value: 'grateful',    color: Colors.gold      },
  { label: 'Lost',        icon: 'navigate-outline',     value: 'lost',        color: Colors.tealLight },
  { label: 'Angry',       icon: 'flame-outline',        value: 'angry',       color: Colors.coral     },
  { label: 'Hopeful',     icon: 'leaf-outline',         value: 'hopeful',     color: Colors.tealLight },
];

export default function CrisisEntryScreen() {
  const router = useRouter();
  const { triggerCrisis, isLoading } = useCrisisStore();
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSubmit = async () => {
    const mood   = selectedMood || 'seeking guidance';
    const detail = text.trim() || undefined;
    await triggerCrisis(mood, detail);
    router.push('/crisis/result');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="moon" size={40} color={Colors.gold} />
            </View>
          </Animated.View>

          <Text style={styles.title}>What's on your heart?</Text>
          <Text style={styles.subtitle}>Share how you're feeling. The Quran will respond to you personally.</Text>

          <Text style={styles.label}>Quick moods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
            <View style={styles.moodRow}>
              {MOOD_PRESETS.map((mood) => {
                const active = selectedMood === mood.value;
                return (
                  <TouchableOpacity
                    key={mood.value}
                    style={[styles.moodChip, active && { borderColor: mood.color, backgroundColor: `${mood.color}18` }]}
                    onPress={() => { setSelectedMood(active ? null : mood.value); setText(''); }}
                  >
                    <Ionicons name={mood.icon} size={16} color={active ? mood.color : Colors.textMuted} />
                    <Text style={[styles.moodLabel, active && { color: mood.color, fontFamily: 'Raleway_700Bold' }]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {selectedMood && <MoodVersePreview mood={selectedMood} />}

          <Text style={styles.label}>Or describe in your own words</Text>
          <TextInput
            style={styles.input}
            placeholder="I feel overwhelmed by my exams and need guidance..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={(t) => { setText(t); setSelectedMood(null); }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!text.trim() && !selectedMood) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || (!text.trim() && !selectedMood)}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <Text style={styles.submitText}>AI is reading your heart…</Text>
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.submitText}>Find My Verse</Text>
                <Ionicons name="sparkles" size={16} color={Colors.darkBg} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.privacy}>Your feelings stay private. Only you can see this.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.darkBg2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.darkBorder },
  iconWrap: { alignItems: 'center', marginTop: 8 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(201,164,86,0.1)', borderWidth: 1, borderColor: 'rgba(201,164,86,0.25)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  label: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  moodScroll: { marginHorizontal: -24 },
  moodRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 10 },
  moodChip: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.darkBg2, borderRadius: 24, borderWidth: 1, borderColor: Colors.darkBorder, flexDirection: 'row', alignItems: 'center', gap: 7 },
  moodLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  input: { fontFamily: 'Raleway_400Regular', backgroundColor: Colors.darkBg2, borderRadius: 16, borderWidth: 1, borderColor: Colors.darkBorder, padding: 16, fontSize: 15, color: Colors.textPrimary, minHeight: 120, lineHeight: 22 },
  submitBtn: { backgroundColor: Colors.gold, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnDisabled: { opacity: 0.35 },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.darkBg },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  privacy: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
});
