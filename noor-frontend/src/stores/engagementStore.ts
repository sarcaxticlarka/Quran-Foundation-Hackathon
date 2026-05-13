import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FeatureKey = 'Recite' | 'Review' | 'Explore' | 'Journal' | 'Halaqa' | 'Settings';

interface EngagementState {
  taps: Record<FeatureKey, number>;
  recordTap: (feature: FeatureKey) => void;
  getOrderedFeatures: () => FeatureKey[];
}

const DEFAULT_ORDER: FeatureKey[] = ['Recite', 'Review', 'Explore', 'Journal', 'Halaqa', 'Settings'];

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      taps: { Recite: 0, Review: 0, Explore: 0, Journal: 0, Halaqa: 0, Settings: 0 },

      recordTap: (feature) =>
        set((s) => ({ taps: { ...s.taps, [feature]: (s.taps[feature] ?? 0) + 1 } })),

      getOrderedFeatures: () => {
        const { taps } = get();
        // Recite is always first, Settings always last — sort the middle by engagement
        const sortable = DEFAULT_ORDER.filter((f) => f !== 'Settings' && f !== 'Recite');
        sortable.sort((a, b) => (taps[b] ?? 0) - (taps[a] ?? 0));
        return ['Recite', ...sortable, 'Settings'];
      },
    }),
    {
      name: 'noor-engagement',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ taps: s.taps }),
    },
  ),
);
