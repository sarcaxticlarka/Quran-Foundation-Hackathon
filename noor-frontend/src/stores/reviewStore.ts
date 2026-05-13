import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ReviewCard,
  QualityRating,
  createCard,
  calculateNextReview,
  getDueCards,
  getRetentionRate,
} from '../utils/sm2Algorithm';

interface ReviewSession {
  startedAt: Date;
  reviewed: Array<{ card: ReviewCard; quality: QualityRating }>;
  isComplete: boolean;
}

interface ReviewState {
  cards: ReviewCard[];
  currentSession: ReviewSession | null;
  currentCardIndex: number;
  todayReviewed: number;
  totalReviewed: number;

  // Actions
  addCard: (verseKey: string) => void;
  removeCard: (verseKey: string) => void;
  startSession: () => void;
  submitReview: (quality: QualityRating) => void;
  completeSession: () => void;
  getDueCount: () => number;
  getRetention: () => number;
  getCurrentCard: () => ReviewCard | null;
  getSessionCards: () => ReviewCard[];
  importCards: (verseKeys: string[]) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: [],
      currentSession: null,
      currentCardIndex: 0,
      todayReviewed: 0,
      totalReviewed: 0,

      addCard: (verseKey) => {
        const existing = get().cards.find((c) => c.verseKey === verseKey);
        if (!existing) {
          set((state) => ({ cards: [...state.cards, createCard(verseKey)] }));
        }
      },

      removeCard: (verseKey) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.verseKey !== verseKey),
        })),

      startSession: () => {
        const due = getDueCards(get().cards).slice(0, 20);
        set({
          currentSession: {
            startedAt: new Date(),
            reviewed: [],
            isComplete: false,
          },
          currentCardIndex: 0,
        });
      },

      submitReview: (quality) => {
        const { cards, currentSession, currentCardIndex } = get();
        const sessionCards = getDueCards(cards).slice(0, 20);
        const card = sessionCards[currentCardIndex];

        if (!card || !currentSession) return;

        const updated = calculateNextReview(card, quality);

        set((state) => ({
          cards: state.cards.map((c) => (c.verseKey === card.verseKey ? updated : c)),
          currentSession: state.currentSession
            ? {
                ...state.currentSession,
                reviewed: [...state.currentSession.reviewed, { card: updated, quality }],
              }
            : null,
          currentCardIndex: state.currentCardIndex + 1,
          todayReviewed: state.todayReviewed + 1,
          totalReviewed: state.totalReviewed + 1,
        }));
      },

      completeSession: () =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, isComplete: true }
            : null,
        })),

      getDueCount: () => getDueCards(get().cards).length,

      getRetention: () => getRetentionRate(get().cards),

      getCurrentCard: () => {
        const { cards, currentCardIndex } = get();
        const due = getDueCards(cards).slice(0, 20);
        return due[currentCardIndex] ?? null;
      },

      getSessionCards: () => {
        return getDueCards(get().cards).slice(0, 20);
      },

      importCards: (verseKeys) => {
        const existing = new Set(get().cards.map((c) => c.verseKey));
        const newCards = verseKeys
          .filter((k) => !existing.has(k))
          .map(createCard);
        set((state) => ({ cards: [...state.cards, ...newCards] }));
      },
    }),
    {
      name: 'noor-review',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // AsyncStorage serializes Dates as strings — revive them
        state.cards = state.cards.map((c) => ({
          ...c,
          nextReview: new Date(c.nextReview),
          lastReviewed: c.lastReviewed ? new Date(c.lastReviewed) : null,
        }));
      },
    },
  ),
);
