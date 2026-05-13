import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { signInWithQuranFoundation } from '../../src/services/quranUserAuth';
import { Colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const { signIn, isLoading, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [quranLoading, setQuranLoading] = useState(false);
  const [quranError, setQuranError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef<TextInput>(null);
  const store = useAuthStore;
  useEffect(() => { store.getState().setError(null); }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };
  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSignIn = async () => {
    Keyboard.dismiss();
    if (!validate()) { shake(); return; }
    setQuranError(null);
    const result = await signIn(email.trim().toLowerCase(), password);
    if (!result.success) shake();
  };

  const handleQuranSignIn = async () => {
    Keyboard.dismiss();
    setQuranLoading(true);
    setQuranError(null);
    store.getState().setError(null);
    try {
      const result = await signInWithQuranFoundation();
      if (!result.success) {
        setQuranError(result.error ?? 'Quran sign in failed. You can continue with email while we fix the Quran.Foundation connection.');
        shake();
        return;
      }
      router.replace(store.getState().onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
    } catch (err: any) {
      setQuranError(err.response?.data?.error ?? err.message ?? 'Quran sign in failed. You can continue with email while we fix the Quran.Foundation connection.');
      shake();
    } finally {
      setQuranLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.gold} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
            {quranError && (
              <View style={styles.quranErrorCard}>
                <View style={styles.quranErrorHeader}>
                  <Ionicons name="cloud-offline-outline" size={18} color={Colors.gold} />
                  <Text style={styles.quranErrorTitle}>Quran.Foundation sign in unavailable</Text>
                </View>
                <Text style={styles.quranErrorText}>{quranError}</Text>
                <Text style={styles.quranErrorHint}>Use email sign in or create an account below. Your profile will still save to Noor.</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, errors.email && styles.inputErr]}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: undefined })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputErr]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((s) => !s)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={[styles.btn, isLoading && styles.btnDisabled]} onPress={handleSignIn} disabled={isLoading || quranLoading} activeOpacity={0.85}>
              {isLoading ? (
                <View style={styles.primaryLoadingRow}>
                  <ActivityIndicator color={Colors.darkBg} size="small" />
                  <Text style={styles.btnText}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.quranBtn, quranLoading && styles.btnDisabled]}
              onPress={handleQuranSignIn}
              disabled={quranLoading || isLoading}
              activeOpacity={0.85}
            >
              {quranLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Colors.gold} size="small" />
                  <Text style={styles.quranBtnText}>Connecting to Quran.Foundation...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="book-outline" size={17} color={Colors.gold} />
                  <Text style={styles.quranBtnText}>Continue with Quran.Foundation</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/(auth)/signup')} activeOpacity={0.8}>
              <Text style={styles.outlineBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.inscription}>
            <Text style={styles.arabic}>اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا</Text>
            <Text style={styles.arabicTrans}>"O Allah, place light in my heart"</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12, alignSelf: 'flex-start' },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  titleWrap: { paddingTop: 28, paddingBottom: 24, gap: 6 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 36, color: Colors.textPrimary },
  subtitle: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  card: { backgroundColor: Colors.darkBg2, borderRadius: 20, padding: 24, gap: 18, borderWidth: 1, borderColor: Colors.darkBorder },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(42,122,58,0.15)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(42,122,58,0.3)' },
  successBannerText: { fontFamily: 'Raleway_400Regular', color: Colors.tealLight, fontSize: 13, flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(224,85,85,0.12)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(224,85,85,0.3)' },
  errorBannerText: { fontFamily: 'Raleway_400Regular', color: Colors.error, fontSize: 13, flex: 1 },
  field: { gap: 8 },
  label: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  inputWrap: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: {
    flex: 1, backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingLeft: 40, paddingVertical: 13,
    fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary,
  },
  passwordInput: { paddingRight: 46 },
  inputErr: { borderColor: Colors.error },
  eyeBtn: { position: 'absolute', right: 14 },
  fieldError: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.error },
  btn: { backgroundColor: Colors.gold, borderRadius: 50, paddingVertical: 16, alignItems: 'center', shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnDisabled: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  btnText: { fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.darkBg, fontSize: 18, letterSpacing: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.darkBorder },
  dividerLabel: { fontFamily: 'Raleway_400Regular', color: Colors.textMuted, fontSize: 12 },
  quranBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.gold + '66', backgroundColor: 'rgba(201,164,86,0.08)', borderRadius: 50, paddingVertical: 14 },
  quranBtnText: { fontFamily: 'Raleway_700Bold', color: Colors.gold, fontSize: 14 },
  quranErrorCard: { gap: 8, backgroundColor: Colors.gold + '10', borderRadius: 12, padding: 13, borderWidth: 1, borderColor: Colors.gold + '33' },
  quranErrorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quranErrorTitle: { fontFamily: 'Raleway_700Bold', color: Colors.gold, fontSize: 13, flex: 1 },
  quranErrorText: { fontFamily: 'Raleway_400Regular', color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  quranErrorHint: { fontFamily: 'Raleway_600SemiBold', color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
  outlineBtn: { borderWidth: 1.5, borderColor: Colors.darkBorder, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  outlineBtnText: { fontFamily: 'Raleway_700Bold', color: Colors.textSecondary, fontSize: 15 },
  inscription: { alignItems: 'center', paddingTop: 32, gap: 6 },
  arabic: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 20, color: Colors.gold, opacity: 0.7 },
  arabicTrans: { fontFamily: 'Raleway_300Light', fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
});
