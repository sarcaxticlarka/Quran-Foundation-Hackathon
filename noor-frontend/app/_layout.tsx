import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Raleway_300Light,
  Raleway_400Regular,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from '@expo-google-fonts/raleway';
import { useAuthStore } from '../src/stores/authStore';
import { useStreakStore } from '../src/stores/streakStore';
import { Colors } from '../src/theme/colors';
import { AudioProvider } from '../src/contexts/AudioContext';
import { GlobalErrorProvider } from '../src/contexts/ErrorContext';
import { groqAI } from '../src/services/groqAI';
import { scheduleReviewReminder, cancelReviewReminder } from '../src/services/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime:    1000 * 60 * 30,
      retry: 2,
    },
  },
});

function AuthGate() {
  const isAuthenticated    = useAuthStore((s) => s.isAuthenticated);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const storeHydrated      = useAuthStore((s) => s._hydrated);
  const user               = useAuthStore((s) => s.user);
  const authProvider       = useAuthStore((s) => s.authProvider);
  const segments = useSegments();
  const router   = useRouter();

  // Keep groqAI personalization context in sync with user profile
  useEffect(() => {
    if (user) {
      groqAI.configure({
        readingLevel: user.readingLevel ?? 'intermediate',
        madhab: user.madhab ?? '',
        name: user.name ?? '',
      });
    }
  }, [user?.readingLevel, user?.madhab, user?.name]);

  useEffect(() => {
    useStreakStore.getState().setActiveUser(user?.id ?? null);
  }, [user?.id]);

  // Wire review reminder scheduling to the user's notification preference
  useEffect(() => {
    if (!user) return;
    if (user.reviewReminders !== false) {
      scheduleReviewReminder(20, 0).catch(() => {});
    } else {
      cancelReviewReminder().catch(() => {});
    }
  }, [user?.reviewReminders, user?.id]);

  // Wait for Zustand AsyncStorage hydration before routing.
  useEffect(() => {
    if (!storeHydrated || !segments.length) return;
    const inAuthGroup    = segments[0] === '(auth)';
    const onOnboarding   = segments[0] === '(auth)' && segments[1] === 'onboarding';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && !onboardingComplete && !onOnboarding) {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated && onboardingComplete && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, onboardingComplete, storeHydrated, segments, authProvider]);

  return null;
}

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Raleway_300Light,
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: Colors.darkBg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <GlobalErrorProvider onGoHome={() => router.replace('/(tabs)')}>
          <AudioProvider>
          <StatusBar style="light" backgroundColor={Colors.darkBg} />
          <AuthGate />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.darkBg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Crisis flow */}
            <Stack.Screen name="crisis/entry" options={{ presentation: 'modal' }} />
            <Stack.Screen name="crisis/result" />
            <Stack.Screen name="crisis/dhikr" />
            {/* Dashboard sub-screens */}
            <Stack.Screen name="dashboard/streak" />
            <Stack.Screen name="dashboard/session" />
            <Stack.Screen name="dashboard/goals" />
            {/* Community — Halaqa */}
            <Stack.Screen name="community/halaqa/index" />
            <Stack.Screen name="community/halaqa/[id]" />
            <Stack.Screen name="community/halaqa/lantern" />
            <Stack.Screen name="community/halaqa/insight" />
            {/* Community — Recitation */}
            <Stack.Screen name="community/recite/index" />
            <Stack.Screen name="community/recite/feedback" />
            <Stack.Screen name="community/recite/progress" />
            {/* Quran viewer */}
            <Stack.Screen name="quran/surah/[id]" />
            {/* Explore sub-screens */}
            <Stack.Screen name="explore/graph" />
            <Stack.Screen name="explore/roots" />
            <Stack.Screen name="explore/concept/[id]" />
            <Stack.Screen name="explore/word/[key]" />
            {/* Profile sub-screens */}
            <Stack.Screen name="profile/identity" />
            <Stack.Screen name="profile/share" />
            <Stack.Screen name="profile/journal" />
            <Stack.Screen name="profile/library" />
            <Stack.Screen name="profile/reflection/write" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile/reflection/[id]" />
            <Stack.Screen name="profile/review/queue" />
            <Stack.Screen name="profile/review/flashcard" />
            <Stack.Screen name="profile/review/complete" />
            {/* Nudge detail */}
            <Stack.Screen name="nudge/detail" options={{ presentation: 'modal' }} />
            {/* OAuth deep link callback */}
            <Stack.Screen name="oauth/callback" options={{ headerShown: false }} />
            {/* Global modals */}
            <Stack.Screen name="search" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" />
          </Stack>
          </AudioProvider>
          </GlobalErrorProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
