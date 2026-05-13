import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme/colors';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const onboardingComplete = useAuthStore.getState().onboardingComplete;
      router.replace(onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
    }, 500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.text}>Finishing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  text: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
