import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalAudio } from '../contexts/AudioContext';
import { Colors } from '../theme/colors';

export function MiniPlayer() {
  const { currentKey, currentTitle, isPlaying, isLoading, positionMs, durationMs, toggle, stop } = useGlobalAudio();

  if (!currentKey) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Progress track */}
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
      </View>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="musical-notes" size={16} color={Colors.teal} />
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTitle || currentKey}
          </Text>
          {durationMs > 0 && (
            <Text style={styles.time}>
              {formatTime(positionMs)} / {formatTime(durationMs)}
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={toggle} style={styles.btn} activeOpacity={0.7}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.teal} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={34}
                color={Colors.teal}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={stop} style={styles.btn} activeOpacity={0.7}>
            <Ionicons name="stop-circle" size={34} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.darkBg2,
    borderTopWidth: 1,
    borderTopColor: Colors.teal + '44',
  },
  track: {
    height: 2,
    backgroundColor: Colors.darkBorder,
  },
  trackFill: {
    height: 2,
    backgroundColor: Colors.teal,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.teal + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  time: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    padding: 2,
  },
});
