import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { fetchHalaqaCircle } from '../../../src/services/db';
import { useAuthStore } from '../../../src/stores/authStore';

export default function LanternScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const breathAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const [circle, setCircle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(breathAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(breathAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    fetchHalaqaCircle(id, userId)
      .then((data) => { if (!cancelled) setCircle(data); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id, userId]);

  const members = circle?.members ?? [];
  const activeCount = useMemo(() => members.filter((m: any) => m.is_active !== false).length, [members]);
  const totalCount = members.length || 1;
  const brightness = activeCount / totalCount;
  const groupStreak = Math.max(...members.map((m: any) => m.streak ?? 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Group Lantern</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.body}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      ) : (
        <View style={styles.body}>
          <Animated.View style={[styles.ring3, { opacity: glowAnim }]} />
          <Animated.View style={[styles.ring2, { opacity: Animated.multiply(glowAnim, 0.6) as any }]} />
          <Animated.View style={[styles.ring1, { transform: [{ scale: breathAnim }], opacity: 0.45 + brightness * 0.55 }]}>
            <Ionicons name="flame" size={52} color={Colors.gold} />
          </Animated.View>

          <Text style={styles.title}>{circle?.name ?? 'Your Circle'}'s Light</Text>
          <Text style={styles.subtitle}>
            Every member who reads today adds brightness to this lantern. When it is full, a Group Insight unlocks.
          </Text>

          <View style={styles.contributions}>
            {members.map((m: any) => {
              const active = m.is_active !== false;
              return (
                <View key={m.id} style={[styles.contributionChip, active && styles.contributionChipActive]}>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'close-circle'}
                    size={12}
                    color={active ? Colors.teal : Colors.textMuted}
                  />
                  <Text style={[styles.contributionText, active && styles.contributionTextActive]}>
                    {m.name}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{activeCount}/{members.length || 0}</Text>
              <Text style={styles.statLabel}>Active today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(brightness * 100)}%</Text>
              <Text style={styles.statLabel}>Brightness</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{groupStreak} days</Text>
              <Text style={styles.statLabel}>Group streak</Text>
            </View>
          </View>
        </View>
      )}
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 24 },
  ring3: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: Colors.gold + '11' },
  ring2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: Colors.gold + '22' },
  ring1: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.gold,
  },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  contributions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  contributionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.darkBg2, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  contributionChipActive: { backgroundColor: 'rgba(42,122,58,0.15)', borderColor: Colors.teal },
  contributionText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  contributionTextActive: { fontFamily: 'Raleway_600SemiBold', color: Colors.teal },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.darkBg2,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.darkBorder,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'Raleway_700Bold', fontSize: 18, color: Colors.gold },
  statLabel: { fontFamily: 'Raleway_400Regular', fontSize: 10, color: Colors.textMuted },
  statDivider: { width: 1, backgroundColor: Colors.darkBorder },
});
