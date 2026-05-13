import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HalaqaMember {
  id: string;
  name: string;
  avatar?: string;
  versesRead: number;
  streak: number;
  isActive: boolean;
  lanternIntensity: number; // 0–1
}

export interface HalaqaGroup {
  id: string;
  name: string;
  description?: string;
  members: HalaqaMember[];
  currentSurah: number;
  currentVerse: number;
  totalLanternGlow: number; // 0–1
  weeklyGoal: number;
  weeklyProgress: number;
  createdAt: string;
  isAdmin: boolean;
}

export interface GroupInsight {
  topVerse: string;
  mostActiveTime: string;
  weeklyGrowth: number;
  commonTheme: string;
}

interface HalaqaState {
  groups: HalaqaGroup[];
  activeGroupId: string | null;
  isLoading: boolean;
  error: string | null;
  joinedIds: string[];

  // Actions
  setGroups: (groups: HalaqaGroup[]) => void;
  setActiveGroup: (id: string) => void;
  addGroup: (group: HalaqaGroup) => void;
  updateGroup: (id: string, updates: Partial<HalaqaGroup>) => void;
  removeGroup: (id: string) => void;
  updateMember: (groupId: string, memberId: string, updates: Partial<HalaqaMember>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getActiveGroup: () => HalaqaGroup | null;
  join: (id: string) => void;
  leave: (id: string) => void;
}

export const useHalaqaStore = create<HalaqaState>()(
  persist(
  (set, get) => ({
  groups: [],
  activeGroupId: null,
  isLoading: false,
  error: null,
  joinedIds: [],

  setGroups: (groups) => set({ groups }),

  setActiveGroup: (activeGroupId) => set({ activeGroupId }),

  addGroup: (group) =>
    set((state) => ({ groups: [...state.groups, group] })),

  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  removeGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
    })),

  updateMember: (groupId, memberId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId ? { ...m, ...updates } : m,
              ),
            }
          : g,
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getActiveGroup: () => {
    const { groups, activeGroupId } = get();
    return groups.find((g) => g.id === activeGroupId) ?? null;
  },

  join: (id) =>
    set((state) => ({
      joinedIds: state.joinedIds.includes(id) ? state.joinedIds : [...state.joinedIds, id],
    })),

  leave: (id) =>
    set((state) => ({
      joinedIds: state.joinedIds.filter((j) => j !== id),
    })),
}),
  {
    name: 'noor-halaqa',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({ joinedIds: state.joinedIds, groups: state.groups }),
  },
));
