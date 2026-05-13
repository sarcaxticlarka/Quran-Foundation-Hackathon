import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme/colors';

// This is the screen that opens when the noor://oauth/callback deep link fires.
// maybeCompleteAuthSession() signals expo-web-browser to close the in-app
// browser and hand the authorization code back to the AuthRequest.promptAsync()
// call that is waiting in quranUserAuth.ts.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Give the auth store a moment to be updated by signInWithQuranFoundation
    // before we navigate away.
    const timer = setTimeout(() => {
      const { isAuthenticated, onboardingComplete } = useAuthStore.getState();
      if (isAuthenticated) {
        router.replace(onboardingComplete ? '/(tabs)' : '/(auth)/onboarding');
      } else {
        // Auth didn't complete — go back to the landing screen
        router.replace('/(auth)');
      }
    }, 800);
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
