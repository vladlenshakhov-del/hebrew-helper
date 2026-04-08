import { useState, useCallback, useEffect } from 'react';

const FAVORITES_KEY = 'hebrew_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(new Set(JSON.parse(saved)));
      } catch {
        setFavorites(new Set());
      }
    }
    setIsLoaded(true);
  }, []);

  const toggleFavorite = useCallback((wordId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(wordId)) {
        newFavorites.delete(wordId);
      } else {
        newFavorites.add(wordId);
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((wordId: string) => favorites.has(wordId), [favorites]);

  return { favorites, toggleFavorite, isFavorite, isLoaded };
};
