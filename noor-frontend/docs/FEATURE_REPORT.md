# Noor — Complete Feature Report

Full implementation detail for every feature in the Noor app. Each section covers what the feature does, how it is implemented, which files own it, and the data it depends on.

---

## Feature 01 — Verse of the Day

**Category**: Home  
**Files**: `app/(tabs)/index.tsx`, `src/hooks/useQuran.ts`

### What It Does
Displays a single Quranic verse each day that changes deterministically — every user on the same day sees the same verse, cycling through all 6,236 verses of the Quran.

### Algorithm
```typescript
// src/hooks/useQuran.ts
const daysSinceEpoch = Math.floor(Date.now() / 86400000);
const idx = daysSinceEpoch % 6236;
const verseKey = verseKeyForIndex(idx);  // maps flat index → "surah:ayah"
```

The `verseKeyForIndex` function uses the hardcoded `SURAH_VERSE_COUNTS` array (all 114 surah lengths, total = 6,236) to convert a flat 0-based index into a `"surah:ayah"` key string.

### Data Flow
1. `getDailyVerseKey()` returns today's `"surah:ayah"` string
2. `useVerseOfDay()` passes this key + `translationId` from `authStore` to React Query
3. Query key: `['verseOfDay', verseKey, translationId]` — stale after 12 hours
4. Fetches from: `GET /api/v4/verses/{key}?translations={id}`

### Translation Reactivity
When the user changes their translation in Settings, `authStore.user.translationId` updates, the query key changes, and React Query automatically re-fetches the verse in the new translation.

---

## Feature 02 — Prayer Times Widget

**Category**: Home  
**Files**: `src/components/PrayerTimesWidget.tsx`, `src/hooks/usePrayerTimes.ts`, `src/services/prayerTimes.ts`

### What It Does
Shows today's five salah times (Fajr, Dhuhr, Asr, Maghrib, Isha) with a live countdown to the next prayer, based on the device's GPS location.

### Implementation
1. `expo-location` requests `When In Use` permission and returns `{ latitude, longitude }`
2. `prayerTimes.ts` calls the Aladhan API: `GET https://api.aladhan.com/v1/timings?latitude=x&longitude=y&method=2`
3. Returns five HH:MM time strings
4. Widget computes `secondsUntilNext` = `nextPrayerTime - now`, displayed as `HH:MM:SS` countdown with `setInterval`

### Permissions
Declared in `app.json`:
```json
"expo-location": {
  "locationWhenInUsePermission": "Allow Noor to access your location to show accurate prayer times for your city."
}
```

---

## Feature 03 — Adaptive Quick Actions

**Category**: Home  
**Files**: `app/(tabs)/index.tsx`, `src/stores/engagementStore.ts`

### What It Does
The home screen has 6 quick-action tiles. Their order adapts to how often each feature is used — the most-tapped features appear first. Recite is always first; Settings is always last.

### Algorithm
```typescript
// src/stores/engagementStore.ts
getOrderedFeatures: () => {
  const { taps } = get();
  const sortable = DEFAULT_ORDER.filter((f) => f !== 'Settings' && f !== 'Recite');
  sortable.sort((a, b) => (taps[b] ?? 0) - (taps[a] ?? 0));
  return ['Recite', ...sortable, 'Settings'];
}
```

Every navigation tap calls `recordTap(featureKey)`, incrementing the count. The store persists to AsyncStorage so the order survives app restarts.

### Feature Keys
`'Recite' | 'Review' | 'Explore' | 'Journal' | 'Halaqa' | 'Settings'`

---

## Feature 04 — Streak Tracking

**Category**: Dashboard  
**Files**: `app/dashboard/session.tsx`, `app/dashboard/streak.tsx`, `src/stores/streakStore.ts`, `src/hooks/useStreak.ts`, `src/services/streakApi.ts`

### What It Does
Tracks a daily reading streak. Each day the user logs a session, the streak increments. Missing a day breaks it. Personal best (longest streak) is preserved separately.

### Data Model
```typescript
interface DayRecord {
  completed: boolean;    // true if versesRead >= daily_goal
  versesRead: number;
  dhikrCount: number;
  sessionMinutes: number;
}
type History = Record<string, DayRecord>;  // keyed by "YYYY-MM-DD"
```

### Streak Calculation
```typescript
// currentStreak: count backwards from today through consecutive completed days
// longestStreak: max run length in history
```

### Streak Break Card
When `currentStreak === 0 && longestStreak > 0`, the home screen renders a coral-coloured `StreakBreakCard` component showing the personal best and a "Restart my streak" CTA that navigates to the session logger.

### Heatmap
`HeatmapChart` renders the last 52 weeks (364 days) of history. Cell colour intensity is proportional to `versesRead` — 0 is dark, `>= daily_goal` is full gold.

---

## Feature 05 — Growth Rings

**Category**: Dashboard  
**Files**: `src/components/GrowthRings.tsx`, `app/dashboard/session.tsx`

### What It Does
Displays three concentric animated SVG arcs — one per goal dimension — inspired by Apple Fitness rings. Each ring shows today's progress vs. target.

### Rings
| Ring | Metric | Color |
|------|--------|-------|
| Outer | Verses read vs. daily goal | Gold |
| Middle | Dhikr count vs. dhikr goal | Teal |
| Inner | Session time vs. time goal | Amber |

### Implementation
Uses `react-native-svg` `Arc` path elements. Arc angle = `(current / target) × 360°`. Animated on mount with `Animated.timing` spring.

---

## Feature 06 — Spaced Repetition (SM-2)

**Category**: Review  
**Files**: `app/profile/review/queue.tsx`, `app/profile/review/flashcard.tsx`, `app/profile/review/complete.tsx`, `src/stores/reviewStore.ts`, `src/hooks/useReview.ts`

### What It Does
Bookmarked verses return as flashcards at scientifically optimal intervals using the SM-2 algorithm. Each review session shows the Arabic verse, asks the user to recall its meaning, then rates difficulty.

### SM-2 Algorithm
```
After rating:
  Again: interval = 1 day, ease_factor -= 0.20, repetitions = 0
  Hard:  interval = max(1, prev × 0.8), ease_factor -= 0.15
  Good:  interval = prev × ease_factor
  Easy:  interval = prev × ease_factor × 1.3, ease_factor += 0.10

next_review_at = now + interval_days
```

### UI
- **Front**: Full Arabic verse in Cormorant Garamond 24pt
- **Back**: Translation text + optional tafsir hint
- **Rating**: Four buttons — Again (red), Hard (orange), Good (green), Easy (blue)
- **Flip animation**: `Animated.spring` with `rotateY` 0° → 180°

### Persistence
Review card state stored in `reviewStore` → AsyncStorage. Also synced to Supabase `review_cards` table for cross-device continuity.

---

## Feature 07 — Crisis Support

**Category**: Wellbeing  
**Files**: `app/crisis/entry.tsx`, `app/crisis/dhikr.tsx`, `app/crisis/result.tsx`, `src/components/CrisisSequence.tsx`, `src/components/MoodChips.tsx`, `src/stores/crisisStore.ts`

### What It Does
A guided crisis intervention flow. User selects their current emotional state, receives a curated verse + tafsir + dhikr sequence, and logs mood before/after for tracking emotional trends.

### Flow
1. **Entry**: Emoji mood chip selector (5 presets + free text)
2. **Dhikr screen**: `CrisisSequence` animates through 4 steps with Lottie breathing timer
3. **Result**: Mood after selection, delta display, session logged

### Session Logging
```typescript
crisisStore.logSession({
  mood_before: 2,      // 1-5 scale
  mood_after: 4,
  dhikr_used: ['SubhanAllah', 'Alhamdulillah'],
  duration_seconds: 187,
})
// → INSERT INTO crisis_sessions
```

---

## Feature 08 — Community Halaqas

**Category**: Community  
**Files**: `app/community/halaqa/index.tsx`, `app/community/halaqa/[id].tsx`, `app/community/halaqa/insight.tsx`, `app/community/halaqa/lantern.tsx`, `src/stores/halaqaStore.ts`

### What It Does
Collaborative study circles where 5–10 people commit to a shared Quranic journey. Members post insights on each day's passage. A glowing lantern brightens as the group maintains collective streaks.

### Lantern Brightness
```typescript
brightness = completedMembersToday / totalMembers;
// 0.0 = all inactive (dim) → 1.0 = all completed (bright gold glow)
```

`LanternGlow` uses `Animated.loop` with `sin` wave scale 1.0 → 1.08 → 1.0 over 2 s, multiplied by brightness factor.

### Real-time Sync
`halaqaStore` subscribes to Supabase realtime on the `halaqa_members` and `halaqa_insights` tables for the active circle. Changes to member streak completion update the lantern brightness live.

---

## Feature 09 — Journal with AI Reflection

**Category**: Wellbeing  
**Files**: `app/profile/journal.tsx`, `app/profile/reflection/`, `src/services/groqAI.ts`

### What It Does
Free-form daily journal entries. After saving, the journal content is sent to Groq LLM which returns a spiritually-grounded reflection prompt — connecting the user's thoughts to Quranic themes.

### AI Call
```typescript
// src/services/groqAI.ts
const response = await groq.chat.completions.create({
  model: 'llama3-8b-8192',
  messages: [
    { role: 'system', content: SPIRITUAL_REFLECTION_SYSTEM_PROMPT },
    { role: 'user',   content: journalEntry }
  ]
});
```

The system prompt instructs the model to: ground responses in Quranic verses (no hallucination), offer one actionable reflection, and keep the tone warm and encouraging.

### Storage
```
Supabase journals table:
  content: raw journal text
  ai_reflection: Groq response (populated async)
  entry_date: unique per user per day
```

---

## Feature 10 — Knowledge Graph

**Category**: Explore  
**Files**: `app/explore/graph.tsx`, `app/explore/concept/[slug].tsx`

### What It Does
An interactive force-directed graph visualising thematic connections across the Quran. Tapping a concept (e.g. "Mercy", "Justice", "Patience") shows all related verses across all 114 surahs as an explorable node map.

### Implementation
Built with a graph visualisation library over a WebView, powered by Quran MCP semantic search for clustering. Nodes represent concepts; edges represent thematic overlap between surahs.

### Interaction
- Pan/zoom via `react-native-gesture-handler`
- Tap node → `ConceptDetailScreen` showing verse list
- Tap verse → Full verse card with tafsir option

---

## Feature 11 — Linguistic Root Explorer

**Category**: Explore  
**Files**: `app/explore/roots.tsx`, `app/explore/word/[word].tsx`

### What It Does
Users can tap any Arabic word while reading to see its 3-letter root, grammatical form, and every other verse in the Quran where that root appears (with meaning shifts noted). Roots are collected like digital cards.

### Word Detail
```
Root: ر-ح-م  (R-H-M)
Meaning: mercy, compassion
Form: verbal noun (masdar)
Occurrences: 339 times across 30 surahs
```

### Root Collection
`savedStore` persists collected roots. The collection screen displays them as cards with the Arabic root, English meaning, and occurrence count.

---

## Feature 12 — Settings with Live Persistence

**Category**: Settings  
**Files**: `app/settings.tsx`, `src/stores/authStore.ts`

### What It Does
All user preferences are editable and instantly persisted — no save button. Changes write to `authStore` (local, immediate) and `Supabase profiles` (remote, async).

### Translation Change Cascade
```
User taps new translation chip
→ authStore.updatePreferences({ translationId: 85 })
→ All React Query keys containing old translationId are invalidated
→ Active verse/surah screens silently re-fetch in new translation
```

### Notification Toggles
```typescript
// app/_layout.tsx — watches reviewReminders
useEffect(() => {
  if (user?.reviewReminders) {
    scheduleReviewReminder();
  } else {
    cancelReviewReminder();
  }
}, [user?.reviewReminders]);
```

---

## Feature 13 — Journey Share Card

**Category**: Profile  
**Files**: `app/profile/share.tsx`

### What It Does
Generates a beautiful portrait-format "spiritual journey card" showing the user's stats, rank, and a Quranic verse. Can be saved to the photo library or shared externally.

### Card Dimensions
```typescript
const CARD_W = screenWidth - 28;       // e.g. ~346px on iPhone 14
const CARD_H = CARD_W * 1.42;          // portrait ratio ~491px
```

### Visual Layers (bottom to top)
1. **4-layer LinearGradient**: dark forest parchment base + gold shimmer top-left + deep vignette bottom-right + centre glow
2. **Arabic "الله" watermark**: Cormorant Garamond 700 at `CARD_W × 0.62` font size, 5% opacity
3. **MosqueSkyline**: Pure View mosque silhouette (2 main minarets, 2 flanking minarets, 2 side domes, 1 central dome, building body, arch row), 11% opacity
4. **MoonAndStar**: Pure View crescent (gold circle + offset dark cutout) + 4-pointed star beside it, 10% opacity
5. **Double gold frame**: 1.5px outer border + 0.5px inner border, both `borderRadius: 14–15`
6. **4× CornerBracket**: L-shaped gold corner markers at each corner
7. **Bismillah header band**: Linear gradient + Arabic Bismillah text
8. **Brand row**: نور · N·O·O·R with flanking lines
9. **Rub el-Hizb emblem**: 3 rotated squares + inner ring + gradient dot, `size = CARD_W × 0.19`
10. **Username + Madhab** in Cormorant Garamond
11. **Rank badge**: Dynamic colour per tier — Seeker (purple) / Student (blue) / Diligent (teal) / Preserver (gold) / Scholar (bright gold)
12. **Ornamental dividers**: line + gold dots
13. **Stats box**: 4-column grid — Streak (🔥), Personal Best, Verses Read, Dhikr
14. **Active days pill**: moon icon + "N active days on Noor"
15. **Quranic ayah**: Al-Baqarah 2:186 in Arabic + reference
16. **Footer band**: "noor.app · Quran Foundation 2026"

### Rank System
| Rank | Arabic | Threshold | Accent Color |
|------|--------|-----------|--------------|
| Seeker | مُبْتَدِئ | 0+ days | `#A898CC` |
| Student | طَالِب | 7+ days | `#88AACC` |
| Diligent | مُجْتَهِد | 14+ days | `#8ABCA0` |
| Preserver | حَافِظ | 30+ days | `#C9A456` |
| Scholar | عَالِم | 60+ days | `#F0D080` |

### Save to Gallery Flow
```typescript
const { status } = await MediaLibrary.requestPermissionsAsync();
// → prompts "Allow Noor to save to your photo library"
const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
await MediaLibrary.saveToLibraryAsync(uri);
// → saved to Camera Roll
Alert.alert('Saved ✦', 'Your journey card has been saved to your gallery.');
```

---

## Feature 14 — Offline Support

**Category**: Infrastructure  
**Files**: `src/hooks/useNetworkStatus.ts`, `src/components/OfflineBanner.tsx`, `app/(tabs)/_layout.tsx`

### What It Does
Detects network connectivity via polling and shows an animated banner when offline. All cached Quran data and local state remain accessible.

### Detection
```typescript
// Poll every 15 seconds
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 4000);
const res = await fetch('https://1.1.1.1', { method: 'HEAD', signal: controller.signal });
setIsOnline(res.ok);
```

Also re-checks immediately on `AppState` change to `'active'`.

### Banner
`Animated.timing` translates the banner from `translateY: -60` (hidden) to `translateY: 0` (visible) over 300ms. Reverses on reconnect. Red background `#C0392B` with white "No internet connection" text.

---

## Feature 15 — Error Boundary

**Category**: Infrastructure  
**Files**: `src/components/ErrorBoundary.tsx`, `app/(tabs)/_layout.tsx`

### What It Does
Catches unhandled JavaScript errors anywhere in the tab navigator tree. Instead of a blank white screen, shows a recovery UI with a "Try Again" button.

### Implementation
Class component (required by React's error boundary API):
```typescript
componentDidCatch(error: Error, info: ErrorInfo) {
  console.error('[ErrorBoundary]', error, info.componentStack);
}
getDerivedStateFromError() {
  return { hasError: true };
}
// Render: hasError → recovery screen; else → children
// "Try Again" calls setState({ hasError: false }) which re-mounts the tab tree
```

---

## Feature 16 — Audio Recitation

**Category**: Quran Study  
**Files**: `src/services/audioApi.ts`, `src/hooks/useAudioPlayer.ts`, `src/components/MiniPlayer.tsx`

### What It Does
Streams Quranic recitation audio for any verse, with a persistent mini-player that stays visible as the user navigates between screens.

### Implementation
`expo-av` `Audio.Sound` object loads the stream URL from `audioApi.ts`. `MiniPlayer` renders at the bottom of the tab layout (outside any individual screen) using shared state from `useAudioPlayer` hook.

### Controls
Play / Pause / Seek / Skip verse. Displays: surah name, verse number, reciter name.

---

## Feature 17 — Notifications (Prayer + Review + Halaqa)

**Category**: Infrastructure  
**Files**: `src/services/notifications.ts`, `app/_layout.tsx`

### What It Does
Schedules three categories of local notifications:
1. **Prayer reminders**: 5 daily recurring notifications at Fajr/Dhuhr/Asr/Maghrib/Isha
2. **Review reminder**: Daily 8:00 PM nudge to complete spaced repetition
3. **Halaqa alert**: 15 minutes before a joined halaqa session

### Expo Go Guard
```typescript
import Constants from 'expo-constants';
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let N: NotificationsModule | null = null;
if (!isExpoGo) {
  try { N = require('expo-notifications') as NotificationsModule; } catch { N = null; }
}
// All exported functions check: if (!N) return;
```

This prevents the Expo SDK 53 "push notifications removed from Expo Go" console error — the module is never even loaded in Expo Go.

---

## Stats Summary

| Category | Count |
|----------|-------|
| Total screens | 43 |
| Reusable components | 21 |
| Custom hooks | 8 |
| Zustand stores | 8 |
| API services | 14 |
| External APIs | 4 (quran.com v4, Supabase, Groq, Aladhan) |
| Database tables | 13 |
| Features documented | 17 |
| Lines of TypeScript | ~8,000+ |
