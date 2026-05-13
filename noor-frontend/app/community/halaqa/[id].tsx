import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { LanternGlow } from '../../../src/components/halaqa/LanternGlow';
import { MemberRow } from '../../../src/components/halaqa/MemberRow';
import { fetchHalaqaCircle } from '../../../src/services/db';
import { useAuthStore } from '../../../src/stores/authStore';
import { HalaqaGroup } from '../../../src/stores/halaqaStore';

function mapCircle(circle: any): HalaqaGroup & { inviteCode?: string } {
  const members = (circle.members ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    avatar: m.avatar_url,
    versesRead: m.verses_read ?? 0,
    streak: m.streak ?? 0,
    isActive: m.is_active ?? true,
    lanternIntensity: m.lantern_intensity ?? 1,
  }));

  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    members,
    currentSurah: 1,
    currentVerse: 1,
    totalLanternGlow: members.length ? members.filter((m: any) => m.isActive).length / members.length : 0,
    weeklyGoal: 7,
    weeklyProgress: 0,
    createdAt: circle.created_at ?? new Date().toISOString(),
    isAdmin: circle.is_admin ?? false,
    inviteCode: circle.invite_code,
  };
}

export default function HalaqaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [halaqa, setHalaqa] = useState<(HalaqaGroup & { inviteCode?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchHalaqaCircle(id, userId)
      .then((circle) => {
        if (!cancelled) setHalaqa(mapCircle(circle));
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error ?? err.message ?? 'Could not load circle.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, userId]);

  const activeMembers = useMemo(() => halaqa?.members.filter((m) => m.isActive) ?? [], [halaqa]);
  const groupStreak = useMemo(() => Math.max(...(halaqa?.members.map((m) => m.streak) ?? [0]), 0), [halaqa]);
  const brightness = halaqa?.members.length ? activeMembers.length / halaqa.members.length : 0;

  const handleNudge = () => {
    setNudgeSent(true);
    setTimeout(() => setNudgeSent(false), 2000);
  };

  const handleShareInvite = () => {
    if (!halaqa) return;
    Share.share({
      message: `Join our Halaqa "${halaqa.name}" in Noor. Invite code: ${halaqa.inviteCode ?? halaqa.id}`,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.centerText}>Loading circle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !halaqa) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Circle unavailable</Text>
          <Text style={styles.centerText}>{error ?? 'This circle could not be found.'}</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{halaqa.name}</Text>
        <TouchableOpacity
          style={styles.lanternBtn}
          onPress={() => router.push({ pathname: '/community/halaqa/lantern', params: { id: halaqa.id } } as any)}
        >
          <Ionicons name="flame-outline" size={22} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.lanternSection}>
          <LanternGlow intensity={brightness} size={120} />
          <Text style={styles.lanternLabel}>Group Lantern</Text>
          <Text style={styles.lanternSub}>
            {activeMembers.length} of {halaqa.members.length} members active today
          </Text>
        </View>

        <Card variant="gold" padding="md" style={styles.streakCard}>
          <View style={styles.streakIconWrap}>
            <Ionicons name="flame" size={24} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>Group Streak: {groupStreak} Days</Text>
            <Text style={styles.streakSub}>
              {groupStreak >= 7 ? 'Group Insight unlocked!' : `${7 - groupStreak} days until Group Insight`}
            </Text>
          </View>
          {groupStreak >= 7 && (
            <TouchableOpacity
              style={styles.insightBtn}
              onPress={() => router.push({ pathname: '/community/halaqa/insight', params: { surahGoal: halaqa.name } } as any)}
            >
              <Text style={styles.insightBtnText}>View</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.darkBg} />
            </TouchableOpacity>
          )}
        </Card>

        <Card variant="bordered" padding="md" style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleShareInvite}>
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.teal + '22' }]}>
              <Ionicons name="share-outline" size={18} color={Colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Invite Members</Text>
              <Text style={styles.inviteCode}>Code: {halaqa.inviteCode ?? 'Unavailable'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Circle Members</Text>
        {halaqa.members.map((member) => (
          <MemberRow key={member.id} member={member} />
        ))}

        {halaqa.members.length === 0 && (
          <Card variant="bordered" padding="md">
            <Text style={styles.centerText}>No members yet. Share the invite code to bring people in.</Text>
          </Card>
        )}

        {halaqa.members.filter((m) => !m.isActive).length > 0 && (
          <Card variant="bordered" padding="md" style={styles.warningCard}>
            <View style={styles.warningTitleRow}>
              <Ionicons name="warning-outline" size={16} color={Colors.coral} />
              <Text style={styles.warningTitle}>Streak at Risk</Text>
            </View>
            <Text style={styles.warningSub}>
              {halaqa.members.filter((m) => !m.isActive).length} members have not checked in today.
            </Text>
            <TouchableOpacity style={styles.encourageBtn} onPress={handleNudge}>
              <Ionicons name="mail-outline" size={16} color={Colors.coral} />
              <Text style={styles.encourageBtnText}>
                {nudgeSent ? 'Nudge sent!' : 'Send Nudge to Circle'}
              </Text>
            </TouchableOpacity>
          </Card>
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
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  lanternBtn: { padding: 4 },
  scroll: { padding: 20, gap: 16 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  centerText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  errorTitle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: Colors.textPrimary },
  backHomeBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  backHomeText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
  lanternSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  lanternLabel: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.textPrimary },
  lanternSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center',
  },
  streakTitle: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.goldLight },
  streakSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  insightBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  insightBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.darkBg },
  actionsCard: { gap: 0 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  inviteCode: { fontFamily: 'Raleway_700Bold', fontSize: 12, color: Colors.gold, marginTop: 3 },
  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  warningCard: { borderColor: 'rgba(224,107,85,0.4)', gap: 8 },
  warningTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningTitle: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.coral },
  warningSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  encourageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(224,107,85,0.1)', borderRadius: 10,
    paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(224,107,85,0.4)',
  },
  encourageBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.coral },
});
