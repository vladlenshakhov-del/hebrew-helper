import { useState, useMemo, useCallback, useEffect, useRef, useDeferredValue } from 'react';
import { vocabulary, Category, categoryLabels } from '@/data/vocabulary';
import WordCard from '@/components/WordCard';
import WordListItem from '@/components/WordListItem';
import CategoryFilter from '@/components/CategoryFilter';
import { useTheme } from '@/components/ThemeProvider';
import { useSpacedRepetition, shuffleArray } from '@/hooks/useSpacedRepetition';
import { useFavorites } from '@/hooks/useFavorites';
import { Search, LayoutGrid, List, Sun, Moon, Shuffle, ArrowUpDown, Eye, EyeOff, Heart } from 'lucide-react';

const BINYANIM = ['Пааль', 'Пиэль', 'Хифиль', 'Нифаль', 'Пуаль', 'Хуфаль', 'Хитпаэль'] as const;

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const sr = useSpacedRepetition();
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHeaderVisible(y < 50 || y < lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedBinyan, setSelectedBinyan] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const itemsPerPage = viewMode === 'cards' ? 60 : 120;
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);

  const stripNiqqud = useCallback((s: string) => s.replace(/[\u0591-\u05C7]/g, ''), []);

  const { isDue, sortByPriority, getReview, setInterval: setSrInterval, clearInterval: clearSrInterval, reviews } = sr;

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [itemsPerPage, selectedCategory, search, isShuffled, shuffleKey, showDueOnly, showFavoritesOnly, selectedBinyan]);

  const filtered = useMemo(() => {
    return vocabulary.filter((w) => {
      const matchCat = selectedCategory === 'all' || w.category === selectedCategory;
      const q = deferredSearch.toLowerCase();
      const qClean = stripNiqqud(q);
      const matchSearch =
        !q ||
        w.russian.toLowerCase().includes(q) ||
        stripNiqqud(w.hebrew).includes(qClean) ||
        w.transcription.toLowerCase().includes(q);
      const matchBinyan = !selectedBinyan || w.binyan === selectedBinyan;
      const matchDue = !showDueOnly || isDue(w.id);
      const matchFavorites = !showFavoritesOnly || isFavorite(w.id);
      return matchCat && matchSearch && matchBinyan && matchDue && matchFavorites;
    });
  }, [selectedCategory, deferredSearch, selectedBinyan, showDueOnly, showFavoritesOnly, isDue, isFavorite, stripNiqqud]);

  const processed = useMemo(() => {
    let result = sortByPriority(filtered);
    if (isShuffled) {
      result = shuffleArray(result);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, isShuffled, shuffleKey, sortByPriority]);

  const visibleProcessed = useMemo(() => {
    return processed.slice(0, visibleCount);
  }, [processed, visibleCount]);

  const grouped = useMemo(() => {
    if (selectedCategory !== 'all') return null;
    const groups: Partial<Record<Category, typeof processed>> = {};
    visibleProcessed.forEach((w) => {
      if (!groups[w.category]) groups[w.category] = [];
      groups[w.category]!.push(w);
    });
    return groups;
  }, [visibleProcessed, selectedCategory]);

  const handleShuffle = useCallback(() => {
    setIsShuffled(true);
    setShuffleKey(k => k + 1);
  }, []);

  const renderWords = (words: typeof processed) => (
    <div className={viewMode === 'cards' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
      {words.map((w) => (
        viewMode === 'cards'
          ? <WordCard key={`${w.id}-${selectedCategory}-${viewMode}`} word={w} review={getReview(w.id)} onSetInterval={setSrInterval} onClearInterval={clearSrInterval} isFavorite={isFavorite(w.id)} onToggleFavorite={toggleFavorite} />
          : <WordListItem key={`${w.id}-${selectedCategory}-${viewMode}`} word={w} review={getReview(w.id)} onSetInterval={setSrInterval} onClearInterval={clearSrInterval} isFavorite={isFavorite(w.id)} onToggleFavorite={toggleFavorite} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`sticky z-10 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 ${headerVisible ? 'top-0' : '-top-[300px]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🇮🇱 Иврит
                <span className="font-hebrew text-xl text-primary" dir="rtl">עִבְרִית</span>
              </h1>
              <p className="text-sm text-muted-foreground">Повседневный и технический иврит</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors" title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}>
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button onClick={() => setViewMode('cards')} className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} title="Карточки">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} title="Список">
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">{vocabulary.length}</span>
                <p className="text-xs text-muted-foreground">слов</p>
              </div>
            </div>
          </div>

          {/* Search + controls */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по русски, ивриту или транскрипции..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={handleShuffle}
              className={`p-2.5 rounded-lg border border-border transition-colors ${isShuffled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              title="Перемешать"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsShuffled(false); }}
              className={`p-2.5 rounded-lg border border-border transition-colors ${!isShuffled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              title="По приоритету"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDueOnly(!showDueOnly)}
              className={`p-2.5 rounded-lg border border-border transition-colors ${showDueOnly ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              title={showDueOnly ? 'Показать все' : 'Только к повторению'}
            >
              {showDueOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`p-2.5 rounded-lg border border-border transition-colors ${showFavoritesOnly ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              title={showFavoritesOnly ? 'Показать все' : 'Только избранные'}
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Categories */}
          <CategoryFilter selected={selectedCategory} onSelect={(cat) => { setSelectedCategory(cat); setSelectedBinyan(null); }} />

          {/* Binyan filter for verbs */}
          {selectedCategory === 'verbs' && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                onClick={() => setSelectedBinyan(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  !selectedBinyan ? 'bg-foreground text-background border-foreground' : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                Все формы
              </button>
              {BINYANIM.map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBinyan(selectedBinyan === b ? null : b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedBinyan === b ? 'bg-category-verbs text-primary-foreground border-category-verbs' : 'bg-category-verbs/10 text-category-verbs border-category-verbs/30'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {selectedCategory !== 'all' ? (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {categoryLabels[selectedCategory].icon} {categoryLabels[selectedCategory].ru}
              <span className="font-hebrew text-primary ml-2" dir="rtl">{categoryLabels[selectedCategory].he}</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">({processed.length})</span>
            </h2>
            {renderWords(visibleProcessed)}
          </>
        ) : grouped ? (
          Object.entries(grouped).map(([cat, words]) => (
            <section key={cat} className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {categoryLabels[cat as Category].icon} {categoryLabels[cat as Category].ru}
                <span className="font-hebrew text-primary ml-2" dir="rtl">{categoryLabels[cat as Category].he}</span>
                <span className="text-sm font-normal text-muted-foreground ml-2">({words!.length})</span>
              </h2>
              {renderWords(words!)}
            </section>
          ))
        ) : null}

        {processed.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-muted-foreground">Ничего не найдено</p>
          </div>
        )}

        {processed.length > visibleCount && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount((count) => Math.min(count + itemsPerPage, processed.length))}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Показать ещё ({visibleCount} / {processed.length})
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
