import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LanternGlow } from '../../src/components/halaqa/LanternGlow';

const MOCK_GROUPS = [
  { id: 'g1', name: 'Surah Al-Baqarah Circle', members: 8,  currentSurah: 'Al-Baqarah', lanternIntensity: 0.82, weeklyProgress: 73, isActive: true  },
  { id: 'g2', name: 'Juz Amma Study',          members: 5,  currentSurah: "An-Naba'",   lanternIntensity: 0.55, weeklyProgress: 40, isActive: true  },
  { id: 'g3', name: 'Tafsir Ibn Kathir',        members: 12, currentSurah: 'Al-Fatiha',  lanternIntensity: 0.95, weeklyProgress: 91, isActive: false },
];

export default function CommunityScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.heading}>Community</Text>
          <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/community/halaqa')} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color={Colors.darkBg} />
            <Text style={styles.joinBtnText}>Join Halaqa</Text>
          </TouchableOpacity>
        </View>

        {/* Recitation */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recitation Practice</Text>
            <Badge label="AI Feedback" variant="teal" />
          </View>
          <TouchableOpacity onPress={() => router.push('/community/recite')} activeOpacity={0.85}>
            <Card variant="gold" padding="lg" style={styles.reciteCard}>
              <View style={styles.reciteRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reciteTitle}>Practice with Tajweed AI</Text>
                  <Text style={styles.reciteSub}>Record your recitation and receive instant feedback on pronunciation.</Text>
                </View>
                <View style={styles.micCircle}>
                  <Ionicons name="mic" size={26} color={Colors.gold} />
                </View>
              </View>
              <View style={styles.reciteStats}>
                {[
                  { val: '94%', label: 'Accuracy' },
                  { val: '23',  label: 'Sessions' },
                  { val: 'Al-Fatiha', label: 'Last Surah' },
                ].map((s, i, arr) => (
                  <React.Fragment key={s.label}>
                    <View style={styles.reciteStat}>
                      <Text style={styles.reciteStatNum}>{s.val}</Text>
                      <Text style={styles.reciteStatLabel}>{s.label}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={styles.reciteStatDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* My Halaqas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Halaqas</Text>
          {MOCK_GROUPS.map((group) => (
            <TouchableOpacity key={group.id} onPress={() => router.push(`/community/halaqa/${group.id}` as any)} activeOpacity={0.82}>
              <Card variant="bordered" padding="md" style={styles.halaqaCard}>
                <View style={styles.halaqaRow}>
                  <LanternGlow intensity={group.lanternIntensity} size={56} showLabel={false} />
                  <View style={styles.halaqaInfo}>
                    <View style={styles.halaqaNameRow}>
                      <Text style={styles.halaqaName} numberOfLines={1}>{group.name}</Text>
                      {group.isActive && <Badge label="Active" variant="teal" dot />}
                    </View>
                    <Text style={styles.halaqaMeta}>{group.members} members · {group.currentSurah}</Text>
                    <View style={styles.progressWrap}>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${group.weeklyProgress}%` }]} />
                      </View>
                      <Text style={styles.progressLabel}>{group.weeklyProgress}%</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.createHalaqaBtn} onPress={() => router.push('/community/halaqa')} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.tealLight} />
            <Text style={styles.createHalaqaBtnText}>Create or browse more Halaqas</Text>
          </TouchableOpacity>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Insights</Text>
          <TouchableOpacity onPress={() => router.push('/community/halaqa/insight')} activeOpacity={0.85}>
            <Card variant="bordered" padding="md" style={styles.insightCard}>
              <View style={styles.insightRow}>
                <View style={styles.insightIconWrap}>
                  <Ionicons name="bulb-outline" size={22} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>Weekly Reflection</Text>
                  <Text style={styles.insightSub}>See what your community is reflecting on this week</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 },
  heading: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 30, color: Colors.textPrimary },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.gold, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  joinBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.darkBg },
  section: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: Colors.textPrimary },
  reciteCard: {},
  reciteRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  reciteTitle: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.textPrimary, marginBottom: 6 },
  reciteSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  micCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(201,164,86,0.12)', borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)', alignItems: 'center', justifyContent: 'center' },
  reciteStats: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: Colors.darkBorder, paddingTop: 14 },
  reciteStat: { alignItems: 'center', gap: 4 },
  reciteStatNum: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 20, color: Colors.gold },
  reciteStatLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  reciteStatDivider: { width: 1, height: 32, backgroundColor: Colors.darkBorder },
  halaqaCard: { marginBottom: 0 },
  halaqaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  halaqaInfo: { flex: 1, gap: 4 },
  halaqaNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  halaqaName: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary, flex: 1 },
  halaqaMeta: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 3, backgroundColor: Colors.darkBg3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: Colors.gold, borderRadius: 2 },
  progressLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, color: Colors.gold, width: 28 },
  createHalaqaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(42,122,58,0.3)', backgroundColor: 'rgba(42,122,58,0.08)' },
  createHalaqaBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.tealLight },
  insightCard: {},
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  insightIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  insightSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
});
