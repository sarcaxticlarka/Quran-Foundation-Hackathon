import { useReviewStore } from '../stores/reviewStore';
import { QualityRating } from '../utils/sm2Algorithm';

export function useReview() {
  const store = useReviewStore();

  const beginSession = () => {
    store.startSession();
  };

  const rateCard = (quality: QualityRating) => {
    store.submitReview(quality);
    const sessionCards = store.getSessionCards();
    if (store.currentCardIndex >= sessionCards.length) {
      store.completeSession();
    }
  };

  const addVerse = (verseKey: string) => {
    store.addCard(verseKey);
  };

  const sessionProgress = (): number => {
    const total = store.getSessionCards().length;
    if (total === 0) return 0;
    return Math.min(100, Math.round((store.currentCardIndex / total) * 100));
  };

  const isSessionComplete = (): boolean => {
    return (
      !!store.currentSession?.isComplete ||
      store.currentCardIndex >= store.getSessionCards().length
    );
  };

  return {
    cards: store.cards,
    currentCard: store.getCurrentCard(),
    currentSession: store.currentSession,
    dueCount: store.getDueCount(),
    retention: store.getRetention(),
    todayReviewed: store.todayReviewed,
    totalReviewed: store.totalReviewed,
    sessionProgress: sessionProgress(),
    isSessionComplete: isSessionComplete(),
    beginSession,
    rateCard,
    addVerse,
    importVerses: store.importCards,
  };
}
