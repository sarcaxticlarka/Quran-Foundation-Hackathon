import { useStreakStore } from '../stores/streakStore';
import { STREAK_MILESTONES } from '../utils/constants';

export function useStreak() {
  const store = useStreakStore();

  const recordVerseRead = (count = 1) => {
    store.recordActivity({ versesRead: count, minutesActive: 2 });
  };

  const recordReview = (count = 1) => {
    store.recordActivity({ reviewsCompleted: count, minutesActive: 1 });
  };

  const recordDhikr = (count = 33) => {
    store.recordActivity({ dhikrCount: count });
  };

  const recordSession = (minutes: number) => {
    store.recordActivity({ minutesActive: minutes });
  };

  const getNextMilestone = (): number | null => {
    const { currentStreak } = store;
    return STREAK_MILESTONES.find((m) => m > currentStreak) ?? null;
  };

  const getMilestoneProgress = (): number => {
    const { currentStreak } = store;
    const next = getNextMilestone();
    if (!next) return 100;
    const prev = STREAK_MILESTONES.filter((m) => m <= currentStreak).pop() ?? 0;
    return Math.round(((currentStreak - prev) / (next - prev)) * 100);
  };

  const isOnStreak = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return store.history[today]?.completed ?? false;
  };

  const getLast7Days = (): { date: string; completed: boolean }[] => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, completed: store.history[key]?.completed ?? false });
    }
    return days;
  };

  return {
    currentStreak: store.currentStreak,
    longestStreak: store.longestStreak,
    todayActivity: store.getTodayActivity(),
    history: store.history,
    isOnStreak: isOnStreak(),
    nextMilestone: getNextMilestone(),
    milestoneProgress: getMilestoneProgress(),
    last7Days: getLast7Days(),
    heatmapData: store.getHeatmapData(),
    recordVerseRead,
    recordReview,
    recordDhikr,
    recordSession,
  };
}
