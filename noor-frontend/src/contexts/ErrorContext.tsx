import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const { width: SW } = Dimensions.get('window');

// ─── Context ──────────────────────────────────────────────────────────────────
interface ErrorContextValue {
  showError: (message?: string) => void;
}

const ErrorContext = createContext<ErrorContextValue>({ showError: () => {} });

export function useGlobalError() {
  return useContext(ErrorContext);
}

// ─── Errors to silently ignore ────────────────────────────────────────────────
const IGNORED_PATTERNS = [
  'Invalid Refresh Token',
  'Refresh Token Not Found',
  'Network request failed',
  'Load failed',
  'AbortError',
  'cancelled',
  'user cancelled',
];

function shouldIgnore(msg: string) {
  const lower = msg.toLowerCase();
  return IGNORED_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GlobalErrorProvider({
  children,
  onGoHome,
}: {
  children: React.ReactNode;
  onGoHome?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const slideAnim = useRef(new Animated.Value(80)).current;
  // Debounce: don't stack multiple modals
  const cooldown = useRef(false);

  const showError = useCallback((msg?: string) => {
    if (cooldown.current) return;
    if (msg && shouldIgnore(msg)) return;
    cooldown.current = true;
    setMessage(msg);
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 9,
    }).start();
    // Allow another error to show after 5 s
    setTimeout(() => { cooldown.current = false; }, 5000);
  }, [slideAnim]);

  const dismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 80, duration: 200, useNativeDriver: true,
    }).start(() => { setVisible(false); setMessage(undefined); });
  }, [slideAnim]);

  const handleGoHome = useCallback(() => {
    dismiss();
    onGoHome?.();
  }, [dismiss, onGoHome]);

  // ── Global unhandled JS error handler ──────────────────────────────────────
  useEffect(() => {
    const prev = (global as any).ErrorUtils?.getGlobalHandler?.();

    (global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
      if (!shouldIgnore(error?.message ?? '')) {
        showError();
      }
      // Still call the previous handler (e.g. Expo's crash reporter)
      prev?.(error, isFatal);
    });

    return () => {
      if (prev) (global as any).ErrorUtils?.setGlobalHandler?.(prev);
    };
  }, [showError]);

  // ── Unhandled promise rejections ──────────────────────────────────────────
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message ?? String(event.reason ?? '');
      if (!shouldIgnore(msg)) showError();
    };
    // React Native's Hermes exposes this on the global
    (global as any).addEventListener?.('unhandledrejection', handler);
    return () => (global as any).removeEventListener?.('unhandledrejection', handler);
  }, [showError]);

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <View style={styles.overlay}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

            {/* Icon */}
            <View style={styles.iconRing}>
              <Ionicons name="construct-outline" size={28} color={Colors.gold} />
            </View>

            {/* Copy */}
            <Text style={styles.title}>We hit a snag</Text>
            <Text style={styles.body}>
              We've noted this error and our team is already working on a fix.
              Sorry for the interruption!
            </Text>

            {/* Error code (subtle, only in dev) */}
            {__DEV__ && message ? (
              <View style={styles.devHint}>
                <Text style={styles.devText} numberOfLines={2}>{message}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            {/* Actions */}
            <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome} activeOpacity={0.85}>
              <Ionicons name="home-outline" size={17} color={Colors.darkBg} />
              <Text style={styles.homeBtnText}>Return to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.8}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>
    </ErrorContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  sheet: {
    width: SW - 32, backgroundColor: Colors.darkBg2,
    borderRadius: 24, padding: 28, alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: Colors.darkBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 20,
  },
  iconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(201,164,86,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 22, color: Colors.textPrimary, textAlign: 'center',
  },
  body: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 14, color: Colors.textMuted,
    textAlign: 'center', lineHeight: 22,
  },
  devHint: {
    backgroundColor: Colors.darkBg3, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, width: '100%',
  },
  devText: {
    fontFamily: 'Raleway_400Regular', fontSize: 11,
    color: Colors.coral, lineHeight: 16,
  },
  divider: { width: '100%', height: 1, backgroundColor: Colors.darkBorder },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14,
    paddingVertical: 15, width: '100%',
  },
  homeBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.darkBg },
  dismissBtn: { paddingVertical: 6 },
  dismissText: {
    fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textMuted,
  },
});
