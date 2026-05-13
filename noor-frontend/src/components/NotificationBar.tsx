import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useNotificationStore } from '../stores/notificationStore';

const TYPE_CONFIG = {
  streak:  { icon: 'flame' as const,          color: Colors.coral },
  review:  { icon: 'library-outline' as const, color: Colors.gold  },
  halaqa:  { icon: 'people-outline' as const,  color: Colors.teal  },
  general: { icon: 'moon-outline' as const,    color: '#7856FF'    },
};

export function NotificationBar() {
  const current = useNotificationStore((s) => s.current);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current) {
      Animated.timing(slideY, { toValue: 0, duration: 320, useNativeDriver: true }).start();
      timerRef.current = setTimeout(dismiss, 6000);
    } else {
      Animated.timing(slideY, { toValue: -100, duration: 260, useNativeDriver: true }).start();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current]);

  if (!current) return null;

  const cfg = TYPE_CONFIG[current.type] ?? TYPE_CONFIG.general;

  return (
    <Animated.View style={[styles.bar, { top: insets.top + 8, borderColor: cfg.color + '66', transform: [{ translateY: slideY }] }]}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + '22' }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{current.body}</Text>
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 16, right: 16, zIndex: 200,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(10,30,16,0.96)',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textWrap: { flex: 1, gap: 2 },
  title: { fontFamily: 'Raleway_700Bold', fontSize: 13, color: Colors.textPrimary },
  body:  { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  closeBtn: { padding: 2 },
});
