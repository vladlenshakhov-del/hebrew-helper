import { useState, useCallback, useMemo } from 'react';

export interface ReviewData {
  nextReview: number; // timestamp
  interval: number;   // days
}

type ReviewMap = Record<string, ReviewData>;

const STORAGE_KEY = 'hebrew-spaced-repetition';

function loadReviews(): ReviewMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveReviews(data: ReviewMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useSpacedRepetition() {
  const [reviews, setReviews] = useState<ReviewMap>(loadReviews);

  const setInterval = useCallback((wordId: string, days: number) => {
    setReviews(prev => {
      const next = {
        ...prev,
        [wordId]: {
          nextReview: Date.now() + days * 86400000,
          interval: days,
        },
      };
      saveReviews(next);
      return next;
    });
  }, []);

  const clearInterval = useCallback((wordId: string) => {
    setReviews(prev => {
      const next = { ...prev };
      delete next[wordId];
      saveReviews(next);
      return next;
    });
  }, []);

  const getReview = useCallback((wordId: string): ReviewData | undefined => {
    return reviews[wordId];
  }, [reviews]);

  const isDue = useCallback((wordId: string): boolean => {
    const review = reviews[wordId];
    if (!review) return true; // never reviewed = always show
    return Date.now() >= review.nextReview;
  }, [reviews]);

  const sortByPriority = useCallback(<T extends { id: string }>(words: T[]): T[] => {
    const now = Date.now();
    return [...words].sort((a, b) => {
      const ra = reviews[a.id];
      const rb = reviews[b.id];
      // Words without review come first
      if (!ra && rb) return -1;
      if (ra && !rb) return 1;
      if (!ra && !rb) return 0;
      // Due words come before not-due
      const aDue = now >= ra!.nextReview;
      const bDue = now >= rb!.nextReview;
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      // Among due: sort by how overdue
      if (aDue && bDue) return ra!.nextReview - rb!.nextReview;
      // Among not-due: sort by next review
      return ra!.nextReview - rb!.nextReview;
    });
  }, [reviews]);

  return { setInterval, clearInterval, getReview, isDue, sortByPriority, reviews };
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
