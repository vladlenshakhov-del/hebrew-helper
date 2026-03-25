import { useState, useMemo } from 'react';
import { vocabulary, Category, categoryLabels } from '@/data/vocabulary';
import WordCard from '@/components/WordCard';
import WordListItem from '@/components/WordListItem';
import CategoryFilter from '@/components/CategoryFilter';
import { useTheme } from '@/components/ThemeProvider';
import { Search, LayoutGrid, List, Sun, Moon } from 'lucide-react';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const filtered = useMemo(() => {
    return vocabulary.filter((w) => {
      const matchCat = selectedCategory === 'all' || w.category === selectedCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        w.russian.toLowerCase().includes(q) ||
        w.hebrew.includes(q) ||
        w.transcription.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, search]);

  const grouped = useMemo(() => {
    if (selectedCategory !== 'all') return null;
    const groups: Partial<Record<Category, typeof filtered>> = {};
    filtered.forEach((w) => {
      if (!groups[w.category]) groups[w.category] = [];
      groups[w.category]!.push(w);
    });
    return groups;
  }, [filtered, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🇮🇱 Иврит
                <span className="font-hebrew text-xl text-primary" dir="rtl">עִבְרִית</span>
              </h1>
              <p className="text-sm text-muted-foreground">Повседневный и технический иврит — холодильное оборудование</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  title="Карточки"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  title="Список"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">{vocabulary.length}</span>
                <p className="text-xs text-muted-foreground">слов</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по русски, ивриту или транскрипции..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Categories */}
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {selectedCategory !== 'all' ? (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {categoryLabels[selectedCategory].icon} {categoryLabels[selectedCategory].ru}
              <span className="font-hebrew text-primary ml-2" dir="rtl">{categoryLabels[selectedCategory].he}</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">({filtered.length})</span>
            </h2>
            <div className={viewMode === 'cards' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
              {filtered.map((w) => (
                viewMode === 'cards' ? <WordCard key={w.id} word={w} /> : <WordListItem key={w.id} word={w} />
              ))}
            </div>
          </>
        ) : grouped ? (
          Object.entries(grouped).map(([cat, words]) => (
            <section key={cat} className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {categoryLabels[cat as Category].icon} {categoryLabels[cat as Category].ru}
                <span className="font-hebrew text-primary ml-2" dir="rtl">{categoryLabels[cat as Category].he}</span>
                <span className="text-sm font-normal text-muted-foreground ml-2">({words!.length})</span>
              </h2>
              <div className={viewMode === 'cards' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                {words!.map((w) => (
                  viewMode === 'cards' ? <WordCard key={w.id} word={w} /> : <WordListItem key={w.id} word={w} />
                ))}
              </div>
            </section>
          ))
        ) : null}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-muted-foreground">Ничего не найдено</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
