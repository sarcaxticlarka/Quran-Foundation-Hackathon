import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Colors } from '../theme/colors';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const slideY   = useRef(new Animated.Value(-60)).current;
  const insets   = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(slideY, {
      toValue: isOnline ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { top: insets.top + 4, transform: [{ translateY: slideY }] }]}>
      <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', left: 16, right: 16, zIndex: 300,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(180,60,60,0.92)', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
    elevation: 6,
  },
  text: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: '#fff' },
});
