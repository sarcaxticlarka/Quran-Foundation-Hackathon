import { useRouter } from 'expo-router';
import { fetchProfile, upsertProfile } from '../services/db';
import { createLocalAccount, verifyLocalAccount } from '../services/localAuth';
import { useAuthStore, UserProfile } from '../stores/authStore';

function isGenericName(name?: string | null) {
  const trimmed = name?.trim().toLowerCase();
  return !trimmed || trimmed === 'friend' || trimmed === 'noor user';
}

async function hydrateProfile(baseUser: UserProfile) {
  let user = baseUser;
  let onboardingDone = useAuthStore.getState().onboardingByUserId[baseUser.id] ?? false;

  try {
    const dbProfile = await fetchProfile(baseUser.id);
    const profileName = isGenericName(dbProfile.name) && !isGenericName(baseUser.name)
      ? baseUser.name
      : dbProfile.name || baseUser.name;
    user = {
      ...baseUser,
      name: profileName,
      email: dbProfile.email || baseUser.email,
      avatar: dbProfile.avatar_url ?? baseUser.avatar,
      madhab: dbProfile.madhab ?? baseUser.madhab,
      readingLevel: dbProfile.reading_level ?? baseUser.readingLevel,
      dailyGoalMinutes: dbProfile.daily_goal_minutes ?? baseUser.dailyGoalMinutes,
      translationId: dbProfile.translation_id ?? baseUser.translationId,
      nudgesEnabled: dbProfile.nudges_enabled ?? baseUser.nudgesEnabled,
      nudgeTimes: dbProfile.nudge_times ?? baseUser.nudgeTimes,
      reviewReminders: dbProfile.review_reminders ?? baseUser.reviewReminders,
      halaqaAlerts: dbProfile.halaqa_alerts ?? baseUser.halaqaAlerts,
    };
    if (dbProfile.onboarding_done === true) onboardingDone = true;
    if (profileName !== dbProfile.name) {
      upsertProfile(baseUser.id, { name: profileName }).catch(() => {});
    }
  } catch {
    await upsertProfile(baseUser.id, {
      name: baseUser.name,
      email: baseUser.email,
      avatar_url: baseUser.avatar,
      reading_level: baseUser.readingLevel,
      daily_goal_minutes: baseUser.dailyGoalMinutes,
    }).catch(() => {});
  }

  return { user, onboardingDone };
}

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const signUp = async (name: string, email: string, password: string) => {
    store.setLoading(true);
      store.setError(null);
    try {
      await useAuthStore.getState().logout();
      const account = await createLocalAccount(name, email, password);
      const { user, onboardingDone } = await hydrateProfile(account.user);

      useAuthStore.getState().setAuthenticatedUser('email', account.token, user, onboardingDone);
      router.replace(onboardingDone ? '/(tabs)' : '/(auth)/onboarding');
      return { success: true };
    } catch (err: any) {
      const msg = err?.message ?? 'Sign up failed';
      store.setError(msg);
      return { success: false, error: msg };
    } finally {
      store.setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    store.setLoading(true);
      store.setError(null);
    try {
      await useAuthStore.getState().logout();
      const account = await verifyLocalAccount(email, password);
      const { user, onboardingDone } = await hydrateProfile(account.user);

      useAuthStore.getState().setAuthenticatedUser('email', account.token, user, onboardingDone);
      upsertProfile(user.id, { name: user.name, email: user.email, avatar_url: user.avatar }).catch(console.warn);
      router.replace(onboardingDone ? '/(tabs)' : '/(auth)/onboarding');
      return { success: true };
    } catch (err: any) {
      const msg = err?.message ?? 'Incorrect email or password.';
      store.setError(msg);
      return { success: false, error: msg };
    } finally {
      store.setLoading(false);
    }
  };

  const logout = async () => {
    await store.logout();
    router.replace('/(auth)');
  };

  const completeOnboarding = (prefs: { madhab?: string; level?: string; dailyGoal?: number }) => {
    store.updateProfile({
      madhab:           prefs.madhab,
      readingLevel:     prefs.level as any,
      dailyGoalMinutes: prefs.dailyGoal,
    });
    store.setOnboardingComplete(true);

    const { user } = useAuthStore.getState();
    if (user?.id) {
      upsertProfile(user.id, {
        onboarding_done:    true,
        madhab:             prefs.madhab,
        reading_level:      prefs.level,
        daily_goal_minutes: prefs.dailyGoal,
      }).catch(console.warn);
    }

    router.replace('/(tabs)');
  };

  return {
    user:               store.user,
    isAuthenticated:    store.isAuthenticated,
    isLoading:          store.isLoading,
    error:              store.error,
    onboardingComplete: store.onboardingComplete,
    signUp,
    signIn,
    logout,
    completeOnboarding,
  };
}
