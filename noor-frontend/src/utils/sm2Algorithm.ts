/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the original SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality ratings:
 *   0 - Complete blackout, wrong response
 *   1 - Incorrect response; correct was easy to recall
 *   2 - Incorrect response; correct was remembered upon seeing
 *   3 - Correct response recalled with serious difficulty
 *   4 - Correct response after hesitation
 *   5 - Perfect response
 */

export interface ReviewCard {
  verseKey: string;
  repetitions: number;
  easeFactor: number; // starts at 2.5
  interval: number;   // days until next review
  nextReview: Date | string;
  lastReviewed: Date | string | null;
}

function toDate(d: Date | string | null | undefined): Date {
  if (!d) return new Date(0);
  return d instanceof Date ? d : new Date(d);
}

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

export function createCard(verseKey: string): ReviewCard {
  return {
    verseKey,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 1,
    nextReview: new Date(),
    lastReviewed: null,
  };
}

export function calculateNextReview(card: ReviewCard, quality: QualityRating): ReviewCard {
  let { repetitions, easeFactor, interval } = card;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (EF')
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    repetitions,
    easeFactor,
    interval,
    nextReview,
    lastReviewed: new Date(),
  };
}

export function isDue(card: ReviewCard): boolean {
  return new Date() >= toDate(card.nextReview);
}

export function getDueCards(cards: ReviewCard[]): ReviewCard[] {
  return cards.filter(isDue).sort((a, b) => toDate(a.nextReview).getTime() - toDate(b.nextReview).getTime());
}

export function getRetentionRate(cards: ReviewCard[]): number {
  if (cards.length === 0) return 0;
  const mastered = cards.filter((c) => c.repetitions >= 3 && c.easeFactor > 2.0);
  return Math.round((mastered.length / cards.length) * 100);
}

export function formatInterval(days: number): string {
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(days / 30);
  return `In ${months} month${months > 1 ? 's' : ''}`;
}

export function getCardStrength(card: ReviewCard): 'new' | 'learning' | 'young' | 'mature' {
  if (card.repetitions === 0) return 'new';
  if (card.repetitions <= 1) return 'learning';
  if (card.interval < 21) return 'young';
  return 'mature';
}
