import { useCrisisStore } from '../stores/crisisStore';
import { mcpService } from '../services/mcpService';
import { useStreakStore } from '../stores/streakStore';

export function useCrisis() {
  const store = useCrisisStore();
  const streakStore = useStreakStore();

  const begin = () => {
    store.startSession();
  };

  const selectMood = (mood: string) => {
    store.setMood(mood);
  };

  const submitContext = async (context?: string) => {
    if (context) store.setContext(context);
    store.setLoading(true);
    store.setError(null);

    try {
      const session = store.currentSession;
      const mood = session?.mood ?? 'overwhelmed';

      // Use semantic search to find AI-grounded verse recommendations
      let verses;
      try {
        verses = await mcpService.semanticSearch(mood, 3);
      } catch {
        verses = [
          { verseKey: '2:286', arabicText: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', translation: 'Allah does not burden a soul beyond that it can bear.', relevanceScore: 0.95, reasoning: 'Addresses feelings of difficulty.' },
          { verseKey: '94:5',  arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',                 translation: 'For indeed, with hardship will be ease.',              relevanceScore: 0.91, reasoning: 'Promise of relief.' },
          { verseKey: '13:28', arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'In the remembrance of Allah do hearts find rest.',       relevanceScore: 0.88, reasoning: 'Foundation of peace.' },
        ];
      }

      store.setVerses(verses);
    } catch (err: any) {
      store.setError(err.message ?? 'Could not load verses');
      store.setStep('verses_shown');
    } finally {
      store.setLoading(false);
    }
  };

  const chooseVerse = (verseIndex: number) => {
    const verses = store.currentSession?.verses ?? [];
    const verse = verses[verseIndex];
    if (verse) store.selectVerse(verse);
  };

  const finishDhikr = () => {
    streakStore.recordActivity({ dhikrCount: 33 });
    store.completedhikr();
  };

  const saveReflection = (text: string) => {
    store.setReflection(text);
    store.completeSession();
  };

  const reset = () => {
    store.resetSession();
  };

  return {
    step: store.step,
    session: store.currentSession,
    sessionHistory: store.sessionHistory,
    isLoading: store.isLoading,
    error: store.error,
    begin,
    selectMood,
    submitContext,
    chooseVerse,
    finishDhikr,
    saveReflection,
    reset,
  };
}
