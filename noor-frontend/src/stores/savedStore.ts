import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedVerse {
  verseKey: string;
  arabicText: string;
  translation: string;
  note?: string;
  conceptId?: string;
  savedAt: string;
}

interface SavedState {
  verses: SavedVerse[];
  save: (verse: Omit<SavedVerse, 'savedAt'>) => void;
  remove: (verseKey: string) => void;
  updateNote: (verseKey: string, note: string) => void;
  isSaved: (verseKey: string) => boolean;
  getNote: (verseKey: string) => string | undefined;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      verses: [],

      save: (verse) => {
        if (get().verses.some((v) => v.verseKey === verse.verseKey)) return;
        set((s) => ({
          verses: [{ ...verse, savedAt: new Date().toISOString() }, ...s.verses],
        }));
      },

      remove: (verseKey) =>
        set((s) => ({ verses: s.verses.filter((v) => v.verseKey !== verseKey) })),

      updateNote: (verseKey, note) =>
        set((s) => ({
          verses: s.verses.map((v) => (v.verseKey === verseKey ? { ...v, note } : v)),
        })),

      isSaved: (verseKey) => get().verses.some((v) => v.verseKey === verseKey),
      getNote: (verseKey) => get().verses.find((v) => v.verseKey === verseKey)?.note,
    }),
    {
      name: 'noor-saved-verses',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
