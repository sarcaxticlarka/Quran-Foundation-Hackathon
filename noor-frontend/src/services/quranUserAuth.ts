import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL, QURAN_OAUTH_CLIENT_ID, QURAN_OAUTH_ENDPOINT, QURAN_OAUTH_REDIRECT_URI } from '../utils/constants';
import { useAuthStore, UserProfile } from '../stores/authStore';
import { fetchProfile, upsertProfile } from './db';

WebBrowser.maybeCompleteAuthSession();

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
  const claims = readIdTokenClaims(tokens.id_token);
  const sub = String(claims.sub ?? 'quran-foundation-user');
  const email = String(claims.email ?? '');
  const candidateName = String(claims.name ?? claims.preferred_username ?? '');
  const name = candidateName.trim() || 'Friend';

  return {
    id: `quran:${sub}`,
    name,
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

  const request = new AuthSession.AuthRequest({
    clientId: QURAN_OAUTH_CLIENT_ID,
    redirectUri: QURAN_OAUTH_REDIRECT_URI,
    responseType: AuthSession.ResponseType.Code,
    scopes: ['openid', 'user', 'collection'],
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
      error: detail
        ? `Quran sign in failed: ${detail}`
        : 'Quran sign in did not complete.',
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

  const { data } = await axios.post<QuranOAuthTokenResponse>(
    `${BACKEND_URL}/api/quran/oauth/exchange`,
    {
      code: result.params.code,
      redirectUri: QURAN_OAUTH_REDIRECT_URI,
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
  );

  const baseUser = buildUser(data);
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
    await upsertProfile(baseUser.id, {
      name: baseUser.name,
      email: baseUser.email,
      reading_level: baseUser.readingLevel,
      daily_goal_minutes: baseUser.dailyGoalMinutes,
    }).catch(() => {});
  }

  useAuthStore.getState().setAuthenticatedUser('quran', data.access_token, user, onboardingDone);

  return { success: true };
}
