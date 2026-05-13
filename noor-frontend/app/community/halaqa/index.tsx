import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { useHalaqaStore, HalaqaGroup } from '../../../src/stores/halaqaStore';
import { useNotificationStore } from '../../../src/stores/notificationStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { createHalaqa, fetchUserHalaqa, joinHalaqa, leaveHalaqa } from '../../../src/services/db';

// ─── Static discoverable circles (public catalog) ────────────────────────────
const CATALOG: HalaqaGroup[] = [
  {
    id: 'cat-1',
    name: 'Surah Kahf Journey',
    description: 'Weekly deep dive into Surah Kahf and its four stories. Perfect for Fridays.',
    members: [
      { id: 'm1', name: 'Ibrahim', versesRead: 48, streak: 6, isActive: true, lanternIntensity: 0.85 },
      { id: 'm2', name: 'Fatima',  versesRead: 36, streak: 4, isActive: true, lanternIntensity: 0.7  },
      { id: 'm3', name: 'Yusuf',   versesRead: 20, streak: 2, isActive: false, lanternIntensity: 0.4 },
    ],
    currentSurah: 18, currentVerse: 1,
    totalLanternGlow: 0.65, weeklyGoal: 10, weeklyProgress: 7,
    createdAt: new Date().toISOString(), isAdmin: false,
  },
  {
    id: 'cat-2',
    name: 'Juz Amma Sisters',
    description: 'A sisters-only circle for memorising and reflecting on Juz Amma together.',
    members: [
      { id: 'm4', name: 'Aisha',  versesRead: 60, streak: 14, isActive: true, lanternIntensity: 1.0 },
      { id: 'm5', name: 'Maryam', versesRead: 45, streak: 10, isActive: true, lanternIntensity: 0.9 },
    ],
    currentSurah: 78, currentVerse: 1,
    totalLanternGlow: 0.9, weeklyGoal: 7, weeklyProgress: 7,
    createdAt: new Date().toISOString(), isAdmin: false,
  },
  {
    id: 'cat-3',
    name: 'Tafsir Deep Dive',
    description: 'Scholarly verse-by-verse commentary on Al-Fatiha using Ibn Kathir and classical sources.',
    members: [
      { id: 'm6', name: 'Omar',  versesRead: 14, streak: 3, isActive: true,  lanternIntensity: 0.55 },
      { id: 'm7', name: 'Hamza', versesRead: 8,  streak: 1, isActive: false, lanternIntensity: 0.3  },
    ],
    currentSurah: 1, currentVerse: 1,
    totalLanternGlow: 0.4, weeklyGoal: 5, weeklyProgress: 3,
    createdAt: new Date().toISOString(), isAdmin: false,
  },
];

// ─── Lantern mini icon ────────────────────────────────────────────────────────
function LanternMini({ brightness }: { brightness: number }) {
  const opacity = 0.3 + brightness * 0.7;
  return (
    <View style={[lStyles.outer, { opacity }]}>
      <View style={lStyles.inner}>
        <Ionicons name="flame" size={20} color={Colors.gold} />
      </View>
    </View>
  );
}
const lStyles = StyleSheet.create({
  outer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.goldMuted, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.darkBg2, alignItems: 'center', justifyContent: 'center' },
});

// ─── Card for a joined circle ─────────────────────────────────────────────────
function JoinedCard({ halaqa, onLeave }: { halaqa: HalaqaGroup; onLeave: (id: string) => void }) {
  const router = useRouter();
  const streak = Math.max(...halaqa.members.map((m) => m.streak), 0);
  const brightness = Math.min(1, halaqa.totalLanternGlow);

  return (
    <Card variant="bordered" padding="md" style={styles.halaqaCard}>
      <View style={styles.cardTop}>
        <LanternMini brightness={brightness} />
        <View style={styles.cardInfo}>
          <Text style={styles.halaqaName}>{halaqa.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{halaqa.members.length} members</Text>
            </View>
            {streak > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={12} color={Colors.gold} />
                <Text style={[styles.metaText, { color: Colors.gold }]}>{streak} day streak</Text>
              </View>
            )}
          </View>
          {halaqa.description ? (
            <Text style={styles.halaqaDesc} numberOfLines={1}>{halaqa.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (halaqa.weeklyProgress / halaqa.weeklyGoal) * 100)}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{halaqa.weeklyProgress}/{halaqa.weeklyGoal} this week</Text>
      </View>

      <View style={styles.cardBtns}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push(`/community/halaqa/${halaqa.id}` as any)}
        >
          <Text style={styles.viewBtnText}>Open Circle</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.darkBg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={() => Alert.alert('Leave Circle', `Leave "${halaqa.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => onLeave(halaqa.id) },
          ])}
        >
          <Ionicons name="exit-outline" size={15} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

// ─── Card for a discoverable circle ──────────────────────────────────────────
function DiscoverCard({ halaqa, onJoin }: { halaqa: HalaqaGroup; onJoin: (h: HalaqaGroup) => void }) {
  const router = useRouter();
  const brightness = halaqa.totalLanternGlow;

  return (
    <TouchableOpacity onPress={() => router.push(`/community/halaqa/${halaqa.id}` as any)} activeOpacity={0.85}>
      <Card variant="bordered" padding="md" style={styles.discoverCard}>
        <View style={styles.discoverTop}>
          <LanternMini brightness={brightness} />
          <View style={styles.cardInfo}>
            <Text style={styles.halaqaName}>{halaqa.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.metaText}>{halaqa.members.length} members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.metaText}>{Math.round(brightness * 100)}% active</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.description}>{halaqa.description}</Text>
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={(e) => { e.stopPropagation(); onJoin(halaqa); }}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={16} color={Colors.darkBg} />
          <Text style={styles.joinBtnText}>Join Circle</Text>
        </TouchableOpacity>
      </Card>
    </TouchableOpacity>
  );
}

// ─── Create Circle Modal ──────────────────────────────────────────────────────
function CreateModal({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, goal: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');

  const submit = () => {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter a circle name.'); return; }
    onCreate(name.trim(), description.trim(), goal.trim());
    setName(''); setDescription(''); setGoal('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create a Circle</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CIRCLE NAME *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Surah Mulk 30-Day"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              maxLength={60}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>GOAL</Text>
            <TextInput
              value={goal}
              onChangeText={setGoal}
              placeholder="e.g. Memorise Juz Amma"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              maxLength={60}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What will this circle study together?"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.inputMulti]}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <TouchableOpacity style={styles.createSubmitBtn} onPress={submit} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={18} color={Colors.darkBg} />
            <Text style={styles.createSubmitText}>Create Circle</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HalaqaListScreen() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const { groups, isLoading, error, setGroups, setLoading, setError, join, leave, addGroup } = useHalaqaStore();
  const enqueue = useNotificationStore((s) => s.enqueue);
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? 'You';

  const mapCircle = (circle: any): HalaqaGroup => ({
    id: circle.id,
    name: circle.name,
    description: circle.description,
    members: (circle.members ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar_url,
      versesRead: m.verses_read ?? 0,
      streak: m.streak ?? 0,
      isActive: m.is_active ?? true,
      lanternIntensity: m.lantern_intensity ?? 1,
    })),
    currentSurah: 1,
    currentVerse: 1,
    totalLanternGlow: Math.min(1, Math.max(0.25, ((circle.members?.length ?? 1) / 10))),
    weeklyGoal: 7,
    weeklyProgress: 0,
    createdAt: circle.created_at ?? new Date().toISOString(),
    isAdmin: circle.is_admin ?? circle.created_by === user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchUserHalaqa(user.id)
      .then((rows) => {
        if (cancelled) return;
        const mapped = rows.map(mapCircle);
        setGroups(mapped);
        mapped.forEach((g: HalaqaGroup) => join(g.id));
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error ?? err.message ?? 'Could not load halaqas.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const joinedHalaqas = groups;
  const discoverHalaqas = CATALOG.filter((c) => !groups.find((g) => g.name === c.name));

  const handleJoin = async (halaqa: HalaqaGroup) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const remote = await createHalaqa(user.id, halaqa.name, halaqa.description);
      const group = mapCircle(remote);
      addGroup(group);
      join(group.id);
      enqueue({
        id: Date.now().toString(),
        title: `Joined ${group.name}!`,
        body: 'Your lantern is now part of the circle.',
        type: 'halaqa',
      });
      router.push(`/community/halaqa/${group.id}` as any);
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message ?? 'Could not join circle.';
      setError(message);
      Alert.alert('Join failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinInvite = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!user?.id || !code) return;
    try {
      setLoading(true);
      setError(null);
      const remote = await joinHalaqa(user.id, code);
      const group = mapCircle(remote);
      if (!groups.find((g) => g.id === group.id)) addGroup(group);
      join(group.id);
      setInviteCode('');
      router.push(`/community/halaqa/${group.id}` as any);
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message ?? 'Invalid invite code.';
      setError(message);
      Alert.alert('Could not join', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (id: string) => {
    if (!user?.id) return;
    try {
      await leaveHalaqa(user.id, id);
      leave(id);
      setGroups(groups.filter((g) => g.id !== id));
    } catch (err: any) {
      Alert.alert('Leave failed', err.response?.data?.error ?? err.message ?? 'Could not leave circle.');
    }
  };

  const handleCreate = async (name: string, description: string) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const remote = await createHalaqa(user.id, name, description);
      const newGroup = mapCircle(remote);
      addGroup(newGroup);
      join(newGroup.id);
      enqueue({
        id: Date.now().toString(),
        title: `Circle created!`,
        body: `"${name}" is ready. Invite others to join.`,
        type: 'halaqa',
      });
      router.push(`/community/halaqa/${newGroup.id}` as any);
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message ?? 'Could not create circle.';
      setError(message);
      Alert.alert('Create failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Micro-Halaqas</Text>
          <Text style={styles.headerSub}>Study circles · 5–10 people</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={16} color={Colors.darkBg} />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.gold} />
            <Text style={styles.loadingText}>Syncing circles...</Text>
          </View>
        )}

        {error && (
          <Card variant="bordered" padding="md">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Card variant="bordered" padding="md" style={styles.inviteCard}>
          <Text style={styles.sectionTitle}>Join by Invite</Text>
          <View style={styles.inviteRow}>
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="ENTER CODE"
              autoCapitalize="characters"
              placeholderTextColor={Colors.textMuted}
              style={styles.inviteInput}
            />
            <TouchableOpacity style={styles.inviteBtn} onPress={handleJoinInvite} disabled={!inviteCode.trim() || isLoading}>
              <Text style={styles.inviteBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Empty state */}
        {joinedHalaqas.length === 0 && discoverHalaqas.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No circles yet</Text>
            <Text style={styles.emptyBody}>Create your own or join a public circle to begin studying together.</Text>
          </View>
        )}

        {/* Your circles */}
        {joinedHalaqas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Circles</Text>
            {joinedHalaqas.map((h) => (
              <JoinedCard key={h.id} halaqa={h} onLeave={handleLeave} />
            ))}
          </>
        )}

        {/* Discover */}
        {discoverHalaqas.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, joinedHalaqas.length > 0 && { marginTop: 8 }]}>
              Discover
            </Text>
            {discoverHalaqas.map((h) => (
              <DiscoverCard key={h.id} halaqa={h} onJoin={handleJoin} />
            ))}
          </>
        )}

      </ScrollView>

      <CreateModal visible={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.textPrimary },
  headerSub: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  createBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.darkBg },

  scroll: { padding: 20, gap: 12 },

  sectionTitle: {
    fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4,
  },

  // ── Joined card ────────────────────────────────────────────────────────────
  halaqaCard: { gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardInfo: { flex: 1, gap: 4 },
  halaqaName: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.textPrimary },
  halaqaDesc: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textSecondary },

  progressRow: { gap: 6 },
  progressBg: { height: 4, backgroundColor: Colors.darkBg3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  progressLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },

  cardBtns: { flexDirection: 'row', gap: 8 },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 11,
  },
  viewBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.darkBg },
  leaveBtn: {
    width: 42, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.darkBg3, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },

  // ── Discover card ──────────────────────────────────────────────────────────
  discoverCard: { gap: 10 },
  discoverTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  description: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 11,
  },
  joinBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.darkBg },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: Colors.textSecondary },
  emptyBody: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 8 },
  loadingText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  errorText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.coral, lineHeight: 20 },
  inviteCard: { gap: 10 },
  inviteRow: { flexDirection: 'row', gap: 8 },
  inviteInput: {
    flex: 1, backgroundColor: Colors.darkBg3, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.darkBorder,
    fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textPrimary,
  },
  inviteBtn: { backgroundColor: Colors.gold, borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  inviteBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.darkBg },

  // ── Create modal ───────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: Colors.darkBg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 16,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.darkBorder, alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 22, color: Colors.textPrimary },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.darkBg3, alignItems: 'center', justifyContent: 'center' },

  field: { gap: 8 },
  fieldLabel: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  input: {
    backgroundColor: Colors.darkBg3, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  inputMulti: { height: 88, textAlignVertical: 'top' },

  createSubmitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 16,
    marginTop: 4,
  },
  createSubmitText: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.darkBg },
});
