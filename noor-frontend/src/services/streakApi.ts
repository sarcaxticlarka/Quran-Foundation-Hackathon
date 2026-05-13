import { get, post } from './api';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActive: string;
  totalDays: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> boolean
  todayCompleted: boolean;
  weekProgress: boolean[];
}

export interface ActivityLog {
  date: string;
  versesRead: number;
  minutesActive: number;
  reviewsCompleted: number;
  dhikrCount: number;
}

export const streakApi = {
  async getStreak(): Promise<StreakData> {
    return get<StreakData>('/streak');
  },

  async logActivity(log: Partial<ActivityLog>): Promise<StreakData> {
    return post<StreakData>('/streak/log', log);
  },

  async getHistory(days = 365): Promise<ActivityLog[]> {
    return get<ActivityLog[]>(`/streak/history?days=${days}`);
  },
};
