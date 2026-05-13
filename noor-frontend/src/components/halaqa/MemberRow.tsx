import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import type { HalaqaMember } from '../../stores/halaqaStore';

interface MemberRowProps {
  member: HalaqaMember;
  rank?: number;
}

export function MemberRow({ member, rank }: MemberRowProps) {
  return (
    <View style={styles.row}>
      {rank !== undefined && (
        <Text style={styles.rank}>{rank}</Text>
      )}

      <View style={[styles.avatar, member.isActive && styles.avatarActive]}>
        <Text style={styles.avatarText}>
          {member.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.meta}>
          {member.versesRead} verses · {member.streak}d streak
        </Text>
      </View>

      {/* Lantern intensity bar */}
      <View style={styles.intensityContainer}>
        <View style={[styles.intensityBar, { width: `${member.lanternIntensity * 100}%` }]} />
        <Text style={styles.intensityLabel}>
          {Math.round(member.lanternIntensity * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBorder,
  },
  rank: {
    width: 20,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.darkBg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.darkBorder,
  },
  avatarActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldMuted,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  intensityContainer: {
    width: 60,
    height: 4,
    backgroundColor: Colors.darkBg3,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'flex-start',
  },
  intensityBar: {
    height: 4,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  intensityLabel: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: 9,
    color: Colors.textMuted,
  },
});
