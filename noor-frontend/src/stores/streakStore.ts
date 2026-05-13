import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';


export interface DayActivity {
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
  versesRead: number;
  minutesActive: number;
  reviewsCompleted: number;
  dhikrCount: number;
}

interface StreakState {
  activeUserId: string | null;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  history: Record<string, DayActivity>;
  todayActivity: DayActivity | null;
  byUserId: Record<string, {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
    history: Record<string, DayActivity>;
    todayActivity: DayActivity | null;
  }>;

  // Actions
  setActiveUser: (userId: string | null) => void;
  recordActivity: (activity: Partial<DayActivity>) => void;
  getTodayActivity: () => DayActivity;
  getStreakForDate: (date: string) => boolean;
  getHeatmapData: () => { date: string; value: number }[];
  recalculateStreak: () => void;
  resetToday: () => void;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateStreak(history: Record<string, DayActivity>): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];

    if (history[key]?.completed) {
      streak++;
    } else if (i > 0) {
      break; // Gap in streak
    }
  }
  return streak;
}

function emptyDay(date: string): DayActivity {
  return { date, completed: false, versesRead: 0, minutesActive: 0, reviewsCompleted: 0, dhikrCount: 0 };
}

function emptyStreakData() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    history: {},
    todayActivity: null,
  };
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      activeUserId: null,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      history: {},
      todayActivity: null,
      byUserId: {},

      setActiveUser: (userId) => {
        const state = get();
        if (state.activeUserId === userId) return;

        const currentData = {
          currentStreak: state.currentStreak,
          longestStreak: state.longestStreak,
          lastActiveDate: state.lastActiveDate,
          history: state.history,
          todayActivity: state.todayActivity,
        };
        const byUserId = { ...state.byUserId };

        if (state.activeUserId) {
          byUserId[state.activeUserId] = currentData;
        }

        if (!userId) {
          set({ activeUserId: null, ...emptyStreakData(), byUserId });
          return;
        }

        const nextData = byUserId[userId] ?? emptyStreakData();

        set({
          activeUserId: userId,
          ...nextData,
          byUserId: {
            ...byUserId,
            [userId]: nextData,
          },
        });
      },

      recordActivity: (activity) => {
        const activeUserId = get().activeUserId;
        const todayKey = getTodayKey();
        const existing = get().history[todayKey] ?? emptyDay(todayKey);

        const updated: DayActivity = {
          ...existing,
          versesRead: existing.versesRead + (activity.versesRead ?? 0),
          minutesActive: existing.minutesActive + (activity.minutesActive ?? 0),
          reviewsCompleted: existing.reviewsCompleted + (activity.reviewsCompleted ?? 0),
          dhikrCount: existing.dhikrCount + (activity.dhikrCount ?? 0),
          completed: true,
        };

        const newHistory = { ...get().history, [todayKey]: updated };
        const currentStreak = calculateStreak(newHistory);
        const longestStreak = Math.max(get().longestStreak, currentStreak);

        const nextData = {
          history: newHistory,
          todayActivity: updated,
          currentStreak,
          longestStreak,
          lastActiveDate: todayKey,
        };

        set((state) => ({
          ...nextData,
          byUserId: activeUserId
            ? { ...state.byUserId, [activeUserId]: nextData }
            : state.byUserId,
        }));
      },

      getTodayActivity: () => {
        const todayKey = getTodayKey();
        return get().history[todayKey] ?? emptyDay(todayKey);
      },

      getStreakForDate: (date) => {
        return get().history[date]?.completed ?? false;
      },

      getHeatmapData: () => {
        const { history } = get();
        return Object.entries(history).map(([date, day]) => ({
          date,
          value: day.completed
            ? Math.min(4, Math.floor((day.minutesActive + day.versesRead) / 10))
            : 0,
        }));
      },

      recalculateStreak: () => {
        const activeUserId = get().activeUserId;
        const history = get().history;
        const currentStreak = calculateStreak(history);
        const longestStreak = Math.max(get().longestStreak, currentStreak);
        set((state) => {
          const nextData = {
            currentStreak,
            longestStreak,
            lastActiveDate: state.lastActiveDate,
            history: state.history,
            todayActivity: state.todayActivity,
          };
          return {
            currentStreak,
            longestStreak,
            byUserId: activeUserId
              ? { ...state.byUserId, [activeUserId]: nextData }
              : state.byUserId,
          };
        });
      },

      resetToday: () => {
        const activeUserId = get().activeUserId;
        const todayKey = getTodayKey();
        const { history } = get();
        const { [todayKey]: _, ...rest } = history;
        const currentStreak = calculateStreak(rest);
        set((state) => {
          const nextData = {
            currentStreak,
            longestStreak: state.longestStreak,
            lastActiveDate: state.lastActiveDate,
            history: rest,
            todayActivity: null,
          };
          return {
            currentStreak,
            history: rest,
            todayActivity: null,
            byUserId: activeUserId
              ? { ...state.byUserId, [activeUserId]: nextData }
              : state.byUserId,
          };
        });
      },
    }),
    {
      name: 'noor-streak',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
