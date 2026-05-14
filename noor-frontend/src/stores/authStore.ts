import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  madhab?: string;
  readingLevel?: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes?: number;
  notificationsEnabled?: boolean;
  // Settings preferences — persisted locally and to Neon through the backend
  translationId?: number;
  nudgesEnabled?: boolean;
  nudgeTimes?: string[];
  reviewReminders?: boolean;
  halaqaAlerts?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  authProvider: 'email' | 'quran' | null;
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  onboardingComplete: boolean;
  onboardingByUserId: Record<string, boolean>;
  _hydrated: boolean;

  logout: () => Promise<void>;
  setAuthenticatedUser: (provider: 'email' | 'quran', token: string | null, user: UserProfile, onboardingComplete?: boolean) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setOnboardingComplete: (v: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  _setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      authProvider: null,
      token: null,
      user: null,
      isLoading: false,
      error: null,
      onboardingComplete: false,
      onboardingByUserId: {},
      _hydrated: false,

      logout: async () => {
        set({
          isAuthenticated: false,
          authProvider: null,
          token: null,
          error: null,
          user: null,
          isLoading: false,
          onboardingComplete: false,
        });
      },

      setAuthenticatedUser: (authProvider, token, user, onboardingComplete) => {
        set((s) => ({
          authProvider,
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          onboardingComplete: onboardingComplete ?? s.onboardingByUserId[user.id] ?? false,
          onboardingByUserId:
            onboardingComplete === true
              ? { ...s.onboardingByUserId, [user.id]: true }
              : s.onboardingByUserId,
        }));
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setOnboardingComplete: (v) =>
        set((s) => ({
          onboardingComplete: v,
          onboardingByUserId:
            s.user?.id && v
              ? { ...s.onboardingByUserId, [s.user.id]: true }
              : s.onboardingByUserId,
        })),
      updateProfile: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
      _setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'noor-auth-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        authProvider: s.authProvider,
        token: s.token,
        user: s.user,
        onboardingComplete: s.onboardingComplete,
        onboardingByUserId: s.onboardingByUserId,
        // isLoading and error are intentionally excluded — always reset to false/null on launch
        // _hydrated is intentionally excluded — it must always start false
      }),
      onRehydrateStorage: () => (state) => {
        // Called once AsyncStorage has finished loading into the store.
        // Always reset transient UI state so a crashed session never leaves a stuck spinner.
        if (state) {
          state.isLoading = false;
          state.error = null;
          state._setHydrated();
        }
      },
    },
  ),
);
