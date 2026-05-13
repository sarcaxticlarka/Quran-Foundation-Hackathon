import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, TextInput, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/theme/colors';
import { Card } from '../src/components/ui/Card';
import { useAuthStore } from '../src/stores/authStore';
import { useAuth } from '../src/hooks/useAuth';
import { upsertProfile } from '../src/services/db';
import { groqAI } from '../src/services/groqAI';

const TRANSLATIONS = [
  { id: 20,  name: 'Saheeh International' },
  { id: 85,  name: 'M.A.S. Abdel Haleem' },
  { id: 84,  name: 'T. Usmani' },
];

const NUDGE_TIMES = ['Morning (Fajr)', 'Midday', 'Afternoon', 'Evening (Maghrib)', 'Night (Isha)'];
const MADHHABS    = ['Hanafi', 'Maliki', 'Shafi', 'Hanbali'];
const LEVELS      = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
] as const;
const GOAL_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen() {
  const router = useRouter();
  const user          = useAuthStore((s) => s.user);
  const authProvider  = useAuthStore((s) => s.authProvider);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { logout }    = useAuth();

  // ── Profile editing state ───────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(user?.name ?? '');
  const [isSaving, setIsSaving]       = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // ── Settings — seeded from persisted authStore ──────────────────────────────
  const selectedTranslation = user?.translationId     ?? 20;
  const nudgesEnabled       = user?.nudgesEnabled      ?? true;
  const selectedNudgeTimes  = user?.nudgeTimes         ?? ['Morning (Fajr)', 'Evening (Maghrib)'];
  const reviewReminders     = user?.reviewReminders    ?? true;
  const halaqaAlerts        = user?.halaqaAlerts       ?? true;

  // ── Generic persist helper ──────────────────────────────────────────────────
  const persist = useCallback((updates: Parameters<typeof updateProfile>[0]) => {
    updateProfile(updates);
    if (user?.id && authProvider) {
      const dbUpdates: Record<string, unknown> = {};
      if ('name' in updates)         dbUpdates.name               = updates.name;
      if ('madhab' in updates)       dbUpdates.madhab             = updates.madhab;
      if ('readingLevel' in updates) dbUpdates.reading_level      = updates.readingLevel;
      if ('dailyGoalMinutes' in updates) dbUpdates.daily_goal_minutes = updates.dailyGoalMinutes;
      if ('translationId' in updates) dbUpdates.translation_id     = updates.translationId;
      if ('nudgesEnabled' in updates) dbUpdates.nudges_enabled    = updates.nudgesEnabled;
      if ('nudgeTimes' in updates) dbUpdates.nudge_times          = updates.nudgeTimes;
      if ('reviewReminders' in updates) dbUpdates.review_reminders = updates.reviewReminders;
      if ('halaqaAlerts' in updates) dbUpdates.halaqa_alerts      = updates.halaqaAlerts;
      if (Object.keys(dbUpdates).length > 0) {
        upsertProfile(user.id, dbUpdates as any).catch(console.warn);
      }
    }
  }, [user?.id, authProvider, updateProfile]);

  // ── Name save ───────────────────────────────────────────────────────────────
  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setEditingName(false); return; }
    setIsSaving(true);
    persist({ name: trimmed });
    groqAI.configure({ name: trimmed });
    setIsSaving(false);
    setEditingName(false);
  };

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      setShowSignOut(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <Card variant="bordered" padding="md" style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'N')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  placeholderTextColor={Colors.textMuted}
                />
                <TouchableOpacity onPress={saveName} style={styles.nameEditBtn} disabled={isSaving}>
                  {isSaving
                    ? <ActivityIndicator size="small" color={Colors.gold} />
                    : <Ionicons name="checkmark" size={18} color={Colors.gold} />
                  }
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingName(false); setNameInput(user?.name ?? ''); }}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={() => { setNameInput(user?.name ?? ''); setEditingName(true); }}>
                <Text style={styles.profileName}>{user?.name ?? 'Noor User'}</Text>
                <Ionicons name="pencil-outline" size={14} color={Colors.textMuted} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
        </Card>

        {/* ── Reading & Learning ───────────────────────────────────────────── */}
        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Reading & Learning</Text>

          <Text style={styles.fieldLabel}>Madhab</Text>
          <View style={styles.chipRow}>
            {MADHHABS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, user?.madhab === m && styles.chipActive]}
                onPress={() => {
                  persist({ madhab: m });
                  groqAI.configure({ madhab: m });
                }}
              >
                <Text style={[styles.chipText, user?.madhab === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Reading Level</Text>
          <View style={styles.chipRow}>
            {LEVELS.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, user?.readingLevel === value && styles.chipActive]}
                onPress={() => {
                  persist({ readingLevel: value });
                  groqAI.configure({ readingLevel: value });
                }}
              >
                <Text style={[styles.chipText, user?.readingLevel === value && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Daily Goal (minutes)</Text>
          <View style={styles.chipRow}>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, user?.dailyGoalMinutes === g && styles.chipActive]}
                onPress={() => persist({ dailyGoalMinutes: g })}
              >
                <Text style={[styles.chipText, user?.dailyGoalMinutes === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* ── Quran Translation ────────────────────────────────────────────── */}
        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Quran Translation</Text>
          {TRANSLATIONS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.optionRow}
              onPress={() => persist({ translationId: t.id })}
            >
              <Text style={styles.optionText}>{t.name}</Text>
              {selectedTranslation === t.id && <Ionicons name="checkmark" size={18} color={Colors.gold} />}
            </TouchableOpacity>
          ))}
        </Card>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Hyper-Contextual Nudges</Text>
              <Text style={styles.toggleSub}>Context-aware verse reminders</Text>
            </View>
            <Switch
              value={nudgesEnabled}
              onValueChange={(v) => persist({ nudgesEnabled: v })}
              trackColor={{ true: Colors.teal }}
            />
          </View>

          {nudgesEnabled && (
            <View style={styles.nudgeTimes}>
              <Text style={styles.nudgeTimesLabel}>Active Windows</Text>
              <View style={styles.nudgeGrid}>
                {NUDGE_TIMES.map((time) => {
                  const active = selectedNudgeTimes.includes(time);
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.nudgeChip, active && styles.nudgeChipActive]}
                      onPress={() => {
                        const next = active
                          ? selectedNudgeTimes.filter((t) => t !== time)
                          : [...selectedNudgeTimes, time];
                        persist({ nudgeTimes: next });
                      }}
                    >
                      <Text style={[styles.nudgeChipText, active && styles.nudgeChipTextActive]}>{time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={[styles.toggleRow, styles.toggleDivider]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Review Reminders</Text>
              <Text style={styles.toggleSub}>Daily flashcard review alerts</Text>
            </View>
            <Switch
              value={reviewReminders}
              onValueChange={(v) => persist({ reviewReminders: v })}
              trackColor={{ true: Colors.teal }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Halaqa Alerts</Text>
              <Text style={styles.toggleSub}>Group streak notifications</Text>
            </View>
            <Switch
              value={halaqaAlerts}
              onValueChange={(v) => persist({ halaqaAlerts: v })}
              trackColor={{ true: Colors.teal }}
            />
          </View>
        </Card>

        {/* ── About ────────────────────────────────────────────────────────── */}
        <Card variant="bordered" padding="md">
          <Text style={styles.sectionTitle}>About Noor</Text>
          <Text style={styles.aboutText}>
            Noor — The Spiritual Operating System{'\n'}
            Quran Foundation Hackathon 2026{'\n'}
            Built with love for the Muslim Ummah
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </Card>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowSignOut(true)}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={showSignOut} animationType="fade" onRequestClose={() => setShowSignOut(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !isSigningOut && setShowSignOut(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <LinearGradient
              colors={['#1B4B29', '#102B19', '#0A1D11']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalInner}
            >
              <View style={styles.modalTopRow}>
                <View style={styles.modalIconHalo}>
                  <Ionicons name="log-out-outline" size={30} color={Colors.coralLight} />
                </View>
                <TouchableOpacity
                  onPress={() => setShowSignOut(false)}
                  style={styles.modalCloseBtn}
                  disabled={isSigningOut}
                >
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalKicker}>Account Session</Text>
              <Text style={styles.modalTitle}>Sign Out?</Text>
              <Text style={styles.modalSubtitle}>
                Your progress is saved. You can return anytime with the same account.
              </Text>

              <View style={styles.modalAccountPill}>
                <Ionicons name="person-circle-outline" size={16} color={Colors.gold} />
                <Text style={styles.modalAccountText} numberOfLines={1}>
                  {user?.email || user?.name || 'Noor account'}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalSignOutBtn}
                  onPress={confirmSignOut}
                  disabled={isSigningOut}
                  activeOpacity={0.85}
                >
                  {isSigningOut ? (
                    <ActivityIndicator size="small" color={Colors.darkBg} />
                  ) : (
                    <>
                      <Ionicons name="log-out" size={18} color={Colors.darkBg} />
                      <Text style={styles.modalSignOutText}>Sign Out</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowSignOut(false)}
                  disabled={isSigningOut}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCancelText}>Stay Signed In</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
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

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, flexShrink: 0,
    backgroundColor: Colors.darkBg3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)',
  },
  avatarText: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: Colors.gold },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: Colors.textPrimary },
  profileEmail: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1, fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: Colors.gold, paddingVertical: 2,
  },
  nameEditBtn: { padding: 2 },

  sectionTitle: {
    fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted,
    marginBottom: 14, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  fieldLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  chipActive: { backgroundColor: 'rgba(201,164,86,0.12)', borderColor: 'rgba(201,164,86,0.4)' },
  chipText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  chipTextActive: { fontFamily: 'Raleway_700Bold', color: Colors.gold },

  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.darkBorder,
  },
  optionText: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  toggleDivider: { borderTopWidth: 1, borderTopColor: Colors.darkBorder, marginTop: 6, paddingTop: 14 },
  toggleLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  toggleSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  nudgeTimes: { marginTop: 10, gap: 8 },
  nudgeTimesLabel: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  nudgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nudgeChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  nudgeChipActive: { backgroundColor: 'rgba(201,164,86,0.12)', borderColor: 'rgba(201,164,86,0.4)' },
  nudgeChipText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  nudgeChipTextActive: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold },

  aboutText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 24 },
  versionText: { fontFamily: 'Raleway_300Light', fontSize: 12, color: Colors.textMuted, marginTop: 8 },

  logoutBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(224,85,85,0.35)',
    backgroundColor: 'rgba(224,85,85,0.06)',
  },
  logoutText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    padding: 22,
  },
  modalSheet: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    shadowColor: Colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  modalInner: { padding: 22, gap: 14 },
  modalTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  modalIconHalo: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, borderColor: Colors.coral + '66',
    backgroundColor: Colors.coral + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.darkBg3, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  modalKicker: {
    fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold,
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 4,
  },
  modalTitle: {
    fontFamily: 'CormorantGaramond_700Bold', fontSize: 30,
    color: Colors.textPrimary, lineHeight: 34,
  },
  modalSubtitle: {
    fontFamily: 'Raleway_400Regular', fontSize: 14,
    color: Colors.textSecondary, lineHeight: 22,
  },
  modalAccountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.gold + '12', borderRadius: 999,
    borderWidth: 1, borderColor: Colors.gold + '2F',
    paddingHorizontal: 11, paddingVertical: 8,
  },
  modalAccountText: {
    flex: 1,
    fontFamily: 'Raleway_700Bold', fontSize: 11,
    color: Colors.goldLight,
  },
  modalActions: { gap: 10, marginTop: 2 },
  modalSignOutBtn: {
    minHeight: 50, borderRadius: 15, backgroundColor: Colors.gold,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  modalSignOutText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
  modalCancelBtn: {
    minHeight: 50, borderRadius: 15, backgroundColor: Colors.gold + '12',
    borderWidth: 1, borderColor: Colors.gold + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.gold },
});
