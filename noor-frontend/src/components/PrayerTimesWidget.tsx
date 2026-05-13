import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { formatPrayerTime, type PrayerTimes } from '../services/prayerTimes';

const PRAYER_ICONS: Record<keyof PrayerTimes, string> = {
  Fajr:    'partly-sunny-outline',
  Sunrise: 'sunny-outline',
  Dhuhr:   'sunny',
  Asr:     'cloud-outline',
  Maghrib: 'sunset-outline',
  Isha:    'moon-outline',
};

const PRAYER_COLORS: Record<keyof PrayerTimes, string> = {
  Fajr:    '#7856FF',
  Sunrise: Colors.amber ?? Colors.gold,
  Dhuhr:   Colors.gold,
  Asr:     Colors.teal,
  Maghrib: Colors.coral,
  Isha:    '#4A6FA5',
};

export function PrayerTimesWidget() {
  const { data, currentInfo, isLoading, permissionStatus, locationUnavailable, city, requestPermission } = usePrayerTimes();
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!currentInfo) return;
    const tick = () => {
      const mins = currentInfo.minutesUntilNext;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [currentInfo?.minutesUntilNext]);

  // Not yet asked — show a soft opt-in prompt, no pressure
  if (permissionStatus === 'not-asked' || permissionStatus === 'unknown') {
    return (
      <TouchableOpacity
        style={styles.optInCard}
        activeOpacity={0.85}
        onPress={async () => {
          setRequesting(true);
          try { await requestPermission(); } catch {}
          setRequesting(false);
        }}
        disabled={requesting}
      >
        <View style={styles.optInIcon}>
          <Ionicons name="location-outline" size={20} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optInTitle}>See your prayer times</Text>
          <Text style={styles.optInBody}>Tap to enable location — only used for accurate prayer schedules.</Text>
        </View>
        {requesting
          ? <ActivityIndicator size="small" color={Colors.gold} />
          : <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        }
      </TouchableOpacity>
    );
  }

  // Denied — show a minimal, non-nagging note
  if (permissionStatus === 'denied') {
    return (
      <View style={styles.deniedCard}>
        <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.deniedText}>Location access off — enable in Settings to see prayer times.</Text>
      </View>
    );
  }

  if (locationUnavailable) {
    return (
      <View style={styles.deniedCard}>
        <Ionicons name="navigate-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.deniedText}>Location signal unavailable. Move to an open area and try again.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color={Colors.gold} />
        <Text style={styles.loadingText}>Getting prayer times...</Text>
      </View>
    );
  }

  if (!data || !currentInfo) return null;

  const nextColor = PRAYER_COLORS[currentInfo.next];
  const prayers = Object.entries(data.times) as [keyof PrayerTimes, string][];

  return (
    <View style={styles.container}>
      {/* Header row — next prayer countdown */}
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((e) => !e)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: nextColor + '22' }]}>
            <Ionicons name={PRAYER_ICONS[currentInfo.next] as any} size={16} color={nextColor} />
          </View>
          <View>
            <Text style={styles.nextLabel}>Next: {currentInfo.next}</Text>
            <Text style={[styles.nextTime, { color: nextColor }]}>
              {currentInfo.nextTime} · in {countdown}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.cityText}>{city}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Hijri date */}
      <Text style={styles.hijriDate}>{data.hijriDate}</Text>

      {/* Expanded prayer list */}
      {expanded && (
        <View style={styles.prayerList}>
          {prayers.map(([name, time]) => {
            const isNext = name === currentInfo.next;
            const isCurrent = name === currentInfo.current;
            const color = PRAYER_COLORS[name];
            return (
              <View key={name} style={[styles.prayerRow, isNext && styles.prayerRowNext]}>
                <View style={styles.prayerLeft}>
                  <Ionicons name={PRAYER_ICONS[name] as any} size={14} color={isNext ? color : Colors.textMuted} />
                  <Text style={[styles.prayerName, isNext && { color }]}>{name}</Text>
                  {isCurrent && (
                    <View style={[styles.currentBadge, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.currentBadgeText, { color }]}>Now</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.prayerTime, isNext && { color, fontFamily: 'Raleway_700Bold' }]}>
                  {formatPrayerTime(time)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.darkBg2,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.darkBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  nextTime: { fontFamily: 'Raleway_700Bold', fontSize: 15 },
  headerRight: { alignItems: 'flex-end', gap: 2 },
  cityText: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  hijriDate: {
    fontFamily: 'CormorantGaramond_400Regular', fontSize: 13,
    color: Colors.textMuted, paddingHorizontal: 14, paddingBottom: 10,
  },
  prayerList: {
    borderTopWidth: 1, borderTopColor: Colors.darkBorder,
    paddingVertical: 8,
  },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 9,
  },
  prayerRowNext: { backgroundColor: Colors.darkBg3 ?? Colors.darkBorder + '40' },
  prayerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prayerName: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  prayerTime: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  currentBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { fontFamily: 'Raleway_700Bold', fontSize: 10 },
  loadingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.darkBg2, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  loadingText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted },
  optInCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.darkBg2, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.gold + '33',
  },
  optInIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gold + '18', alignItems: 'center', justifyContent: 'center',
  },
  optInTitle: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  optInBody: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  deniedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.darkBg2, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: Colors.darkBorder,
  },
  deniedText: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, flex: 1 },
});
