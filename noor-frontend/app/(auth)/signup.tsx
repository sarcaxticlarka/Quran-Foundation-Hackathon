import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { signInWithQuranFoundation } from '../../src/services/quranUserAuth';
import { Colors } from '../../src/theme/colors';

export default function SignUpScreen() {
  const { signUp, isLoading, error } = useAuth();
  const store = useAuthStore;
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quranLoading, setQuranLoading] = useState(false);
  const [quranError, setQuranError] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const emailRef   = useRef<TextInput>(null);
  const passwordRef= useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
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
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Please enter your full name';
    if (!email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSignUp = async () => {
    Keyboard.dismiss();
    if (!validate()) { shake(); return; }
    setQuranError(null);
    const result = await signUp(name.trim(), email.trim().toLowerCase(), password);
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
        setQuranError(result.error ?? 'Quran sign in failed. You can create an email account while we fix the Quran.Foundation connection.');
        shake();
        return;
      }
      router.replace(store.getState().onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
    } catch (err: any) {
      setQuranError(err.response?.data?.error ?? err.message ?? 'Quran sign in failed. You can create an email account while we fix the Quran.Foundation connection.');
      shake();
    } finally {
      setQuranLoading(false);
    }
  };
  const clear = (field: string) => setErrors((p) => { const n = { ...p }; delete n[field]; return n; });

  const strength = password.length < 6 ? 0 : password.length < 10 ? 1 : password.length < 14 ? 2 : 3;
  const strengthColors = ['#E05555', Colors.gold, Colors.tealLight, '#5ABA6A'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.gold} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Your streaks and reflections saved forever</Text>
          </View>

          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {[
              { key: 'name',     label: 'FULL NAME',       icon: 'person-outline' as const,    placeholder: 'e.g. Abdullah Hassan',  secure: false, ref: null,         next: emailRef,    keyboard: undefined as any,    autoCap: 'words' as const  },
              { key: 'email',    label: 'EMAIL ADDRESS',   icon: 'mail-outline' as const,      placeholder: 'your@email.com',        secure: false, ref: emailRef,     next: passwordRef, keyboard: 'email-address' as const, autoCap: 'none' as const  },
            ].map((f) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name={f.icon} size={16} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={f.ref as any}
                    style={[styles.input, errors[f.key] && styles.inputErr]}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={f.key === 'name' ? name : email}
                    onChangeText={(t) => { f.key === 'name' ? setName(t) : setEmail(t); clear(f.key); }}
                    autoCapitalize={f.autoCap}
                    keyboardType={f.keyboard}
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => (f.next as any)?.current?.focus()}
                  />
                </View>
                {errors[f.key] && <Text style={styles.fieldError}>{errors[f.key]}</Text>}
              </View>
            ))}

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput ref={passwordRef} style={[styles.input, styles.pwInput, errors.password && styles.inputErr]} placeholder="Minimum 6 characters" placeholderTextColor={Colors.textMuted} value={password} onChangeText={(t) => { setPassword(t); clear('password'); }} secureTextEntry={!showPassword} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((s) => !s)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[0,1,2,3].map((i) => (
                    <View key={i} style={[styles.strengthBar, i <= strength && { backgroundColor: strengthColors[strength] }]} />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strengthColors[strength] }]}>{strengthLabels[strength]}</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput ref={confirmRef} style={[styles.input, styles.pwInput, errors.confirm && styles.inputErr]} placeholder="Re-enter your password" placeholderTextColor={Colors.textMuted} value={confirm} onChangeText={(t) => { setConfirm(t); clear('confirm'); }} secureTextEntry={!showConfirm} returnKeyType="done" onSubmitEditing={handleSignUp} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm((s) => !s)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.confirm && <Text style={styles.fieldError}>{errors.confirm}</Text>}
            </View>

            <TouchableOpacity style={[styles.btn, isLoading && styles.btnDisabled]} onPress={handleSignUp} disabled={isLoading || quranLoading} activeOpacity={0.85}>
              {isLoading ? (
                <View style={styles.primaryLoadingRow}>
                  <ActivityIndicator color={Colors.darkBg} size="small" />
                  <Text style={styles.btnText}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
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

            <Text style={styles.terms}>By creating an account you agree to our Terms of Service and Privacy Policy.</Text>

            <TouchableOpacity onPress={() => router.back()} style={styles.signinLink}>
              <Text style={styles.signinText}>Already have an account? <Text style={styles.signinLinkText}>Sign In</Text></Text>
            </TouchableOpacity>
          </Animated.View>
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
  titleWrap: { paddingTop: 20, paddingBottom: 20, gap: 6 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 34, color: Colors.textPrimary },
  subtitle: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  card: { backgroundColor: Colors.darkBg2, borderRadius: 20, padding: 22, gap: 16, borderWidth: 1, borderColor: Colors.darkBorder },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(224,85,85,0.12)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(224,85,85,0.3)' },
  errorBannerText: { fontFamily: 'Raleway_400Regular', color: Colors.error, fontSize: 13, flex: 1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(42,122,58,0.15)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(42,122,58,0.3)' },
  successBannerText: { fontFamily: 'Raleway_400Regular', color: Colors.tealLight, fontSize: 13, flex: 1 },
  field: { gap: 7 },
  label: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  inputWrap: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: { flex: 1, backgroundColor: Colors.darkBg3, borderWidth: 1, borderColor: Colors.darkBorder, borderRadius: 12, paddingHorizontal: 14, paddingLeft: 40, paddingVertical: 12, fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textPrimary },
  pwInput: { paddingRight: 44 },
  codeInput: { textAlign: 'center', fontFamily: 'Raleway_700Bold', fontSize: 22, letterSpacing: 4, paddingLeft: 40 },
  inputErr: { borderColor: Colors.error },
  eyeBtn: { position: 'absolute', right: 14 },
  fieldError: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.error },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.darkBg3 },
  strengthLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 11, width: 40, textAlign: 'right' },
  btn: { backgroundColor: Colors.gold, borderRadius: 50, paddingVertical: 15, alignItems: 'center', shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, marginTop: 4 },
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
  terms: { fontFamily: 'Raleway_300Light', fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 17 },
  signinLink: { alignItems: 'center' },
  signinText: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted },
  signinLinkText: { fontFamily: 'Raleway_700Bold', color: Colors.gold },
  // Confirmation screen
  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 },
  confirmIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(201,164,86,0.1)', borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  confirmTitle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 30, color: Colors.textPrimary, textAlign: 'center' },
  confirmBody: { fontFamily: 'Raleway_400Regular', fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },
  confirmEmail: { fontFamily: 'Raleway_700Bold', color: Colors.gold },
  verifyCard: { alignSelf: 'stretch', backgroundColor: Colors.darkBg2, borderRadius: 18, padding: 20, gap: 16, borderWidth: 1, borderColor: Colors.darkBorder },
  confirmHintCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.darkBg2, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.darkBorder },
  confirmHint: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 20 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.gold, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 40, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  confirmBtnText: { fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.darkBg, fontSize: 18 },
  resendLink: { paddingTop: 4 },
  resendText: { fontFamily: 'Raleway_400Regular', fontSize: 13, color: Colors.textMuted, textDecorationLine: 'underline' },
});
