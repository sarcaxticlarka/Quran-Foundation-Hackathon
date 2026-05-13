import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL, QURAN_OAUTH_CLIENT_ID, QURAN_OAUTH_ENDPOINT } from '../utils/constants';
import { useAuthStore, UserProfile } from '../stores/authStore';
import { fetchProfile, upsertProfile } from './db';

WebBrowser.maybeCompleteAuthSession();

// makeRedirectUri with `native` set:
// - Standalone APK / dev-client → returns noor://oauth/callback  (native value)
// - Expo Go                     → returns exp://<ip>:<port>/--/oauth/callback
//
// BOTH must be registered in the Quran Foundation developer console.
// The alert below shows the exact URI being sent so you know what to register.
const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: 'noor://oauth/callback',
  scheme: 'noor',
  path: 'oauth/callback',
});

const discovery = {
  authorizationEndpoint: `${QURAN_OAUTH_ENDPOINT.replace(/\/$/, '')}/oauth2/auth`,
  tokenEndpoint: `${QURAN_OAUTH_ENDPOINT.replace(/\/$/, '')}/oauth2/token`,
};

interface QuranOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
  /** Populated by the backend after calling /userinfo on the user's behalf */
  userinfo?: Record<string, any>;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
}

function readIdTokenClaims(idToken?: string): Record<string, any> {
  if (!idToken) return {};
  try {
    const [, payload] = idToken.split('.');
    if (!payload) return {};
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return {};
  }
}

function buildUser(tokens: QuranOAuthTokenResponse): UserProfile {
  // Prefer the userinfo object returned by the backend (fetched server-side
  // from /userinfo). Fall back to id_token claims if userinfo is absent.
  const claims =
    tokens.userinfo && Object.keys(tokens.userinfo).length > 0
      ? tokens.userinfo
      : readIdTokenClaims(tokens.id_token);

  const sub = String(claims.sub ?? '');
  const email = String(claims.email ?? '');

  // Quran Foundation OIDC returns first_name / last_name (not "name").
  const firstName = String(claims.first_name ?? claims.given_name ?? '').trim();
  const lastName = String(claims.last_name ?? claims.family_name ?? '').trim();
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    String(claims.name ?? claims.preferred_username ?? '').trim() ||
    'Friend';

  return {
    id: sub ? `quran:${sub}` : `quran:${email || 'foundation-user'}`,
    name: fullName,
    email,
    joinedAt: new Date().toISOString(),
    readingLevel: 'intermediate',
    dailyGoalMinutes: 15,
    notificationsEnabled: true,
  };
}

export async function signInWithQuranFoundation(): Promise<{ success: boolean; error?: string }> {
  if (!QURAN_OAUTH_CLIENT_ID) {
    return { success: false, error: 'Quran OAuth client ID is not configured.' };
  }
  if (!BACKEND_API_KEY) {
    return { success: false, error: 'Backend API key is not configured.' };
  }

  // Log the redirect URI so you can verify it matches what's registered
  console.log('[QuranOAuth] redirect_uri =', REDIRECT_URI);

  try {
    const request = new AuthSession.AuthRequest({
      clientId: QURAN_OAUTH_CLIENT_ID,
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      // Use the scopes from the official Quran Foundation React Native example
      scopes: ['openid', 'offline_access', 'user', 'collection'],
      usePKCE: true,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: {
        nonce: Math.random().toString(36).slice(2) + Date.now().toString(36),
      },
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { success: false, error: 'Quran sign in was cancelled.' };
    }
    if (result.type !== 'success') {
      const params = 'params' in result ? result.params : undefined;
      const detail = params?.error_description ?? params?.error;
      return {
        success: false,
        error: detail ? `Quran sign in failed: ${detail}` : 'Quran sign in did not complete.',
      };
    }
    if (result.params.error) {
      return {
        success: false,
        error: `Quran sign in failed: ${result.params.error_description ?? result.params.error}`,
      };
    }
    if (result.params.state !== request.state) {
      return { success: false, error: 'Quran sign in failed state validation.' };
    }
    if (!result.params.code || !request.codeVerifier) {
      return { success: false, error: 'Quran sign in did not return an authorization code.' };
    }

    const { data } = await axios
      .post<QuranOAuthTokenResponse>(
        `${BACKEND_URL}/api/quran/oauth/exchange`,
        {
          code: result.params.code,
          redirectUri: REDIRECT_URI,
          codeVerifier: request.codeVerifier,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-API-Key': BACKEND_API_KEY,
          },
          timeout: 15000,
        },
      )
      .catch((err: any) => {
        const serverMsg = err?.response?.data?.error ?? err?.response?.data?.message;
        const msg = serverMsg
          ? `Sign in failed: ${serverMsg}`
          : err?.code === 'ECONNABORTED'
          ? 'Sign in timed out. Check your connection and try again.'
          : `Sign in failed: ${err?.message ?? 'Unknown error'}`;
        throw new Error(msg);
      });

    if (!data.access_token) {
      return { success: false, error: 'Quran sign in did not return an access token.' };
    }

    const baseUser = buildUser(data);

    // Guard: if we still couldn't resolve a real sub, the OAuth exchange failed silently.
    if (baseUser.id === 'quran:foundation-user' || baseUser.id === 'quran:') {
      return {
        success: false,
        error: 'Could not retrieve your Quran.Foundation profile. Please try again.',
      };
    }

    let user = baseUser;
    let onboardingDone = useAuthStore.getState().onboardingByUserId[baseUser.id] ?? false;

    try {
      const dbProfile = await fetchProfile(baseUser.id);
      user = {
        ...baseUser,
        name: dbProfile.name || baseUser.name,
        email: dbProfile.email || baseUser.email,
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
    } catch {
      // First-time Quran OAuth user — create their profile in Neon
      await upsertProfile(baseUser.id, {
        name: baseUser.name,
        email: baseUser.email,
        reading_level: baseUser.readingLevel,
        daily_goal_minutes: baseUser.dailyGoalMinutes,
      }).catch(() => {});
    }

    useAuthStore.getState().setAuthenticatedUser('quran', data.access_token, user, onboardingDone);

    return { success: true };
  } catch (err: any) {
    const msg = err?.message ?? 'An unexpected error occurred during sign in.';
    console.error('[signInWithQuranFoundation]', err);
    return { success: false, error: msg };
  }
}
