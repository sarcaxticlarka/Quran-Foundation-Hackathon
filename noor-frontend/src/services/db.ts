import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL } from '../utils/constants';

const dbApi = axios.create({
  baseURL: `${BACKEND_URL}/api/db`,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Key': BACKEND_API_KEY,
  },
});

function encode(value: string) {
  return encodeURIComponent(value);
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string) {
  const { data } = await dbApi.get(`/profiles/${encode(userId)}`);
  return data;
}

export async function upsertProfile(userId: string, updates: {
  name?: string;
  email?: string;
  avatar_url?: string;
  quranic_identity?: string;
  onboarding_done?: boolean;
  madhab?: string;
  reading_level?: string;
  daily_goal_minutes?: number;
  translation_id?: number;
  nudges_enabled?: boolean;
  nudge_times?: string[];
  review_reminders?: boolean;
  halaqa_alerts?: boolean;
}) {
  const { data } = await dbApi.put(`/profiles/${encode(userId)}`, updates);
  return data;
}

// ─── Streaks ─────────────────────────────────────────────────────────────────

export async function fetchStreak(userId: string) {
  const { data } = await dbApi.get(`/streaks/${encode(userId)}`);
  return data;
}

export async function upsertStreak(userId: string, updates: {
  current_streak: number;
  longest_streak: number;
  last_activity?: string;
  total_days?: number;
  freeze_count?: number;
}) {
  const { data } = await dbApi.put(`/streaks/${encode(userId)}`, updates);
  return data;
}

// ─── Activity Logs ───────────────────────────────────────────────────────────

export async function logActivity(userId: string, date: string, updates: {
  verses_read?: number;
  minutes?: number;
  xp_earned?: number;
  source?: string;
}) {
  const { data } = await dbApi.put(`/activity-logs/${encode(userId)}/${encode(date)}`, updates);
  return data;
}

export async function fetchActivityLogs(userId: string, days = 30) {
  const { data } = await dbApi.get(`/activity-logs/${encode(userId)}`, { params: { days } });
  return data ?? [];
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export async function fetchBookmarks(userId: string) {
  const { data } = await dbApi.get(`/bookmarks/${encode(userId)}`);
  return data ?? [];
}

export async function addBookmark(userId: string, verseKey: string, surahNum: number, ayahNum: number, note?: string) {
  const { data } = await dbApi.put(`/bookmarks/${encode(userId)}/${encode(verseKey)}`, {
    surah_num: surahNum,
    ayah_num: ayahNum,
    note,
  });
  return data;
}

export async function removeBookmark(userId: string, verseKey: string) {
  const { data } = await dbApi.delete(`/bookmarks/${encode(userId)}/${encode(verseKey)}`);
  return data;
}

// ─── Review Cards ────────────────────────────────────────────────────────────

export async function fetchReviewCards(userId: string) {
  const { data } = await dbApi.get(`/review-cards/${encode(userId)}`);
  return data ?? [];
}

export async function upsertReviewCard(userId: string, card: {
  verse_key: string;
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  last_quality?: number;
  total_reviews: number;
  correct_reviews: number;
}) {
  const { data } = await dbApi.put(`/review-cards/${encode(userId)}/${encode(card.verse_key)}`, card);
  return data;
}

// ─── Reflections ─────────────────────────────────────────────────────────────

export async function fetchReflections(userId: string) {
  const { data } = await dbApi.get(`/reflections/${encode(userId)}`);
  return data ?? [];
}

export async function saveReflection(userId: string, reflection: {
  verse_key?: string;
  body: string;
  mood?: string;
  is_public?: boolean;
  ai_enrichment?: object;
}) {
  const { data } = await dbApi.post(`/reflections/${encode(userId)}`, reflection);
  return data;
}

export async function updateReflection(reflectionId: string, updates: {
  body?: string;
  mood?: string;
  is_public?: boolean;
  ai_enrichment?: object;
}) {
  const { data } = await dbApi.patch(`/reflections/${encode(reflectionId)}`, updates);
  return data;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function fetchGoals(userId: string) {
  const { data } = await dbApi.get(`/goals/${encode(userId)}`);
  return data ?? [];
}

export async function upsertGoal(userId: string, goal: {
  type: string;
  target_value: number;
  current_value?: number;
  period?: string;
}) {
  const { data } = await dbApi.put(`/goals/${encode(userId)}/${encode(goal.type)}`, goal);
  return data;
}

// ─── Halaqa ──────────────────────────────────────────────────────────────────

export async function fetchUserHalaqa(userId: string) {
  const { data } = await dbApi.get(`/halaqa/${encode(userId)}`);
  return data ?? [];
}

export async function fetchHalaqaCircle(circleId: string, userId?: string) {
  const { data } = await dbApi.get(`/halaqa/circles/${encode(circleId)}`, { params: userId ? { userId } : undefined });
  return data;
}

export async function createHalaqa(userId: string, name: string, description?: string) {
  const { data } = await dbApi.post(`/halaqa/${encode(userId)}`, { name, description });
  return data;
}

export async function joinHalaqa(userId: string, inviteCode: string) {
  const { data } = await dbApi.post(`/halaqa/${encode(userId)}/join`, { inviteCode });
  return data;
}

export async function leaveHalaqa(userId: string, circleId: string) {
  const { data } = await dbApi.delete(`/halaqa/${encode(userId)}/${encode(circleId)}`);
  return data;
}

// ─── Crisis Sessions ─────────────────────────────────────────────────────────

export async function saveCrisisSession(userId: string, session: {
  mood: string;
  input_text?: string;
  verse_key?: string;
  dhikr_completed?: boolean;
  duration_secs?: number;
}) {
  const { data } = await dbApi.post(`/crisis-sessions/${encode(userId)}`, session);
  return data;
}

// ─── User Stats ──────────────────────────────────────────────────────────────

export async function fetchUserStats(userId: string) {
  const { data } = await dbApi.get(`/stats/${encode(userId)}`);
  return data;
}

// ─── Nudge Preferences ───────────────────────────────────────────────────────

export async function fetchNudgePrefs(userId: string) {
  const { data } = await dbApi.get(`/nudge-prefs/${encode(userId)}`);
  return data;
}

export async function updateNudgePrefs(userId: string, prefs: {
  nudges_enabled?: boolean;
  active_windows?: string[];
  review_reminders?: boolean;
  halaqa_alerts?: boolean;
  push_token?: string;
  translation_id?: number;
}) {
  const { data } = await dbApi.put(`/nudge-prefs/${encode(userId)}`, prefs);
  return data;
}
