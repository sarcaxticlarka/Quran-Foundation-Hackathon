import { create } from 'zustand';
import type { MCPVerseResult } from '../services/mcpService';
import { mcpService } from '../services/mcpService';

export type CrisisStep =
  | 'idle'
  | 'mood_select'
  | 'context_input'
  | 'loading'
  | 'verses_shown'
  | 'dhikr_timer'
  | 'reflection'
  | 'complete';

export interface CrisisSession {
  id: string;
  mood: string;
  context?: string;
  verses: MCPVerseResult[];
  selectedVerse?: MCPVerseResult;
  reflectionText?: string;
  dhikrCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface CrisisSequence {
  verse: {
    key: string;
    arabic: string;
    translation: string;
    surahName: string;
  };
  analysis?: string;
  tafsir: string;
  hadith: string;
  dhikr: string;
}

const FALLBACK_SEQUENCES: Record<string, CrisisSequence> = {
  overwhelmed: {
    verse: { key: '2:286', arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.', surahName: 'Surah Al-Baqarah · 2:286' },
    analysis: 'When everything feels too much, Allah promises He already knows your exact capacity — and this moment is within it.',
    tafsir: 'Ibn Kathir explains: This verse is a source of immense mercy. Allah, in His infinite wisdom, only tests us with what we are truly capable of enduring. Every hardship contains within it the seeds of strength.',
    hadith: 'The Prophet ﷺ said: "The greatest reward comes with the greatest trial. When Allah loves a people He tests them. Whoever accepts that wins His pleasure." — Tirmidhi 2396',
    dhikr: 'SubhanAllah × 33',
  },
  anxious: {
    verse: { key: '13:28', arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.', surahName: "Surah Ar-Ra'd · 13:28" },
    analysis: 'The antidote to anxiety is not found in certainty about the future, but in connection to the One who holds it.',
    tafsir: "Al-Tabari explains: The heart's tranquility (tuma'ninah) is only achieved through dhikr — constant remembrance of Allah. Anxiety is the absence of this connection.",
    hadith: "The Prophet ﷺ said: \"There is no worry or grief that a person may be afflicted with, for which the saying of 'Allaahumma inni 'abduka...' does not bring relief.\" — Ahmad",
    dhikr: 'La ilaha illallah × 33',
  },
  sad: {
    verse: { key: '94:5', arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship will be ease.', surahName: 'Surah Ash-Sharh · 94:5' },
    analysis: "The ease isn't coming — it's already here, walking alongside the hardship.",
    tafsir: "Ibn Kathir notes: The Arabic says \"ma'a\" (with) not \"ba'da\" (after) — meaning ease accompanies hardship simultaneously. This is Allah's promise.",
    hadith: 'The Prophet ﷺ said: "How wonderful is the affair of the believer, for his affairs are all good." — Muslim 2999',
    dhikr: 'Alhamdulillah × 33',
  },
  default: {
    verse: { key: '2:286', arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.', surahName: 'Surah Al-Baqarah · 2:286' },
    analysis: 'Whatever you are carrying right now — Allah already measured it for you.',
    tafsir: 'Ibn Kathir explains: This verse is a source of immense mercy. Allah, in His infinite wisdom, only tests us with what we are truly capable of enduring.',
    hadith: 'The Prophet ﷺ said: "The greatest reward comes with the greatest trial. When Allah loves a people He tests them." — Tirmidhi 2396',
    dhikr: 'SubhanAllah × 33',
  },
};

interface CrisisState {
  step: CrisisStep;
  currentSession: CrisisSession | null;
  sequence: CrisisSequence | null;
  mood: string | null;
  sessionHistory: CrisisSession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  triggerCrisis: (mood: string, context?: string) => Promise<void>;
  startSession: () => void;
  setMood: (mood: string) => void;
  setContext: (context: string) => void;
  setVerses: (verses: MCPVerseResult[]) => void;
  selectVerse: (verse: MCPVerseResult) => void;
  completedhikr: () => void;
  setReflection: (text: string) => void;
  completeSession: () => void;
  resetSession: () => void;
  setStep: (step: CrisisStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function generateId(): string {
  return `crisis-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCrisisStore = create<CrisisState>()((set, get) => ({
  step: 'idle',
  currentSession: null,
  sequence: null,
  mood: null,
  sessionHistory: [],
  isLoading: false,
  error: null,

  triggerCrisis: async (mood: string, context?: string) => {
    set({ isLoading: true, error: null, mood, sequence: null });
    try {
      const sequence = await mcpService.getCrisisSequence(mood, context);
      set({ sequence, isLoading: false });
    } catch {
      const fallback = FALLBACK_SEQUENCES[mood] ?? FALLBACK_SEQUENCES.default;
      set({ sequence: fallback, isLoading: false });
    }
  },

  startSession: () =>
    set({
      step: 'mood_select',
      currentSession: {
        id: generateId(),
        mood: '',
        verses: [],
        dhikrCompleted: false,
        startedAt: new Date(),
      },
      error: null,
    }),

  setMood: (mood) =>
    set((state) => ({
      step: 'context_input',
      mood,
      currentSession: state.currentSession
        ? { ...state.currentSession, mood }
        : null,
    })),

  setContext: (context) =>
    set((state) => ({
      step: 'loading',
      currentSession: state.currentSession
        ? { ...state.currentSession, context }
        : null,
    })),

  setVerses: (verses) =>
    set((state) => ({
      step: 'verses_shown',
      currentSession: state.currentSession
        ? { ...state.currentSession, verses }
        : null,
    })),

  selectVerse: (verse) =>
    set((state) => ({
      step: 'dhikr_timer',
      currentSession: state.currentSession
        ? { ...state.currentSession, selectedVerse: verse }
        : null,
    })),

  completedhikr: () =>
    set((state) => ({
      step: 'reflection',
      currentSession: state.currentSession
        ? { ...state.currentSession, dhikrCompleted: true }
        : null,
    })),

  setReflection: (reflectionText) =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, reflectionText }
        : null,
    })),

  completeSession: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const completed = { ...currentSession, completedAt: new Date() };
    set({
      step: 'complete',
      currentSession: completed,
      sessionHistory: [completed, ...get().sessionHistory].slice(0, 50),
    });
  },

  resetSession: () =>
    set({
      step: 'idle',
      currentSession: null,
      sequence: null,
      mood: null,
      error: null,
    }),

  setStep: (step) => set({ step }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
