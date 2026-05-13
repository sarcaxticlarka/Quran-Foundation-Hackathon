import { get, post, put, del } from './api';

export type GoalType = 'daily_recitation' | 'weekly_memorization' | 'dhikr_count' | 'review_cards' | 'halaqa_sessions';
export type GoalFrequency = 'daily' | 'weekly' | 'monthly';

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  target: number;
  current: number;
  frequency: GoalFrequency;
  isActive: boolean;
  createdAt: string;
  completedDates: string[];
}

export const goalsApi = {
  async getGoals(): Promise<Goal[]> {
    return get<Goal[]>('/goals');
  },

  async createGoal(goal: Omit<Goal, 'id' | 'current' | 'createdAt' | 'completedDates'>): Promise<Goal> {
    return post<Goal>('/goals', goal);
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    return put<Goal>(`/goals/${id}`, updates);
  },

  async deleteGoal(id: string): Promise<void> {
    return del<void>(`/goals/${id}`);
  },

  async logProgress(goalId: string, amount: number): Promise<Goal> {
    return post<Goal>(`/goals/${goalId}/progress`, { amount });
  },
};
